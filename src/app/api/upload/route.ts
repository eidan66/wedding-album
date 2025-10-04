import { NextRequest, NextResponse } from 'next/server';
import { generateUploadUrl } from '@/utils/s3';
import { logger } from '@/lib/logger';

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
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  try {
    logger.apiRequest('POST', '/api/upload', {
      requestId,
      userAgent: request.headers.get('user-agent') ?? undefined,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });

    // Check if required environment variables are set
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || 
        !process.env.AWS_SECRET_ACCESS_KEY || !process.env.S3_BUCKET_NAME) {
      logger.error('Missing required AWS environment variables', undefined, {
        requestId,
        missingVars: {
          AWS_REGION: !process.env.AWS_REGION,
          AWS_ACCESS_KEY_ID: !process.env.AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY: !process.env.AWS_SECRET_ACCESS_KEY,
          S3_BUCKET_NAME: !process.env.S3_BUCKET_NAME,
        },
      });
      
      return NextResponse.json(
        {
          error: 'AWS configuration is incomplete. Please check environment variables.',
        },
        { status: 500 }
      );
    }

    const { filename, filetype, filesize, title, uploaderName } = await request.json() as UploadRequest;

    logger.info('Processing upload request', {
      requestId,
      filename,
      filetype,
      filesize,
      title,
      uploaderName,
    });

    // Validate required fields
    if (!filename || !filetype || !filesize) {
      logger.warn('Missing required fields in upload request', {
        requestId,
        filename: !!filename,
        filetype: !!filetype,
        filesize: !!filesize,
      });
      
      return NextResponse.json(
        {
          error: 'Missing required fields: filename, filetype, and filesize are required',
        },
        { status: 400 }
      );
    }

    const result = await generateUploadUrl(filename, filetype, filesize, title, uploaderName);
    
    logger.apiResponse('POST', '/api/upload', 200, Date.now() - startTime, {
      requestId,
      filename,
      filetype,
      filesize,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Error generating upload URL', error instanceof Error ? error : new Error(String(error)), {
      requestId,
      duration,
    });
    
    // Handle custom error objects from generateUploadUrl
    if (error && typeof error === 'object' && 'status' in error) {
      const customError = error as CustomError;
      
      logger.apiResponse('POST', '/api/upload', customError.status, duration, {
        requestId,
        errorCode: customError.code,
        errorMessage: customError.message,
      });
      
      return NextResponse.json(
        {
          error: customError.message || 'Failed to generate upload URL',
        },
        { status: customError.status }
      );
    }
    
    logger.apiResponse('POST', '/api/upload', 400, duration, {
      requestId,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate upload URL',
      },
      { status: 400 }
    );
  }
}

// Health check endpoint for uptime monitoring
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
}
