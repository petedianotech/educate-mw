import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, MessageCircle, Heart, Share2, FlaskConical, 
  BookOpen, BookA, GraduationCap, Send, Loader2, Mic, Square, Play, Pause, 
  Trash2, X, MessageSquare, Sparkles, Users, Radio, Shield, Plus,
  Filter, Eye, EyeOff, CheckCircle2, Megaphone, FileText, ArrowRight,
  SlidersHorizontal, Check
} from 'lucide-react';
import { GroupChat } from './GroupChat';
import { db, auth } from '../lib/firebase';
import { 
  collection, query, orderBy, onSnapshot, addDoc, updateDoc, 
  deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { useOnlinePresence, formatRealTime } from '../lib/presence';
import { CommunityAdminHub } from './community/CommunityAdminHub';
import { RequestGroupModal } from './community/RequestGroupModal';
import { FeedPostItem } from '../types/community';

export const COMMUNITY_GROUPS = [
  { 
    id: 'sciences', 
    name: 'Sciences', 
    desc: 'Biology, Physics, Chemistry & Agriculture', 
    icon: FlaskConical, 
    color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    accent: 'from-indigo-600 to-indigo-800'
  },
  { 
    id: 'humanities', 
    name: 'Humanities', 
    desc: 'History, Geography, Social Studies & Bible Knowledge', 
    icon: BookOpen, 
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    accent: 'from-emerald-600 to-teal-800'
  },
  { 
    id: 'languages', 
    name: 'Languages', 
    desc: 'Chichewa Grammar, English Essays & Comprehension', 
    icon: BookA, 
    color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    accent: 'from-orange-600 to-amber-800'
  },
  { 
    id: 'general', 
    name: 'General Studies', 
    desc: 'Past Papers, Exam Strategies & MSCE Hub', 
    icon: GraduationCap, 
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    accent: 'from-purple-600 to-violet-800'
  }
];

const SUBJECT_FILTERS = [
  'All Feed', 'Sciences', 'Humanities', 'Languages', 'General MSCE', 'Assignments Only', 'Announcements'
];

export function CommunityView({ onBack, theme = 'dark' }: { onBack: () => void, theme?: 'light' | 'dark' }) {
  const [activeGroup, setActiveGroup] = useState<{name: string; members: number; id?: string; desc?: string; initialTab?: string} | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('All Feed');
  
  // Feed posts state
  const [feeds, setFeeds] = useState<FeedPostItem[]>(() => {
    try {
      const cached = localStorage.getItem('mw_community_feeds_v4');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Dynamic user hidden groups preference (Hide / Unhide groups in Feed)
  const [hiddenGroups, setHiddenGroups] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mw_hidden_groups');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [showHideFilterModal, setShowHideFilterModal] = useState(false);

  // Modals & Admin
  const [showAdminHub, setShowAdminHub] = useState(false);
  const [showRequestGroupModal, setShowRequestGroupModal] = useState(false);
  const [pendingAdminCount, setPendingAdminCount] = useState(0);

  // Group real-time message count
  const [groupMessageCounts, setGroupMessageCounts] = useState<Record<string, number>>({});
  const { globalOnlineCount } = useOnlinePresence('community');

  // Dynamic registered study groups from Firestore
  const [dynamicGroups, setDynamicGroups] = useState<any[]>(COMMUNITY_GROUPS);

  // Post composer state
  const [newPostText, setNewPostText] = useState('');
  const [newPostSubject, setNewPostSubject] = useState('Sciences');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Audio Recording for new feed post
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioBase64, setRecordedAudioBase64] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Global Audio Playback State
  const [playingPostId, setPlayingPostId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Discussion Drawer / Replies Modal
  const [openPostReplies, setOpenPostReplies] = useState<FeedPostItem | null>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [newReplyText, setNewReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [repliesLoading, setRepliesLoading] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const currentUserId = auth.currentUser?.uid || (typeof localStorage !== 'undefined' ? localStorage.getItem('mw_anonymous_uid') : null) || 'guest-user';
  const currentUserName = auth.currentUser?.displayName || (typeof localStorage !== 'undefined' ? localStorage.getItem('mw_user_name') : null) || 'Student Scholar';
  const userEmail = auth.currentUser?.email || (typeof localStorage !== 'undefined' ? localStorage.getItem('mw_user_email') : null) || '';
  const isUserAdmin = userEmail === 'petedianotech@gmail.com' || userEmail === 'mscepreparation@gmail.com' || localStorage.getItem('mw_user_role') === 'admin';

  // Toggle Hide / Unhide group
  const handleToggleHideGroup = (groupId: string) => {
    setHiddenGroups(prev => {
      const updated = prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId];
      try {
        localStorage.setItem('mw_hidden_groups', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // 1. Listen to groups in real time (merging defaults with user-created groups)
  useEffect(() => {
    let isMounted = true;
    try {
      const unsub = onSnapshot(collection(db, 'groups'), (snap) => {
        if (!isMounted) return;
        if (!snap.empty) {
          const fetchedGroups = snap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name || d.id,
              desc: data.description || 'Study group',
              icon: FlaskConical,
              color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
              accent: 'from-indigo-600 to-indigo-800'
            };
          });
          // Merge with predefined groups avoiding duplicates
          const ids = new Set(fetchedGroups.map(g => g.id));
          const merged = [...fetchedGroups, ...COMMUNITY_GROUPS.filter(g => !ids.has(g.id))];
          setDynamicGroups(merged);
        }
      });
      return () => {
        isMounted = false;
        unsub();
      };
    } catch (e) {}
  }, []);

  // 2. Listen to group message counts
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'group_messages'), (snap) => {
        const counts: Record<string, number> = {};
        snap.docs.forEach(d => {
          const gId = d.data().groupId || 'sciences';
          counts[gId] = (counts[gId] || 0) + 1;
        });
        setGroupMessageCounts(counts);
      }, (err) => {
        console.warn("Group messages count notice:", err);
      });
      return () => unsub();
    } catch (e) {}
  }, []);

  // 3. Listen to pending group requests + submissions for admin notification badge
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'group_requests'), (snap) => {
        const pending = snap.docs.filter(d => d.data().status === 'pending').length;
        setPendingAdminCount(pending);
      });
      return () => unsub();
    } catch (e) {}
  }, []);

  // 4. Real-time Firestore sync for General Community Feeds
  useEffect(() => {
    let isMounted = true;
    const safetyTimeout = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 3000);

    try {
      const q = query(collection(db, 'feeds'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        clearTimeout(safetyTimeout);
        const list: FeedPostItem[] = snapshot.docs.map(doc => {
          const data = doc.data();
          const likedBy = Array.isArray(data.likedBy) ? data.likedBy : [];
          return {
            id: doc.id,
            text: data.text || '',
            userId: data.userId || 'student',
            name: data.name || 'Student',
            userRole: data.userRole,
            initial: data.initial || (data.name ? data.name[0] : 'S'),
            color: data.color || 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
            subject: data.subject || 'General',
            groupId: data.groupId,
            groupName: data.groupName,
            classLevel: data.classLevel,
            type: data.type || 'post',
            assignmentId: data.assignmentId,
            announcementId: data.announcementId,
            points: data.points,
            dueDate: data.dueDate,
            likes: typeof data.likes === 'number' ? data.likes : likedBy.length,
            likedBy: likedBy,
            repliesCount: typeof data.repliesCount === 'number' ? data.repliesCount : 0,
            audioData: data.audioData || undefined,
            audioDuration: data.audioDuration || undefined,
            createdAt: data.createdAt || null,
            timeText: data.timeText || undefined
          };
        });
        setFeeds(list);
        try {
          localStorage.setItem('mw_community_feeds_v4', JSON.stringify(list));
        } catch {}
        setLoading(false);
      }, (err) => {
        clearTimeout(safetyTimeout);
        console.warn("Feeds live query notice:", err);
        if (isMounted) setLoading(false);
      });

      return () => {
        isMounted = false;
        clearTimeout(safetyTimeout);
        unsubscribe();
      };
    } catch (e) {
      clearTimeout(safetyTimeout);
      setLoading(false);
    }
  }, []);

  // 5. Listen for replies when a post thread is opened
  useEffect(() => {
    if (!openPostReplies) {
      setReplies([]);
      return;
    }

    setRepliesLoading(true);
    let isMounted = true;

    try {
      const repliesCol = collection(db, 'feeds', openPostReplies.id, 'replies');
      const q = query(repliesCol, orderBy('createdAt', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        if (!snapshot.empty) {
          const list = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              text: d.text || '',
              userId: d.userId || 'user',
              name: d.name || 'Student',
              initial: d.initial || (d.name ? d.name[0] : 'S'),
              color: d.color || 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
              audioData: d.audioData,
              audioDuration: d.audioDuration,
              createdAt: d.createdAt
            };
          });
          setReplies(list);
        } else {
          setReplies([]);
        }
        setRepliesLoading(false);
      }, (err) => {
        console.warn("Replies listener error:", err);
        if (isMounted) setRepliesLoading(false);
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (err) {
      setRepliesLoading(false);
    }
  }, [openPostReplies]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
    };
  }, []);

  // Real Toggle Like handler
  const handleToggleLike = async (post: FeedPostItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const uid = currentUserId;
    const currentLikedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
    const isAlreadyLiked = currentLikedBy.includes(uid);

    let updatedLikedBy: string[];
    let updatedLikesCount: number;

    if (isAlreadyLiked) {
      updatedLikedBy = currentLikedBy.filter(id => id !== uid);
      updatedLikesCount = Math.max(0, (post.likes || 1) - 1);
    } else {
      updatedLikedBy = [...currentLikedBy, uid];
      updatedLikesCount = (post.likes || 0) + 1;
    }

    // Optimistic UI update
    setFeeds(prev => prev.map(p => {
      if (p.id === post.id) {
        return {
          ...p,
          likedBy: updatedLikedBy,
          likes: updatedLikesCount
        };
      }
      return p;
    }));

    if (openPostReplies && openPostReplies.id === post.id) {
      setOpenPostReplies(prev => prev ? { ...prev, likedBy: updatedLikedBy, likes: updatedLikesCount } : null);
    }

    // Sync to Firestore
    if (!post.id.startsWith('seed-') && !post.id.startsWith('local-')) {
      try {
        await updateDoc(doc(db, 'feeds', post.id), {
          likedBy: updatedLikedBy,
          likes: updatedLikesCount
        });
      } catch (err) {
        console.warn("Error updating like on Firestore:", err);
      }
    }
  };

  // Voice recording
  const startRecordingVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const localUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(localUrl);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setRecordedAudioBase64(reader.result as string);
        };

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(sec => sec + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      showToast("Please allow microphone access to record voice notes.");
    }
  };

  const stopRecordingVoice = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const cancelRecordedVoice = () => {
    if (isRecording) stopRecordingVoice();
    setRecordedAudioUrl(null);
    setRecordedAudioBase64(null);
    setRecordingSeconds(0);
  };

  // Create new Post on General Feed
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim() && !recordedAudioBase64) return;
    setPosting(true);

    const colors = [
      'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      'bg-orange-500/10 text-orange-400 border-orange-500/20',
      'bg-purple-500/10 text-purple-400 border-purple-500/20'
    ];
    const assignedColor = colors[Math.floor(Math.random() * colors.length)];

    const tempPost: FeedPostItem = {
      id: 'local-' + Date.now(),
      text: newPostText.trim() || '🎤 Shared a voice study note',
      userId: currentUserId,
      name: currentUserName,
      initial: currentUserName[0]?.toUpperCase() || 'S',
      color: assignedColor,
      subject: newPostSubject,
      type: 'post',
      likes: 0,
      likedBy: [],
      repliesCount: 0,
      audioData: recordedAudioBase64 || undefined,
      audioDuration: recordedAudioBase64 ? recordingSeconds : undefined,
      timeText: 'Just now'
    };

    setFeeds(prev => [tempPost, ...prev]);
    setNewPostText('');
    cancelRecordedVoice();

    try {
      const docRef = await addDoc(collection(db, 'feeds'), {
        text: tempPost.text,
        userId: tempPost.userId,
        name: tempPost.name,
        initial: tempPost.initial,
        color: tempPost.color,
        subject: tempPost.subject,
        type: 'post',
        likes: 0,
        likedBy: [],
        repliesCount: 0,
        audioData: tempPost.audioData || null,
        audioDuration: tempPost.audioDuration || null,
        createdAt: serverTimestamp()
      });

      setFeeds(prev => prev.map(p => p.id === tempPost.id ? { ...p, id: docRef.id } : p));
      showToast("Posted to Community Feed!");
    } catch (err) {
      console.warn("Could not sync post to cloud:", err);
      showToast("Post saved locally.");
    } finally {
      setPosting(false);
    }
  };

  // Send Reply in Thread
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReplyText.trim() || !openPostReplies) return;
    setReplying(true);

    const tempReply = {
      id: 'temp-rep-' + Date.now(),
      text: newReplyText.trim(),
      userId: currentUserId,
      name: currentUserName,
      initial: currentUserName[0]?.toUpperCase() || 'S',
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      createdAt: null
    };

    setReplies(prev => [...prev, tempReply]);
    setNewReplyText('');

    setFeeds(prev => prev.map(p => p.id === openPostReplies.id ? { ...p, repliesCount: (p.repliesCount || 0) + 1 } : p));
    setOpenPostReplies(prev => prev ? { ...prev, repliesCount: (prev.repliesCount || 0) + 1 } : null);

    try {
      const repliesCol = collection(db, 'feeds', openPostReplies.id, 'replies');
      await addDoc(repliesCol, {
        text: tempReply.text,
        userId: tempReply.userId,
        name: tempReply.name,
        initial: tempReply.initial,
        color: tempReply.color,
        createdAt: serverTimestamp()
      });

      if (!openPostReplies.id.startsWith('seed-') && !openPostReplies.id.startsWith('local-')) {
        await updateDoc(doc(db, 'feeds', openPostReplies.id), {
          repliesCount: (openPostReplies.repliesCount || 0) + 1
        });
      }
    } catch (err) {
      console.warn("Error saving reply:", err);
    } finally {
      setReplying(false);
    }
  };

  // Audio Playback
  const togglePlayAudio = (id: string, audioUrlOrBase64?: string) => {
    if (!audioUrlOrBase64) return;

    if (playingPostId === id) {
      audioPlayerRef.current?.pause();
      setPlayingPostId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const audio = new Audio(audioUrlOrBase64);
    audioPlayerRef.current = audio;
    audio.onended = () => setPlayingPostId(null);
    audio.onerror = () => {
      setPlayingPostId(null);
      showToast("Cannot play audio.");
    };
    audio.play().catch(e => {
      console.warn("Audio play prevented:", e);
      setPlayingPostId(null);
    });
    setPlayingPostId(id);
  };

  // Delete post
  const handleDeletePost = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this post from community feed?")) return;

    setFeeds(prev => prev.filter(p => p.id !== postId));
    if (openPostReplies?.id === postId) setOpenPostReplies(null);

    try {
      if (!postId.startsWith('seed-') && !postId.startsWith('local-')) {
        await deleteDoc(doc(db, 'feeds', postId));
      }
      showToast("Post removed.");
    } catch (err) {
      console.warn("Could not delete post:", err);
    }
  };

  // Share post text / copy
  const handleSharePost = (post: FeedPostItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `Educate MW Community (${post.subject || 'General'}): "${post.text}" - by ${post.name}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      showToast("Post text copied!");
    } else {
      showToast("Shared!");
    }
  };

  // Filtered feeds list according to subject filter and hidden groups
  const filteredFeeds = feeds.filter(post => {
    // Check if the post belongs to a hidden group
    if (post.groupId && hiddenGroups.includes(post.groupId)) {
      return false;
    }

    if (selectedFilter === 'All Feed') return true;
    if (selectedFilter === 'Assignments Only') return post.type === 'assignment' || post.text.includes('[Assigned]');
    if (selectedFilter === 'Announcements') return post.type === 'announcement' || post.text.includes('[Announcement]');
    
    return post.subject?.toLowerCase() === selectedFilter.toLowerCase() || post.groupName?.toLowerCase() === selectedFilter.toLowerCase();
  });

  if (activeGroup) {
    return (
      <GroupChat 
        group={activeGroup} 
        onBack={() => setActiveGroup(null)} 
        theme={theme} 
        initialTab={activeGroup.initialTab}
      />
    );
  }

  return (
    <div className={`absolute inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'} animate-in slide-in-from-right duration-300`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] bg-indigo-600 text-white text-xs font-black px-4 py-2 rounded-full shadow-2xl animate-in fade-in slide-in-from-top-2 flex items-center gap-2 border border-indigo-400/30">
          <Sparkles size={14} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Hub Modal */}
      {showAdminHub && (
        <CommunityAdminHub
          theme={theme}
          onClose={() => setShowAdminHub(false)}
          onNavigateToGroup={(gId, tab) => {
            setShowAdminHub(false);
            const found = dynamicGroups.find(g => g.id === gId) || { name: gId, id: gId, members: 0 };
            setActiveGroup({ ...found, initialTab: tab });
          }}
        />
      )}

      {/* Request Group Modal */}
      <RequestGroupModal
        isOpen={showRequestGroupModal}
        onClose={() => setShowRequestGroupModal(false)}
        theme={theme}
      />

      {/* Hide / Unhide Groups Drawer */}
      {showHideFilterModal && (
        <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className={`w-full max-w-sm rounded-3xl border p-5 ${
            theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-indigo-400" />
                <h3 className="text-sm font-black">Customize Feed Stream</h3>
              </div>
              <button
                onClick={() => setShowHideFilterModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-800 text-gray-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-3">
              Choose which study groups appear on your Universal Community Feed. Toggle to hide or show:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 mb-4">
              {dynamicGroups.map((g) => {
                const isHidden = hiddenGroups.includes(g.id);
                return (
                  <div
                    key={g.id}
                    onClick={() => handleToggleHideGroup(g.id)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      isHidden
                        ? 'border-gray-800 bg-gray-950/60 opacity-60'
                        : 'border-indigo-500/40 bg-indigo-500/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-xs">{g.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      {isHidden ? (
                        <span className="flex items-center gap-1 text-gray-500">
                          <EyeOff size={13} /> Hidden
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Eye size={13} /> Visible
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowHideFilterModal(false)}
              className="w-full py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className={`${theme === 'dark' ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90 border-slate-200 shadow-sm'} backdrop-blur-xl pt-4 pb-3 px-4 sm:px-6 flex items-center justify-between shrink-0 z-10 border-b shadow-md`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            className={`w-10 h-10 ${theme === 'dark' ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} rounded-2xl flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-sm`}
            id="community-back-btn"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-lg leading-tight tracking-tight`}>
                Community Feed
              </h2>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className={`text-[10px] ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} font-bold uppercase tracking-wider`}>
              Universal MSCE Network • {globalOnlineCount} Online
            </p>
          </div>
        </div>

        {/* Header Action Buttons (Admin Hub, Request Group) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRequestGroupModal(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all active:scale-95 ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-indigo-300 hover:bg-gray-700'
                : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <Plus size={13} strokeWidth={3} />
            <span className="hidden sm:inline">Request Group</span>
          </button>

          <button
            onClick={() => setShowAdminHub(true)}
            className="relative px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-600/30 active:scale-95 transition-all"
            id="admin-hub-btn"
          >
            <Shield size={13} strokeWidth={2.5} />
            <span>Admin Hub</span>
            {pendingAdminCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-black animate-bounce shadow">
                {pendingAdminCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Scrollable Body */}
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-32">
        {/* Horizontal Study Groups Quick-Access Row */}
        <div className="px-4 sm:px-6 pt-5 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-xs uppercase tracking-wider text-gray-400`}>
              Active Study groups
            </h3>
            <button
              onClick={() => setShowHideFilterModal(true)}
              className="text-[11px] font-bold text-indigo-400 hover:underline flex items-center gap-1"
            >
              <SlidersHorizontal size={11} />
              <span>Hide / Show Groups</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar">
            {dynamicGroups.map((group) => {
              const IconComp = group.icon || FlaskConical;
              const msgCount = groupMessageCounts[group.id] || 0;
              const isHidden = hiddenGroups.includes(group.id);

              return (
                <div 
                  key={group.id} 
                  onClick={() => setActiveGroup({ name: group.name, members: msgCount, id: group.id, desc: group.desc })} 
                  className={`shrink-0 min-w-[150px] sm:min-w-[170px] ${
                    theme === 'dark' ? 'bg-gray-900/90 border-gray-800 hover:border-indigo-500/50' : 'bg-white border-slate-200 hover:border-indigo-400'
                  } rounded-2xl p-3 border flex items-center justify-between cursor-pointer transition-all active:scale-95 group ${
                    isHidden ? 'opacity-50' : ''
                  }`}
                  id={`group-${group.id}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${group.color} group-hover:scale-110 transition-transform`}>
                      <IconComp size={16} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-xs leading-snug line-clamp-1`}>
                        {group.name}
                      </h4>
                      <span className="text-[9px] text-emerald-400 font-bold">
                        {msgCount > 0 ? `${msgCount} msgs` : 'Live Chat'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="px-4 sm:px-6 pt-3 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {SUBJECT_FILTERS.map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer whitespace-nowrap border ${
                  selectedFilter === filter
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30 scale-102'
                    : theme === 'dark'
                      ? 'bg-gray-900 border-gray-800 text-slate-400 hover:text-white hover:bg-gray-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Post Creation Box on General Feed */}
        <div className="px-4 sm:px-6 pt-2 max-w-4xl mx-auto">
          <form onSubmit={handleCreatePost} className="mb-6">
            <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800 focus-within:border-indigo-500/50' : 'bg-white border-slate-200 shadow-sm focus-within:border-indigo-500'} border rounded-3xl p-4 transition-all shadow-md`}>
              {/* Subject Tag Selector */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-800/40">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Topic:
                  </span>
                  <select
                    value={newPostSubject}
                    onChange={e => setNewPostSubject(e.target.value)}
                    className={`text-xs font-bold px-2 py-1 rounded-xl outline-none border cursor-pointer ${
                      theme === 'dark' ? 'bg-gray-800 border-gray-700 text-indigo-400' : 'bg-slate-100 border-slate-200 text-indigo-600'
                    }`}
                  >
                    <option value="Sciences">Sciences (Bio, Chem, Phys)</option>
                    <option value="Humanities">Humanities (Hist, Geo, BK)</option>
                    <option value="Languages">Languages (Eng, Chichewa)</option>
                    <option value="General MSCE">General MSCE</option>
                  </select>
                </div>

                <span className="text-[10px] font-bold text-slate-400">
                  Posting as {currentUserName.split(' ')[0]}
                </span>
              </div>

              {/* Text Input */}
              <textarea
                value={newPostText}
                onChange={e => setNewPostText(e.target.value)}
                placeholder="Share an academic question, study tip, or discuss an MSCE concept with everyone..."
                rows={2}
                className={`w-full bg-transparent outline-none text-xs font-medium resize-none ${theme === 'dark' ? 'text-gray-100' : 'text-slate-900'} placeholder-gray-500`}
              />

              {/* Voice Note Attachment Preview */}
              {recordedAudioUrl && (
                <div className={`mt-2 mb-3 p-3 rounded-2xl flex items-center justify-between border ${theme === 'dark' ? 'bg-indigo-950/40 border-indigo-800/40' : 'bg-indigo-50 border-indigo-200'}`}>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => togglePlayAudio('preview-audio', recordedAudioUrl)}
                      className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md active:scale-95"
                    >
                      {playingPostId === 'preview-audio' ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                    </button>
                    <div>
                      <p className={`text-xs font-extrabold ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-800'}`}>
                        Voice Note Attached ({recordingSeconds}s)
                      </p>
                      <p className="text-[10px] text-slate-400">Ready to broadcast</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={cancelRecordedVoice}
                    className="p-1.5 rounded-xl text-red-400 hover:bg-red-500/10 active:scale-95"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {/* Recording Status Bar */}
              {isRecording && (
                <div className="mt-2 mb-3 p-3 rounded-2xl flex items-center justify-between bg-red-500/10 border border-red-500/30 animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-xs font-black text-red-400 uppercase tracking-wide">
                      Recording Voice Note ({recordingSeconds}s)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={stopRecordingVoice}
                    className="px-3 py-1 rounded-xl bg-red-500 text-white text-xs font-bold flex items-center gap-1 active:scale-95"
                  >
                    <Square size={12} fill="currentColor" /> Stop
                  </button>
                </div>
              )}

              {/* Bottom Actions Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-800/30">
                <div className="flex items-center gap-2">
                  {!isRecording && !recordedAudioUrl && (
                    <button
                      type="button"
                      onClick={startRecordingVoice}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        theme === 'dark' 
                          ? 'bg-gray-800 border-gray-700 text-slate-300 hover:text-white hover:bg-gray-700' 
                          : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Mic size={14} className="text-indigo-400" />
                      <span>Record Voice</span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={posting || (!newPostText.trim() && !recordedAudioBase64)}
                  className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-2 disabled:opacity-40 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
                  id="submit-feed-post-btn"
                >
                  {posting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={14} strokeWidth={2.5} />
                      <span>Post to Feed</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Feed Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-base flex items-center gap-2`}>
              <MessageCircle size={18} className="text-indigo-500" />
              <span>Universal Community Feed ({filteredFeeds.length})</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {selectedFilter}
            </span>
          </div>

          {/* Feeds Stream */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12">
                <Loader2 size={32} className="animate-spin text-indigo-500 mb-2" />
                <p className="text-xs font-bold text-slate-500">Syncing live community discussions...</p>
              </div>
            ) : filteredFeeds.length === 0 ? (
              <div className="text-center p-10 border border-dashed border-gray-800 rounded-3xl opacity-70">
                <MessageCircle size={36} className="mx-auto mb-3 text-slate-500" />
                <h4 className={`font-black text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  No posts in {selectedFilter}
                </h4>
                <p className="text-slate-500 text-xs mt-1">Be the first to share an assignment, formula or question!</p>
              </div>
            ) : (
              filteredFeeds.map((post, idx) => {
                const isLiked = Array.isArray(post.likedBy) && post.likedBy.includes(currentUserId);
                const isMyPost = post.userId === currentUserId;
                const isAssignment = post.type === 'assignment' || post.text.includes('[Assigned]');
                const isAnnouncement = post.type === 'announcement' || post.text.includes('[Announcement]');
                const isGroupShare = post.type === 'group_share' || Boolean(post.groupId);

                return (
                  <div 
                    key={post.id || idx} 
                    className={`${
                      isAssignment
                        ? 'border-emerald-500/40 bg-emerald-500/5'
                        : isAnnouncement
                        ? 'border-indigo-500/40 bg-indigo-500/5'
                        : theme === 'dark'
                        ? 'bg-gray-900/90 border-gray-800 hover:border-indigo-500/40'
                        : 'bg-white border-slate-200 hover:border-indigo-400 shadow-sm'
                    } p-5 rounded-3xl border transition-all duration-200`}
                  >
                    {/* Top Row with Badges */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm border shadow-inner ${post.color || 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                          {post.initial || post.name[0] || 'S'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-xs sm:text-sm leading-tight`}>
                              {post.name}
                            </h4>

                            {isAssignment && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <FileText size={10} /> Assigned
                              </span>
                            )}

                            {isAnnouncement && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                                <Megaphone size={10} /> Announcement
                              </span>
                            )}

                            {post.groupName && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-800 text-indigo-300 border border-gray-700">
                                {post.groupName}
                              </span>
                            )}

                            {post.subject && !post.groupName && (
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                                theme === 'dark' ? 'bg-indigo-950/60 border-indigo-800 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              }`}>
                                {post.subject}
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-500 font-bold tracking-wider mt-0.5">
                            {formatRealTime(post.createdAt) || post.timeText || 'Recent'}
                          </p>
                        </div>
                      </div>

                      {isMyPost && (
                        <button
                          onClick={(e) => handleDeletePost(post.id, e)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete post"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* Post Text Content */}
                    <p className={`${theme === 'dark' ? 'text-gray-200' : 'text-slate-800'} text-xs sm:text-[13px] font-medium leading-relaxed mb-3 select-text whitespace-pre-wrap`}>
                      {post.text}
                    </p>

                    {/* Voice Note Audio Wave Player */}
                    {post.audioData && (
                      <div className={`mb-3 p-3 rounded-2xl flex items-center gap-3 border ${
                        theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'
                      }`}>
                        <button
                          onClick={() => togglePlayAudio(post.id, post.audioData)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90 shadow-md ${
                            playingPostId === post.id 
                              ? 'bg-indigo-600 text-white animate-pulse' 
                              : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white'
                          }`}
                        >
                          {playingPostId === post.id ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-1 h-3 mb-1">
                            {Array.from({ length: 18 }).map((_, bi) => (
                              <div 
                                key={bi} 
                                className={`flex-1 rounded-full transition-all duration-300 ${
                                  playingPostId === post.id 
                                    ? 'bg-indigo-500 animate-pulse' 
                                    : theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'
                                }`}
                                style={{ height: `${20 + ((bi * 17) % 80)}%` }}
                              />
                            ))}
                          </div>
                          <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            <span>{playingPostId === post.id ? 'Playing Voice Note...' : 'Voice Study Message'}</span>
                            <span>{post.audioDuration ? `${post.audioDuration}s` : 'Audio'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action button if this is a group message or assignment */}
                    {post.groupId && (
                      <div className="mb-3 pt-2">
                        <button
                          onClick={() => {
                            const found = dynamicGroups.find(g => g.id === post.groupId) || { name: post.groupName || post.groupId, id: post.groupId, members: 0 };
                            setActiveGroup({
                              ...found,
                              initialTab: isAssignment ? 'assignments' : isAnnouncement ? 'announcements' : 'chat'
                            });
                          }}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-between transition-all active:scale-98 ${
                            isAssignment
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                              : 'bg-indigo-600/15 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/25'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            {isAssignment ? <FileText size={13} /> : <MessageCircle size={13} />}
                            <span>{isAssignment ? 'View Assignment & Submit Work' : `Join & Chat in [${post.groupName || post.groupId}]`}</span>
                          </span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    )}

                    {/* Interaction Buttons Row (REAL LIKES, REPLIES, SHARE) */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-gray-800/30">
                      <button 
                        onClick={(e) => handleToggleLike(post, e)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-xs transition-all active:scale-95 cursor-pointer ${
                          isLiked 
                            ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30 scale-105' 
                            : theme === 'dark' 
                              ? 'text-slate-400 hover:text-rose-400 hover:bg-white/5' 
                              : 'text-slate-600 hover:text-rose-500 hover:bg-slate-100'
                        }`}
                        id={`like-btn-${post.id}`}
                      >
                        <Heart 
                          size={15} 
                          className={isLiked ? "fill-rose-500 stroke-rose-500" : ""} 
                        />
                        <span>{post.likes || 0}</span>
                      </button>

                      <button 
                        onClick={() => setOpenPostReplies(post)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-xs transition-all active:scale-95 cursor-pointer ${
                          theme === 'dark' 
                            ? 'text-slate-400 hover:text-indigo-400 hover:bg-white/5' 
                            : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
                        }`}
                        id={`replies-btn-${post.id}`}
                      >
                        <MessageSquare size={15} />
                        <span>{post.repliesCount || 0} Replies</span>
                      </button>

                      <button 
                        onClick={(e) => handleSharePost(post, e)}
                        className={`p-2 rounded-full transition-all active:scale-95 cursor-pointer ${
                          theme === 'dark' ? 'text-slate-400 hover:text-indigo-400 hover:bg-white/5' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
                        }`}
                        title="Copy / Share post"
                      >
                        <Share2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Discussion & Replies Drawer / Modal */}
      {openPostReplies && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-md flex flex-col justify-end animate-in fade-in duration-200">
          <div 
            className={`w-full max-h-[85vh] rounded-t-[36px] flex flex-col border-t shadow-2xl animate-in slide-in-from-bottom duration-300 ${
              theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-gray-800/40 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-black text-base leading-tight">
                  Thread & Replies
                </h3>
                <p className="text-[11px] font-bold text-indigo-400 mt-0.5">
                  Discussion with {openPostReplies.name}
                </p>
              </div>
              <button 
                onClick={() => setOpenPostReplies(null)}
                className="w-8 h-8 rounded-full bg-gray-800 text-slate-300 hover:text-white flex items-center justify-center active:scale-95"
              >
                <X size={18} />
              </button>
            </div>

            {/* Original Post Context Bubble */}
            <div className="p-4 bg-indigo-500/5 border-b border-gray-800/40 shrink-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-black text-indigo-400">{openPostReplies.name}</span>
                <span className="text-[9px] text-slate-500 uppercase">{openPostReplies.subject}</span>
              </div>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} line-clamp-3 leading-relaxed`}>
                "{openPostReplies.text}"
              </p>
            </div>

            {/* Replies List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 hide-scrollbar">
              {repliesLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 size={24} className="animate-spin text-indigo-500" />
                </div>
              ) : replies.length === 0 ? (
                <div className="text-center py-10 opacity-60">
                  <MessageSquare size={32} className="mx-auto mb-2 text-slate-500" />
                  <p className="font-bold text-xs">No replies yet</p>
                  <p className="text-[11px] text-slate-500">Write the first helpful response or answer below!</p>
                </div>
              ) : (
                replies.map((rep, ri) => (
                  <div 
                    key={rep.id || ri}
                    className={`p-3.5 rounded-2xl border ${
                      theme === 'dark' ? 'bg-gray-800/60 border-gray-700/60' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] border ${rep.color || 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                          {rep.initial || rep.name[0]}
                        </div>
                        <span className="font-extrabold text-xs">{rep.name}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold">
                        {formatRealTime(rep.createdAt) || 'Recent'}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                      {rep.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Reply Input Bar */}
            <form onSubmit={handleSendReply} className="p-4 border-t border-gray-800/40 shrink-0 flex gap-2">
              <input
                type="text"
                value={newReplyText}
                onChange={e => setNewReplyText(e.target.value)}
                placeholder="Write your explanation or answer..."
                className={`flex-1 px-4 py-2.5 rounded-2xl text-xs font-medium outline-none border ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white focus:border-indigo-500' : 'bg-slate-100 border-slate-200 text-slate-900 focus:border-indigo-500'
                }`}
              />
              <button
                type="submit"
                disabled={replying || !newReplyText.trim()}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center disabled:opacity-40 shadow-lg active:scale-95 transition-all"
              >
                {replying ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} strokeWidth={2.5} />}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
