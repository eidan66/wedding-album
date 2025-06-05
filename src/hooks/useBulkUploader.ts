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

  const initializeUploads = (files: File[]) => {
    setUploads(files.map(file => ({ file, status: 'pending', progress: 0 })));
  };

  const uploadFiles = async (files: File[], uploaderName: string, caption: string) => {
    uploadControllers.current = [];
    setUploads(files.map(file => ({ file, status: 'pending', progress: 0 })));

    await asyncPool(MAX_CONCURRENT_UPLOADS, files, async (file, idx) => {
      const controller = new AbortController();
      uploadControllers.current[idx] = controller;

      setUploads(prev =>
        prev.map((u, i) =>
          i === idx ? { ...u, status: 'uploading', progress: 0 } : u
        )
      );
      try {
        // 1. Get pre-signed URL
        const res = await fetch(`${API_BASE}/upload-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            filetype: file.type,
            filesize: file.size,
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const errorData = await res.json();
          const errorMsg = `[${errorData.code || 'ERROR'}] ${errorData.message || 'Failed to get upload URL'}`;
          throw new Error(errorMsg);
        }
        const { url } = await res.json();

        // 2. Upload to S3 with progress
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
                const mediaParams = {
                  title: caption || "",
                  media_url: url.split('?')[0],
                  media_type: (file.type.startsWith('image/') ? 'photo' : 'video') as WeddingMediaItem['media_type'],
                  uploader_name: uploaderName || "אורח אנונימי"
                };
                const createdMedia = await WeddingMedia.create(mediaParams);

                setUploads(prev =>
                  prev.map((u, i) =>
                    i === idx ? { ...u, status: 'success', progress: 100, mediaItem: createdMedia } : u
                  )
                );
                resolve();
              } catch (createError) {
                console.error('Error creating media item after S3 upload:', createError);
                setUploads(prev =>
                  prev.map((u, i) =>
                    i === idx
                      ? { ...u, status: 'error', error: (createError as Error).message }
                      : u
                  )
                );
                reject(createError);
              }
            } else {
              setUploads(prev =>
                prev.map((u, i) =>
                  i === idx
                    ? { ...u, status: 'error', error: `Upload failed (${xhr.status})` }
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
                  ? { ...u, status: 'error', error: 'Network error during upload' }
                  : u
              )
            );
            reject(new Error('Network error during upload'));
          };
          xhr.onabort = () => {
            setUploads(prev =>
              prev.map((u, i) =>
                i === idx
                  ? { ...u, status: 'error', error: 'Upload aborted' }
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
              ? { ...u, status: 'error', error: (err as Error).message || 'An error occurred' }
              : u
          )
        );
      }
    });
  };

  const cancelUploads = () => {
    uploadControllers.current.forEach(controller => controller?.abort());
  };

  return { uploads, uploadFiles, cancelUploads, initializeUploads };
};