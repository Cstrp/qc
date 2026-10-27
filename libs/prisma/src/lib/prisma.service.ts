import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { formatArgs } from './utils/formatArgs';

interface PrismaServiceConfig {
    databaseUrl: string;
    connectionLimit?: number;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger: Logger = new Logger(PrismaService.name);
    private readonly config: PrismaServiceConfig;

    constructor(configService: ConfigService) {
        const databaseUrl = configService.get<string>('DATABASE_URL');

        if (!databaseUrl) {
            throw new Error('DATABASE_URL is not defined in environment variables');
        }

        const connectionLimit = configService.get<number>('DATABASE_CONNECTION_LIMIT', 10);
        const adjustedDatabaseUrl = `${databaseUrl}?connection_limit=${connectionLimit}`;

        super({
            log: [
                { emit: 'event', level: 'query' },
                { emit: 'stdout', level: 'info' },
                { emit: 'stdout', level: 'warn' },
                { emit: 'stdout', level: 'error' },
            ],
            datasources: { db: { url: adjustedDatabaseUrl } },
        });

        this.config = { databaseUrl: adjustedDatabaseUrl, connectionLimit };

        this.extendWithQueryLogging();
    }

    private extendWithQueryLogging(): void {
        Object.assign(
            this,
            this.$extends({
                query: {
                    $allModels: {
                        async $allOperations({ operation, model, args, query }) {
                            const startTime = performance.now();
                            try {
                                const result = await query(args);
                                const duration = performance.now() - startTime;

                                Logger.debug(
                                    `[DB] ${model}.${operation} | Duration: ${duration.toFixed(
                                        2,
                                    )}ms | Args: ${formatArgs(args)}`,
                                );
                                return result;
                            } catch (error) {
                                Logger.error(
                                    `[DB] ${model}.${operation} failed | Error: ${error} | Args: ${formatArgs(
                                        args,
                                    )}`,
                                );
                                throw error;
                            }
                        },
                    },
                },
            }),
        );
    }

    public async onModuleInit(): Promise<void> {
        this.logger.log('[DATABASE] Initializing connection...');
        try {
            await this.$connect();
            this.logger.log(
                `[DATABASE] Connected successfully | Pool size: ${this.config.connectionLimit}`,
            );
        } catch (error) {
            this.logger.error(`[DATABASE] Connection failed | Error: ${error}`);
            throw error;
        }
    }

    public async onModuleDestroy(): Promise<void> {
        this.logger.log('[DATABASE] Disconnecting...');
        try {
            await this.$disconnect();
            this.logger.log('[DATABASE] Disconnected successfully');
        } catch (error) {
            this.logger.error(`[DATABASE] Disconnection failed | Error: ${error}`);
            throw error;
        }
    }

    public getConfig(): PrismaServiceConfig {
        return { ...this.config };
    }
}
