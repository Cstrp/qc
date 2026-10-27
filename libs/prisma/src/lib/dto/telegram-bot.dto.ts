import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';
import { BOT_STATUS } from '@prisma/client';

export class CreateBotDto {
    @ApiProperty({
        description: 'Name of the bot',
        example: 'SynAi test bot',
        type: String,
    })
    @IsString()
    @MaxLength(255)
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Telegram token for the bot',
        example: '7679249554:AAF33IvjcKcox2hjoCyApqBK8Gk_PK2xocI',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiPropertyOptional({
        description: 'Whether the bot is enabled',
        example: true,
        type: Boolean,
        default: true,
    })
    @IsBoolean()
    @IsOptional()
    isEnabled?: boolean;

    @ApiPropertyOptional({
        description: 'Array of usernames allowed to interact with the bot (without @)',
        example: ['john_doe', 'jane_smith'],
        type: [String],
    })
    @IsString({ each: true })
    @IsOptional()
    allowedUsernames?: string[];
}

export class CreateBotDtoResponse extends CreateBotDto {
    @ApiProperty({
        description: 'Unique bot identifier (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @IsUUID()
    @IsNotEmpty()
    id: string;
}

export class UpdateBotDto {
    @ApiPropertyOptional({
        description: 'Name of the bot',
        example: 'ProductInfoBotRenamed',
        type: String,
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({
        description: 'Whether the bot is enabled',
        example: true,
        type: Boolean,
    })
    @IsBoolean()
    @IsOptional()
    isEnabled?: boolean;

    @ApiPropertyOptional({
        description: 'Array of usernames allowed to interact with the bot (without @)',
        example: ['john_doe', 'jane_smith'],
        type: [String],
    })
    @IsString({ each: true })
    @IsOptional()
    allowedUsernames?: string[];
}

export class CreateAllowedUserDto {
    @ApiProperty({
        description: 'Username of the allowed user (without @)',
        example: 'john_doe',
    })
    @IsString()
    @IsNotEmpty()
    username: string;
}

export class BotListItemDto {
    @ApiProperty({
        description: 'Unique bot identifier (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000',
        type: String,
    })
    @IsUUID()
    @IsNotEmpty()
    id: string;

    @ApiProperty({
        description: 'Bot name',
        example: 'MyBot',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Telegram bot token',
        example: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({
        description: 'Is the bot active',
        example: true,
        type: Boolean,
    })
    @IsBoolean()
    @IsNotEmpty()
    isEnabled: boolean;

    @ApiProperty({
        description: 'Current status of the bot',
        example: 'ONLINE',
        enum: ['ONLINE', 'OFFLINE'],
    })
    @IsString()
    @IsNotEmpty()
    status: string;

    @ApiProperty({
        description: 'Name of the knowledge base associated with the bot',
        example: 'My Knowledge Base',
        type: String,
        nullable: true,
    })
    @IsString()
    @IsOptional()
    knowledgeBaseName: string | null;

    @ApiProperty({
        description: 'Number of users who interacted with the bot',
        example: 42,
        type: Number,
    })
    @IsNumber()
    @IsNotEmpty()
    userCount: number;
}

export class BotStatusChangeDto {
    /**
     * The ID of the bot
     */
    @IsString()
    @IsNotEmpty()
    botId: string;

    /**
     * The status of the bot (ONLINE or OFFLINE)
     */
    @IsEnum(BOT_STATUS)
    status: BOT_STATUS;

    /**
     * The ID of the company that owns the bot
     */
    @IsString()
    @IsNotEmpty()
    companyId: string;
}
