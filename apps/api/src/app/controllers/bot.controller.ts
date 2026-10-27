import { BotListItemDto, CreateBotDto, UpdateBotDto } from '@assistant/prisma';
import {
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
} from '@nestjs/common';
import {
    ApiBody,
    ApiCreatedResponse,
    ApiHeader,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { BotService } from '../services';

@ApiTags('Telegram Bots')
@Controller('bots')
export class BotController {
    constructor(private readonly botApiService: BotService) {}

    @Get()
    @ApiOperation({
        summary: 'Get all Telegram bots',
        description: 'Retrieves a list of all Telegram bots.',
    })
    @ApiOkResponse({
        description: 'Successfully retrieved bots',
        type: [BotListItemDto],
        schema: {
            example: [
                {
                    id: 'b8f51b34-e227-46d7-9759-b5fd2eacd919',
                    name: 'CustomerSupportBot',
                    token: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
                    status: 'ONLINE',
                    isEnabled: true,
                    knowledgeBaseName: 'CustomerSupportBot Knowledge Base',
                    userCount: 3,
                },
            ],
        },
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
    public getBots(@Headers('company-id') companyId: string) {
        return this.botApiService.getBots(companyId);
    }

    @Get('unused')
    @ApiOperation({
        summary: 'Get all unused Telegram bots',
        description:
            'Retrieves a list of all Telegram bots that are not assigned to any knowledge base.',
    })
    @ApiOkResponse({
        description: 'Successfully retrieved unused bots',
        type: [BotListItemDto],
        schema: {
            example: [
                {
                    id: 'b8f51b34-e227-46d7-9759-b5fd2eacd919',
                    name: 'UnusedBot',
                },
            ],
        },
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
    public getUnusedBots(@Headers('company-id') companyId: string) {
        return this.botApiService.getUnusedBots(companyId);
    }

    @Post()
    @ApiOperation({
        summary: 'Create a Telegram bot',
        description: 'Creates a new Telegram bot',
    })
    @ApiBody({ type: CreateBotDto, description: 'Payload to create a new Telegram bot' })
    @ApiCreatedResponse({
        description: 'Bot successfully created',
        example: {
            id: 'f8cc0ee5-e156-475e-8526-f856ba1fb6b4',
            token: '556677889:AAV_FAKE_TOKEN_EXAMPLE4yuiTREWQplmoknj',
            name: 'PolicyGuideBot',
            status: 'ONLINE',
            isEnabled: true,
            allowedUsernames: ['john_doe', 'jane_smith'],
        },
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
    public async createBot(
        @Body() payload: CreateBotDto,
        @Headers('company-id') companyId: string,
    ) {
        return this.botApiService.createBot(companyId, payload);
    }

    @Put(':id')
    @ApiOperation({
        summary: 'Update a Telegram bot',
        description: 'Updates an existing Telegram bot identified by its ID.',
    })
    @ApiParam({
        name: 'id',
        required: true,
        description: 'Unique identifier of the bot to update',
        type: String,
        example: 'f9c77cda-1d24-4848-8ba6-3ea23b3280ad',
    })
    @ApiBody({ type: UpdateBotDto, description: 'Payload to update an existing Telegram bot' })
    @ApiOkResponse({
        description: 'Bot successfully updated',
        example: {
            id: 'b8f51b34-e227-46d7-9759-b5fd2eacd919',
            token: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
            name: 'CustomerSupportBot',
            firstName: 'CustomerSupport',
            username: 'customersupportbot',
            status: 'ONLINE',
            isEnabled: true,
            companyId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        },
    })
    @ApiNotFoundResponse({
        description: 'Bot not found',
        example: {
            message: 'Bot with ID not found',
            error: 'Not Found',
            statusCode: 404,
        },
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
    public async updateBot(
        @Param('id') id: string,
        @Body() payload: Partial<CreateBotDto>,
        @Headers('company-id') companyId: string,
    ) {
        return this.botApiService.updateBot(id, companyId, payload);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Delete a Telegram bot',
        description: 'Deletes a Telegram bot identified by its ID, along with all associated data.',
    })
    @ApiParam({
        name: 'id',
        required: true,
        description: 'Unique identifier of the bot to delete',
        type: String,
        example: 'f9c77cda-1d24-4848-8ba6-3ea23b3280ad',
    })
    @ApiNotFoundResponse({
        description: 'Bot not found',
        example: {
            message: 'Bot with ID not found',
            error: 'Not Found',
            statusCode: 404,
        },
    })
    @ApiResponse({
        status: 204,
        description: 'Bot deleted successfully',
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
    public async deleteBot(
        @Param('id') id: string,
        @Headers('company-id') companyId: string,
    ): Promise<void> {
        await this.botApiService.deleteBot(id, companyId);
    }

    @Get(':id/allowed-usernames')
    @ApiOperation({
        summary: 'Get all allowed usernames for a bot',
        description:
            'Retrieves a list of all usernames allowed to interact with the specified bot.',
    })
    @ApiParam({
        name: 'id',
        required: true,
        description: 'Unique identifier of the bot',
        type: String,
        example: 'b8f51b34-e227-46d7-9759-b5fd2eacd919',
    })
    @ApiOkResponse({
        description: 'Successfully retrieved allowed usernames',
        example: ['john_doe', 'jane_smith', 'alex_johnson'],
    })
    @ApiNotFoundResponse({
        description: 'Bot not found',
        example: {
            message: 'Bot with ID not found',
            error: 'Not Found',
            statusCode: 404,
        },
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
    public async getAllowedUsernames(
        @Param('id') id: string,
        @Headers('company-id') companyId: string,
    ) {
        return this.botApiService.getAllowedUsernames(id, companyId);
    }
}
