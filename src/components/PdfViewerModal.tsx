import React, { useEffect, useState } from "react";
import { X, ExternalLink, FileText, Loader2 } from "lucide-react";
import { isNativeApp, openPdf } from "../native/pdfReader";

type Props = {
  url: string;
  title?: string;
  theme?: "light" | "dark";
  onClose: () => void;
};

/**
 * In-app PDF reading for PWA + APK.
 * Prefer embedded iframe / Google Docs viewer for https links;
 * fall back to native FileOpener / external app.
 */
export function PdfViewerModal({ url, title, theme = "light", onClose }: Props) {
  const [mode, setMode] = useState<"embed" | "loading" | "error">("loading");
  const dark = theme === "dark";

  const embedSrc = (() => {
    if (!url) return "";
    // Direct PDF or known static files
    if (url.toLowerCase().includes(".pdf") || url.includes("firebasestorage") || url.includes("cloudinary")) {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
    }
    if (url.includes("drive.google.com")) {
      // Convert share link to preview if possible
      const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
      return url;
    }
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
  })();

  useEffect(() => {
    setMode("embed");
  }, [url]);

  const openExternal = async () => {
    try {
      await openPdf(url, title);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black/60 backdrop-blur-sm">
      <div
        className={`flex items-center justify-between gap-3 px-3 py-2.5 border-b ${
          dark ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <FileText size={18} className="text-blue-600 shrink-0" />
          <span className="text-sm font-semibold truncate">{title || "PDF"}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={openExternal}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${
              dark
                ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span className="inline-flex items-center gap-1">
              <ExternalLink size={14} /> Open with app
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              dark ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700"
            }`}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className={`flex-1 relative ${dark ? "bg-slate-900" : "bg-slate-100"}`}>
        {mode === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center text-blue-600">
            <Loader2 className="animate-spin" size={28} />
          </div>
        )}
        {mode === "error" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <p className={`text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>
              Could not embed this PDF. Open it with another app instead.
            </p>
            <button
              type="button"
              onClick={openExternal}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold"
            >
              Open with Drive / PDF app
            </button>
          </div>
        ) : (
          <iframe
            title={title || "PDF"}
            src={embedSrc}
            className="w-full h-full border-0"
            onLoad={() => setMode("embed")}
            onError={() => setMode("error")}
            allow="fullscreen"
          />
        )}
      </div>

      {isNativeApp() && (
        <p className={`text-center text-[10px] py-2 ${dark ? "text-slate-500 bg-slate-950" : "text-slate-400 bg-white"}`}>
          Read PDF in app · or use Open with app for Drive / other viewers
        </p>
      )}
    </div>
  );
}
