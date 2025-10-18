"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { API_CONFIG, isDevelopment } from '@/config';

interface QueryProviderProps {
  children: React.ReactNode;
}

// Create a singleton queryClient instance for export
// This allows other parts of the app to invalidate cache without React context
let globalQueryClient: QueryClient | null = null;

export const getQueryClient = () => {
  if (!globalQueryClient) {
    globalQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 0, // Always fetch fresh data
          gcTime: 5 * 60 * 1000, // Keep in memory for 5 minutes
          retry: API_CONFIG.RETRY_ATTEMPTS,
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          refetchOnWindowFocus: true, // Refetch when window gains focus
          refetchOnMount: true, // Always refetch on mount
          refetchOnReconnect: true, // Refetch on reconnect
          throwOnError: false,
        },
        mutations: {
          retry: 1,
          retryDelay: 1000,
        },
      },
    });
  }
  return globalQueryClient;
};

// Export for convenience
export const queryClient = getQueryClient();

export default function QueryProvider({ children }: QueryProviderProps) {
  const [clientQueryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={clientQueryClient}>
      {children}
      {/* Show React Query DevTools in development */}
      {isDevelopment && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
