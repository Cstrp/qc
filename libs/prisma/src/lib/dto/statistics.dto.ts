import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

/**
 * DTO for the count of enabled bots
 */
export class EnabledBotsCountDto {
  @ApiProperty({
    description: 'Count of enabled bots',
    example: 5,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  count: number;
}

/**
 * DTO for question statistics
 */
export class QuestionStatsDto {
  @ApiProperty({
    description: 'Count of admin questions',
    example: 120,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  admin: number;

  @ApiProperty({
    description: 'Count of telegram questions',
    example: 350,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  telegram: number;

  @ApiProperty({
    description: 'Total count of questions',
    example: 470,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  total: number;

  @ApiProperty({
    description: 'Percentage of admin questions',
    example: 26,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  adminPercentage: number;

  @ApiProperty({
    description: 'Percentage of telegram questions',
    example: 74,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  telegramPercentage: number;
}

/**
 * DTO for bot request statistics
 */
export class BotRequestStatsItemDto {
  @ApiProperty({
    description: 'Bot ID',
    example: 'b8f51b34-e227-46d7-9759-b5fd2eacd919',
    type: String,
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Bot name',
    example: 'CustomerSupportBot',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Count of requests for this bot',
    example: 120,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  requestCount: number;
}
