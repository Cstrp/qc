import { Injectable, Logger } from '@nestjs/common';
import { File, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { FileIdNameDto } from '../dto';

export interface FileWithKnowledgeBaseCount extends File {
    knowledgeBaseCount: number;
}

@Injectable()
export class FileService {
    private readonly logger = new Logger(FileService.name);

    constructor(private readonly prisma: PrismaService) {}

    /**
     * Create a new file record in the database
     * @param data File data
     * @returns The created file
     */
    async createFile(data: Prisma.FileCreateInput): Promise<File> {
        this.logger.log(`Creating file: ${data.name}`);
        return this.prisma.file.create({
            data,
        });
    }

    /**
     * Get a file by ID
     * @param id File ID
     * @returns The file or null if not found
     */
    async getFileById(id: string, companyId: string): Promise<File | null> {
        return this.prisma.file.findUnique({
            where: { id, companyId },
        });
    }

    /**
     * Get files by company ID with knowledge base count
     * @param companyId Company ID
     * @returns Array of files with knowledge base count
     */
    async getFilesByCompanyIdWithKnowledgeBaseCount(
        companyId: string,
    ): Promise<FileWithKnowledgeBaseCount[]> {
        this.logger.verbose(`Getting files for company ${companyId} with knowledge base count`);

        const files = await this.prisma.file.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        knowledgeBases: true,
                    },
                },
            },
        });

        return files.map((file) => ({
            ...file,
            knowledgeBaseCount: file._count.knowledgeBases,
            _count: undefined,
        }));
    }

    /**
     * Update a file's status
     * @param id File ID
     * @param status New status
     * @returns The updated file
     */
    async updateFileStatus(
        id: string,
        status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
    ): Promise<File> {
        return this.prisma.file.update({
            where: { id },
            data: { status },
        });
    }

    /**
     * Delete a file
     * @param id File ID
     * @returns The deleted file
     */
    async deleteFile(id: string, companyId: string): Promise<File> {
        return this.prisma.file.delete({
            where: { id, companyId },
        });
    }

    /**
     * Get all files with the count of associated knowledge bases
     * @returns Array of files with knowledge base count
     */
    async getAllFiles(): Promise<FileWithKnowledgeBaseCount[]> {
        this.logger.log('Getting all files with knowledge base count');

        const files = await this.prisma.file.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return await Promise.all(
            files.map(async (file) => {
                const knowledgeBaseCount = await this.prisma.knowledgeBaseFile.count({
                    where: { fileId: file.id },
                });

                return {
                    ...file,
                    knowledgeBaseCount,
                };
            }),
        );
    }

    /**
     * Get only id and name of all files for a company
     * @param companyId Company ID
     * @returns Array of files with only id and name
     */
    async getFileIdsAndNamesByCompanyId(companyId: string): Promise<FileIdNameDto[]> {
        this.logger.log(`Getting file ids and names for company ${companyId}`);

        return this.prisma.file.findMany({
            where: { companyId },
            select: {
                id: true,
                name: true,
                size: true,
            },
            orderBy: { name: 'asc' },
        });
    }
}
