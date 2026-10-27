/**
 * Telegram Bot Runner Application
 * This application is responsible for running and managing Telegram bots stored in the database.
 * It uses NestJS microservices to consume Kafka messages.
 */

import { shutdown, WinstonLogger } from '@assistant/shared';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { KAFKA_OPTIONS } from '@assistant/kafka';

const bootstrap = async () => {
    const adapter = new FastifyAdapter();
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
        logger: new WinstonLogger(),
    });

    const configService = app.get<ConfigService>(ConfigService);
    const port = configService.get<number>('TG_BOT_RUNNER_PORT') ?? 5735;
    const isProduction = configService.get('NODE_ENV') === 'production';

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.KAFKA,
        options: {
            client: {
                clientId: KAFKA_OPTIONS.TG_BOT_RUNNER_CONSUMER.CLIENT_ID,
                brokers: KAFKA_OPTIONS.BROKERS,
            },
            consumer: {
                groupId: KAFKA_OPTIONS.TG_BOT_RUNNER_CONSUMER.GROUP_ID,
            },
        },
    });

    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    await app.startAllMicroservices();

    Logger.log('Kafka microservice is running');

    Logger.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
    Logger.log(
        `Bot mode: ${configService.get('TG_BOT_WEBHOOK_MODE') === 'true' ? 'Webhook' : 'Long Polling'}`,
    );

    await app.listen(port, '0.0.0.0');
    Logger.log(`🚀 Telegram Bot Runner is running on: http://localhost:${port}`);

    process.on('SIGINT', () => shutdown(app, 'SIGINT'));
    process.on('SIGTERM', () => shutdown(app, 'SIGTERM'));
};

bootstrap();
