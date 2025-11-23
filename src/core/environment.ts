/**
 * Environment Configuration Loader
 * 
 * Validates required environment variables and returns configuration object.
 * Implements graceful degradation - returns null on misconfiguration rather than crashing.
 */

import { EnvConfig } from '../config/options.interface';
import { BATCH_SIZE } from '../config/constants';

/**
 * Load and validate environment configuration
 * Returns null if configuration is invalid, allowing SDK to disable gracefully
 */
export function loadEnvironmentConfig(): EnvConfig | null {
  const apiKey = process.env.LOGSENTINEL_API_KEY;
  const baseUrl = process.env.LOGSENTINEL_BASE_URL;
  const debug = process.env.LOGSENTINEL_DEBUG === 'true';
  const batchSize = parseInt(process.env.LOGSENTINEL_BATCH_SIZE || String(BATCH_SIZE), 10);

  // Validate required configuration
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }

  if (!baseUrl || baseUrl.trim() === '') {
    return null;
  }

  // Validate base URL format
  try {
    new URL(baseUrl);
  } catch {
    return null;
  }

  return {
    apiKey: apiKey.trim(),
    baseUrl: baseUrl.trim().replace(/\/$/, ''), // Remove trailing slash
    debug,
    batchSize: isNaN(batchSize) || batchSize < 1 ? BATCH_SIZE : batchSize,
  };
}

/**
 * Check if environment is configured (without loading full config)
 */
export function isEnvironmentConfigured(): boolean {
  return !!(process.env.LOGSENTINEL_API_KEY && process.env.LOGSENTINEL_BASE_URL);
}
