import { useState, useRef } from 'react';
import { API_BASE } from '../config';
import { WeddingMedia } from '../Entities/WeddingMedia';
import type { WeddingMediaItem } from '../Entities/WeddingMedia';
import { generateVideoThumbnail, isMobile } from '../utils';
import { compressImage, replaceExtension } from '../utils/compress';
import { logger } from '../lib/logger';

async function asyncPool<T, R>(
  poolLimit: number,
  array: T[],
  iteratorFn: (item: T, index: number, array: T[]) => Promise<R>
): Promise<R[]> {
  const ret: Promise<R>[] = [];
  const executing: Promise<void>[] = [];
  for (const [i, item] of array.entries()) {
    const p: Promise<R> = Promise.resolve().then(() => iteratorFn(item, i, array));
    ret.push(p);
    const e: Promise<void> = (p.then(() => {
      const idx = executing.indexOf(e);
      if (idx >= 0) executing.splice(idx, 1);
    }) as unknown) as Promise<void>;
    executing.push(e);
    if (executing.length >= poolLimit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(ret);
}

export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

export interface FileUploadState {
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  mediaItem?: WeddingMediaItem;
  uploaderName?: string;
  caption?: string;
}

function resolveConcurrency(): number {
  const mobile = isMobile();
  const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { hardwareConcurrency?: number; connection?: { effectiveType?: string } }) : undefined;
  const hw = nav?.hardwareConcurrency ?? 4;
  const network = nav?.connection?.effectiveType;
  const slowNet = network ? ['2g', 'slow-2g', '3g'].includes(network) : false;
  if (mobile) return slowNet ? 2 : 3;
  return Math.min(Math.max(hw - 2, 3), 8);
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      logger.warn(`Retry attempt ${i + 1}/${attempts}`, {
        error: err instanceof Error ? err.message : String(err),
        attempt: i + 1,
        totalAttempts: attempts,
      });
      await new Promise(r => setTimeout(r, 300 * (i + 1)));
    }
  }
  if (lastErr instanceof Error) throw lastErr;
  throw new Error('Operation failed');
}

async function presignSingle(file: File, caption: string, uploaderName: string, signal: AbortSignal): Promise<{ url: string }> {
  logger.info('Attempting to presign single file', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    caption,
    uploaderName,
  });
  
  try {
    const res = await fetch(`${API_BASE}/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        filetype: file.type,
        filesize: file.size,
        title: caption || "",
        uploaderName: uploaderName || ""
      }),
      signal,
    });
  if (!res.ok) {
    console.error('Failed to presign single file:', res.status, res.statusText);
    let code: string | undefined; let message: string | undefined;
    try { 
      const data = await res.json(); 
      code = (data as { code?: string }).code; 
      message = (data as { message?: string }).message; 
      console.error('Error response:', data);
    } catch (e) {
      console.error('Failed to parse error response:', e);
    }
    throw new Error(`[${code || 'ERROR'}] ${message || 'Failed to get upload URL'}`);
  }
  return res.json() as Promise<{ url: string }>;
  } catch (error) {
    console.error('Network error in presignSingle:', error);
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to connect to server. Please check your internet connection and try again.');
    }
    throw error;
  }
}

async function presignBatch(files: File[], caption: string, uploaderName: string, signal: AbortSignal): Promise<string[]> {
  console.log('Attempting to presign batch of files:', files.length, 'API_BASE:', API_BASE);
  
  try {
    const payload = {
      files: files.map(f => ({ filename: f.name, filetype: f.type, filesize: f.size, title: caption || "", uploaderName: uploaderName || "" }))
    };
    const res = await fetch(`${API_BASE}/uploads/presign/batch`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal
    });
    if (!res.ok) {
      console.error('Batch presign failed:', res.status, res.statusText);
      throw new Error('Batch presign failed');
    }
    const data = await res.json() as { urls: string[] };
    return data.urls;
  } catch (error) {
    console.error('Network error in presignBatch:', error);
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to connect to server. Please check your internet connection and try again.');
    }
    throw error;
  }
}

async function uploadPutWithRetry(url: string, file: File, idx: number, setUploads: React.Dispatch<React.SetStateAction<FileUploadState[]>>): Promise<void> {
  const attempt = () => new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.timeout = 180_000;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        setUploads(prev => prev.map((u, i) => i === idx ? { ...u, progress } : u));
        
        // Log progress every 25%
        if (progress % 25 === 0) {
          logger.uploadProgress(file.name, progress, {
            fileName: file.name,
            fileSize: file.size,
            loaded: event.loaded,
            total: event.total,
          });
        }
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        logger.info('S3 PUT request completed successfully', {
          fileName: file.name,
          status: xhr.status,
          fileSize: file.size,
        });
        resolve();
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.ontimeout = () => reject(new Error('Upload timeout'));
    xhr.send(file);
  });

  let lastErr: unknown;
  for (let t = 0; t < 3; t++) {
    try {
      await attempt();
      return;
    } catch (err) {
      lastErr = err;
      logger.warn('S3 upload attempt failed', {
        fileName: file.name,
        attempt: t + 1,
        maxAttempts: 3,
        error: err instanceof Error ? err.message : String(err),
      });
      if (t < 2) await new Promise(r => setTimeout(r, 500 * Math.pow(2, t))); // backoff 0.5s,1s
    }
  }
  
  logger.error('All S3 upload attempts failed', lastErr instanceof Error ? lastErr : new Error(String(lastErr)), {
    fileName: file.name,
    fileSize: file.size,
    maxAttempts: 3,
  });
  
  throw lastErr instanceof Error ? lastErr : new Error('PUT failed');
}

export const useBulkUploader = () => {
  const [uploads, setUploads] = useState<FileUploadState[]>([]);
  const uploadControllers = useRef<AbortController[]>([]);



  const uploadFiles = async (files: File[], uploaderName: string, caption: string) => {
    // Log upload start
    logger.info('Starting bulk upload process', {
      fileCount: files.length,
      uploaderName,
      caption: caption || 'No caption',
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      fileTypes: files.map(f => f.type),
    });

    // Reset upload controllers
    uploadControllers.current = [];
    
    // Clear any existing uploads
    setUploads([]);
    
    // Create initial upload states
    const initialUploads = files.map(file => ({ 
      file, 
      status: 'pending' as UploadStatus, 
      progress: 0,
      uploaderName,
      caption,
    }));
    setUploads(initialUploads);

    const concurrency = resolveConcurrency();

    // Batch presign to reduce round-trips when there are many files
    let batchUrls: string[] | null = null;
    try {
      if (files.length >= 6) {
        batchUrls = await withRetry(() => presignBatch(files, caption, uploaderName, new AbortController().signal));
      }
    } catch {
      batchUrls = null; // fallback to single
    }

    await asyncPool<File, void>(concurrency, files, async (originalFile, idx) => {
      const controller = new AbortController();
      uploadControllers.current[idx] = controller;

      // Log individual file upload start
      logger.info('Starting file upload', {
        fileName: originalFile.name,
        fileSize: originalFile.size,
        fileType: originalFile.type,
        fileIndex: idx,
        uploaderName,
      });

      setUploads(prev => {
        const newUploads = prev.map((u, i) =>
          i === idx ? { ...u, status: 'uploading' as UploadStatus, progress: 0 } : u
        );
        return newUploads;
      });

      try {
        // Compress images on client to accelerate uploads massively
        let file = originalFile;
        if (file.type.startsWith('image/')) {
          try {
            logger.info('Compressing image', {
              fileName: originalFile.name,
              originalSize: originalFile.size,
              fileType: originalFile.type,
            });
            
            const blob = await compressImage(file, { maxDimension: 2048, quality: 0.72 });
            const newName = replaceExtension(file.name, '.jpg');
            file = new File([blob], newName, { type: 'image/jpeg' });
            
            logger.info('Image compression completed', {
              fileName: newName,
              compressedSize: file.size,
              compressionRatio: Math.round((1 - file.size / originalFile.size) * 100),
            });
          } catch (error) {
            logger.warn('Image compression failed, using original', {
              fileName: originalFile.name,
              error: error instanceof Error ? error.message : String(error),
            });
            // If compression fails, fall back to original
          }
        }

        // 1. Get pre-signed URL (with retry)
        let url: string;
        if (batchUrls && batchUrls[idx]) {
          url = batchUrls[idx];
          logger.info('Using batch presigned URL', {
            fileName: file.name,
            urlLength: url.length,
          });
        } else {
          logger.info('Getting single presigned URL', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
          });
          const single = await withRetry(() => presignSingle(file, caption, uploaderName, controller.signal));
          url = single.url;
          logger.info('Presigned URL obtained', {
            fileName: file.name,
            urlLength: url.length,
          });
        }

        // 2. Upload to S3 with progress (and timeout)
        logger.info('Starting S3 upload', {
          fileName: file.name,
          fileSize: file.size,
          urlLength: url.length,
        });
        
        await uploadPutWithRetry(url, file, idx, setUploads);
        
        logger.info('S3 upload completed', {
          fileName: file.name,
          fileSize: file.size,
        });

        // 3. Generate thumbnail for videos (skip on mobile to keep UX snappy)
        let thumbnailUrl: string | undefined;
        if (file.type.startsWith('video/') && !isMobile()) {
          try {
            logger.info('Generating video thumbnail', {
              fileName: file.name,
              fileSize: file.size,
            });
            
            thumbnailUrl = await generateVideoThumbnail(file);
            
            logger.info('Video thumbnail generated successfully', {
              fileName: file.name,
              thumbnailUrl: thumbnailUrl ? 'Generated' : 'Failed',
            });
          } catch (error) {
            logger.warn('Failed to generate video thumbnail', {
              fileName: file.name,
              error: error instanceof Error ? error.message : String(error),
            });
            // Continue without thumbnail - don't fail the entire upload
          }
        }

        // 4. Create media item in backend after S3 upload succeeds
        logger.info('Creating media item in database', {
          fileName: file.name,
          mediaUrl: url.split('?')[0],
          mediaType: file.type.startsWith('image/') ? 'photo' : 'video',
          uploaderName,
          hasThumbnail: !!thumbnailUrl,
        });
        
        const mediaParams = {
          title: caption || "",
          media_url: url.split('?')[0],
          media_type: (file.type.startsWith('image/') ? 'photo' : 'video') as 'photo' | 'video',
          uploader_name: uploaderName || "אורח אנונימי",
          thumbnail_url: thumbnailUrl
        };
        const createdMedia = await WeddingMedia.create(mediaParams);

        logger.uploadComplete(file.name, {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          mediaId: createdMedia.id,
          uploaderName,
          hasThumbnail: !!thumbnailUrl,
          compressionRatio: file.type.startsWith('image/') ? Math.round((1 - file.size / originalFile.size) * 100) : 0,
        });

        setUploads(prev =>
          prev.map((u, i) =>
            i === idx ? { ...u, status: 'success' as UploadStatus, progress: 100, mediaItem: createdMedia } : u
          )
          );
      } catch (err) {
        logger.uploadError(originalFile.name, err instanceof Error ? err : new Error(String(err)), {
          fileName: originalFile.name,
          fileSize: originalFile.size,
          fileType: originalFile.type,
          uploaderName,
          errorMessage: err instanceof Error ? err.message : String(err),
        });
        
        console.error(`Upload failed for file ${originalFile.name} (${originalFile.type}):`, err);
        setUploads(prev =>
          prev.map((u, i) =>
            i === idx
              ? { ...u, status: 'error' as UploadStatus, error: (err as Error).message || 'An error occurred' }
              : u
          )
          );
      }
    });
    
    // Log bulk upload completion
    const successCount = uploads.filter(u => u.status === 'success').length;
    const errorCount = uploads.filter(u => u.status === 'error').length;
    
    logger.info('Bulk upload process completed', {
      totalFiles: files.length,
      successCount,
      errorCount,
      uploaderName,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
    });
  };

  const cancelUploads = () => {
    uploadControllers.current.forEach(controller => controller?.abort());
  };

  const retryUpload = async (index: number) => {
    const upload = uploads[index];
    if (!upload || upload.status !== 'error') return;

    logger.info('Retrying upload', {
      fileName: upload.file.name,
      fileSize: upload.file.size,
      fileType: upload.file.type,
      uploaderName: upload.uploaderName || '',
      previousError: upload.error,
      retryIndex: index,
    });

    const controller = new AbortController();
    uploadControllers.current[index] = controller;

    setUploads(prev => prev.map((u, i) =>
      i === index ? { ...u, status: 'uploading' as UploadStatus, progress: 0, error: undefined } : u
    ));

    try {
      // Compress images on client to accelerate uploads massively
      let file = upload.file;
      if (file.type.startsWith('image/')) {
        try {
          const blob = await compressImage(file, { maxDimension: 2048, quality: 0.72 });
          const newName = replaceExtension(file.name, '.jpg');
          file = new File([blob], newName, { type: 'image/jpeg' });
        } catch {
          // If compression fails, fall back to original
        }
      }

      // 1. Get pre-signed URL (with retry)
      const single = await withRetry(() => presignSingle(file, '', '', controller.signal));
      const url = single.url;

      // 2. Upload to S3 with progress (and timeout)
      await uploadPutWithRetry(url, file, index, setUploads);

      // 3. Generate thumbnail for videos (skip on mobile to keep UX snappy)
      let thumbnailUrl: string | undefined;
      if (file.type.startsWith('video/') && !isMobile()) {
        try {
          thumbnailUrl = await generateVideoThumbnail(file);
        } catch {}
      }

      // 4. Create media item in backend after S3 upload succeeds
      const mediaParams = {
        title: '',
        media_url: url.split('?')[0],
        media_type: (file.type.startsWith('image/') ? 'photo' : 'video') as 'photo' | 'video',
        uploader_name: "אורח אנונימי",
        thumbnail_url: thumbnailUrl
      };
      const createdMedia = await WeddingMedia.create(mediaParams);

      setUploads(prev =>
        prev.map((u, i) =>
          i === index ? { ...u, status: 'success' as UploadStatus, progress: 100, mediaItem: createdMedia } : u
        )
      );
    } catch (err) {
      setUploads(prev =>
        prev.map((u, i) =>
          i === index
            ? { ...u, status: 'error' as UploadStatus, error: (err as Error).message || 'An error occurred' }
            : u
        )
      );
    }
  };

  const isUploading = uploads.some(u => u.status === 'uploading' || u.status === 'pending');

  return { uploads, uploadFiles, cancelUploads, retryUpload, isUploading };
};