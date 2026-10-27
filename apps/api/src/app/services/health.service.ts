import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatOpenAI } from '@langchain/openai';
import { KAFKA_OPTIONS } from '@assistant/kafka';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka } from 'kafkajs';
import { Pool } from 'pg';

@Injectable()
export class HealthSerivce {
    private readonly logger: Logger = new Logger(HealthSerivce.name);

    constructor(private readonly cfg: ConfigService) {}

    public async healthCheck() {
        const openaiStatus = await this.checkOpenAI();
        const databaseStatus = await this.checkDatabase();
        const kafkaStatus = await this.checkKafka();

        const health: Record<string, unknown> = {
            timestamp: Date.now(),
            openai: openaiStatus,
            database: databaseStatus,
            kafkaStatus: kafkaStatus,
            uptime: process.uptime(),
        };

        return { ...health };
    }

    private async checkOpenAI(): Promise<{ ok: boolean; message?: string; error?: string }> {
        try {
            const apiKey = this.cfg.get<string>('OPENAI_API_KEY');

            if (!apiKey) {
                return { ok: false, error: 'OpenAI API key is not set' };
            }

            const chat = new ChatOpenAI({ apiKey, model: 'gpt-3.5-turbo' });

            const response = await chat
                .pipe(new StringOutputParser())
                .invoke(['Hello world! Please provide short answer...']);

            return { ok: true, message: response };
        } catch (error) {
            return { ok: false, error: error.message };
        }
    }

    private async checkDatabase(): Promise<{ ok: boolean; message?: string; error?: string }> {
        try {
            const connectionString = this.cfg.get<string>('DATABASE_URL');
            const pool = new Pool({ connectionString });
            const client = await pool.connect();

            client.release();

            return { ok: true, message: 'Database is up and running' };
        } catch (error) {
            return { ok: false, error: error.message };
        }
    }

    private async checkKafka(): Promise<{ ok: boolean; message?: string; error?: string }> {
        try {
            const brokers = [...KAFKA_OPTIONS.BROKERS];
            const clientId = KAFKA_OPTIONS.API_PRODUCER.CLIENT_ID;

            const kafka = new Kafka({ clientId, brokers });

            const admin = kafka.admin();

            await admin.connect();

            const topics = await admin.listTopics();

            await admin.disconnect();

            return { ok: true, message: `Kafka is up and running. Topics: ${topics.join(', ')}` };
        } catch (error) {
            return { ok: false, error: error.message };
        }
    }
}
