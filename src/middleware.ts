import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_APP_URL || 'https://idanlevian.com/wedding-album'
    : '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

export function middleware(request: NextRequest) {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    console.log('Middleware: Handling preflight request', {
      pathname: request.nextUrl.pathname,
      origin: request.headers.get('origin'),
    });
    
    // Log to Sentry for monitoring
    Sentry.addBreadcrumb({
      message: 'Middleware: Handling preflight request',
      category: 'middleware',
      level: 'info',
      data: {
        pathname: request.nextUrl.pathname,
        origin: request.headers.get('origin'),
      },
    });
    
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Add CORS headers to API responses
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    console.log('Middleware: Added CORS headers to API request', {
      pathname: request.nextUrl.pathname,
      method: request.method,
      origin: request.headers.get('origin'),
    });
    
    // Log to Sentry for monitoring
    Sentry.addBreadcrumb({
      message: 'Middleware: Added CORS headers to API request',
      category: 'middleware',
      level: 'info',
      data: {
        pathname: request.nextUrl.pathname,
        method: request.method,
        origin: request.headers.get('origin'),
      },
    });
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
