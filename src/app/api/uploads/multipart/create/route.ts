import { NextRequest, NextResponse } from 'next/server';
import { S3Client, CreateMultipartUploadCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { allowedTypes } from '@/constants/allowedTypes';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface CreateMultipartRequest {
  coupleId?: string;
  fileName: string;
  mime: string;
  size: number;
  title?: string;
  uploaderName?: string;
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

    const { coupleId, fileName, mime, size, title, uploaderName } = await request.json() as CreateMultipartRequest;

    if (!fileName || !mime || !size) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!allowedTypes.includes(mime)) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      );
    }

    // Validate file size (350MB limit) - COMMENTED OUT FOR UNLIMITED UPLOADS
    // const MAX_FILE_SIZE = 350 * 1024 * 1024;
    // if (size > MAX_FILE_SIZE) {
    //   return NextResponse.json(
    //     { error: 'File size exceeds 350MB limit' },
    //     { status: 400 }
    //   );
    // }

    // Generate unique key
    const extension = fileName.split('.').pop();
    const uniqueFilename = `${uuidv4()}.${extension}`;
    const key = `wedding-uploads/${uniqueFilename}`;

    // Prepare metadata
    const metadata: Record<string, string> = {
      original_filename: encodeURIComponent(fileName),
      created_date: new Date().toISOString(),
    };
    if (title) metadata.title = encodeURIComponent(title);
    if (uploaderName) metadata.uploader_name = encodeURIComponent(uploaderName);
    if (coupleId) metadata.couple_id = coupleId;

    // Create multipart upload
    const command = new CreateMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      ContentType: mime,
      Metadata: metadata,
    });

    const response = await s3Client.send(command);

    return NextResponse.json({
      uploadId: response.UploadId,
      key: key,
      bucket: process.env.S3_BUCKET_NAME,
    });
  } catch (error) {
    console.error('Error creating multipart upload:', error);
    return NextResponse.json(
      { error: 'Failed to create multipart upload' },
      { status: 500 }
    );
  }
}

