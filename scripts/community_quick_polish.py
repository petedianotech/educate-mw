#!/usr/bin/env python3
from pathlib import Path
text = Path('src/components/CommunityView.tsx').read_text()
n = 0
def rep(a,b,l):
    global text,n
    if a in text:
        text = text.replace(a,b,1); n+=1; print('OK',l)
    else:
        print('MISS',l)
rep("Community Feed\n              </h2>", "Community\n              </h2>", 'title')
rep("font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-lg", "font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-lg", 'title-weight')
rep("'All Feed', 'Sciences', 'Humanities', 'Languages', 'General MSCE', 'Assignments Only', 'Announcements'", "'All', 'Sciences', 'Humanities', 'Languages', 'MSCE', 'Assignments', 'Announcements'", 'filters')
text = text.replace("useState('All Feed')", "useState('All')")
text = text.replace("selectedFilter === 'All Feed'", "selectedFilter === 'All' || selectedFilter === 'All Feed'")
text = text.replace("selectedFilter === 'Assignments Only'", "selectedFilter === 'Assignments' || selectedFilter === 'Assignments Only'")
rep('Universal MSCE Network • {globalOnlineCount} Online', 'MSCE network · {globalOnlineCount} online', 'sub')
rep('Universal Community Feed ({filteredFeeds.length})', 'Feed · {filteredFeeds.length}', 'feed')
rep('No posts in {selectedFilter}', 'Nothing here yet', 'empty')
rep('Be the first to share an assignment, formula or question!', 'Be the first to share a question, formula, or study tip.', 'empty2')
rep('text-xs font-black transition-all cursor-pointer whitespace-nowrap border', 'text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap border', 'chip')
rep("font-black text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}", "font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}", 'empty-h')
Path('src/components/CommunityView.tsx').write_text(text)
print('done', n)
