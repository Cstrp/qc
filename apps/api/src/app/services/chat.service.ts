import { Injectable, Logger } from '@nestjs/common';
import {
    ChatService as PrismaChatService,
    CreateChatMessageWithRoleDto,
    MessageRole,
} from '@assistant/prisma';
import { OpenAIService } from '@assistant/langchain';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    constructor(
        private readonly prismaChatService: PrismaChatService,
        private readonly openAIService: OpenAIService,
    ) {}

    /**
     * Get a chat by ID
     * @param chatId Chat ID
     * @returns Chat with messages
     */
    async getChatById(chatId: string, companyId: string) {
        return this.prismaChatService.getChatById(chatId, companyId);
    }

    /**
     * Delete a chat
     * @param chatId Chat ID
     */
    async deleteChat(chatId: string, companyId: string) {
        return this.prismaChatService.deleteChat(chatId, companyId);
    }

    /**
     * Get all messages for a chat
     * @param chatId Chat ID
     * @returns List of messages
     */
    async getChatMessages(chatId: string, companyId: string) {
        return this.prismaChatService.getAllChatMessages(chatId, companyId);
    }

    /**
     * Add a message to a chat
     * @param chatId Chat ID
     * @param companyId Company ID
     * @param data Message data
     * @returns Created message
     */
    async addMessageToChat(chatId: string, companyId: string, data: CreateChatMessageWithRoleDto) {
        return this.prismaChatService.addMessageToChat(chatId, companyId, data);
    }

    /**
     * Stream AI response for a message
     * @param chatId Chat ID
     * @param companyId CompanyId
     * @param messageId ID of the message to process
     * @returns Observable stream of AI response
     */
    async streamResponse(
        chatId: string,
        companyId: string,
        messageId: string,
    ): Promise<Observable<{ data: string }>> {
        this.logger.log(`Streaming AI response for message ${messageId} in chat ${chatId}`);
        try {
            const message = await this.prismaChatService.getMessageById(messageId);

            if (!message) {
                throw new Error(`Message with ID ${messageId} not found`);
            }

            this.logger.debug(`Found message with ID: ${message.id}`);

            const chatMessages = await this.prismaChatService.getChatHistoryForAi(chatId);

            const history = chatMessages
                .filter((msg) => msg.id !== message.id) 
                .map((msg) => `'User': ${msg.text}`)
                .join('\n');

            this.logger.debug(
                `Chat history prepared with ${chatMessages.length - 1} previous messages`,
            );

            const fileIds = await this.prismaChatService.getFileIdsForChat(companyId, chatId);

            if (fileIds.length === 0) {
                this.logger.warn(`No files found for chat ${chatId}`);

                const noFilesMessage =
                    'No files found for this chat. Please upload a document to continue the conversation.';

                await this.prismaChatService.addMessageToChat(chatId, companyId, {
                    text: noFilesMessage,
                    role: MessageRole.ASSISTANT,
                });

                return new Observable<{ data: string }>((observer) => {
                    observer.next({ data: noFilesMessage });
                    observer.complete();
                });
            }

            const responseStream = this.openAIService.createStreamCompletion({
                messageText: message.text,
                fileIds,
                history,
            });

            const subject = new Subject<string>();
            let fullResponse = '';

            subject.subscribe({
                next: (chunk) => {
                    fullResponse += chunk;
                },
                error: (err) => {
                    this.logger.error(`Error in AI response stream: ${err.message}`, err.stack);
                    this.prismaChatService
                        .addMessageToChat(chatId, companyId, {
                            text: 'Sorry, an error occurred while generating the response. Please try again.',
                            role: MessageRole.ASSISTANT,
                        })
                        .catch((saveErr) => {
                            this.logger.error(
                                `Failed to save error message to chat: ${saveErr.message}`,
                            );
                        });
                },
                complete: async () => {
                    try {
                        this.logger.debug(`AI response stream completed, saving response to chat`);
                        if (fullResponse) {
                            await this.prismaChatService.addMessageToChat(chatId, companyId, {
                                text: fullResponse,
                                role: MessageRole.ASSISTANT,
                            });
                            this.logger.debug(`AI response saved to chat ${chatId}`);
                        }
                    } catch (saveError) {
                        this.logger.error(
                            `Error saving AI response: ${saveError.message}`,
                            saveError.stack,
                        );
                    }
                },
            });

            responseStream.subscribe(subject);

            return new Observable<{ data: string }>((observer) => {
                const subscription = subject.subscribe({
                    next: (chunk) => {
                        observer.next({ data: chunk });
                    },
                    error: (err) => {
                        observer.next({
                            data: 'Sorry, an error occurred while generating the response. Please try again.',
                        });
                        observer.complete();
                    },
                    complete: () => {
                        observer.complete();
                    },
                });

                return () => {
                    this.logger.debug(
                        `SSE connection closed for chat ${chatId}. The AI response will continue to be processed and saved.`,
                    );
                    subscription.unsubscribe();
                };
            });
        } catch (error) {
            this.logger.error(
                `Error in addMessageAndStreamResponse: ${error.message}`,
                error.stack,
            );

            return new Observable<{ data: string }>((observer) => {
                observer.next({
                    data: 'Sorry, an error occurred while generating the response. Please try again.',
                });
                observer.complete();
            });
        }
    }
}
