import { NextRequest, NextResponse } from 'next/server';
import { handlePreflight, withCors } from '@/lib/cors';
import * as Sentry from '@sentry/nextjs';

// Handle preflight requests
export async function OPTIONS() {
  return handlePreflight();
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    console.log('ImageProxy: Request received', {
      imageUrl,
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
    });
    
    // Log to Sentry for monitoring
    Sentry.addBreadcrumb({
      message: 'ImageProxy: Request received',
      category: 'image-proxy',
      level: 'info',
      data: {
        imageUrl,
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
      },
    });

    if (!imageUrl) {
      console.error('ImageProxy: Missing URL parameter');
      
      Sentry.captureMessage('ImageProxy: Missing URL parameter', {
        level: 'warning',
        tags: { component: 'image-proxy' },
      });
      
      return withCors(NextResponse.json(
        { error: 'Missing URL parameter' },
        { status: 400 }
      ));
    }

    // Validate that it's an S3 URL for security
    if (!imageUrl.includes('sapir-and-idan-wedding-albums.s3.il-central-1.amazonaws.com')) {
      console.error('ImageProxy: Invalid S3 URL', { imageUrl });
      
      Sentry.captureMessage('ImageProxy: Invalid S3 URL', {
        level: 'warning',
        tags: { component: 'image-proxy' },
        extra: { imageUrl },
      });
      
      return withCors(NextResponse.json(
        { error: 'Invalid image URL' },
        { status: 400 }
      ));
    }

    // Fetch the image from S3
    console.log('ImageProxy: Fetching from S3', { imageUrl });
    const s3StartTime = Date.now();
    const response = await fetch(imageUrl);
    const s3Duration = Date.now() - s3StartTime;
    
    if (!response.ok) {
      console.error('ImageProxy: S3 fetch failed', {
        imageUrl,
        status: response.status,
        statusText: response.statusText,
        s3Duration,
      });
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // Get the image as a blob
    const blob = await response.blob();
    const totalDuration = Date.now() - startTime;
    
    console.log('ImageProxy: Success', {
      imageUrl,
      blobSize: blob.size,
      contentType: response.headers.get('Content-Type'),
      s3Duration,
      totalDuration,
    });
    
    // Log success to Sentry
    Sentry.addBreadcrumb({
      message: 'ImageProxy: Success',
      category: 'image-proxy',
      level: 'info',
      data: {
        imageUrl,
        blobSize: blob.size,
        contentType: response.headers.get('Content-Type'),
        s3Duration,
        totalDuration,
      },
    });
    
    // Create response with proper CORS headers for images
    const imageResponse = new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        'Content-Length': blob.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
      },
    });
    
    return imageResponse;
  } catch (error) {
    console.error('Image proxy error:', error);
    
    // Log error to Sentry
    Sentry.captureException(error, {
      tags: { component: 'image-proxy' },
      extra: {
        imageUrl: request.url,
        userAgent: request.headers.get('user-agent'),
      },
    });
    
    return withCors(NextResponse.json(
      { 
        error: 'Failed to fetch image',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    ));
  }
}
