import { Trophy, Flame, Library, BookOpen, Star, Crown, LucideIcon } from "lucide-react";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  criteria: (profile: any) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_quiz",
    title: "First Quiz Mastered",
    description: "Complete your first quiz with an 80% score or higher.",
    icon: Trophy,
    color: "from-amber-400 to-orange-500",
    criteria: (profile) => (profile.completedQuizzes?.length || 0) >= 1,
  },
  {
    id: "streak_7",
    title: "7-Day Streak",
    description: "Maintain a study streak for 7 consecutive days.",
    icon: Flame,
    color: "from-orange-500 to-red-600",
    criteria: (profile) => (profile.streak || 0) >= 7,
  },
  {
    id: "library_reader",
    title: "Library Reader",
    description: "Explore 5 unique study materials in the library.",
    icon: Library,
    color: "from-blue-400 to-indigo-600",
    criteria: (profile) => (profile.viewedMaterials?.length || 0) >= 5,
  },
  {
    id: "academic_explorer",
    title: "Academic Explorer",
    description: "Complete a total of 5 quizzes.",
    icon: BookOpen,
    color: "from-emerald-400 to-teal-600",
    criteria: (profile) => (profile.completedQuizzes?.length || 0) >= 5,
  },
  {
    id: "perfect_score",
    title: "Perfect Score",
    description: "Get 100% on any quiz.",
    icon: Star,
    color: "from-yellow-300 to-amber-500",
    criteria: (profile) => !!profile.hasPerfectScore,
  },
  {
    id: "loyal_student",
    title: "Loyal Student",
    description: "Reach a 30-day streak.",
    icon: Crown,
    color: "from-purple-500 to-indigo-700",
    criteria: (profile) => (profile.streak || 0) >= 30,
  },
];
