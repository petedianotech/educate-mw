/**
 * Cloudinary Unsigned Upload and Delivery Utilities
 * Uses client-side fetch to perform secure uploads without exposing API secrets.
 */

export const CLOUDINARY_CLOUD_NAME = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME || 'dor5twyep';
export const CLOUDINARY_UPLOAD_PRESET = (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET || 'secondary_school_notes';
export const CLOUDINARY_FOLDER = 'secondary_notes';
export const CLOUDINARY_VOICE_FOLDER = 'community_voice';

/**
 * Uploads a file (PDF/Image/Video) to Cloudinary using an Unsigned preset.
 */
export async function uploadToCloudinary(
  file: File, 
  onProgress?: (progress: number) => void
): Promise<{ secure_url: string; public_id: string; original_filename: string; bytes: number }> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary environment variables VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET are missing.');
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', CLOUDINARY_FOLDER);
  
  if (file.type.startsWith('video/') || file.type.startsWith('audio/') || /\.(mp4|mov|avi|mkv|webm|mp3|ogg|m4a)$/i.test(file.name)) {
    formData.append('resource_type', 'video');
  } else {
    formData.append('resource_type', 'auto');
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded * 100) / e.total);
          onProgress(percentage);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            secure_url: response.secure_url,
            public_id: response.public_id,
            original_filename: response.original_filename || file.name,
            bytes: response.bytes || file.size
          });
        } catch (err) {
          reject(new Error('Failed to parse Cloudinary response.'));
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          reject(new Error(errRes.error?.message || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error occurred during Cloudinary upload.'));
    };

    xhr.send(formData);
  });
}

/**
 * Phase 3: Upload a voice-note Blob to Cloudinary and return a URL.
 * Avoids storing large Base64 audio strings in Firestore.
 */
export async function uploadVoiceBlob(
  blob: Blob,
  filename = `voice_${Date.now()}.webm`
): Promise<{ secure_url: string; bytes: number }> {
  const file = new File([blob], filename, { type: blob.type || 'audio/webm' });
  const result = await uploadToCloudinary(file);
  return { secure_url: result.secure_url, bytes: result.bytes };
}

/**
 * Transforms a standard Cloudinary URL to force attachment download.
 */
export function getCloudinaryDownloadUrl(url: string, filename?: string): string {
  if (!url) return '';
  
  if (url.includes('res.cloudinary.com')) {
    const match = url.match(/(.*\/upload\/)(.*)/);
    if (match) {
      const transformQuery = filename 
        ? `fl_attachment:${filename.replace(/[^a-zA-Z0-9.\-_]/g, '_')}/` 
        : 'fl_attachment/';
      return `${match[1]}${transformQuery}${match[2]}`;
    }
  }
  return url;
}

/**
 * Triggers an explicit client-side browser download.
 */
export async function triggerExplicitDownload(
  url: string, 
  filename: string,
  fileType?: 'pdf' | 'video'
): Promise<boolean> {
  if (!url) return false;

  let cleanName = filename.trim().replace(/[/\\?%*:|"<>]/g, '-');
  const isVideo = fileType === 'video' || /\.(mp4|mov|avi|mkv|webm)$/i.test(url) || url.includes('/video/upload/');
  const targetExt = isVideo ? '.mp4' : '.pdf';

  if (!cleanName.toLowerCase().endsWith('.pdf') && !cleanName.toLowerCase().endsWith('.mp4') && !cleanName.toLowerCase().endsWith('.mov') && !cleanName.toLowerCase().endsWith('.webm')) {
    cleanName = `${cleanName}${targetExt}`;
  }

  try {
    const finalUrl = getCloudinaryDownloadUrl(url, cleanName);
    const res = await fetch(finalUrl);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const forceLink = document.createElement('a');
    forceLink.href = blobUrl;
    forceLink.download = cleanName;
    document.body.appendChild(forceLink);
    forceLink.click();
    document.body.removeChild(forceLink);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
    return true;
  } catch (err) {
    console.error('Trigger download failed, using fallback:', err);
    try {
      const fallbackUrl = getCloudinaryDownloadUrl(url, cleanName);
      const link = document.createElement('a');
      link.href = fallbackUrl;
      link.setAttribute('download', cleanName);
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch {
      return false;
    }
  }
}
