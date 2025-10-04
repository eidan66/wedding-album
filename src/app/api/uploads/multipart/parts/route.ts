import { NextRequest, NextResponse } from 'next/server';
import { S3Client, UploadPartCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface PartsRequest {
  key: string;
  uploadId: string;
  partNumbers: number[];
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

    const { key, uploadId, partNumbers } = await request.json() as PartsRequest;

    if (!key || !uploadId || !partNumbers || !Array.isArray(partNumbers)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate part numbers (AWS requires 1-10000)
    if (partNumbers.some(num => num < 1 || num > 10000)) {
      return NextResponse.json(
        { error: 'Invalid part numbers (must be 1-10000)' },
        { status: 400 }
      );
    }

    // Generate presigned URLs for each part
    const presignedUrls = await Promise.all(
      partNumbers.map(async (partNumber) => {
        const command = new UploadPartCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
        });

        const url = await getSignedUrl(s3Client, command, { 
          expiresIn: 3600 // 1 hour
        });

        return {
          partNumber,
          url,
        };
      })
    );

    return NextResponse.json(presignedUrls);
  } catch (error) {
    console.error('Error generating part URLs:', error);
    return NextResponse.json(
      { error: 'Failed to generate part URLs' },
      { status: 500 }
    );
  }
}

