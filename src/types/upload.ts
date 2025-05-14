export type SupportedFileType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp'
  | 'image/heic'
  | 'video/mp4'
  | 'video/quicktime'
  | 'video/webm'
  | 'image/heif'
  | 'image/avif'
  | 'video/mov'
  | 'video/hevc'
  | 'video/3gpp'
  | 'video/x-matroska';

export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

export interface UploadFile {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
}

export interface UploadUrlRequest {
  filename: string;
  filetype: SupportedFileType;
  filesize: number;
}

export interface UploadUrlResponse {
  url: string;
} 