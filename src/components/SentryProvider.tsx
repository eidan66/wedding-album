'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

interface SentryProviderProps {
  children: React.ReactNode;
}

export function SentryProvider({ children }: SentryProviderProps) {
  useEffect(() => {
    // Set user context if available
    const userId = localStorage.getItem('userId');
    const sessionId = localStorage.getItem('sessionId');
    
    if (userId || sessionId) {
      Sentry.setUser({
        id: userId || undefined,
        sessionId: sessionId || undefined,
      });
    }

    // Log client-side initialization
    logger.info('Sentry client initialized', {
      userId: userId || undefined,
      sessionId: sessionId || undefined,
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Global error handler for unhandled errors
    const handleError = (event: ErrorEvent) => {
      logger.error('Unhandled client error', event.error, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        url: window.location.href,
      });
    };

    // Global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('Unhandled promise rejection', event.reason, {
        url: window.location.href,
      });
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return <>{children}</>;
}
