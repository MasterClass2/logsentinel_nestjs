/**
 * HTTP Transport Layer
 * 
 * Sends log entries to remote server with retry logic and timeout handling.
 * Critical: Never throws errors to prevent impacting host application.
 * Debug mode prints full logs to terminal for development purposes.
 */

import { LogEntry, EnvConfig } from '../config/options.interface';
import { HTTP_TIMEOUT_MS, MAX_RETRIES, RETRY_DELAY_MS } from '../config/constants';
import { InternalLogger } from '../core/logger';

export class HttpClient {
  private readonly debug: boolean;

  constructor(
    private readonly config: EnvConfig,
    private readonly logger: InternalLogger,
    debug = false
  ) {
    this.debug = debug;
  }

  /**
   * Send a single log entry to the remote server
   * Implements retry logic with exponential backoff
   * Never throws - all errors are logged and swallowed
   */
  async sendLog(logEntry: LogEntry): Promise<boolean> {
    const endpoint = `${this.config.baseUrl}/api/sdk/logs`;

    if (this.debug) {
      console.log('\x1b[32m%s\x1b[0m', '[LogSentinel DEBUG] Sending log:', JSON.stringify(logEntry, null, 2));
    }

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify(logEntry),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          this.logger.debug(`Log sent successfully (attempt ${attempt + 1})`);
          return true;
        }

        // Don't retry on 4xx client errors
        if (response.status >= 400 && response.status < 500) {
          this.logger.warn(
            `Server rejected log with status ${response.status}, not retrying`
          );
          return false;
        }

        // Retry on 5xx server errors
        this.logger.warn(
          `Server error ${response.status}, attempt ${attempt + 1}/${MAX_RETRIES + 1}`
        );

      } catch (error) {
        const isLastAttempt = attempt === MAX_RETRIES;

        if (error instanceof Error && error.name === 'AbortError') {
          this.logger.warn(`Request timeout (attempt ${attempt + 1})`);
        } else {
          this.logger.warn(
            `Network error: ${error instanceof Error ? error.message : 'Unknown'}`,
            `(attempt ${attempt + 1}/${MAX_RETRIES + 1})`
          );
        }

        if (isLastAttempt) {
          this.logger.error('Failed to send log after all retry attempts');
          return false;
        }
      }

      // Exponential backoff between retries
      if (attempt < MAX_RETRIES) {
        await this.delay(RETRY_DELAY_MS * (attempt + 1));
      }
    }

    return false;
  }

  /**
   * Send multiple log entries in sequence
   * Returns number of successfully sent logs
   */
  async sendBatch(logEntries: LogEntry[]): Promise<number> {
    if (this.debug && logEntries.length > 0) {
      console.log('\x1b[36m%s\x1b[0m', '[LogSentinel DEBUG] Sending batch:', JSON.stringify(logEntries, null, 2));
    }

    let successCount = 0;

    for (const entry of logEntries) {
      const success = await this.sendLog(entry);
      if (success) {
        successCount++;
      }
    }

    return successCount;
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
