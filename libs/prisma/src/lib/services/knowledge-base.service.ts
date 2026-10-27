import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Chat, ChatMessage, File, KnowledgeBase } from '@prisma/client';
import {
    CreateChatDto,
    CreateChatMessageWithRoleDto,
    MessageRole,
    UpdateChatDto,
} from '../dto/chat.dto';
import { CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto } from '../dto/knowledge-base.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class KnowledgeBaseService {
    private readonly logger: Logger = new Logger(KnowledgeBaseService.name);

    constructor(private readonly prisma: PrismaService) {}

    public async getAllKnowledgeBases(companyId: string) {
        const knowledgeBases = await this.prisma.knowledgeBase.findMany({
            where: {
                companyId,
            },
            include: {
                _count: {
                    select: { files: true },
                },
                bot: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        return knowledgeBases.map(({ id, name, _count, bot, createdAt }) => ({
            id,
            name,
            filesCount: _count.files,
            botName: bot?.name || null,
            createdAt,
        }));
    }

    public async getKnowledgeBaseById(id: string, companyId: string) {
        const knowledgeBase = await this.prisma.knowledgeBase.findFirst({
            where: {
                id,
                companyId,
            },
        });

        if (!knowledgeBase) {
            this.logger.warn(`Knowledge base with ID ${id} not found`);
            throw new NotFoundException(`Knowledge base with ID ${id} not found`);
        }

        return knowledgeBase;
    }

    /**
     * Get the bot associated with a knowledge base
     * @param id Knowledge base ID
     * @param companyId Company ID
     * @returns Bot ID and name, or null if no bot is associated
     * @throws NotFoundException if knowledge base not found
     */
    public async getKnowledgeBaseBot(id: string, companyId: string) {
        const knowledgeBase = await this.prisma.knowledgeBase.findFirst({
            where: {
                id,
                companyId,
            },
            select: {
                bot: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!knowledgeBase) {
            this.logger.warn(`Knowledge base with ID ${id} not found`);
            throw new NotFoundException(`Knowledge base with ID ${id} not found`);
        }

        return knowledgeBase.bot;
    }

    /**
     * Creates a new knowledge base with optional file associations
     *
     * @param data - Knowledge base creation data including name, botId, and optional fileIds
     * @param companyId - ID of the company that owns the knowledge base
     * @returns The created knowledge base
     * @throws ConflictException if a knowledge base with the same name already exists
     * @throws NotFoundException if any of the provided file IDs don't exist or don't belong to the company
     */
    public async createKnowledgeBase(
        data: CreateKnowledgeBaseDto,
        companyId: string,
    ): Promise<KnowledgeBase> {
        const { name, botId, fileIds } = data;

        await this.validateKnowledgeBaseNameUniqueness(name, companyId);

        if (botId) {
            await this.validateBotId(botId, companyId);
        }

        return this.prisma.$transaction(async (tx) => {
            const knowledgeBase = await tx.knowledgeBase.create({
                data: {
                    name,
                    botId: botId ?? null,
                    companyId,
                },
            });

            if (fileIds && fileIds.length > 0) {
                const validatedFileIds = await this.validateAndGetFileIds(fileIds, companyId);

                await tx.knowledgeBaseFile.createMany({
                    data: validatedFileIds.map((fileId) => ({
                        knowledgeBaseId: knowledgeBase.id,
                        fileId,
                    })),
                });

                this.logger.verbose(
                    `Added ${validatedFileIds.length} files to knowledge base ${knowledgeBase.id}`,
                );
            }

            this.logger.verbose(`Knowledge base ${name} created with ID ${knowledgeBase.id}`);
            return knowledgeBase;
        });
    }

    /**
     * Validates that a knowledge base name is unique within a company
     *
     * @param name - The knowledge base name to validate
     * @param companyId - The company ID to check against
     * @throws ConflictException if a knowledge base with the same name already exists
     */
    private async validateKnowledgeBaseNameUniqueness(
        name: string,
        companyId: string,
    ): Promise<void> {
        const existingKnowledgeBase = await this.prisma.knowledgeBase.findFirst({
            where: {
                name: { equals: name, mode: 'insensitive' },
                companyId,
            },
        });

        if (existingKnowledgeBase) {
            this.logger.warn(`Knowledge base with name "${name}" already exists`);
            throw new ConflictException(`Knowledge base with name "${name}" already exists`);
        }
    }

    /**
     * Validates that all file IDs exist and belong to the company
     *
     * @param fileIds - Array of file IDs to validate
     * @param companyId - The company ID that should own the files
     * @returns Array of validated file IDs
     * @throws NotFoundException if any files don't exist or don't belong to the company
     */
    private async validateAndGetFileIds(fileIds: string[], companyId: string): Promise<string[]> {
        const files = await this.prisma.file.findMany({
            where: {
                id: { in: fileIds },
                companyId,
            },
        });

        if (files.length !== fileIds.length) {
            const foundFileIds = files.map((file) => file.id);
            const missingFileIds = fileIds.filter((id) => !foundFileIds.includes(id));
            const errorMessage = `Some files not found or don't belong to the company: ${missingFileIds.join(', ')}`;

            this.logger.warn(errorMessage);
            throw new NotFoundException(errorMessage);
        }

        return files.map((file) => file.id);
    }

    /**
     * Validates that the bot ID exists, belongs to the company, and is not already associated with another knowledge base
     *
     * @param botId - The bot ID to validate
     * @param companyId - The company ID that should own the bot
     * @throws NotFoundException if the bot doesn't exist or doesn't belong to the company
     * @throws ConflictException if the bot is already associated with another knowledge base
     */
    private async validateBotId(botId: string, companyId: string): Promise<void> {
        const bot = await this.prisma.telegramBot.findFirst({
            where: {
                id: botId,
                companyId,
            },
        });

        if (!bot) {
            const errorMessage = `Bot with ID ${botId} not found`;
            this.logger.warn(errorMessage);
            throw new NotFoundException(errorMessage);
        }

        const existingKnowledgeBase = await this.prisma.knowledgeBase.findFirst({
            where: {
                botId,
                companyId,
            },
        });

        if (existingKnowledgeBase) {
            const errorMessage = `Bot with ID ${botId} is already associated with knowledge base ${existingKnowledgeBase.id}`;
            this.logger.warn(errorMessage);
            throw new ConflictException(errorMessage);
        }
    }

    public async updateKnowledgeBase(
        id: string,
        data: UpdateKnowledgeBaseDto,
        companyId: string,
    ): Promise<KnowledgeBase> {
        const { name, botId, fileIds } = data;

        const existingKnowledgeBase = await this.prisma.knowledgeBase.findFirst({
            where: {
                id,
                companyId,
            },
            include: {
                files: {
                    select: { fileId: true },
                },
            },
        });

        if (!existingKnowledgeBase) {
            this.logger.warn(`Knowledge base with ID ${id} not found`);
            throw new NotFoundException(`Knowledge base with ID ${id} not found`);
        }

        if (name && name !== existingKnowledgeBase.name) {
            const nameExists = await this.prisma.knowledgeBase.findFirst({
                where: {
                    name: { equals: name, mode: 'insensitive' },
                    companyId,
                    id: { not: id },
                },
            });

            if (nameExists) {
                this.logger.warn(`Knowledge base with name "${name}" already exists`);
                throw new ConflictException(`Knowledge base with name "${name}" already exists`);
            }
        }

        const updatedKnowledgeBase = await this.prisma.knowledgeBase.update({
            where: { id, companyId },
            data: {
                name,
                botId: botId ?? null,
            },
        });

        if (fileIds) {
            const currentFileIds = existingKnowledgeBase.files.map((file) => file.fileId);

            if (fileIds.length > 0) {
                const files = await this.prisma.file.findMany({
                    where: {
                        id: { in: fileIds },
                        companyId,
                    },
                    omit: { companyId: true },
                });

                if (files.length !== fileIds.length) {
                    const foundFileIds = files.map((file) => file.id);
                    const missingFileIds = fileIds.filter((id) => !foundFileIds.includes(id));
                    this.logger.warn(
                        `Some files not found or don't belong to the company: ${missingFileIds.join(
                            ', ',
                        )}`,
                    );
                    throw new NotFoundException(
                        `Some files not found or don't belong to the company: ${missingFileIds.join(
                            ', ',
                        )}`,
                    );
                }
            }

            const fileIdsToRemove = currentFileIds.filter((fileId) => !fileIds.includes(fileId));
            if (fileIdsToRemove.length > 0) {
                await this.prisma.knowledgeBaseFile.deleteMany({
                    where: {
                        knowledgeBaseId: id,
                        knowledgeBase: { companyId },
                        fileId: { in: fileIdsToRemove },
                    },
                });
                this.logger.verbose(
                    `Removed ${fileIdsToRemove.length} files from knowledge base ${id}`,
                );
            }

            const fileIdsToAdd = fileIds.filter((fileId) => !currentFileIds.includes(fileId));
            if (fileIdsToAdd.length > 0) {
                await this.prisma.knowledgeBaseFile.createMany({
                    data: fileIdsToAdd.map((fileId) => ({
                        knowledgeBaseId: id,
                        fileId,
                    })),
                    skipDuplicates: true,
                });
                this.logger.verbose(`Added ${fileIdsToAdd.length} files to knowledge base ${id}`);
            }
        }

        this.logger.verbose(`Knowledge base with ID ${id} updated`);

        return updatedKnowledgeBase;
    }

    public async deleteKnowledgeBase(id: string, companyId: string): Promise<void> {
        const existingKnowledgeBase = await this.prisma.knowledgeBase.findFirst({
            where: {
                id,
                companyId,
            },
        });

        if (!existingKnowledgeBase) {
            this.logger.warn(`Knowledge base with ID ${id} not found`);
            throw new NotFoundException(`Knowledge base with ID ${id} not found`);
        }

        await this.prisma.knowledgeBase.delete({
            where: { id, companyId },
        });

        this.logger.verbose(`Knowledge base with ID ${id} deleted`);
    }

    public async addFileToKnowledgeBase(
        knowledgeBaseId: string,
        fileId: string,
        companyId: string,
    ): Promise<void> {
        const knowledgeBase = await this.prisma.knowledgeBase.findFirst({
            where: {
                id: knowledgeBaseId,
                companyId,
            },
        });

        if (!knowledgeBase) {
            this.logger.warn(`Knowledge base with ID ${knowledgeBaseId} not found`);
            throw new NotFoundException(`Knowledge base with ID ${knowledgeBaseId} not found`);
        }

        const file = await this.prisma.file.findFirst({
            where: {
                id: fileId,
                companyId,
            },
        });

        if (!file) {
            this.logger.warn(`File with ID ${fileId} not found`);
            throw new NotFoundException(`File with ID ${fileId} not found`);
        }

        await this.prisma.knowledgeBaseFile.create({
            data: {
                knowledgeBaseId,
                fileId,
            },
        });

        this.logger.verbose(`File ${fileId} added to knowledge base ${knowledgeBaseId}`);
    }

    public async removeFileFromKnowledgeBase(
        knowledgeBaseId: string,
        fileId: string,
        companyId: string,
    ): Promise<void> {
        const knowledgeBase = await this.prisma.knowledgeBase.findFirst({
            where: {
                id: knowledgeBaseId,
                companyId,
            },
        });

        if (!knowledgeBase) {
            this.logger.warn(`Knowledge base with ID ${knowledgeBaseId} not found`);
            throw new NotFoundException(`Knowledge base with ID ${knowledgeBaseId} not found`);
        }

        const knowledgeBaseFile = await this.prisma.knowledgeBaseFile.findUnique({
            where: {
                knowledgeBaseId_fileId: {
                    knowledgeBaseId,
                    fileId,
                },
            },
        });

        if (!knowledgeBaseFile) {
            this.logger.warn(`File ${fileId} not found in knowledge base ${knowledgeBaseId}`);
            throw new NotFoundException(
                `File ${fileId} not found in knowledge base ${knowledgeBaseId}`,
            );
        }

        await this.prisma.knowledgeBaseFile.delete({
            where: {
                knowledgeBaseId_fileId: {
                    knowledgeBaseId,
                    fileId,
                },
            },
        });

        this.logger.verbose(`File ${fileId} removed from knowledge base ${knowledgeBaseId}`);
    }

    public async getKnowledgeBaseFiles(knowledgeBaseId: string, companyId: string) {
        const knowledgeBase = await this.prisma.knowledgeBase.findFirst({
            where: {
                id: knowledgeBaseId,
                companyId,
            },
            include: {
                files: {
                    include: {
                        file: { omit: { companyId: true } },
                    },
                },
            },
        });

        if (!knowledgeBase) {
            this.logger.warn(`Knowledge base with ID ${knowledgeBaseId} not found`);
            throw new NotFoundException(`Knowledge base with ID ${knowledgeBaseId} not found`);
        }

        return knowledgeBase.files.map(({ file }) => file) as File[];
    }

    public async getChats(knowledgeBaseId: string, companyId: string) {
        const chats = await this.prisma.chat.findMany({
            where: {
                knowledgeBaseId,
                knowledgeBase: { companyId },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        return chats;
    }

    public async getChatById(
        chatId: string,
        knowledgeBaseId: string,
    ): Promise<Chat & { messages: ChatMessage[] }> {
        const chat = await this.prisma.chat.findFirst({
            where: {
                id: chatId,
                knowledgeBaseId,
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

    public async createChatWithMessage(
        data: CreateChatDto & { knowledgeBaseId: string; title: string },
    ): Promise<Chat> {
        const { knowledgeBaseId, userId, initialMessage, title } = data;

        const chat = await this.prisma.chat.create({
            data: {
                title,
                knowledgeBaseId,
                userId,
                messages: {
                    create: {
                        text: initialMessage,
                        role: MessageRole.USER,
                    },
                },
            },
        });

        this.logger.verbose(
            `Chat ${chat.id} created for knowledge base ${knowledgeBaseId} with initial message`,
        );

        return chat;
    }

    /**
     * Creates a chat
     * @param data Chat data
     * @returns Created chat
     */
    public async createChat(data: {
        knowledgeBaseId: string;
        userId: string;
        title: string;
    }): Promise<Chat> {
        const { knowledgeBaseId, userId, title } = data;

        const chat = await this.prisma.chat.create({
            data: {
                title,
                knowledgeBaseId,
                userId,
            },
        });

        this.logger.verbose(
            `Chat ${chat.id} created for knowledge base ${knowledgeBaseId} without initial message`,
        );

        return chat;
    }

    public async updateChat(
        chatId: string,
        data: UpdateChatDto,
        knowledgeBaseId: string,
    ): Promise<Chat> {
        const existingChat = await this.prisma.chat.findFirst({
            where: {
                id: chatId,
                knowledgeBaseId,
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

    public async deleteChat(chatId: string, knowledgeBaseId: string): Promise<void> {
        const existingChat = await this.prisma.chat.findFirst({
            where: {
                id: chatId,
                knowledgeBaseId,
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

    public async getChatMessages(chatId: string, knowledgeBaseId: string) {
        const existingChat = await this.prisma.chat.findFirst({
            where: {
                id: chatId,
                knowledgeBaseId,
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
        data: CreateChatMessageWithRoleDto,
        knowledgeBaseId: string,
    ): Promise<ChatMessage> {
        const existingChat = await this.prisma.chat.findFirst({
            where: {
                id: chatId,
                knowledgeBaseId,
            },
        });

        if (!existingChat) {
            this.logger.warn(`Chat with ID ${chatId} not found`);
            throw new NotFoundException(`Chat with ID ${chatId} not found`);
        }

        const message = await this.prisma.chatMessage.create({
            data: {
                text: data.text,
                role: MessageRole.USER,
                chatId,
            },
        });

        await this.prisma.chat.update({
            where: { id: chatId },
            data: { updatedAt: new Date() },
        });

        this.logger.verbose(`Message ${message.id} added to chat ${chatId}`);

        return message;
    }
}
