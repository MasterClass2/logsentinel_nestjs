# LogSentinel NestJS SDK

Logging middleware for NestJS applications. Captures HTTP requests and responses, batches them asynchronously, and sends to a remote monitoring  for analysis.

## Features

- **Zero Impact**: Never crashes or blocks your application
- **Async Batching**: High-performance batch processing (default: 5 logs per batch)
- **Graceful Shutdown**: Flushes all pending logs before exit
- **Debug Mode**: Beautiful colorized console output for development
- **Type-Safe**: Full TypeScript support with strict typing
- **Production Ready**: Fail-safe error handling and retry logic

## Installation

```bash
npm install logsentinel-nestjs
```

## Quick Start

### 1. Set Environment Variables

Create a `.env` file in your project root:

```env
LOGSENTINEL_API_KEY=your_api_key_here
LOGSENTINEL_BASE_URL=https://your-monitoring-server.com
LOGSENTINEL_DEBUG=true
```

### 2. Initialize SDK in `main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LogSentinelSDK } from 'logsentinel-nestjs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Initialize LogSentinel SDK (one line!)
  const logSentinel = new LogSentinelSDK();
  logSentinel.install(app);
  
  await app.listen(3000);
}
bootstrap();
```

That's it! Your application is now logging all requests and responses.

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LOGSENTINEL_API_KEY` | Yes | - | API key for authentication |
| `LOGSENTINEL_BASE_URL` | Yes | - | Base URL of your monitoring server |
| `LOGSENTINEL_DEBUG` | No | `false` | Enable debug mode with colorized logs |
| `LOGSENTINEL_BATCH_SIZE` | No | `5` | Number of logs per batch |

### Programmatic Configuration

```typescript
const logSentinel = new LogSentinelSDK({
  debug: true,
  batchSize: 10,
});
logSentinel.install(app);
```

## How It Works

1. **Middleware** captures incoming requests (method, URL, headers, body)
2. **Interceptor** captures outgoing responses (status, body, execution time)
3. **Batch Queue** holds logs in memory until batch size is reached
4. **Flusher** sends logs asynchronously to your monitoring server
5. **Graceful Shutdown** flushes remaining logs on process exit

## API Endpoint

The SDK sends POST requests to:

```
POST {baseUrl}/api/sdk/logs
Authorization: Bearer {apiKey}
Content-Type: application/json
```

**Request Body:**

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "method": "POST",
  "url": "/api/users",
  "query": {},
  "requestHeaders": { "content-type": "application/json" },
  "requestBody": { "name": "John" },
  "statusCode": 201,
  "responseBody": { "id": "123", "name": "John" },
  "executionTimeMs": 45.67
}
```

## Debug Mode

Enable debug mode to see  console output:

```env
LOGSENTINEL_DEBUG=true
```

Output example:
```
[LogSentinel] ✓ SDK initialized successfully
[LogSentinel] Captured POST /api/users - 201 (45.67ms)
[LogSentinel] Flushing 5 log entries
[LogSentinel] ✓ Successfully sent 5 logs
```

## Production Mode

In production, set `LOGSENTINEL_DEBUG=false` or omit it entirely.


## Requirements

- Node.js 16+
- NestJS 10+

## License

MIT

## Support

Open an issue on GitHub.
