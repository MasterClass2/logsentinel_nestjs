/**
 * ANSI Color Utilities for Console Output
 * 
 * Provides colorized console output without external dependencies.
 * Colors only apply when output is a TTY (prevents polluting log files).
 */

const isColorSupported = process.stdout.isTTY;

const colorCodes = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
};

export function green(text: string): string {
  return isColorSupported ? `${colorCodes.green}${text}${colorCodes.reset}` : text;
}

export function blue(text: string): string {
  return isColorSupported ? `${colorCodes.blue}${text}${colorCodes.reset}` : text;
}

export function yellow(text: string): string {
  return isColorSupported ? `${colorCodes.yellow}${text}${colorCodes.reset}` : text;
}

export function red(text: string): string {
  return isColorSupported ? `${colorCodes.red}${text}${colorCodes.reset}` : text;
}

export function dim(text: string): string {
  return isColorSupported ? `${colorCodes.dim}${text}${colorCodes.reset}` : text;
}

export function cyan(text: string): string {
  return isColorSupported ? `${colorCodes.cyan}${text}${colorCodes.reset}` : text;
}
