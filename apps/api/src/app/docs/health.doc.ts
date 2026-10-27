import { ApiProperty } from '@nestjs/swagger';

class ServiceStatus {
    @ApiProperty({
        description: 'Indicates if the service is operational',
        type: Boolean,
        example: true,
    })
    ok: boolean;

    @ApiProperty({
        description: 'Optional success message or additional info',
        type: String,
        required: false,
        example: 'Service is running',
    })
    message?: string;

    @ApiProperty({
        description: 'Optional error message if the service is not operational',
        type: String,
        required: false,
        example: 'Service is not responding',
    })
    error?: string;
}

export class HealthCheckResponse {
    @ApiProperty({
        description: 'Timestamp of the health check in milliseconds (Unix timestamp)',
        type: Number,
        example: 1743168000000,
    })
    timestamp: number;

    @ApiProperty({
        description: 'Status of the OpenAI service',
        type: ServiceStatus,
    })
    openai: ServiceStatus;

    @ApiProperty({
        description: 'Status of the database service',
        type: ServiceStatus,
    })
    database: ServiceStatus;

    @ApiProperty({
        description: 'Status of the kafka service',
        type: ServiceStatus,
    })
    kafkaStatus: ServiceStatus;

    @ApiProperty({
        description: 'Uptime of the application in seconds',
        type: Number,
        example: 1234.56,
    })
    uptime: number;
}
