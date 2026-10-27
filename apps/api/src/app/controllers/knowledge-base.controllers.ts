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
import {
    AddFileToKnowledgeBaseDto,
    ChatListItemDto,
    CreateChatDto,
    CreateKnowledgeBaseDto,
    FileListItemDto,
    KnowledgeBaseDto,
    UpdateKnowledgeBaseDto,
} from '@assistant/prisma';
import { ChatService } from '../services/chat.service';
import { KnowledgeBaseService } from '../services/knowledge-base.service';

@ApiTags('Knowledge Bases')
@Controller('knowledge-bases')
export class KnowledgeBaseControllers {
    constructor(
        private readonly knowledgeBaseService: KnowledgeBaseService,
        private readonly chatService: ChatService,
    ) {}

    @Get()
    @ApiOperation({ summary: 'Get all knowledge bases' })
    @ApiOkResponse({ description: 'List of all knowledge bases', type: [KnowledgeBaseDto] })
    @ApiHeader({
        name: 'company-id',
        description: 'Company ID',
        required: true,
        schema: {
            example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
            type: 'string',
        },
    })
    public async getAllKnowledgeBases(@Headers('company-id') companyId: string) {
        return this.knowledgeBaseService.getAllKnowledgeBases(companyId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get knowledge base by ID' })
    @ApiParam({ name: 'id', description: 'Knowledge base ID', type: String })
    @ApiOkResponse({ description: 'Knowledge base details', type: KnowledgeBaseDto })
    @ApiNotFoundResponse({ description: 'Knowledge base not found' })
    @ApiHeader({
        name: 'company-id',
        description: 'Company ID',
        required: true,
        schema: {
            example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
            type: 'string',
        },
    })
    public async getKnowledgeBaseById(
        @Param('id') id: string,
        @Headers('company-id') companyId: string,
    ) {
        return this.knowledgeBaseService.getKnowledgeBaseById(id, companyId);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new knowledge base' })
    @ApiBody({ type: CreateKnowledgeBaseDto })
    @ApiCreatedResponse({ description: 'Knowledge base created', type: KnowledgeBaseDto })
    @ApiHeader({
        name: 'company-id',
        description: 'Company ID',
        required: true,
        schema: {
            example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
            type: 'string',
        },
    })
    public async createKnowledgeBase(
        @Body() data: CreateKnowledgeBaseDto,
        @Headers('company-id') companyId: string,
    ) {
        return this.knowledgeBaseService.createKnowledgeBase(data, companyId);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a knowledge base' })
    @ApiParam({ name: 'id', description: 'Knowledge base ID', type: String })
    @ApiBody({ type: UpdateKnowledgeBaseDto })
    @ApiOkResponse({ description: 'Knowledge base updated', type: KnowledgeBaseDto })
    @ApiNotFoundResponse({ description: 'Knowledge base not found' })
    @ApiHeader({
        name: 'company-id',
        description: 'Company ID',
        required: true,
        schema: {
            example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
            type: 'string',
        },
    })
    public async updateKnowledgeBase(
        @Param('id') id: string,
        @Body() data: UpdateKnowledgeBaseDto,
        @Headers('company-id') companyId: string,
    ) {
        return this.knowledgeBaseService.updateKnowledgeBase(id, data, companyId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a knowledge base' })
    @ApiParam({ name: 'id', description: 'Knowledge base ID', type: String })
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNotFoundResponse({ description: 'Knowledge base not found' })
    @ApiHeader({
        name: 'company-id',
        description: 'Company ID',
        required: true,
        schema: {
            example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
            type: 'string',
        },
    })
    @ApiResponse({
        status: 204,
        description: 'Knowledge base deleted successfully',
    })
    public async deleteKnowledgeBase(
        @Param('id') id: string,
        @Headers('company-id') companyId: string,
    ) {
        await this.knowledgeBaseService.deleteKnowledgeBase(id, companyId);
    }

    @Get(':id/files')
    @ApiOperation({ summary: 'Get all files from a knowledge base' })
    @ApiParam({ name: 'id', description: 'Knowledge base ID', type: String })
    @ApiOkResponse({ description: 'List of files in the knowledge base', type: [FileListItemDto] })
    @ApiNotFoundResponse({ description: 'Knowledge base not found' })
    @ApiHeader({
        name: 'company-id',
        description: 'Company ID',
        required: true,
        schema: {
            example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
            type: 'string',
        },
    })
    public async getKnowledgeBaseFiles(
        @Param('id') id: string,
        @Headers('company-id') companyId: string,
    ) {
        return this.knowledgeBaseService.getKnowledgeBaseFiles(id, companyId);
    }

    @Post(':id/files')
    @ApiOperation({ summary: 'Add a file to a knowledge base' })
    @ApiParam({ name: 'id', description: 'Knowledge base ID', type: String })
    @ApiBody({ type: AddFileToKnowledgeBaseDto })
    @ApiCreatedResponse({ description: 'File added to knowledge base' })
    @ApiNotFoundResponse({ description: 'Knowledge base or file not found' })
    @ApiHeader({
        name: 'company-id',
        description: 'Company ID',
        required: true,
        schema: {
            example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
            type: 'string',
        },
    })
    public async addFileToKnowledgeBase(
        @Param('id') id: string,
        @Body() data: AddFileToKnowledgeBaseDto,
        @Headers('company-id') companyId: string,
    ) {
        await this.knowledgeBaseService.addFileToKnowledgeBase(id, data.fileId, companyId);
    }

    @Delete(':id/files/:fileId')
    @ApiOperation({ summary: 'Remove a file from a knowledge base' })
    @ApiParam({ name: 'id', description: 'Knowledge base ID', type: String })
    @ApiParam({ name: 'fileId', description: 'File ID', type: String })
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNotFoundResponse({ description: 'Knowledge base or file not found' })
    @ApiHeader({
        name: 'company-id',
        description: 'Company ID',
        required: true,
        schema: {
            example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
            type: 'string',
        },
    })
    @ApiResponse({
        status: 204,
        description: 'File removed from knowledge base successfully',
    })
    public async removeFileFromKnowledgeBase(
        @Param('id') id: string,
        @Param('fileId') fileId: string,
        @Headers('company-id') companyId: string,
    ) {
        await this.knowledgeBaseService.removeFileFromKnowledgeBase(id, fileId, companyId);
    }

    @Get(':id/chats')
    @ApiOperation({ summary: 'Get all chats for a knowledge base' })
    @ApiParam({ name: 'id', description: 'Knowledge base ID', type: String })
    @ApiOkResponse({ description: 'List of chats in the knowledge base', type: [ChatListItemDto] })
    @ApiNotFoundResponse({ description: 'Knowledge base not found' })
    @ApiHeader({
        name: 'company-id',
        description: 'Company ID',
        required: true,
        schema: {
            example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
            type: 'string',
        },
    })
    public async getChats(@Param('id') id: string, @Headers('company-id') companyId: string) {
        return this.knowledgeBaseService.getChats(id, companyId);
    }

    @Post(':id/chats')
    @ApiOperation({
        summary: 'Create a new chat for a knowledge base with initial message',
        description:
            'Creates a new chat with the provided initial message. The chat title is automatically generated as a summary of the initial message. AI response processing starts in the background.',
    })
    @ApiParam({ name: 'id', description: 'Knowledge base ID', type: String })
    @ApiBody({ type: CreateChatDto })
    @ApiCreatedResponse({
        description: 'Chat created with initial message. Returns the chat ID and message ID.',
        schema: {
            type: 'object',
            properties: {
                chatId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                messageId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174001' },
            },
        },
    })
    @ApiNotFoundResponse({ description: 'Knowledge base not found' })
    @ApiHeader({
        name: 'company-id',
        description: 'Company ID',
        required: true,
        schema: {
            example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
            type: 'string',
        },
    })
    public async createChat(
        @Param('id') id: string,
        @Body() data: CreateChatDto,
        @Headers('company-id') companyId: string,
    ): Promise<{ chatId: string; messageId: string }> {
        return this.knowledgeBaseService.createChat(id, companyId, data);
    }

    @Get(':id/bot')
    @ApiOperation({ summary: 'Get the bot associated with a knowledge base' })
    @ApiParam({ name: 'id', description: 'Knowledge base ID', type: String })
    @ApiOkResponse({
        description: 'Bot ID and name, or null if no bot is associated',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                name: { type: 'string', example: 'MyBot' },
            },
            nullable: true,
        },
    })
    @ApiNotFoundResponse({ description: 'Knowledge base not found' })
    @ApiHeader({
        name: 'company-id',
        description: 'Company ID',
        required: true,
        schema: {
            example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
            type: 'string',
        },
    })
    public async getKnowledgeBaseBot(
        @Param('id') id: string,
        @Headers('company-id') companyId: string,
    ) {
        return this.knowledgeBaseService.getKnowledgeBaseBot(id, companyId);
    }
}
