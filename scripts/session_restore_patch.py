#!/usr/bin/env python3
"""Persist last screen + restore on app return. Firebase auth already persists the account."""
from pathlib import Path

def main():
    p = Path("src/App.tsx")
    text = p.read_text()
    n = 0

    # Restore view from localStorage on first load (after useState home)
    old_init = 'const [currentView, setCurrentView] = useState<ViewState>("home");'
    new_init = '''const [currentView, setCurrentView] = useState<ViewState>(() => {
    try {
      const saved = localStorage.getItem("emw_last_view") as ViewState | null;
      if (saved && typeof saved === "string") return saved;
    } catch {}
    return "home";
  });'''
    if old_init in text and "emw_last_view" not in text:
        text = text.replace(old_init, new_init, 1)
        n += 1
        print("OK init restore")

    # Save view on navigateTo
    old_nav = '''  const navigateTo = (view: ViewState, slugOrSearch?: string) => {
    setCurrentView(view);'''
    new_nav = '''  const navigateTo = (view: ViewState, slugOrSearch?: string) => {
    setCurrentView(view);
    try {
      localStorage.setItem("emw_last_view", view);
      if (slugOrSearch) localStorage.setItem("emw_last_slug", slugOrSearch);
      else localStorage.removeItem("emw_last_slug");
    } catch {}'''
    if old_nav in text and 'emw_last_view", view' not in text:
        text = text.replace(old_nav, new_nav, 1)
        n += 1
        print("OK navigate save")

    # After setCurrentView from path parsing on load, also restore slug once
    if "emw_restore_slug_done" not in text:
        # inject effect after navigateTo definition block - find useEffect handlePopState
        marker = "  useEffect(() => {\n    const handlePopState = () => {"
        inject = '''  // Restore deep link slug once for library/blog
  useEffect(() => {
    try {
      const slug = localStorage.getItem("emw_last_slug");
      const view = localStorage.getItem("emw_last_view");
      if (slug && view === "library-item") setSelectedLibrarySlug(slug);
      if (slug && view === "blog-post") setSelectedBlogSlug(slug);
      if (slug && view === "library") setLibrarySearch(slug);
    } catch {}
  }, []);

'''
        if marker in text:
            text = text.replace(marker, inject + marker, 1)
            n += 1
            print("OK slug restore effect")

    p.write_text(text)
    print("session patches", n)

if __name__ == "__main__":
    main()
