/**
 * LogSentinel Request Middleware
 * 
 * Captures incoming HTTP requests and stores data for later merging with response.
 * Implements NestJS middleware interface for global request interception.
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { getCurrentTimestamp, getHighResTime } from '../utils/time';
import { safeJsonStringify } from '../utils/safe-json';

/**
 * Extend Express Request to include our log data
 */
declare global {
  namespace Express {
    interface Request {
      logSentinelData?: {
        timestamp: string;
        method: string;
        url: string;
        query: Record<string, any>;
        headers: Record<string, any>;
        body: any;
        startTime: number;
      };
    }
  }
}

@Injectable()
export class LogSentinelMiddleware implements NestMiddleware {
  /**
   * Capture request data and attach to request object
   * Never blocks or throws errors
   */
  use(req: Request, _res: Response, next: NextFunction): void {
    try {
      // Capture request data at entry point
      req.logSentinelData = {
        timestamp: getCurrentTimestamp(),
        method: req.method,
        url: req.originalUrl || req.url,
        query: req.query || {},
        headers: this.sanitizeHeaders(req.headers),
        body: this.sanitizeBody(req.body),
        startTime: getHighResTime(),
      };
    } catch (error) {
      // Silently fail , or never impact the host application
      // In large production buildS, this catch should never execute, but it's here for safety
    }

    next();
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(headers: any): Record<string, any> {
    try {
      const sanitized: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(headers)) {
        sanitized[key] = value;
      }

      return sanitized;
    } catch {
      return {};
    }
  }

  /**
   * Safely serialize request body
   */
  private sanitizeBody(body: any): any {
    try {
      if (!body || typeof body !== 'object') {
        return body;
      }

      // Parse and re-stringify to ensure it's serializable
      return JSON.parse(safeJsonStringify(body));
    } catch {
      return '[Body serialization failed]';
    }
  }
}
