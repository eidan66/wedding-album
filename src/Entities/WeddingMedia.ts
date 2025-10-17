import { apiServices } from '@/services/api';

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
  hasMore?: boolean;
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

  // Methods - Updated to use new API services
  create: async (params: WeddingMediaCreateParams): Promise<WeddingMediaItem> => {
    try {
      return await apiServices.media.createMedia(params);
    } catch (error) {
      console.error('Error creating media item:', error);
      throw error;
    }
  },

  list: async (sortBy: string = "-created_date", page: number = 1, limit: number = 20): Promise<AlbumResponse> => {
    try {
      const response = await apiServices.media.getMediaList({
        sort: sortBy,
        page,
        limit,
      });
      
      // Transform WeddingMediaItem[] to AlbumItem[] format
      const transformedItems = response.items.map((item: WeddingMediaItem) => ({
        id: item.id,
        url: item.media_url,
        type: (item.media_type === 'photo' ? 'image' : 'video') as 'image' | 'video',
        created_date: item.created_date,
        title: item.title,
        uploader_name: item.uploader_name,
        thumbnail_url: item.thumbnail_url,
      }));

      return {
        items: transformedItems,
        total_items: response.total_items,
        total_pages: response.total_pages,
        hasMore: response.hasMore,
      };
    } catch (error) {
      console.error('Error fetching media items:', error);
      throw error;
    }
  }
};