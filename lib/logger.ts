// Centralized logging service for the application
// Logs to console with structured metadata for debugging and monitoring

export interface LogContext {
  requestId?: string;
  userId?: string;
  timestamp?: Date;
  duration?: number;
  [key: string]: any;
}

type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private context: LogContext = {};

  setContext(context: LogContext) {
    this.context = context;
  }

  private formatLog(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...this.context,
      ...(meta && { metadata: meta }),
    };
    return logEntry;
  }

  debug(message: string, meta?: any) {
    const log = this.formatLog("debug", message, meta);
    console.log("[DEBUG]", JSON.stringify(log));
  }

  info(message: string, meta?: any) {
    const log = this.formatLog("info", message, meta);
    console.log("[INFO]", JSON.stringify(log));
  }

  warn(message: string, meta?: any) {
    const log = this.formatLog("warn", message, meta);
    console.warn("[WARN]", JSON.stringify(log));
  }

  error(message: string, error?: Error | any, meta?: any) {
    const log = this.formatLog("error", message, {
      errorName: error?.name,
      errorMessage: error?.message,
      errorStack: error?.stack,
      ...meta,
    });
    console.error("[ERROR]", JSON.stringify(log));
  }
}

export const logger = new Logger();
