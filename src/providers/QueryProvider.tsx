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

export default function QueryProvider({ children }: QueryProviderProps) {
  const [isClient, setIsClient] = useState(false);

  // Initialize only on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

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
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
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
