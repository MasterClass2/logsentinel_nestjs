/**
 * SDK Configuration Constants
 * 
 * These values control batching behavior, network timeouts, and retry logic.
 * Tuned for production reliability without impacting host application performance.
 */

export const BATCH_SIZE = 5;
export const FLUSH_INTERVAL_MS = 5000; // Backup timer for partial batches
export const HTTP_TIMEOUT_MS = 10000;
export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 1000;
export const MAX_LOG_FIELD_SIZE_BYTES = 10240; // 10KB per field
export const SHUTDOWN_GRACE_PERIOD_MS = 5000;
