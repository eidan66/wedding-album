import { NextRequest, NextResponse } from 'next/server';
import { handlePreflight, withCors } from '@/lib/cors';

// Handle preflight requests
export async function OPTIONS() {
  return handlePreflight();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const filename = searchParams.get('filename') || 'download';

    if (!url) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    // Fetch the file from S3
    const s3Response = await fetch(url);
    
    if (!s3Response.ok) {
      throw new Error(`Failed to fetch file: ${s3Response.status} ${s3Response.statusText}`);
    }

    // Get the file as a stream for better memory usage
    const blob = await s3Response.blob();
    
    // Create proper download response with CORS headers
    const downloadResponse = new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream', // Force download
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Content-Length': blob.size.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
    return withCors(downloadResponse, true); // true for image/media CORS
  } catch (error) {
    console.error('Download error:', error);
    const errorResponse = NextResponse.json({ 
      error: 'Download failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
    return withCors(errorResponse);
  }
}
