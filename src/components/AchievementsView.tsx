import React from "react";
import { motion } from "motion/react";
import { ChevronLeft, Award, Lock, CheckCircle2 } from "lucide-react";
import { ACHIEVEMENTS, Achievement } from "../data/achievements";

interface AchievementsViewProps {
  onBack: () => void;
  profile: any;
  theme: "light" | "dark";
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  onBack,
  profile,
  theme,
}) => {
  const earnedAchievementIds = profile?.achievements || [];

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col ${theme === "dark" ? "bg-gray-950" : "bg-slate-50"} animate-in slide-in-from-right duration-300`}
    >
      {/* Header */}
      <div
        className={`${theme === "dark" ? "bg-gray-900/90 border-gray-800 text-white" : "bg-white/90 border-slate-200 text-slate-900"} backdrop-blur-xl pt-4 pb-2 px-5 flex items-center shrink-0 z-10 border-b shadow-xl`}
      >
        <button
          onClick={onBack}
          className={`w-10 h-10 ${theme === "dark" ? "bg-gray-800 text-white" : "bg-slate-100 text-slate-700"} rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform`}
        >
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <div className="ml-4">
          <h2
            className={`font-black ${theme === "dark" ? "text-white" : "text-slate-900"} text-lg leading-tight uppercase tracking-tight`}
          >
            Achievements
          </h2>
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">
            Unlock your academic badges
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-32 space-y-8 scroll-smooth">
        {/* Progress Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`${theme === "dark" ? "bg-gray-900/50 border-gray-800" : "bg-white border-slate-200 shadow-sm"} p-4 rounded-3xl border flex flex-col items-center text-center`}>
            <div className="text-3xl font-black text-indigo-500 mb-1">
              {earnedAchievementIds.length}
            </div>
            <div className="text-[9px] uppercase font-black text-gray-500 tracking-widest">
              Badges Earned
            </div>
          </div>
          <div className={`${theme === "dark" ? "bg-gray-900/50 border-gray-800" : "bg-white border-slate-200 shadow-sm"} p-4 rounded-3xl border flex flex-col items-center text-center`}>
            <div className="text-3xl font-black text-emerald-500 mb-1">
              {Math.round((earnedAchievementIds.length / ACHIEVEMENTS.length) * 100)}%
            </div>
            <div className="text-[9px] uppercase font-black text-gray-500 tracking-widest">
              Completion
            </div>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 gap-4">
          {ACHIEVEMENTS.map((achievement) => {
            const isEarned = earnedAchievementIds.includes(achievement.id);
            return (
              <motion.div
                key={achievement.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative overflow-hidden p-5 rounded-[2.5rem] border transition-all ${
                  isEarned
                    ? theme === "dark"
                      ? "bg-gray-900 border-indigo-500/30 shadow-lg shadow-indigo-500/10"
                      : "bg-white border-indigo-200 shadow-xl shadow-indigo-500/5"
                    : theme === "dark"
                    ? "bg-gray-950 border-gray-800 opacity-60"
                    : "bg-slate-50 border-slate-200 opacity-60"
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center p-0.5 bg-gradient-to-br ${achievement.color} shadow-lg relative shrink-0`}>
                    <div className={`${theme === "dark" ? "bg-gray-900" : "bg-white"} w-full h-full rounded-[14px] flex items-center justify-center`}>
                       <achievement.icon size={32} className={isEarned ? `text-transparent bg-clip-text bg-gradient-to-br ${achievement.color}` : "text-gray-400"} />
                    </div>
                    {!isEarned && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
                        <Lock size={20} className="text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-black text-sm uppercase tracking-tight truncate ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                        {achievement.title}
                      </h3>
                      {isEarned && <CheckCircle2 size={14} className="text-emerald-500" />}
                    </div>
                    <p className={`text-[11px] font-medium leading-relaxed ${theme === "dark" ? "text-gray-400" : "text-slate-600"}`}>
                      {achievement.description}
                    </p>
                  </div>
                </div>

                {isEarned && (
                  <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="absolute bottom-10 left-0 right-0 px-8 text-center pointer-events-none">
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === "dark" ? "text-gray-600" : "text-slate-300"}`}>
          Earn badges to boost your rank
        </p>
      </div>
    </div>
  );
};
