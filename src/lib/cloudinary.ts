/**
 * Cloudinary upload helpers + production PDF/video download for PWA and Capacitor APK.
 */

export async function uploadToCloudinary(
  file: File | Blob,
  folder = "educate-mw",
  resourceType: "image" | "video" | "raw" | "auto" = "auto",
): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary is not configured");
  }
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);
  form.append("folder", folder);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: "POST", body: form },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Upload failed");
  }
  const data = await res.json();
  return data.secure_url as string;
}

export async function uploadVoiceBlob(
  blob: Blob,
  folder = "educate-mw/voice",
): Promise<string> {
  return uploadToCloudinary(blob, folder, "video");
}

/**
 * Transforms a standard Cloudinary URL to force attachment download.
 */
export function getCloudinaryDownloadUrl(url: string, filename?: string): string {
  if (!url) return "";

  if (url.includes("res.cloudinary.com")) {
    const match = url.match(/(.*\/upload\/)(.*)/);
    if (match) {
      const transformQuery = filename
        ? `fl_attachment:${filename.replace(/[^a-zA-Z0-9.\-_]/g, "_")}/`
        : "fl_attachment/";
      return `${match[1]}${transformQuery}${match[2]}`;
    }
  }
  return url;
}

/**
 * Triggers download / open for notes PDFs on PWA and APK.
 * Native APK prefers Browser / FileOpener (fetch+blob often fails CORS).
 */
export async function triggerExplicitDownload(
  url: string,
  filename: string,
  fileType?: "pdf" | "video",
): Promise<boolean> {
  if (!url) return false;

  let cleanName = filename.trim().replace(/[/\\?%*:|"<>]/g, "-");
  const isVideo =
    fileType === "video" ||
    /\.(mp4|mov|avi|mkv|webm)$/i.test(url) ||
    url.includes("/video/upload/");
  const targetExt = isVideo ? ".mp4" : ".pdf";

  if (!/\.(pdf|mp4|mov|webm)$/i.test(cleanName)) {
    cleanName = `${cleanName}${targetExt}`;
  }

  const finalUrl = getCloudinaryDownloadUrl(url, cleanName);

  try {
    const w = window as any;
    if (w.Capacitor?.isNativePlatform?.()) {
      const FileOpener =
        w.Capacitor?.Plugins?.FileOpener ||
        w.Capacitor?.Plugins?.CapacitorCommunityFileOpener;
      const Browser = w.Capacitor?.Plugins?.Browser;
      if (Browser?.open) {
        await Browser.open({ url: finalUrl });
        return true;
      }
      if (FileOpener?.open) {
        await FileOpener.open({
          filePath: finalUrl,
          contentType: isVideo ? "video/mp4" : "application/pdf",
        });
        return true;
      }
      window.open(finalUrl, "_blank");
      return true;
    }
  } catch (e) {
    console.warn("Native open failed", e);
  }

  try {
    const res = await fetch(finalUrl, { mode: "cors" });
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const forceLink = document.createElement("a");
      forceLink.href = blobUrl;
      forceLink.download = cleanName;
      document.body.appendChild(forceLink);
      forceLink.click();
      document.body.removeChild(forceLink);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
      return true;
    }
  } catch (err) {
    console.warn("Fetch download failed (CORS?), opening URL", err);
  }

  try {
    const link = document.createElement("a");
    link.href = finalUrl;
    link.setAttribute("download", cleanName);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch {
    window.open(finalUrl, "_blank", "noopener,noreferrer");
    return true;
  }
}
