import { Module } from '@nestjs/common';
import { KafkaModule } from '@assistant/kafka';
import { PrismaModule } from '@assistant/prisma';
import { S3Module } from '@assistant/s3';
import { FileProcessorService } from './services/file-processor.service';
import { KafkaController } from './controllers/kafka.controller';

@Module({
  imports: [
    KafkaModule,
    PrismaModule,
    S3Module,
  ],
  controllers: [KafkaController],
  providers: [FileProcessorService],
})
export class AppModule {}
