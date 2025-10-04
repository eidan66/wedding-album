import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false, // Disabled to prevent console warnings
  
  // Enable logs to be sent to Sentry
  enableLogs: true,
  
  // Removed replay settings since we're not using replay integration
  
  // Integrations
  integrations: [
    // Removed consoleLoggingIntegration to prevent infinite loops
    // Removed replayIntegration to prevent multiple instances error
  ],
  
  // Set environment
  environment: process.env.NODE_ENV || 'development',
  
  // Add custom tags
  initialScope: {
    tags: {
      component: 'client',
      app: 'wedding-gallery',
    },
  },
  
  // Custom error filtering
  beforeSend(event, hint) {
    // In development, send all events
    if (process.env.NODE_ENV === 'development') {
      return event;
    }
    
    // In production, only filter out debug logs, but keep info, warn, error
    if (event.level === 'debug') {
      return null;
    }
    
    // Add custom context
    event.tags = {
      ...event.tags,
      userAgent: window.navigator.userAgent,
    };
    
    return event;
  },
  
  // Custom log filtering
  beforeSendLog(log) {
    // In development, send all logs
    if (process.env.NODE_ENV === 'development') {
      return log;
    }
    
    // In production, filter out debug logs
    if (log.level === 'debug') {
      return null;
    }
    
    return log;
  },
});

// Export router transition hook for Sentry navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

