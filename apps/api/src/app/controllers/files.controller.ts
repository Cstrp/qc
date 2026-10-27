import {
    Controller,
    Delete,
    Get,
    Headers,
    HttpCode,
    HttpStatus,
    Param,
    ParseFilePipeBuilder,
    Post,
    StreamableFile,
    UnprocessableEntityException,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';

import { type File, FileInterceptor } from '@nest-lab/fastify-multer';

import {
    ApiBody,
    ApiConsumes,
    ApiHeader,
    ApiOperation,
    ApiParam,
    ApiProduces,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import {
    FileIdNameDto,
    FileListResponseDto,
    FileUploadResponseDto,
} from '@assistant/prisma';
import { FileService } from '../services/file.service';

@ApiTags('Files')
@Controller('files')
export class FilesController {
    constructor(private readonly fileService: FileService) {}

    @Get()
    @ApiOperation({ summary: 'Get all files' })
    @ApiResponse({
        status: 200,
        description: 'List of files retrieved successfully',
        type: FileListResponseDto,
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
    async getAllFiles(@Headers('company-id') companyId: string): Promise<FileListResponseDto> {
        return this.fileService.getAllFiles(companyId);
    }

    @Post('')
    @ApiOperation({ summary: 'Upload a file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description:
                        'File to upload. Only PDF, TXT, DOC, DOCX formats are allowed. Maximum size: 50MB.',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'File uploaded successfully',
        type: FileUploadResponseDto,
    })
    @UseInterceptors(FileInterceptor('file'))
    @ApiHeader({
        name: 'company-id',
        description: 'Company ID',
        required: true,
        schema: {
            example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
            type: 'string',
        },
    })
    async uploadFile(
        @UploadedFile(
            new ParseFilePipeBuilder().addMaxSizeValidator({ maxSize: 50 * 1024 * 1024 }).build({
                errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            }),
        )
        file: File,
        @Headers('company-id') companyId: string,
    ): Promise<FileUploadResponseDto> {
        const allowedMimeTypes = [
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            const receivedType = file.mimetype || 'unknown';
            const allowedTypes = 'PDF, TXT, DOC, DOCX';

            throw new UnprocessableEntityException(
                `Invalid file type: '${receivedType}'. Please upload a file of one of the following formats: ${allowedTypes}.`,
            );
        }
        return this.fileService.uploadFile(file, companyId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Download a file by ID' })
    @ApiParam({ name: 'id', description: 'File ID' })
    @ApiResponse({
        status: 200,
        description: 'File downloaded successfully',
        schema: {
            type: 'string',
            format: 'binary',
        },
    })
    @ApiProduces('application/octet-stream')
    @ApiHeader({
        name: 'company-id',
        description: 'Company ID',
        required: true,
        schema: {
            example: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
            type: 'string',
        },
    })
    async getFile(
        @Param('id') id: string,
        @Headers('company-id') companyId: string,
    ): Promise<StreamableFile> {
        return this.fileService.getFile(id, companyId);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a file' })
    @ApiParam({ name: 'id', description: 'File ID' })
    @ApiResponse({
        status: 204,
        description: 'File deleted successfully',
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
    async deleteFile(
        @Param('id') id: string,
        @Headers('company-id') companyId: string,
    ): Promise<void> {
        await this.fileService.deleteFile(id, companyId);
    }

    @Get('list')
    @ApiOperation({ summary: 'Get all file IDs and names for a company' })
    @ApiResponse({
        status: 200,
        description: 'List of file IDs and names retrieved successfully',
        type: [FileIdNameDto],
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
    async getFileIdsAndNames(@Headers('company-id') companyId: string): Promise<FileIdNameDto[]> {
        return this.fileService.getFileIdsAndNames(companyId);
    }
}
