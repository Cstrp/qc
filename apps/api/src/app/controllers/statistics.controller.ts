import { Controller, Get, Headers, ParseDatePipe, Query } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
    BotRequestStatsItemDto,
    EnabledBotsCountDto,
    QuestionStatsDto,
} from '@assistant/prisma';
import { StatisticsService } from '../services/statistics.service';

@ApiTags('Statistics')
@Controller('statistics')
export class StatisticsController {
    constructor(private readonly statisticsService: StatisticsService) {}

    @Get('bots')
    @ApiOperation({
        summary: 'Get count of enabled bots',
        description: 'Returns the count of bots where isEnabled is true.',
    })
    @ApiOkResponse({
        description: 'Successfully retrieved enabled bots count',
        type: EnabledBotsCountDto,
    })
    @ApiHeader({
        name: 'company-id',
        description: 'Company ID',
        required: true,
        schema: {
            example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
            type: 'string',
        },
    })
    public async getEnabledBotsCount(
        @Headers('company-id') companyId: string,
    ): Promise<EnabledBotsCountDto> {
        const count = await this.statisticsService.getEnabledBotsCount(companyId);
        return { count };
    }

    @Get('questions')
    @ApiOperation({
        summary: 'Get question statistics for a date range',
        description:
            'Returns the count of user messages for both telegram and admin chats within a date range, along with total count and percentage ratios.',
    })
    @ApiOkResponse({
        description: 'Successfully retrieved question statistics',
        type: QuestionStatsDto,
    })
    @ApiHeader({
        name: 'company-id',
        description: 'Company ID',
        required: true,
        schema: {
            example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
            type: 'string',
        },
    })
    @ApiQuery({
        name: 'startDate',
        description: 'Start date for the statistics (ISO format)',
        required: true,
        type: String,
        example: '2025-01-01T00:00:00.000Z',
    })
    @ApiQuery({
        name: 'endDate',
        description: 'End date for the statistics (ISO format)',
        required: true,
        type: String,
        example: new Date().toISOString(),
    })
    public async getQuestionStats(
        @Headers('company-id') companyId: string,
        @Query('startDate', new ParseDatePipe()) startDate: Date,
        @Query('endDate', new ParseDatePipe()) endDate: Date,
    ): Promise<QuestionStatsDto> {
        return this.statisticsService.getQuestionStats(companyId, startDate, endDate);
    }

    @Get('requests')
    @ApiOperation({
        summary: 'Get user requests by active bot for a date range',
        description: 'Returns a list of active bots with their user request counts.',
    })
    @ApiOkResponse({
        description: 'Successfully retrieved user requests by bot',
        type: [BotRequestStatsItemDto],
    })
    @ApiHeader({
        name: 'company-id',
        description: 'Company ID',
        required: true,
        schema: {
            example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
            type: 'string',
        },
    })
    @ApiQuery({
        name: 'startDate',
        description: 'Start date for the statistics (ISO format)',
        required: true,
        type: String,
        example: '2025-01-01T00:00:00.000Z',
    })
    @ApiQuery({
        name: 'endDate',
        description: 'End date for the statistics (ISO format)',
        required: true,
        type: String,
        example: new Date().toISOString(),
    })
    public async getUserRequestsByBot(
        @Headers('company-id') companyId: string,
        @Query('startDate', new ParseDatePipe()) startDate: Date,
        @Query('endDate', new ParseDatePipe()) endDate: Date,
    ): Promise<BotRequestStatsItemDto[]> {
        return this.statisticsService.getUserRequestsByBot(companyId, startDate, endDate);
    }
}
