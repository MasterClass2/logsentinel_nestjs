/**
 * Internal Debug Logger
 * 
 * Provides beautiful, colorized console output when debug mode is enabled.
 * Completely silent in production to maintain zero performance impact.
 */

import { green, blue, yellow, red, dim } from '../utils/colors';

export class InternalLogger {
  private readonly prefix = '[LogSentinel]';
  
  constructor(private readonly debugEnabled: boolean) {}

  info(message: string, ...args: any[]): void {
    if (this.debugEnabled) {
      console.log(green(this.prefix), message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.debugEnabled) {
      console.warn(yellow(this.prefix), message, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.debugEnabled) {
      console.error(red(this.prefix), message, ...args);
    }
  }

  debug(message: string, data?: any): void {
    if (this.debugEnabled) {
      if (data !== undefined) {
        console.log(blue(this.prefix), dim(message), data);
      } else {
        console.log(blue(this.prefix), dim(message));
      }
    }
  }

  success(message: string): void {
    if (this.debugEnabled) {
      console.log(green(this.prefix), green('✓'), message);
    }
  }
}
