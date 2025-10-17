"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useState, useEffect } from 'react';
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
          staleTime: API_CONFIG.STALE_TIME,
          gcTime: API_CONFIG.CACHE_TIME,
          retry: API_CONFIG.RETRY_ATTEMPTS,
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          refetchOnWindowFocus: false,
          refetchOnMount: true,
          refetchOnReconnect: true,
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
  const [isClient, setIsClient] = useState(false);

  // Initialize only on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [clientQueryClient] = useState(() => getQueryClient());

  // Create persister for localStorage (only on client)
  const [persister] = useState(() => {
    if (typeof window === 'undefined') return undefined;
    
    return createSyncStoragePersister({
      storage: window.localStorage,
      key: 'WEDDING_GALLERY_CACHE',
      // Serialize/deserialize with error handling
      serialize: (data) => JSON.stringify(data),
      deserialize: (data) => {
        try {
          return JSON.parse(data);
        } catch {
          return null;
        }
      },
    });
  });

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <QueryClientProvider client={clientQueryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={clientQueryClient}
      persistOptions={{
        persister: persister!,
        maxAge: API_CONFIG.CACHE_TIME, // Match gcTime
        // Dehydrate options - what to persist
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            // Only persist successful queries
            const isSuccess = query.state.status === 'success';
            // Don't persist queries that are fetching
            const isFetching = query.state.fetchStatus === 'fetching';
            return isSuccess && !isFetching;
          },
        },
      }}
    >
      {children}
      {/* Show React Query DevTools in development */}
      {isDevelopment && <ReactQueryDevtools initialIsOpen={false} />}
    </PersistQueryClientProvider>
  );
}
