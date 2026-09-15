import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Pin, Plus, Trash2, Calendar, FileText, 
  ExternalLink, Check, Loader2, X, AlertCircle, ShieldAlert, Award
} from 'lucide-react';
import { GroupAnnouncement } from '../../types/community';
import { db, auth } from '../../lib/firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, deleteDoc, doc, serverTimestamp, updateDoc
} from 'firebase/firestore';
import { formatRealTime } from '../../lib/presence';

export function GroupAnnouncementsTab({
  groupId,
  groupName,
  theme = 'dark',
  userRole = 'student'
}: {
  groupId: string;
  groupName: string;
  theme?: 'light' | 'dark';
  userRole?: string;
}) {
  const [announcements, setAnnouncements] = useState<GroupAnnouncement[]>(() => {
    try {
      const cached = localStorage.getItem(`mw_group_announcements_${groupId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [fileName, setFileName] = useState('');

  const currentUserId = auth.currentUser?.uid || (typeof localStorage !== 'undefined' ? localStorage.getItem('mw_anonymous_uid') : null) || 'user-current';
  const currentUserName = auth.currentUser?.displayName || (typeof localStorage !== 'undefined' ? localStorage.getItem('mw_user_name') : null) || 'Educate MW Scholar';
  const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin' || userRole === 'owner' || true; // Allow students & educators to post updates

  // Real-time Firestore sync
  useEffect(() => {
    let isMounted = true;
    try {
      const q = query(
        collection(db, 'group_announcements'),
        where('groupId', '==', groupId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        const list: GroupAnnouncement[] = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            groupId: d.groupId || groupId,
            title: d.title || 'Announcement',
            content: d.content || '',
            authorId: d.authorId || 'teacher',
            authorName: d.authorName || 'Educator',
            authorRole: d.authorRole || 'teacher',
            isPinned: !!d.isPinned,
            attachmentUrl: d.attachmentUrl || undefined,
            fileName: d.fileName || undefined,
            createdAt: d.createdAt,
            timeText: d.timeText || undefined
          };
        });
        // Sort with pinned first
        list.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
        setAnnouncements(list);
        try {
          localStorage.setItem(`mw_group_announcements_${groupId}`, JSON.stringify(list));
        } catch {}
      }, (err) => {
        console.warn("Announcements listener notice:", err);
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (e) {
      console.warn("Firestore announcements init err:", e);
    }
  }, [groupId]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setPublishing(true);
    try {
      const newAnnData = {
        groupId,
        title: title.trim(),
        content: content.trim(),
        authorId: currentUserId,
        authorName: currentUserName,
        authorRole: isTeacherOrAdmin ? userRole : 'teacher',
        isPinned,
        attachmentUrl: attachmentUrl.trim() || null,
        fileName: fileName.trim() || null,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'group_announcements'), newAnnData);

      const localItem: GroupAnnouncement = {
        ...newAnnData,
        attachmentUrl: newAnnData.attachmentUrl || undefined,
        fileName: newAnnData.fileName || undefined,
        id: `local-ann-${Date.now()}`,
        timeText: 'Just now'
      };

      setAnnouncements(prev => [localItem, ...prev]);

      setTitle('');
      setContent('');
      setIsPinned(false);
      setAttachmentUrl('');
      setFileName('');
      setShowCreateModal(false);
    } catch (err) {
      console.error("Failed to create announcement:", err);
      const localItem: GroupAnnouncement = {
        id: `local-ann-${Date.now()}`,
        groupId,
        title: title.trim(),
        content: content.trim(),
        authorId: currentUserId,
        authorName: currentUserName,
        authorRole: isTeacherOrAdmin ? userRole : 'teacher',
        isPinned,
        timeText: 'Just now'
      };
      setAnnouncements(prev => [localItem, ...prev]);
      setShowCreateModal(false);
    } finally {
      setPublishing(false);
    }
  };

  const handleTogglePin = async (ann: GroupAnnouncement) => {
    try {
      if (ann.id && !ann.id.startsWith('local-')) {
        await updateDoc(doc(db, 'group_announcements', ann.id), {
          isPinned: !ann.isPinned
        });
      }
      setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, isPinned: !a.isPinned } : a));
    } catch (e) {
      setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, isPinned: !a.isPinned } : a));
    }
  };

  const handleDelete = async (annId: string) => {
    if (!confirm("Are you sure you want to remove this announcement?")) return;
    try {
      if (!annId.startsWith('local-')) {
        await deleteDoc(doc(db, 'group_announcements', annId));
      }
      setAnnouncements(prev => prev.filter(a => a.id !== annId));
    } catch (e) {
      setAnnouncements(prev => prev.filter(a => a.id !== annId));
    }
  };

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'} overflow-y-auto`}>
      {/* Header bar */}
      <div className={`p-4 border-b ${theme === 'dark' ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-slate-200'} shrink-0 flex items-center justify-between`}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Megaphone size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight flex items-center gap-2">
              Official Announcements & Broadcasts
            </h2>
            <p className="text-[11px] text-gray-500 font-semibold">
              Verified notices from instructors and circle coordinators
            </p>
          </div>
        </div>

        {isTeacherOrAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md active:scale-95 transition-all"
          >
            <Plus size={15} strokeWidth={3} />
            <span>Publish Notice</span>
          </button>
        )}
      </div>

      {/* Announcements List */}
      <div className="flex-1 p-4 space-y-3.5">
        {announcements.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center border ${
              theme === 'dark' ? 'bg-gray-900 border-gray-800 text-gray-500' : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}>
              <Megaphone size={28} />
            </div>
            <h3 className="font-extrabold text-sm mb-1">No Announcements Yet</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4">
              Teachers will publish important circle dates, timetable notices, and exam alerts here.
            </p>
            {isTeacherOrAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 active:scale-95"
              >
                <Plus size={14} strokeWidth={2.5} /> Create First Announcement
              </button>
            )}
          </div>
        ) : (
          announcements.map((ann) => {
            const canManage = isTeacherOrAdmin || ann.authorId === currentUserId;
            return (
              <div
                key={ann.id}
                className={`p-4 sm:p-5 rounded-3xl border relative transition-all ${
                  ann.isPinned
                    ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent shadow-lg shadow-amber-500/5'
                    : theme === 'dark'
                    ? 'bg-gray-900/80 border-gray-800/90'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                {/* Pinned pill */}
                {ann.isPinned && (
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-400 mb-2">
                    <Pin size={11} className="rotate-45 fill-amber-400" />
                    <span>Pinned Announcement</span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <h3 className={`font-black text-sm sm:text-base leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {ann.title}
                    </h3>
                    <p className={`text-xs leading-relaxed whitespace-pre-wrap ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      {ann.content}
                    </p>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleTogglePin(ann)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          ann.isPinned
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'text-gray-500 hover:text-white border-transparent'
                        }`}
                        title={ann.isPinned ? "Unpin Announcement" : "Pin Announcement"}
                      >
                        <Pin size={14} className={ann.isPinned ? "fill-amber-400" : ""} />
                      </button>
                      <button
                        onClick={() => handleDelete(ann.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                        title="Delete Announcement"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Attachment if present */}
                {ann.attachmentUrl && (
                  <div className={`mt-3 p-3 rounded-2xl border flex items-center justify-between ${
                    theme === 'dark' ? 'bg-gray-950/60 border-gray-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-amber-400" />
                      <span className="text-xs font-bold truncate max-w-[200px]">
                        {ann.fileName || 'Attached Reference Document'}
                      </span>
                    </div>
                    <a
                      href={ann.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded-xl bg-amber-500/15 text-amber-400 text-[11px] font-bold flex items-center gap-1 hover:bg-amber-500/25"
                    >
                      <span>Open</span> <ExternalLink size={11} />
                    </a>
                  </div>
                )}

                {/* Footer metadata */}
                <div className="mt-3.5 pt-3 border-t border-gray-800/40 flex items-center justify-between text-[11px] text-gray-500 font-semibold">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-black">
                      {ann.authorName[0]}
                    </div>
                    <span className="font-bold text-gray-400">
                      {ann.authorName}
                    </span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-black">
                      Verified {ann.authorRole || 'Teacher'}
                    </span>
                  </div>
                  <span>{formatRealTime(ann.createdAt, ann.timeText)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl border p-5 shadow-2xl ${
            theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Megaphone size={16} />
                </div>
                <h3 className="font-black text-sm">Broadcast Official Announcement</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-7 h-7 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. MSCE Mock Timetable Released"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none border ${
                    theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-amber-500' : 'bg-slate-50 border-slate-200 focus:border-amber-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Message Content *
                </label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write clear instructions, dates, or study guidance for students..."
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none border resize-none ${
                    theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-amber-500' : 'bg-slate-50 border-slate-200 focus:border-amber-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                    Attachment Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="https://..."
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium outline-none border ${
                      theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-amber-500' : 'bg-slate-50 border-slate-200 focus:border-amber-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                    Attachment Name
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="e.g. Schedule.pdf"
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium outline-none border ${
                      theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-amber-500' : 'bg-slate-50 border-slate-200 focus:border-amber-500'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinAnnouncementCheck"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="pinAnnouncementCheck" className="text-xs font-bold text-gray-300 cursor-pointer">
                  Pin this announcement to top of circle
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishing || !title.trim() || !content.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-lg disabled:opacity-40 flex items-center gap-2"
                >
                  {publishing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Broadcasting...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} strokeWidth={3} />
                      <span>Publish Announcement</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
