#!/usr/bin/env python3
"""Production Community UI/UX polish — layout, hierarchy, chips, composer, cards."""
from pathlib import Path

def main():
    p = Path("src/components/CommunityView.tsx")
    text = p.read_text()
    n = 0

    def rep(old, new, label):
        nonlocal text, n
        if old in text:
            text = text.replace(old, new, 1)
            n += 1
            print("OK", label)
        else:
            print("MISS", label)

    rep(
        """    <div className={`absolute inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'} animate-in slide-in-from-right duration-300`}>""",
        """    <div className={`absolute inset-0 z-50 flex flex-col ${theme === 'dark' ? 'emw-page-bg-dark text-white' : 'emw-page-bg text-slate-900'} animate-in slide-in-from-right duration-300`}>""",
        "page-bg",
    )
    if "emw-page-bg-dark" in text:
        print("page-bg already")

    rep(
        """      <div className={`${theme === 'dark' ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90 border-slate-200 shadow-sm'} backdrop-blur-xl pt-4 pb-3 px-4 sm:px-6 flex items-center justify-between shrink-0 z-10 border-b shadow-md`}>""",
        """      <div className={`${theme === 'dark' ? 'bg-gray-950/95 border-gray-800/70' : 'bg-white/95 border-slate-200/80'} backdrop-blur-xl pt-3 pb-2.5 px-4 sm:px-5 flex items-center justify-between shrink-0 z-20 border-b`}>""",
        "header",
    )
    rep(
        """      <div className={`${theme === 'dark' ? 'bg-gray-950/90 border-gray-800/80' : 'bg-white/95 border-slate-200/80'} backdrop-blur-xl pt-3 pb-2.5 px-4 sm:px-5 flex items-center justify-between shrink-0 z-10 border-b`}>""",
        """      <div className={`${theme === 'dark' ? 'bg-gray-950/95 border-gray-800/70' : 'bg-white/95 border-slate-200/80'} backdrop-blur-xl pt-3 pb-2.5 px-4 sm:px-5 flex items-center justify-between shrink-0 z-20 border-b`}>""",
        "header-v2",
    )

    rep(
        """              <h2 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-lg leading-tight tracking-tight`}>
                Community Feed
              </h2>""",
        """              <h2 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-lg leading-tight tracking-tight`}>
                Community
              </h2>""",
        "title",
    )

    rep(
        """            <p className={`text-[10px] ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} font-bold uppercase tracking-wider`}>
              Universal MSCE Network • {globalOnlineCount} Online
            </p>""",
        """            <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} font-medium`}>
              MSCE network · {globalOnlineCount} online
            </p>""",
        "subtitle",
    )

    rep(
        """            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all active:scale-95 ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-indigo-300 hover:bg-gray-700'
                : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
            }`}""",
        """            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all active:scale-95 ${
              theme === 'dark'
                ? 'bg-gray-900 border-gray-700 text-slate-300 hover:bg-gray-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}""",
        "request-btn",
    )

    rep(
        """            <h3 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-xs uppercase tracking-wider text-gray-400`}>
              Active Study groups
            </h3>""",
        """            <h3 className=\"font-semibold text-[11px] uppercase tracking-wider text-slate-500\">
              Study groups
            </h3>""",
        "groups-label",
    )
    rep(
        """            <h3 className=\"font-bold text-[11px] uppercase tracking-wider text-gray-500\">
              Study groups
            </h3>""",
        """            <h3 className=\"font-semibold text-[11px] uppercase tracking-wider text-slate-500\">
              Study groups
            </h3>""",
        "groups-label-v2",
    )

    rep(
        """                className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer whitespace-nowrap border ${
                  selectedFilter === filter
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30 scale-102'
                    : theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-slate-400 hover:text-white hover:bg-gray-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}""",
        """                className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                  selectedFilter === filter
                    ? 'bg-indigo-600 border-transparent text-white shadow-md shadow-indigo-600/25'
                    : theme === 'dark'
                      ? 'bg-gray-900/80 border-gray-800 text-slate-400 hover:text-white hover:border-gray-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm'
                }`}""",
        "filters",
    )

    rep(
        """            <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800 focus-within:border-indigo-500/50' : 'bg-white border-slate-200 shadow-sm focus-within:border-indigo-500'} border rounded-3xl p-4 transition-all shadow-md`}>""",
        """            <div className={`${theme === 'dark' ? 'bg-gray-900/90 border-gray-800 focus-within:border-indigo-500/40' : 'bg-white border-slate-200/90 focus-within:border-indigo-400/50'} border rounded-2xl p-3.5 sm:p-4 transition-all shadow-sm`}>""",
        "composer",
    )

    rep(
        """                placeholder=\"Share an academic question, study tip, or discuss an MSCE concept with everyone...\"
                rows={2}
                className={`w-full bg-transparent outline-none text-xs font-medium resize-none ${theme === 'dark' ? 'text-gray-100' : 'text-slate-900'} placeholder-gray-500`}""",
        """                placeholder=\"Share a question, tip, or MSCE concept…\"
                rows={3}
                className={`w-full bg-transparent outline-none text-sm font-medium resize-none min-h-[72px] leading-relaxed ${theme === 'dark' ? 'text-gray-100' : 'text-slate-900'} placeholder-slate-400`}""",
        "composer-ta",
    )
    rep(
        """                placeholder=\"Share a question, study tip, or MSCE concept…\"
                rows={3}
                className={`w-full bg-transparent outline-none text-sm font-medium resize-none min-h-[72px] leading-relaxed ${theme === 'dark' ? 'text-gray-100' : 'text-slate-900'} placeholder-gray-500`}""",
        """                placeholder=\"Share a question, tip, or MSCE concept…\"
                rows={3}
                className={`w-full bg-transparent outline-none text-sm font-medium resize-none min-h-[72px] leading-relaxed ${theme === 'dark' ? 'text-gray-100' : 'text-slate-900'} placeholder-slate-400`}""",
        "composer-ta-v2",
    )

    rep(
        """                  <span className=\"text-[10px] font-black uppercase tracking-wider text-slate-400\">
                    Topic:
                  </span>""",
        """                  <span className=\"text-[10px] font-semibold uppercase tracking-wider text-slate-500\">
                    Topic
                  </span>""",
        "topic-label",
    )

    rep(
        """                  className={`shrink-0 min-w-[150px] sm:min-w-[170px] ${
                    theme === 'dark' ? 'bg-gray-900/90 border-gray-800 hover:border-indigo-500/50' : 'bg-white border-slate-200 hover:border-indigo-400'
                  } rounded-2xl p-3 border flex items-center justify-between cursor-pointer transition-all active:scale-95 group ${
                    isHidden ? 'opacity-50' : ''
                  }`}""",
        """                  className={`shrink-0 min-w-[148px] sm:min-w-[160px] ${
                    theme === 'dark' ? 'bg-gray-900/70 border-gray-800 hover:border-indigo-500/40' : 'bg-white border-slate-200/90 hover:border-indigo-300'
                  } rounded-2xl p-2.5 border flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] group shadow-sm ${
                    isHidden ? 'opacity-40' : ''
                  }`}""",
        "group-cards",
    )
    rep(
        """                  className={`shrink-0 min-w-[148px] sm:min-w-[164px] ${
                    theme === 'dark' ? 'bg-gray-900/80 border-gray-800 hover:border-indigo-500/40' : 'bg-white border-slate-200/90 hover:border-indigo-300'
                  } rounded-2xl p-2.5 border flex items-center justify-between cursor-pointer transition-all active:scale-95 group shadow-sm ${
                    isHidden ? 'opacity-45' : ''
                  }`}""",
        """                  className={`shrink-0 min-w-[148px] sm:min-w-[160px] ${
                    theme === 'dark' ? 'bg-gray-900/70 border-gray-800 hover:border-indigo-500/40' : 'bg-white border-slate-200/90 hover:border-indigo-300'
                  } rounded-2xl p-2.5 border flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] group shadow-sm ${
                    isHidden ? 'opacity-40' : ''
                  }`}""",
        "group-cards-v2",
    )

    rep(
        """const SUBJECT_FILTERS = [
  'All Feed', 'Sciences', 'Humanities', 'Languages', 'General MSCE', 'Assignments Only', 'Announcements'
];""",
        """const SUBJECT_FILTERS = [
  'All', 'Sciences', 'Humanities', 'Languages', 'MSCE', 'Assignments', 'Announcements'
];""",
        "filter-labels",
    )

    if "'All'" in text and "selectedFilter === 'All Feed'" in text:
        text = text.replace("selectedFilter === 'All Feed'", "selectedFilter === 'All' || selectedFilter === 'All Feed'")
        text = text.replace("selectedFilter === 'Assignments Only'", "selectedFilter === 'Assignments' || selectedFilter === 'Assignments Only'")
        text = text.replace("useState('All Feed')", "useState('All')")
        n += 1
        print("OK filter-logic")

    rep(
        """            <h3 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-base flex items-center gap-2`}>
              <MessageCircle size={18} className=\"text-indigo-500\" />
              <span>Universal Community Feed ({filteredFeeds.length})</span>
            </h3>""",
        """            <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-sm flex items-center gap-2`}>
              <MessageCircle size={16} className=\"text-indigo-500\" />
              <span>Feed · {filteredFeeds.length}</span>
            </h3>""",
        "feed-header",
    )
    rep(
        """                  className=\"px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-2 disabled:opacity-40 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all\"""",
        """                  className=\"px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-40 shadow-md shadow-indigo-600/20 active:scale-95 transition-all\"""",
        "post-btn",
    )
    rep(
        """          <div className=\"space-y-4\">""",
        """          <div className=\"space-y-3.5 pb-8\">""",
        "feed-spacing",
    )
    rep(
        """                <p className=\"text-xs font-bold text-slate-500\">Syncing live community discussions...</p>""",
        """                <p className=\"text-xs font-medium text-slate-500\">Loading community…</p>""",
        "loading-copy",
    )
    rep(
        """                <h4 className={`font-black text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  No posts in {selectedFilter}
                </h4>
                <p className=\"text-slate-500 text-xs mt-1\">Be the first to share an assignment, formula or question!</p>""",
        """                <h4 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Nothing here yet
                </h4>
                <p className=\"text-slate-500 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed\">Be the first to share a question, formula, or study tip for {selectedFilter}.</p>""",
        "empty-feed",
    )

    p.write_text(text)
    print("Community patches:", n)

if __name__ == "__main__":
    main()
