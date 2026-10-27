import {
    PrismaSqlFilter,
    PrismaVectorStore as VectorStore,
} from '@langchain/community/vectorstores/prisma';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { OpenAIEmbeddings, OpenAIEmbeddingsParams } from '@langchain/openai';
import { Embeddings, Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { ConfigService } from '@nestjs/config';

type PVS = VectorStore<Embeddings, 'embeddings', any, PrismaSqlFilter<Embeddings>>;

@Injectable()
export class PrismaVectorStore implements OnModuleInit, OnModuleDestroy {
    private readonly logger: Logger = new Logger(PrismaVectorStore.name);

    private _store: PVS | null = null;

    constructor(private readonly cfg: ConfigService, private readonly prisma: PrismaService) {}

    public async onModuleInit(): Promise<void> {
        await this.initializeStoreWithRetry();
    }

    public async onModuleDestroy(): Promise<void> {
        this._store = null;
    }

    public get store(): PVS {
        if (!this._store) {
            throw new Error('Vector store not initialized. Call onModuleInit() first');
        }

        return this._store;
    }

    private async initializeStoreWithRetry(maxRetries = 3): Promise<void> {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.logger.debug(
                    `🔄 Initializing vector store... (attempt ${attempt}/${maxRetries})`,
                );
                this._store = await this.initStore();

                this.logger.debug(
                    `✅ Vector store initialized successfully in ${attempt} attempts`,
                );
                return;
            } catch (error) {
                this.logger.warn(
                    `Store initialization attempt ${attempt}/${maxRetries} failed: ${error}`,
                );

                if (attempt === maxRetries) {
                    throw new Error(
                        `Failed to initialize store after ${maxRetries} attempts: ${error}`,
                    );
                }

                await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
            }
        }
    }

    private async initStore(): Promise<PVS> {
        return VectorStore.withModel<Embeddings>(this.prisma).create(this.getEmbeddingClient(), {
            prisma: Prisma,
            tableName: 'embeddings' as 'Embeddings',
            vectorColumnName: 'embeddings',
            columns: {
                id: VectorStore.IdColumn,
                content: VectorStore.ContentColumn,
            },
        });
    }

    private getEmbeddingClient(options?: Partial<OpenAIEmbeddingsParams>): OpenAIEmbeddings {
        const openAIApiKey = this.cfg.get<string>('OPENAI_API_KEY');
        const model = this.cfg.get<string>('OPENAI_EMBEDDING_MODEL');

        if (!openAIApiKey || !model) {
            throw new Error(
                'OpenAI API key or model name not provided. Please check your .env file',
            );
        }

        return new OpenAIEmbeddings({
            openAIApiKey,
            model,
            ...options,
        });
    }
}
