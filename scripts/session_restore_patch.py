#!/usr/bin/env python3
from pathlib import Path

def main():
    p = Path("src/App.tsx")
    text = p.read_text()
    n = 0
    if "emw_last_view" not in text:
        old = 'const [currentView, setCurrentView] = useState<ViewState>("home");'
        new = '''const [currentView, setCurrentView] = useState<ViewState>(() => {
    try {
      const saved = localStorage.getItem("emw_last_view") as ViewState | null;
      if (saved && typeof saved === "string") return saved;
    } catch {}
    return "home";
  });'''
        if old in text:
            text = text.replace(old, new, 1)
            n += 1
            print("OK init")
        old_nav = "  const navigateTo = (view: ViewState, slugOrSearch?: string) => {\n    setCurrentView(view);"
        new_nav = """  const navigateTo = (view: ViewState, slugOrSearch?: string) => {
    setCurrentView(view);
    try {
      localStorage.setItem("emw_last_view", view);
      if (slugOrSearch) localStorage.setItem("emw_last_slug", slugOrSearch);
      else localStorage.removeItem("emw_last_slug");
    } catch {}"""
        if old_nav in text:
            text = text.replace(old_nav, new_nav, 1)
            n += 1
            print("OK nav")
        marker = "  useEffect(() => {\n    const handlePopState = () => {"
        inject = '''  useEffect(() => {
    try {
      const slug = localStorage.getItem("emw_last_slug");
      const view = localStorage.getItem("emw_last_view");
      if (slug && view === "library-item") setSelectedLibrarySlug(slug);
      if (slug && view === "blog-post") setSelectedBlogSlug(slug);
      if (slug && view === "library") setLibrarySearch(slug);
    } catch {}
  }, []);

'''
        if marker in text and "emw_last_slug" in text:
            text = text.replace(marker, inject + marker, 1)
            n += 1
            print("OK effect")
        p.write_text(text)
    else:
        print("already patched")
    print("done", n)

if __name__ == "__main__":
    main()
