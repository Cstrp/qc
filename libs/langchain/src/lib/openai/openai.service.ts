import { ChatOpenAI } from '@langchain/openai';
import { PrismaVectorStore } from '@assistant/prisma';
import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { LangchainService } from '../langchain.service';

type CompletionParams = {
    messageText: string;
    fileIds: string[];
    history: string;
};

@Injectable()
export class OpenAIService implements OnModuleInit {
    private readonly logger: Logger = new Logger(OpenAIService.name);
    private _client: ChatOpenAI | null = null;

    constructor(
        private readonly prismaVectorStore: PrismaVectorStore,
        private readonly langchain: LangchainService,
        private readonly cfg: ConfigService,
    ) {}

    public onModuleInit() {
        this._client = this.init();
    }

    private validateInputParams(messageText: string): boolean {
        if (!messageText) {
            throw new BadRequestException('Query is required');
        }

        if (!this._client) {
            throw new BadRequestException('OpenAI client is not initialized');
        }

        return true;
    }

    private handleEmptyFiles(fileIds: string[]): string | null {
        if (!fileIds.length) {
            this.logger.warn(`No files in context found`);
            return 'Загрузите хотя бы один документ, чтобы я мог помочь.';
        }

        return null;
    }

 
    private createRetriever(fileIds: string[]) {
        return this.prismaVectorStore.store.asRetriever({
            verbose: true,
            filter: { file_id: { in: fileIds } },
            k: 10,
        });
    }

    public async createCompletion({ messageText, fileIds, history }: CompletionParams) {
        this.validateInputParams(messageText);

        const emptyFilesMessage = this.handleEmptyFiles(fileIds);
        if (emptyFilesMessage) {
            return emptyFilesMessage;
        }

        const retriever = this.createRetriever(fileIds);
        const chain = await this.langchain.makeChain(this._client!, retriever);
        const chunks = await chain.invoke({
            question: messageText,
            chat_history: history,
        });

        let result = '';

        for await (const chunk of chunks) {
            result += chunk;
        }

        return result || "I couldn't find an answer. Please try again.";
    }

    public createStreamCompletion({
        messageText,
        fileIds,
        history,
    }: CompletionParams): Observable<string> {
        return new Observable((subscriber) => {
            (async () => {
                try {
                    this.validateInputParams(messageText);

                    const emptyFilesMessage = this.handleEmptyFiles(fileIds);
                    if (emptyFilesMessage) {
                        subscriber.next(emptyFilesMessage);
                        subscriber.complete();
                        return;
                    }

                    const retriever = this.createRetriever(fileIds);
                    const chain = await this.langchain.makeChain(this._client!, retriever);
                    const stream: AsyncIterable<unknown> = await chain.stream({
                        question: messageText,
                        chat_history: history,
                    });

                    const iterator = (stream as any)[Symbol.asyncIterator]?.();
                    if (iterator?.return) {
                        subscriber.add(() => {
                            try {
                                iterator.return();
                            } catch (e) {
                                this.logger.warn(`Stream teardown warning: ${e}`);
                            }
                        });
                    }

                    for await (const chunk of stream as AsyncIterable<any>) {
                        const text = typeof chunk === 'string' ? chunk : String(chunk ?? '');
                        subscriber.next(text);
                    }

                    subscriber.complete();
                } catch (error) {
                    this.logger.error(`Error in createStreamCompletion: ${error}`);
                    subscriber.error(error);
                }
            })();
        });
    }

    public async generateChatTitle(messageText: string): Promise<string> {
        const apiKey = this.cfg.get<string>('OPENAI_API_KEY');
        const model = this.cfg.get<string>('OPENAI_SUMMARIZATION_MODEL') || 'gpt-3.5-turbo';

        if (!apiKey) {
            this.logger.error('OpenAI API key not configured');
            return this.generateFallbackTitle(messageText);
        }

        const client = new ChatOpenAI({
            apiKey,
            temperature: 0.3,
            model,
            maxTokens: 50,
        });

        try {
            const response = await client.invoke([
                {
                    role: 'system',
                    content:
                        'Generate a concise, descriptive title (maximum 30 characters) for a chat based on the first message. The title should capture the main topic or question.',
                },
                {
                    role: 'user',
                    content: messageText,
                },
            ]);

            const title = response.content.toString().trim();
            this.logger.debug(`Generated chat title: ${title}`);
            return title;
        } catch (error) {
            this.logger.error(`Error in generateChatTitle: ${error}`);
            return this.generateFallbackTitle(messageText);
        }
    }

    private generateFallbackTitle(messageText: string): string {
        const firstSentence = messageText.split(/[.!?]/, 1)[0].trim();

        if (firstSentence.length <= 30) {
            return firstSentence;
        }

        return firstSentence.substring(0, 27) + '...';
    }

    private init(): ChatOpenAI {
        const apiKey = this.cfg.get<string>('OPENAI_API_KEY');
        const model = this.cfg.get<string>('OPENAI_MODEL_NAME');
        const temperature = this.cfg.get<number>('OPENAI_TEMPERATURE');

        if (!apiKey || !model || !temperature) {
            this.logger.error('OpenAI API key or model name is not set.');
            throw new Error('OpenAI API key or model name is not set.');
        }

        return new ChatOpenAI({
            apiKey,
            model,
            temperature: +temperature,
            streaming: true,
        });
    }
}
