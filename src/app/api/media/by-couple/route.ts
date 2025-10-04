import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface MediaItem {
  id: string;
  mp4Url: string;
  webmUrl?: string;
  posterUrl: string;
  width: number;
  height: number;
  duration?: number;
  type: 'image' | 'video';
  media_type: 'photo' | 'video'; // Add media_type for filtering
  originalKey: string;
  createdAt: string;
  status: 'processing' | 'ready' | 'failed';
  error?: string;
}

interface ProcessedMetadataJson {
  width?: number;
  height?: number;
  duration?: number;
  originalKey?: string;
  createdAt?: string;
  status?: 'completed' | 'failed' | 'processing';
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Check if required environment variables are set
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || 
        !process.env.AWS_SECRET_ACCESS_KEY || !process.env.S3_BUCKET_NAME) {
      console.error('Missing required AWS environment variables');
      return NextResponse.json(
        { error: 'AWS configuration is incomplete. Please check environment variables.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const coupleId = searchParams.get('coupleId');

    if (!coupleId) {
      return NextResponse.json(
        { error: 'coupleId query parameter is required' },
        { status: 400 }
      );
    }

    // List objects under the couple's processed folder
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: `${coupleId}/processed/`,
    });

    const listResponse = await s3Client.send(listCommand);
    const mediaItems: MediaItem[] = [];

    if (listResponse.Contents) {
      // Group files by their base ID (without extension)
      const fileGroups = new Map<string, {
        json?: ProcessedMetadataJson;
        mp4?: string;
        webm?: string;
        jpg?: string;
        originalKey?: string;
      }>();

      // First pass: collect all files and group them
      for (const object of listResponse.Contents) {
        const key = object.Key!;
        const fileName = key.split('/').pop()!;
        const baseId = fileName.split('.')[0];
        
        if (!fileGroups.has(baseId)) {
          fileGroups.set(baseId, {});
        }
        
        const group = fileGroups.get(baseId)!;
        
        if (fileName.endsWith('.json')) {
          // Fetch and parse JSON metadata
          try {
            const getCommand = new GetObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: key,
            });
            const jsonResponse = await s3Client.send(getCommand);
            const jsonText = await jsonResponse.Body?.transformToString();
            if (jsonText) {
              group.json = JSON.parse(jsonText) as ProcessedMetadataJson;
            }
          } catch (error) {
            console.error(`Error fetching JSON for ${key}:`, error);
          }
        } else if (fileName.endsWith('.mp4')) {
          group.mp4 = key;
        } else if (fileName.endsWith('.webm')) {
          group.webm = key;
        } else if (fileName.endsWith('.jpg')) {
          group.jpg = key;
        }
      }

      // Second pass: create media items from complete groups
      for (const [baseId, group] of fileGroups) {
        if (group.json && (group.mp4 || group.jpg)) {
          const metadata = group.json;
          
          // Generate signed URLs (1 hour TTL)
          const mp4Url = group.mp4 ? await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: group.mp4,
            }),
            { expiresIn: 3600 }
          ) : '';

          const webmUrl = group.webm ? await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: group.webm,
            }),
            { expiresIn: 3600 }
          ) : undefined;

          const posterUrl = group.jpg ? await getSignedUrl(
            s3Client,
            new GetObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: group.jpg,
            }),
            { expiresIn: 3600 }
          ) : '';

          const mediaItem: MediaItem = {
            id: baseId,
            mp4Url,
            webmUrl,
            posterUrl,
            width: metadata.width || 0,
            height: metadata.height || 0,
            duration: metadata.duration,
            type: metadata.duration ? 'video' : 'image',
            media_type: metadata.duration ? 'video' : 'photo', // Add media_type for filtering
            originalKey: metadata.originalKey || '',
            createdAt: metadata.createdAt || new Date().toISOString(),
            status: metadata.status === 'completed' ? 'ready' : metadata.status === 'failed' ? 'failed' : 'processing',
            error: metadata.error,
          };

          mediaItems.push(mediaItem);
        }
      }
    }

    // Sort by creation date (newest first)
    mediaItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      items: mediaItems,
      count: mediaItems.length,
      coupleId,
    });

  } catch (error) {
    console.error('Error listing media for couple:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list media' },
      { status: 500 }
    );
  }
}
