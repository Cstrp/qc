import { Injectable, Logger } from '@nestjs/common';
import { BotStatusChangeDto, TelegramService } from '@assistant/prisma';
import { BotLifecycleService } from './bot-lifecycle.service';
import { BOT_STATUS } from '@prisma/client';

@Injectable()
export class BotStatusService {
    private readonly logger = new Logger(BotStatusService.name);

    constructor(
        private readonly botLifecycleService: BotLifecycleService,
        private readonly telegramService: TelegramService,
    ) {}

    async processBotStatusChange(payload: BotStatusChangeDto): Promise<void> {
        this.logger.debug(`Received bot status change event: ${JSON.stringify(payload)}`);

        try {
            const { botId, status, companyId } = payload;

            this.logger.verbose(`Processing bot status change for bot ${botId}: status=${status}`);

            const bot = await this.telegramService.getBot(botId, companyId);

            if (!bot) {
                this.logger.error(`Bot ${botId} not found`);
                return;
            }

            if (status === BOT_STATUS.ONLINE) {
                await this.botLifecycleService.startBot(botId, bot.token);
            } else {
                await this.botLifecycleService.stopBot(botId);
            }
        } catch (error) {
            this.logger.error(
                `Failed to handle bot status change for payload: ${JSON.stringify(payload)}. Error: ${error.message}`,
                error.stack,
            );
        }
    }
}
