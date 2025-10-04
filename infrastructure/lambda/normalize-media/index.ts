import { S3Event, S3EventRecord } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);
const s3Client = new S3Client({ region: process.env.AWS_REGION });

// Simple logger for Lambda
class LambdaLogger {
  private log(level: string, message: string, context?: any): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    console.log(`[${timestamp}] [${process.env.SENTRY_PROJECT}]: ${level.toUpperCase()}: ${message}${contextStr}`);
  }

  info(message: string, context?: any): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: any): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: any): void {
    this.log('error', message, context);
  }

  debug(message: string, context?: any): void {
    this.log('debug', message, context);
  }
}

const logger = new LambdaLogger();

interface ProcessingMetadata {
  id: string;
  originalKey: string;
  width: number;
  height: number;
  duration?: number;
  hasWebm: boolean;
  type: 'image' | 'video';
  status: 'completed' | 'failed';
  error?: string;
  createdAt: string;
}

export const handler = async (event: S3Event): Promise<void> => {
  logger.info('Processing S3 event', {
    recordCount: event.Records.length,
    eventSource: event.Records[0]?.eventSource,
    eventName: event.Records[0]?.eventName,
  });

  for (const record of event.Records) {
    try {
      await processRecord(record);
    } catch (error) {
      logger.error('Error processing record', {
        bucket: record.s3.bucket.name,
        key: record.s3.object.key,
        error: error instanceof Error ? error.message : String(error),
      });
      // Continue processing other records
    }
  }
};

async function processRecord(record: S3EventRecord): Promise<void> {
  const startTime = Date.now();
  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
  
  console.log(`Processing file: ${bucket}/${key}`);
  
  // Only process files in the raw folder
  if (!key.includes('/raw/')) {
    console.log(`Skipping file not in raw folder: ${key}`);
    return;
  }

  try {
    // Extract coupleId and file info
    const pathParts = key.split('/');
    const coupleId = pathParts[0];
    const fileName = pathParts[pathParts.length - 1];
    const fileId = fileName.split('.')[0];
    
    console.log(`Processing for couple: ${coupleId}, file: ${fileName}`);

    // Download the file to /tmp
    const inputPath = join('/tmp', `input_${fileId}`);
    const outputPath = join('/tmp', `output_${fileId}`);
    const posterPath = join('/tmp', `poster_${fileId}.jpg`);
    
    await downloadFromS3(bucket, key, inputPath);
    
    // Detect file type and process accordingly
    const fileInfo = await detectFileType(inputPath);
    const isVideo = fileInfo.type.startsWith('video/');
    
    let processingResult: ProcessingMetadata;
    
    if (isVideo) {
      processingResult = await processVideo(
        inputPath, 
        outputPath, 
        posterPath, 
        fileId, 
        key,
        fileInfo
      );
    } else {
      processingResult = await processImage(
        inputPath, 
        outputPath, 
        posterPath, 
        fileId, 
        key,
        fileInfo
      );
    }
    
    // Upload results to S3
    await uploadResults(bucket, coupleId, fileId, processingResult, outputPath, posterPath);
    
    // Clean up temporary files
    await cleanupTempFiles(inputPath, outputPath, posterPath);
    
    logger.info('Successfully processed file', {
      key,
      fileId,
      coupleId,
      type: isVideo ? 'video' : 'image',
      processingTime: Date.now() - startTime,
    });
    
  } catch (error) {
    // Create error metadata
    const pathParts = key.split('/');
    const coupleId = pathParts[0];
    const fileName = pathParts[pathParts.length - 1];
    const fileId = fileName.split('.')[0];
    
    logger.error('Error processing file', {
      key,
      fileId,
      coupleId,
      error: error instanceof Error ? error.message : String(error),
      processingTime: Date.now() - startTime,
    });
    
    const errorMetadata: ProcessingMetadata = {
      id: fileId,
      originalKey: key,
      width: 0,
      height: 0,
      type: 'video', // Default type, will be corrected if needed
      status: 'failed',
      hasWebm: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      createdAt: new Date().toISOString(),
    };
    
    // Upload error metadata
    const errorKey = `${coupleId}/processed/${fileId}.json`;
    await s3Client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: errorKey,
      Body: JSON.stringify(errorMetadata),
      ContentType: 'application/json',
    }));
  }
}

async function downloadFromS3(bucket: string, key: string, localPath: string): Promise<void> {
  const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const body = response.Body;
  
  if (!body) {
    throw new Error('Empty response body from S3');
  }
  
  const chunks: Uint8Array[] = [];
  for await (const chunk of body as any) {
    chunks.push(chunk);
  }
  
  const buffer = Buffer.concat(chunks);
  await writeFile(localPath, buffer);
}

async function detectFileType(filePath: string): Promise<{ type: string; width?: number; height?: number; duration?: number }> {
  try {
    // Use ffprobe to get file information
    const { stdout } = await execAsync(`ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`);
    const info = JSON.parse(stdout);
    
    const videoStream = info.streams?.find((s: any) => s.codec_type === 'video');
    
    return {
      type: info.format?.format_name || 'unknown',
      width: videoStream?.width,
      height: videoStream?.height,
      duration: parseFloat(info.format?.duration) || undefined,
    };
  } catch (error) {
    console.warn('Could not detect file type with ffprobe, using fallback:', error);
    return { type: 'unknown' };
  }
}

async function processVideo(
  inputPath: string,
  outputPath: string,
  posterPath: string,
  fileId: string,
  originalKey: string,
  fileInfo: any
): Promise<ProcessingMetadata> {
  console.log('Processing video file');
  
  // Generate MP4 (H.264/AAC, 720p max) - iOS friendly
  const mp4Command = `ffmpeg -y -i "${inputPath}" -vf "scale='min(1280,iw)':'-2',format=yuv420p" -c:v libx264 -profile:v high -level 4.1 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "${outputPath}.mp4"`;
  
  console.log('Executing MP4 conversion:', mp4Command);
  await execAsync(mp4Command);
  
  // Generate poster at 1 second
  const posterCommand = `ffmpeg -y -ss 1 -i "${outputPath}.mp4" -vframes 1 -q:v 2 "${posterPath}"`;
  console.log('Generating poster:', posterCommand);
  await execAsync(posterCommand);
  
  // Try to generate WebM (VP9) if file is not too large
  let hasWebm = false;
  try {
    const fileSize = (await readFile(inputPath)).length;
    const MAX_SIZE_FOR_WEBM = 100 * 1024 * 1024; // 100MB
    
    if (fileSize < MAX_SIZE_FOR_WEBM) {
      const webmCommand = `ffmpeg -y -i "${inputPath}" -vf "scale='min(1280,iw)':'-2'" -c:v libvpx-vp9 -crf 33 -b:v 0 -c:a libopus "${outputPath}.webm"`;
      console.log('Generating WebM:', webmCommand);
      await execAsync(webmCommand);
      hasWebm = true;
    }
  } catch (error) {
    console.warn('WebM generation failed, continuing with MP4 only:', error);
  }
  
  // Get final dimensions and duration
  const finalInfo = await detectFileType(`${outputPath}.mp4`);
  
  return {
    id: fileId,
    originalKey,
    width: finalInfo.width || fileInfo.width || 0,
    height: finalInfo.height || fileInfo.height || 0,
    duration: finalInfo.duration || fileInfo.duration,
    type: 'video',
    hasWebm,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };
}

async function processImage(
  inputPath: string,
  outputPath: string,
  posterPath: string,
  fileId: string,
  originalKey: string,
  fileInfo: any
): Promise<ProcessingMetadata> {
  console.log('Processing image file');
  
  // Check if it's HEIC/HEIF and convert to JPEG for web compatibility
  const isHeic = fileInfo.type.includes('heic') || fileInfo.type.includes('heif');
  
  if (isHeic) {
    console.log('Converting HEIC/HEIF to JPEG for web compatibility');
    // Convert HEIC to JPEG with high quality
    const jpegCommand = `ffmpeg -y -i "${inputPath}" -q:v 2 "${posterPath}"`;
    console.log('Converting to JPEG:', jpegCommand);
    await execAsync(jpegCommand);
    
    // Also save as JPEG in processed folder
    const processedJpegPath = `${outputPath}.jpg`;
    const copyCommand = `cp "${posterPath}" "${processedJpegPath}"`;
    console.log('Saving processed JPEG:', copyCommand);
    await execAsync(copyCommand);
  } else {
    // Convert to JPEG for poster
    const jpegCommand = `ffmpeg -y -i "${inputPath}" -q:v 2 "${posterPath}"`;
    console.log('Converting to JPEG:', jpegCommand);
    await execAsync(jpegCommand);
    
    // Copy original to processed folder
    const extension = fileInfo.type.split('/')[1] || 'jpg';
    const copyCommand = `cp "${inputPath}" "${outputPath}.${extension}"`;
    console.log('Copying original:', copyCommand);
    await execAsync(copyCommand);
  }
  
  // Get final dimensions
  const finalInfo = await detectFileType(posterPath);
  
  return {
    id: fileId,
    originalKey,
    width: finalInfo.width || fileInfo.width || 0,
    height: finalInfo.height || fileInfo.height || 0,
    type: 'image',
    hasWebm: false,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };
}

async function uploadResults(
  bucket: string,
  coupleId: string,
  fileId: string,
  metadata: ProcessingMetadata,
  outputPath: string,
  posterPath: string
): Promise<void> {
  // Upload metadata JSON
  const jsonKey = `${coupleId}/processed/${fileId}.json`;
  await s3Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: jsonKey,
    Body: JSON.stringify(metadata),
    ContentType: 'application/json',
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  
  // Upload poster
  const posterKey = `${coupleId}/processed/${fileId}.jpg`;
  const posterBuffer = await readFile(posterPath);
  await s3Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: posterKey,
    Body: posterBuffer,
    ContentType: 'image/jpeg',
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  
  // Upload processed video/image
  if (metadata.hasWebm) {
    // Upload WebM
    const webmKey = `${coupleId}/processed/${fileId}.webm`;
    const webmBuffer = await readFile(`${outputPath}.webm`);
    await s3Client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: webmKey,
      Body: webmBuffer,
      ContentType: 'video/webm',
      CacheControl: 'public, max-age=31536000, immutable',
    }));
  }
  
  // Upload MP4 or processed image
  if (metadata.type === 'video') {
    const mp4Key = `${coupleId}/processed/${fileId}.mp4`;
    const mp4Buffer = await readFile(`${outputPath}.mp4`);
    await s3Client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: mp4Key,
      Body: mp4Buffer,
      ContentType: 'video/mp4',
      CacheControl: 'public, max-age=31536000, immutable',
    }));
  } else {
    // For images, upload the processed version
    const imageKey = `${coupleId}/processed/${fileId}.jpg`;
    const imageBuffer = await readFile(`${outputPath}.jpg`);
    await s3Client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: imageKey,
      Body: imageBuffer,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000, immutable',
    }));
  }
}

async function cleanupTempFiles(...paths: string[]): Promise<void> {
  for (const path of paths) {
    try {
      await unlink(path);
    } catch (error) {
      console.warn(`Could not delete temp file ${path}:`, error);
    }
  }
}
