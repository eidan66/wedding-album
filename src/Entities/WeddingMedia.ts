import { API_BASE } from '@/config';

interface WeddingMediaCreateParams {
  title?: string;
  media_url: string;
  media_type: 'photo' | 'video';
  uploader_name: string;
  thumbnail_url?: string;
}

export interface WeddingMediaItem extends WeddingMediaCreateParams {
  id: string;
  created_date: string;
  media_type: 'photo' | 'video';
}

// Define the expected structure of the album response from the API
interface AlbumResponse {
  items: Array<{ // Assuming the response has an 'items' array
    id: string;
    url: string; // The API seems to use 'url' instead of 'media_url'
    type: 'image' | 'video'; // The API seems to use 'image' instead of 'photo'
    title?: string;
    uploader_name: string;
    created_date: string;
    thumbnail_url?: string;
  }>;
  // Add other potential fields from the API response here if needed, e.g., pagination info
  total_items?: number;
  total_pages?: number;
  current_page?: number;
}

export const WeddingMedia = {
  name: "WeddingMedia",
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Caption or title for the media"
    },
    media_url: {
      type: "string",
      description: "URL of the uploaded media file"
    },
    media_type: {
      type: "string",
      enum: ["photo", "video"],
      description: "Type of media"
    },
    uploader_name: {
      type: "string",
      description: "Name of the person who uploaded"
    },
    thumbnail_url: {
      type: "string",
      description: "Thumbnail URL for videos"
    }
  },
  required: ["media_url", "media_type"],

  // Methods
  create: async (params: WeddingMediaCreateParams): Promise<WeddingMediaItem> => {
    try {
      const response = await fetch(`${API_BASE}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create media item');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating media item:', error);
      throw error;
    }
  },

  list: async (sortBy: string = "-created_date", page: number = 1, limit: number = 20): Promise<AlbumResponse> => {
    try {
      const response = await fetch(`${API_BASE}/download?sort=${sortBy}&page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch media items');
      }

      const data: AlbumResponse = await response.json();
      return data; // Return the full data object
    } catch (error) {
      console.error('Error fetching media items:', error);
      throw error;
    }
  }
};