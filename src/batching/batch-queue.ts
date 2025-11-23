/**
 * In-Memory Batch Queue
 * 
 * Thread-safe queue for holding log entries until batch size is reached.
 * Simple array-based implementation with minimal overhead.
 */

import { LogEntry } from '../config/options.interface';

export class BatchQueue {
  private queue: LogEntry[] = [];
  private isShuttingDown = false;

  /**
   * Add a log entry to the queue
   * Returns false if queue is shutting down
   */
  add(entry: LogEntry): boolean {
    if (this.isShuttingDown) {
      return false;
    }

    this.queue.push(entry);
    return true;
  }

  /**
   * Get all entries and clear the queue atomically
   * This prevents duplicate sends if flush is called multiple times
   */
  getAndClear(): LogEntry[] {
    const entries = [...this.queue];
    this.queue = [];
    return entries;
  }

  /**
   * Get current queue size without modifying it
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Check if queue has entries
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Mark queue as shutting down (stop accepting new entries)
   */
  beginShutdown(): void {
    this.isShuttingDown = true;
  }

  /**
   * Check if queue is in shutdown mode
   */
  isInShutdown(): boolean {
    return this.isShuttingDown;
  }
}
