export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  key: string;
  success: boolean;
  error?: string;
}

export interface PresignResponse {
  url: string;
  key: string;
}

/**
 * Get a presigned URL for uploading a file
 */
export const getPresigned = async (
  coupleId: string,
  file: File
): Promise<PresignResponse> => {
  const response = await fetch('/api/uploads/presign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      coupleId,
      fileName: file.name,
      mime: file.type,
      fileSize: file.size,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get presigned URL');
  }

  return response.json();
};

/**
 * Upload a file using a presigned URL
 */
export const uploadToS3 = async (
  presignedUrl: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress: UploadProgress = {
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        };
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          key: '', // The key will be extracted from the response headers or set by the caller
          success: true,
        });
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed due to network error'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was aborted'));
    });

    // Start the upload
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    
    // Add additional headers for better compatibility
    xhr.setRequestHeader('Cache-Control', 'no-cache');
    
    xhr.send(file);
  });
};

/**
 * Complete upload process: get presigned URL and upload file
 */
export const uploadFile = async (
  coupleId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  try {
    // Step 1: Get presigned URL
    const presigned = await getPresigned(coupleId, file);
    
    // Step 2: Upload to S3
    const result = await uploadToS3(presigned.url, file, onProgress);
    
    // Step 3: Return result with the key for tracking
    return {
      ...result,
      key: presigned.key,
    };
  } catch (error) {
    return {
      key: '',
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

/**
 * Batch upload multiple files
 */
export const uploadFiles = async (
  coupleId: string,
  files: File[],
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await uploadFile(
      coupleId,
      file,
      (progress) => onProgress?.(i, progress)
    );
    results.push(result);
    
    // Add small delay between uploads to avoid overwhelming the system
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
};

/**
 * Validate file before upload
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file size (200MB limit) - COMMENTED OUT FOR UNLIMITED UPLOADS
  // const MAX_SIZE = 200 * 1024 * 1024;
  // if (file.size > MAX_SIZE) {
  //   return {
  //     valid: false,
  //     error: `File size ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds 200MB limit`,
  //   };
  // }

  // Check if file has a valid type
  if (!file.type || file.type === 'application/octet-stream') {
    return {
      valid: false,
      error: 'File type could not be determined',
    };
  }

  return { valid: true };
};
