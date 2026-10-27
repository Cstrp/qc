import { NestFastifyApplication } from '@nestjs/platform-fastify';

export const shutdown = async (app: NestFastifyApplication, signal: string) => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);

    try {
        await app.close();
        console.log('Application shutdown completed successfully');
        process.exit(0);
    } catch (error) {
        console.error(`Error during shutdown: ${error}`);
        process.exit(1);
    }
};
