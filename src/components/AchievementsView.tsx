import React from "react";
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

  const getBadgeColors = (id: string, isEarned: boolean) => {
    if (!isEarned) {
      return {
        container: theme === "dark" ? "bg-gray-800 border-gray-700 text-gray-400" : "bg-slate-100 border-slate-200 text-slate-400",
        icon: "text-gray-400",
      };
    }
    switch (id) {
      case "first_quiz":
        return {
          container: "bg-amber-500/15 border-amber-500/30 text-amber-500",
          icon: "text-amber-500",
        };
      case "streak_7":
        return {
          container: "bg-orange-500/15 border-orange-500/30 text-orange-500",
          icon: "text-orange-500",
        };
      case "library_reader":
        return {
          container: "bg-indigo-500/15 border-indigo-500/30 text-indigo-500",
          icon: "text-indigo-500",
        };
      case "academic_explorer":
        return {
          container: "bg-emerald-500/15 border-emerald-500/30 text-emerald-500",
          icon: "text-emerald-500",
        };
      case "perfect_score":
        return {
          container: "bg-yellow-500/15 border-yellow-500/30 text-yellow-500",
          icon: "text-yellow-500",
        };
      case "loyal_student":
        return {
          container: "bg-purple-500/15 border-purple-500/30 text-purple-500",
          icon: "text-purple-500",
        };
      default:
        return {
          container: "bg-indigo-500/15 border-indigo-500/30 text-indigo-500",
          icon: "text-indigo-500",
        };
    }
  };

  const completionPercentage = Math.round(
    (earnedAchievementIds.length / ACHIEVEMENTS.length) * 100
  );

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col ${theme === "dark" ? "bg-gray-950 text-white" : "bg-slate-50 text-slate-900"} animate-in slide-in-from-right duration-300`}
    >
      {/* Header */}
      <div
        className={`${theme === "dark" ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-slate-200 text-slate-900"} pt-4 pb-3 px-5 flex items-center shrink-0 z-10 border-b shadow-sm`}
      >
        <button
          onClick={onBack}
          className={`w-10 h-10 ${theme === "dark" ? "bg-gray-800 text-white" : "bg-slate-100 text-slate-700"} rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform`}
          aria-label="Back"
        >
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <div className="ml-3">
          <h2
            className={`font-black ${theme === "dark" ? "text-white" : "text-slate-900"} text-lg leading-tight uppercase tracking-tight`}
          >
            Achievements
          </h2>
          <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-0.5">
            Academic Milestones & Badges
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-5 pb-28 space-y-5 hide-scrollbar max-w-2xl mx-auto w-full">
        {/* Progress Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200 shadow-sm"} p-4 rounded-2xl border flex flex-col items-center text-center`}
          >
            <div className="text-2xl sm:text-3xl font-black text-indigo-500 mb-0.5">
              {earnedAchievementIds.length} / {ACHIEVEMENTS.length}
            </div>
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Badges Unlocked
            </div>
          </div>

          <div
            className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200 shadow-sm"} p-4 rounded-2xl border flex flex-col items-center text-center`}
          >
            <div className="text-2xl sm:text-3xl font-black text-emerald-500 mb-0.5">
              {completionPercentage}%
            </div>
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Completion Rate
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200 shadow-sm"} p-4 rounded-2xl border`}>
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className={theme === "dark" ? "text-gray-300" : "text-slate-700"}>Overall Badge Progress</span>
            <span className="text-indigo-500 font-mono">{earnedAchievementIds.length} of {ACHIEVEMENTS.length}</span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${theme === "dark" ? "bg-gray-800" : "bg-slate-100"}`}>
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Badges List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className={`font-black text-xs uppercase tracking-wider ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
              All Milestones
            </h3>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              Earn badges by studying
            </span>
          </div>

          <div className="space-y-2.5">
            {ACHIEVEMENTS.map((achievement) => {
              const isEarned = earnedAchievementIds.includes(achievement.id);
              const badgeStyle = getBadgeColors(achievement.id, isEarned);

              return (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                    isEarned
                      ? theme === "dark"
                        ? "bg-gray-900 border-gray-800"
                        : "bg-white border-slate-200 shadow-sm"
                      : theme === "dark"
                      ? "bg-gray-900/40 border-gray-800/60 opacity-60"
                      : "bg-slate-50 border-slate-200 opacity-60"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${badgeStyle.container}`}
                  >
                    {isEarned ? (
                      <achievement.icon size={24} className={badgeStyle.icon} />
                    ) : (
                      <Lock size={18} className="text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4
                        className={`font-black text-xs uppercase tracking-tight truncate ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                      >
                        {achievement.title}
                      </h4>
                      {isEarned ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          <CheckCircle2 size={11} />
                          <span>Unlocked</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-gray-400 bg-gray-500/10 px-1.5 py-0.5 rounded">
                          Locked
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs font-normal leading-relaxed ${theme === "dark" ? "text-gray-400" : "text-slate-600"}`}
                    >
                      {achievement.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
