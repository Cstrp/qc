import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService, TelegramService } from '@assistant/prisma';
import { Telegraf } from 'telegraf';
import { BotMessageService } from './bot-message.service';
import { BOT_STATUS } from '@prisma/client';

@Injectable()
export class BotLifecycleService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(BotLifecycleService.name);
    private activeBots: Map<string, Telegraf> = new Map();
    private isWebhookMode: boolean;
    private webhookDomain: string;
    private webhookPath: string;

    constructor(
        private readonly telegramService: TelegramService,
        private readonly botMessageService: BotMessageService,
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        this.isWebhookMode = this.configService.get('TG_BOT_WEBHOOK_MODE') === 'true';
        this.webhookDomain = this.configService.get('TG_BOT_WEBHOOK_DOMAIN') ?? '';
        this.webhookPath = this.configService.get('TG_BOT_WEBHOOK_PATH') || '/telegram-webhook';
    }

    /**
     * On module initialization, start all enabled bots
     */
    async onModuleInit() {
        this.logger.log('Initializing BotLifecycleService');
        await this.startAllEnabledBots();
    }

    /**
     * Start all bots that are enabled in the database
     */
    async startAllEnabledBots() {
        try {
            const bots = await this.telegramService.getAllActiveBotForAllCompanies();

            this.logger.log(`Enabled bots count: ${bots.length}`);

            for (const bot of bots) {
                await this.startBot(bot.id, bot.token).catch((error: Error) => {
                    this.logger.error(
                        `Failed to start bot ${bot.id}: ${error.message}`,
                        error.stack,
                    );
                });
            }
        } catch (error) {
            this.logger.error(`Failed to get enabled bots: ${error.message}`, error.stack);
        }
    }

    /**
     * Start a specific bot by ID
     */
    async startBot(botId: string, token: string) {
        try {
            if (this.activeBots.has(botId)) {
                this.logger.warn(`Bot ${botId} is already running`);
                return;
            }

            this.logger.verbose(`Starting bot ${botId}`);

            const bot = new Telegraf(token);

            this.botMessageService.setupMessageHandlers(bot, botId);

            if (this.isWebhookMode) {
                const webhookUrl = `${this.webhookDomain}${this.webhookPath}/${botId}`;

                const botInfo = await bot.telegram.getMe();

                await this.updateBotInfo(botId, botInfo);

                await bot.telegram.setWebhook(webhookUrl);
                this.logger.verbose(`Bot ${botId} started in webhook mode at ${webhookUrl}`);
            } else {
                const botInfo = await bot.telegram.getMe();

                await this.updateBotInfo(botId, botInfo);

                this.logger.verbose(`Bot ${botId} started in long polling mode`);

                bot.launch({ dropPendingUpdates: true }).catch((err: Error) => {
                    throw err;
                });
            }

            this.activeBots.set(botId, bot);

            await this.telegramService.updateBot(botId, {
                status: BOT_STATUS.ONLINE,
            });

            this.logger.log(`Bot ${botId} started successfully`);
        } catch (error) {
            this.logger.error(`Failed to start bot ${botId}: ${error.message}`, error.stack);

            await this.telegramService.updateBot(botId, { status: BOT_STATUS.OFFLINE });
        }
    }

    /**
     * Stop a specific bot by ID
     */
    async stopBot(botId: string) {
        try {
            const bot = this.activeBots.get(botId);

            if (!bot) {
                this.logger.warn(`Bot ${botId} is not running`);
                return;
            }

            this.logger.log(`Stopping bot ${botId}`);

            if (this.isWebhookMode) {
                await bot.telegram.deleteWebhook();
            } else {
                bot.stop();
            }

            this.activeBots.delete(botId);

            await this.prisma.telegramBot.updateMany({
                data: { status: BOT_STATUS.OFFLINE },
                where: { id: botId },
            });

            this.logger.log(`Bot ${botId} stopped successfully`);
        } catch (error) {
            this.logger.error(`Failed to stop bot ${botId}: ${error.message}`, error.stack);
        }
    }

    /**
     * Get all active bots
     */
    getActiveBots(): Map<string, Telegraf> {
        return this.activeBots;
    }

    /**
     * Stop all active bots
     */
    async stopAllBots() {
        this.logger.log('Stopping all active bots');

        const botIds = Array.from(this.activeBots.keys());
        for (const botId of botIds) {
            await this.stopBot(botId).catch((error: Error) => {
                this.logger.error(`Failed to stop bot ${botId}: ${error.message}`, error.stack);
            });
        }

        this.logger.log(`All bots stopped successfully. Total: ${botIds.length}`);
    }

    /**
     * On module destroy, stop all active bots
     */
    async onModuleDestroy() {
        this.logger.log('Destroying BotLifecycleService');
        await this.stopAllBots();
    }

    /**
     * Update bot information based on getMe response
     */
    private async updateBotInfo(botId: string, botInfo: any) {
        await this.telegramService.updateBot(botId, {
            firstName: botInfo.first_name,
            username: botInfo.username,
            canJoinGroups: botInfo.can_join_groups,
            canReadAllGroupMessages: botInfo.can_read_all_group_messages,
            supportsInlineQueries: botInfo.supports_inline_queries,
        });
    }
}
