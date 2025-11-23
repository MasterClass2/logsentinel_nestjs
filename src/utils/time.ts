/**
 * Time Utilities
 * 
 * Provides timestamp generation and duration calculation for request tracking.
 */

/**
 * Get current timestamp in ISO 8601 format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Calculate duration between two timestamps in milliseconds
 */
export function calculateDuration(startTime: number, endTime: number): number {
  return endTime - startTime;
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  }
  
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(2);
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Get high-resolution timestamp for precise duration measurement
 */
export function getHighResTime(): number {
  return performance.now();
}
