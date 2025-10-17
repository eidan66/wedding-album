import { S3Client, PutObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { allowedTypes } from '../constants/allowedTypes';
import { AlbumItem } from '../types';
import { getCloudFrontUrl } from '../config/cloudfront';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface UploadUrlResponse {
  url: string;
  key: string;
}

export const generateUploadUrl = async (
  filename: string,
  filetype: string,
  filesize: number,
  title?: string,
  uploaderName?: string
): Promise<UploadUrlResponse> => {
  // Validate file type
  if (!allowedTypes.includes(filetype)) {
    throw {
      status: 400,
      code: 'UNSUPPORTED_FILE_TYPE',
      message: 'Invalid file type. Only images and videos are allowed.'
    };
  }

  // Validate file size (350MB limit) - COMMENTED OUT FOR UNLIMITED UPLOADS
  // const MAX_FILE_SIZE = 350 * 1024 * 1024; // 350MB in bytes
  // if (filesize > MAX_FILE_SIZE) {
  //   throw {
  //     status: 400,
  //     code: 'FILE_TOO_LARGE',
  //     message: 'File size exceeds 350MB limit.'
  //   };
  // }

  // Generate unique filename
  const extension = filename.split('.').pop();
  const uniqueFilename = `${uuidv4()}.${extension}`;
  // Keep using the existing structure to avoid breaking production
  // Hundreds of existing files use this path
  const key = `wedding-uploads/${uniqueFilename}`;

  // Prepare metadata for S3 object
  const objectMetadata: Record<string, string> = {
    original_filename: encodeURIComponent(filename), // Store original filename
    created_date: new Date().toISOString(), // Add creation date
  };
  if (title) objectMetadata.title = encodeURIComponent(title);
  if (uploaderName) objectMetadata.uploader_name = encodeURIComponent(uploaderName);
  
  // Create the command with metadata and cache headers
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ContentType: filetype,
    CacheControl: 'public, max-age=31536000, immutable', // Cache for 1 year
    Metadata: objectMetadata,
  });

  // Generate pre-signed URL (expires in 15 minutes)
  const url = await getSignedUrl(s3Client, command, { expiresIn: 900 });

  return {
    url,
    key,
  };
};

const videoExtensions = ['mp4', 'mov', 'webm', 'quicktime', 'hevc', '3gpp', 'x-matroska','video'];

export const listUploadedFiles = async (): Promise<AlbumItem[]> => {
  // BACKWARDS COMPATIBLE: Support both old structure (wedding-uploads/) and new (processed/)
  // This ensures hundreds of existing files in production continue to work
  
  // List existing files from wedding-uploads/ (production files)
  const oldCommand = new ListObjectsV2Command({
    Bucket: process.env.S3_BUCKET_NAME,
    Prefix: 'wedding-uploads/',
  });

  const oldResponse = await s3Client.send(oldCommand);
  const oldContents = (oldResponse.Contents ?? []).filter(obj => !!obj.Key && !obj.Key!.endsWith('/'));

  const sorted = oldContents.sort((a, b) => {
    const aTime = a.LastModified?.getTime() ?? 0;
    const bTime = b.LastModified?.getTime() ?? 0;
    return bTime - aTime;
  });

  const items: AlbumItem[] = [];

  // Process existing files (old structure)
  await Promise.all(sorted.map(async (item) => {
    const key = item.Key as string;
    const url = getCloudFrontUrl(key);
    const id = key;
    const ext = id.split('.').pop()?.toLowerCase() ?? '';

    const type: AlbumItem['type'] = videoExtensions.includes(ext) ? 'video' : 'image';
    
    // Fetch object metadata
    let itemMetadata: Record<string, string> = {};
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
      });
      const headResponse = await s3Client.send(headCommand);
      if (headResponse.Metadata) {
        itemMetadata = Object.fromEntries(
          Object.entries(headResponse.Metadata).map(([k, v]) => [
            k, decodeURIComponent(v as string)
          ])
        );
      }
    } catch (headError) {
      console.warn(`Metadata fetch failed for ${key}:`, headError);
    }

    const createdIso = itemMetadata.created_date || item.LastModified?.toISOString() || new Date(0).toISOString();

    // For videos in old structure, no thumbnail - browser will handle first frame
    const thumbnail_url = undefined;

    items.push({
      id,
      url,
      type,
      created_date: createdIso,
      title: itemMetadata.title || '',
      uploader_name: itemMetadata.uploader_name || 'אורח אנונימי',
      thumbnail_url,
    });
  }));

  // TODO: In the future, also list from wedding-sapir-idan/processed/ for Lambda-processed files
  // This will be added when Lambda processing is enabled without breaking existing files

  // Sort items by created_date
  return items.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
};
