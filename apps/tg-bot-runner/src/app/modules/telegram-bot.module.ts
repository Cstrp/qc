import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@assistant/prisma';
import { LangchainModule } from '@assistant/langchain';
import { BotLifecycleService } from '../services/bot-lifecycle.service';
import { BotMessageService } from '../services/bot-message.service';
import { BotStatusService } from '../services/bot-status.service';
import { BotStatusController } from '../controllers/bot-status.controller';

@Module({
    imports: [
        ConfigModule,
        PrismaModule,
        LangchainModule
    ],
    controllers: [BotStatusController],
    providers: [BotLifecycleService, BotMessageService, BotStatusService],
    exports: [BotLifecycleService, BotMessageService],
})
export class TelegramBotModule {}
