import React, { useCallback, useState, useRef, useEffect } from 'react';
import { API_BASE } from '../config';
import type { AlbumItem, AlbumResponse } from '../types/context';
import  { AlbumContext } from './AlbumCreateContext';

export const AlbumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<AlbumItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const pageRef = useRef(1);
  const itemsRef = useRef<AlbumItem[]>([]);

  const fetchPage = async (page: number): Promise<AlbumResponse> => {
    const response = await fetch(`${API_BASE}/download?page=${page}&limit=10`);
    if (!response.ok) {
      throw new Error('Failed to fetch album items');
    }
    return await response.json();
  };

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchPage(pageRef.current);
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

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPage(1);
      itemsRef.current = data.items;
      setItems(data.items);
      pageRef.current = 2;
      setHasMore(data.hasMore);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMore();
  }, [loadMore]);

  return (
    <AlbumContext.Provider value={{ items, loading, error, hasMore, loadMore, refresh }}>
      {children}
    </AlbumContext.Provider>
  );
};
