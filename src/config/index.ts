// API Configuration
export const API_CONFIG = {
  // Base URL configuration
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE && !process.env.NEXT_PUBLIC_API_BASE.includes('localhost') 
    ? `${process.env.NEXT_PUBLIC_API_BASE}/api` 
    : process.env.NODE_ENV === 'production' 
      ? '/wedding-album/api'
      : '/api',
  
  // Request configuration
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Cache configuration
  STALE_TIME: 5 * 60 * 1000, // 5 minutes
  CACHE_TIME: 10 * 60 * 1000, // 10 minutes
  
  // Upload configuration
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Backward compatibility
export const API_BASE = API_CONFIG.BASE_URL;

// Environment helpers
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isClient = typeof window !== 'undefined';
export const isServer = typeof window === 'undefined';