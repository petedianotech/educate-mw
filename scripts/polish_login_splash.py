#!/usr/bin/env python3
from pathlib import Path

def main():
    n = 0
    app = Path("src/App.tsx")
    if not app.exists():
        print("no App.tsx")
        return
    t = app.read_text()

    if "const EmwDots" not in t and "function AuthView(" in t:
        inject = '''
const EmwDots = () => (
  <span className="inline-flex gap-1 items-center" aria-label="Loading">
    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
  </span>
);

'''
        t = t.replace("function AuthView(", inject + "function AuthView(", 1)
        n += 1

    if "const isApk = isNativeApp();" not in t:
        old = '''function AuthView({
  onNavigateRegister,
  onNavigateTerms,
  onNavigatePrivacy,
  theme,
}: {
  onNavigateRegister: () => void;
  onNavigateTerms?: () => void;
  onNavigatePrivacy?: () => void;
  theme: "light" | "dark";
}) {
  const [identifier, setIdentifier] = useState("");
'''
        new = '''function AuthView({
  onNavigateRegister,
  onNavigateTerms,
  onNavigatePrivacy,
  theme,
}: {
  onNavigateRegister: () => void;
  onNavigateTerms?: () => void;
  onNavigatePrivacy?: () => void;
  theme: "light" | "dark";
}) {
  const isApk = isNativeApp();
  const [identifier, setIdentifier] = useState("");
'''
        if old in t:
            t = t.replace(old, new, 1)
            n += 1
            print("OK isApk")

    if "Student Data Privacy Notice" in t and "{!isApk && (" not in t:
        t = t.replace(
            '''            {/* Transparent Data Privacy Disclosure - NO emojis */}
            <div
              className={`p-5 rounded-2xl ${theme === "dark" ? "bg-indigo-950/30 border-indigo-900/50" : "bg-indigo-50/70 border-indigo-100"} border space-y-2`}
            >''',
            '''            {/* Privacy notice — web only */}
            {!isApk && (
            <div
              className={`p-5 rounded-2xl ${theme === "dark" ? "bg-blue-950/30 border-blue-900/50" : "bg-blue-50/70 border-blue-100"} border space-y-2`}
            >''',
            1,
        )
        n += 1

    help_open = '''          <div
            className={`mt-6 p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              theme === "dark"
                ? "bg-gray-900/90 border-gray-800"
                : "bg-emerald-50/70 border-emerald-200/90 shadow-sm"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <MessageCircle size={22} className="text-emerald-500" />
              </div>
              <div>
                <h4
                  className={`text-sm font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                >
                  Need Help or Have Questions?
                </h4>'''
    if help_open in t and "Need Help or Have Questions?" in t:
        # close privacy before help + wrap help
        if "{!isApk && (" in t:
            t = t.replace(
                help_open,
                '''            )}
          {!isApk && (
          <div
            className={`mt-6 p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              theme === "dark"
                ? "bg-gray-900/90 border-gray-800"
                : "bg-emerald-50/70 border-emerald-200/90 shadow-sm"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <MessageCircle size={22} className="text-emerald-500" />
              </div>
              <div>
                <h4
                  className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                >
                  Need help?
                </h4>''',
                1,
            )
            n += 1

    close_help = '''            </a>
          </div>
        </div>

        {/* Right Col: Sign-In / Login Form - Designed psychologically for ages 13-20 */}'''
    if close_help in t:
        t = t.replace(
            close_help,
            '''            </a>
          </div>
          )}
        </div>

        {/* Right Col: Sign-In form */}''',
            1,
        )
        n += 1

    # APK: single column form
    if "isApk" in t:
        t = t.replace(
            'className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start"',
            'className={`grid grid-cols-1 ${isApk ? "" : "lg:grid-cols-12"} gap-6 items-start`}',
            1,
        )
        t = t.replace(
            'className="lg:col-span-7 order-2 lg:order-1 space-y-6"',
            'className={`lg:col-span-7 order-2 lg:order-1 space-y-6 ${isApk ? "hidden" : ""}`}',
            1,
        )
        t = t.replace(
            'className="lg:col-span-5 order-1 lg:order-2"',
            'className={`lg:col-span-5 order-1 lg:order-2 ${isApk ? "w-full max-w-md mx-auto" : ""}`}',
            1,
        )

    # Softer labels
    t = t.replace("font-black uppercase tracking-wider", "font-semibold tracking-wide")
    t = t.replace("font-black uppercase tracking-widest", "font-semibold tracking-wide")

    app.write_text(t)
    print("patches", n)

if __name__ == "__main__":
    main()
