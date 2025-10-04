import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiServices } from '@/services/api';
import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

// Query Keys - centralized for consistency
export const mediaQueryKeys = {
  all: ['media'] as const,
  lists: () => [...mediaQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...mediaQueryKeys.lists(), filters] as const,
  count: () => [...mediaQueryKeys.all, 'count'] as const,
  countByType: (type?: string) => [...mediaQueryKeys.count(), type] as const,
  byCouple: (coupleId: string) => [...mediaQueryKeys.all, 'couple', coupleId] as const,
};

// Media List Query
export function useMediaList(params: {
  sort?: string;
  page?: number;
  limit?: number;
  type?: 'photo' | 'video';
} = {}) {
  const query = useQuery({
    queryKey: mediaQueryKeys.list(params),
    queryFn: () => {
      logger.info('ReactQuery: Fetching media list', { params });
      return apiServices.media.getMediaList(params);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Log success/error using useEffect
  useEffect(() => {
    if (query.data) {
      logger.info('ReactQuery: Media list fetched successfully', {
        params,
        itemCount: query.data?.items?.length || 0,
        hasMore: query.data?.hasMore,
      });
      
      // Log to Sentry for monitoring
      Sentry.addBreadcrumb({
        message: 'ReactQuery: Media list fetched successfully',
        category: 'react-query',
        level: 'info',
        data: {
          params,
          itemCount: query.data?.items?.length || 0,
          hasMore: query.data?.hasMore,
        },
      });
    }
    if (query.error) {
      logger.error('ReactQuery: Media list fetch failed', query.error instanceof Error ? query.error : new Error(String(query.error)), { params });
      
      // Log error to Sentry
      Sentry.captureException(query.error instanceof Error ? query.error : new Error(String(query.error)), {
        tags: { component: 'react-query', hook: 'useMediaList' },
        extra: { params },
      });
    }
  }, [query.data, query.error, params]);

  return query;
}

// Media by Couple Query
export function useMediaByCouple(coupleId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: mediaQueryKeys.byCouple(coupleId),
    queryFn: () => apiServices.media.getMediaByCouple(coupleId),
    enabled: enabled && !!coupleId,
    staleTime: 2 * 60 * 1000, // 2 minutes for real-time updates
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
  });
}

// Media Count Query
export function useMediaCount(type?: 'photo' | 'video') {
  return useQuery({
    queryKey: mediaQueryKeys.countByType(type),
    queryFn: () => apiServices.media.getMediaCount(type),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// All Media Counts Query (for tabs)
export function useAllMediaCounts() {
  const queryClient = useQueryClient();
  
  const allCount = useMediaCount();
  const photoCount = useMediaCount('photo');
  const videoCount = useMediaCount('video');

  // Invalidate all counts when any media changes
  const invalidateCounts = () => {
    queryClient.invalidateQueries({ queryKey: mediaQueryKeys.count() });
  };

  return {
    all: allCount.data?.total ?? 0,
    photos: photoCount.data?.total ?? 0,
    videos: videoCount.data?.total ?? 0,
    isLoading: allCount.isLoading || photoCount.isLoading || videoCount.isLoading,
    invalidateCounts,
  };
}

// Create Media Mutation
export function useCreateMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiServices.media.createMedia,
    onSuccess: () => {
      // Invalidate all media queries to refetch data
      queryClient.invalidateQueries({ queryKey: mediaQueryKeys.all });
    },
    onError: (error) => {
      console.error('Failed to create media:', error);
    },
  });
}

// Upload File Mutation
export function useUploadFile() {
  return useMutation({
    mutationFn: apiServices.upload.uploadFile,
    onError: (error) => {
      console.error('Failed to upload file:', error);
    },
  });
}

// Batch Upload Mutation
export function useBatchUpload() {
  return useMutation({
    mutationFn: apiServices.upload.uploadFiles,
    onError: (error) => {
      console.error('Failed to batch upload:', error);
    },
  });
}

// Download Mutation
export function useDownloadMedia() {
  return useMutation({
    mutationFn: apiServices.download.downloadMedia,
    onError: (error) => {
      console.error('Failed to download media:', error);
    },
  });
}

// Download All Mutation
export function useDownloadAll() {
  return useMutation({
    mutationFn: apiServices.download.downloadAll,
    onError: (error) => {
      console.error('Failed to download all media:', error);
    },
  });
}

// Prefetch next page for better UX
export function usePrefetchNextPage() {
  const queryClient = useQueryClient();

  return (params: {
    sort?: string;
    page?: number;
    limit?: number;
    type?: 'photo' | 'video';
  }) => {
    const nextParams = { ...params, page: (params.page || 1) + 1 };
    queryClient.prefetchQuery({
      queryKey: mediaQueryKeys.list(nextParams),
      queryFn: () => apiServices.media.getMediaList(nextParams),
      staleTime: 5 * 60 * 1000,
    });
  };
}
