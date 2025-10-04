import { NextRequest, NextResponse } from 'next/server';
import { S3Client, AbortMultipartUploadCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface AbortRequest {
  key: string;
  uploadId: string;
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

    const { key, uploadId } = await request.json() as AbortRequest;

    if (!key || !uploadId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Abort multipart upload
    const command = new AbortMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
    });

    await s3Client.send(command);

    return NextResponse.json({
      success: true,
      message: 'Multipart upload aborted successfully',
    });
  } catch (error) {
    console.error('Error aborting multipart upload:', error);
    return NextResponse.json(
      { error: 'Failed to abort multipart upload' },
      { status: 500 }
    );
  }
}

