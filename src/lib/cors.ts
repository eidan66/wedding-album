import { NextResponse } from 'next/server';

// CORS headers for production
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_APP_URL || 'https://idanlevian.com/wedding-album'
    : '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 hours
};

// CORS headers specifically for images/media
export const imageCorsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow all origins for images
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
  'Access-Control-Max-Age': '86400', // 24 hours
  'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
};

// Helper function to add CORS headers to response
export function withCors(response: NextResponse, isImage: boolean = false): NextResponse {
  const headers = isImage ? imageCorsHeaders : corsHeaders;
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

// Helper function to create CORS response
export function createCorsResponse(data: unknown, status: number = 200, isImage: boolean = false): NextResponse {
  const response = NextResponse.json(data, { status });
  return withCors(response, isImage);
}

// Handle preflight requests
export function handlePreflight(): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
