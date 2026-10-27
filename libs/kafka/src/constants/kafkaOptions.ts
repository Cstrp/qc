export const KAFKA_OPTIONS = {
    SERVICE_INJECTION_TOKEN: 'FILE_PROCESSOR_SERVICE',
    TOPIC: 'file-uploaded',
    BOT_STATUS_TOPIC: 'telegram-bot-status',
    BROKERS: ['localhost:9092'],
    API_PRODUCER: {
        CLIENT_ID: 'api-producer-client',
    },
    FILE_PROCESSOR_CONSUMER: {
        CLIENT_ID: 'file-processor-consumer-client',
        GROUP_ID: 'file-processor-group',
    },
    TG_BOT_RUNNER_CONSUMER: {
        CLIENT_ID: 'tg-bot-runner-consumer-client',
        GROUP_ID: 'tg-bot-runner-group',
    },
};
