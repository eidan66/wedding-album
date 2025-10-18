import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      hasRegion: !!process.env.AWS_REGION,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      hasBucket: !!process.env.S3_BUCKET_NAME,
      bucketName: process.env.S3_BUCKET_NAME,
      region: process.env.AWS_REGION,
      environment: process.env.NODE_ENV,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    };

    // Test S3 connection
    let s3Test: { connected: boolean; error: string | null } = { connected: false, error: null };
    if (envCheck.hasRegion && envCheck.hasAccessKey && envCheck.hasSecretKey) {
      try {
        const s3Client = new S3Client({
          region: process.env.AWS_REGION,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          },
        });

        await s3Client.send(new ListBucketsCommand({}));
        s3Test = { connected: true, error: null };
      } catch (error) {
        s3Test = { connected: false, error: error instanceof Error ? error.message : String(error) };
      }
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      s3: s3Test,
      cors: {
        allowedOrigin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_APP_URL || 'https://idanlevian.com'
          : '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
