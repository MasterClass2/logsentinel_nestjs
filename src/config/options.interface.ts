/**
 * LogSentinel SDK Configuration Options
 * 
 * These types define the public API for SDK configuration and internal log structures.
 */

export interface LogSentinelOptions {
  apiKey?: string;
  baseUrl?: string;
  debug?: boolean;
  batchSize?: number;
}

export interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  query?: Record<string, any>;
  requestHeaders?: Record<string, any>;
  requestBody?: any;
  statusCode?: number;
  responseBody?: any;
  executionTimeMs?: number;
  error?: string;
}

export interface EnvConfig {
  apiKey: string;
  baseUrl: string;
  debug: boolean;
  batchSize: number;
}
