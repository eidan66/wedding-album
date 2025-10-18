import { NextRequest, NextResponse } from 'next/server';
import { invalidateMediaCache } from '@/lib/redis';
import { logger } from '@/lib/logger';

// Define the POST /media endpoint
export async function POST(request: NextRequest) {
  try {
    const { media_url, title, media_type, uploader_name, thumbnail_url } = await request.json(); // Data sent from the client

    logger.info('Received media item data (S3 metadata based)', { media_url, title, media_type, uploader_name, thumbnail_url });

    // Generate a unique ID for the media item
    const id = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const created_date = new Date().toISOString();

    // Create the media item object that matches WeddingMediaItem interface
    const mediaItem = {
      id,
      title: title || "",
      media_url: media_url.split('?')[0], // Remove query parameters
      media_type,
      uploader_name: uploader_name || "אורח אנונימי",
      thumbnail_url: thumbnail_url || undefined,
      created_date
    };

    // CRITICAL: Invalidate Redis cache so gallery shows new media immediately
    try {
      await invalidateMediaCache();
      logger.info('Redis cache invalidated after media creation', { mediaId: id });
    } catch (error) {
      logger.warn('Failed to invalidate Redis cache after media creation', {
        error: error instanceof Error ? error.message : String(error),
        mediaId: id,
      });
      // Non-fatal: cache will expire eventually (5 minutes)
    }

    return NextResponse.json(mediaItem, { status: 201 });
  } catch (error) {
    logger.error('Error processing media item', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ 
      message: 'Failed to process media item' 
    }, { status: 500 });
  }
}
