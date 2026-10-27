import { BotStatusChangeDto, CreateBotDto, TelegramService } from '@assistant/prisma';
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { KAFKA_OPTIONS } from '@assistant/kafka';
import { firstValueFrom } from 'rxjs';
import { BOT_STATUS } from '@prisma/client';

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(BotService.name);

    constructor(
        private readonly telegramService: TelegramService,
        @Inject(KAFKA_OPTIONS.SERVICE_INJECTION_TOKEN) private readonly kafkaClient: ClientKafka,
    ) {}

    async onModuleInit() {
        this.kafkaClient.subscribeToResponseOf(KAFKA_OPTIONS.BOT_STATUS_TOPIC);
        await this.kafkaClient.connect();
    }

    async onModuleDestroy() {
        await this.kafkaClient.close();
    }

    /**
     * Get all Telegram bots
     * @returns Array of Telegram bots
     */
    public getBots(companyId: string) {
        return this.telegramService.getBotList(companyId);
    }

    public async createBot(companyId: string, payload: CreateBotDto) {
        const bot = await this.telegramService.createBot(companyId, payload);

        if (bot?.isEnabled) {
            await this.sendStatusChangeToKafka(bot.id, companyId, BOT_STATUS.ONLINE);
        }

        return bot;
    }

    /**
     * Sends a bot status change event to Kafka.
     * @param botId The ID of the bot.
     * @param companyId The ID of the company.
     * @param status The new status of the bot (ONLINE or OFFLINE).
     */
    private async sendStatusChangeToKafka(botId: string, companyId: string, status: BOT_STATUS) {
        const statusChangePayload: BotStatusChangeDto = { botId, companyId, status };

        this.logger.verbose(
            `Sending bot status change to Kafka: ${JSON.stringify(statusChangePayload)}`,
        );

        try {
            await firstValueFrom(
                this.kafkaClient.emit(KAFKA_OPTIONS.BOT_STATUS_TOPIC, {
                    key: botId,
                    value: statusChangePayload,
                }),
            );

            this.logger.verbose(
                `Bot status change message sent to Kafka successfully botId: ${botId}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to send bot status change to Kafka: ${error.message}`,
                error.stack,
            );
        }
    }

    /**
     * Update an existing Telegram bot
     * @param id Bot ID
     * @param companyId Company ID
     * @param payload Bot update payload
     * @throws NotFoundException if bot not found
     */
    public async updateBot(id: string, companyId: string, payload: Partial<CreateBotDto>) {
        if (payload.isEnabled !== undefined) {
            const currentBot = await this.telegramService.getBot(id, companyId);

            if (currentBot?.isEnabled !== payload.isEnabled) {
                const status = payload.isEnabled ? BOT_STATUS.ONLINE : BOT_STATUS.OFFLINE;
                await this.sendStatusChangeToKafka(id, companyId, status);
            }
        }

        return this.telegramService.updateBotWithAllowedUsers(id, companyId, payload);
    }

    public async deleteBot(id: string, companyId: string): Promise<void> {
        const bot = await this.telegramService.getBot(id, companyId);

        if (bot?.isEnabled) {
            await this.sendStatusChangeToKafka(id, companyId, BOT_STATUS.OFFLINE);
        }

        return this.telegramService.deleteBot(id, companyId);
    }

    /**
     * Get all allowed usernames for a bot
     * @param botId Bot ID
     * @param companyId Company ID
     * @returns Array of allowed usernames
     * @throws NotFoundException if bot not found
     */
    public async getAllowedUsernames(botId: string, companyId: string) {
        await this.telegramService.getBot(botId, companyId);

        return this.telegramService.getAllowedUsers(botId, companyId);
    }

    /**
     * Get all unused bots (bots not assigned to any knowledge base)
     * @param companyId Company ID
     * @returns Array of unused bots
     */
    public getUnusedBots(companyId: string) {
        return this.telegramService.getUnusedBots(companyId);
    }
}
