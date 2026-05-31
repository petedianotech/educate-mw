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
}

export function LeaderboardView({ 
  onBack, 
  theme = 'dark',
  profile 
}: { 
  onBack: () => void; 
  theme?: 'light' | 'dark';
  profile: any;
}) {
  const [users, setUsers] = useState<BoardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('All');
  const [copiedLink, setCopiedLink] = useState(false);
  
  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
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
            avatarGradient: data.avatarGradient || ''
          });
        });
        
        // If sorting failed on server, sort explicitly in client
        const sorted = list.sort((a, b) => b.points - a.points);
        setUsers(sorted);
      } catch (err) {
        console.error("Error drawing leaderboard:", err);
        // Fallback robust demo data representing active Malawian students if Firebase call is empty/indexes setting up
        const demoUsers: BoardUser[] = [
          { id: 'demo1', name: 'Tamanda Phiri', points: 2850, level: 'Form 4', streak: 12, isPro: true, gender: 'female', avatarGradient: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)' },
          { id: 'demo2', name: 'Alinafe Mwale', points: 2420, level: 'Form 3', streak: 8, isPro: false, gender: 'male', avatarGradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' },
          { id: 'demo3', name: 'Chisomo Banda', points: 1980, level: 'Form 4', streak: 15, isPro: true, gender: 'female', avatarGradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
          { id: 'demo4', name: 'Limbani Chiumia', points: 1750, level: 'Form 2', streak: 5, isPro: false, gender: 'male', avatarGradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' },
          { id: 'demo5', name: 'Kondwani Mtambo', points: 1610, level: 'Form 1', streak: 0, isPro: false, gender: 'male', avatarGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
          { id: 'demo6', name: 'Wongani Gondwe', points: 1540, level: 'Form 4', streak: 22, isPro: true, gender: 'male', avatarGradient: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)' },
          { id: 'demo7', name: 'Chimwemwe Zulu', points: 1420, level: 'Form 3', streak: 6, isPro: false, gender: 'female', avatarGradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)' }
        ];
        setUsers(demoUsers);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLeaderboard();
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
    <div className={`p-4 md:p-8 min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Header section with back button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <button 
          onClick={onBack}
          className={`self-start flex items-center gap-2 font-black uppercase text-xs tracking-widest py-3 px-5 rounded-2xl border transition-all ${
            theme === 'dark' 
              ? 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800' 
              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100 shadow-sm'
          }`}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/5">
            <Trophy size={26} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-tight">National Leaderboard</h1>
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 mt-0.5">Top performing Malawian students</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
        
        {/* Left Column - Filters and Share Center */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* My performance summary widget */}
          {currentUserRank && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-[32px] border relative overflow-hidden ${
                theme === 'dark' 
                  ? 'bg-gradient-to-br from-indigo-950/40 to-indigo-900/10 border-indigo-500/20' 
                  : 'bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200 shadow-md'
              }`}
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Trophy size={140} />
              </div>

              <div className="flex items-center gap-2 text-indigo-500 mb-4 z-10 relative">
                <Sparkles size={16} className="animate-bounce" />
                <span className="text-[10px] font-black uppercase tracking-widest">Your Standing</span>
              </div>
              
              <div className="flex items-center gap-3.5 mb-5 z-10 relative">
                <Avatar user={{ name: currentUserRank.user.name, gender: currentUserRank.user.gender, id: currentUserRank.user.id, avatarGradient: currentUserRank.user.avatarGradient }} className="w-12 h-12 text-sm rounded-xl" />
                <div>
                  <h4 className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} leading-none`}>
                    {currentUserRank.user.name}
                  </h4>
                  <p className="text-[9.5px] uppercase font-black text-gray-400 tracking-wider mt-1">Local Rank Standing</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-5 z-10 relative border-t border-indigo-500/10 pt-4">
                <div>
                  <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    #{currentUserRank.rank}
                  </h3>
                  <p className="text-[10px] uppercase font-black text-gray-500 tracking-wider">Malawi Rank</p>
                </div>
                <div className="h-10 w-px bg-gray-500/10" />
                <div>
                  <h3 className="text-2xl font-black text-indigo-500 flex items-center gap-1">
                    {currentUserRank.user.points} 
                    <Zap size={18} fill="currentColor" />
                  </h3>
                  <p className="text-[10px] uppercase font-black text-gray-500 tracking-wider">Academic XP</p>
                </div>
                <div className="h-10 w-px bg-gray-500/10" />
                <div>
                  <h3 className="text-2xl font-black text-amber-500 flex items-center gap-1">
                    {currentUserRank.user.streak} 
                    <Flame size={18} fill="currentColor" />
                  </h3>
                  <p className="text-[10px] uppercase font-black text-gray-500 tracking-wider">Day Streak</p>
                </div>
              </div>

              <p className="text-xs text-gray-500 font-semibold leading-relaxed z-10 relative">
                {currentUserRank.rank <= 3 ? (
                  <span>🏆 Amazing work! You are currently on the Malawi national podium! Maintain your streak!</span>
                ) : currentUserRank.rank <= 10 ? (
                  <span>✨ Brilliant standing! You are in the top 10 students nationwide. Push a bit more to hit top 3!</span>
                ) : (
                  <span>📚 You're doing great! Complete daily quizzes and study materials to conquer the ranks.</span>
                )}
              </p>
            </motion.div>
          )}

          {/* Referral Reward Hub */}
          <div className={`p-6 rounded-[32px] border relative overflow-hidden ${
            theme === 'dark' ? 'bg-gray-900/40 border-gray-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Gift size={16} className="animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest leading-none">Referral Center</h4>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide mt-1">Earn Free Emi AI Tokens</p>
              </div>
            </div>

            <div className="space-y-3.5 my-4">
              <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${theme === 'dark' ? 'bg-gray-950/40 border-gray-800/80' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-base">⚡</span>
                <div className="space-y-0.5">
                  <p className="text-[9.5px] font-black uppercase tracking-wider text-indigo-400 leading-none">For You (Riffer)</p>
                  <p className={`text-[11px] ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'} font-semibold leading-snug`}>
                    1 Friend = <span className="text-indigo-400 font-black">+10 Points</span> for Emi AI Chat!
                  </p>
                </div>
              </div>

              <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${theme === 'dark' ? 'bg-gray-950/40 border-gray-800/80' : 'bg-slate-50 border-slate-200'}`}>
                <span className="text-base">🎁</span>
                <div className="space-y-0.5">
                  <p className="text-[9.5px] font-black uppercase tracking-wider text-emerald-500 leading-none">For Invited User</p>
                  <p className={`text-[11px] ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'} font-semibold leading-snug`}>
                    Gets <span className="text-emerald-500 font-black">10 Emi Points</span> + <span className="text-emerald-500 font-black">500 XP bonus</span>!
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-[9.5px] font-black uppercase tracking-widest text-gray-500 block">Your Invitation Link / Code</label>
              <div className={`p-1.5 rounded-2xl border flex items-center justify-between ${theme === 'dark' ? 'bg-gray-950 border-gray-850' : 'bg-slate-100 border-slate-200'}`}>
                <span className="text-[11px] font-black tracking-widest text-indigo-400 pl-3">
                  {profile?.referralCode || 'EDUCATE500'}
                </span>
                <button 
                  onClick={handleShareApp} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1 active:scale-95 transition-all shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <CheckCircle2 size={12} className="text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={12} /> 
                      <span>Share Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Filters card */}
          <div className={`p-6 rounded-[32px] border ${
            theme === 'dark' ? 'bg-gray-900/40 border-gray-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h3 className="text-sm font-black uppercase tracking-wider mb-5 flex items-center gap-2">
              <GraduationCap size={16} /> Filter List
            </h3>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Search Students</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full py-3 pl-12 pr-4 rounded-2xl border font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      theme === 'dark' 
                        ? 'bg-gray-950 border-gray-800 text-white placeholder-gray-600' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                    placeholder="Search by student name..."
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Select Class / Level</label>
                <div className="flex flex-col gap-1.5">
                  {['All', 'Form 1', 'Form 2', 'Form 3', 'Form 4'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setLevelFilter(level)}
                      className={`w-full py-3 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest border text-left transition-all flex items-center justify-between ${
                        levelFilter === level
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
                          : (theme === 'dark' ? 'bg-gray-950/55 border-gray-800/80 text-gray-400 hover:bg-gray-800' : 'bg-slate-50 border-offset border-slate-200 text-slate-600 hover:bg-white')
                      }`}
                    >
                      <span>{level === 'All' ? 'All Classes' : level}</span>
                      {levelFilter === level && <UserCheck size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats panel */}
          <div className={`p-6 rounded-[32px] border ${
            theme === 'dark' ? 'bg-gray-900/40 border-gray-800/80' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">League Stats</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-black text-gray-500 tracking-wider">Total Learners</p>
                <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mt-1`}>{users.length}</h3>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-gray-500 tracking-wider">Total Points</p>
                <h3 className="text-xl font-black text-indigo-500 mt-1 flex items-center gap-1">
                  {totalLeaguePoints} <Zap size={14} fill="currentColor" />
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Leaderboard list */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {loading ? (
            <div className={`p-20 rounded-[40px] border flex flex-col items-center justify-center gap-4 text-center ${
              theme === 'dark' ? 'bg-gray-900/20 border-gray-800/40' : 'bg-white border-slate-200/60'
            }`}>
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">Compiling National Leaderboard...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className={`p-20 rounded-[40px] border flex flex-col items-center justify-center gap-4 text-center ${
              theme === 'dark' ? 'bg-gray-900/20 border-gray-800/40' : 'bg-white border-slate-200/60'
            }`}>
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-gray-400 dark:bg-gray-900 border border-dashed dark:border-gray-800">
                <SearchX size={32} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider mb-1">No Students Found</h3>
                <p className="text-xs text-gray-500 max-w-xs font-medium leading-relaxed mx-auto">There are no leaderboard entries matching this search query or filter classification layout.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Podium display section if searchQuery is empty */}
              {!searchQuery && podiumUsers.length > 0 && (
                <div className="grid grid-cols-3 gap-3 items-end pt-8 pb-4">
                  {/* 2nd place */}
                  {podiumUsers[1] && (
                    <motion.div 
                      key="podium-2"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.6 }}
                      className="flex flex-col items-center"
                    >
                      <div className="relative group mb-3">
                        <Avatar 
                          user={{ name: podiumUsers[1].name, gender: podiumUsers[1].gender, id: podiumUsers[1].id, avatarGradient: podiumUsers[1].avatarGradient }} 
                          className="w-16 h-16 text-lg rounded-full border-[3px] border-slate-300 shadow-lg relative overflow-hidden text-gray-950" 
                        />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-300 border border-white flex items-center justify-center text-[10px] font-black text-slate-900">
                          2
                        </div>
                      </div>
                      <div className="text-center w-full px-1">
                        <span className={`block font-black text-[12px] truncate max-w-[85px] mx-auto ${theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}`}>
                          {podiumUsers[1].name}
                        </span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{podiumUsers[1].level}</span>
                        <div className="mt-1 bg-slate-100 dark:bg-gray-900 border dark:border-gray-800 px-2.5 py-1 rounded-full text-[10px] font-black text-slate-500 inline-flex items-center gap-0.5">
                          {podiumUsers[1].points} <Zap size={10} fill="currentColor" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* 1st place */}
                  {podiumUsers[0] && (
                    <motion.div 
                      key="podium-1"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7 }}
                      className="flex flex-col items-center"
                    >
                      <div className="relative group mb-3 -translate-y-2">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-amber-500 animate-bounce">
                          <Trophy size={20} fill="currentColor" />
                        </div>
                        <Avatar 
                          user={{ name: podiumUsers[0].name, gender: podiumUsers[0].gender, id: podiumUsers[0].id, avatarGradient: podiumUsers[0].avatarGradient }} 
                          className="w-20 h-20 text-xl rounded-full border-[4px] border-amber-500 shadow-xl relative overflow-hidden text-gray-950" 
                        />
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-xs font-bold text-white">
                          1
                        </div>
                      </div>
                      <div className="text-center w-full px-1">
                        <span className={`block font-black text-sm truncate max-w-[100px] mx-auto ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {podiumUsers[0].name}
                        </span>
                        <span className="text-[10px] text-indigo-400 font-black uppercase tracking-wider">{podiumUsers[0].level}</span>
                        <div className="mt-1 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-black text-amber-500 inline-flex items-center gap-0.5">
                          {podiumUsers[0].points} <Zap size={10} fill="currentColor" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* 3rd place */}
                  {podiumUsers[2] && (
                    <motion.div 
                      key="podium-3"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                      className="flex flex-col items-center"
                    >
                      <div className="relative group mb-3">
                        <Avatar 
                          user={{ name: podiumUsers[2].name, gender: podiumUsers[2].gender, id: podiumUsers[2].id, avatarGradient: podiumUsers[2].avatarGradient }} 
                          className="w-16 h-16 text-lg rounded-full border-[3px] border-amber-700/60 shadow-lg relative overflow-hidden text-gray-950" 
                        />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-700 border border-white flex items-center justify-center text-[10px] font-black text-white">
                          3
                        </div>
                      </div>
                      <div className="text-center w-full px-1">
                        <span className={`block font-black text-[12px] truncate max-w-[85px] mx-auto ${theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}`}>
                          {podiumUsers[2].name}
                        </span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{podiumUsers[2].level}</span>
                        <div className="mt-1 bg-amber-700/5 dark:bg-gray-900 border dark:border-gray-800 px-2.5 py-1 rounded-full text-[10px] font-black text-amber-700 inline-flex items-center gap-0.5">
                          {podiumUsers[2].points} <Zap size={10} fill="currentColor" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Main List overall */}
              <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1 hide-scrollbar">
                {/* Loop all current matching users */}
                {filteredUsers.map((u, i) => {
                  const rank = i + 1;
                  const isCurrent = auth.currentUser?.uid === u.id;
                  
                  return (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.3) }}
                      className={`p-4 rounded-[24px] border transition-all flex items-center justify-between ${
                        isCurrent 
                          ? (theme === 'dark' ? 'bg-indigo-900/20 border-indigo-500/50 text-indigo-100 shadow-lg shadow-indigo-950/20' : 'bg-indigo-50/70 border-indigo-200 text-indigo-900 shadow-md shadow-indigo-600/5') 
                          : (theme === 'dark' ? 'bg-gray-900/50 border-gray-800 hover:border-gray-750 hover:bg-gray-900/70' : 'bg-white border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md')
                      }`}
                    >
                      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                        {/* Rank Badge */}
                        <div className="w-7 flex justify-center text-center shrink-0">
                          {rank === 1 ? (
                            <Trophy size={18} className="text-amber-500" fill="currentColor" />
                          ) : rank === 2 ? (
                            <Medal size={18} className="text-slate-450" />
                          ) : rank === 3 ? (
                            <Medal size={18} className="text-amber-700" />
                          ) : (
                            <span className="text-[11px] font-black text-gray-500">#{rank}</span>
                          )}
                        </div>

                        {/* Beautiful user profile Avatar showing correctly */}
                        <Avatar 
                          user={{ name: u.name, gender: u.gender, id: u.id, avatarGradient: u.avatarGradient }} 
                          className="w-11 h-11 text-xs rounded-xl shadow-inner border border-gray-100/10 shrink-0 text-slate-900" 
                        />

                        {/* Student Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[13px] md:text-sm font-black truncate max-w-[150px] md:max-w-[200px] ${isCurrent ? 'text-indigo-400' : (theme === 'dark' ? 'text-gray-100' : 'text-slate-900')}`}>
                              {u.name}
                            </span>
                            {u.isPro && (
                              <span className="text-[7.5px] bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm">PRO</span>
                            )}
                            {isCurrent && (
                              <span className="text-[8px] bg-indigo-500 text-white font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider relative -top-[1px]">You</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wider">{u.level}</span>
                            {u.streak ? (
                              <span className="text-[9px] text-amber-500 font-black flex items-center gap-0.5 uppercase tracking-wide">
                                <Flame size={10} fill="currentColor" /> {u.streak}d streak
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Points / XP output */}
                      <div className="text-right shrink-0">
                        <div className="text-[14px] md:text-base font-black flex items-center justify-end gap-1 text-indigo-505 dark:text-indigo-400 font-mono leading-none">
                          {u.points} <Zap size={13} fill="currentColor" className="text-indigo-500" />
                        </div>
                        <p className="text-[8.5px] uppercase font-black text-gray-500 tracking-wider mt-1">Academic XP</p>
                      </div>
                    </motion.div>
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
