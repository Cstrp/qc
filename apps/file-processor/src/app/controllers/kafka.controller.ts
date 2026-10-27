import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FileProcessorService } from '../services/file-processor.service';
import { KAFKA_OPTIONS } from '@assistant/kafka';
import { FileUploadedDto } from '@assistant/prisma';

@Controller()
export class KafkaController {
    private readonly logger = new Logger(KafkaController.name);

    constructor(private readonly fileProcessorService: FileProcessorService) {}

    @MessagePattern(KAFKA_OPTIONS.TOPIC)
    async handleFileUploaded(@Payload() data: FileUploadedDto): Promise<any> {
        try {
            await this.fileProcessorService.processFile(data.fileId);

            this.logger.log(`File processed successfully: ${data.fileId}`);
            return {
                fileId: data.fileId,
                status: 'COMPLETED',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            this.logger.error(
                `Error processing file-uploaded event: ${error.message}`,
                error.stack,
            );
            return {
                fileId: data.fileId,
                status: 'FAILED',
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }
}
