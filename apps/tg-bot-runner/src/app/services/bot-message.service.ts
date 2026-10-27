import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from '@assistant/langchain';
import { TelegramService } from '@assistant/prisma';
import { Context, Telegraf } from 'telegraf';
import { ReplyParameters, Update } from 'telegraf/typings/core/types/typegram';
import { MESSAGE_ROLE } from '@prisma/client';
import { escapeMarkdown } from '@assistant/shared';

const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;

@Injectable()
export class BotMessageService {
    private readonly logger = new Logger(BotMessageService.name);

    constructor(
        private readonly telegramService: TelegramService,
        private readonly openAIService: OpenAIService,
    ) {}

    /**
     * Set up message handlers for a bot
     */
    setupMessageHandlers(bot: Telegraf<Context<Update>>, botId: string) {
        this.logger.verbose(`Setting up message handlers for bot ${botId}`);

        bot.on('text', async (ctx) => {
            await this.handleTextMessage(ctx, botId);
        });

        bot.catch((error, ctx) => {
            if (error instanceof Error) {
                this.logger.error(`Error in bot ${botId}: ${error.message}`, error.stack);
            } else {
                this.logger.error(`Unknown error in bot ${botId}: ${JSON.stringify(error)}`);
            }
        });
    }

    /**
     * Handle text messages from users
     */
    private async handleTextMessage(ctx: Context<Update>, botId: string) {
        try {
            const message = ctx.message;
            if (!message || typeof message !== 'object' || !('text' in message)) return;

            const text = message.text;
            const telegramUserId = message.from.id;
            const firstName = message.from.first_name;
            const lastName = message.from.last_name;
            const username = message.from.username;

            this.logger.log(`Received message from user ${telegramUserId}: ${text}`);

            const user = await this.telegramService.createOrGetUser(
                {
                    telegramId: telegramUserId,
                    firstName,
                    lastName: lastName ?? null,
                    username: username ?? null,
                    languageCode: message.from.language_code,
                    isBot: message.from.is_bot,
                },
                botId,
            );

            const isAllowed = await this.telegramService.isUserAllowed(botId, username);
            if (!isAllowed) {
                this.logger.warn(
                    `User ${username || telegramUserId} is not allowed to interact with bot ${botId}`,
                );
                await ctx.reply('К сожалению, у вас нет доступа к этому боту.');

                await this.telegramService.createMessage({
                    text,
                    role: MESSAGE_ROLE.USER,
                    botId,
                    userId: user.id,
                });

                return;
            }

            if (text.trim().startsWith('/start')) {
                try {
                    const name = firstName || username;
                    await ctx.reply(`Привет, ${name}!.`);
                } catch (err) {
                    this.logger.error(
                        `Error sending start greeting: ${err instanceof Error ? err.message : String(err)}`,
                    );
                }
                return;
            }

            const newMessage = await this.telegramService.createMessage({
                text,
                role: MESSAGE_ROLE.USER,
                botId,
                userId: user.id,
            });

            const messages = await this.telegramService.getMessageHistoryForAi(botId, user.id);

            const history = messages
                .filter((msg) => msg.id !== newMessage.id) 
                .map((msg) => `'User': ${msg.text}`)
                .join('\n');

            const typingIntervalMs = 4500;

            await ctx.sendChatAction('typing');

            const typingInterval = setInterval(() => {
                ctx.sendChatAction('typing').catch((err) => {
                    this.logger.warn(
                        `Failed to send typing action: ${err instanceof Error ? err.message : String(err)}`,
                    );
                });
            }, typingIntervalMs);

            let response: string;

            try {
                const fileIds = await this.telegramService.getFileIdsForBot(botId);

                response = await this.openAIService.createCompletion({
                    messageText: text,
                    fileIds,
                    history,
                });
            } finally {
                clearInterval(typingInterval);
            }

            try {
                const formattedResponse = escapeMarkdown(response);

                await this.sendLongMessage(ctx, formattedResponse, {
                    message_id: message.message_id,
                });

                await this.telegramService.createMessage({
                    text: response,
                    role: MESSAGE_ROLE.ASSISTANT,
                    botId,
                    userId: user.id,
                });
            } catch (error) {
                this.logger.error(`Error sending response: ${error.message}`, error.stack);
            }
        } catch (error) {
            this.logger.error(`Error handling message: ${error.message}`, error.stack);
            await ctx.reply('Sorry, I encountered an error processing your message.');
        }
    }

    /**
     * Sends a long message by splitting it into chunks if it exceeds Telegram's message length limit.
     * @param ctx The Telegraf context.
     * @param text The text to send.
     * @param replyParameters Optional reply parameters.
     */
    private async sendLongMessage(
        ctx: Context<Update>,
        text: string,
        replyParameters?: ReplyParameters,
    ) {
        if (text.length <= TELEGRAM_MAX_MESSAGE_LENGTH) {
            await ctx.reply(text, { reply_parameters: replyParameters, parse_mode: 'MarkdownV2' });
            return;
        }

        const chunks: string[] = [];
        let currentIndex = 0;

        while (currentIndex < text.length) {
            let chunk = text.substring(currentIndex, currentIndex + TELEGRAM_MAX_MESSAGE_LENGTH);
            const lastSpaceIndex = chunk.lastIndexOf(' ');

            if (currentIndex + TELEGRAM_MAX_MESSAGE_LENGTH < text.length && lastSpaceIndex !== -1) {
                chunk = chunk.substring(0, lastSpaceIndex);
            }

            chunks.push(chunk.trim());
            currentIndex += chunk.length;
        }

        for (let i = 0; i < chunks.length; i++) {
            await ctx.reply(chunks[i], {
                reply_parameters: replyParameters,
                parse_mode: 'MarkdownV2',
            });
            if (i === 0) {
                replyParameters = undefined;
            }
        }
    }
}
