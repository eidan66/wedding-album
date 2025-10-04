"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { API_CONFIG, isDevelopment } from '@/config';

interface QueryProviderProps {
  children: React.ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Default stale time - how long data stays fresh
            staleTime: API_CONFIG.STALE_TIME,
            
            // Default cache time - how long data stays in cache
            gcTime: API_CONFIG.CACHE_TIME, // formerly cacheTime
            
            // Retry configuration
            retry: API_CONFIG.RETRY_ATTEMPTS,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            
            // Refetch configuration
            refetchOnWindowFocus: false, // Don't refetch on window focus
            refetchOnMount: true, // Always refetch on mount
            refetchOnReconnect: true, // Refetch when reconnecting
            
            // Error handling
            throwOnError: false, // Don't throw errors to component boundary
          },
          mutations: {
            // Retry mutations once
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show React Query DevTools in development */}
      {isDevelopment && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
