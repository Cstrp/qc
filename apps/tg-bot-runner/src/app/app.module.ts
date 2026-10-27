import { KafkaModule } from '@assistant/kafka';
import { LangchainModule } from '@assistant/langchain';
import { PrismaModule } from '@assistant/prisma';
import { SharedModule } from '@assistant/shared';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramBotModule } from './modules/telegram-bot.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    LangchainModule,
    KafkaModule,
    SharedModule,
    TelegramBotModule,
  ],
})
export class AppModule {}
