/**
 * Batch Flusher
 * 
 * Background worker that monitors queue size and flushes logs when batch is ready.
 * Runs asynchronously to avoid blocking the NestJS event loop.
 */

import { BatchQueue } from './batch-queue';
import { HttpClient } from '../transport/http-client';
import { InternalLogger } from '../core/logger';
import { FLUSH_INTERVAL_MS } from '../config/constants';

export class BatchFlusher {
  private intervalHandle?: NodeJS.Timeout;
  private isRunning = false;
  private flushInProgress = false;

  constructor(
    private readonly queue: BatchQueue,
    private readonly httpClient: HttpClient,
    private readonly logger: InternalLogger,
    private readonly batchSize: number
  ) {}

  /**
   * Start the background flusher
   * Checks queue periodically and flushes when batch size is reached
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Use the configured interval, fallback to 1000ms if not set
    const intervalMs = FLUSH_INTERVAL_MS ?? 1000;

    this.intervalHandle = setInterval(() => {
      this.checkAndFlush();
    }, intervalMs);

    this.logger.info(`Batch flusher started (interval: ${intervalMs}ms)`);
  }

  /**
   * Stop the background flusher
   */
  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = undefined;
    }
    this.isRunning = false;
    this.logger.info('Batch flusher stopped');
  }

  /**
   * Check queue size and flush if needed
   */
  private async checkAndFlush(): Promise<void> {
    if (this.flushInProgress) {
      return;
    }

    const queueSize = this.queue.size();
    
    if (queueSize >= this.batchSize) {
      await this.flush();
    }
  }

  /**
   * Manually trigger a flush of all pending logs
   * Used during graceful shutdown
   */
  async manualFlush(): Promise<void> {
    await this.flush();
  }

  /**
   * Flush all logs in the queue
   */
  private async flush(): Promise<void> {
    if (this.flushInProgress) {
      return;
    }

    this.flushInProgress = true;

    try {
      const entries = this.queue.getAndClear();
      
      if (entries.length === 0) {
        return;
      }

      this.logger.debug(`Flushing ${entries.length} log entries`);

      const successCount = await this.httpClient.sendBatch(entries);

      if (successCount === entries.length) {
        this.logger.success(`Successfully sent ${successCount} logs`);
      } else {
        this.logger.warn(
          `Sent ${successCount}/${entries.length} logs (${entries.length - successCount} failed)`
        );
      }
    } catch (error) {
      // This should never happen as httpClient swallows all errors
      // but we catch it anyway for extra safety
      this.logger.error(
        `Unexpected error during flush: ${error instanceof Error ? error.message : 'Unknown'}`
      );
    } finally {
      this.flushInProgress = false;
    }
  }

  /**
   * Check if a flush operation is currently in progress
   */
  isFlushInProgress(): boolean {
    return this.flushInProgress;
  }
}
