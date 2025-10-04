export const createPageUrl = (pageName: string): string => {
  const routes: Record<string, string> = {
    'Gallery': '/gallery',
    'Upload': '/upload',
    'Download':'/download',
    'Home': '/'
  };
  
  return `${routes[pageName] || '/'}`;
}; 

/**
 * Check if a video file is valid and can potentially be loaded
 */
export const isValidVideoFile = (file: File): boolean => {
  // Check file size (too small files might be corrupted)
  if (file.size < 1024) { // Less than 1KB
    return false;
  }

  // Check if it's a valid video MIME type
  const validVideoTypes = [
    'video/mp4',
    'video/mov',
    'video/quicktime',
    'video/webm',
    'video/hevc',
    'video/3gpp',
    'video/x-matroska'
  ];

  return validVideoTypes.includes(file.type);
};

/**
 * Generate a thumbnail from a video file
 * This creates a canvas with the first frame of the video
 */
export const generateVideoThumbnail = (videoFile: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // First check if the file is valid
    if (!isValidVideoFile(videoFile)) {
      reject(new Error('Invalid video file'));
      return;
    }

    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    let objectUrl: string | null = null;
    let hasResolved = false;

    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
      video.src = '';
      video.remove();
      canvas.remove();
    };

    const handleSuccess = (thumbnailUrl: string) => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        resolve(thumbnailUrl);
      }
    };

    const handleError = (error: Error) => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        reject(error);
      }
    };

    // Set video properties for better compatibility
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.crossOrigin = 'anonymous';

    // Mobile-specific optimizations
    if (isMobile()) {
      // Use lower quality on mobile for better performance
      canvas.width = 160; // Smaller canvas on mobile
      canvas.height = 120;
    }

    video.onloadedmetadata = () => {
      try {
        // Set canvas dimensions
        if (!isMobile()) {
          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 240;
        }
        
        // Seek to 0.1 seconds to get a frame (avoid black frame at 0)
        video.currentTime = 0.1;
      } catch (error) {
        handleError(error as Error);
      }
    };

    video.onseeked = () => {
      try {
        // Draw the video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL with better quality
        const quality = isMobile() ? 0.7 : 0.9; // Lower quality on mobile
        const thumbnailUrl = canvas.toDataURL('image/jpeg', quality);
        handleSuccess(thumbnailUrl);
      } catch (error) {
        handleError(error as Error);
      }
    };

    video.onerror = (e) => {
      console.warn('Video error during thumbnail generation:', e);
      handleError(new Error('Failed to load video for thumbnail generation'));
    };

    video.onabort = () => {
      handleError(new Error('Video loading was aborted'));
    };

    // Set a timeout to prevent hanging (shorter on mobile)
    const timeout = setTimeout(() => {
      handleError(new Error('Video thumbnail generation timed out'));
    }, isMobile() ? 5000 : 10000); // 5 seconds on mobile, 10 on desktop

    // Load the video
    try {
      objectUrl = URL.createObjectURL(videoFile);
      video.src = objectUrl;
      video.load();
    } catch (error) {
      clearTimeout(timeout);
      handleError(error as Error);
    }
  });
};

/**
 * Check if the device is iOS
 */
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

/**
 * Check if the device is mobile
 */
export const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Export download utilities
export { downloadImage, downloadVideo, downloadMedia } from './download'; 