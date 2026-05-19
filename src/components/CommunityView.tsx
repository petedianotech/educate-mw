import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, MessageCircle, ThumbsUp, Share2, FlaskConical, BookOpen, BookA, GraduationCap, Send, Loader2
} from 'lucide-react';
import { GroupChat } from './GroupChat';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

export function CommunityView({ onBack, theme = 'dark' }: { onBack: () => void, theme?: 'light' | 'dark' }) {
  const [activeGroup, setActiveGroup] = useState<{name: string, members: number} | null>(null);
  
  const [feeds, setFeeds] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'feeds'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setFeeds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!newPost.trim()) return;
      setPosting(true);
      try {
         await addDoc(collection(db, 'feeds'), {
             text: newPost,
             userId: auth.currentUser?.uid || 'guest',
             name: auth.currentUser?.displayName || 'Student',
             initial: (auth.currentUser?.displayName || 'S')[0],
             color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
             likes: 0,
             replies: 0,
             createdAt: serverTimestamp()
         });
         setNewPost('');
      } catch (err) {
         console.error(err);
      } finally {
          setPosting(false);
      }
  };

  const formatTime = (date: any) => {
      if(!date) return 'Just now';
      const seconds = Math.floor((new Date().getTime() - date.toDate().getTime()) / 1000);
      if(seconds < 60) return `${Math.max(1, seconds)} seconds ago`;
      const interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + " years ago";
      if (interval > 2592000) return Math.floor(seconds / 2592000) + " months ago";
      if (interval > 86400) return Math.floor(seconds / 86400) + " days ago";
      if (interval > 3600) return Math.floor(seconds / 3600) + " hours ago";
      if (interval > 60) return Math.floor(seconds / 60) + " minutes ago";
      return "Just now";
  };

  if (activeGroup) {
    return <GroupChat group={activeGroup} onBack={() => setActiveGroup(null)} theme={theme} />;
  }

  return (
    <div className={`absolute inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'} animate-in slide-in-from-right duration-300`}>
      {/* Fixed Header */}
      <div className={`${theme === 'dark' ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90 border-slate-200 shadow-sm'} backdrop-blur-xl pt-4 pb-2 px-5 flex items-center shrink-0 z-10 border-b shadow-xl`}>
        <button onClick={onBack} className={`w-10 h-10 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-slate-100 text-slate-600'} rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform`}>
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <div className="ml-4">
           <h2 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-lg leading-tight uppercase tracking-tight`}>Community</h2>
           <p className={`text-[10px] ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'} font-bold uppercase tracking-widest mt-0.5`}>Study Together</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-32">
         {/* Online users */}
         <div className="px-5 pt-8 pb-4">
            <h3 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-lg mb-6`}>Popular Circles</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar -mx-5 px-5">
               {[
                 { name: 'Sciences', members: 0, icon: FlaskConical, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
                 { name: 'Humanities', members: 0, icon: BookOpen, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                 { name: 'Languages', members: 0, icon: BookA, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
                 { name: 'General Studies', members: 0, icon: GraduationCap, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
               ].map((group, i) => (
                 <div key={i} onClick={() => setActiveGroup(group)} className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'} min-w-[145px] rounded-[32px] p-6 border flex flex-col items-start cursor-pointer transition-all active:scale-95 group hover:border-indigo-500/50 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                       {React.createElement(group.icon, { size: 48 })}
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 border ${group.color} shadow-inner bg-opacity-10 backdrop-blur-sm group-hover:scale-110 transition-transform`}>
                       {React.createElement(group.icon, { size: 24, strokeWidth: 2.5 })}
                    </div>
                    <span className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-[13px] mb-2 leading-tight truncate w-full`}>{group.name}</span>
                    <div className={`flex items-center gap-1.5 px-3 py-1 ${theme === 'dark' ? 'bg-gray-950 border-gray-800' : 'bg-slate-50 border-slate-200'} rounded-full border`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[9px] text-emerald-500 font-black uppercase tracking-wider">Active</span>
                    </div>
                 </div>
               ))}
            </div>
         </div>
         
         <div className="px-5 pt-4">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-white text-lg">Trending Feed</h3>
                <MessageCircle size={18} className="text-gray-600" />
            </div>

            <form onSubmit={handlePost} className="mb-8">
               <div className="bg-gray-900 border border-gray-800 rounded-[28px] p-4 flex gap-3 focus-within:border-indigo-500/50 transition-all shadow-sm">
                   <input 
                       type="text" 
                       value={newPost}
                       onChange={e => setNewPost(e.target.value)}
                       placeholder="Share a thought or ask a question..." 
                       className="bg-transparent flex-1 outline-none text-[13px] text-gray-200"
                   />
                   <button type="submit" disabled={posting || !newPost.trim()} className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 disabled:opacity-50 shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform">
                       {posting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} strokeWidth={2.5} />}
                   </button>
               </div>
            </form>

            <div className="space-y-4">
               {loading ? (
                   <div className="flex justify-center p-8"><Loader2 size={24} className="animate-spin text-indigo-500" /></div>
               ) : feeds.length === 0 ? (
                   <div className="text-center p-8 opacity-50">
                       <MessageCircle size={32} className="mx-auto mb-3 text-gray-600" />
                       <p className="text-white font-bold text-sm">No posts yet</p>
                       <p className="text-gray-500 text-xs mt-1">Be the first to share something!</p>
                   </div>
               ) : (
                   feeds.map((post, i) => (
                     <div key={post.id} className="bg-gray-900 p-6 rounded-[32px] shadow-sm border border-gray-800 transition-all hover:border-gray-700 animate-in fade-in slide-in-from-bottom-4" style={{animationDelay: `${Math.min(i, 5) * 100}ms`}}>
                        <div className="flex items-center gap-3 mb-4">
                           <div className={`w-10 h-10 rounded-max flex items-center justify-center font-black text-sm border rounded-2xl ${post.color || 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                              {post.initial}
                           </div>
                           <div>
                              <h4 className="font-black text-white text-sm leading-tight">{post.name}</h4>
                              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">{formatTime(post.createdAt)}</p>
                           </div>
                        </div>
                        <p className="text-gray-300 text-[14px] font-medium leading-relaxed mb-6">{post.text}</p>
                        <div className="flex items-center gap-6">
                           <button className="flex items-center gap-2 text-gray-500 hover:text-indigo-400 transition-colors">
                              <ThumbsUp size={16} />
                              <span className="text-[11px] font-black uppercase tracking-widest">{post.likes || 0}</span>
                           </button>
                           <button className="flex items-center gap-2 text-gray-500 hover:text-indigo-400 transition-colors">
                              <MessageCircle size={16} />
                              <span className="text-[11px] font-black uppercase tracking-widest">{post.replies || 0}</span>
                           </button>
                           <button className="ml-auto text-gray-700">
                              <Share2 size={16} />
                           </button>
                        </div>
                     </div>
                   ))
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
