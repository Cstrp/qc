import { PrismaModule } from '@assistant/prisma';
import { Module } from '@nestjs/common';
import { LangchainService } from '../langchain.service';
import { OpenAIService } from './openai.service';

@Module({
    imports: [PrismaModule],
    providers: [OpenAIService, LangchainService],
    exports: [OpenAIService],
})
export class OpenAIModule {}
