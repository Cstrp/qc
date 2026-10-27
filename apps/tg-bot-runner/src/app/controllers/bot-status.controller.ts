import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KAFKA_OPTIONS } from '@assistant/kafka';
import { BotStatusService } from '../services/bot-status.service';
import { BotStatusChangeDto } from '@assistant/prisma';

@Controller()
export class BotStatusController {
    constructor(private readonly botStatusService: BotStatusService) {}

    @EventPattern(KAFKA_OPTIONS.BOT_STATUS_TOPIC)
    async handleBotStatusChange(@Payload() message: BotStatusChangeDto) {
        await this.botStatusService.processBotStatusChange(message);
    }
}
