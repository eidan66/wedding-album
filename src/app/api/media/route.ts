import { NextRequest, NextResponse } from 'next/server';

// Define the POST /media endpoint
export async function POST(request: NextRequest) {
  try {
    const { media_url, title, media_type, uploader_name, thumbnail_url } = await request.json(); // Data sent from the client

    console.log('Received media item data (S3 metadata based):', { media_url, title, media_type, uploader_name, thumbnail_url });

    // Generate a unique ID for the media item
    const id = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const created_date = new Date().toISOString();

    // Create the media item object that matches WeddingMediaItem interface
    const mediaItem = {
      id,
      title: title || "",
      media_url: media_url.split('?')[0], // Remove query parameters
      media_type,
      uploader_name: uploader_name || "אורח אנונימי",
      thumbnail_url: thumbnail_url || undefined,
      created_date
    };

    return NextResponse.json(mediaItem, { status: 201 });
  } catch (error) {
    console.error('Error processing media item:', error);
    return NextResponse.json({ 
      message: 'Failed to process media item' 
    }, { status: 500 });
  }
}
