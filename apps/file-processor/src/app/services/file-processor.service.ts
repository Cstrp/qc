import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, PrismaVectorStore } from '@assistant/prisma';
import { S3Service } from '@assistant/s3';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { Document } from '@langchain/core/documents';
import { Blob } from 'node:buffer';
import { generateHash, measureExecTime, sleep } from '@assistant/shared';
import { Embeddings, File } from '@prisma/client';
import { JSONLoader } from 'langchain/document_loaders/fs/json';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { extname } from 'path';

@Injectable()
export class FileProcessorService {
    private readonly logger = new Logger(FileProcessorService.name);

    private readonly BATCH_SIZE = 20;
    private readonly MAX_CONCURRENT = 5;

    constructor(
        private readonly prisma: PrismaService,
        private readonly s3Service: S3Service,
        private readonly vectorStore: PrismaVectorStore,
    ) {}

    public async processFile(fileId: string): Promise<void> {
        try {
            await this.updateFileStatus(fileId, 'PROCESSING');

            const existingFile = await this.prisma.file.findUnique({
                where: { id: fileId },
            });

            if (!existingFile) {
                throw new Error('File for processing does not exist');
            }

            await measureExecTime(async () => {
                this.logger.debug(`Starting processing for file: ${existingFile.storageKey}`);
                try {
                    const rawDocuments = await this.loadDocumentsWithRetry(existingFile);

                    if (!rawDocuments?.length) {
                        this.logger.warn('No documents found to process');
                        await this.updateFileStatus(fileId, 'FAILED');
                        return;
                    }

                    await this.processDocuments(rawDocuments, existingFile);
                    await this.updateFileStatus(fileId, 'COMPLETED');
                    this.logger.verbose(`Successfully processed ${rawDocuments.length} documents`);
                } catch (error) {
                    this.logger.error('Critical error during processing:', error);
                    await this.updateFileStatus(fileId, 'FAILED');
                    throw new Error(`Processing failed: ${error}`);
                }
            }, 'File processing');
        } catch (error) {
            this.logger.error(`Error processing file: ${error.message}`, error.stack);
            await this.updateFileStatus(fileId, 'FAILED');
        }
    }

    private async updateFileStatus(
        fileId: string,
        status: 'PROCESSING' | 'COMPLETED' | 'FAILED',
    ): Promise<void> {
        try {
            await this.prisma.file.update({
                where: { id: fileId },
                data: { status },
            });
            this.logger.log(`File status updated to ${status}: ${fileId}`);
        } catch (error) {
            this.logger.error(`Failed to update file status: ${error.message}`, error.stack);
        }
    }

    private getLoaderByExtension(extension: string, fileBlob: Blob) {
        const loaders: Record<string, () => PDFLoader | DocxLoader | JSONLoader | TextLoader> = {
            '.pdf': () => new PDFLoader(fileBlob, { parsedItemSeparator: '' }),
            '.docx': () => new DocxLoader(fileBlob),
            '.doc': () => new DocxLoader(fileBlob, { type: 'doc' }),
            '.txt': () => new TextLoader(fileBlob),
        };

        const loaderFactory = loaders[extension];

        if (!loaderFactory) {
            throw new Error(`Unsupported file type: ${extension}`);
        }

        return loaderFactory();
    }

    private async loadDocumentsWithRetry(file: File, retries = 3): Promise<Document[]> {
        const fileBuffer = await this.s3Service.getFileAsBuffer(file.storageKey);

        if (!fileBuffer) {
            throw new Error(`File not found in S3: ${file.storageKey}`);
        }

        const fileBlob = new Blob([fileBuffer], { type: file.mimeType });

        const extension = extname(file.name).toLowerCase();

        const loader = this.getLoaderByExtension(extension, fileBlob);

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const rawDocuments = await loader.load();

                const splitter = new RecursiveCharacterTextSplitter({
                    chunkSize: 1200,
                    chunkOverlap: 200,
                    separators: ['\n\n', '\n', '. ', '! ', '? ', ' ', ''],
                });

                const documents = await splitter.splitDocuments(rawDocuments);

                this.logger.debug(`Loaded and split ${documents.length} file id: ${file.id}`);

                return documents;
            } catch (error) {
                this.logger.warn(
                    `Attempt ${attempt}/${retries} failed to load documents: ${error}`,
                );

                if (attempt === retries) {
                    throw new Error(`Failed to load documents after ${retries} attempts: ${error}`);
                }

                await sleep(1000 * attempt);
            }
        }
        return [];
    }

    private async processDocuments(documents: Document[], existingFile: File): Promise<void> {
        const preparedDocs = this.prepareDocuments(documents, existingFile);

        for (let i = 0; i < preparedDocs.length; i += this.BATCH_SIZE) {
            const batch = preparedDocs.slice(i, i + this.BATCH_SIZE);
            await this.processBatchWithRetry(batch, 3, existingFile);
        }
    }

    private prepareDocuments(
        documents: Document[],
        existingFile?: File,
    ): Array<{
        content: string;
        metadata: Record<string, any>;
        checksum: string;
    }> {
        return documents
            .map((doc) => ({
                content: doc.pageContent.trim(),
                metadata: {
                    ...doc.metadata,
                    source: existingFile?.name ?? 'unknown',
                    processedAt: new Date().toISOString(),
                    documentLength: doc.pageContent.length,
                },
                checksum: generateHash(doc.pageContent),
            }))
            .filter((doc) => doc.content.length > 0);
    }

    private async processBatchWithRetry(
        batch: ReturnType<typeof this.prepareDocuments>,
        retries = 3,
        existingFile: File,
    ): Promise<void> {
        if (!batch.length) return;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                let newRecords: Embeddings[] = [];

                await this.prisma.$transaction(async (tx) => {
                    const docsToIndex = batch.map((doc) => ({
                        ...doc,
                        fileId: existingFile.id,
                    }));

                    if (!docsToIndex.length) {
                        this.logger.debug('No documents to store in this batch');
                        return;
                    }

                    const created = await tx.embeddings.createMany({
                        data: docsToIndex,
                        skipDuplicates: false,
                    });

                    newRecords = await tx.embeddings.findMany({
                        where: {
                            checksum: {
                                in: docsToIndex.map((doc: { checksum: string }) => doc.checksum),
                            },
                        },
                    });

                    this.logger.debug(`Batch stored ${created.count} documents`);
                });

                if (newRecords.length > 0) {
                    await this.updateVectorStoreWithConcurrency(newRecords);
                    this.logger.debug(`Vector store updated with ${newRecords.length} records`);
                }

                return;
            } catch (error) {
                this.logger.warn(`Batch processing attempt ${attempt}/${retries} failed: ${error}`);
                if (attempt === retries) {
                    throw new Error(`Failed to process batch after ${retries} attempts: ${error}`);
                }
                await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
            }
        }
    }

    private async updateVectorStoreWithConcurrency(documents: Embeddings[]): Promise<void> {
        try {
            const chunks = this.chunkArray(documents, this.MAX_CONCURRENT);

            await Promise.all(
                chunks.map(async (chunk, index) => {
                    try {
                        await this.vectorStore.store.addModels(chunk);
                        this.logger.debug(
                            `Vector store chunk ${index + 1}/${chunks.length} updated successfully`,
                        );
                    } catch (chunkError) {
                        this.logger.error(
                            `Failed to update vector store chunk ${index + 1}: ${chunkError}`,
                        );
                        throw chunkError;
                    }
                }),
            );
        } catch (error) {
            this.logger.error('Failed to update vector store:', error);
            throw new Error(`Vector store update failed: ${error}`);
        }
    }

    private chunkArray<T>(array: T[], size: number): T[][] {
        const result = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    }
}
