import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { allowedTypes } from '@/constants/allowedTypes';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface BatchItemIn {
  filename: string;
  filetype: string;
  filesize: number;
  title?: string;
  uploaderName?: string;
}

interface BatchBody {
  files: BatchItemIn[];
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.S3_BUCKET_NAME) {
      return NextResponse.json({ error: 'AWS configuration is incomplete' }, { status: 500 });
    }

    const body = (await req.json()) as BatchBody;
    const files = body?.files ?? [];
    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'files array required' }, { status: 400 });
    }

    // Validate and prepare commands in parallel
    const commands = files.map((f) => {
      const typeValid = allowedTypes.includes(f.filetype) || f.filetype === 'image/jpeg';
      if (!typeValid) throw new Error(`Unsupported type: ${f.filetype}`);
      // const MAX = 350 * 1024 * 1024; - COMMENTED OUT FOR UNLIMITED UPLOADS
      // if (f.filesize > MAX) throw new Error(`File too large: ${f.filename}`);
      const ext = f.filename.split('.').pop();
      const uniqueFilename = `${uuidv4()}.${ext}`;
      const key = `wedding-uploads/${uniqueFilename}`;
      const Metadata: Record<string, string> = {
        original_filename: encodeURIComponent(f.filename),
        created_date: new Date().toISOString(),
      };
      if (f.title) Metadata.title = encodeURIComponent(f.title);
      if (f.uploaderName) Metadata.uploader_name = encodeURIComponent(f.uploaderName);
      return new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        ContentType: f.filetype,
        Metadata,
      });
    });

    const urls = await Promise.all(commands.map((cmd) => getSignedUrl(s3, cmd, { expiresIn: 900 })));
    return NextResponse.json({ urls });
  } catch (err) {
    console.error('Batch presign error', err);
    return NextResponse.json({ error: 'Failed to generate batch presigned URLs' }, { status: 400 });
  }
}
