import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export enum MessageRole {
    USER = 'USER',
    ASSISTANT = 'ASSISTANT',
}

export class ChatMessageDto {
    @IsUUID()
    @ApiProperty({
        description: 'Unique identifier of the chat message',
        type: String,
        format: 'uuid',
        example: 'f9c77cda-1d24-4848-8ba6-3ea23b3280ad',
    })
    id: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Text content of the message',
        type: String,
        example: 'When did the company release version 5.1 of the API?',
    })
    text: string;

    @IsEnum(MessageRole)
    @ApiProperty({
        description: 'Role of the message sender',
        enum: MessageRole,
        example: MessageRole.USER,
    })
    role: MessageRole;

    @IsUUID()
    @ApiProperty({
        description: 'ID of the chat this message belongs to',
        type: String,
        format: 'uuid',
        example: 'f9c77cda-1d24-4848-8ba6-3ea23b3280ad',
    })
    chatId: string;

    @IsDate()
    @Type(() => Date)
    @ApiProperty({
        description: 'Date and time when the message was created',
        type: String,
        format: 'date-time',
        example: '2025-03-11T10:00:00Z',
    })
    createdAt: Date;

    @IsDate()
    @Type(() => Date)
    @ApiProperty({
        description: 'Date and time when the message was last updated',
        type: String,
        format: 'date-time',
        example: '2025-03-11T12:00:00Z',
    })
    updatedAt: Date;
}

export class CreateChatMessageWithRoleDto {
    @IsString()
    @IsNotEmpty()
    text: string;

    @IsEnum(MessageRole)
    role: MessageRole;
}

export class CreateChatMessageDto {
    @IsString()
    @IsNotEmpty()
    text: string;
}

export class ChatDto {
    @IsUUID()
    @ApiProperty({
        description: 'Unique identifier of the chat',
        type: String,
        format: 'uuid',
        example: 'f9c77cda-1d24-4848-8ba6-3ea23b3280ad',
    })
    id: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Title of the chat',
        type: String,
        example: 'Support Chat',
    })
    title: string;

    @IsUUID()
    @ApiProperty({
        description: 'ID of the knowledge base this chat belongs to',
        type: String,
        format: 'uuid',
        example: 'f9c77cda-1d24-4848-8ba6-3ea23b3280ad',
    })
    knowledgeBaseId: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'ID of the user who owns this chat',
        type: String,
        example: 'f9c77cda-1d24-4848-8ba6-3ea23b3280ad',
    })
    userId: string;

    @IsDate()
    @Type(() => Date)
    @ApiProperty({
        description: 'Date and time when the chat was created',
        type: String,
        format: 'date-time',
        example: '2025-03-11T10:00:00Z',
    })
    createdAt: Date;

    @IsDate()
    @Type(() => Date)
    @ApiProperty({
        description: 'Date and time when the chat was last updated',
        type: String,
        format: 'date-time',
        example: '2025-03-11T12:00:00Z',
    })
    updatedAt: Date;

    @IsArray()
    @IsOptional()
    @ApiPropertyOptional({
        description: 'Messages in this chat',
        type: [ChatMessageDto],
        isArray: true,
    })
    messages?: ChatMessageDto[];
}

export class ChatListItemDto {
    @IsUUID()
    @ApiProperty({
        description: 'Unique identifier of the chat',
        type: String,
        format: 'uuid',
        example: 'f9c77cda-1d24-4848-8ba6-3ea23b3280ad',
    })
    id: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Title of the chat',
        type: String,
        example: 'Support Chat',
    })
    title: string;

    @IsDate()
    @Type(() => Date)
    @ApiProperty({
        description: 'Date and time when the chat was created',
        type: String,
        format: 'date-time',
        example: '2025-03-11T10:00:00Z',
    })
    createdAt: Date;

    @IsDate()
    @Type(() => Date)
    @ApiProperty({
        description: 'Date and time when the chat was last updated',
        type: String,
        format: 'date-time',
        example: '2025-03-11T12:00:00Z',
    })
    updatedAt: Date;
}

export class CreateChatDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'ID of the user who owns this chat',
        type: String,
        required: true,
        example: 'f9c77cda-1d24-4848-8ba6-3ea23b3280ad',
    })
    userId: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Initial message to start the chat with',
        type: String,
        required: true,
        example: 'When did the company release version 5.1 of the API?',
    })
    initialMessage: string;
}

export class UpdateChatDto extends PartialType(CreateChatDto) {}
