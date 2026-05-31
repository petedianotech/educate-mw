/**
 * Cloudinary Unsigned Upload and Delivery Utilities
 * Uses client-side fetch to perform secure uploads without exposing API secrets.
 */

export const CLOUDINARY_CLOUD_NAME = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME || 'dor5twyep';
export const CLOUDINARY_UPLOAD_PRESET = (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET || 'secondary_school_notes';
export const CLOUDINARY_FOLDER = 'secondary_notes';

/**
 * Uploads a file (PDF/Image) to Cloudinary using an Unsigned preset.
 * 
 * @param file The file object to upload
 * @param onProgress Optional callback for progress monitoring
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

  // XML Http Request to easily track upload progress
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
 * Transforms a standard Cloudinary URL to include default/custom transformation parameters,
 * such as forcing an attachment download 'fl_attachment' flag.
 * 
 * @param url The primitive Cloudinary URL
 * @param filename Optional specific filename to save download as
 */
export function getCloudinaryDownloadUrl(url: string, filename?: string): string {
  if (!url) return '';
  
  // Only modify Cloudinary delivery URLs
  if (url.includes('res.cloudinary.com')) {
    // Insert "fl_attachment" after "/upload/" or "/raw/upload/" or "/image/upload/"
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
 * Triggers an explicit client-side browser download of any file link,
 * including PDF notes, bypassing standard browser behaviors (e.g. view-mode in iframe).
 * 
 * @param url The web content link / Cloudinary URL
 * @param filename The desired filename with extension
 */
export async function triggerExplicitDownload(url: string, filename: string): Promise<boolean> {
  try {
    // Generate the ideal attachment URL
    const finalUrl = getCloudinaryDownloadUrl(url, filename);
    
    // Attempt standard link click download first
    const link = document.createElement('a');
    link.href = finalUrl;
    link.setAttribute('download', filename);
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // For direct binary downloading guarantee (avoids browser opening PDFs inside the page in many cases)
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const forceLink = document.createElement('a');
        forceLink.href = blobUrl;
        forceLink.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
        document.body.appendChild(forceLink);
        forceLink.click();
        document.body.removeChild(forceLink);
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(() => {
        // Fallback already triggered above
      });

    return true;
  } catch (err) {
    console.error('Trigger download failed:', err);
    return false;
  }
}
