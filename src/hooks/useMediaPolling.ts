import { useState, useEffect, useCallback, useRef } from 'react';
import { ProcessedMediaItem } from '@/types';

interface UseMediaPollingOptions {
  coupleId: string;
  pollingInterval?: number; // in milliseconds
  enabled?: boolean;
  onMediaUpdate?: (media: ProcessedMediaItem[]) => void;
}

interface UseMediaPollingReturn {
  media: ProcessedMediaItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  stopPolling: () => void;
  startPolling: () => void;
}

export const useMediaPolling = ({
  coupleId,
  pollingInterval = 5000, // 5 seconds default
  enabled = true,
  onMediaUpdate,
}: UseMediaPollingOptions): UseMediaPollingReturn => {
  const [media, setMedia] = useState<ProcessedMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchMedia = useCallback(async (signal?: AbortSignal) => {
    if (!coupleId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/media/by-couple?coupleId=${encodeURIComponent(coupleId)}`, {
        signal,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch media: ${response.statusText}`);
      }
      
      const data = await response.json();
      const newMedia = data.items || [];
      
      setMedia(newMedia);
      onMediaUpdate?.(newMedia);
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted, ignore
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch media';
      setError(errorMessage);
      console.error('Error fetching media:', err);
    } finally {
      setIsLoading(false);
    }
  }, [coupleId, onMediaUpdate]);

  const startPolling = useCallback(() => {
    if (isPolling) return;
    
    setIsPolling(true);
    
    // Initial fetch
    fetchMedia();
    
    // Set up polling interval
    intervalRef.current = setInterval(() => {
      fetchMedia();
    }, pollingInterval);
  }, [fetchMedia, pollingInterval, isPolling]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const refetch = useCallback(async () => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    await fetchMedia(abortControllerRef.current.signal);
  }, [fetchMedia]);

  // Start/stop polling based on enabled state
  useEffect(() => {
    if (enabled && coupleId) {
      startPolling();
    } else {
      stopPolling();
    }
    
    return () => {
      stopPolling();
    };
  }, [enabled, coupleId, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    media,
    isLoading,
    error,
    refetch,
    stopPolling,
    startPolling,
  };
};
