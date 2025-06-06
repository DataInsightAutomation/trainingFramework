/**
 * Simple logger utility for tests with configurable levels
 */
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4
}

class Logger {
  private level: LogLevel;

  constructor() {
    // Default log level based on environment or config
    this.level = this.getConfiguredLogLevel();
  }

  private getConfiguredLogLevel(): LogLevel {
    // Check for environment variable first
    const envLevel = process.env.TEST_LOG_LEVEL;
    if (envLevel) {
      const level = LogLevel[envLevel.toUpperCase() as keyof typeof LogLevel];
      if (level !== undefined) return level;
    }

    // Default to INFO level
    return LogLevel.INFO;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(message: string): void {
    if (this.level >= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`);
    }
  }

  info(message: string): void {
    if (this.level >= LogLevel.INFO) {
      console.log(`[INFO] ${message}`);
    }
  }

  warn(message: string): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`);
    }
  }

  error(message: string): void {
    if (this.level >= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`);
    }
  }
}

// Export a singleton instance
export const logger = new Logger();
