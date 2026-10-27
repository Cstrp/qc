import {
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    HttpCode,
    HttpStatus,
    Logger,
    Param,
    Post,
    Sse,
} from '@nestjs/common';
import {
    ApiHeader,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import {
    ChatDto,
    ChatMessageDto,
    CreateChatMessageDto,
    MessageRole,
} from '@assistant/prisma';
import { Observable } from 'rxjs';
import { ChatService } from '../services/chat.service';

@ApiTags('Chats & Messaging')
@Controller('chats')
export class ChatsController {
    private readonly logger = new Logger(ChatsController.name);

    constructor(private readonly chatService: ChatService) {}

    @Get(':chatId')
    @ApiOperation({ summary: 'Get a chat by ID' })
    @ApiParam({ name: 'chatId', description: 'Chat ID', type: String })
    @ApiOkResponse({ description: 'Chat details with messages', type: ChatDto })
    @ApiNotFoundResponse({ description: 'Chat not found' })
    @ApiHeader({
        name: 'company-id',
        description: 'Company ID',
        required: true,
        schema: {
            example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
            type: 'string',
        },
    })
    public async getChatById(
        @Param('chatId') chatId: string,
        @Headers('company-id') companyId: string,
    ) {
        return this.chatService.getChatById(chatId, companyId);
    }

    @Delete(':chatId')
    @ApiOperation({ summary: 'Delete a chat' })
    @ApiParam({ name: 'chatId', description: 'Chat ID', type: String })
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNotFoundResponse({ description: 'Chat not found' })
    @ApiResponse({
        status: 204,
        description: 'Chat deleted successfully',
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
    public async deleteChat(
        @Param('chatId') chatId: string,
        @Headers('company-id') companyId: string,
    ) {
        await this.chatService.deleteChat(chatId, companyId);
    }

    @Get(':chatId/messages')
    @ApiOperation({ summary: 'Get all messages for a chat' })
    @ApiParam({ name: 'chatId', description: 'Chat ID', type: String })
    @ApiOkResponse({ description: 'List of messages in the chat', type: [ChatMessageDto] })
    @ApiNotFoundResponse({ description: 'Chat not found' })
    @ApiHeader({
        name: 'company-id',
        description: 'Company ID',
        required: true,
        schema: {
            example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
            type: 'string',
        },
    })
    public async getChatMessages(
        @Param('chatId') chatId: string,
        @Headers('company-id') companyId: string,
    ) {
        return this.chatService.getChatMessages(chatId, companyId);
    }

    @Post(':chatId/messages')
    @ApiOperation({ summary: 'Create a new message in a chat' })
    @ApiParam({ name: 'chatId', description: 'Chat ID', type: String })
    @ApiOkResponse({ description: 'Created message', type: ChatMessageDto })
    @ApiNotFoundResponse({ description: 'Chat not found' })
    @ApiHeader({
        name: 'company-id',
        description: 'Company ID',
        required: true,
        schema: {
            example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
            type: 'string',
        },
    })
    public async createChatMessage(
        @Param('chatId') chatId: string,
        @Headers('company-id') companyId: string,
        @Body() messageDto: CreateChatMessageDto,
    ) {
        const messageWithUserRole = {
            text: messageDto.text,
            role: MessageRole.USER,
        };
        return this.chatService.addMessageToChat(chatId, companyId, messageWithUserRole);
    }

    @Get(':chatId/completion/:messageId/:companyId')
    @ApiOperation({
        summary: 'Stream AI response for a given message ID',
        description:
            'Uses the message with the provided ID and streams the AI response using Server-Sent Events (SSE).',
    })
    @ApiParam({ name: 'chatId', description: 'Chat ID', type: String })
    @ApiParam({ name: 'messageId', description: 'ID of the message to process', type: String })
    @ApiParam({ name: 'companyId', description: 'Company ID', type: String })
    @ApiOkResponse({
        description: 'Streaming AI response to the provided message',
        type: ChatMessageDto,
    })
    @ApiNotFoundResponse({ description: 'Chat or message not found' })
    @Sse()
    public async streamCompletion(
        @Param('chatId') chatId: string,
        @Param('messageId') messageId: string,
        @Param('companyId') companyId: string,
    ): Promise<Observable<{ data: string }>> {
        this.logger.log(`Streaming AI completion for chat ${chatId} with message ID ${messageId}`);
        return this.chatService.streamResponse(chatId, companyId, messageId);
    }
}
