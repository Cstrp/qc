# S3 Library

This library provides a service for interacting with S3-compatible object storage.

## Features

- Upload files to S3
- Upload local files to S3
- Get files from S3
- Delete files from S3
- Get S3 URLs for files

## Usage

Import the `S3Module` in your application:

```typescript
import { S3Module } from '@assistant/s3';

@Module({
  imports: [S3Module],
})
export class AppModule {}
```

Then inject the `S3Service` in your services or controllers:

```typescript
import { S3Service } from '@assistant/s3';

@Injectable()
export class MyService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadFile(file: File): Promise<string> {
    return this.s3Service.uploadFile(file);
  }
}
```

## Configuration

The S3 service uses the following environment variables:

- `S3_ENDPOINT`: The endpoint URL of the S3 service
- `AWS_REGION`: The AWS region (default: 'eu-central-1')
- `AWS_ACCESS_KEY_ID`: The AWS access key ID (default: 'minioadmin')
- `AWS_SECRET_ACCESS_KEY`: The AWS secret access key (default: 'minioadmin123')
- `S3_BUCKET`: The S3 bucket name (default: 'assistant')
