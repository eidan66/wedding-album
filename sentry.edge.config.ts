// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false, // Disabled to prevent console warnings
  
  // Enable logs to be sent to Sentry
  enableLogs: true,
  
  // Integrations
  integrations: [
    // Removed consoleLoggingIntegration to prevent infinite loops
  ],
  
  // Set environment
  environment: process.env.NODE_ENV || 'development',
  
  // Add custom tags
  initialScope: {
    tags: {
      component: 'edge',
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
      edge: true,
      timestamp: new Date().toISOString(),
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
