export type AlbumItem = {
    id: string;
    url: string;
    type: 'image' | 'video';
    created_date: string;
    title?: string;
    uploader_name?: string;
  };

export type ProcessedMediaItem = {
  id: string;
  mp4Url: string;
  webmUrl?: string;
  posterUrl: string;
  width: number;
  height: number;
  duration?: number;
  type: 'image' | 'video';
  originalKey: string;
  createdAt: string;
  status: 'completed' | 'failed';
  error?: string;
};