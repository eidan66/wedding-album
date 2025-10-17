import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
import { cacheGet, cacheSet, CacheKeys } from '@/lib/redis';
import { logger } from '@/lib/logger';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const VIDEO_EXT = new Set(['.mp4','.mov','.webm','.mkv','.3gp','.hevc','.qt']);

// Cache TTL for media count (10 minutes)
const MEDIA_COUNT_CACHE_TTL = 10 * 60; // seconds

export async function GET(req: NextRequest) {
  try {
    if (!process.env.S3_BUCKET_NAME) {
      return NextResponse.json({ error: 'Missing S3_BUCKET_NAME' }, { status: 500 });
    }

    const type = new URL(req.url).searchParams.get('type');

    // Try to get from cache first
    const cacheKey = CacheKeys.mediaCount(type || undefined);
    const cached = await cacheGet<{ total: number; type: string }>(cacheKey);
    
    if (cached) {
      logger.info('Cache hit for media count', { 
        type,
        cacheKey,
        total: cached.total,
      });
      return NextResponse.json(cached, {
        headers: {
          'X-Cache': 'HIT',
        },
      });
    }

    logger.info('Cache miss for media count, fetching from S3', { 
      type,
      cacheKey,
    });

    let continuationToken: string | undefined = undefined;
    let total = 0;

    do {
      const res: ListObjectsV2CommandOutput = await s3.send(new ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET_NAME,
        Prefix: 'wedding-uploads/',
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      }));
      const items = (res.Contents ?? []).filter(o => !!o.Key && !o.Key!.endsWith('/'));
      for (const obj of items) {
        const key = obj.Key as string;
        if (!type) { total++; continue; }
        const lower = key.toLowerCase();
        const isVideo = Array.from(VIDEO_EXT).some(ext => lower.endsWith(ext));
        if (type === 'video' && isVideo) total++;
        if (type === 'photo' && !isVideo) total++;
      }
      continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (continuationToken);

    const response = { total, type: type ?? 'all' };

    // Cache the response
    await cacheSet(cacheKey, response, { ttl: MEDIA_COUNT_CACHE_TTL });
    logger.info('Cached media count', { 
      type,
      cacheKey,
      total,
    });

    return NextResponse.json(response, {
      headers: {
        'X-Cache': 'MISS',
      },
    });
  } catch (err) {
    console.error('Count error', err);
    return NextResponse.json({ error: 'Failed to count media' }, { status: 500 });
  }
}
