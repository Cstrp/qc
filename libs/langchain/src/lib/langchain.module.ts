import { PrismaModule } from '@assistant/prisma';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LangchainService } from './langchain.service';
import { OpenAIService } from './openai/openai.service';

@Module({
    imports: [ConfigModule.forRoot(), PrismaModule],
    providers: [OpenAIService, LangchainService],
    exports: [OpenAIService, LangchainService],
})
export class LangchainModule {}
