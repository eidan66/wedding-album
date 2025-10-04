export type AlbumItem = {
  id: string;
  url: string;
  type: 'image' | 'video';
  created_date: string;
  title?: string;
  uploader_name?: string;
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

