export type AlbumItem = {
  id: string;
  url: string;
  type: 'image' | 'video';
};

export interface AlbumResponse {
  items: AlbumItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface AlbumContextType {
  items: AlbumItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

