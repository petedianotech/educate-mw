#!/usr/bin/env python3
from pathlib import Path

t = Path("src/App.tsx").read_text()
old = '''              </div>
            </div>
          </div>

          {/* WhatsApp Support Banner for Confused / Questioning Students */}
          <div
            className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              theme === "dark"
                ? "bg-gray-900/90 border-gray-800"
                : "bg-emerald-50/70 border-emerald-200/90 shadow-sm"
            }`}
          >'''

new = '''              </div>
            </div>
            )}

          {/* WhatsApp — web only */}
          {!isApk && (
          <div
            className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              theme === "dark"
                ? "bg-gray-900/90 border-gray-800"
                : "bg-emerald-50/70 border-emerald-200/90 shadow-sm"
            }`}
          >'''

if old in t:
    t = t.replace(old, new, 1)
    Path("src/App.tsx").write_text(t)
    print("fixed")
elif "WhatsApp — web only" in t:
    print("already fixed")
else:
    # alternate: privacy opened but not closed before WhatsApp
    if "{!isApk && (" in t and "Student Data Privacy Notice" in t:
        alt = '''            </div>
          </div>

          {/* WhatsApp Support Banner for Confused / Questioning Students */}'''
        alt_new = '''            </div>
            )}

          {/* WhatsApp — web only */}
          {!isApk && ('''
        if alt in t:
            t = t.replace(alt, alt_new, 1)
            Path("src/App.tsx").write_text(t)
            print("fixed alt")
        else:
            print("FAIL")
            raise SystemExit(1)
    else:
        print("nothing")
