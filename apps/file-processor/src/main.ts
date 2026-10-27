import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { KAFKA_OPTIONS } from '@assistant/kafka';

async function bootstrap() {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.KAFKA,
        options: {
            client: {
                brokers: KAFKA_OPTIONS.BROKERS,
                clientId: KAFKA_OPTIONS.FILE_PROCESSOR_CONSUMER.CLIENT_ID,
            },
            consumer: {
                groupId: KAFKA_OPTIONS.FILE_PROCESSOR_CONSUMER.GROUP_ID,
                sessionTimeout: 120_000,
                rebalanceTimeout: 180_000,
            },
        },
    });

    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    await app.listen();

    Logger.log('📨 Kafka microservice is listening for messages');
}

bootstrap();
