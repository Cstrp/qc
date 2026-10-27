import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
    CreateChatDto,
    CreateKnowledgeBaseDto,
    KnowledgeBaseService as PrismaKnowledgeBaseService,
    MessageRole,
    UpdateKnowledgeBaseDto,
} from '@assistant/prisma';
import { OpenAIService } from '@assistant/langchain';
import { ChatService } from './chat.service';

@Injectable()
export class KnowledgeBaseService {
    private readonly logger = new Logger(KnowledgeBaseService.name);

    constructor(
        private readonly prismaKnowledgeBaseService: PrismaKnowledgeBaseService,
        private readonly openAIService: OpenAIService,
        private readonly chatService: ChatService,
    ) {}

    /**
     * Get all knowledge bases for a company
     * @param companyId Company ID
     * @returns List of knowledge bases
     */
    async getAllKnowledgeBases(companyId: string) {
        return this.prismaKnowledgeBaseService.getAllKnowledgeBases(companyId);
    }

    /**
     * Get a knowledge base by ID
     * @param id Knowledge base ID
     * @param companyId Company ID
     * @returns Knowledge base details
     */
    async getKnowledgeBaseById(id: string, companyId: string) {
        return this.prismaKnowledgeBaseService.getKnowledgeBaseById(id, companyId);
    }

    /**
     * Create a new knowledge base
     * @param data Knowledge base data
     * @param companyId Company ID
     * @returns Created knowledge base
     */
    async createKnowledgeBase(data: CreateKnowledgeBaseDto, companyId: string) {
        return this.prismaKnowledgeBaseService.createKnowledgeBase(data, companyId);
    }

    /**
     * Update a knowledge base
     * @param id Knowledge base ID
     * @param data Updated knowledge base data
     * @param companyId Company ID
     * @returns Updated knowledge base
     */
    async updateKnowledgeBase(id: string, data: UpdateKnowledgeBaseDto, companyId: string) {
        return this.prismaKnowledgeBaseService.updateKnowledgeBase(id, data, companyId);
    }

    /**
     * Delete a knowledge base
     * @param id Knowledge base ID
     * @param companyId Company ID
     */
    async deleteKnowledgeBase(id: string, companyId: string) {
        await this.prismaKnowledgeBaseService.deleteKnowledgeBase(id, companyId);
    }

    /**
     * Get all files in a knowledge base
     * @param id Knowledge base ID
     * @param companyId Company ID
     * @returns List of files
     */
    async getKnowledgeBaseFiles(id: string, companyId: string) {
        try {
            return this.prismaKnowledgeBaseService.getKnowledgeBaseFiles(id, companyId);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Error getting knowledge base files: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Add a file to a knowledge base
     * @param id Knowledge base ID
     * @param fileId File ID
     * @param companyId Company ID
     */
    async addFileToKnowledgeBase(id: string, fileId: string, companyId: string) {
        try {
            await this.prismaKnowledgeBaseService.addFileToKnowledgeBase(id, fileId, companyId);
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(`Error adding file to knowledge base: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Remove a file from a knowledge base
     * @param id Knowledge base ID
     * @param fileId File ID
     * @param companyId Company ID
     */
    async removeFileFromKnowledgeBase(id: string, fileId: string, companyId: string) {
        try {
            await this.prismaKnowledgeBaseService.removeFileFromKnowledgeBase(
                id,
                fileId,
                companyId,
            );
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            this.logger.error(
                `Error removing file from knowledge base: ${error.message}`,
                error.stack,
            );
            throw error;
        }
    }

    /**
     * Get all chats for a knowledge base
     * @param id Knowledge base ID
     * @param companyId Company ID
     * @returns List of chats
     */
    async getChats(id: string, companyId: string) {
        try {
            return this.prismaKnowledgeBaseService.getChats(id, companyId);
        } catch (error) {
            this.logger.error(`Error getting chats: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Create a chat
     * @param data Chat data
     * @returns Created chat
     */
    async createChatWithoutMessage(data: {
        knowledgeBaseId: string;
        userId: string;
        title: string;
    }) {
        try {
            return this.prismaKnowledgeBaseService.createChat(data);
        } catch (error) {
            this.logger.error(`Error creating chat: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Create a new chat for a knowledge base with initial message
     * @param id Knowledge base ID
     * @param companyId Company ID
     * @param data Chat creation data with initial message
     * @returns Object containing chat ID and message ID
     */
    async createChat(
        id: string,
        companyId: string,
        data: CreateChatDto,
    ): Promise<{ chatId: string; messageId: string }> {
        try {
            const chatTitle = await this.openAIService.generateChatTitle(data.initialMessage);

            const chat = await this.createChatWithoutMessage({
                knowledgeBaseId: id,
                userId: data.userId,
                title: chatTitle,
            });

            const message = await this.chatService.addMessageToChat(chat.id, companyId, {
                text: data.initialMessage,
                role: MessageRole.USER,
            });

            return {
                chatId: chat.id,
                messageId: message.id,
            };
        } catch (error) {
            this.logger.error(`Error creating chat: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Get the bot associated with a knowledge base
     * @param id Knowledge base ID
     * @param companyId Company ID
     * @returns Bot ID and name, or null if no bot is associated
     * @throws NotFoundException if knowledge base not found
     */
    async getKnowledgeBaseBot(id: string, companyId: string) {
        try {
            return this.prismaKnowledgeBaseService.getKnowledgeBaseBot(id, companyId);
        } catch (error) {
            this.logger.error(`Error getting knowledge base bot: ${error.message}`, error.stack);
            throw error;
        }
    }
}
