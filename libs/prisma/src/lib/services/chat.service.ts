import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Chat, ChatMessage } from '@prisma/client';
import { CreateChatMessageWithRoleDto, MessageRole, UpdateChatDto } from '../dto/chat.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ChatService {
    private readonly logger: Logger = new Logger(ChatService.name);

    constructor(private readonly prisma: PrismaService) {}

    public async getChatById(
        chatId: string,
        companyId: string,
    ): Promise<Chat & { messages: ChatMessage[] }> {
        const chat = await this.prisma.chat.findFirst({
            where: {
                id: chatId,
                knowledgeBase: { companyId },
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
        });

        if (!chat) {
            this.logger.warn(`Chat with ID ${chatId} not found`);
            throw new NotFoundException(`Chat with ID ${chatId} not found`);
        }

        return chat;
    }

    public async updateChat(chatId: string, data: UpdateChatDto): Promise<Chat> {
        const existingChat = await this.prisma.chat.findFirst({
            where: {
                id: chatId,
            },
        });

        if (!existingChat) {
            this.logger.warn(`Chat with ID ${chatId} not found`);
            throw new NotFoundException(`Chat with ID ${chatId} not found`);
        }

        const updatedChat = await this.prisma.chat.update({
            where: { id: chatId },
            data,
        });

        this.logger.verbose(`Chat with ID ${chatId} updated`);

        return updatedChat;
    }

    public async deleteChat(chatId: string, companyId: string): Promise<void> {
        const existingChat = await this.prisma.chat.findFirst({
            where: {
                id: chatId,
                knowledgeBase: { companyId },
            },
        });

        if (!existingChat) {
            this.logger.warn(`Chat with ID ${chatId} not found`);
            throw new NotFoundException(`Chat with ID ${chatId} not found`);
        }

        await this.prisma.chat.delete({
            where: { id: chatId },
        });

        this.logger.verbose(`Chat with ID ${chatId} deleted`);
    }

    public async getChatHistoryForAi(chatId: string, limit = 15) {
        const existingChat = await this.prisma.chat.findFirst({
            where: {
                id: chatId,
            },
        });

        if (!existingChat) {
            this.logger.warn(`Chat with ID ${chatId} not found`);
            throw new NotFoundException(`Chat with ID ${chatId} not found`);
        }

        return await this.prisma.chatMessage
            .findMany({
                select: { id: true, text: true },
                where: {
                    chatId,
                    role: MessageRole.USER,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: limit,
            })
            .then((messages) => messages.reverse()); // Reverse to maintain chronological order
    }

    public async getAllChatMessages(chatId: string, companyId: string) {
        const existingChat = await this.prisma.chat.findFirst({
            where: {
                id: chatId,
                knowledgeBase: { companyId },
            },
        });

        if (!existingChat) {
            this.logger.warn(`Chat with ID ${chatId} not found`);
            throw new NotFoundException(`Chat with ID ${chatId} not found`);
        }

        return await this.prisma.chatMessage.findMany({
            where: {
                chatId,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    }

    public async addMessageToChat(
        chatId: string,
        companyId: string,
        data: CreateChatMessageWithRoleDto,
    ): Promise<ChatMessage> {
        const existingChat = await this.prisma.chat.findFirst({
            where: {
                id: chatId,
                knowledgeBase: { companyId },
            },
        });

        if (!existingChat) {
            this.logger.warn(`Chat with ID ${chatId} not found`);
            throw new NotFoundException(`Chat with ID ${chatId} not found`);
        }

        const message = await this.prisma.chatMessage.create({
            data: {
                text: data.text,
                role: data.role,
                chatId,
            },
        });

        await this.prisma.chat.update({
            where: { id: chatId, knowledgeBase: { companyId } },
            data: { updatedAt: new Date() },
        });

        this.logger.verbose(`Message ${message.id} added to chat ${chatId}`);

        return message;
    }

    public async getFileIdsForChat(companyId: string, chatId: string) {
        const files = await this.prisma.file.findMany({
            select: { id: true },
            where: {
                knowledgeBases: {
                    some: {
                        knowledgeBase: {
                            chats: {
                                some: { id: chatId },
                            },
                            companyId: companyId,
                        },
                    },
                },
            },
        });

        return files.map((file) => file.id);
    }

    /**
     * Get a message by ID
     * @param messageId Message ID
     * @returns Message or null if not found
     */
    public async getMessageById(messageId: string): Promise<ChatMessage | null> {
        return this.prisma.chatMessage.findUnique({
            where: {
                id: messageId,
            },
        });
    }
}
