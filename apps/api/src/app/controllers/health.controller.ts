import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheckResponse } from '../docs/health.doc';
import { HealthSerivce } from '../services';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthSerivce) {}

    @Get('/check')
    @ApiOperation({
        summary: 'Health Check',
        description:
            'Checks the status of all services (OpenAI, Database) and returns OK if all are running.',
    })
    @ApiOkResponse({
        description: 'All services are operational ',
        type: HealthCheckResponse,
        example: {
            timestamp: 1743168000000,
            openai: { ok: true, message: 'Hello! How can I assist you today?' },
            database: { ok: true, message: 'Database is up and running' },
            kafkaStatus: { ok: true, message: 'Kafka is up and running' },
            uptime: 1234.56789,
        },
    })
    @ApiResponse({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        description: 'One or more services are not operational',
        type: HealthCheckResponse,
        example: {
            timestamp: 1743168000000,
            openai: { ok: false, error: 'OpenAI API key is not set or country is not supported' },
            database: { ok: false, error: 'Database connection failed' },
            kafkaStatus: { ok: false, error: 'Kafka connection failed' },
            uptime: 1234.56789,
        },
    })
    public healthCheck() {
        return this.healthService.healthCheck();
    }
}
