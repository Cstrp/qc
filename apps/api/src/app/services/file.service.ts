import {
    Inject,
    Injectable,
    Logger,
    NotFoundException,
    OnModuleDestroy,
    OnModuleInit,
    StreamableFile,
} from '@nestjs/common';
import { KAFKA_OPTIONS } from '@assistant/kafka';
import { type File } from '@nest-lab/fastify-multer';
import {
    FileIdNameDto,
    FileListResponseDto,
    FileResponseDto,
    FileService as PrismaFileService,
    FileUploadedDto,
    FileUploadResponseDto,
} from '@assistant/prisma';
import { S3Service } from '@assistant/s3';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FileService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(FileService.name);

    constructor(
        private readonly prismaFileService: PrismaFileService,
        private readonly s3Service: S3Service,
        @Inject(KAFKA_OPTIONS.SERVICE_INJECTION_TOKEN) private readonly kafkaClient: ClientKafka,
    ) {}

    async onModuleInit() {
        this.kafkaClient.subscribeToResponseOf(KAFKA_OPTIONS.TOPIC);

        await this.kafkaClient.connect();
    }

    async onModuleDestroy() {
        await this.kafkaClient.close();
    }

    /**
     * Get all files for a specific company
     * @param companyId Company ID
     * @returns List of files
     */
    async getAllFiles(companyId: string): Promise<FileListResponseDto> {
        const files =
            await this.prismaFileService.getFilesByCompanyIdWithKnowledgeBaseCount(companyId);

        const filesList = files.map((file) => ({
            id: file.id,
            name: file.name,
            size: file.size,
            createdAt: file.createdAt,
            knowledgeBaseCount: file.knowledgeBaseCount,
        }));

        return { files: filesList };
    }

    /**
     * Upload a file
     * @param file File to upload
     * @param companyId Company ID
     * @returns Uploaded file information
     */
    async uploadFile(file: File, companyId: string): Promise<FileUploadResponseDto> {
        console.log('test');
        const storageKey = await this.s3Service.uploadFile(file);

        this.logger.verbose(`File upload: ${storageKey}`);

        const fileRecord = await this.prismaFileService.createFile({
            name: file.originalname,
            mimeType: file.mimetype,
            size: file.size ?? 0,
            storageKey,
            companyId,
            status: 'PENDING',
        });

        this.logger.log(`File uploaded: ${fileRecord.id}`);

        const payload: FileUploadedDto = {
            fileId: fileRecord.id,
        };

        this.logger.log(
            `🚀 Sending message to topic ${KAFKA_OPTIONS.TOPIC}. Record: ${JSON.stringify(
                payload,
            )}`,
        );

        const result = await firstValueFrom(this.kafkaClient.send(KAFKA_OPTIONS.TOPIC, payload));

        this.logger.log(`✅ File processing result: ${JSON.stringify(result)}`);

        if (result.status === 'FAILED') {
            await this.prismaFileService.updateFileStatus(fileRecord.id, 'FAILED');
            throw new Error(result.error || 'File processing failed');
        }

        const updatedFile = await this.prismaFileService.getFileById(fileRecord.id, companyId);

        return {
            file: updatedFile as FileResponseDto,
        };
    }

    /**
     * Get a file by ID
     * @param id File ID
     * @returns Streamable file
     */
    async getFile(id: string, companyId: string): Promise<StreamableFile> {
        const file = await this.prismaFileService.getFileById(id, companyId);

        if (!file) {
            throw new NotFoundException(`File with ID ${id} not found`);
        }

        const fileStream = await this.s3Service.getFile(file.storageKey);

        return new StreamableFile(fileStream, {
            type: file.mimeType,
            disposition: `attachment; filename="${file.name}"`,
        });
    }

    /**
     * Delete a file
     * @param id File ID
     * @returns Deleted file information
     */
    async deleteFile(id: string, companyId: string): Promise<FileResponseDto> {
        const file = await this.prismaFileService.getFileById(id, companyId);
        if (!file) {
            throw new NotFoundException(`File with ID ${id} not found`);
        }

        await this.s3Service.deleteFile(file.storageKey);

        const deletedFile = await this.prismaFileService.deleteFile(id, companyId);

        return deletedFile as FileResponseDto;
    }

    /**
     * Get only id and name of all files for a company
     * @param companyId Company ID
     * @returns List of files with only id and name
     */
    async getFileIdsAndNames(companyId: string): Promise<FileIdNameDto[]> {
        return await this.prismaFileService.getFileIdsAndNamesByCompanyId(companyId);
    }
}
