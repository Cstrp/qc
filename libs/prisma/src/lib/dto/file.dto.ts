import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FileResponseDto {
    @ApiProperty({ description: 'Unique identifier of the file' })
    id: string;

    @ApiProperty({ description: 'Name of the file' })
    name: string;

    @ApiProperty({ description: 'MIME type of the file' })
    mimeType: string;

    @ApiProperty({ description: 'Size of the file in bytes' })
    size: number;

    @ApiProperty({
        description: 'Status of the file',
        enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    })
    status: string;

    @ApiProperty({ description: 'ID of the company the file belongs to' })
    companyId: string;

    @ApiProperty({ description: 'Date when the file was created' })
    createdAt: Date;

    @ApiProperty({ description: 'Date when the file was last updated' })
    updatedAt: Date;
}

export class FileUploadResponseDto {
    @ApiProperty({ description: 'File information' })
    file: FileResponseDto;
}

export class FileListItemDto {
    @ApiProperty({ description: 'Unique identifier of the file' })
    id: string;

    @ApiProperty({ description: 'Name of the file' })
    name: string;

    @ApiProperty({ description: 'Size of the file in bytes' })
    size: number;

    @ApiProperty({ description: 'Date when the file was created' })
    createdAt: Date;

    @ApiProperty({ description: 'Number of knowledge bases associated with this file' })
    knowledgeBaseCount: number;
}

export class FileListResponseDto {
    @ApiProperty({ description: 'List of files', type: [FileListItemDto] })
    files: FileListItemDto[];
}

export class FileUploadedDto {
    @IsString()
    @IsNotEmpty()
    fileId: string;
}

export class FileIdNameDto {
    @ApiProperty({ description: 'Unique identifier of the file' })
    id: string;

    @ApiProperty({ description: 'Name of the file' })
    name: string;

    @ApiProperty({ description: 'Size of the file in bytes' })
    size: number;
}
