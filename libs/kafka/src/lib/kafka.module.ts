import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KAFKA_OPTIONS } from '../constants';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: KAFKA_OPTIONS.SERVICE_INJECTION_TOKEN,
                transport: Transport.KAFKA,
                options: {
                    client: {
                        clientId: KAFKA_OPTIONS.API_PRODUCER.CLIENT_ID,
                        brokers: KAFKA_OPTIONS.BROKERS,
                    },
                    consumer: {
                        groupId: `${KAFKA_OPTIONS.API_PRODUCER.CLIENT_ID}-reply-group`,
                    },
                },
            },
        ]),
    ],
    exports: [ClientsModule],
})
export class KafkaModule {}
