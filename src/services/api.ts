import { API_BASE } from '@/config';
import type { WeddingMediaItem } from '@/Entities/WeddingMedia';
import * as Sentry from '@sentry/nextjs';

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total_items?: number;
  total_pages?: number;
  current_page?: number;
  hasMore?: boolean;
}

// Base API client with common configuration
class ApiClient {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  constructor() {
    this.baseURL = API_BASE;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const startTime = Date.now();
      const response = await fetch(url, config);
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        
        console.error(`API Error [${endpoint}]:`, {
          status: response.status,
          statusText: response.statusText,
          duration,
          error: errorData,
          url,
        });
        
        // Log error to Sentry
        Sentry.captureException(error, {
          tags: {
            component: 'api',
            endpoint,
            status: response.status.toString(),
          },
          extra: {
            statusText: response.statusText,
            duration,
            errorData,
            url,
          },
        });
        
        throw error;
      }

      const data = await response.json();
      
      console.log(`API Success [${endpoint}]:`, {
        status: response.status,
        duration,
        url,
        dataSize: JSON.stringify(data).length,
      });
      
      // Log to Sentry for monitoring
      Sentry.addBreadcrumb({
        message: `API Success [${endpoint}]`,
        category: 'api',
        level: 'info',
        data: {
          status: response.status,
          duration,
          url,
          dataSize: JSON.stringify(data).length,
        },
      });
      
      return {
        data,
        success: true,
      };
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, {
        error: error instanceof Error ? error.message : String(error),
        url,
        method: options.method || 'GET',
      });
      
      // Log network/fetch errors to Sentry
      Sentry.captureException(error, {
        tags: {
          component: 'api',
          endpoint,
          method: options.method || 'GET',
        },
        extra: {
          url,
          errorType: error instanceof Error ? 'Error' : 'Unknown',
        },
      });
      
      throw error;
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Upload method for files
  async upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it with boundary
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Media API Service
export class MediaService {
  // Get paginated media list
  static async getMediaList(params: {
    sort?: string;
    page?: number;
    limit?: number;
    type?: 'photo' | 'video';
  } = {}): Promise<PaginatedResponse<unknown>> {
    const stringParams: Record<string, string> = {};
    if (params.sort) stringParams.sort = params.sort;
    if (params.page) stringParams.page = params.page.toString();
    if (params.limit) stringParams.limit = params.limit.toString();
    if (params.type) stringParams.type = params.type;
    
    const response = await apiClient.get<PaginatedResponse<unknown>>('/download', stringParams);
    return response.data;
  }

  // Get media by couple ID
  static async getMediaByCouple(coupleId: string): Promise<PaginatedResponse<unknown>> {
    const response = await apiClient.get<PaginatedResponse<unknown>>('/media/by-couple', { coupleId });
    return response.data;
  }

  // Create new media item
  static async createMedia(data: {
    title?: string;
    media_url: string;
    media_type: 'photo' | 'video';
    uploader_name: string;
    thumbnail_url?: string;
  }): Promise<WeddingMediaItem> {
    const response = await apiClient.post('/media', data);
    return response.data as WeddingMediaItem;
  }

  // Get media count
  static async getMediaCount(type?: 'photo' | 'video'): Promise<{ total: number }> {
    const params: Record<string, string> = {};
    if (type) params.type = type;
    
    const response = await apiClient.get<{ total: number }>('/media/count', params);
    return response.data;
  }

  // Get upload URL
  static async getUploadUrl(data: {
    filename: string;
    filetype: string;
    filesize: number;
    title?: string;
    uploaderName?: string;
  }): Promise<{ url: string }> {
    const response = await apiClient.post<{ url: string }>('/upload-url', data);
    return response.data;
  }

  // Batch presign URLs
  static async getBatchUploadUrls(files: {
    filename: string;
    filetype: string;
    filesize: number;
  }[]): Promise<{ url: string }[]> {
    const response = await apiClient.post<{ url: string }[]>('/uploads/presign/batch', { files });
    return response.data;
  }
}

// Download Service
export class DownloadService {
  // Download all media
  static async downloadAll(): Promise<Blob> {
    const response = await fetch(`${API_BASE}/download/all`, { method: 'POST' });
    if (!response.ok) throw new Error('Download failed');
    return response.blob();
  }

  // Download single media
  static async downloadMedia(mediaUrl: string): Promise<Blob> {
    const response = await fetch(mediaUrl);
    if (!response.ok) throw new Error('Download failed');
    return response.blob();
  }
}

// Image Proxy Service
export class ImageProxyService {
  // Get proxied image URL to avoid CORS issues
  static getProxiedImageUrl(originalUrl: string): string {
    // If it's already a proxied URL, return as is
    if (originalUrl.includes('/api/proxy/image')) {
      console.log('ImageProxyService: URL already proxied', { originalUrl });
      
      Sentry.addBreadcrumb({
        message: 'ImageProxyService: URL already proxied',
        category: 'image-proxy',
        level: 'info',
        data: { originalUrl },
      });
      
      return originalUrl;
    }
    
    // If it's an S3 URL, use our proxy
    if (originalUrl.includes('sapir-and-idan-wedding-albums.s3.il-central-1.amazonaws.com')) {
      const proxiedUrl = `${API_BASE}/proxy/image?url=${encodeURIComponent(originalUrl)}`;
      console.log('ImageProxyService: Converting S3 URL to proxy', { 
        originalUrl, 
        proxiedUrl,
        isS3: true 
      });
      
      Sentry.addBreadcrumb({
        message: 'ImageProxyService: Converting S3 URL to proxy',
        category: 'image-proxy',
        level: 'info',
        data: { 
          originalUrl, 
          proxiedUrl,
          isS3: true 
        },
      });
      
      return proxiedUrl;
    }
    
    // For other URLs, return as is
    console.log('ImageProxyService: Non-S3 URL, returning as-is', { originalUrl });
    
    Sentry.addBreadcrumb({
      message: 'ImageProxyService: Non-S3 URL, returning as-is',
      category: 'image-proxy',
      level: 'info',
      data: { originalUrl },
    });
    
    return originalUrl;
  }
}

// Upload Service
export class UploadService {
  // Single file upload
  static async uploadFile(file: File): Promise<{ file_url: string }> {
    // Get presigned URL first
    const { url } = await MediaService.getUploadUrl({
      filename: file.name,
      filetype: file.type,
      filesize: file.size,
    });

    // Upload to S3
    const uploadResponse = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    return { file_url: url.split('?')[0] };
  }

  // Batch upload
  static async uploadFiles(files: File[]): Promise<{ file_url: string }[]> {
    // Get batch presigned URLs
    const uploadData = files.map(file => ({
      filename: file.name,
      filetype: file.type,
      filesize: file.size,
    }));

    const urls = await MediaService.getBatchUploadUrls(uploadData);

    // Upload all files in parallel
    const uploadPromises = files.map(async (file, index) => {
      const uploadResponse = await fetch(urls[index].url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed for ${file.name}: ${uploadResponse.statusText}`);
      }

      return { file_url: urls[index].url.split('?')[0] };
    });

    return Promise.all(uploadPromises);
  }
}

// Export all services
export const apiServices = {
  media: MediaService,
  download: DownloadService,
  upload: UploadService,
  imageProxy: ImageProxyService,
};
