import React, { useState, useEffect } from 'react';
import { 
  MessagesSquare, Plus, CheckCircle2, Lock, Unlock, Pin, 
  Trash2, Send, ThumbsUp, Check, Loader2, X, MessageCircle, 
  Sparkles, Award, ArrowLeft
} from 'lucide-react';
import { GroupDiscussion, DiscussionResponse, GroupRole } from '../../types/community';
import { db, auth } from '../../lib/firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, deleteDoc, doc, serverTimestamp, updateDoc, increment
} from 'firebase/firestore';
import { formatRealTime } from '../../lib/presence';

export function GroupDiscussionsTab({
  groupId,
  groupName,
  theme = 'dark',
  userRole = 'student'
}: {
  groupId: string;
  groupName: string;
  theme?: 'light' | 'dark';
  userRole?: GroupRole;
}) {
  const [discussions, setDiscussions] = useState<GroupDiscussion[]>(() => {
    try {
      const cached = localStorage.getItem(`mw_group_discussions_${groupId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [activeDiscussion, setActiveDiscussion] = useState<GroupDiscussion | null>(null);
  const [responses, setResponses] = useState<DiscussionResponse[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // New discussion form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const currentUserId = auth.currentUser?.uid || (typeof localStorage !== 'undefined' ? localStorage.getItem('mw_anonymous_uid') : null) || 'student-user';
  const currentUserName = auth.currentUser?.displayName || (typeof localStorage !== 'undefined' ? localStorage.getItem('mw_user_name') : null) || 'Educate MW Member';
  const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin' || userRole === 'owner';

  // Real-time Firestore sync for discussions list
  useEffect(() => {
    let isMounted = true;
    try {
      const q = query(
        collection(db, 'group_discussions'),
        where('groupId', '==', groupId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        const list: GroupDiscussion[] = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            groupId: d.groupId || groupId,
            title: d.title || '',
            description: d.description || '',
            subject: d.subject || '',
            authorId: d.authorId || 'member',
            authorName: d.authorName || 'Member',
            authorRole: d.authorRole || 'student',
            isClosed: !!d.isClosed,
            isPinned: !!d.isPinned,
            responsesCount: d.responsesCount || 0,
            createdAt: d.createdAt,
            timeText: d.timeText || undefined
          };
        });
        list.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
        setDiscussions(list);
        try {
          localStorage.setItem(`mw_group_discussions_${groupId}`, JSON.stringify(list));
        } catch {}
      }, (err) => {
        console.warn("Discussions listener note:", err);
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (e) {
      console.warn("Discussions Firestore listener error:", e);
    }
  }, [groupId]);

  // Real-time sync for active discussion responses
  useEffect(() => {
    if (!activeDiscussion) return;
    let isMounted = true;
    setResponses([]);

    try {
      const q = query(
        collection(db, 'group_discussions', activeDiscussion.id, 'responses'),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        const list: DiscussionResponse[] = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            discussionId: activeDiscussion.id,
            userId: d.userId || 'user',
            userName: d.userName || 'Student',
            userRole: d.userRole || 'student',
            text: d.text || '',
            likes: d.likes || 0,
            likedBy: d.likedBy || [],
            isTeacherEndorsed: !!d.isTeacherEndorsed,
            createdAt: d.createdAt,
            timeText: d.timeText || undefined
          };
        });
        setResponses(list);
      }, (err) => {
        console.warn("Responses query note:", err);
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (e) {
      console.warn("Responses init error:", e);
    }
  }, [activeDiscussion?.id]);

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setCreating(true);
    try {
      const newDoc = {
        groupId,
        title: title.trim(),
        description: description.trim(),
        subject: subject.trim() || groupName,
        authorId: currentUserId,
        authorName: currentUserName,
        authorRole: userRole,
        isClosed: false,
        isPinned,
        responsesCount: 0,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'group_discussions'), newDoc);

      const localItem: GroupDiscussion = {
        ...newDoc,
        id: `local-disc-${Date.now()}`,
        timeText: 'Just now'
      };
      setDiscussions(prev => [localItem, ...prev]);

      setTitle('');
      setDescription('');
      setSubject('');
      setIsPinned(false);
      setShowCreateModal(false);
    } catch (err) {
      console.error("Create discussion err:", err);
      const localItem: GroupDiscussion = {
        id: `local-disc-${Date.now()}`,
        groupId,
        title: title.trim(),
        description: description.trim(),
        subject: subject.trim() || groupName,
        authorId: currentUserId,
        authorName: currentUserName,
        authorRole: userRole,
        isClosed: false,
        isPinned,
        responsesCount: 0,
        timeText: 'Just now'
      };
      setDiscussions(prev => [localItem, ...prev]);
      setShowCreateModal(false);
    } finally {
      setCreating(false);
    }
  };

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDiscussion || !replyText.trim() || activeDiscussion.isClosed) return;

    setSubmittingReply(true);
    try {
      const respData = {
        discussionId: activeDiscussion.id,
        userId: currentUserId,
        userName: currentUserName,
        userRole: userRole,
        text: replyText.trim(),
        likes: 0,
        likedBy: [],
        isTeacherEndorsed: false,
        createdAt: serverTimestamp()
      };

      if (!activeDiscussion.id.startsWith('local-')) {
        await addDoc(collection(db, 'group_discussions', activeDiscussion.id, 'responses'), respData);
        await updateDoc(doc(db, 'group_discussions', activeDiscussion.id), {
          responsesCount: increment(1)
        });
      }

      const localResp: DiscussionResponse = {
        ...respData,
        id: `local-resp-${Date.now()}`,
        timeText: 'Just now'
      };

      setResponses(prev => [...prev, localResp]);
      setDiscussions(prev => prev.map(d => d.id === activeDiscussion.id ? { ...d, responsesCount: (d.responsesCount || 0) + 1 } : d));
      setReplyText('');
    } catch (err) {
      console.error("Send response err:", err);
      const localResp: DiscussionResponse = {
        id: `local-resp-${Date.now()}`,
        discussionId: activeDiscussion.id,
        userId: currentUserId,
        userName: currentUserName,
        userRole: userRole,
        text: replyText.trim(),
        likes: 0,
        likedBy: [],
        isTeacherEndorsed: false,
        timeText: 'Just now'
      };
      setResponses(prev => [...prev, localResp]);
      setReplyText('');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleToggleEndorse = async (respId: string) => {
    if (!isTeacherOrAdmin || !activeDiscussion) return;
    try {
      const resp = responses.find(r => r.id === respId);
      if (resp && !respId.startsWith('local-')) {
        await updateDoc(doc(db, 'group_discussions', activeDiscussion.id, 'responses', respId), {
          isTeacherEndorsed: !resp.isTeacherEndorsed
        });
      }
      setResponses(prev => prev.map(r => r.id === respId ? { ...r, isTeacherEndorsed: !r.isTeacherEndorsed } : r));
    } catch (e) {
      setResponses(prev => prev.map(r => r.id === respId ? { ...r, isTeacherEndorsed: !r.isTeacherEndorsed } : r));
    }
  };

  const handleToggleCloseDiscussion = async (disc: GroupDiscussion) => {
    if (!isTeacherOrAdmin) return;
    try {
      if (!disc.id.startsWith('local-')) {
        await updateDoc(doc(db, 'group_discussions', disc.id), {
          isClosed: !disc.isClosed
        });
      }
      setDiscussions(prev => prev.map(d => d.id === disc.id ? { ...d, isClosed: !d.isClosed } : d));
      if (activeDiscussion?.id === disc.id) {
        setActiveDiscussion(prev => prev ? { ...prev, isClosed: !prev.isClosed } : null);
      }
    } catch (e) {
      setDiscussions(prev => prev.map(d => d.id === disc.id ? { ...d, isClosed: !d.isClosed } : d));
    }
  };

  // If viewing a single discussion thread
  if (activeDiscussion) {
    return (
      <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        {/* Discussion Header */}
        <div className={`p-4 border-b ${theme === 'dark' ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-slate-200'} shrink-0 flex items-center justify-between gap-3`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveDiscussion(null)}
              className="w-8 h-8 rounded-xl bg-gray-800 text-gray-300 hover:text-white flex items-center justify-center active:scale-95"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-400">
                {activeDiscussion.subject || 'Academic Forum'}
              </span>
              <h3 className="text-sm font-black leading-tight line-clamp-1">
                {activeDiscussion.title}
              </h3>
            </div>
          </div>

          {isTeacherOrAdmin && (
            <button
              onClick={() => handleToggleCloseDiscussion(activeDiscussion)}
              className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors ${
                activeDiscussion.isClosed
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {activeDiscussion.isClosed ? <Unlock size={12} /> : <Lock size={12} />}
              <span>{activeDiscussion.isClosed ? 'Reopen' : 'Close Topic'}</span>
            </button>
          )}
        </div>

        {/* Discussion Topic Box */}
        <div className="p-4 bg-indigo-500/5 border-b border-gray-800/60 shrink-0 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span className="font-bold text-indigo-400">
              Started by {activeDiscussion.authorName} ({activeDiscussion.authorRole || 'Member'})
            </span>
            <span>{formatRealTime(activeDiscussion.createdAt, activeDiscussion.timeText)}</span>
          </div>
          <h2 className="text-sm font-black text-white leading-snug">
            {activeDiscussion.title}
          </h2>
          <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
            {activeDiscussion.description}
          </p>
          {activeDiscussion.isClosed && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2">
              <Lock size={14} />
              <span>This discussion has been concluded by the instructor. Responses are now locked.</span>
            </div>
          )}
        </div>

        {/* Responses List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
            <span>{responses.length} Student & Teacher Responses</span>
          </div>

          {responses.length === 0 ? (
            <div className="text-center py-12 opacity-60">
              <MessageCircle size={32} className="mx-auto mb-2 text-indigo-400" />
              <p className="font-bold text-xs">No responses yet</p>
              <p className="text-[11px] text-gray-500">Be the first to share your academic explanation or perspective below!</p>
            </div>
          ) : (
            responses.map((resp) => (
              <div
                key={resp.id}
                className={`p-4 rounded-2xl border transition-all ${
                  resp.isTeacherEndorsed
                    ? 'border-emerald-500/40 bg-emerald-500/5 shadow-md shadow-emerald-500/5'
                    : theme === 'dark'
                    ? 'bg-gray-900/70 border-gray-800/80'
                    : 'bg-white border-slate-200'
                }`}
              >
                {resp.isTeacherEndorsed && (
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400 mb-2">
                    <Award size={13} className="fill-emerald-400" />
                    <span>Instructor Endorsed Best Answer</span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xs">
                      {resp.userName[0]}
                    </div>
                    <span className="font-extrabold text-xs">{resp.userName}</span>
                    {resp.userRole === 'teacher' && (
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-black">
                        Teacher
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 font-semibold">{formatRealTime(resp.createdAt, resp.timeText)}</span>
                </div>

                <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                  {resp.text}
                </p>

                <div className="mt-3 pt-2.5 border-t border-gray-800/40 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 font-semibold">
                    {resp.likes || 0} helpful votes
                  </span>

                  {isTeacherOrAdmin && (
                    <button
                      onClick={() => handleToggleEndorse(resp.id)}
                      className={`text-xs font-bold px-2 py-1 rounded-lg border flex items-center gap-1 transition-colors ${
                        resp.isTeacherEndorsed
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'text-gray-400 hover:text-white border-gray-700'
                      }`}
                    >
                      <Award size={12} />
                      <span>{resp.isTeacherEndorsed ? 'Endorsed' : 'Endorse Answer'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reply Box */}
        {!activeDiscussion.isClosed && (
          <form onSubmit={handleSendResponse} className="p-3.5 border-t border-gray-800/60 shrink-0 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Contribute your answer or perspective..."
              className={`flex-1 px-4 py-2.5 rounded-2xl text-xs font-medium outline-none border ${
                theme === 'dark'
                  ? 'bg-gray-900 border-gray-800 text-white focus:border-indigo-500'
                  : 'bg-slate-100 border-slate-200 text-slate-900 focus:border-indigo-500'
              }`}
            />
            <button
              type="submit"
              disabled={submittingReply || !replyText.trim()}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center disabled:opacity-40 shadow-lg active:scale-95 transition-all"
            >
              {submittingReply ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} strokeWidth={2.5} />}
            </button>
          </form>
        )}
      </div>
    );
  }

  // Discussions Directory View
  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'} overflow-y-auto`}>
      {/* Header */}
      <div className={`p-4 border-b ${theme === 'dark' ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-slate-200'} shrink-0 flex items-center justify-between`}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
            <MessagesSquare size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight flex items-center gap-2">
              Topic-Based Online Discussions
            </h2>
            <p className="text-[11px] text-gray-500 font-semibold">
              In-depth curriculum debates, concept breakdowns & questions
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md active:scale-95 transition-all"
        >
          <Plus size={15} strokeWidth={3} />
          <span>Start Topic</span>
        </button>
      </div>

      {/* Discussion Topics list */}
      <div className="flex-1 p-4 space-y-3">
        {discussions.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center border ${
              theme === 'dark' ? 'bg-gray-900 border-gray-800 text-gray-500' : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}>
              <MessagesSquare size={28} />
            </div>
            <h3 className="font-extrabold text-sm mb-1">No Discussions Active</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4">
              Start an academic topic or question to exchange viewpoints and study methods.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-black inline-flex items-center gap-1.5 active:scale-95"
            >
              <Plus size={14} strokeWidth={2.5} /> Create First Topic
            </button>
          </div>
        ) : (
          discussions.map((disc) => (
            <div
              key={disc.id}
              onClick={() => setActiveDiscussion(disc)}
              className={`p-4 rounded-3xl border cursor-pointer transition-all ${
                disc.isPinned
                  ? 'border-purple-500/40 bg-purple-500/5 hover:border-purple-400'
                  : theme === 'dark'
                  ? 'bg-gray-900/70 border-gray-800/80 hover:border-indigo-500/40'
                  : 'bg-white border-slate-200 shadow-sm hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  {disc.isPinned && (
                    <span className="text-[10px] font-black uppercase text-purple-400 flex items-center gap-1">
                      <Pin size={10} className="rotate-45 fill-purple-400" /> Pinned
                    </span>
                  )}
                  {disc.subject && (
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-800/60 px-2 py-0.5 rounded-md">
                      {disc.subject}
                    </span>
                  )}
                </div>
                {disc.isClosed ? (
                  <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                    Closed
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Active
                  </span>
                )}
              </div>

              <h3 className={`font-black text-sm leading-snug mb-1.5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {disc.title}
              </h3>
              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">
                {disc.description}
              </p>

              <div className="pt-2 border-t border-gray-800/40 flex items-center justify-between text-[11px] text-gray-500 font-semibold">
                <span>By {disc.authorName} • {formatRealTime(disc.createdAt, disc.timeText)}</span>
                <span className="flex items-center gap-1 text-purple-400 font-bold">
                  <MessageCircle size={12} /> {disc.responsesCount || 0} responses
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Start Topic Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl border p-5 shadow-2xl ${
            theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <MessagesSquare size={16} />
                </div>
                <h3 className="font-black text-sm">Start Academic Discussion Topic</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-7 h-7 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateDiscussion} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Topic Question or Heading *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. How does photosynthesis efficiency compare between C3 and C4 plants?"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none border ${
                    theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-purple-500' : 'bg-slate-50 border-slate-200 focus:border-purple-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Subject / Field
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Biology, Mathematics, Geography..."
                  className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium outline-none border ${
                    theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-purple-500' : 'bg-slate-50 border-slate-200 focus:border-purple-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Detailed Background / Prompt *
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide context, specific MANEB question references, or guidelines for responses..."
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none border resize-none ${
                    theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-purple-500' : 'bg-slate-50 border-slate-200 focus:border-purple-500'
                  }`}
                />
              </div>

              {isTeacherOrAdmin && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="pinDiscussionCheck"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="rounded accent-purple-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="pinDiscussionCheck" className="text-xs font-bold text-gray-300 cursor-pointer">
                    Pin this topic to circle header
                  </label>
                </div>
              )}

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
                  disabled={creating || !title.trim() || !description.trim()}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-lg disabled:opacity-40 flex items-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} strokeWidth={3} />
                      <span>Start Discussion</span>
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
