/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import compression from '@fastify/compress';
import multipart from '@fastify/multipart';
import { shutdown, WinstonLogger } from '@assistant/shared';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

const applyAppConfig = async (app: NestFastifyApplication) => {
    const configService = app.get<ConfigService>(ConfigService);
    const isProduction = configService.get('NODE_ENV') === 'production';

    const servers = [
        {
            url: 'http://localhost:7250/',
            description: 'Local Server (localhost)',
        },
        {
            url: '',
            description: 'Development Environment (AWS)',
        },
    ];

    if (isProduction) {
        servers.reverse();
    }

    let config = new DocumentBuilder()
        .setTitle('AI Assistant API')
        .setDescription('This is the API documentation for the AI Assistant.')
        .setVersion('1.0');

    servers.forEach((server) => {
        config = config.addServer(server.url, server.description);
    });

    const document = SwaggerModule.createDocument(app as INestApplication, config.build());

    SwaggerModule.setup('api/v1/docs', app as INestApplication, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
        customSiteTitle: 'AI Assistant API Docs',
    });

    app.getHttpAdapter().get('/api/v1/swagger.json', (request, reply) => {
        reply
            .type('application/json')
            .header('Content-Disposition', 'attachment; filename="swagger.json"')
            .send(JSON.stringify(document, null, 2));
    });

    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.enableShutdownHooks(['SIGINT', 'SIGTERM']);
    app.enableCors({ origin: '*', methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'] });
    app.setGlobalPrefix('api/v1');
    app.enableVersioning();

    await app.register(compression, {
        encodings: ['gzip', 'deflate'],
        threshold: 1024,
        inflateIfDeflated: true,
        zlibOptions: { level: 4 },
    });

    await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });
};

const bootstrap = async () => {
    const adapter = new FastifyAdapter();
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
        logger: new WinstonLogger(),
    });

    const globalPrefix = 'api/v1';
    app.setGlobalPrefix(globalPrefix);

    await applyAppConfig(app);

    const cfg = app.get<ConfigService>(ConfigService);
    const port = cfg.get<number>('PORT') ?? 7250;

    await app.listen(port, '0.0.0.0');
    Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);

    process.on('SIGINT', () => shutdown(app, 'SIGINT'));
    process.on('SIGTERM', () => shutdown(app, 'SIGTERM'));
};

bootstrap();
