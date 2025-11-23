/**
 * LogSentinel SDK - Main Entry Point
 * 
 * Orchestrates middleware, interceptor, batching, and transport layers.
 * Implements graceful initialization and shutdown to ensure zero impact on host app.
 */

import { INestApplication } from '@nestjs/common';
import { loadEnvironmentConfig } from './environment';
import { InternalLogger } from './logger';
import { BatchQueue } from '../batching/batch-queue';
import { BatchFlusher } from '../batching/batch-flusher';
import { HttpClient } from '../transport/http-client';
import { LogSentinelMiddleware } from '../middleware/logSentinelMiddleware';
import { LogSentinelInterceptor } from '../interceptors/logSentinelInterceptor';
import { LogSentinelOptions } from '../config/options.interface';
import { SHUTDOWN_GRACE_PERIOD_MS } from '../config/constants';

export class LogSentinelSDK {
  private logger?: InternalLogger;
  private queue?: BatchQueue;
  private flusher?: BatchFlusher;
  private isEnabled = false;
  private isShuttingDown = false;

  constructor(private readonly options?: LogSentinelOptions) {}

  /**
   * Install SDK into NestJS application
   * Validates environment, applies middleware and interceptor, starts batching
   */
  install(app: INestApplication): void {
    // Load configuration from environment or options
    const envConfig = loadEnvironmentConfig();

    if (!envConfig) {
      console.warn(
        '[LogSentinel] SDK disabled: Missing or invalid configuration. ' +
        'Please set LOGSENTINEL_API_KEY and LOGSENTINEL_BASE_URL environment variables.'
      );
      return;
    }

    // Merge options with environment config
    const config = {
      ...envConfig,
      debug: this.options?.debug ?? envConfig.debug,
      batchSize: this.options?.batchSize ?? envConfig.batchSize,
    };

    this.logger = new InternalLogger(config.debug);
    this.logger.info('Initializing LogSentinel SDK...');

    try {
      // Initialize components
      this.queue = new BatchQueue();
      const httpClient = new HttpClient(config, this.logger, config.debug);
      this.flusher = new BatchFlusher(
        this.queue,
        httpClient,
        this.logger,
        config.batchSize
      );

      // Apply global middleware for request capture
      app.use((req: any, res: any, next: any) => {
        const middleware = new LogSentinelMiddleware();
        middleware.use(req, res, next);
      });

      // Apply global interceptor for response capture
      const interceptor = new LogSentinelInterceptor(this.queue, this.logger);
      app.useGlobalInterceptors(interceptor);

      // Start batch flusher
      this.flusher.start();

      // Register shutdown hooks
      this.registerShutdownHooks();

      this.isEnabled = true;
      this.logger.success('LogSentinel SDK initialized successfully');
      this.logger.info(`Batch size: ${config.batchSize}, Debug mode: ${config.debug}`);
    } catch (error) {
      this.logger?.error(
        `Failed to initialize SDK: ${error instanceof Error ? error.message : 'Unknown'}`
      );
      console.warn('[LogSentinel] SDK disabled due to initialization error');
    }
  }

  /**
   * Register process shutdown hooks for graceful cleanup
   */
  private registerShutdownHooks(): void {
    const shutdownHandler = async (signal: string) => {
      if (this.isShuttingDown) {
        return;
      }

      this.isShuttingDown = true;
      this.logger?.info(`Received ${signal}, shutting down gracefully...`);

      await this.shutdown();
    };

    process.on('SIGINT', () => shutdownHandler('SIGINT'));
    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
    process.on('beforeExit', () => shutdownHandler('beforeExit'));
  }

  /**
   * Graceful shutdown - flush all pending logs before exit
   */
  private async shutdown(): Promise<void> {
    if (!this.isEnabled || !this.queue || !this.flusher) {
      return;
    }

    try {
      // Stop accepting new logs
      this.queue.beginShutdown();

      // Stop the flusher interval
      this.flusher.stop();

      // Flush remaining logs with timeout
      const flushPromise = this.flusher.manualFlush();
      const timeoutPromise = new Promise<void>((resolve) =>
        setTimeout(resolve, SHUTDOWN_GRACE_PERIOD_MS)
      );

      await Promise.race([flushPromise, timeoutPromise]);

      const remaining = this.queue.size();
      if (remaining > 0) {
        this.logger?.warn(`Shutdown complete. ${remaining} logs could not be sent.`);
      } else {
        this.logger?.success('Shutdown complete. All logs flushed successfully.');
      }
    } catch (error) {
      this.logger?.error(
        `Error during shutdown: ${error instanceof Error ? error.message : 'Unknown'}`
      );
    }
  }

  /**
   * Check if SDK is enabled and running
   */
  isActive(): boolean {
    return this.isEnabled && !this.isShuttingDown;
  }

  /**
   * Get current queue size (for monitoring)
   */
  getQueueSize(): number {
    return this.queue?.size() ?? 0;
  }
}
