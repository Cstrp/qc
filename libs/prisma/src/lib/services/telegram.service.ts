import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, } from '@nestjs/common';
import { MESSAGE_ROLE, Prisma, TelegramBot, TelegramUser } from '@prisma/client';
import { BotListItemDto, CreateAllowedUserDto, CreateBotDtoResponse } from '../dto';
import { CreateBotDto, UpdateBotDto } from '../dto/telegram-bot.dto';
import { PrismaService } from '../prisma.service';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramService {
    private readonly logger: Logger = new Logger(TelegramService.name);

    constructor(private readonly prisma: PrismaService) {}

    private normalizeUsername(username: string): string {
        return username?.startsWith('@') ? username.slice(1) : username;
    }

    public async getBotByFirstName(name: string): Promise<TelegramBot> {
        const bot = await this.prisma.telegramBot.findFirst({
            where: {
                firstName: { equals: name, mode: 'insensitive' },
            },
        });

        if (!bot) {
            throw new NotFoundException(`Bot with name ${name} not found`);
        }

        return bot;
    }

    public async getBot(id: string, companyId: string): Promise<TelegramBot> {
        const bot = await this.prisma.telegramBot.findUnique({
            where: { id, companyId },
        });

        if (!bot) {
            throw new NotFoundException(`Bot with ID ${id} not found`);
        }

        return bot;
    }

    public async getBotList(companyId: string): Promise<BotListItemDto[]> {
        const botsData = await this.prisma.telegramBot.findMany({
            where: { companyId },
            select: {
                id: true,
                name: true,
                token: true,
                isEnabled: true,
                status: true,
                knowledgeBase: {
                    select: {
                        name: true,
                    },
                },
                _count: {
                    select: { allowedUsers: true },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        return botsData.map(({ knowledgeBase, _count, ...bot }) => ({
            ...bot,
            knowledgeBaseName: knowledgeBase?.name ?? null,
            userCount: _count.allowedUsers,
        }));
    }

    public async getAllActiveBotForAllCompanies(): Promise<TelegramBot[]> {
        return await this.prisma.telegramBot.findMany({ where: { isEnabled: true } });
    }

    public async createBot(
        companyId: string,
        createBotDto: CreateBotDto,
    ): Promise<CreateBotDtoResponse> {
        const existingBotName = await this.getBotByName(companyId, createBotDto.name);

        if (existingBotName) {
            throw new ConflictException(`Bot with name ${createBotDto.name} already exists`);
        }

        const existingBotToken = await this.getBotByToken(companyId, createBotDto.token);

        if (existingBotToken) {
            throw new ConflictException(`Bot with token ${createBotDto.token} already exists`);
        }

        await this.validateTelegramToken(createBotDto.token);

        const { allowedUsernames, ...botData } = createBotDto;

        const bot = await this.prisma.$transaction(async (tx) => {
            const newBot = await tx.telegramBot.create({
                data: { ...botData, companyId },
                select: {
                    id: true,
                    token: true,
                    name: true,
                    isEnabled: true,
                    status: true,
                },
            });

            if (allowedUsernames?.length) {
                await tx.telegramAllowedUser.createMany({
                    data: allowedUsernames.map((username) => ({
                        botId: newBot.id,
                        username: this.normalizeUsername(username),
                    })),
                    skipDuplicates: true,
                });
            }

            return newBot;
        });

        return {
            ...bot,
            allowedUsernames: allowedUsernames?.map((u) => this.normalizeUsername(u)),
        };
    }

    public async updateBotWithAllowedUsers(
        id: string,
        companyId: string,
        updateBotDto: UpdateBotDto,
    ): Promise<UpdateBotDto> {
        await this.getBot(id, companyId);

        if (updateBotDto.name) {
            const existingBotName = await this.getBotByName(companyId, updateBotDto.name);

            if (existingBotName && existingBotName.id !== id) {
                throw new ConflictException(`Bot with name ${updateBotDto.name} already exists`);
            }
        }

        const { allowedUsernames, ...botData } = updateBotDto;

        return await this.prisma.$transaction(async (tx) => {
            const bot = await tx.telegramBot.update({
                select: {
                    id: true,
                    token: true,
                    name: true,
                    isEnabled: true,
                    status: true,
                },
                where: { id, companyId },
                data: { ...botData },
            });

            if (allowedUsernames) {
                await tx.telegramAllowedUser.deleteMany({
                    where: { botId: id },
                });

                if (allowedUsernames?.length) {
                    await tx.telegramAllowedUser.createMany({
                        data: allowedUsernames.map((username) => ({
                            botId: id,
                            username: this.normalizeUsername(username),
                        })),
                        skipDuplicates: true,
                    });
                }
            }

            return {
                ...bot,
                allowedUsernames: allowedUsernames?.map((u) => this.normalizeUsername(u)),
            };
        });
    }

    public async updateBot(id: string, data: Partial<TelegramBot>): Promise<TelegramBot> {
        const bot = await this.prisma.telegramBot.findUnique({
            where: { id },
        });

        if (!bot) {
            throw new NotFoundException(`Bot with ID ${id} not found`);
        }

        return this.prisma.telegramBot.update({ data, where: { id } });
    }

    public async deleteBot(id: string, companyId: string): Promise<void> {
        await this.getBot(id, companyId);

        await this.prisma.telegramBot.delete({
            where: { id, companyId },
        });

        this.logger.log(`Bot with ID ${id} has been deleted`);
    }

    public async getUnusedBots(companyId: string): Promise<{ id: string; name: string }[]> {
        return await this.prisma.telegramBot.findMany({
            where: {
                companyId,
                knowledgeBase: null,
            },
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    }

    private async getBotByName(companyId: string, name: string) {
        return await this.prisma.telegramBot.findFirst({
            where: { companyId, name },
        });
    }

    private async getBotByToken(companyId: string, token: string) {
        return await this.prisma.telegramBot.findFirst({
            where: { companyId, token },
        });
    }

    private async validateTelegramToken(token: string): Promise<void> {
        try {
            const bot = new Telegraf(token);
            await bot.telegram.getMe();
        } catch (error: any) {
            const status = error?.response?.error_code ?? error?.code;
            if (status === 401) {
                throw new BadRequestException('Invalid Telegram bot token');
            }
            throw new BadRequestException('Unable to validate Telegram bot token');
        }
    }

    public async getAllowedUsers(botId: string, companyId: string): Promise<string[]> {
        await this.getBot(botId, companyId);

        const allowedUsers = await this.prisma.telegramAllowedUser.findMany({
            where: { botId },
            select: { username: true },
        });

        return allowedUsers.map((user) => user.username);
    }

    public async addAllowedUser(botId: string, data: CreateAllowedUserDto, companyId: string) {
        await this.getBot(botId, companyId);

        const normalizedUsername = this.normalizeUsername(data.username);

        const existingAllowedUser = await this.prisma.telegramAllowedUser.findUnique({
            where: {
                bot: { companyId, id: botId },
                botId_username: {
                    botId,
                    username: normalizedUsername,
                },
            },
        });

        if (existingAllowedUser) {
            throw new ConflictException(
                `Username ${normalizedUsername} is already allowed for this bot`,
            );
        }

        return this.prisma.telegramAllowedUser.create({
            select: { id: true, username: true },
            data: {
                ...data,
                username: normalizedUsername,
                botId,
            },
        });
    }

    public async removeAllowedUser(
        botId: string,
        userId: string,
        companyId: string,
    ): Promise<void> {
        await this.getBot(botId, companyId);

        const existingAllowedUser = await this.prisma.telegramAllowedUser.findFirst({
            where: {
                id: userId,
                botId,
            },
        });

        if (!existingAllowedUser) {
            throw new NotFoundException(
                `Username with ID ${userId} not found in allowed usernames for this bot`,
            );
        }

        await this.prisma.telegramAllowedUser.delete({
            where: {
                id: userId,
            },
        });
    }

    public async createOrGetUser(
        data: Prisma.TelegramUserCreateInput,
        botId: string,
    ): Promise<TelegramUser> {
        const existUser = await this.prisma.telegramUser.findUnique({
            where: { telegramId: data.telegramId },
        });

        if (existUser) {
            const userWithBot = await this.prisma.telegramUser.findFirst({
                where: {
                    id: existUser.id,
                    bots: {
                        some: {
                            id: botId,
                        },
                    },
                },
            });

            if (!userWithBot) {
                await this.prisma.telegramUser.update({
                    where: { id: existUser.id },
                    data: {
                        bots: {
                            connect: { id: botId },
                        },
                    },
                });
            }

            return existUser;
        }

        return this.prisma.telegramUser.create({
            data: {
                ...data,
                bots: {
                    connect: { id: botId },
                },
            },
        });
    }

    public async createMessage(data: {
        text: string;
        role: MESSAGE_ROLE;
        botId: string;
        userId: string;
    }) {
        return this.prisma.telegramMessage.create({
            data: {
                text: data.text,
                role: data.role,
                botId: data.botId,
                userId: data.userId,
            },
        });
    }

    public async getFileIdsForBot(botId: string) {
        const files = await this.prisma.file.findMany({
            select: { id: true },
            where: {
                knowledgeBases: {
                    some: {
                        knowledgeBase: { botId },
                    },
                },
            },
        });

        return files.map((file) => file.id);
    }


    public async getMessageHistoryForAi(botId: string, userId: string, limit = 15) {
        return this.prisma.telegramMessage
            .findMany({
                select: { id: true, text: true },
                where: {
                    botId,
                    userId,
                    role: MESSAGE_ROLE.USER,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: limit,
            })
            .then((messages) => messages.reverse()); 
    }


    public async isUserAllowed(
        botId: string,
        username: string | null | undefined,
    ): Promise<boolean> {
        if (!username) {
            return false;
        }

        const allowedUser = await this.prisma.telegramAllowedUser.findUnique({
            where: {
                botId_username: {
                    botId,
                    username,
                },
            },
        });

        return !!allowedUser;
    }
}
