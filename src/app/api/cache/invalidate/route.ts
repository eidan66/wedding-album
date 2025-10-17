import { NextRequest, NextResponse } from 'next/server';
import { invalidateMediaCache } from '@/lib/redis';
import { logger } from '@/lib/logger';

/**
 * Cache Invalidation Endpoint
 * Call this after successful file upload to invalidate media cache
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    logger.apiRequest('POST', '/api/cache/invalidate', {
      requestId,
      userAgent: request.headers.get('user-agent') ?? undefined,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });

    // Invalidate all media cache
    await invalidateMediaCache();

    const duration = Date.now() - startTime;
    logger.apiResponse('POST', '/api/cache/invalidate', 200, duration, {
      requestId,
      message: 'Cache invalidated successfully',
    });

    return NextResponse.json({
      success: true,
      message: 'Media cache invalidated successfully',
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Error invalidating cache', error instanceof Error ? error : new Error(String(error)), {
      requestId,
      duration,
    });

    logger.apiResponse('POST', '/api/cache/invalidate', 500, duration, {
      requestId,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to invalidate cache',
      },
      { status: 500 }
    );
  }
}

