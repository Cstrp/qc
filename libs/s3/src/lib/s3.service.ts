import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    DeleteObjectCommand,
    DeleteObjectsCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    NoSuchKey,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';

import { type File } from '@nest-lab/fastify-multer';
import * as crypto from 'crypto';
import { Readable } from 'stream';
import * as mime from 'mime-types';
import { extname } from 'node:path';

@Injectable()
export class S3Service implements OnModuleInit {
    private readonly logger = new Logger(S3Service.name);
    private s3Client: S3Client | null = null;
    private bucket: string | null = null;
    private readonly defaultUploadPrefix = 'files';

    constructor(private readonly configService: ConfigService) {}

    public async onModuleInit(): Promise<void> {
        this.s3Client = new S3Client({
            endpoint: this.configService.get<string>('S3_ENDPOINT'),
            region: this.configService.get<string>('AWS_REGION') ?? 'eu-central-1',
            credentials: {
                accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') ?? 'minioadmin',
                secretAccessKey:
                    this.configService.get<string>('AWS_SECRET_ACCESS_KEY') ?? 'minioadmin123',
            },
            forcePathStyle: true,
        });
        this.bucket = this.configService.get<string>('S3_BUCKET') ?? 'assistant';

        // await this.deleteAllFiles();
        this.logger.log(`S3 client initialized with bucket: ${this.bucket}`);
    }

    public async getFile(key: string): Promise<Readable> {
        try {
            if (!this.s3Client || !this.bucket) {
                throw new Error('S3 client or bucket is not initialized');
            }

            const { Body } = await this.s3Client.send(
                new GetObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                }),
            );

            if (!Body) {
                this.logger.error(`File body is empty for key: ${key}`);
                throw new Error('File body is empty');
            }

            return Body as Readable;
        } catch (error) {
            const err = error as Error;
            this.logger.error(`Failed to get file from S3: ${err.message}`, err.stack);
            throw error;
        }
    }

    public async getFileAsBuffer(key: string): Promise<Buffer | null> {
        try {
            if (!this.s3Client || !this.bucket) {
                throw new Error('S3 client or bucket is not initialized');
            }

            const { Body } = await this.s3Client.send(
                new GetObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                }),
            );

            if (!Body) {
                this.logger.warn(`File body is empty for key: ${key}. Returning empty buffer.`);
                return Buffer.alloc(0);
            }

            const byteArray = await Body.transformToByteArray();
            return Buffer.from(byteArray);
        } catch (error) {
            if (error instanceof NoSuchKey) {
                this.logger.warn(`File not found in S3 with key: ${key}`);
                return null; // Return null to indicate "not found"
            }

            const err = error as Error;
            this.logger.error(
                `Failed to get file as buffer from S3 for key "${key}": ${err.message}`,
                err.stack,
            );
            throw error;
        }
    }

    public async uploadFile(file: File, prefix = this.defaultUploadPrefix): Promise<string> {
        try {
            if (!this.s3Client || !this.bucket) {
                throw new Error('S3 client or bucket is not initialized');
            }

            const fileExtension = extname(file.originalname).toLowerCase();

            if (!fileExtension) {
                throw new Error('File name must have an extension');
            }

            const key = `${prefix}/${crypto.randomUUID()}${fileExtension}`;

            const res = await this.s3Client.send(
                new PutObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                    Body: file.buffer,
                    ContentType: file.mimetype || this.getMimeType(fileExtension || ''),
                }),
            );

            this.logger.log(`File uploaded successfully to S3: ${key}`);
            return key;
        } catch (error) {
            const err = error as Error;
            this.logger.error(`Failed to upload file to S3: ${err.message}`, err.stack);
            throw error;
        }
    }

    public async deleteFile(key: string): Promise<void> {
        try {
            if (!this.s3Client || !this.bucket) {
                throw new Error('S3 client or bucket is not initialized');
            }

            await this.s3Client.send(
                new DeleteObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                }),
            );
            this.logger.log(`File deleted successfully from S3: ${key}`);
        } catch (error) {
            const err = error as Error;
            this.logger.error(`Failed to delete file from S3: ${err.message}`, err.stack);
            throw error;
        }
    }

    public async deleteAllFiles(): Promise<void> {
        try {
            if (!this.s3Client || !this.bucket) {
                throw new Error('S3 client or bucket is not initialized');
            }

            const listObjectsV2Command = new ListObjectsV2Command({
                Bucket: this.bucket,
                Prefix: this.defaultUploadPrefix,
            });

            const { Contents } = await this.s3Client.send(listObjectsV2Command);

            if (!Contents) {
                this.logger.warn('No files found in S3');
                return;
            }

            const deleteObjectsCommand = new DeleteObjectsCommand({
                Bucket: this.bucket,
                Delete: {
                    Objects: Contents.map(({ Key }) => ({ Key })),
                },
            });

            await this.s3Client.send(deleteObjectsCommand);

            this.logger.log(`Deleted ${Contents.length} files from S3`);
        } catch (error) {
            const err = error as Error;
            this.logger.error(`Failed to delete all files from S3: ${err.message}`, err.stack);
            throw error;
        }
    }

    private getMimeType(extension: string): string {
        const mimeType = mime.lookup(extension);
        return mimeType ? mimeType.toString() : 'application/octet-stream';
    }
}
