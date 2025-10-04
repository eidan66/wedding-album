import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { allowedTypes } from '@/constants/allowedTypes';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface PresignRequest {
  coupleId: string;
  fileName: string;
  mime: string;
  fileSize?: number;
}

interface PresignResponse {
  url: string;
  key: string;
  fields?: Record<string, string>;
}

export async function POST(request: NextRequest) {
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

    const { coupleId, fileName, mime } = await request.json() as PresignRequest;

    // Validate required fields
    if (!coupleId || !fileName || !mime) {
      return NextResponse.json(
        { error: 'Missing required fields: coupleId, fileName, and mime are required' },
        { status: 400 }
      );
    }

    // Validate coupleId format (basic validation)
    if (typeof coupleId !== 'string' || coupleId.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid coupleId format' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!allowedTypes.includes(mime)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Only images and videos are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (200MB limit as specified) - COMMENTED OUT FOR UNLIMITED UPLOADS
    // const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB in bytes
    // if (fileSize && fileSize > MAX_FILE_SIZE) {
    //   return NextResponse.json(
    //     { error: 'File size exceeds 200MB limit.' },
    //     { status: 400 }
    //   );
    // }

    // Generate unique key with coupleId structure
    const extension = fileName.split('.').pop()?.toLowerCase() || 'bin';
    const uniqueId = uuidv4();
    const key = `${coupleId}/raw/${uniqueId}.${extension}`;

    // Create the command for presigned URL
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      ContentType: mime,
      Metadata: {
        original_filename: encodeURIComponent(fileName),
        couple_id: coupleId,
        upload_date: new Date().toISOString(),
        processing_status: 'pending',
      },
    });

    // Generate pre-signed URL (expires in 15 minutes)
    const url = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    const response: PresignResponse = {
      url,
      key,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate presigned URL' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    endpoint: 'presigned-upload'
  });
}
