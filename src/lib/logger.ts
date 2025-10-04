import * as Sentry from '@sentry/nextjs';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${process.env.NEXT_PUBLIC_SENTRY_PROJECT}]: ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  private logToConsole(): void {
    // Disabled console logging to prevent infinite loops with Sentry
    // Only use Sentry.logger for structured logging
  }

  private logToSentry(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    // Use Sentry's built-in logger for all environments
    const { logger: sentryLogger } = Sentry;
    
    // Add context to Sentry scope
    Sentry.withScope((scope) => {
      if (context) {
        Object.keys(context).forEach(key => {
          const value = context[key];
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            scope.setTag(key, String(value));
          }
        });
      }
      
      // Add breadcrumb
      scope.addBreadcrumb({
        message,
        level: level as Sentry.SeverityLevel,
        timestamp: Date.now() / 1000,
      });
      
      if (error) {
        Sentry.captureException(error);
      } else {
        // Use Sentry logger for structured logging
        switch (level) {
          case LogLevel.DEBUG:
            sentryLogger.debug(message, context);
            break;
          case LogLevel.INFO:
            sentryLogger.info(message, context);
            break;
          case LogLevel.WARN:
            sentryLogger.warn(message, context);
            break;
          case LogLevel.ERROR:
            sentryLogger.error(message, context);
            break;
        }
      }
    });
  }

  debug(message: string, context?: LogContext): void {
    this.logToConsole();
    this.logToSentry(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.logToConsole();
    this.logToSentry(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.logToConsole();
    this.logToSentry(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.logToConsole();
    this.logToSentry(LogLevel.ERROR, message, context, error);
  }

  // Specialized logging methods
  apiRequest(method: string, url: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${url}`, {
      ...context,
      method,
      url,
      type: 'api_request',
    });
  }

  apiResponse(method: string, url: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const message = `API Response: ${method} ${url} - ${statusCode} (${duration}ms)`;
    
    if (level === LogLevel.ERROR) {
      this.error(message, undefined, {
        ...context,
        method,
        url,
        statusCode,
        duration,
        type: 'api_response',
      });
    } else {
      this.info(message, {
        ...context,
        method,
        url,
        statusCode,
        duration,
        type: 'api_response',
      });
    }
  }

  userAction(action: string, context?: LogContext): void {
    this.info(`User Action: ${action}`, {
      ...context,
      action,
      type: 'user_action',
    });
  }

  uploadProgress(fileId: string, progress: number, context?: LogContext): void {
    this.debug(`Upload Progress: ${fileId} - ${progress}%`, {
      ...context,
      fileId,
      progress,
      type: 'upload_progress',
    });
  }

  uploadComplete(fileId: string, context?: LogContext): void {
    this.info(`Upload Complete: ${fileId}`, {
      ...context,
      fileId,
      type: 'upload_complete',
    });
  }

  uploadError(fileId: string, error: Error, context?: LogContext): void {
    this.error(`Upload Error: ${fileId}`, error, {
      ...context,
      fileId,
      type: 'upload_error',
    });
  }

  mediaProcessing(fileId: string, status: string, context?: LogContext): void {
    this.info(`Media Processing: ${fileId} - ${status}`, {
      ...context,
      fileId,
      status,
      type: 'media_processing',
    });
  }

  securityEvent(event: string, context?: LogContext): void {
    this.warn(`Security Event: ${event}`, {
      ...context,
      event,
      type: 'security_event',
    });
  }

  // New Sentry-specific methods
  startSpan<T>(operation: string, name: string, callback: (span: Sentry.Span) => T, context?: LogContext): T {
    return Sentry.startSpan(
      {
        op: operation,
        name: name,
      },
      (span) => {
        // Add context as attributes
        if (context) {
          Object.keys(context).forEach(key => {
            const value = context[key];
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
              span.setAttribute(key, value);
            }
          });
        }
        
        return callback(span);
      },
    );
  }

  // API call tracing
  async traceApiCall<T>(
    method: string, 
    url: string, 
    callback: () => Promise<T>, 
    context?: LogContext
  ): Promise<T> {
    return this.startSpan(
      'http.client',
      `[${process.env.SENTRY_PROJECT}]: ${method} ${url}`,
      async (span) => {
        const startTime = Date.now();
        try {
          const result = await callback();
          const duration = Date.now() - startTime;
          
          span.setAttribute('status', 'success');
          span.setAttribute('duration', duration);
          
          this.apiResponse(method, url, 200, duration, context);
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          span.setAttribute('status', 'error');
          span.setAttribute('duration', duration);
          span.setAttribute('error', error instanceof Error ? error.message : String(error));
          
          this.apiResponse(method, url, 500, duration, { ...context, error: error instanceof Error ? error.message : String(error) });
          throw error;
        }
      },
      context
    );
  }

  // User action tracing
  traceUserAction<T>(action: string, callback: () => T, context?: LogContext): T {
    return this.startSpan(
      'ui.action',
      `[${process.env.SENTRY_PROJECT}]: User Action: ${action}`,
      (span) => {
        span.setAttribute('action', action);
        const result = callback();
        this.userAction(action, context);
        return result;
      },
      context
    );
  }

  // File upload tracing
  async traceUpload<T>(fileId: string, callback: () => Promise<T>, context?: LogContext): Promise<T> {
    return this.startSpan(
      'file.upload',
      `[${process.env.SENTRY_PROJECT}]: Upload: ${fileId}`,
      async (span) => {
        span.setAttribute('fileId', fileId);
        const startTime = Date.now();
        
        try {
          const result = await callback();
          const duration = Date.now() - startTime;
          
          span.setAttribute('status', 'success');
          span.setAttribute('duration', duration);
          
          this.uploadComplete(fileId, { ...context, duration });
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          span.setAttribute('status', 'error');
          span.setAttribute('duration', duration);
          span.setAttribute('error', error instanceof Error ? error.message : String(error));
          
          this.uploadError(fileId, error instanceof Error ? error : new Error(String(error)), { ...context, duration });
          throw error;
        }
      },
      context
    );
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for convenience
export default logger;
