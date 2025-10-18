import { NextRequest, NextResponse } from 'next/server';
import { generateUploadUrl } from '@/utils/s3';
import { handlePreflight, withCors } from '@/lib/cors';

// Handle preflight requests
export async function OPTIONS() {
  return handlePreflight();
}

interface UploadRequest {
  filename: string;
  filetype: string;
  filesize: number;
  title?: string;
  uploaderName?: string;
}

interface CustomError {
  status: number;
  code?: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check if required environment variables are set
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || 
        !process.env.AWS_SECRET_ACCESS_KEY || !process.env.S3_BUCKET_NAME) {
      console.error('Missing required AWS environment variables', {
        hasRegion: !!process.env.AWS_REGION,
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
        hasBucket: !!process.env.S3_BUCKET_NAME,
      });
      return NextResponse.json(
        {
          error: 'AWS configuration is incomplete. Please check environment variables.',
        },
        { status: 500 }
      );
    }

    const { filename, filetype, filesize, title, uploaderName } = await request.json() as UploadRequest;
    
    console.log('Upload URL request received', {
      filename,
      filetype,
      filesize,
      hasTitle: !!title,
      hasUploaderName: !!uploaderName,
      environment: process.env.NODE_ENV,
      bucket: process.env.S3_BUCKET_NAME,
      region: process.env.AWS_REGION,
    });

    // Validate required fields
    if (!filename || !filetype || !filesize) {
      return NextResponse.json(
        {
          error: 'Missing required fields: filename, filetype, and filesize are required',
        },
        { status: 400 }
      );
    }

    const result = await generateUploadUrl(filename, filetype, filesize, title, uploaderName);
    return withCors(NextResponse.json(result));
  } catch (error) {
    console.error('Error generating upload URL:', error);
    
    // Handle custom error objects from generateUploadUrl
    if (error && typeof error === 'object' && 'status' in error) {
      const customError = error as CustomError;
      return NextResponse.json(
        {
          error: customError.message || 'Failed to generate upload URL',
        },
        { status: customError.status }
      );
    }
    
    return withCors(NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate upload URL',
      },
      { status: 400 }
    ));
  }
}

// Health check endpoint for uptime monitoring
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
}
