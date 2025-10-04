import { logger } from '@/lib/logger';

/**
 * Downloads an image from a URL to the user's device
 * @param url - The URL of the image to download
 * @param filename - Optional filename for the downloaded file
 * @param mediaId - Optional media ID for logging purposes
 */
export async function downloadImage(
  url: string, 
  filename?: string, 
  mediaId?: string
): Promise<void> {
  try {
    logger.info('Starting image download', {
      url,
      filename,
      mediaId,
      userAgent: navigator.userAgent,
    });

    // Use proxy for S3 URLs to avoid CORS issues
    const fetchUrl = url.includes('sapir-and-idan-wedding-albums.s3.il-central-1.amazonaws.com') 
      ? `/api/proxy/image?url=${encodeURIComponent(url)}`
      : url;
    
    // Fetch the image
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // Get the blob
    const blob = await response.blob();
    
    logger.info('Image fetched successfully', {
      url,
      mediaId,
      responseStatus: response.status,
      responseHeaders: Object.fromEntries(response.headers.entries()),
      blobSize: blob.size,
      blobType: blob.type,
    });
    
    // Create filename if not provided
    if (!filename) {
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      const extension = lastPart.split('.').pop() || 'jpg';
      filename = `wedding-memory-${Date.now()}.${extension}`;
    }

    logger.info('Creating download link for image', {
      url,
      mediaId,
      filename,
      blobSize: blob.size,
      blobType: blob.type,
    });

    // Check if we're on mobile and have Web Share API support
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasWebShareAPI = 'share' in navigator && 'canShare' in navigator;
    
    if (isMobile && hasWebShareAPI) {
      try {
        // Create a file from the blob
        const file = new File([blob], filename, { type: blob.type });
        
        // Check if we can share this file
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: filename,
            text: `זיכרון מהחתונה - ${filename}`
          });
          
          logger.info('Image shared successfully via Web Share API', {
            url,
            filename,
            mediaId,
            fileSize: blob.size,
            contentType: blob.type,
          });
          return;
        }
      } catch (shareError) {
        logger.warn('Web Share API failed, falling back to download', {
          error: shareError instanceof Error ? shareError.message : String(shareError),
          url,
          filename,
          mediaId,
        });
        // Fall through to regular download
      }
    }

    // Create download link
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    
    // For mobile, try to open in new tab if download doesn't work
    if (isMobile) {
      link.target = '_blank';
    }
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    window.URL.revokeObjectURL(downloadUrl);

    logger.info('Image download completed successfully', {
      url,
      filename,
      mediaId,
      fileSize: blob.size,
      contentType: blob.type,
    });

  } catch (error) {
    logger.error('Image download failed', error instanceof Error ? error : new Error(String(error)), {
      url,
      filename,
      mediaId,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Downloads a video from a URL to the user's device
 * @param url - The URL of the video to download
 * @param filename - Optional filename for the downloaded file
 * @param mediaId - Optional media ID for logging purposes
 */
export async function downloadVideo(
  url: string, 
  filename?: string, 
  mediaId?: string
): Promise<void> {
  try {
    logger.info('Starting video download', {
      url,
      filename,
      mediaId,
      userAgent: navigator.userAgent,
    });

    // Fetch the video
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
    }

    // Get the blob
    const blob = await response.blob();
    
    logger.info('Video fetched successfully', {
      url,
      mediaId,
      responseStatus: response.status,
      responseHeaders: Object.fromEntries(response.headers.entries()),
      blobSize: blob.size,
      blobType: blob.type,
    });
    
    // Create filename if not provided
    if (!filename) {
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      const extension = lastPart.split('.').pop() || 'mp4';
      filename = `wedding-video-${Date.now()}.${extension}`;
    }

    logger.info('Creating download link for video', {
      url,
      mediaId,
      filename,
      blobSize: blob.size,
      blobType: blob.type,
    });

    // Check if we're on mobile and have Web Share API support
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasWebShareAPI = 'share' in navigator && 'canShare' in navigator;
    
    if (isMobile && hasWebShareAPI) {
      try {
        // Create a file from the blob
        const file = new File([blob], filename, { type: blob.type });
        
        // Check if we can share this file
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: filename,
            text: `זיכרון מהחתונה - ${filename}`
          });
          
          logger.info('Video shared successfully via Web Share API', {
            url,
            filename,
            mediaId,
            fileSize: blob.size,
            contentType: blob.type,
          });
          return;
        }
      } catch (shareError) {
        logger.warn('Web Share API failed, falling back to download', {
          error: shareError instanceof Error ? shareError.message : String(shareError),
          url,
          filename,
          mediaId,
        });
        // Fall through to regular download
      }
    }

    // Create download link
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    
    // For mobile, try to open in new tab if download doesn't work
    if (isMobile) {
      link.target = '_blank';
    }
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    window.URL.revokeObjectURL(downloadUrl);

    logger.info('Video download completed successfully', {
      url,
      filename,
      mediaId,
      fileSize: blob.size,
      contentType: blob.type,
    });

  } catch (error) {
    logger.error('Video download failed', error instanceof Error ? error : new Error(String(error)), {
      url,
      filename,
      mediaId,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Downloads media (image or video) based on its type
 * @param mediaUrl - The URL of the media to download
 * @param mediaType - The type of media ('photo' or 'video')
 * @param title - Optional title for the filename
 * @param mediaId - Optional media ID for logging purposes
 */
export async function downloadMedia(
  mediaUrl: string,
  mediaType: 'photo' | 'video',
  title?: string,
  mediaId?: string
): Promise<void> {
  try {
    logger.info('Starting media download process', {
      mediaUrl,
      mediaType,
      title,
      mediaId,
      userAgent: navigator.userAgent,
    });

    // Create filename from title if available
    let filename: string | undefined;
    if (title) {
      const sanitizedTitle = title.replace(/[^a-zA-Z0-9\u0590-\u05FF\s]/g, '').trim();
      const extension = mediaType === 'photo' ? 'jpg' : 'mp4';
      filename = `${sanitizedTitle || 'wedding-memory'}-${Date.now()}.${extension}`;
    }

    logger.info('Media download filename determined', {
      mediaUrl,
      mediaType,
      title,
      mediaId,
      filename,
      filenameGenerated: !!filename,
    });

    if (mediaType === 'photo') {
      await downloadImage(mediaUrl, filename, mediaId);
    } else {
      await downloadVideo(mediaUrl, filename, mediaId);
    }

    logger.info('Media download process completed successfully', {
      mediaUrl,
      mediaType,
      title,
      mediaId,
      filename,
    });

  } catch (error) {
    logger.error('Media download process failed', error instanceof Error ? error : new Error(String(error)), {
      mediaUrl,
      mediaType,
      title,
      mediaId,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
