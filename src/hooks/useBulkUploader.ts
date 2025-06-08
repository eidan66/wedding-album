import { useState, useRef } from 'react';
import { API_BASE } from '../config';
import { WeddingMedia } from '../Entities/WeddingMedia';
import type { WeddingMediaItem } from '../Entities/WeddingMedia';

async function asyncPool<T, R>(
  poolLimit: number,
  array: T[],
  iteratorFn: (item: T, index: number, array: T[]) => Promise<R>
): Promise<R[]> {
  const ret: R[] = [];
  const executing: Promise<void>[] = [];
  for (const [i, item] of array.entries()) {
    const p = Promise.resolve().then(() => iteratorFn(item, i, array));
    ret.push(p as unknown as R);
    if (poolLimit <= array.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1)) as Promise<void>;
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
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
}

const MAX_CONCURRENT_UPLOADS = 4;

export const useBulkUploader = () => {
  const [uploads, setUploads] = useState<FileUploadState[]>([]);
  const uploadControllers = useRef<AbortController[]>([]);

  const uploadFiles = async (files: File[], uploaderName: string, caption: string) => {
    uploadControllers.current = [];
    setUploads(files.map(file => ({ file, status: 'pending' as UploadStatus, progress: 0 })));

    await asyncPool(MAX_CONCURRENT_UPLOADS, files, async (file, idx) => {
      const controller = new AbortController();
      uploadControllers.current[idx] = controller;

      setUploads(prev =>
        prev.map((u, i) =>
          i === idx ? { ...u, status: 'uploading' as UploadStatus, progress: 0 } : u
        )
      );
      try {
        // 1. Get pre-signed URL
        console.time(`Upload file ${file.name}: Get pre-signed URL`);
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
          signal: controller.signal,
        });
        console.timeEnd(`Upload file ${file.name}: Get pre-signed URL`);
        if (!res.ok) {
          const errorData = await res.json();
          const errorMsg = `[${errorData.code || 'ERROR'}] ${errorData.message || 'Failed to get upload URL'}`;
          throw new Error(errorMsg);
        }
        const { url } = await res.json();

        // 2. Upload to S3 with progress
        console.time(`Upload file ${file.name}: Upload to S3`);
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', url, true);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              setUploads(prev =>
                prev.map((u, i) =>
                  i === idx
                    ? { ...u, progress: Math.round((event.loaded / event.total) * 100) }
                    : u
                )
              );
            }
          };
          xhr.onload = async () => {
            if (xhr.status === 200) {
              try {
                // 3. Create media item in backend after S3 upload succeeds
                console.time(`Upload file ${file.name}: Create media item`);
                const mediaParams = {
                  title: caption || "",
                  media_url: url.split('?')[0],
                  media_type: (file.type.startsWith('image/') ? 'image' : 'video') as WeddingMediaItem['media_type'],
                  uploader_name: uploaderName || "אורח אנונימי"
                };
                const createdMedia = await WeddingMedia.create(mediaParams);
                console.timeEnd(`Upload file ${file.name}: Create media item`);

                setUploads(prev =>
                  prev.map((u, i) =>
                    i === idx ? { ...u, status: 'success' as UploadStatus, progress: 100, mediaItem: createdMedia } : u
                  )
                );
                resolve();
              } catch (createError) {
                console.error('Error creating media item after S3 upload:', createError);
                setUploads(prev =>
                  prev.map((u, i) =>
                    i === idx
                      ? { ...u, status: 'error' as UploadStatus, error: (createError as Error).message }
                      : u
                  )
                );
                reject(createError);
              }
            } else {
              setUploads(prev =>
                prev.map((u, i) =>
                  i === idx
                    ? { ...u, status: 'error' as UploadStatus, error: `Upload failed (${xhr.status})` }
                    : u
                )
              );
              reject(new Error(`Upload failed (${xhr.status})`));
            }
          };
          xhr.onerror = () => {
            setUploads(prev =>
              prev.map((u, i) =>
                i === idx
                  ? { ...u, status: 'error' as UploadStatus, error: 'Network error during upload' }
                  : u
              )
            );
            reject(new Error('Network error during upload'));
          };
          xhr.onabort = () => {
            setUploads(prev =>
              prev.map((u, i) =>
                i === idx
                  ? { ...u, status: 'error' as UploadStatus, error: 'Upload aborted' }
                  : u
              )
            );
            reject(new Error('Upload aborted'));
          };
          xhr.send(file);
        });
      } catch (err) {
        console.error('Error during upload process:', err);
        setUploads(prev =>
          prev.map((u, i) =>
            i === idx
              ? { ...u, status: 'error' as UploadStatus, error: (err as Error).message || 'An error occurred' }
              : u
          )
        );
      }
    });
  };

  const cancelUploads = () => {
    uploadControllers.current.forEach(controller => controller?.abort());
  };

  return { uploads, uploadFiles, cancelUploads };
};