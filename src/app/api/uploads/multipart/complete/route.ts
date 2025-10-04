import { NextRequest, NextResponse } from 'next/server';
import { S3Client, CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';
import { WeddingMedia } from '@/Entities/WeddingMedia';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface CompleteRequest {
  key: string;
  uploadId: string;
  parts: Array<{
    ETag: string;
    PartNumber: number;
  }>;
  title?: string;
  uploaderName?: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || 
        !process.env.AWS_SECRET_ACCESS_KEY || !process.env.S3_BUCKET_NAME) {
      return NextResponse.json(
        { error: 'AWS configuration incomplete' },
        { status: 500 }
      );
    }

    const { key, uploadId, parts, title, uploaderName } = await request.json() as CompleteRequest;

    if (!key || !uploadId || !parts || parts.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Complete the multipart upload
    const completeCommand = new CompleteMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber)
      }
    });

    const result = await s3Client.send(completeCommand);

    if (!result.Location) {
      throw new Error('Failed to complete multipart upload');
    }

    // Create media item in our database
    const mediaParams = {
      title: title || key.split('/').pop() || 'Untitled',
      media_url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      media_type: key.toLowerCase().includes('.mp4') || key.toLowerCase().includes('.mov') ? 'video' : 'photo' as 'photo' | 'video',
      uploader_name: uploaderName || 'Anonymous'
    };

    const createdMedia = await WeddingMedia.create(mediaParams);

    return NextResponse.json({
      success: true,
      location: result.Location,
      mediaItem: createdMedia
    });

  } catch (error) {
    console.error('Error completing multipart upload:', error);
    return NextResponse.json(
      { error: 'Failed to complete multipart upload' },
      { status: 500 }
    );
  }
}
