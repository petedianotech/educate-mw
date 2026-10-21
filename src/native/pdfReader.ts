/** APK PDF helpers — no static Capacitor import (keeps vite build clean). */

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

export async function openPdf(source: string, title?: string): Promise<void> {
  if (!source) return;
  if (!isNative()) {
    window.open(source, "_blank", "noopener,noreferrer");
    return;
  }
  try {
    const { FileOpener } = await import(/* @vite-ignore */ "@capacitor-community/file-opener");
    await FileOpener.open({
      filePath: source,
      contentType: "application/pdf",
      openWithDefault: true,
    });
  } catch (e) {
    console.warn("FileOpener failed:", e);
    try {
      const { Browser } = await import(/* @vite-ignore */ "@capacitor/browser");
      await Browser.open({ url: source });
    } catch {
      throw new Error(
        title
          ? `Could not open “${title}”. Install a PDF viewer app.`
          : "Could not open this PDF on your device.",
      );
    }
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
  const mod: any = await import(/* @vite-ignore */ "@capgo/capacitor-file-picker");
  const FilePicker = mod.FilePicker || mod.CapgoFilePicker || mod.default;
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
