import { NextRequest, NextResponse } from 'next/server';
import { handlePreflight, withCors } from '@/lib/cors';
import * as Sentry from '@sentry/nextjs';

// Handle preflight requests
export async function OPTIONS() {
  return handlePreflight();
}

// Handle HEAD requests (required for video playback on mobile)
export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return new NextResponse(null, { status: 400 });
    }

    // Validate URL
    const isValidS3Url = imageUrl.includes('sapir-and-idan-wedding-albums.s3.il-central-1.amazonaws.com');
    const isValidCloudFrontUrl = imageUrl.includes('.cloudfront.net');
    
    if (!isValidS3Url && !isValidCloudFrontUrl) {
      return new NextResponse(null, { status: 400 });
    }

    // Fetch HEAD from S3
    const response = await fetch(imageUrl, { method: 'HEAD' });
    
    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
    }

    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    const contentLength = response.headers.get('Content-Length');
    const isVideo = contentType.startsWith('video/');

    // Build response headers
    const headers: HeadersInit = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
      'Cache-Control': 'public, max-age=31536000, immutable',
    };

    if (contentLength) {
      headers['Content-Length'] = contentLength;
    }

    if (isVideo) {
      headers['Accept-Ranges'] = 'bytes';
    }

    return new NextResponse(null, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('HEAD request error:', error);
    return new NextResponse(null, { status: 500 });
  }
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
      range: request.headers.get('range'),
      fullUrl: request.url,
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
        hasRange: !!request.headers.get('range'),
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

    // Validate that it's an S3 or CloudFront URL for security
    const isValidS3Url = imageUrl.includes('sapir-and-idan-wedding-albums.s3.il-central-1.amazonaws.com');
    const isValidCloudFrontUrl = imageUrl.includes('.cloudfront.net');
    
    if (!isValidS3Url && !isValidCloudFrontUrl) {
      console.error('ImageProxy: Invalid S3/CloudFront URL', { imageUrl });
      
      Sentry.captureMessage('ImageProxy: Invalid S3/CloudFront URL', {
        level: 'warning',
        tags: { component: 'image-proxy' },
        extra: { imageUrl },
      });
      
      return withCors(NextResponse.json(
        { error: 'Invalid image URL' },
        { status: 400 }
      ));
    }

    // Forward Range header for video streaming (critical for mobile!)
    const fetchHeaders: HeadersInit = {};
    const rangeHeader = request.headers.get('range');
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
      console.log('ImageProxy: Forwarding Range header', { range: rangeHeader });
    }

    // TEMPORARY FIX: Always use S3 directly until CloudFront is properly configured
    // CloudFront is returning 403 Forbidden - needs proper Origin Access Control setup
    let response: Response;
    const s3StartTime = Date.now();
    
    if (isValidCloudFrontUrl) {
      console.log('ImageProxy: CloudFront URL detected, converting to S3 direct', { imageUrl });
      
      // Extract S3 key from CloudFront URL
      // https://d1iqpun8bxb9yi.cloudfront.net/wedding-uploads/file.jpg → wedding-uploads/file.jpg
      const urlParts = new URL(imageUrl);
      const s3Key = urlParts.pathname.substring(1); // Remove leading /
      const s3Url = `https://sapir-and-idan-wedding-albums.s3.il-central-1.amazonaws.com/${s3Key}`;
      
      console.log('ImageProxy: Fetching from S3 (CloudFront fallback)', { s3Url, originalCloudFrontUrl: imageUrl });
      response = await fetch(s3Url, { headers: fetchHeaders });
    } else {
      // Direct S3 URL
      console.log('ImageProxy: Fetching from S3', { imageUrl, hasRange: !!rangeHeader });
      response = await fetch(imageUrl, { headers: fetchHeaders });
    }
    
    const s3Duration = Date.now() - s3StartTime;
    
    if (!response.ok && response.status !== 206) {
      console.error('ImageProxy: S3 fetch failed', {
        imageUrl,
        status: response.status,
        statusText: response.statusText,
        s3Duration,
      });
      throw new Error(`Failed to fetch media: ${response.status} ${response.statusText}`);
    }

    // Get content type to determine if it's a video
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    const isVideo = contentType.startsWith('video/');
    
    // CRITICAL FIX: Stream the response directly instead of buffering to memory
    // This enables true video streaming on mobile devices
    const totalDuration = Date.now() - startTime;
    
    console.log('ImageProxy: Streaming response', {
      imageUrl,
      contentType,
      isVideo,
      status: response.status,
      s3Duration,
      totalDuration,
      hasRangeRequest: !!rangeHeader,
    });
    
    // Log success to Sentry
    Sentry.addBreadcrumb({
      message: 'ImageProxy: Streaming response',
      category: 'image-proxy',
      level: 'info',
      data: {
        imageUrl,
        contentType,
        isVideo,
        status: response.status,
        s3Duration,
        totalDuration,
        hasRangeRequest: !!rangeHeader,
      },
    });
    
    // Build response headers
    const responseHeaders: HeadersInit = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
    };

    // Forward critical headers from S3 response
    const contentLength = response.headers.get('Content-Length');
    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength;
    }

    // Add Range-related headers for videos (critical for mobile playback!)
    if (isVideo) {
      responseHeaders['Accept-Ranges'] = 'bytes';
      
      // If this was a range request, preserve the Content-Range header
      const contentRange = response.headers.get('Content-Range');
      if (contentRange) {
        responseHeaders['Content-Range'] = contentRange;
      }
    }
    
    // Return stream directly without buffering (206 for range requests, 200 otherwise)
    const status = response.status === 206 ? 206 : 200;
    
    // Stream the body directly from S3 to the client
    // This is crucial for mobile video playback with Range requests
    const mediaResponse = new NextResponse(response.body, {
      status,
      headers: responseHeaders,
    });
    
    return mediaResponse;
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
