import { PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString, IsUUID } from 'class-validator';

export class EmbeddingsDto {
    @IsUUID()
    id?: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsObject()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: Record<string, any>;

    @IsString()
    @IsNotEmpty()
    checksum: string;
}

export class CreateEmbeddingsDto extends EmbeddingsDto {}

export class UpdateEmbeddingsDto extends PartialType(EmbeddingsDto) {}
