import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsDate,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Min,
} from 'class-validator';

export class KnowledgeBaseListItemDto {
    @IsUUID()
    @ApiProperty({
        description: 'Уникальный идентификатор базы знаний',
        type: String,
        format: 'uuid',
        example: 'f9c77cda-1d24-4848-8ba6-3ea23b3280ad',
    })
    id: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Название базы знаний',
        type: String,
        example: 'Документация компании',
    })
    name: string;

    @IsInt()
    @Min(0)
    @ApiProperty({
        description: 'Количество файлов в базе знаний',
        type: Number,
        example: 5,
    })
    filesCount: number;

    @IsString()
    @IsOptional()
    @ApiPropertyOptional({
        description: 'Название бота, связанного с базой знаний',
        type: String,
        nullable: true,
        example: 'AssistantBot',
    })
    botName: string | null;

    @IsDate()
    @Type(() => Date)
    @ApiProperty({
        description: 'Дата создания базы знаний',
        type: String,
        format: 'date-time',
        example: '2025-03-11T10:00:00Z',
    })
    createdAt: Date;
}

export class KnowledgeBaseDto {
    @IsUUID()
    @ApiProperty({
        description: 'Unique identifier of the knowledge base in UUID format',
        type: String,
        required: false,
        example: 'f9c77cda-1d24-4848-8ba6-3ea23b3280ad',
    })
    id?: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Name of the knowledge base',
        type: String,
        required: true,
        example: 'Company Documentation',
    })
    name: string;

    @IsUUID()
    @IsOptional()
    @ApiPropertyOptional({
        description: 'Optional ID of the bot associated with this knowledge base',
        type: String,
        example: 'f9c77cda-1d24-4848-8ba6-3ea23b3280ad',
    })
    botId?: string;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    @ApiPropertyOptional({
        description: 'Date and time when the knowledge base was created',
        type: String,
        format: 'date-time',
        example: '2025-03-11T10:00:00Z',
    })
    createdAt?: Date;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    @ApiPropertyOptional({
        description: 'Date and time when the knowledge base was last updated',
        type: String,
        format: 'date-time',
        example: '2025-03-11T12:00:00Z',
    })
    updatedAt?: Date;
}

export class CreateKnowledgeBaseDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Name of the knowledge base',
        type: String,
        required: true,
        example: 'Company Documentation',
    })
    name: string;

    @IsUUID()
    @IsOptional()
    @ApiPropertyOptional({
        description: 'Optional ID of the bot associated with this knowledge base',
        type: String,
        example: '3ec0c5f4-05b9-4a3f-8103-91356e702b39',
    })
    botId?: string;

    @IsArray()
    @IsUUID('4', { each: true })
    @IsOptional()
    @ApiPropertyOptional({
        description: 'Array of file IDs to associate with this knowledge base',
        type: [String],
        example: ['3ec0c5f4-05b9-4a3f-8103-91356e702b39', '98cd2243-d8f6-4724-9d53-020445644068'],
    })
    fileIds?: string[];
}

export class UpdateKnowledgeBaseDto extends PartialType(CreateKnowledgeBaseDto) {}

export class AddFileToKnowledgeBaseDto {
    @IsUUID()
    @IsNotEmpty()
    @ApiProperty({
        description: 'ID of the file to add to the knowledge base',
        type: String,
        required: true,
        example: 'f9c77cda-1d24-4848-8ba6-3ea23b3280ad',
    })
    fileId: string;
}
