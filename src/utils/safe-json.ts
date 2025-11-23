/**
 * Safe JSON Serialization Utility
 * 
 * Handles circular references, truncates large objects, and redacts sensitive data.
 * Critical for preventing crashes during log serialization.
 */

import { MAX_LOG_FIELD_SIZE_BYTES } from '../config/constants';

const SENSITIVE_HEADERS = [
  'authorization',
  'cookie',
  'x-api-key',
  'x-auth-token',
  'api-key',
  'api_key',
  'access-token',
  'access_token',
];

/**
 * Safely serialize any value to JSON string, handling circular references
 */
export function safeJsonStringify(obj: any, redactSensitive = true): string {
  try {
    const seen = new WeakSet();
    
    const result = JSON.stringify(obj, (key, value) => {
      // Handle circular references
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }

      // Redact sensitive headers
      if (redactSensitive && typeof key === 'string') {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_HEADERS.includes(lowerKey)) {
          return '[REDACTED]';
        }
      }

      // Truncate very large strings to prevent memory issues
      if (typeof value === 'string' && value.length > MAX_LOG_FIELD_SIZE_BYTES) {
        return value.substring(0, MAX_LOG_FIELD_SIZE_BYTES) + '... [truncated]';
      }

      return value;
    });

    return result;
  } catch (error) {
    // Fallback for any serialization failure
    return `[Serialization Error: ${error instanceof Error ? error.message : 'Unknown'}]`;
  }
}

/**
 * Safely parse a value to object, returning original on failure
 */
export function safeJsonParse(value: any): any {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

/**
 * Deep clone an object safely (without circular references)
 */
export function safeClone<T>(obj: T): T {
  try {
    return JSON.parse(safeJsonStringify(obj, false));
  } catch {
    return obj;
  }
}
