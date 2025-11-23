/**
 * LogSentinel Response Interceptor
 * 
 * Captures outgoing HTTP responses and merges with request data.
 * Pushes complete log entry to batch queue for async processing.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { BatchQueue } from '../batching/batch-queue';
import { InternalLogger } from '../core/logger';
import { LogEntry } from '../config/options.interface';
import { getHighResTime, calculateDuration } from '../utils/time';
import { safeJsonStringify } from '../utils/safe-json';

@Injectable()
export class LogSentinelInterceptor implements NestInterceptor {
  constructor(
    private readonly queue: BatchQueue,
    private readonly logger: InternalLogger
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap((data) => {
        this.captureResponse(request, response, data, null);
      }),
      catchError((error) => {
        this.captureResponse(request, response, null, error);
        throw error; // Re-throw to maintain error handling flow
      })
    );
  }

  /**
   * Capture response data and merge with request data
   */
  private captureResponse(
    request: Request,
    response: Response,
    data: any,
    error: any
  ): void {
    try {
      const requestData = request.logSentinelData;

      if (!requestData) {
        // Request was not captured (middleware not applied or failed)
        return;
      }

      const endTime = getHighResTime();
      const executionTimeMs = calculateDuration(requestData.startTime, endTime);

      // Build complete log entry
      const logEntry: LogEntry = {
        timestamp: requestData.timestamp,
        method: requestData.method,
        url: requestData.url,
        query: requestData.query,
        requestHeaders: requestData.headers,
        requestBody: requestData.body,
        statusCode: response.statusCode,
        responseBody: this.sanitizeResponseBody(data),
        executionTimeMs: Math.round(executionTimeMs * 100) / 100, // Round to 2 decimals
      };

      // Add error information if present
      if (error) {
        logEntry.error = error instanceof Error ? error.message : String(error);
        logEntry.statusCode = error.status || error.statusCode || 500;
      }

      // Push to queue (non-blocking)
      const added = this.queue.add(logEntry);
      
      if (added) {
        this.logger.debug(
          `Captured ${logEntry.method} ${logEntry.url} - ${logEntry.statusCode} (${logEntry.executionTimeMs}ms)`
        );
      }
    } catch (error) {
      // Silently fail - never impact the host application
      this.logger.error(
        `Failed to capture response: ${error instanceof Error ? error.message : 'Unknown'}`
      );
    }
  }

  /**
   * Safely serialize response body
   */
  private sanitizeResponseBody(body: any): any {
    try {
      if (body === undefined || body === null) {
        return null;
      }

      // Handle buffers and streams
      if (Buffer.isBuffer(body)) {
        return '[Binary Data]';
      }

      if (typeof body === 'object') {
        return JSON.parse(safeJsonStringify(body));
      }

      return body;
    } catch {
      return '[Response serialization failed]';
    }
  }
}
