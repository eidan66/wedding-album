import { API_BASE } from '@/config';

interface UploadFileParams {
  file: File;
}

interface UploadFileResponse {
  file_url: string;
}

export const UploadFile = async ({ file }: UploadFileParams): Promise<UploadFileResponse> => {
  try {
    // 1. Get pre-signed URL from our API
    const res = await fetch(`${API_BASE}/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        filetype: file.type,
        filesize: file.size,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      const errorMsg = `[${errorData.code || 'ERROR'}] ${errorData.message || 'Failed to get upload URL'}`;
      throw new Error(errorMsg);
    }

    const { url } = await res.json();

    // 2. Upload to S3 using the presigned URL
    const uploadRes = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed (${uploadRes.status})`);
    }

    // 3. Get the file URL from the response
    const fileUrl = await uploadRes.text();
    
    return {
      file_url: fileUrl
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}; 