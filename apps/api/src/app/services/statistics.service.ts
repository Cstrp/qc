import { Injectable } from '@nestjs/common';
import { PrismaService } from '@assistant/prisma';
import { MESSAGE_ROLE } from '@prisma/client';

@Injectable()
export class StatisticsService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Get the count of enabled bots
     * @param companyId Company ID
     * @returns Count of enabled bots
     */
    public async getEnabledBotsCount(companyId: string): Promise<number> {
        return this.prisma.telegramBot.count({
            where: {
                companyId,
                isEnabled: true,
            },
        });
    }

    /**
     * Get question statistics for a date range
     * @param companyId Company ID
     * @param startDate Start date
     * @param endDate End date
     * @returns Object with admin and telegram question counts, total count and percentage ratios
     */
    public async getQuestionStats(companyId: string, startDate: Date, endDate: Date) {
        const telegram = await this.prisma.telegramMessage.count({
            where: {
                bot: { companyId },
                role: MESSAGE_ROLE.USER,
                createdAt: { gte: startDate, lte: endDate },
            },
        });

        const admin = await this.prisma.chatMessage.count({
            where: {
                chat: {
                    knowledgeBase: { companyId },
                },
                role: MESSAGE_ROLE.USER,
                createdAt: { gte: startDate, lte: endDate },
            },
        });

        const total = admin + telegram;
        const adminPercentage = total > 0 ? Math.round((admin / total) * 100) : 0;
        const telegramPercentage = total > 0 ? Math.round((telegram / total) * 100) : 0;

        return {
            admin,
            telegram,
            total,
            adminPercentage,
            telegramPercentage,
        };
    }

    /**
     * Get user requests by active bot
     * @param companyId Company ID
     * @param startDate Start date
     * @param endDate End date
     * @returns Array of bots with their request counts, sorted by request count in descending order
     */
    public async getUserRequestsByBot(companyId: string, startDate: Date, endDate: Date) {
        const bots = await this.prisma.telegramBot.findMany({
            where: {
                companyId,
                isEnabled: true,
            },
            select: {
                id: true,
                name: true,
                _count: {
                    select: {
                        messages: {
                            where: {
                                role: MESSAGE_ROLE.USER,
                                createdAt: { gte: startDate, lte: endDate },
                            },
                        },
                    },
                },
            },
        });

        return bots
            .map((bot) => ({
                id: bot.id,
                name: bot.name,
                requestCount: bot._count.messages,
            }))
            .sort((a, b) => b.requestCount - a.requestCount);
    }
}
