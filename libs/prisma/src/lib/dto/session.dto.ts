import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum SESSION_TYPE {
    TELEGRAM = 'TELEGRAM',
    WEB = 'WEB',
}

export class SessionDto {
    @IsString()
    @IsOptional()
    key?: string;

    @IsString()
    @IsOptional()
    bot_id?: string;

    @IsString()
    @IsOptional()
    user_id?: string;

    @IsString()
    @IsOptional()
    document_id?: string;

    @IsString()
    @IsOptional()
    question?: string;

    @IsString()
    @IsOptional()
    answer?: string;

    @IsString()
    @IsOptional()
    from_id?: string;

    @IsString()
    @IsOptional()
    source?: string;

    @IsOptional()
    is_edited?: boolean;

    @IsEnum(SESSION_TYPE)
    @IsNotEmpty()
    type: SESSION_TYPE;

    @IsString()
    @IsNotEmpty()
    name: string;
}

export class CreateSessionDto extends SessionDto {}

export class UpdateSessionDto extends PartialType(SessionDto) {}
