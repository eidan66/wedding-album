import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiServices } from '@/services/api';
// import { logger } from '@/lib/logger';

// Query Keys - centralized for consistency
export const mediaQueryKeys = {
  all: ['media'] as const,
  lists: () => [...mediaQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...mediaQueryKeys.lists(), filters] as const,
  infiniteList: (filters: Omit<Record<string, unknown>, 'page'>) => [...mediaQueryKeys.lists(), 'infinite', filters] as const,
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
    queryFn: () => apiServices.media.getMediaList(params),
    staleTime: 0, // Always fetch fresh data
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true, // Refetch when user returns
    refetchOnMount: true, // Always refetch on mount
  });

  return query;
}

// Infinite Media List Query - המומלץ לשימוש עם infinite scroll
export function useInfiniteMediaList(params: {
  sort?: string;
  limit?: number;
  type?: 'photo' | 'video';
} = {}) {
  const { sort = '-created_date', limit = 50, type } = params;
  
  const query = useInfiniteQuery({
    queryKey: mediaQueryKeys.infiniteList({ sort, limit, type }),
    queryFn: ({ pageParam = 1 }) => {
      return apiServices.media.getMediaList({ sort, page: pageParam, limit, type });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // אם יש עוד דפים, החזר את מספר הדף הבא
      if (lastPage.hasMore) {
        return allPages.length + 1;
      }
      return undefined; // אין עוד דפים
    },
    staleTime: 0, // ALWAYS consider data stale - fetch fresh every time
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // CRITICAL: Always refetch when component mounts
    refetchOnReconnect: true, // Refetch when network reconnects
  });

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
    staleTime: 0, // Always fetch fresh count
    refetchOnMount: true, // Always refetch on mount
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
