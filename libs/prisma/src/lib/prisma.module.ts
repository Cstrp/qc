import { Module } from '@nestjs/common';
import { S3Module } from '@assistant/s3';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { ChatService, FileService, KnowledgeBaseService, TelegramService } from './services';
import { PrismaVectorStore } from './prisma-vector-store';

@Module({
    imports: [ConfigModule.forRoot(), S3Module],
    providers: [PrismaService, TelegramService, FileService, ChatService, KnowledgeBaseService, PrismaVectorStore],
    exports: [PrismaService, TelegramService, FileService, ChatService, KnowledgeBaseService, PrismaVectorStore],
})
export class PrismaModule {}
