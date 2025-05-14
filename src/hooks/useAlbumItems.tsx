import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE } from '../config';

export type AlbumItem = {
  id: string;
  url: string;
  type: 'image' | 'video';
};

interface AlbumResponse {
  items: AlbumItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export function useAlbumItems() {
  const [items, setItems] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const pageRef = useRef(1);
  const itemsRef = useRef<AlbumItem[]>([]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/download?page=${pageRef.current}&limit=10`);
      if (!response.ok) {
        throw new Error('Failed to fetch album items');
      }

      const data: AlbumResponse = await response.json();
      const existingIds = new Set(itemsRef.current.map(item => item.id));
      const newItems = data.items.filter(item => !existingIds.has(item.id));

      itemsRef.current = [...itemsRef.current, ...newItems];
      setItems([...itemsRef.current]);
      pageRef.current = data.page + 1;
      setHasMore(data.hasMore);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore]);

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { items, loadMore, loading, error, hasMore };
}