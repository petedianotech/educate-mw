import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  ArrowLeft, 
  Star, 
  Flame, 
  Medal, 
  Search, 
  Sparkles, 
  GraduationCap, 
  Zap, 
  UserCheck,
  Shield,
  SearchX,
  Share2,
  Gift,
  CheckCircle2
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, getDocs, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { Avatar } from './Avatar';
import { ACHIEVEMENTS } from '../data/achievements';

interface BoardUser {
  id: string;
  name: string;
  points: number;
  level?: string;
  streak?: number;
  isPro?: boolean;
  avatarId?: string;
  gender?: string;
  avatarGradient?: string;
  achievements?: string[];
}

const INITIAL_LEADERBOARD_USERS: BoardUser[] = [
  { id: 'demo1', name: 'Tamanda Phiri', points: 2850, level: 'Form 4', streak: 12, isPro: true, gender: 'female', avatarGradient: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)', achievements: ['first_quiz', 'streak_7', 'speed_demon'] },
  { id: 'demo2', name: 'Alinafe Mwale', points: 2420, level: 'Form 3', streak: 8, isPro: false, gender: 'male', avatarGradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', achievements: ['first_quiz', 'library_reader'] },
  { id: 'demo3', name: 'Chisomo Banda', points: 1980, level: 'Form 4', streak: 15, isPro: true, gender: 'female', avatarGradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', achievements: ['perfect_score', 'streak_7'] },
  { id: 'demo4', name: 'Limbani Chiumia', points: 1750, level: 'Form 2', streak: 5, isPro: false, gender: 'male', avatarGradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', achievements: ['first_quiz'] },
  { id: 'demo5', name: 'Kondwani Mtambo', points: 1610, level: 'Form 1', streak: 0, isPro: false, gender: 'male', avatarGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', achievements: ['academic_explorer'] },
  { id: 'demo6', name: 'Wongani Gondwe', points: 1540, level: 'Form 4', streak: 22, isPro: true, gender: 'male', avatarGradient: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)', achievements: ['streak_30', 'flashcard_master'] },
  { id: 'demo7', name: 'Chimwemwe Zulu', points: 1420, level: 'Form 3', streak: 6, isPro: false, gender: 'female', avatarGradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', achievements: ['night_owl'] },
  { id: 'demo8', name: 'Blessings Kachale', points: 1350, level: 'Form 4', streak: 10, isPro: true, gender: 'male', avatarGradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', achievements: ['quiz_master'] },
  { id: 'demo9', name: 'Tadala Mvula', points: 1210, level: 'Form 2', streak: 4, isPro: false, gender: 'female', avatarGradient: 'linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)', achievements: ['early_bird'] }
];

export function LeaderboardView({ 
  onBack, 
  theme = 'dark',
  profile 
}: { 
  onBack: () => void; 
  theme?: 'light' | 'dark';
  profile: any;
}) {
  const [users, setUsers] = useState<BoardUser[]>(() => {
    try {
      const cached = localStorage.getItem('mw_leaderboard_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_LEADERBOARD_USERS;
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('All');
  const [copiedLink, setCopiedLink] = useState(false);
  
  useEffect(() => {
    let isMounted = true;
    async function fetchLeaderboard() {
      try {
        const fetchPromise = (async () => {
          const q = query(
            collection(db, 'users'),
            orderBy('points', 'desc'),
            firestoreLimit(100)
          );
          const snap = await getDocs(q);
          const list: BoardUser[] = [];
          snap.forEach(docSnap => {
            const data = docSnap.data();
            list.push({
              id: docSnap.id,
              name: data.name || data.displayName || 'Learner',
              points: typeof data.points === 'number' ? data.points : 0,
              level: data.level || 'Form 4',
              streak: typeof data.streak === 'number' ? data.streak : 0,
              isPro: !!data.isPro,
              avatarId: data.avatarId || '',
              gender: data.gender || 'male',
              avatarGradient: data.avatarGradient || '',
              achievements: data.achievements || []
            });
          });
          return list;
        })();

        // Add 3-second safety timeout so low-end devices never stall
        const timeoutPromise = new Promise<BoardUser[]>((_, reject) => 
          setTimeout(() => reject(new Error('Leaderboard fetch timeout')), 3000)
        );

        const list = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (isMounted) {
          if (list && list.length > 0) {
            const sorted = list.sort((a, b) => b.points - a.points);
            setUsers(sorted);
            try {
              localStorage.setItem('mw_leaderboard_cache', JSON.stringify(sorted));
            } catch {}
          } else {
            setUsers(INITIAL_LEADERBOARD_USERS);
          }
        }
      } catch (err) {
        console.warn("Leaderboard network fetch fallback active:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    fetchLeaderboard();
    return () => { isMounted = false; };
  }, []);

  // Filtered and sorted list
  const filteredUsers = useMemo(() => {
    return users
      .filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLevel = levelFilter === 'All' || u.level === levelFilter;
        return matchesSearch && matchesLevel;
      })
      .sort((a, b) => b.points - a.points);
  }, [users, searchQuery, levelFilter]);

  // Current user's rank status
  const currentUserRank = useMemo(() => {
    if (!auth.currentUser) return null;
    const index = users.findIndex(u => u.id === auth.currentUser?.uid);
    if (index === -1) {
      if (profile) {
        return {
          rank: users.length + 1,
          user: {
            id: auth.currentUser.uid,
            name: profile.name || 'Student',
            points: profile.points || 0,
            level: profile.level || 'Form 4',
            streak: profile.streak || 0,
            isPro: !!profile.isPro,
            gender: profile.gender || 'male',
            avatarGradient: profile.avatarGradient || ''
          }
        };
      }
      return null;
    }
    return {
      rank: index + 1,
      user: users[index]
    };
  }, [users, profile]);

  // Podium Users (Top 3 overall)
  const podiumUsers = useMemo(() => {
    return filteredUsers.slice(0, 3);
  }, [filteredUsers]);

  // Scroll/List Users (Rank 4+)
  const listUsers = useMemo(() => {
    return filteredUsers.slice(3);
  }, [filteredUsers]);

  // Quick stats
  const totalLeaguePoints = useMemo(() => {
    return users.reduce((sum, u) => sum + u.points, 0);
  }, [users]);

  // App Sharing functionality
  const handleShareApp = async () => {
    const link = `${window.location.origin}/?ref=${profile?.referralCode || 'EDUCATE500'}`;
    const shareText = `Hey classmate! Join me on Educate MW — Malawi's leading secondary study app. Enter my referral code ${profile?.referralCode || 'EDUCATE500'} during sign up to unlock +10 Emi AI questions and +500 XP starting bonus! 🎁 Learn smarter here:`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Educate MW App',
          text: shareText,
          url: link
        });
      } catch (err) {
        console.warn("Share popup dismissed or failed, copying to clipboard:", err);
        copyToClipboard(link);
      }
    } else {
      copyToClipboard(link);
    }
  };

  const copyToClipboard = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className={`p-3 md:p-6 min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Header section with back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3 max-w-7xl mx-auto">
        <button 
          onClick={onBack}
          className={`self-start flex items-center gap-2 font-bold text-xs uppercase tracking-wider py-2 px-4 rounded-xl border transition-all ${
            theme === 'dark' 
              ? 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800' 
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm'
          }`}
        >
          <ArrowLeft size={15} /> Back
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <Trophy size={20} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight leading-tight">National Leaderboard</h1>
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Top performing Malawian students</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-7xl mx-auto">
        
        {/* Left Column - Filters and Share Center */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* My performance summary widget */}
          {currentUserRank && (
            <div 
              className={`p-4 rounded-2xl border ${
                theme === 'dark' 
                  ? 'bg-gray-900/60 border-indigo-500/30' 
                  : 'bg-white border-indigo-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-indigo-500">
                  <Sparkles size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Your Standing</span>
                </div>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                  currentUserRank.rank <= 3 
                    ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                    : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                }`}>
                  Rank #{currentUserRank.rank}
                </span>
              </div>
              
              <div className="flex items-center gap-3 mb-3">
                <Avatar user={{ name: currentUserRank.user.name, gender: currentUserRank.user.gender, id: currentUserRank.user.id, avatarGradient: currentUserRank.user.avatarGradient }} className="w-10 h-10 text-xs rounded-xl shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className={`text-sm font-black truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {currentUserRank.user.name}
                  </h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{currentUserRank.user.level || 'Form 4'} Student</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 border-t border-slate-200 dark:border-gray-800 pt-3">
                <div className={`p-2 rounded-xl text-center ${theme === 'dark' ? 'bg-gray-950/50' : 'bg-slate-50'}`}>
                  <div className="text-base font-black text-indigo-500 flex items-center justify-center gap-1">
                    {currentUserRank.user.points?.toLocaleString()} 
                    <Zap size={14} fill="currentColor" />
                  </div>
                  <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider mt-0.5">Total XP</p>
                </div>
                <div className={`p-2 rounded-xl text-center ${theme === 'dark' ? 'bg-gray-950/50' : 'bg-slate-50'}`}>
                  <div className="text-base font-black text-amber-500 flex items-center justify-center gap-1">
                    {currentUserRank.user.streak || 0} 
                    <Flame size={14} fill="currentColor" />
                  </div>
                  <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider mt-0.5">Day Streak</p>
                </div>
              </div>
            </div>
          )}

          {/* Referral Reward Hub */}
          <div className={`p-4 rounded-2xl border ${
            theme === 'dark' ? 'bg-gray-900/40 border-gray-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                <Gift size={15} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider leading-none">Referral Hub</h4>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide mt-0.5">Earn Free Emi AI Tokens</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className={`p-2 rounded-xl border ${theme === 'dark' ? 'bg-gray-950/50 border-gray-800' : 'bg-slate-50 border-slate-200'}`}>
                <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">You Get</p>
                <p className={`text-xs font-black mt-0.5 ${theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}`}>+10 Tokens</p>
              </div>
              <div className={`p-2 rounded-xl border ${theme === 'dark' ? 'bg-gray-950/50 border-gray-800' : 'bg-slate-50 border-slate-200'}`}>
                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">Friend Gets</p>
                <p className={`text-xs font-black mt-0.5 ${theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}`}>+500 XP & Tokens</p>
              </div>
            </div>

            <div className={`p-1.5 rounded-xl border flex items-center justify-between gap-2 ${theme === 'dark' ? 'bg-gray-950 border-gray-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-xs font-mono font-bold text-indigo-400 pl-2 truncate">
                {profile?.referralCode || 'EDUCATE500'}
              </span>
              <button 
                onClick={handleShareApp} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1 active:scale-95 transition-all shrink-0"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 size={12} className="text-emerald-300" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 size={12} /> 
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Filters card */}
          <div className={`p-4 rounded-2xl border ${
            theme === 'dark' ? 'bg-gray-900/40 border-gray-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h3 className="text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <GraduationCap size={15} /> Filters
            </h3>

            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                  <Search size={14} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full py-2 pl-9 pr-3 rounded-xl border font-bold text-xs outline-none focus:border-indigo-500 ${
                    theme === 'dark' 
                      ? 'bg-gray-950 border-gray-800 text-white placeholder-gray-600' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                  placeholder="Search student name..."
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">Class / Level</label>
                <div className="flex flex-wrap gap-1.5">
                  {['All', 'Form 1', 'Form 2', 'Form 3', 'Form 4'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setLevelFilter(level)}
                      className={`py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1 ${
                        levelFilter === level
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : (theme === 'dark' ? 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100')
                      }`}
                    >
                      <span>{level === 'All' ? 'All Classes' : level}</span>
                      {levelFilter === level && <UserCheck size={11} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Leaderboard list */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {loading ? (
            <div className={`p-12 rounded-2xl border flex flex-col items-center justify-center gap-3 text-center ${
              theme === 'dark' ? 'bg-gray-900/30 border-gray-800' : 'bg-white border-slate-200'
            }`}>
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Loading Leaderboard...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className={`p-12 rounded-2xl border flex flex-col items-center justify-center gap-3 text-center ${
              theme === 'dark' ? 'bg-gray-900/30 border-gray-800' : 'bg-white border-slate-200'
            }`}>
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-gray-900 flex items-center justify-center text-gray-400 border border-slate-200 dark:border-gray-800">
                <SearchX size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider mb-1">No Students Found</h3>
                <p className="text-xs text-gray-500 max-w-xs font-medium">Try adjusting your search query or class level filter.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Compact Podium display section (Top 3) */}
              {!searchQuery && podiumUsers.length > 0 && (
                <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/30 border-gray-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="grid grid-cols-3 gap-2 items-end">
                    {/* 2nd place */}
                    {podiumUsers[1] && (
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-2">
                          <Avatar 
                            user={{ name: podiumUsers[1].name, gender: podiumUsers[1].gender, id: podiumUsers[1].id, avatarGradient: podiumUsers[1].avatarGradient }} 
                            className="w-12 h-12 text-sm rounded-full border-2 border-slate-300 shadow-md" 
                          />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-300 border border-white flex items-center justify-center text-[10px] font-black text-slate-800">
                            2
                          </div>
                        </div>
                        <span className={`block font-black text-xs truncate max-w-[90px] ${theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}`}>
                          {podiumUsers[1].name}
                        </span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase">{podiumUsers[1].level}</span>
                        <div className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-gray-800 inline-flex items-center gap-0.5">
                          {podiumUsers[1].points} <Zap size={10} fill="currentColor" />
                        </div>
                      </div>
                    )}

                    {/* 1st place */}
                    {podiumUsers[0] && (
                      <div className="flex flex-col items-center text-center -translate-y-1">
                        <div className="relative mb-2">
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-amber-500">
                            <Trophy size={16} fill="currentColor" />
                          </div>
                          <Avatar 
                            user={{ name: podiumUsers[0].name, gender: podiumUsers[0].gender, id: podiumUsers[0].id, avatarGradient: podiumUsers[0].avatarGradient }} 
                            className="w-14 h-14 text-base rounded-full border-2 border-amber-500 shadow-lg" 
                          />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border border-white flex items-center justify-center text-[10px] font-black text-white">
                            1
                          </div>
                        </div>
                        <span className={`block font-black text-xs truncate max-w-[100px] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {podiumUsers[0].name}
                        </span>
                        <span className="text-[9px] text-amber-500 font-bold uppercase">{podiumUsers[0].level}</span>
                        <div className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 inline-flex items-center gap-0.5">
                          {podiumUsers[0].points} <Zap size={10} fill="currentColor" />
                        </div>
                      </div>
                    )}

                    {/* 3rd place */}
                    {podiumUsers[2] && (
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-2">
                          <Avatar 
                            user={{ name: podiumUsers[2].name, gender: podiumUsers[2].gender, id: podiumUsers[2].id, avatarGradient: podiumUsers[2].avatarGradient }} 
                            className="w-12 h-12 text-sm rounded-full border-2 border-amber-700/60 shadow-md" 
                          />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-700 border border-white flex items-center justify-center text-[10px] font-black text-white">
                            3
                          </div>
                        </div>
                        <span className={`block font-black text-xs truncate max-w-[90px] ${theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}`}>
                          {podiumUsers[2].name}
                        </span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase">{podiumUsers[2].level}</span>
                        <div className="mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-700 dark:text-amber-500 bg-amber-700/10 dark:bg-amber-700/20 inline-flex items-center gap-0.5">
                          {podiumUsers[2].points} <Zap size={10} fill="currentColor" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Main List overall - Scannable & Compact Rows */}
              <div className="space-y-2">
                {filteredUsers.map((u, i) => {
                  const rank = i + 1;
                  const isCurrent = auth.currentUser?.uid === u.id;
                  
                  return (
                    <div
                      key={u.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                        isCurrent 
                          ? (theme === 'dark' ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-100' : 'bg-indigo-50/80 border-indigo-300 text-indigo-950') 
                          : (theme === 'dark' ? 'bg-gray-900/50 border-gray-800 hover:bg-gray-900/80' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm')
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Rank Badge */}
                        <div className="w-6 flex justify-center text-center shrink-0">
                          {rank === 1 ? (
                            <Trophy size={16} className="text-amber-500" fill="currentColor" />
                          ) : rank === 2 ? (
                            <Medal size={16} className="text-slate-400" />
                          ) : rank === 3 ? (
                            <Medal size={16} className="text-amber-700" />
                          ) : (
                            <span className="text-[11px] font-bold text-gray-400">#{rank}</span>
                          )}
                        </div>

                        {/* Avatar */}
                        <Avatar 
                          user={{ name: u.name, gender: u.gender, id: u.id, avatarGradient: u.avatarGradient }} 
                          className="w-9 h-9 text-xs rounded-xl shrink-0" 
                        />

                        {/* Student Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-black truncate max-w-[140px] sm:max-w-[200px] ${isCurrent ? 'text-indigo-400' : (theme === 'dark' ? 'text-gray-100' : 'text-slate-900')}`}>
                              {u.name}
                            </span>
                            {u.isPro && (
                              <span className="text-[8px] bg-amber-500/15 border border-amber-500/30 text-amber-500 font-black px-1.5 py-0.2 rounded uppercase shrink-0">PRO</span>
                            )}
                            {isCurrent && (
                              <span className="text-[8px] bg-indigo-500 text-white font-black px-1.5 py-0.2 rounded uppercase shrink-0">You</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">{u.level}</span>
                            {u.streak ? (
                              <span className="text-[9px] text-amber-500 font-bold flex items-center gap-0.5">
                                <Flame size={10} fill="currentColor" /> {u.streak}d
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Points / XP output */}
                      <div className="text-right shrink-0">
                        <div className="text-xs sm:text-sm font-black flex items-center justify-end gap-1 text-indigo-500 font-mono">
                          {u.points?.toLocaleString()} <Zap size={12} fill="currentColor" />
                        </div>
                        <p className="text-[8px] uppercase font-bold text-gray-400">XP</p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  );
}
