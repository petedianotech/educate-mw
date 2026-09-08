import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Sparkles, 
  GraduationCap, 
  BookOpen, 
  Compass,
  Calendar,
  Layers,
  Flame,
  UserCheck
} from 'lucide-react';

export function StudyProgressTracker({
  onBack,
  theme = 'light',
  profile,
  onUpdateProfile
}: {
  onBack: () => void;
  theme?: 'light' | 'dark';
  profile: any;
  onUpdateProfile?: (updated: any) => void;
}) {
  return (
    <div className={`absolute inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-slate-50 text-slate-800'} animate-in slide-in-from-right duration-300`}>
      {/* Header */}
      <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'} border-b flex items-center justify-between py-4 px-6 shrink-0 shadow-sm z-20`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className={`w-10 h-10 rounded-xl ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'} flex items-center justify-center transition-transform active:scale-95`}
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className={`text-lg font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'} uppercase`}>
              Syllabus Tracker
            </h1>
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">
              MSCE Curriculum Map
            </p>
          </div>
        </div>
        
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${theme === 'dark' ? 'bg-indigo-600/10 border-indigo-500/25 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-605'} border text-xs font-black font-mono`}>
          COMING SOON
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-12 flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8">
        
        {/* Animated Icon Ring */}
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-600/20">
            <GraduationCap size={44} className="text-white" strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg animate-bounce">
            <Sparkles size={18} />
          </div>
        </div>

        {/* Content Details */}
        <div className="space-y-4">
          <span className="text-[10px] bg-indigo-550/10 dark:bg-indigo-500/10 text-indigo-500 px-4 py-1.5 rounded-full font-black uppercase tracking-widest border border-indigo-500/20">
            Official MANEB Alignment
          </span>
          <h2 className={`text-3xl md:text-4xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'} leading-none`}>
            Syllabus Tracker is <br/>
            <span className="text-indigo-500 bg-clip-text">Coming Very Soon!</span>
          </h2>
          <p className="text-xs md:text-sm text-gray-500 font-medium leading-relaxed max-w-lg mx-auto">
            We are working directly with Malawi's top secondary school educators to build a fully structured chapter-by-chapter national MSCE syllabus tracking dashboard.
          </p>
        </div>

        {/* Sneak Peek Features List */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-left">
          <div className={`p-4 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900/50 border-gray-805' : 'bg-white border-slate-150 shadow-sm'} flex gap-3 items-start`}>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
              <Layers size={16} />
            </div>
            <div>
              <h4 className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}`}>Form 1 to 4 Progress</h4>
              <p className="text-[10.5px] text-gray-500 mt-1 leading-relaxed">Check off specific core curriculum concepts as they are taught in your classroom.</p>
            </div>
          </div>

          <div className={`p-4 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900/50 border-gray-805' : 'bg-white border-slate-150 shadow-sm'} flex gap-3 items-start`}>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0 mt-0.5">
              <Compass size={16} />
            </div>
            <div>
              <h4 className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}`}>Subject Analytics</h4>
              <p className="text-[10.5px] text-gray-500 mt-1 leading-relaxed">Visually identify and target weak topics in Biology, Math, Agriculture, Physics, and Chemistry.</p>
            </div>
          </div>

          <div className={`p-4 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900/50 border-gray-805' : 'bg-white border-slate-150 shadow-sm'} flex gap-3 items-start`}>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
              <Flame size={16} />
            </div>
            <div>
              <h4 className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}`}>Streaks & Achievements</h4>
              <p className="text-[10.5px] text-gray-500 mt-1 leading-relaxed">Earn points, unlock special badges, and compete with peers on the National Leaderboard.</p>
            </div>
          </div>

          <div className={`p-4 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900/50 border-gray-805' : 'bg-white border-slate-150 shadow-sm'} flex gap-3 items-start`}>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 shrink-0 mt-0.5">
              <Calendar size={16} />
            </div>
            <div>
              <h4 className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}`}>Weekly Focus Guides</h4>
              <p className="text-[10.5px] text-gray-500 mt-1 leading-relaxed font-sans">Receive study recommendation guides created in correspondence with the official academic timeline.</p>
            </div>
          </div>
        </div>

        {/* Back Button Action */}
        <button
          onClick={onBack}
          className="px-8 py-3.5 bg-indigo-650 hover:bg-indigo-600 active:scale-95 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/10 transition-all"
        >
          Return to Dashboard
        </button>

      </div>
    </div>
  );
}
