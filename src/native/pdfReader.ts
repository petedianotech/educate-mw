/** APK PDF helpers — only window.Capacitor.Plugins (never import Capacitor packages). */

function isNative(): boolean {
  try {
    const w = window as any;
    return !!(w.Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}

export function isNativeApp(): boolean {
  return isNative();
}

function getPlugin(...names: string[]): any {
  try {
    const plugins = (window as any).Capacitor?.Plugins || {};
    for (const n of names) {
      if (plugins[n]) return plugins[n];
    }
  } catch {}
  return null;
}

export async function openPdf(source: string, title?: string): Promise<void> {
  if (!source) return;
  if (!isNative()) {
    window.open(source, "_blank", "noopener,noreferrer");
    return;
  }
  try {
    const FileOpener = getPlugin("FileOpener", "CapacitorCommunityFileOpener");
    if (FileOpener?.open) {
      await FileOpener.open({
        filePath: source,
        contentType: "application/pdf",
        openWithDefault: true,
      });
      return;
    }
    const Browser = getPlugin("Browser");
    if (Browser?.open) {
      await Browser.open({ url: source });
      return;
    }
    window.open(source, "_blank");
  } catch (e) {
    console.warn("FileOpener failed:", e);
    throw new Error(
      title
        ? `Could not open “${title}”. Install a PDF viewer app.`
        : "Could not open this PDF on your device.",
    );
  }
}

export type PickedPdf = {
  name: string;
  path: string;
  mimeType?: string;
  size?: number;
};

export async function pickDevicePdfs(multiple = true): Promise<PickedPdf[]> {
  if (!isNative()) {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/pdf,.pdf";
      input.multiple = multiple;
      input.onchange = () => {
        const files = Array.from(input.files || []);
        resolve(
          files.map((f) => ({
            name: f.name,
            path: URL.createObjectURL(f),
            mimeType: f.type,
            size: f.size,
          })),
        );
      };
      input.click();
    });
  }
  const FilePicker = getPlugin("FilePicker", "CapgoFilePicker");
  if (!FilePicker?.pickFiles) {
    // Fallback: web-style input even on native if plugin missing
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/pdf,.pdf";
      input.multiple = multiple;
      input.onchange = () => {
        const files = Array.from(input.files || []);
        resolve(
          files.map((f) => ({
            name: f.name,
            path: URL.createObjectURL(f),
            mimeType: f.type,
            size: f.size,
          })),
        );
      };
      input.click();
    });
  }
  const result = await FilePicker.pickFiles({
    types: ["application/pdf"],
    multiple,
    readData: false,
  });
  const files = (result as any)?.files || [];
  return files.map((f: any) => ({
    name: f.name || f.path?.split("/").pop() || "document.pdf",
    path: f.path || f.uri || "",
    mimeType: f.mimeType || "application/pdf",
    size: f.size,
  }));
}
