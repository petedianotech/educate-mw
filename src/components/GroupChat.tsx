import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, Mic, Square, Trash2, Send, Play, Pause, 
  Smile, Reply, X, Search, Sparkles, Pin, CheckCheck, 
  Volume2, FastForward, Flame, Lightbulb, 
  ThumbsUp, Heart, Laugh, Check, MessageSquare,
  Megaphone, FolderGit2, MessagesSquare, GraduationCap,
  Calendar, Info, MoreVertical
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp 
} from 'firebase/firestore';
import { useOnlinePresence, formatRealTime } from '../lib/presence';
import { GroupAnnouncementsTab } from './community/GroupAnnouncementsTab';
import { GroupResourcesTab } from './community/GroupResourcesTab';
import { GroupDiscussionsTab } from './community/GroupDiscussionsTab';
import { GroupAssignmentsTab } from './community/GroupAssignmentsTab';
import { GroupEventsPollsTab } from './community/GroupEventsPollsTab';
import { GroupInfoDrawer } from './community/GroupInfoDrawer';

export interface QuotedMessage {
  id: string;
  user: string;
  text: string;
  type?: 'text' | 'voice' | 'formula';
}

export interface GroupMessageItem {
  id: string;
  groupId: string;
  userId: string;
  user: string;
  initial?: string;
  text: string;
  type: 'text' | 'voice' | 'formula';
  audioData?: string;
  audioDuration?: number;
  replyTo?: QuotedMessage;
  reactions?: Record<string, string[]>; // e.g. { '👍': ['uid1', 'uid2'], '💡': ['uid3'] }
  createdAt?: any;
  timeText?: string;
}

const EMOJI_REACTIONS = ['👍', '❤️', '💡', '🔥', '😂', '👏', '💯'];

export function GroupChat({ 
  group, 
  onBack, 
  theme = 'dark',
  initialTab = 'chat'
}: { 
  group: { name: string; members: number; id?: string; desc?: string }; 
  onBack: () => void; 
  theme?: 'light' | 'dark';
  initialTab?: string;
}) {
  const groupId = group.id || group.name.toLowerCase().replace(/\s+/g, '-');
  const { groupOnlineCount, onlineUsers } = useOnlinePresence(groupId);
  
  const [messages, setMessages] = useState<GroupMessageItem[]>(() => {
    try {
      const cached = localStorage.getItem(`mw_group_chat_${groupId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [activeTab, setActiveTab] = useState<'chat' | 'announcements' | 'discussions' | 'assignments' | 'resources' | 'events'>((initialTab as any) || 'chat');
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [input, setInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Replying Quote state
  const [replyTarget, setReplyTarget] = useState<QuotedMessage | null>(null);

  // Reaction picker trigger
  const [reactionMenuMsgId, setReactionMenuMsgId] = useState<string | null>(null);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [spectrum, setSpectrum] = useState<number[]>(new Array(16).fill(15));
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const spectrumIntervalRef = useRef<any>(null);

  // Voice Playback state & Multiplier (1x, 1.5x, 2x)
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sound pop effect
  const playSoundEffect = (type: 'send' | 'pop') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'send') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }
    } catch {}
  };

  const currentUserId = auth.currentUser?.uid || (typeof localStorage !== 'undefined' ? localStorage.getItem('mw_anonymous_uid') : null) || 'guest-user';
  const currentUserName = auth.currentUser?.displayName || (typeof localStorage !== 'undefined' ? localStorage.getItem('mw_user_name') : null) || 'Student';

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // Real-time Firestore sync for Group Messages
  useEffect(() => {
    let isMounted = true;
    try {
      const q = query(
        collection(db, 'group_messages'),
        where('groupId', '==', groupId),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        const list: GroupMessageItem[] = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            groupId: d.groupId || groupId,
            userId: d.userId || 'student',
            user: d.user || d.userName || 'Student',
            initial: d.initial || (d.user ? d.user[0] : (d.userName ? d.userName[0] : 'S')),
            text: d.text || '',
            type: d.type || 'text',
            audioData: d.audioData || undefined,
            audioDuration: d.audioDuration || undefined,
            replyTo: d.replyTo || undefined,
            reactions: d.reactions || {},
            createdAt: d.createdAt,
            timeText: d.timeText || undefined
          };
        });
        setMessages(list);
        try {
          localStorage.setItem(`mw_group_chat_${groupId}`, JSON.stringify(list));
        } catch {}
        setTimeout(() => scrollToBottom(false), 100);
      }, (err) => {
        console.warn("Group messages live query notice:", err);
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (e) {
      console.warn("Group chat Firestore listener init error:", e);
    }
  }, [groupId]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  // Cleanup audio & timers on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (spectrumIntervalRef.current) clearInterval(spectrumIntervalRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  // WhatsApp Voice Note Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const localUrl = URL.createObjectURL(blob);
        setAudioUrl(localUrl);

        // Convert to Base64 for Firestore real-time sharing
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          setAudioBase64(reader.result as string);
        };

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);

      spectrumIntervalRef.current = setInterval(() => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const newSpec = [];
        for (let i = 0; i < 16; i++) {
          newSpec.push(Math.max(15, (dataArray[i * 2] / 255) * 100));
        }
        setSpectrum(newSpec);
      }, 100);

    } catch (err) {
      console.error("Mic record error:", err);
      // Fallback mock waveform if mic unavailable
      setIsRecording(true);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
      spectrumIntervalRef.current = setInterval(() => {
        setSpectrum(Array.from({ length: 16 }, () => Math.max(15, Math.random() * 85)));
      }, 100);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (spectrumIntervalRef.current) clearInterval(spectrumIntervalRef.current);
  };

  const cancelRecording = () => {
    if (isRecording) stopRecording();
    setAudioUrl(null);
    setAudioBase64(null);
    setRecordingSeconds(0);
  };

  // Send Message (Text or Voice or Formula)
  const sendMessage = async (customText?: string, messageType: 'text' | 'voice' | 'formula' = 'text') => {
    const textToSend = customText !== undefined ? customText : input.trim();

    if (!textToSend && !audioBase64) return;

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: GroupMessageItem = {
      id: 'local-' + Date.now(),
      groupId,
      userId: currentUserId,
      user: currentUserName,
      initial: currentUserName[0]?.toUpperCase() || 'S',
      text: textToSend,
      type: audioBase64 ? 'voice' : messageType,
      audioData: audioBase64 || undefined,
      audioDuration: audioBase64 ? Math.max(1, recordingSeconds) : undefined,
      replyTo: replyTarget || undefined,
      reactions: {},
      timeText: timeFormatted
    };

    // Optimistic UI update
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setReplyTarget(null);
    cancelRecording();
    playSoundEffect('send');
    setTimeout(() => scrollToBottom(true), 50);

    // Sync to Firestore
    try {
      const docRef = await addDoc(collection(db, 'group_messages'), {
        groupId: newMsg.groupId,
        userId: newMsg.userId,
        user: newMsg.user,
        initial: newMsg.initial,
        text: newMsg.text,
        type: newMsg.type,
        audioData: newMsg.audioData || null,
        audioDuration: newMsg.audioDuration || null,
        replyTo: newMsg.replyTo || null,
        reactions: {},
        timeText: newMsg.timeText,
        createdAt: serverTimestamp()
      });

      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, id: docRef.id } : m));

      // Also publish to General Community Feed so all circle activity appears on the universal feed
      try {
        await addDoc(collection(db, 'feeds'), {
          text: newMsg.text,
          userId: newMsg.userId,
          name: newMsg.user,
          initial: newMsg.initial,
          color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          subject: group.name || 'Sciences',
          groupId: newMsg.groupId,
          groupName: group.name,
          type: 'group_share',
          audioData: newMsg.audioData || null,
          audioDuration: newMsg.audioDuration || null,
          likes: 0,
          likedBy: [],
          repliesCount: 0,
          createdAt: serverTimestamp()
        });
      } catch (feedErr) {
        console.warn("Could not mirror message to general feed:", feedErr);
      }
    } catch (err) {
      console.warn("Could not save message to cloud:", err);
    }
  };

  // Handle Emoji Reactions Toggle
  const handleToggleReaction = async (msgId: string, emoji: string) => {
    playSoundEffect('pop');
    setReactionMenuMsgId(null);

    const uid = currentUserId;

    setMessages(prev => prev.map(msg => {
      if (msg.id !== msgId) return msg;

      const currentReactions = { ...(msg.reactions || {}) };
      const userList = currentReactions[emoji] || [];

      if (userList.includes(uid)) {
        // Remove reaction
        const updated = userList.filter(id => id !== uid);
        if (updated.length === 0) {
          delete currentReactions[emoji];
        } else {
          currentReactions[emoji] = updated;
        }
      } else {
        // Add reaction
        currentReactions[emoji] = [...userList, uid];
      }

      return { ...msg, reactions: currentReactions };
    }));

    // Firestore sync if not a seed message
    const targetMsg = messages.find(m => m.id === msgId);
    if (targetMsg && !msgId.startsWith('msg-seed-') && !msgId.startsWith('local-')) {
      try {
        const currentReactions = { ...(targetMsg.reactions || {}) };
        const userList = currentReactions[emoji] || [];
        if (userList.includes(uid)) {
          const updated = userList.filter(id => id !== uid);
          if (updated.length === 0) delete currentReactions[emoji];
          else currentReactions[emoji] = updated;
        } else {
          currentReactions[emoji] = [...userList, uid];
        }

        await updateDoc(doc(db, 'group_messages', msgId), {
          reactions: currentReactions
        });
      } catch (err) {
        console.warn("Failed to update reaction on cloud:", err);
      }
    }
  };

  // Audio Playback with WhatsApp Style & Speed Rate
  const togglePlayAudio = (id: string, audioDataUrl?: string) => {
    if (!audioDataUrl) return;

    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioDataUrl);
    audio.playbackRate = playbackRate;
    audioRef.current = audio;

    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);

    audio.play().catch(e => {
      console.warn("Voice play prevented:", e);
      setPlayingId(null);
    });
    setPlayingId(id);
  };

  // Change voice playback speed (1x -> 1.5x -> 2x)
  const cyclePlaybackSpeed = () => {
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  // Delete message handler
  const handleDeleteMessage = async (msgId: string) => {
    if (!window.confirm("Delete this message?")) return;
    setMessages(prev => prev.filter(m => m.id !== msgId));
    if (!msgId.startsWith('msg-seed-') && !msgId.startsWith('local-')) {
      try {
        await deleteDoc(doc(db, 'group_messages', msgId));
      } catch (err) {
        console.warn("Delete message error:", err);
      }
    }
  };

  // Filter messages based on search
  const filteredMessages = messages.filter(m => {
    if (!searchTerm.trim()) return true;
    return m.text?.toLowerCase().includes(searchTerm.toLowerCase()) || m.user?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className={`absolute inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'} animate-in slide-in-from-right duration-300`}>
      {/* WhatsApp Header */}
      <div className={`${theme === 'dark' ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-slate-200'} backdrop-blur-xl pt-3 pb-3 px-4 flex items-center justify-between shrink-0 z-20 border-b shadow-md`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button 
            onClick={onBack} 
            className={`w-9 h-9 ${theme === 'dark' ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} rounded-2xl flex items-center justify-center shrink-0 active:scale-95 transition-all`}
            id="group-chat-back-btn"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>

          <div className="flex-1 min-w-0">
            <h2 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-base leading-tight truncate flex items-center gap-2`}>
              {group.name}
            </h2>
            <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{groupOnlineCount} Online</span>
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5">
          {activeTab === 'chat' && (
            <button 
              onClick={() => setShowSearch(!showSearch)} 
              className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                showSearch 
                  ? 'bg-indigo-600 text-white' 
                  : theme === 'dark' ? 'bg-gray-800/80 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
              title="Search group messages"
            >
              <Search size={16} />
            </button>
          )}

          <button
            onClick={() => setShowInfoDrawer(true)}
            className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
              theme === 'dark' ? 'bg-gray-800/80 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
            title="Circle settings, rules & invite links"
          >
            <Info size={16} />
          </button>
        </div>
      </div>

      {/* Community Module Tabs Bar */}
      <div className={`px-3 py-2 border-b flex items-center gap-1.5 overflow-x-auto hide-scrollbar shrink-0 ${
        theme === 'dark' ? 'bg-gray-900/60 border-gray-800' : 'bg-slate-100/70 border-slate-200'
      }`}>
        {[
          { id: 'chat', label: 'Chat', icon: MessageSquare },
          { id: 'announcements', label: 'Announcements', icon: Megaphone },
          { id: 'discussions', label: 'Discussions', icon: MessagesSquare },
          { id: 'assignments', label: 'Assignments', icon: GraduationCap },
          { id: 'resources', label: 'Resources', icon: FolderGit2 },
          { id: 'events', label: 'Events & Polls', icon: Calendar }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : theme === 'dark'
                  ? 'bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'announcements' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <GroupAnnouncementsTab groupId={groupId} groupName={group.name} theme={theme} userRole="student" />
        </div>
      )}

      {activeTab === 'discussions' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <GroupDiscussionsTab groupId={groupId} groupName={group.name} theme={theme} userRole="student" />
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <GroupAssignmentsTab groupId={groupId} groupName={group.name} theme={theme} userRole="student" />
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <GroupResourcesTab groupId={groupId} groupName={group.name} theme={theme} userRole="student" />
        </div>
      )}

      {activeTab === 'events' && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <GroupEventsPollsTab groupId={groupId} groupName={group.name} theme={theme} userRole="student" />
        </div>
      )}

      {/* Main Group Chat Content */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

      {/* Search Bar Sub-header */}
      {showSearch && (
        <div className={`px-4 py-2 border-b flex items-center gap-2 animate-in slide-in-from-top duration-200 ${
          theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search discussion or student name..."
            className="flex-1 bg-transparent text-xs outline-none font-medium"
            autoFocus
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-200">
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Study Topic Banner (WhatsApp Pinned Header) */}
      <div className={`px-4 py-2 border-b flex items-center justify-between text-xs shrink-0 ${
        theme === 'dark' ? 'bg-indigo-950/40 border-indigo-900/40 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-900'
      }`}>
        <div className="flex items-center gap-2 truncate">
          <Pin size={12} className="text-indigo-400 shrink-0 rotate-45" />
          <span className="font-extrabold truncate">
            Subject Focus: {group.desc || 'Past paper revision & syllabus formulas'}
          </span>
        </div>
      </div>

      {/* Messages Feed View */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 hide-scrollbar">
        <div className="flex justify-center my-2">
          <div className={`${theme === 'dark' ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} px-3.5 py-1 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest border`}>
            WhatsApp Study Group
          </div>
        </div>

        {filteredMessages.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center opacity-60 px-6">
            <MessageSquare size={32} className="text-slate-400 mb-2" />
            <p className="font-bold text-xs">No messages found</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Send the first study question or voice note below!</p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMe = msg.userId === currentUserId;
            const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;

            return (
              <div 
                key={msg.id} 
                id={`msg-${msg.id}`}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative animate-in fade-in slide-in-from-bottom-2 duration-200`}
              >
                {/* Sender Name for incoming group messages */}
                {!isMe && (
                  <div className="flex items-center gap-1.5 mb-1 ml-1">
                    <div className="w-4.5 h-4.5 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[9px] font-black border border-indigo-500/30">
                      {msg.initial || msg.user[0] || 'S'}
                    </div>
                    <span className="text-[10.5px] font-black text-indigo-400">
                      {msg.user}
                    </span>
                  </div>
                )}

                {/* Message Bubble Container */}
                <div className="relative max-w-[85%] sm:max-w-[75%]">
                  {/* Quoted Message (Reply Preview) */}
                  {msg.replyTo && (
                    <div 
                      className={`mb-1 p-2 rounded-xl text-[11px] border-l-4 border-indigo-500 ${
                        theme === 'dark' ? 'bg-slate-900/80 text-slate-300' : 'bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      <span className="font-black text-indigo-400 block text-[9.5px]">
                        {msg.replyTo.user}
                      </span>
                      <p className="line-clamp-1 italic text-[10.5px]">
                        {msg.replyTo.type === 'voice' ? '🎤 Voice Note' : msg.replyTo.text}
                      </p>
                    </div>
                  )}

                  {/* Main Bubble Content */}
                  <div 
                    className={`rounded-[22px] px-4 py-2.5 text-[13px] font-medium shadow-md transition-all ${
                      isMe 
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none' 
                        : theme === 'dark' 
                          ? 'bg-gray-900 border border-gray-800 text-gray-100 rounded-tl-none' 
                          : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {/* Voice Note Player */}
                    {msg.type === 'voice' ? (
                      <div className="flex items-center gap-3 py-1 min-w-[180px]">
                        <button 
                          onClick={() => togglePlayAudio(msg.id, msg.audioData || audioUrl || '')} 
                          className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-transform active:scale-90 shadow-md ${
                            playingId === msg.id 
                              ? 'bg-white text-indigo-600 animate-pulse' 
                              : isMe ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                          }`}
                        >
                          {playingId === msg.id ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          {/* Animated Voice Waveform */}
                          <div className="flex items-center gap-0.5 h-4 mb-1">
                            {Array.from({ length: 14 }).map((_, barIdx) => (
                              <div 
                                key={barIdx} 
                                className={`flex-1 rounded-full transition-all duration-200 ${
                                  playingId === msg.id 
                                    ? isMe ? 'bg-white animate-pulse' : 'bg-indigo-500 animate-pulse' 
                                    : isMe ? 'bg-white/40' : 'bg-slate-600'
                                }`}
                                style={{ height: `${25 + ((barIdx * 23) % 75)}%` }}
                              ></div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between text-[9px] font-bold opacity-80">
                            <span>{playingId === msg.id ? 'Playing...' : (msg.audioDuration ? `${msg.audioDuration}s` : 'Voice')}</span>
                            {/* Playback speed toggle */}
                            <button
                              onClick={cyclePlaybackSpeed}
                              className={`px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase tracking-wider ${
                                isMe ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-400'
                              }`}
                            >
                              {playbackRate}x
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : msg.type === 'formula' ? (
                      <div className="py-1">
                        <div className="flex items-center gap-1.5 text-indigo-400 text-[10px] font-black uppercase tracking-wider mb-1">
                          <Sparkles size={12} />
                          <span>Academic Reference</span>
                        </div>
                        <div className={`p-2.5 rounded-xl font-mono text-xs font-bold ${
                          isMe ? 'bg-black/20 text-indigo-100' : theme === 'dark' ? 'bg-black/40 text-indigo-300' : 'bg-slate-100 text-indigo-900'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ) : (
                      <p className="leading-relaxed whitespace-pre-wrap select-text">
                        {msg.text}
                      </p>
                    )}

                    {/* Timestamp & Delivery status ticks */}
                    <div className={`flex items-center justify-end gap-1 text-[8.5px] font-black mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-500'}`}>
                      <span>{formatRealTime(msg.createdAt, msg.timeText)}</span>
                      {isMe && <CheckCheck size={12} className="text-cyan-300" />}
                    </div>
                  </div>

                  {/* Reaction Badges underneath bubble */}
                  {hasReactions && (
                    <div className="flex items-center gap-1 mt-1 -mb-1 flex-wrap">
                      {Object.entries(msg.reactions || {}).map(([emoji, userIds]) => {
                        if (!userIds || userIds.length === 0) return null;
                        const iReacted = userIds.includes(currentUserId);
                        return (
                          <button
                            key={emoji}
                            onClick={() => handleToggleReaction(msg.id, emoji)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border shadow-sm transition-transform active:scale-90 ${
                              iReacted
                                ? 'bg-indigo-600 text-white border-indigo-400 scale-105'
                                : theme === 'dark' ? 'bg-gray-800 border-gray-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="text-[9px] font-black">{userIds.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Hover / Quick Action Bar for Reply & React */}
                  <div className={`absolute top-0 ${isMe ? '-left-16' : '-right-16'} hidden group-hover:flex items-center gap-1 bg-gray-900/90 border border-gray-700 rounded-full p-1 shadow-xl z-20`}>
                    <button
                      onClick={() => setReactionMenuMsgId(reactionMenuMsgId === msg.id ? null : msg.id)}
                      className="p-1 text-slate-300 hover:text-yellow-400 transition-colors"
                      title="React"
                    >
                      <Smile size={14} />
                    </button>
                    <button
                      onClick={() => setReplyTarget({ id: msg.id, user: msg.user, text: msg.text, type: msg.type })}
                      className="p-1 text-slate-300 hover:text-indigo-400 transition-colors"
                      title="Reply"
                    >
                      <Reply size={14} />
                    </button>
                    {isMe && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1 text-slate-300 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Emoji Quick Picker Popup */}
                  {reactionMenuMsgId === msg.id && (
                    <div className={`absolute -top-10 ${isMe ? 'right-0' : 'left-0'} z-30 flex items-center gap-1.5 p-1.5 rounded-full shadow-2xl border animate-in zoom-in-95 duration-150 ${
                      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-300'
                    }`}>
                      {EMOJI_REACTIONS.map(em => (
                        <button
                          key={em}
                          onClick={() => handleToggleReaction(msg.id, em)}
                          className="hover:scale-125 transition-transform text-sm p-1 active:scale-95"
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quoted Message Input Banner */}
      {replyTarget && (
        <div className={`px-4 py-2 border-t flex items-center justify-between ${
          theme === 'dark' ? 'bg-gray-900/90 border-gray-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <Reply size={14} className="text-indigo-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] font-black text-indigo-400 block">
                Replying to {replyTarget.user}
              </span>
              <p className="text-xs text-slate-400 truncate italic">
                {replyTarget.type === 'voice' ? '🎤 Voice Note' : replyTarget.text}
              </p>
            </div>
          </div>
          <button onClick={() => setReplyTarget(null)} className="text-slate-400 hover:text-slate-200">
            <X size={16} />
          </button>
        </div>
      )}

      {/* WhatsApp Input Controls Bar */}
      <div className={`${theme === 'dark' ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'} backdrop-blur-xl p-3 shrink-0 border-t flex items-center gap-2`}>

        {/* Dynamic Voice Recording or Text Input */}
        <div className="flex-1 relative">
          {audioUrl ? (
            /* Audio Note Preview & Confirm Bar */
            <div className={`rounded-2xl px-3 py-1.5 flex items-center gap-2 border ${
              theme === 'dark' ? 'bg-gray-800 border-indigo-500/40' : 'bg-slate-100 border-indigo-200'
            }`}>
              <button 
                onClick={() => togglePlayAudio('preview', audioUrl)} 
                className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md active:scale-95"
              >
                {playingId === 'preview' ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
              </button>

              <div className="flex-1 flex items-center gap-0.5 h-3 overflow-hidden">
                {spectrum.map((h, i) => (
                  <div key={i} className="flex-1 bg-indigo-400 rounded-full" style={{ height: `${h}%` }}></div>
                ))}
              </div>

              <span className="text-[10px] font-black text-indigo-400">{recordingSeconds}s</span>

              <button 
                onClick={cancelRecording} 
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-400 active:scale-95"
              >
                <Trash2 size={16} />
              </button>

              <button 
                onClick={() => sendMessage('', 'voice')} 
                className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 active:scale-95 transition-transform"
              >
                <Send size={14} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            /* Normal Input / Live Recording Bar */
            <div className={`flex items-center rounded-2xl px-3 py-1 border transition-all duration-200 ${
              isRecording 
                ? 'bg-red-500/10 border-red-500/40 ring-2 ring-red-500/20' 
                : theme === 'dark' ? 'bg-gray-800/70 border-gray-700 focus-within:border-indigo-500' : 'bg-slate-100 border-slate-200 focus-within:border-indigo-500'
            }`}>
              {isRecording ? (
                <div className="flex-1 flex items-center gap-2 py-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                  <div className="flex-1 flex items-center gap-0.5 h-4">
                    {spectrum.map((h, i) => (
                      <div key={i} className="flex-1 bg-red-400 rounded-full transition-all duration-75" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                  <span className="text-[10.5px] font-black text-red-500 w-8 text-right">
                    {recordingSeconds}s
                  </span>
                </div>
              ) : (
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a study message or question..." 
                  className={`bg-transparent flex-1 outline-none text-xs py-1.5 font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  } placeholder-slate-400`}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
              )}

              {/* Mic / Stop Record / Send Buttons */}
              {!input.trim() ? (
                <button 
                  type="button" 
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`ml-1.5 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    isRecording 
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 active:scale-95' 
                      : 'text-indigo-400 hover:text-indigo-300 active:scale-95'
                  }`}
                  title={isRecording ? "Stop recording" : "Record voice note"}
                >
                  {isRecording ? <Square size={14} fill="currentColor" /> : <Mic size={18} />}
                </button>
              ) : (
                <button 
                  onClick={() => sendMessage()} 
                  className="ml-1.5 w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 active:scale-95 transition-transform"
                >
                  <Send size={14} strokeWidth={2.5} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
      )}

      {/* Circle Info & Settings Drawer */}
      <GroupInfoDrawer
        group={group}
        isOpen={showInfoDrawer}
        onClose={() => setShowInfoDrawer(false)}
        theme={theme}
        userRole="student"
      />
    </div>
  );
}
