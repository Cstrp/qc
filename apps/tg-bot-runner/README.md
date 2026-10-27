# Telegram Bot Runner

This application is responsible for running and managing Telegram bots stored in the database.

## Features

- Automatically starts all enabled bots on application startup
- Supports both Long Polling (development) and Webhook (production) modes
- Listens to Kafka events for bot status changes
- Integrates with OpenAI for bot responses
- Stores users and messages in the database

## Configuration

The application uses environment variables for configuration:

| Variable | Description | Default |
|----------|-------------|---------|
| `TG_BOT_RUNNER_PORT` | Port for the application | 7252 |
| `TG_BOT_WEBHOOK_MODE` | Use webhook mode if 'true', long polling otherwise | 'false' |
| `TG_BOT_WEBHOOK_DOMAIN` | Domain for webhook URL (required in webhook mode) | - |
| `TG_BOT_WEBHOOK_PATH` | Path for webhook URL | '/telegram-webhook' |
| `TG_BOT_WEBHOOK_PORT` | Port for webhook server | 7252 |


## Long Polling vs Webhook

### Long Polling Mode

Long polling is recommended for development. In this mode, the bot connects to Telegram servers and continuously polls for updates.

To use long polling mode, set:
```
TG_BOT_WEBHOOK_MODE=false
```

### Webhook Mode

Webhook mode is recommended for production. In this mode, Telegram servers send updates to your server via HTTP requests.

To use webhook mode, set:
```
TG_BOT_WEBHOOK_MODE=true
TG_BOT_WEBHOOK_DOMAIN=https://your-domain.com
TG_BOT_WEBHOOK_PATH=/telegram-webhook
```

Requirements for webhook mode:
- Your server must be accessible from the internet
- You must have a valid SSL certificate (Telegram only supports HTTPS webhooks)

## Kafka Integration

The application listens to the `telegram-bot-status` Kafka topic for bot status changes. The message format is:

```json
{
  "botId": "uuid",
  "isEnabled": true|false,
  "companyId": "uuid"
}
```

When a message is received:
- If `isEnabled` is `true`, the bot is started
- If `isEnabled` is `false`, the bot is stopped

## Running the Application

```bash
# Development
npm run start:tg-bot-runner

# Production
npm run build:tg-bot-runner
node dist/apps/tg-bot-runner/main.js
```

## Architecture

The application follows the project's Domain-Driven Design architecture and consists of the following components:

- **BotLifecycleService**: Manages the lifecycle of bots (starting, stopping)
- **BotMessageService**: Handles messages from users and integrates with OpenAI
- **KafkaListenerService**: Listens to Kafka events for bot status changes
