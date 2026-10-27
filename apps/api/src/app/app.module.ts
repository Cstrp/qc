import { KafkaModule } from '@assistant/kafka';
import { LangchainModule } from '@assistant/langchain';
import { PrismaModule } from '@assistant/prisma';
import { SharedModule } from '@assistant/shared';
import { S3Module } from '@assistant/s3';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
    BotController,
    ChatsController,
    FilesController,
    HealthController,
    KnowledgeBaseControllers,
    StatisticsController,
} from './controllers';
import {
    BotService,
    ChatService,
    FileService,
    HealthSerivce,
    KnowledgeBaseService,
    StatisticsService,
} from './services';

@Module({
    imports: [
        ConfigModule.forRoot(),
        PrismaModule,
        LangchainModule,
        KafkaModule,
        SharedModule,
        S3Module,
    ],
    controllers: [
        HealthController,
        BotController,
        KnowledgeBaseControllers,
        ChatsController,
        FilesController,
        StatisticsController,
    ],
    providers: [
        HealthSerivce,
        BotService,
        KnowledgeBaseService,
        ChatService,
        FileService,
        StatisticsService,
    ],
})
export class AppModule {}
