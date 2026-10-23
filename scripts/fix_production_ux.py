#!/usr/bin/env python3
"""Production UX fixes: shell scroll lock + Library in-app PDF open + device files."""
from pathlib import Path
import sys

APP = Path("src/App.tsx")
if not APP.exists():
    print("src/App.tsx missing", file=sys.stderr)
    sys.exit(1)

t = APP.read_text(encoding="utf-8")
orig = t

# 1) Outer shell: fixed viewport, no body scroll
t = t.replace(
    'min-h-screen font-sans selection:bg-indigo-900/30 selection:text-indigo-100`',
    'fixed inset-0 overflow-hidden font-sans selection:bg-indigo-900/30 selection:text-indigo-100`',
    1,
)

# 2) Scroll only the content pane
t = t.replace(
    'className={`flex-1 overflow-x-hidden overflow-y-auto hide-scrollbar ${theme === "dark" ? "bg-gray-950" : "bg-slate-50"}`}',
    'className={`flex-1 min-h-0 overflow-x-hidden overflow-y-auto overscroll-y-contain hide-scrollbar ${theme === "dark" ? "bg-gray-950" : "bg-slate-50"}`}',
    1,
)

old_dl = '''    if (item.type === "pdf" && item.content) {
      try {
        if (isNativeApp()) {
          await openPdf(item.content, item.title);
        } else {
          await triggerExplicitDownload(item.content, item.title);
        }
      } catch (err) {
        console.error("PDF open/download failed:", err);
      }
    }
  };'''

new_dl = '''    if (item.type === "pdf" && item.content) {
      try {
        onSelectLocalFile(item.content, item.title || "Notes PDF");
      } catch (err) {
        console.error("PDF open/download failed:", err);
        try {
          if (isNativeApp()) await openPdf(item.content, item.title);
          else await triggerExplicitDownload(item.content, item.title);
        } catch (e2) {
          console.error(e2);
        }
      }
    }
  };

  const openDeviceFiles = async () => {
    try {
      const files = await pickDevicePdfs(true);
      if (files && files.length > 0) {
        const f = files[0];
        onSelectLocalFile(f.path, f.name || "Device PDF");
      }
    } catch (err) {
      console.error("Device PDF pick failed:", err);
    }
  };'''

if old_dl in t:
    t = t.replace(old_dl, new_dl, 1)
    print("Library handleDownload -> in-app PDF")
else:
    print("WARN: handleDownload block not found")

t = t.replace(
    "onClick={() => onSelectItem(item.slug || item.id)}",
    "onClick={() => {\n"
    "                        if (item.type === \"pdf\" && item.content) {\n"
    "                          onSelectLocalFile(item.content, item.title || \"Notes PDF\");\n"
    "                        } else {\n"
    "                          onSelectItem(item.slug || item.id);\n"
    "                        }\n"
    "                      }}",
    1,
)

if "openDeviceFiles" in t and "Device PDF" not in t and "Open device PDF" not in t:
    marker = "Offline Notes ({downloadedIds.length})"
    idx = t.find(marker)
    if idx > 0:
        end = t.find("</button>", idx)
        if end > 0:
            inject = '''
          <button
            type="button"
            onClick={openDeviceFiles}
            className={`mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border ${
              theme === "dark"
                ? "bg-slate-900 border-slate-700 text-slate-100"
                : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            Open device PDF
          </button>
'''
            t = t[: end + len("</button>")] + inject + t[end + len("</button>") :]
            print("Device PDF button added")

old_local = '''      <div className="flex-1 overflow-hidden relative bg-gray-800">
        <iframe
          src={`${url}#toolbar=0`}
          className="w-full h-full border-none shadow-2xl"
          title="Local Material"
        />

        <div className="absolute inset-0 pointer-events-none border-[12px] border-indigo-600/10 rounded-none z-10"></div>
      </div>'''

new_local = '''      <div className="flex-1 min-h-0 overflow-hidden relative bg-gray-800">
        <iframe
          src={
            url.startsWith("blob:") || url.startsWith("content:") || url.startsWith("file:")
              ? url
              : url.toLowerCase().includes(".pdf") || url.includes("firebasestorage") || url.includes("cloudinary") || url.startsWith("http")
                ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`
                : `${url}#toolbar=0`
          }
          className="w-full h-full border-none shadow-2xl bg-white"
          title="Local Material"
          allow="fullscreen"
        />
      </div>'''

if old_local in t:
    t = t.replace(old_local, new_local, 1)
    print("LocalMaterialView embed improved")
else:
    print("WARN: LocalMaterialView iframe block not found")

if t == orig:
    print("No changes applied")
    sys.exit(0)

APP.write_text(t, encoding="utf-8")
print("Wrote", APP, "delta bytes", len(t) - len(orig))
