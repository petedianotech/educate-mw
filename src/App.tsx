/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from "react";
import { GoogleGenAI, Modality } from "@google/genai";
import { motion } from "motion/react";
import SEO from "./components/SEO";
import { BlogView, BlogPostView } from "./components/BlogSystem";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
  serverTimestamp,
  addDoc,
  getDocs,
  orderBy,
  limit,
  deleteDoc,
  getCountFromServer,
  increment,
} from "firebase/firestore";
import {
  auth,
  db,
  googleProvider,
} from "./lib/firebase";
import {
  Avatar,
  getAvatarGradient,
  FEMININE_GRADIENTS,
  MASCULINE_GRADIENTS,
} from "./components/Avatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { EmiVisualizer } from "./components/EmiVisualizer";
import { GroupChat } from "./components/GroupChat";
import { FlashcardsView } from "./components/FlashcardsView";
import { CommunityView } from "./components/CommunityView";
import { CertificatesCleanView } from "./components/CertificatesCleanView";
import { LeaderboardView } from "./components/LeaderboardView";
import { AchievementsView } from "./components/AchievementsView";
import { MscePointsCalculatorView } from "./components/MscePointsCalculatorView";
import { ACHIEVEMENTS } from "./data/achievements";
import { ACADEMIC_DICTIONARY, POPULAR_DICTIONARY_WORDS } from "./data/academicDictionary";
import { DEFAULT_MATERIALS } from "./data/defaultMaterials";
import { DEFAULT_VIDEOS } from "./data/defaultVideos";
import { DEFAULT_QUIZZES } from "./data/defaultQuizzes";
import { CloudinaryUploader } from "./components/CloudinaryUploader";
import { triggerExplicitDownload } from "./lib/cloudinary";
import {
  Menu,
  GraduationCap,
  Flame,
  Bell,
  BellOff,
  ShieldAlert,
  UserCheck,
  UserMinus,
  FilePlus,
  Search,
  Sparkles,
  Bot,
  ArrowRight,
  BookOpen,
  CheckSquare,
  Layers,
  Users,
  BookA,
  Rocket,
  TrendingUp,
  Bookmark,
  Target,
  Hexagon,
  Video,
  Mail,
  Home,
  Book,
  HelpCircle,
  User,
  ChevronRight,
  MessageSquareText,
  Briefcase,
  Compass,
  Battery,
  Wifi,
  Signal,
  Plus,
  Gift,
  Share2,
  Copy,
  ChevronDown,
  PhoneOff,
  ChevronLeft,
  Phone,
  MoreHorizontal,
  FlaskConical,
  Calculator,
  ScrollText,
  Sprout,
  Volume2,
  ThumbsUp,
  ThumbsDown,
  Paperclip,
  Send,
  CheckCheck,
  X,
  Library,
  Download,
  VolumeX,
  Play,
  Mic,
  MicOff,
  MoreVertical,
  Camera,
  Smile,
  BrainCircuit,
  MessageCircle,
  Hash,
  CheckCircle,
  Lock,
  ShieldCheck,
  Smartphone,
  Trophy,
  Star,
  FileText,
  Key,
  Languages,
  LayoutDashboard,
  Eye,
  Settings,
  CreditCard,
  LogOut,
  Sun,
  Moon,
  Trash2,
  Square,
  MessageSquare,
  Pause,
  Clock,
  ArrowLeft,
  Crown,
  CheckCircle2,
  Shield,
  Newspaper,
  Upload,
  FileText as FileIcon,
  Activity,
  Save,
  Award,
} from "lucide-react";

export type ViewState =
  | "home"
  | "emi"
  | "library"
  | "library-item"
  | "dictionary"
  | "quizzes"
  | "flashcards"
  | "community"
  | "profile"
  | "auth"
  | "register"
  | "admin"
  | "quiz-taking"
  | "videos"
  | "terms"
  | "privacy"
  | "subscription"
  | "blog"
  | "blog-post"
  | "local-view"
  | "certificates"
  | "leaderboard"
  | "achievements"
  | "msce-calculator";

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return !!localStorage.getItem("mw_cached_profile_v2");
    } catch {
      return false;
    }
  });
  const [currentView, setCurrentView] = useState<ViewState>("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("mw_theme");
    return (saved as "light" | "dark") || "light";
  });

  useEffect(() => {
    localStorage.setItem("mw_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const verifyCode = urlParams.get("verify");
      const refCode = urlParams.get("ref");
      if (verifyCode) {
        setCurrentView("certificates");
        localStorage.setItem("mw_auto_verify_code", verifyCode);
      }
      if (refCode) {
        localStorage.setItem("mw_referrer_code", refCode.trim().toUpperCase());
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const wasDismissed = localStorage.getItem("mw_install_dismissed_v1");
      if (!wasDismissed) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If already in standalone mode, don't prompt
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;
    if (isStandalone) {
      setShowInstallPrompt(false);
    } else {
      const wasDismissed = localStorage.getItem("mw_install_dismissed_v1");
      if (!wasDismissed) {
        const timer = setTimeout(() => {
          setShowInstallPrompt(true);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handlePwaInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        localStorage.setItem("mw_installed_v1", "true");
      }
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } else {
      alert(
        "To install Educate MW for faster, offline study access:\n\n1. Android: Tap the three dots menu at the top right of your browser and select 'Install app' or 'Add to Home screen'.\n\n2. iOS (Safari): Tap the Share button (square with up arrow) in Safari browser, scroll down, and tap 'Add to Home Screen'.",
      );
      localStorage.setItem("mw_install_dismissed_v1", "true");
      setShowInstallPrompt(false);
    }
  };

  const handlePwaInstallDismiss = () => {
    localStorage.setItem("mw_install_dismissed_v1", "true");
    setShowInstallPrompt(false);
  };

  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("mw_cached_profile_v2");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (userProfile) {
        localStorage.setItem(
          "mw_cached_profile_v2",
          JSON.stringify(userProfile),
        );
      } else {
        localStorage.removeItem("mw_cached_profile_v2");
      }
    } catch (e) {
      console.error("Error writing userprofile cache:", e);
    }
  }, [userProfile]);

  const [isLoading, setIsLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [appSettings, setAppSettings] = useState({
    freeDailyLimit: 10,
    totalApiCalls: 0,
  });
  const [selectedBlogSlug, setSelectedBlogSlug] = useState("");
  const [selectedLibrarySlug, setSelectedLibrarySlug] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const [localFileUrl, setLocalFileUrl] = useState<string | null>(null);
  const [localFileName, setLocalFileName] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizTopic, setQuizTopic] = useState("");

  const adminEmails = ["petedianotech@gmail.com", "mscepreparation@gmail.com"];

  const navigateTo = (view: ViewState, slugOrSearch?: string) => {
    setCurrentView(view);
    if (view === "blog-post" && slugOrSearch) setSelectedBlogSlug(slugOrSearch);
    if (view === "library-item" && slugOrSearch)
      setSelectedLibrarySlug(slugOrSearch);
    if (view === "library" && slugOrSearch) setLibrarySearch(slugOrSearch);
    if (view === "library" && !slugOrSearch) setLibrarySearch("");
    if (view === "local-view" && slugOrSearch) {
      setLocalFileUrl(slugOrSearch);
      setLocalFileName(localFileName || "Offline Document");
    }

    let path = "/";
    switch (view) {
      case "home":
        path = "/";
        break;
      case "blog":
        path = "/blog";
        break;
      case "blog-post":
        path = `/blog/${slugOrSearch}`;
        break;
      case "library":
        path = "/library";
        break;
      case "library-item":
        path = `/library/${slugOrSearch}`;
        break;
      case "terms":
        path = "/terms";
        break;
      case "privacy":
        path = "/privacy";
        break;
      case "emi":
        path = "/emi-ai";
        break;
      case "quizzes":
        path = "/quizzes";
        break;
      case "flashcards":
        path = "/flashcards";
        break;
      case "community":
        path = "/community";
        break;
      case "profile":
        path = "/profile";
        break;
      case "achievements":
        path = "/achievements";
        break;
      case "videos":
        path = "/videos";
        break;
      case "subscription":
        path = "/subscription";
        break;
      default:
        path = `/${view}`;
    }
    window.history.pushState({}, "", path);
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/terms") setCurrentView("terms");
      else if (path === "/privacy") setCurrentView("privacy");
      else if (path === "/blog") setCurrentView("blog");
      else if (path.startsWith("/blog/")) {
        const slug = path.split("/blog/")[1];
        if (slug) {
          setSelectedBlogSlug(slug);
          setCurrentView("blog-post");
        }
      } else if (path === "/library") setCurrentView("library");
      else if (path.startsWith("/library/")) {
        const slug = path.split("/library/")[1];
        if (slug) {
          setSelectedLibrarySlug(slug);
          setCurrentView("library-item");
        }
      } else if (path === "/emi-ai") setCurrentView("emi");
      else if (path === "/quizzes") setCurrentView("quizzes");
      else if (path === "/profile") setCurrentView("profile");
      else if (path === "/achievements") setCurrentView("achievements");
      else if (path === "/") setCurrentView("home");
      else {
        const view = path.substring(1) as ViewState;
        if (view) setCurrentView(view);
      }
    };
    handlePopState();
    window.addEventListener("popstate", handlePopState);

    document.documentElement.classList.toggle("dark", theme === "dark");
    return () => window.removeEventListener("popstate", handlePopState);
  }, [theme]);

  useEffect(() => {
    const unsubSettings = onSnapshot(
      doc(db, "settings", "global"),
      (docSnap) => {
        if (docSnap.exists()) {
          setAppSettings({
            freeDailyLimit: docSnap.data().freeDailyLimit || 10,
            totalApiCalls: docSnap.data().totalApiCalls || 0,
          });
        }
      },
    );

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoggedIn(!!firebaseUser);

      if (firebaseUser) {
        setIsAdmin(adminEmails.includes(firebaseUser.email || ""));

        try {
          // Fetch or Create Profile
          const userRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile(data);

            // Streak Logic
            let newStreak = data.streak || 1;
            let lastActiveMs = 0;
            let referralCode =
              data.referralCode ||
              "MW-" + Math.random().toString(36).substring(2, 8).toUpperCase();

            if (data.lastActive) {
              if (typeof data.lastActive.toDate === "function") {
                lastActiveMs = data.lastActive.toDate().getTime();
              } else if (typeof data.lastActive === "number") {
                lastActiveMs = data.lastActive;
              } else if (data.lastActive.seconds) {
                lastActiveMs = data.lastActive.seconds * 1000;
              }
            }

            if (lastActiveMs > 0) {
              const today = new Date();
              const last = new Date(lastActiveMs);
              const d1 = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
              );
              const d2 = new Date(
                last.getFullYear(),
                last.getMonth(),
                last.getDate(),
              );
              const diffDays = Math.round(
                (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24),
              );

              if (diffDays === 1) {
                newStreak += 1;
              } else if (diffDays > 1) {
                newStreak = 1;
              }
            }

            // Achievement Checks for Streak
            let newAchievements = [...(data.achievements || [])];
            const hasBadge = (id: string) => newAchievements.includes(id);
            if (!hasBadge("streak_7") && newStreak >= 7) {
              newAchievements.push("streak_7");
            }
            if (!hasBadge("loyal_student") && newStreak >= 30) {
              newAchievements.push("loyal_student");
            }

            await updateDoc(userRef, {
              lastActive: serverTimestamp(),
              streak: newStreak,
              referralCode,
              achievements: newAchievements,
            });
            setUserProfile({
              ...data,
              streak: newStreak,
              referralCode,
              achievements: newAchievements,
            });
          } else {
            const gradient = getAvatarGradient("male", firebaseUser.uid);
            const newProfile = {
              name: firebaseUser.displayName || "Student",
              email: firebaseUser.email,
              gender: "male",
              avatarGradient: gradient,
              level: "Form 4",
              points: 500,
              streak: 1,
              lastActive: serverTimestamp(),
              isPro: false,
              role: adminEmails.includes(firebaseUser.email || "")
                ? "admin"
                : "student",
              referralCode:
                "MW-" +
                Math.random().toString(36).substring(2, 8).toUpperCase(),
              createdAt: serverTimestamp(),
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (err: any) {
          if (err?.message?.includes("offline")) {
            console.warn(
              "Profile loading: operating offline. Using cached or default profile.",
            );
          } else {
            console.error("Error loading profile:", err);
          }
          // Always ensure we have a fallback profile to avoid UI break
          setUserProfile({
            name: firebaseUser.displayName || "Student",
            email: firebaseUser.email,
            level: "Form 4",
            points: 0,
            avatarGradient: getAvatarGradient("male", firebaseUser.uid),
          });
        }
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
      setIsAuthChecking(false);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      unsubscribe();
      unsubSettings();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setIsLoggedIn(false);
    navigateTo("home");
  };

  const getSeoData = () => {
    const defaultOgImage =
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&h=630&auto=format&fit=crop";
    switch (currentView) {
      case "emi":
        return {
          title: "Emi AI Tutor - Personal MSCE Study Assistant",
          description:
            "Chat with Emi, the AI tutor trained on the Malawi MSCE curriculum. Get instant answers to complex academic questions.",
          canonical: "https://educatemw.app/emi-ai",
          ogImage: defaultOgImage,
        };
      case "library":
        return {
          title:
            "MSCE Notes Library - Form 1 to 4 Subjects & Biology Notes Malawi",
          description:
            "Download MSCE past papers, Biology form 3 notes, mathematics, agriculture and physics free study notes in Malawi via Educate MW.",
          canonical: "https://educatemw.app/library",
          ogImage: defaultOgImage,
        };
      case "library-item":
        return {
          title: `${selectedLibrarySlug
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")} | MSCE Library`,
          description: "Download or study this MSCE material online.",
          canonical: `https://educatemw.app/library/${selectedLibrarySlug}`,
          ogImage: defaultOgImage,
        };
      case "dictionary":
        return {
          title: "Academic Dictionary - MSCE Terminology",
          description:
            "Look up academic terms and definitions across all MSCE subjects. The ultimate dictionary for Malawian students.",
          canonical: "https://educatemw.app/dictionary",
        };
      case "quizzes":
        return {
          title: "Practice Quizzes - MSCE Exam Prep Malawi",
          description:
            "Test your knowledge with MSCE-style quizzes. Instant feedback and detailed explanations for all subjects.",
          canonical: "https://educatemw.app/quizzes",
        };
      case "community":
        return {
          title: "Student Community - Connect with Malawian Students",
          description:
            "Join the community of Malawian students. Share notes, ask questions, and grow together.",
          canonical: "https://educatemw.app/community",
        };
      case "blog":
        return {
          title: "Educate MW Blog - Malawi Education News & Study Tips",
          description:
            "The latest news about the Malawi curriculum, MSCE study tips, and educational technology in Malawi.",
          canonical: "https://educatemw.app/blog",
        };
      case "blog-post":
        return {
          title: `${selectedBlogSlug
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")} | Educate MW`,
          description: "Read the latest article on our education blog.",
          canonical: `https://educatemw.app/blog/${selectedBlogSlug}`,
        };
      case "msce-calculator":
        return {
          title: "MSCE Points Calculator & University Course Recommendations Malawi",
          description:
            "Calculate your MANEB MSCE points, explore university courses at UNIMA, MUBAS, MUST, KUHeS, LUANAR, MZUNI, and simulate target grades.",
          canonical: "https://educatemw.app/msce-calculator",
        };
      default:
        return {
          title: "Educate MW - Free MSCE Notes & AI Tutor Malawi",
          description:
            "The ultimate MSCE learning app for Malawi. Free notes, AI tutor, quizzes, and career guidance.",
          canonical: "https://educatemw.app",
        };
    }
  };

  const seoData = getSeoData();

  if (isAuthChecking && !userProfile) {
    return <EmiLoader text="Initializing Emi AI..." theme={theme} />;
  }

  return (
    <div
      className={`${theme === "dark" ? "bg-gray-950 text-gray-100" : "bg-slate-50 text-slate-930"} min-h-screen font-sans selection:bg-indigo-900/30 selection:text-indigo-100`}
    >
      <SEO {...seoData} />
      <div
        className={`w-full h-[100dvh] ${theme === "dark" ? "bg-gray-900" : "bg-white"} relative overflow-hidden flex flex-col`}
      >
        {!isOnline && (
          <div className="absolute top-0 left-0 right-0 z-[110] bg-amber-500 text-gray-950 text-[10px] font-black py-1 px-4 text-center uppercase tracking-widest flex items-center justify-center gap-2">
            <Wifi size={12} strokeWidth={3} /> Offline Mode Active
          </div>
        )}

        {/* Scrollable Main Content */}
        <div
          className={`flex-1 overflow-x-hidden overflow-y-auto hide-scrollbar ${theme === "dark" ? "bg-gray-950" : "bg-slate-50"}`}
        >
          {currentView === "terms" ? (
            <LegalPageView
              type="terms"
              theme={theme}
              onBack={() => navigateTo("home")}
            />
          ) : currentView === "privacy" ? (
            <LegalPageView
              type="privacy"
              theme={theme}
              onBack={() => navigateTo("home")}
            />
          ) : currentView === "videos" ? (
            <VideosView theme={theme} onBack={() => navigateTo("home")} />
          ) : !isLoggedIn ? (
            currentView === "register" ? (
              <RegisterView onBack={() => navigateTo("home")} theme={theme} />
            ) : (
              <AuthView
                onNavigateRegister={() => navigateTo("register")}
                onNavigateTerms={() => navigateTo("terms")}
                onNavigatePrivacy={() => navigateTo("privacy")}
                theme={theme}
              />
            )
          ) : (
            <>
              {currentView === "home" && (
                <HomeView
                  onNavigate={navigateTo}
                  onMenuClick={() => setIsSidebarOpen(true)}
                  profile={userProfile}
                  onShowNotifications={() => setShowNotifications(true)}
                  onOpenSettings={() => setShowSettings(true)}
                  theme={theme}
                  onThemeToggle={() =>
                    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
                  }
                />
              )}
              {currentView === "emi" && (
                <EmiChatView
                  onBack={() => navigateTo("home")}
                  theme={theme}
                  profile={userProfile}
                  appSettings={appSettings}
                  onUpdateProfile={setUserProfile}
                  onGoPro={() => navigateTo("subscription")}
                />
              )}
              {currentView === "subscription" && (
                <SubscriptionView
                  profile={userProfile}
                  theme={theme}
                  onBack={() => navigateTo("home")}
                />
              )}
              {currentView === "library" && (
                <LibraryView
                  onBack={() => navigateTo("home")}
                  theme={theme}
                  onSelectItem={(slug) => navigateTo("library-item", slug)}
                  onSelectLocalFile={(url, name) => {
                    setLocalFileName(name);
                    navigateTo("local-view", url);
                  }}
                  initialSearch={librarySearch}
                />
              )}
              {currentView === "library-item" && (
                <MaterialDetailView
                  slug={selectedLibrarySlug}
                  onBack={() => navigateTo("library")}
                  theme={theme}
                  profile={userProfile}
                  onUpdateProfile={setUserProfile}
                  onOpenPdf={(url, title) => {
                    setLocalFileName(title);
                    setLocalFileUrl(url);
                    navigateTo("local-view");
                  }}
                />
              )}
              {currentView === "local-view" && (
                <LocalMaterialView
                  url={localFileUrl || ""}
                  title={localFileName}
                  onBack={() => navigateTo("library")}
                  theme={theme}
                />
              )}
              {currentView === "dictionary" && (
                <DictionaryView
                  onBack={() => navigateTo("home")}
                  theme={theme}
                />
              )}
              {currentView === "quizzes" && (
                <QuizzesView
                  onBack={() => navigateTo("home")}
                  theme={theme}
                  onStartQuiz={(questions, topic) => {
                    setQuizQuestions(questions);
                    setQuizTopic(topic);
                    navigateTo("quiz-taking");
                  }}
                />
              )}
              {currentView === "quiz-taking" && (
                <QuizTakingView
                  questions={quizQuestions}
                  topic={quizTopic}
                  onEnd={() => navigateTo("quizzes")}
                  theme={theme}
                  profile={userProfile}
                  onUpdateProfile={setUserProfile}
                />
              )}
              {currentView === "flashcards" && (
                <FlashcardsView
                  onBack={() => navigateTo("home")}
                  theme={theme}
                />
              )}
              {currentView === "certificates" && (
                <CertificatesCleanView
                  onBack={() => navigateTo("home")}
                  theme={theme}
                  profile={userProfile}
                  onUpdateProfile={setUserProfile}
                />
              )}
              {currentView === "leaderboard" && (
                <LeaderboardView
                  onBack={() => navigateTo("home")}
                  theme={theme}
                  profile={userProfile}
                />
              )}
              {currentView === "msce-calculator" && (
                <MscePointsCalculatorView
                  onBack={() => navigateTo("home")}
                  theme={theme}
                  profile={userProfile}
                  onUpdateProfile={setUserProfile}
                />
              )}
              {currentView === "community" && (
                <CommunityView
                  onBack={() => navigateTo("home")}
                  theme={theme}
                />
              )}
              {currentView === "achievements" && (
                <AchievementsView
                  onBack={() => navigateTo("profile")}
                  theme={theme}
                  profile={userProfile}
                />
              )}
              {currentView === "blog" && (
                <BlogView
                  onBack={() => navigateTo("home")}
                  theme={theme}
                  onPostClick={(slug) => navigateTo("blog-post", slug)}
                />
              )}
              {currentView === "blog-post" && (
                <BlogPostView
                  slug={selectedBlogSlug}
                  onBack={() => navigateTo("blog")}
                  theme={theme}
                  onPostClick={(slug) => navigateTo("blog-post", slug)}
                />
              )}
              {currentView === "admin" && isAdmin && (
                <AdminDashboard
                  onBack={() => navigateTo("home")}
                  theme={theme}
                />
              )}
              {currentView === "profile" && (
                <ProfileView
                  onBack={() => navigateTo("home")}
                  profile={userProfile}
                  onUpdate={async (newProfile: any) => {
                    if (user) {
                      const userRef = doc(db, "users", user.uid);
                      try {
                        await setDoc(userRef, newProfile, { merge: true });
                        setUserProfile((prev) => ({ ...prev, ...newProfile }));
                      } catch (err) {
                        console.error("Profile update failed:", err);
                      }
                    }
                  }}
                  onLogout={handleLogout}
                  theme={theme}
                  onThemeToggle={() =>
                    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
                  }
                  onShowNotifications={() => setShowNotifications(true)}
                  onNavigate={navigateTo}
                  onShowSettings={() => setShowSettings(true)}
                  isAdmin={isAdmin}
                />
              )}
            </>
          )}
        </div>

        {/* Bottom Navigation */}
        {isLoggedIn &&
          ![
            "emi",
            "dictionary",
            "flashcards",
            "community",
            "admin",
            "terms",
            "privacy",
            "videos",
            "certificates",
            "leaderboard",
            "msce-calculator",
          ].includes(currentView) && (
            <div
              className={`absolute bottom-0 w-full left-0 right-0 z-[60] ${theme === "dark" ? "bg-gray-950 border-gray-900" : "bg-white border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"} border-t pb-safe pt-2 px-1`}
            >
              <div className="flex justify-around items-center w-full max-w-2xl mx-auto">
                <NavItem
                  icon={
                    <Home
                      size={26}
                      fill={currentView === "home" ? "currentColor" : "none"}
                    />
                  }
                  label="Home"
                  active={currentView === "home"}
                  onClick={() => navigateTo("home")}
                  theme={theme}
                />
                <NavItem
                  icon={
                    <Book
                      size={26}
                      fill={currentView === "library" ? "currentColor" : "none"}
                    />
                  }
                  label="Library"
                  active={currentView === "library"}
                  onClick={() => navigateTo("library")}
                  theme={theme}
                />

                <div
                  className="flex flex-col items-center justify-center w-14 cursor-pointer pt-1 transition-all active:scale-95 group"
                  onClick={() => navigateTo("emi")}
                >
                  <div
                    className={`mb-0.5 p-0.5 rounded-full border-2 ${currentView === "emi" ? (theme === "dark" ? "border-white" : "border-indigo-600") : "border-transparent"}`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm bg-indigo-500/10">
                      <img
                        src="https://i.ibb.co/cS5rBBny/emi-AI-logo.png"
                        alt="Emi"
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                  </div>
                  <span
                    className={`text-[8px] font-black tracking-widest uppercase transition-colors duration-200 ${currentView === "emi" ? (theme === "dark" ? "text-white" : "text-indigo-600") : "text-gray-500 group-hover:text-gray-300"}`}
                  >
                    Emi AI
                  </span>
                </div>

                <NavItem
                  icon={
                    <CheckSquare
                      size={26}
                      fill={currentView === "quizzes" ? "currentColor" : "none"}
                    />
                  }
                  label="Quizzes"
                  active={currentView === "quizzes"}
                  onClick={() => navigateTo("quizzes")}
                  theme={theme}
                />
                <NavItem
                  icon={
                    <User
                      size={26}
                      fill={currentView === "profile" ? "currentColor" : "none"}
                    />
                  }
                  label="Profile"
                  active={currentView === "profile"}
                  onClick={() => navigateTo("profile")}
                  theme={theme}
                />
              </div>
            </div>
          )}

        {/* Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="absolute inset-0 z-[100] flex">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Sidebar Content */}
            <div
              className={`relative w-[75%] max-w-[280px] ${theme === "dark" ? "bg-gray-900 border-r border-gray-800" : "bg-white border-r border-slate-200"} h-full flex flex-col shadow-2xl animate-in slide-in-from-left z-[100] duration-300`}
            >
              {/* User Header in Sidebar */}
              <div
                className={`${theme === "dark" ? "bg-indigo-600/10 border-gray-800" : "bg-indigo-50 border-slate-200"} p-3 pt-6 border-b flex items-center gap-3`}
              >
                <div
                  className={`w-12 h-12 rounded-xl border ${theme === "dark" ? "border-gray-700" : "border-indigo-200"} shadow-md`}
                >
                  <Avatar
                    user={userProfile}
                    className="w-full h-full text-xl"
                  />
                </div>
                <div>
                  <h3
                    className={`font-black text-lg leading-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                  >
                    {userProfile?.name || "Student"}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`w-2 h-2 rounded-full shadow-lg ${isOnline ? "bg-emerald-500 shadow-emerald-500/50" : "bg-amber-500 shadow-amber-500/50"}`}
                    ></span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col">
                <SidebarItem
                  theme={theme}
                  icon={
                    <Calculator
                      size={20}
                      className="text-indigo-400"
                      strokeWidth={2.5}
                    />
                  }
                  label="MSCE Points Calculator"
                  onClick={() => {
                    navigateTo("msce-calculator");
                    setIsSidebarOpen(false);
                  }}
                  active={currentView === "msce-calculator"}
                />
                <SidebarItem
                  theme={theme}
                  icon={
                    <CreditCard
                      size={20}
                      className="text-indigo-400"
                      strokeWidth={2.5}
                    />
                  }
                  label="MSCE Pro Access"
                  onClick={() => {
                    navigateTo("subscription");
                    setIsSidebarOpen(false);
                  }}
                  active={currentView === "subscription"}
                />
                <SidebarItem
                  theme={theme}
                  icon={
                    <BookOpen
                      size={20}
                      className="text-emerald-400"
                      strokeWidth={2.5}
                    />
                  }
                  label="Blog"
                  onClick={() => {
                    navigateTo("blog");
                    setIsSidebarOpen(false);
                  }}
                  active={currentView === "blog"}
                />
                <SidebarItem
                  theme={theme}
                  icon={
                    <Award
                      size={20}
                      className="text-amber-500"
                      strokeWidth={2.5}
                    />
                  }
                  label="Certificates"
                  onClick={() => {
                    navigateTo("certificates");
                    setIsSidebarOpen(false);
                  }}
                  active={currentView === "certificates"}
                />
                <SidebarItem
                  theme={theme}
                  icon={
                    <Trophy
                      size={20}
                      className="text-amber-500"
                      strokeWidth={2.5}
                    />
                  }
                  label="Leaderboard"
                  onClick={() => {
                    navigateTo("leaderboard");
                    setIsSidebarOpen(false);
                  }}
                  active={currentView === "leaderboard"}
                />

                {isAdmin && (
                  <SidebarItem
                    theme={theme}
                    icon={
                      <LayoutDashboard
                        size={20}
                        className="text-amber-500"
                        strokeWidth={2.5}
                      />
                    }
                    label="Admin"
                    onClick={() => {
                      navigateTo("admin");
                      setIsSidebarOpen(false);
                    }}
                    active={currentView === "admin"}
                  />
                )}

                <div className="flex-1" />

                <SidebarItem
                  theme={theme}
                  icon={<Settings size={20} />}
                  label="App Settings"
                  onClick={() => {
                    setShowSettings(true);
                    setIsSidebarOpen(false);
                  }}
                />
              </div>

              <div
                className={`p-4 border-t ${theme === "dark" ? "border-gray-800" : "border-slate-200"} mt-auto`}
              >
                <div
                  className={`${theme === "dark" ? "bg-indigo-600/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-100 shadow-sm"} p-4 rounded-2xl border flex flex-col gap-3`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                      <Crown size={16} fill="currentColor" fillOpacity={0.2} />
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`text-[13px] font-black tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                      >
                        Educate MW Pro
                      </span>
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                        Upgrade Account
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentView("subscription");
                      setIsSidebarOpen(false);
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <NotificationsModal
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          theme={theme}
        />

        <AppSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          theme={theme}
          onThemeToggle={() =>
            setTheme((prev) => (prev === "dark" ? "light" : "dark"))
          }
        />

        {showInstallPrompt && (
          <PwaInstallPrompt
            onInstall={handlePwaInstallClick}
            onDismiss={handlePwaInstallDismiss}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  onClick,
  active,
  theme,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  theme: "light" | "dark";
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-[15px] transition-colors ${active ? (theme === "dark" ? "bg-indigo-900/50 text-indigo-400" : "bg-indigo-100 text-indigo-600") : theme === "dark" ? "text-gray-300 hover:bg-gray-800" : "text-slate-700 hover:bg-slate-100"}`}
    >
      <span
        className={
          active
            ? theme === "dark"
              ? "text-indigo-400"
              : "text-indigo-600"
            : theme === "dark"
              ? "text-gray-400"
              : "text-slate-500"
        }
      >
        {icon}
      </span>
      {label}
    </button>
  );
}

function HomeView({
  onNavigate,
  onMenuClick,
  profile,
  onShowNotifications,
  onOpenSettings,
  theme,
  onThemeToggle,
}: {
  onNavigate: (view: ViewState, search?: string) => void;
  onMenuClick: () => void;
  profile: any;
  onShowNotifications: () => void;
  onOpenSettings?: () => void;
  theme: "light" | "dark";
  onThemeToggle: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate("library", searchQuery);
    }
  };

  return (
    <div
      className={`flex flex-col h-full ${theme === "dark" ? "bg-gray-950" : "bg-slate-50"} overflow-hidden relative`}
    >
      {/* Fixed Sticky Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 ${theme === "dark" ? "bg-gray-950/90" : "bg-white/90"} backdrop-blur-2xl border-b ${theme === "dark" ? "border-white/5" : "border-slate-200"}`}
      >
        <div className="pt-3.5 pb-2 px-3 sm:px-5 max-w-7xl mx-auto">
          <div className="flex justify-between items-center w-full relative">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={onMenuClick}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center ${theme === "dark" ? "bg-gray-900 border-gray-800 text-gray-400 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900"} active:scale-95 transition-all shadow-sm border`}
              >
                <Menu size={19} strokeWidth={2.5} />
              </button>

              <div 
                onClick={() => onNavigate("home")} 
                className="flex items-center gap-2 sm:gap-2.5 cursor-pointer logo-container group select-none"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shadow-sm shadow-blue-600/20 border border-blue-500/30 bg-blue-600 p-0.5 flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95">
                  <img
                    src="/app-icon.jpg"
                    alt="Educate MW"
                    className="w-full h-full object-cover rounded-[9px]"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span
                  className={`font-black text-base sm:text-lg tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                >
                  Educate
                  <span className="text-blue-600 font-bold opacity-90 pl-0.5">
                    MW
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <button
                onClick={onThemeToggle}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center ${theme === "dark" ? "bg-gray-900 border-gray-800 text-yellow-400 hover:text-yellow-300" : "bg-slate-50 border-slate-200 text-indigo-600 hover:text-indigo-700"} active:scale-95 transition-all shadow-sm border`}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={onShowNotifications}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center ${theme === "dark" ? "bg-gray-900 border-gray-800 text-gray-400 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900"} active:scale-95 transition-all shadow-sm border relative`}
              >
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full border border-white dark:border-gray-950 animate-pulse"></span>
              </button>
              <button
                onClick={() => onNavigate("profile")}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] p-0.5 ${theme === "dark" ? "bg-gray-800 hover:bg-blue-600" : "bg-slate-200 hover:bg-blue-500"} active:scale-95 transition-all`}
              >
                <Avatar
                  user={profile}
                  className={`w-full h-full text-[11px] rounded-[11px] border-2 ${theme === "dark" ? "border-gray-950" : "border-white"} shadow-inner`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-5 pt-24 pb-24 hide-scrollbar">
        <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Left Column (Search + Hero) */}
          <div className="flex-1 w-full max-w-lg mx-auto lg:max-w-none lg:mx-0 flex flex-col">
            {/* Search */}
            <div className="mb-6 animate-in fade-in slide-in-from-top-6 duration-600">
              <form
                onSubmit={handleSearch}
                className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200 shadow-sm"} rounded-2xl px-5 py-3.5 flex items-center border group focus-within:border-indigo-500/50 transition-all shadow-sm`}
              >
                <Search
                  className="text-gray-500 mr-3 group-focus-within:text-indigo-500 transition-colors"
                  size={18}
                  strokeWidth={3}
                />
                <input
                  type="text"
                  placeholder="Search topics, notes, tutors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`bg-transparent outline-none flex-1 ${theme === "dark" ? "text-white" : "text-slate-900"} text-sm font-medium placeholder-gray-500`}
                />
              </form>
            </div>

            {/* Hero Banner */}
            <div className="w-full flex-1 max-h-[140px] bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden mb-6 lg:mb-0 shadow-lg shadow-indigo-900/30 flex flex-col justify-center">
              {/* Animated bg elements */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/10 rounded-full blur-2xl -ml-12 -mb-12"></div>

              <div className="z-10 relative">
                <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-1.5 py-0.5 rounded flex-row mb-1.5 border border-white/10 shadow-sm">
                  <Sparkles
                    size={8}
                    className="text-indigo-200"
                    fill="currentColor"
                  />
                  <span className="text-[8px] font-black uppercase tracking-widest leading-none">
                    Powered by AI
                  </span>
                </div>
                <h3 className="font-black text-lg sm:text-xl mb-0.5 flex items-center gap-2 tracking-tight">
                  Learn with Emi AI
                </h3>
                <p className="text-indigo-100/90 text-[10px] sm:text-[11px] font-medium leading-relaxed max-w-[160px] sm:max-w-[180px] mb-3 leading-tight">
                  Your personal MSCE tutor for instant expert explanations.
                </p>
                <button
                  onClick={() => onNavigate("emi")}
                  className="bg-white text-indigo-700 font-bold text-[10px] sm:text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 shadow-md shadow-indigo-950/20 active:scale-95 transition-all w-fit group"
                >
                  Chat with Emi
                  <ArrowRight
                    size={12}
                    className="group-hover:translate-x-1 transition-transform"
                    strokeWidth={2.5}
                  />
                </button>
              </div>

              {/* Avatar Composition with Blending */}
              <div className="absolute -right-4 -bottom-4 w-40 h-40 z-0 pointer-events-none hidden sm:block md:w-48 md:h-48">
                <div className="relative w-full h-full">
                  <img
                    src="https://i.ibb.co/cS5rBBny/emi-AI-logo.png"
                    alt="Emi AI"
                    className="w-full h-full object-contain"
                  />
                  {/* Gradient masks to blend square edges */}
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-800/80 via-transparent to-transparent"></div>
                </div>
              </div>
              <div className="absolute -right-2 -bottom-2 w-32 h-32 z-0 pointer-events-none sm:hidden">
                <div className="relative w-full h-full">
                  <img
                    src="https://i.ibb.co/cS5rBBny/emi-AI-logo.png"
                    alt="Emi AI"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-800/80 via-transparent to-transparent"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Grid Menu) */}
          <div className="flex-[0.8] w-full max-w-lg mx-auto lg:max-w-none lg:mx-0 pt-0 lg:pt-2">
            {/* Grid Menu */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 content-start shrink-0 mb-8">
              <FeatureCard
                theme={theme}
                icon={
                  <BookOpen size={20} fill="white" className="text-blue-50" />
                }
                bgColor="bg-blue-500"
                title="Library"
                onClick={() => onNavigate("library")}
              />
              <FeatureCard
                theme={theme}
                icon={
                  <CheckSquare
                    size={20}
                    fill="white"
                    className="text-emerald-50"
                  />
                }
                bgColor="bg-emerald-500"
                title="Quizzes"
                onClick={() => onNavigate("quizzes")}
              />
              <FeatureCard
                theme={theme}
                icon={
                  <Layers
                    size={20}
                    fill="white"
                    className="text-orange-50"
                    strokeWidth={1}
                  />
                }
                bgColor="bg-orange-500"
                title="Flashcards"
                onClick={() => onNavigate("flashcards")}
              />
              <FeatureCard
                theme={theme}
                icon={<Users size={20} fill="white" className="text-teal-50" />}
                bgColor="bg-teal-500"
                title="Community"
                onClick={() => onNavigate("community")}
              />
              <FeatureCard
                theme={theme}
                icon={
                  <BookA size={20} fill="white" className="text-purple-50" />
                }
                bgColor="bg-purple-500"
                title="Dictionary"
                onClick={() => onNavigate("dictionary")}
              />
              <FeatureCard
                theme={theme}
                icon={<Video size={20} fill="white" className="text-blue-50" />}
                bgColor="bg-blue-600"
                title="Videos"
                onClick={() => onNavigate("videos")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlogPreviewCard({
  title,
  category,
  image,
  onClick,
  theme,
}: {
  title: string;
  category: string;
  image: string;
  onClick: () => void;
  theme: "light" | "dark";
}) {
  return (
    <button
      onClick={onClick}
      className={`min-w-[200px] w-[200px] aspect-[4/5] rounded-[24px] overflow-hidden relative group active:scale-95 transition-all ${theme === "dark" ? "bg-gray-900" : "bg-white shadow-sm"} border ${theme === "dark" ? "border-gray-800" : "border-slate-100"}`}
    >
      <img
        src={image}
        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-500"
        alt={title}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-4 text-left">
        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 mb-2 inline-block">
          {category}
        </span>
        <h4 className="text-white font-black text-sm leading-tight line-clamp-2">
          {title}
        </h4>
      </div>
    </button>
  );
}

type Message = {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
};

const initialMessages: Message[] = [
  {
    id: "1",
    sender: "user",
    text: "Explain Newton's First Law of Motion with an example.",
    timestamp: "9:40 AM",
  },
  {
    id: "2",
    sender: "ai",
    text: "Newton's First Law of Motion states that an object at rest stays at rest, and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an external force.\n\nExample: When you are sitting in a moving car, if the car suddenly stops, your body tends to keep moving forward due to inertia.",
    timestamp: "9:42 AM",
  },
];

function EmiChatView({
  onBack,
  theme,
  profile,
  appSettings,
  onUpdateProfile,
  onGoPro,
}: {
  onBack: () => void;
  theme: "light" | "dark";
  profile: any;
  appSettings: { freeDailyLimit: number };
  onUpdateProfile: (p: any) => void;
  onGoPro: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(
        `mw_emi_chat_${profile?.uid || "guest"}`,
      );
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        `mw_emi_chat_${profile?.uid || "guest"}`,
        JSON.stringify(messages),
      );
    } catch (e) {}
  }, [messages, profile?.uid]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const [loadingStatus, setLoadingStatus] = useState("Emi is thinking...");
  const [isCalling, setIsCalling] = useState(false);
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackMsgId, setFeedbackMsgId] = useState("");
  const [feedbackType, setFeedbackType] = useState<"positive" | "negative">(
    "positive",
  );
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const chatBubbles = useMemo(() => {
    return messages.map((msg) => (
      <div
        key={msg.id}
        className={`flex ${msg.sender === "user" ? "justify-end" : "w-full"}`}
      >
        <div
          className={`${msg.sender === "user" ? "max-w-[85%]" : "w-full"} relative group`}
        >
          {msg.sender === "user" ? (
            <div
              className={`p-4 shadow-sm relative bg-indigo-600 text-white rounded-2xl rounded-tr-sm font-medium`}
            >
              <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap text-white">
                {msg.text}
              </p>
              <div className="flex items-center gap-1.5 mt-2 justify-end text-white/70 text-[10px] font-bold">
                <span>{msg.timestamp}</span>
                <CheckCheck size={10} strokeWidth={3} />
              </div>
            </div>
          ) : (
            <div
              className={`p-5 md:p-6 shadow-sm relative ${theme === "dark" ? "bg-gray-950 border-y border-gray-900 text-gray-200" : "bg-white border-y border-slate-200 text-slate-800"} -mx-5 md:mx-0 md:rounded-3xl md:border font-medium`}
            >
              {/* Elegant Header Inside Full-Width Card */}
              <div className="flex items-center justify-between mb-4 border-b pb-3 border-slate-100 dark:border-gray-900/50">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full ${theme === "dark" ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-200"} border flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative`}
                  >
                    <img
                      src="https://i.ibb.co/cS5rBBny/emi-AI-logo.png"
                      alt="Emi"
                      className="w-full h-full object-contain p-0.5"
                    />
                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-white dark:border-gray-950 rounded-full animate-ping pointer-events-none" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[12px] font-black uppercase tracking-wider ${theme === "dark" ? "text-indigo-400" : "text-indigo-600"}`}
                      >
                        Emi AI
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    </div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wide">
                      Secondary School Guide
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakText(msg.text, msg.id);
                    }}
                    className={`w-8 h-8 rounded-full flex justify-center items-center ${activeSpeechId === msg.id ? "bg-red-500 text-white animate-pulse" : theme === "dark" ? "bg-indigo-900/50 text-indigo-400 hover:bg-indigo-900/80" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"} transition-colors`}
                    title={
                      activeSpeechId === msg.id ? "Stop voice" : "Read aloud"
                    }
                  >
                    {activeSpeechId === msg.id ? (
                      <Pause size={14} />
                    ) : (
                      <Volume2 size={14} />
                    )}
                  </button>
                  <span className="text-[10px] text-gray-500 font-bold">
                    {msg.timestamp}
                  </span>
                </div>
              </div>

              <div
                className={`prose prose-sm max-w-none ${theme === "dark" ? "prose-invert prose-p:text-gray-200" : "prose-p:text-slate-800"} prose-pre:bg-gray-950 prose-pre:border prose-pre:border-gray-900/80`}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      const childStr = String(children).replace(/\n$/, "");

                      if (match) {
                        const lang = match[1].toLowerCase();
                        const isVisual = [
                          "plot",
                          "graph",
                          "geom",
                          "shape",
                          "cube",
                          "sphere",
                          "tess",
                          "poly",
                        ].some((x) => lang.includes(x));
                        if (isVisual) {
                          return (
                            <EmiVisualizer
                              code={childStr}
                              language={lang}
                              theme={theme}
                            />
                          );
                        }
                      }

                      const isInline = !className;
                      if (isInline) {
                        return (
                          <code
                            className="bg-slate-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-[13px] font-mono font-bold text-indigo-500 dark:text-indigo-400"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      }
                      return (
                        <pre className="p-4 bg-gray-950 text-indigo-300 rounded-2xl overflow-x-auto text-xs font-mono my-3 shadow-md border border-gray-100 dark:border-gray-900/50">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      );
                    },
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>

              <div className="flex gap-4 mt-4 border-t pt-3 border-slate-100 dark:border-gray-900/40 opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(msg.text, msg.id);
                  }}
                  className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${copiedId === msg.id ? "text-emerald-500" : "text-gray-400 hover:text-indigo-400"}`}
                >
                  {copiedId === msg.id ? (
                    <>
                      <CheckCircle size={14} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={12} /> Copy
                    </>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openFeedback(msg.id, "positive");
                  }}
                  className="text-gray-400 hover:text-emerald-500 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase"
                >
                  <ThumbsUp size={12} /> Helpful
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openFeedback(msg.id, "negative");
                  }}
                  className="text-gray-400 hover:text-rose-500 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase"
                >
                  <ThumbsDown size={12} /> Issue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    ));
  }, [messages, theme, activeSpeechId, copiedId]);

  const openFeedback = (msgId: string, type: "positive" | "negative") => {
    setFeedbackMsgId(msgId);
    setFeedbackType(type);
    setFeedbackText("");
    setFeedbackModalOpen(true);
  };

  const submitFeedback = async () => {
    if (!feedbackMsgId) return;
    setSubmittingFeedback(true);
    try {
      const msgIndex = messages.findIndex((m) => m.id === feedbackMsgId);
      if (msgIndex === -1) return;
      const msg = messages[msgIndex];
      let prompt = "";
      for (let i = msgIndex - 1; i >= 0; i--) {
        if (messages[i].sender === "user") {
          prompt = messages[i].text;
          break;
        }
      }

      await addDoc(collection(db, "ai_feedback"), {
        messageId: msg.id,
        prompt: prompt,
        generation: msg.text,
        type: feedbackType,
        comment: feedbackText,
        userEmail: profile?.email || "Unknown",
        userName: profile?.name || "Unknown",
        userLevel: profile?.level || "Unknown",
        createdAt: serverTimestamp(),
      });
      setFeedbackModalOpen(false);
      alert("Thank you for your feedback!");
    } catch (err) {
      console.error("Feedback error", err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isAdDismissed, setIsAdDismissed] = useState(() => {
    try {
      const dismissedAt = localStorage.getItem(
        `mw_pro_ad_dismissed_at_${profile?.uid || "guest"}`,
      );
      if (dismissedAt) {
        const elapsed = Date.now() - parseInt(dismissedAt, 10);
        // Hide the ad banner for 3 days (3 * 24 * 60 * 60 * 1000)
        if (elapsed < 3 * 24 * 60 * 60 * 1000) {
          return true;
        }
      }
    } catch {}
    return false;
  });

  const handleDismissAd = () => {
    try {
      localStorage.setItem(
        `mw_pro_ad_dismissed_at_${profile?.uid || "guest"}`,
        Date.now().toString(),
      );
    } catch {}
    setIsAdDismissed(true);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isLoading) {
      setLoadingStatus("Working...");
      return;
    }
    setLoadingStatus("Working...");
  }, [isLoading]);

  const speakText = (text: string, id: string) => {
    if ("speechSynthesis" in window) {
      if (activeSpeechId === id) {
        window.speechSynthesis.cancel();
        setActiveSpeechId(null);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.onend = () => setActiveSpeechId(null);
      utterance.onerror = () => setActiveSpeechId(null);
      setActiveSpeechId(id);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startLongPress = (e: React.MouseEvent | React.TouchEvent) => {
    // Only trigger if clicking the main container, not buttons
    if (e.target !== e.currentTarget) return;

    endLongPress();
    const timer = setTimeout(() => {
      setShowDeleteConfirm(true);
    }, 1200);
    setLongPressTimer(timer);
  };

  const endLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setShowDeleteConfirm(false);
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // --- CHECK LIMITS ---
    const today = new Date().toLocaleDateString("en-CA");
    const isPro = profile?.isPro;
    const aiPointsLastReset = profile?.aiPointsLastReset || "";
    let currentPoints =
      aiPointsLastReset === today
        ? (profile?.aiPoints ?? appSettings.freeDailyLimit)
        : appSettings.freeDailyLimit;

    if (!isPro && currentPoints < 1) {
      // Show go pro message
      const errorMsg: Message = {
        id: Date.now().toString() + "-err",
        sender: "ai",
        text: "Oops! You've used up your free AI questions for today. Upgrading to PRO will give you unlimited questions!",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setIsLoading(false);
      setTimeout(onGoPro, 3000);
      return;
    }
    // --- END LIMITS ---

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLastQuery(text);
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      if (!isPro && auth.currentUser) {
        currentPoints -= 1; // 1 point per question
        const userRef = doc(db, "users", auth.currentUser.uid);
        await setDoc(
          userRef,
          { aiPoints: currentPoints, aiPointsLastReset: today },
          { merge: true },
        );
        onUpdateProfile({
          ...profile,
          aiPoints: currentPoints,
          aiPointsLastReset: today,
        });
      }

      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const newApiUsage = {
          count: (profile?.apiUsage?.count || 0) + 1,
          lastUsed: Date.now(),
        };
        await setDoc(
          userRef,
          { apiUsage: newApiUsage, lastActiveAt: Date.now() },
          { merge: true },
        );
        onUpdateProfile({
          ...profile,
          apiUsage: newApiUsage,
          lastActiveAt: Date.now(),
        });

        // Add to global count
        try {
          await setDoc(
            doc(db, "settings", "global"),
            { totalApiCalls: increment(1) },
            { merge: true },
          );
        } catch (e) {}
      }

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.slice(-10),
          userMessage: { sender: "user", text },
          userLevel: profile?.level || "Form 4",
          isPro: Boolean(profile?.isPro),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server Error: ${response.status}`);
      }

      const dataItems = await response.json();

      let responseText =
        dataItems.text || "Sorry, I couldn't find an answer to that.";
      responseText = responseText.replace(/\$/g, "");

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Chat Correlation Error:", error);
      let errorText =
        "I'm having trouble connecting right now. Please try again later.";

      if (error.name === "AbortError") {
        errorText =
          "Request timed out. The server is taking too long to respond. Please try again.";
      } else if (error.message && error.message.includes("QUOTA_EXCEEDED")) {
        errorText =
          "Emi AI is currently very busy (maximum capacity reached). Please try again in a few moments or upgrade to PRO.";
      } else if (error.message && error.message.includes("504")) {
        errorText = "Server timeout (504). Please try again in a few moments.";
      } else if (error.message) {
        errorText = `EMI AI error: ${error.message}`;
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: errorText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCalling) {
    return (
      <CallingView
        onEnd={() => setIsCalling(false)}
        profile={profile}
        onUpdateProfile={onUpdateProfile}
        onGoPro={onGoPro}
        theme={theme}
      />
    );
  }

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col ${theme === "dark" ? "bg-gray-950 text-white" : "bg-slate-50 text-slate-900"} animate-in slide-in-from-right duration-300`}
    >
      {/* Header */}
      <div
        className={`${theme === "dark" ? "bg-gray-950/80 border-gray-800" : "bg-white/80 border-slate-200 shadow-sm"} backdrop-blur-xl border-b pt-4 pb-2 px-5 flex justify-between items-center shrink-0 z-20 sticky top-0`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={`w-10 h-10 ${theme === "dark" ? "bg-gray-900 border-gray-800 text-gray-300" : "bg-slate-100 border-slate-200 text-slate-600"} shadow-sm rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform border`}
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full ${theme === "dark" ? "bg-indigo-900/40 border-indigo-500/20" : "bg-indigo-50 border-indigo-200"} border flex items-center justify-center overflow-hidden shadow-inner`}
            >
              <img
                src="https://i.ibb.co/cS5rBBny/emi-AI-logo.png"
                alt="Emi"
                className="w-full h-full object-contain p-1"
              />
            </div>
            <div>
              <h2
                className={`font-bold text-[17px] ${theme === "dark" ? "text-white" : "text-slate-900"} leading-none mb-1 flex items-center gap-1`}
              >
                Emi AI{" "}
                <Sparkles
                  size={14}
                  className="text-indigo-400"
                  fill="currentColor"
                />
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-gray-400 text-[10px] font-bold tracking-wide uppercase font-sans">
                  Always active
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {profile?.isPro ? (
            <div className="px-2 py-1 rounded-md bg-yellow-400 text-black text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 shadow-lg shadow-yellow-500/20">
              <Crown size={12} /> PRO
            </div>
          ) : (
            <div
              onClick={onGoPro}
              className="flex flex-col items-end mr-1 cursor-pointer group active:scale-95 transition-transform"
            >
              <span
                className={`text-[10px] font-black uppercase tracking-tighter ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}
              >
                Points
              </span>
              <span
                className={`text-xs font-black leading-none ${theme === "dark" ? "text-indigo-400" : "text-indigo-600"}`}
              >
                {profile?.aiPointsLastReset ===
                new Date().toLocaleDateString("en-CA")
                  ? (profile?.aiPoints ?? appSettings.freeDailyLimit)
                  : appSettings.freeDailyLimit}
              </span>
            </div>
          )}
          <button
            onClick={() => setIsCalling(true)}
            className={`w-10 h-10 relative group ${theme === "dark" ? "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"} rounded-full flex items-center justify-center shrink-0 transition-all`}
            title="Start Live Call"
          >
            <Phone size={18} fill="currentColor" />
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-5 pt-6 pb-32 space-y-7 hide-scrollbar"
        onMouseDown={startLongPress}
        onMouseUp={endLongPress}
        onMouseLeave={endLongPress}
        onTouchStart={startLongPress}
        onTouchEnd={endLongPress}
      >
        {/* Intro Card */}
        {messages.length === 0 && (
          <div
            className={`${theme === "dark" ? "bg-gradient-to-br from-indigo-900/30 to-gray-900 border-indigo-500/20" : "bg-white border-indigo-100 shadow-sm"} rounded-3xl p-6 border flex flex-col gap-4 text-center items-center mt-4`}
          >
            <div
              className={`w-24 h-24 ${theme === "dark" ? "bg-indigo-950/20 border-indigo-500/10" : "bg-indigo-50 border-indigo-100"} shadow-md rounded-2xl flex items-center justify-center shrink-0 border transform -rotate-3 hover:rotate-0 transition-transform overflow-hidden`}
            >
              <img
                src="https://i.ibb.co/cS5rBBny/emi-AI-logo.png"
                alt="Emi AI"
                className="w-full h-full object-contain p-1.5"
              />
            </div>
            <div>
              <h3
                className={`font-black text-[22px] ${theme === "dark" ? "text-white" : "text-slate-900"} mb-1.5`}
              >
                How can I help?
              </h3>
              <p className="text-[14px] text-gray-500 font-medium leading-relaxed max-w-[250px]">
                I can help you understand concepts, solve problems, or just
                chat.
              </p>
            </div>
          </div>
        )}

        {/* Grid Suggestions */}
        {messages.length === 0 && (
          <div className="mt-6 mb-2">
            <div className="grid grid-cols-2 gap-3">
              <SuggestionCard
                icon={<FlaskConical size={20} className="text-[#9F4FFD]" />}
                bgColor="bg-purple-50"
                text="Explain photosynthesis in simple terms"
                onClick={() =>
                  handleSend("Explain photosynthesis in simple terms")
                }
                theme={theme}
              />
              <SuggestionCard
                icon={
                  <Calculator
                    size={20}
                    fill="currentColor"
                    className="text-[#3A82F7]"
                  />
                }
                bgColor="bg-blue-50"
                text="Solve for x: 5x + 12 = 3(x + 8)"
                onClick={() => handleSend("Solve for x: 5x + 12 = 3(x + 8)")}
                theme={theme}
              />
              <SuggestionCard
                icon={
                  <BookOpen
                    size={20}
                    fill="currentColor"
                    className="text-[#20CA78]"
                  />
                }
                bgColor="bg-emerald-50"
                text="Give me tips to study better"
                onClick={() => handleSend("Give me tips to study better")}
                theme={theme}
              />
              <SuggestionCard
                icon={
                  <Sprout
                    size={20}
                    fill="currentColor"
                    className="text-[#20CA78]"
                  />
                }
                bgColor="bg-green-50"
                text="Explain crop rotation in agriculture"
                onClick={() =>
                  handleSend("Explain crop rotation in agriculture")
                }
                theme={theme}
              />
            </div>
          </div>
        )}

        {messages.length > 0 && messages.some((m) => m.sender === "user") && (
          <div className="flex items-center gap-4 my-6">
            <div
              className={`flex-1 h-[1px] ${theme === "dark" ? "bg-gray-800" : "bg-slate-200"}`}
            ></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">
              Today
            </span>
            <div
              className={`flex-1 h-[1px] ${theme === "dark" ? "bg-gray-800" : "bg-slate-200"}`}
            ></div>
          </div>
        )}

        {/* Chat Bubbles */}
        <div className="space-y-6 animate-in fade-in duration-300">
          {chatBubbles}
          {isLoading && (
            <div
              className={`p-5 md:p-6 shadow-sm relative ${theme === "dark" ? "bg-gray-950 border-y border-gray-900 text-gray-200 animate-pulse" : "bg-white border-y border-slate-200 text-slate-800 animate-pulse"} -mx-5 md:mx-0 md:rounded-3xl md:border font-medium flex flex-col gap-2`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-full ${theme === "dark" ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-200"} border flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative`}
                >
                  <img
                    src="https://i.ibb.co/cS5rBBny/emi-AI-logo.png"
                    alt="Emi"
                    className="w-full h-full object-contain p-0.5"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-white dark:border-gray-950 rounded-full animate-ping pointer-events-none" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[12px] font-black uppercase tracking-wider ${theme === "dark" ? "text-indigo-400" : "text-indigo-600"}`}
                    >
                      Emi AI
                    </span>
                    <div className="flex gap-1 ml-1">
                      <span
                        className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></span>
                      <span
                        className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></span>
                      <span
                        className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></span>
                    </div>
                  </div>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wide">
                    Working...
                  </p>
                </div>
              </div>
              <span
                className={`text-[13.5px] leading-relaxed pl-10 ${theme === "dark" ? "text-gray-400" : "text-slate-500"} font-bold`}
              >
                {loadingStatus}
              </span>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Area */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-40 ${theme === "dark" ? "bg-gray-950/85 border-gray-800" : "bg-white/90 border-slate-200 shadow-[0_-4px_30px_rgba(0,0,0,0.08)]"} backdrop-blur-xl border-t pb-safe-4`}
      >
        {/* Beautiful Dynamic PRO Advertising Banner */}
        {!profile?.isPro &&
          !isAdDismissed &&
          messages.filter((m) => m.sender === "user").length >= 1 && (
            <EmiProAdvertisingBanner
              onUpgrade={onGoPro}
              onDismiss={handleDismissAd}
              theme={theme}
            />
          )}

        <div className="p-4 pt-3">
          <div
            className={`flex flex-col ${theme === "dark" ? "bg-gray-900 border-gray-800 shadow-[0_10px_40px_rgba(0,0,0,0.3)]" : "bg-white border-slate-200 shadow-xl shadow-slate-200/60"} rounded-3xl p-1.5 pl-4 border transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-500/20`}
          >
            <div className="flex items-end gap-2 w-full">
              <textarea
                placeholder="Ask anything..."
                className={`flex-1 bg-transparent text-[15px] outline-none ${theme === "dark" ? "text-white placeholder-gray-500" : "text-slate-900 placeholder-slate-400"} font-medium py-3.5 resize-none max-h-36 min-h-[40px] leading-relaxed overflow-y-auto scrollbar-thin`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() && !isLoading) {
                      handleSend(input);
                    }
                  }
                }}
                rows={Math.min(5, input.split("\n").length || 1)}
              />
              <button
                className={`w-[44px] h-[44px] rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                  !input.trim() || isLoading
                    ? theme === "dark"
                      ? "bg-gray-800 text-gray-600"
                      : "bg-slate-200 text-slate-400"
                    : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                } mb-1.5`}
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isLoading}
              >
                <Send
                  size={18}
                  fill={!input.trim() || isLoading ? "none" : "currentColor"}
                />
              </button>
            </div>
            <div className="flex justify-between items-center text-[10px] text-gray-400 px-1 mt-0.5 pb-1 max-sm:hidden">
              <span>
                Press{" "}
                <kbd className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[8px] font-mono">
                  Enter
                </kbd>{" "}
                to send,{" "}
                <kbd className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[8px] font-mono">
                  Shift+Enter
                </kbd>{" "}
                for a new line.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          ></div>
          <div
            className={`relative ${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"} p-8 rounded-[2.5rem] border shadow-2xl max-w-xs w-full text-center`}
          >
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3
              className={`text-xl font-black ${theme === "dark" ? "text-white" : "text-slate-900"} mb-2`}
            >
              Clear Chat?
            </h3>
            <p className="text-xs text-gray-500 font-bold mb-8 leading-relaxed px-4">
              This will permanently delete all messages in this conversation.
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest ${theme === "dark" ? "bg-gray-800 text-gray-400" : "bg-slate-100 text-slate-500"}`}
              >
                Cancel
              </button>
              <button
                onClick={clearChat}
                className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setFeedbackModalOpen(false)}
          ></div>
          <div
            className={`relative ${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-white border-slate-200"} p-8 rounded-[2.5rem] border shadow-2xl max-w-[22rem] w-full text-center`}
          >
            <div
              className={`w-14 h-14 ${feedbackType === "positive" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"} rounded-2xl flex items-center justify-center mx-auto mb-6`}
            >
              {feedbackType === "positive" ? (
                <ThumbsUp size={28} />
              ) : (
                <ThumbsDown size={28} />
              )}
            </div>
            <h3
              className={`text-xl font-black mb-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
            >
              {feedbackType === "positive" ? "Great Answer!" : "Report Issue"}
            </h3>
            <p
              className={`text-xs mb-6 ${theme === "dark" ? "text-gray-400" : "text-slate-500"} font-bold`}
            >
              {feedbackType === "positive"
                ? "Let us know how this helped you (optional)."
                : "Tell us what was wrong or missing so we can improve Emi (optional)."}
            </p>

            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              autoFocus
              placeholder={
                feedbackType === "positive"
                  ? "Example: Perfect explanation of algebra!"
                  : "Example: The formula was wrong..."
              }
              rows={3}
              className={`w-full p-4 rounded-2xl mb-6 text-sm font-bold resize-none ${theme === "dark" ? "bg-gray-900 border-gray-800 text-white" : "bg-slate-100 text-slate-900 border-transparent"} border focus:border-indigo-500 outline-none transition-colors text-left`}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setFeedbackModalOpen(false)}
                className={`flex-1 py-4 ${theme === "dark" ? "bg-gray-800 text-white" : "bg-slate-200 text-slate-800"} font-bold rounded-2xl transition-all active:scale-95 text-[10px] uppercase tracking-widest`}
              >
                Cancel
              </button>
              <button
                onClick={submitFeedback}
                disabled={submittingFeedback}
                className={`flex-1 py-4 ${feedbackType === "positive" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-700"} text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2`}
              >
                {submittingFeedback ? "Sending..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CallingView({
  onEnd,
  profile,
  onUpdateProfile,
  onGoPro,
  theme,
}: {
  onEnd: () => void;
  profile: any;
  onUpdateProfile: (p: any) => void;
  onGoPro: () => void;
  theme: "light" | "dark";
}) {
  const [seconds, setSeconds] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isEmiSpeaking, setIsEmiSpeaking] = useState(false);
  const [voiceName, setVoiceName] = useState<string>(
    localStorage.getItem("emi_voice") || "Kore",
  );
  const [isMuted, setIsMuted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isMutedRef = useRef(false);
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const voiceOptions = [
    { name: "Kore", desc: "Warm & Friendly" },
    { name: "Zephyr", desc: "Clear & Natural" },
    { name: "Puck", desc: "Energetic & Bright" },
    { name: "Charon", desc: "Deep & Calm" },
    { name: "Fenrir", desc: "Bold & Articulate" },
    { name: "Aoede", desc: "Gentle & Expressive" },
  ];

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isConnected) {
      timer = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isConnected]);

  useEffect(() => {
    if (!profile?.isPro && seconds >= 300) {
      onEnd();
    }
  }, [seconds, profile?.isPro, onEnd]);

  const stopAllAudio = () => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextPlayTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setIsEmiSpeaking(false);
  };

  const playAudioChunk = (base64Data: string) => {
    try {
      const ctx = outputAudioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const alignedLen = len - (len % 2);
      const bytes = new Uint8Array(alignedLen);
      for (let i = 0; i < alignedLen; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const pcm16 = new Int16Array(bytes.buffer);
      if (pcm16.length === 0) return;

      const audioBuffer = ctx.createBuffer(1, pcm16.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < pcm16.length; i++) {
        channelData[i] = pcm16[i] / 32768.0;
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      if (analyserRef.current) {
        source.connect(analyserRef.current);
        analyserRef.current.connect(ctx.destination);
      } else {
        source.connect(ctx.destination);
      }

      const startTime = Math.max(nextPlayTimeRef.current, ctx.currentTime);
      source.start(startTime);
      nextPlayTimeRef.current = startTime + audioBuffer.duration;

      setIsEmiSpeaking(true);
      if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = setTimeout(() => {
        if (ctx.currentTime >= nextPlayTimeRef.current - 0.1) {
          setIsEmiSpeaking(false);
        }
      }, (audioBuffer.duration + 0.3) * 1000);

      activeSourcesRef.current.push(source);
      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
      };
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  };

  useEffect(() => {
    // Check call limits
    const today = new Date().toLocaleDateString("en-CA");
    const isPro = profile?.isPro;
    const aiCallsLastReset = profile?.aiCallsLastReset || "";
    let currentCalls =
      aiCallsLastReset === today ? (profile?.aiCallsCount ?? 0) : 0;

    if (!isPro && currentCalls >= 2) {
      setErrorMsg(
        "You've reached your free daily limit of 2 calls. Upgrade to Pro for unlimited access!",
      );
      setTimeout(onGoPro, 3000);
      return;
    }

    if (!isPro && auth.currentUser && currentCalls < 2) {
      currentCalls += 1;
      const userRef = doc(db, "users", auth.currentUser.uid);
      updateDoc(userRef, {
        aiCallsCount: currentCalls,
        aiCallsLastReset: today,
      });
      onUpdateProfile({
        ...profile,
        aiCallsCount: currentCalls,
        aiCallsLastReset: today,
      });
    }

    let active = true;

    const initLiveConnection = async () => {
      try {
        setErrorMsg(null);

        // 1. Get microphone stream
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        // 2. Fetch API token from backend
        const tokenRes = await fetch("/api/gemini/token");
        const tokenData = await tokenRes.json();
        const apiKey = tokenData.token;
        if (!apiKey) {
          throw new Error("Gemini API key is not configured.");
        }

        // 3. Setup Output AudioContext (24kHz for Gemini Live audio) & Analyser
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        const outputCtx = new AudioContextClass({ sampleRate: 24000 });
        outputAudioCtxRef.current = outputCtx;
        nextPlayTimeRef.current = outputCtx.currentTime;
        outputCtx.resume().catch(() => {});

        const analyser = outputCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        setAnalyserNode(analyser);

        // 4. Initialize GoogleGenAI with Live API
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { apiVersion: "v1alpha" },
        });

        const chosenVoice = voiceName || "Kore";

        const session = await ai.live.connect({
          model: "gemini-3.1-flash-live-preview",
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: chosenVoice,
                },
              },
            },
            systemInstruction: `You are Emi AI, a friendly, patient, and knowledgeable Malawi secondary school study tutor from Educate Malawi (Educate MW - MW stands for Malawi). You specialize in the MANEB curriculum for JCE and MSCE students. You know all Educate Malawi features (Study Notes Library, Video Lessons, Dictionary, Quizzes, University Points Calculator). Keep your vocal answers conversational, encouraging, direct, and under 2-3 sentences so the conversation flows naturally.`,
          },
          callbacks: {
            onopen: () => {
              if (!active) return;
              setIsConnected(true);
              setErrorMsg(null);
            },
            onmessage: (message: any) => {
              if (!active) return;

              // Transcription/subtitles
              const outText =
                message.text ||
                message.serverContent?.outputTranscription?.text ||
                message.serverContent?.modelTurn?.parts?.find(
                  (p: any) => p.text,
                )?.text;
              if (outText) {
                setLiveTranscript(outText);
              }

              // Audio response chunks
              const parts = message.serverContent?.modelTurn?.parts || [];
              for (const part of parts) {
                if (part.inlineData?.data) {
                  playAudioChunk(part.inlineData.data);
                }
              }

              // Handle interruption
              if (message.serverContent?.interrupted) {
                stopAllAudio();
              }
            },
            onerror: (err: any) => {
              console.warn("Live API Notice:", err);
            },
            onclose: (e: any) => {
              if (!active) return;
              console.log("Live session closed:", e);
              setIsConnected(false);
            },
          },
        });

        if (!active) {
          try {
            session.close();
          } catch (e) {}
          return;
        }
        sessionRef.current = session;

        // 5. Initial greeting from Emi
        session.sendClientContent({
          turns: [
            {
              role: "user",
              parts: [
                {
                  text: "Hello Emi! Introduce yourself briefly in one short sentence and ask how you can help me with my MSCE or JCE studies today.",
                },
              ],
            },
          ],
          turnComplete: true,
        });

        // 6. Setup Input AudioContext (16kHz for mic capture)
        const inputCtx = new AudioContextClass({ sampleRate: 16000 });
        inputAudioCtxRef.current = inputCtx;
        inputCtx.resume().catch(() => {});

        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = (e) => {
          if (isMutedRef.current || !active) return;
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
          }

          let binary = "";
          const bytes = new Uint8Array(pcm16.buffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64Data = btoa(binary);

          if (sessionRef.current) {
            try {
              sessionRef.current.sendRealtimeInput({
                audio: {
                  mimeType: "audio/pcm;rate=16000",
                  data: base64Data,
                },
              });
            } catch (err) {}
          }
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
      } catch (err: any) {
        console.error("Live connection error:", err);
        if (active) {
          setErrorMsg(
            err.message ||
              "Could not start Live Voice session. Please grant microphone permission.",
          );
          setIsConnected(false);
        }
      }
    };

    initLiveConnection();

    return () => {
      active = false;
      stopAllAudio();
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (inputAudioCtxRef.current) {
        inputAudioCtxRef.current.close().catch(() => {});
      }
      if (outputAudioCtxRef.current) {
        outputAudioCtxRef.current.close().catch(() => {});
      }
      if (sessionRef.current) {
        try {
          if (typeof sessionRef.current.then === "function") {
            sessionRef.current.then((s: any) => s.close?.()).catch(() => {});
          } else {
            sessionRef.current.close?.();
          }
        } catch (e) {}
      }
    };
  }, [voiceName]);

  const handleVoiceChange = (v: string) => {
    setVoiceName(v);
    localStorage.setItem("emi_voice", v);
    setShowVoicePicker(false);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`flex-1 flex flex-col items-center justify-between pb-10 pt-6 px-6 absolute inset-0 z-50 overflow-hidden font-sans ${theme === "dark" ? "bg-[#0b0f19] text-white" : "bg-slate-50 text-slate-900"}`}
    >
      {/* Floating immersive background glowing gradient spots */}
      <div
        className={`absolute top-[-25%] left-[-15%] w-[130%] h-[60%] ${theme === "dark" ? "bg-indigo-600/15" : "bg-indigo-100/45"} rounded-full blur-[120px] pointer-events-none`}
      ></div>
      <div
        className={`absolute bottom-[-20%] right-[-10%] w-[80%] h-[40%] ${theme === "dark" ? "bg-emerald-500/10" : "bg-emerald-100/30"} rounded-full blur-[100px] pointer-events-none`}
      ></div>

      {/* Sleek Custom Glassmorphism Top Navigation Header Bar */}
      <div className="w-full flex items-center justify-between relative z-20 px-1 py-2">
        <button
          onClick={onEnd}
          className={`p-3 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 shadow-sm border ${
            theme === "dark"
              ? "bg-white/5 border-white/10 text-white hover:bg-white/15"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
          title="Back Dashboard"
          id="live-back-nav"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black tracking-[0.25em] text-indigo-500 uppercase">
            Emi Calling Studio
          </span>
          <span
            className={`text-[11px] font-bold mt-0.5 tracking-wide ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}
          >
            Voice: {voiceName}
          </span>
        </div>

        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border shadow-sm ${
            isConnected
              ? theme === "dark"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-emerald-50 border-emerald-200 text-emerald-600"
              : theme === "dark"
                ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                : "bg-yellow-50 border-yellow-200 text-yellow-600"
          }`}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-yellow-500"}`}
          ></div>
          <span className="text-[10px] font-extrabold tracking-wider uppercase">
            {isConnected ? "Secure" : "Connecting"}
          </span>
        </div>
      </div>

      {/* Studio Centered Stage with Double Interspatial Pulsing Circles */}
      <div className="flex flex-col items-center relative z-10 w-full flex-1 justify-center max-w-sm mt-3">
        <div className="mb-12 relative flex items-center justify-center">
          {/* External layered pulsing shadows */}
          {isConnected && (
            <>
              <div className="absolute inset-[-20px] bg-indigo-500/10 rounded-full opacity-60 animate-pulse duration-1000 -z-10"></div>
              <div className="absolute inset-[-40px] bg-emerald-400/5 rounded-full opacity-40 animate-pulse duration-1500 -z-10"></div>
              <div className="absolute inset-[-60px] bg-indigo-500/5 rounded-full opacity-20 animate-pulse duration-2000 -z-10"></div>
            </>
          )}

          {/* Premium Vector Avatar Track Globe */}
          <div
            className={`w-[210px] h-[210px] ${
              theme === "dark"
                ? "bg-gray-900/60 border-indigo-500/30"
                : "bg-white border-indigo-200"
            } rounded-full flex items-center justify-center border-4 relative z-10 p-3.5 shadow-[0_20px_50px_rgba(99,102,241,0.15)]`}
          >
            <div
              className={`w-full h-full ${
                theme === "dark"
                  ? "bg-gradient-to-tr from-gray-950 via-indigo-950/20 to-gray-950 border-gray-800"
                  : "bg-gradient-to-tr from-slate-100 to-white border-slate-100"
              } rounded-full flex items-center justify-center overflow-hidden shadow-inner border relative group`}
            >
              {/* Center Avatar Portrait */}
              <img
                src="https://i.ibb.co/cS5rBBny/emi-AI-logo.png"
                alt="Emi AI study avatar"
                className="w-[85%] h-[85%] object-contain p-2 relative z-20 transform hover:scale-105 transition-all duration-300"
              />

              {/* Subtitle Glow overlay */}
              <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>

          {/* Real-time orbital glowing dots */}
          {isConnected && (
            <>
              <div className="absolute w-3 h-3 bg-emerald-400 rounded-full animate-ping top-[15%] right-[10%]"></div>
              <div className="absolute w-2 h-2 bg-indigo-500 rounded-full bottom-[15%] left-[10%] animate-bounce"></div>
            </>
          )}
        </div>

        {/* Title and Study Assistant Heading */}
        <h3
          className={`text-4xl font-extrabold mb-2 tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"} text-center drop-shadow-sm`}
        >
          Emi AI
        </h3>
        <p
          className={`text-xs font-bold ${theme === "dark" ? "text-indigo-300" : "text-indigo-600"} text-center uppercase tracking-widest mb-6`}
        >
          MSCE Curriculum Expert
        </p>

        {/* Connection, Timer Badge & Dynamic Text Outputs */}
        <div
          className={`backdrop-blur-xl px-7 py-3 rounded-2xl border flex flex-col items-center ${
            theme === "dark"
              ? "bg-slate-900/60 border-slate-800 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
              : "bg-white border-slate-200/80 shadow-[0_8px_32px_rgba(99,102,241,0.05)]"
          } min-w-[240px] max-w-[340px] my-3 transition-all duration-300`}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-2 h-2 rounded-full ${isEmiSpeaking ? "bg-indigo-500 animate-ping" : isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
            ></div>
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">
              {isEmiSpeaking
                ? "Emi Speaking..."
                : isConnected
                  ? "Listening to you..."
                  : "Connecting..."}
            </span>
            <span className="text-[11px] font-mono font-black ml-2 text-slate-500">
              {formatTime(seconds)}
            </span>
          </div>

          <p
            className={`text-xs text-center font-medium mt-1 leading-relaxed ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}
          >
            {liveTranscript
              ? `"${liveTranscript}"`
              : isConnected
                ? "Speak naturally with Emi to discuss any MSCE/JCE topic..."
                : "Establishing secure real-time Live connection..."}
          </p>

          {!profile?.isPro && isConnected && (
            <span
              className={`text-[9px] font-extrabold mt-2 uppercase tracking-wider ${theme === "dark" ? "text-white/40" : "text-slate-400"}`}
            >
              {300 - seconds > 0
                ? `Free Call: ${formatTime(300 - seconds)} left`
                : "Call Ended"}
            </span>
          )}
        </div>

        {/* Error / System feedback alerts */}
        {errorMsg && (
          <div className="mt-5 bg-red-500/10 px-5 py-3 rounded-2xl border border-red-500/30 text-center max-w-[280px] animate-in fade-in zoom-in-95 relative z-20">
            <p className="text-red-400 text-xs font-bold leading-snug">
              {errorMsg}
            </p>
          </div>
        )}
      </div>

      {/* Interactive Controls & Bottom Wave Visualizer Block */}
      <div className="flex flex-col items-center gap-8 relative z-20 w-full max-w-sm">
        {/* Spectrum Wave Visualization bars */}
        <div className="w-full">
          <SpectrumVisualizer
            analyser={analyserNode}
            isConnected={isConnected}
          />
        </div>

        {/* Triple Action High-Contrast Keys */}
        <div className="flex items-center justify-between gap-6 w-full px-8">
          {/* Microphone Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-90 border cursor-pointer ${
              isMuted
                ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30"
                : theme === "dark"
                  ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                  : "bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
            title={isMuted ? "Unmute microphone" : "Mute microphone"}
            id="live-mute-btn"
          >
            {isMuted ? (
              <MicOff size={22} strokeWidth={2.5} />
            ) : (
              <Mic size={22} strokeWidth={2.5} />
            )}
          </button>

          {/* Main End Call Big Key */}
          <button
            onClick={onEnd}
            className="w-20 h-20 bg-red-600 hover:bg-red-500 rounded-[32px] flex items-center justify-center text-white shadow-[0_15px_30px_rgba(220,38,38,0.3)] hover:shadow-[0_20px_40px_rgba(220,38,38,0.4)] active:scale-90 hover:scale-105 transition-all duration-300 cursor-pointer group"
            title="End Call Session"
            id="live-hangup-btn"
          >
            <PhoneOff size={30} strokeWidth={2.5} />
          </button>

          {/* Voice Switcher Option Trigger */}
          <button
            onClick={() => setShowVoicePicker(true)}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-90 border cursor-pointer ${
              theme === "dark"
                ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                : "bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
            title="Switch AI voice accent"
            id="live-voice-btn"
          >
            <Volume2 size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Small humble Malawi copyright branding tag */}
        <p
          className={`text-[8px] font-bold uppercase tracking-[0.45em] text-center ${theme === "dark" ? "text-white/20" : "text-slate-400"}`}
        >
          MSCE Vocal Core v2.4
        </p>
      </div>

      {/* Custom Bottom Drawer for Accent Voice Selection */}
      {showVoicePicker && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-md p-6 animate-in fade-in duration-300">
          <div
            className={`w-full max-w-sm rounded-[2.5rem] p-8 pb-10 border shadow-[0_-15px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-500 ${
              theme === "dark"
                ? "bg-[#0f1422] border-white/10"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col">
                <h3
                  className={`text-xl font-extrabold ${theme === "dark" ? "text-white" : "text-slate-950"}`}
                >
                  Select AI Accent
                </h3>
                <p
                  className={`text-[10px] uppercase font-bold tracking-widest mt-0.5 ${theme === "dark" ? "text-[#6366f1]" : "text-indigo-600"}`}
                >
                  Gemini Vocal Matrix
                </p>
              </div>
              <button
                onClick={() => setShowVoicePicker(false)}
                className={`rounded-full p-2.5 transition-all active:scale-90 duration-200 ${
                  theme === "dark"
                    ? "text-gray-400 hover:text-white hover:bg-white/5 bg-white/5"
                    : "text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200"
                }`}
                id="close-voice-picker"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="space-y-2.5">
              {voiceOptions.map((opt) => (
                <button
                  key={opt.name}
                  onClick={() => handleVoiceChange(opt.name)}
                  className={`w-full p-4.5 rounded-3xl flex items-center justify-between border cursor-pointer transition-all duration-300 ${
                    voiceName === opt.name
                      ? "bg-gradient-to-r from-indigo-600 to-[#4f46e5] border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                      : theme === "dark"
                        ? "bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                        : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  id={`voice-opt-${opt.name.toLowerCase()}`}
                >
                  <div className="text-left">
                    <h4 className="font-extrabold text-sm tracking-wide">
                      {opt.name}
                    </h4>
                    <p className="text-[9px] opacity-80 font-bold uppercase tracking-wider mt-0.5">
                      {opt.desc}
                    </p>
                  </div>
                  {voiceName === opt.name && (
                    <CheckCircle size={18} strokeWidth={3} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SpectrumVisualizer({
  analyser,
  isConnected,
}: {
  analyser: AnalyserNode | null;
  isConnected: boolean;
}) {
  const [data, setData] = useState<number[]>(new Array(24).fill(0));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!analyser || !isConnected) {
      setData(new Array(24).fill(0));
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      analyser.getByteFrequencyData(dataArray);
      // Sample and normalize
      const sampled: number[] = [];
      const step = Math.floor(bufferLength / 24);
      for (let i = 0; i < 24; i++) {
        const val = dataArray[i * step];
        sampled.push(val / 255);
      }
      setData(sampled);
      rafRef.current = requestAnimationFrame(update);
    };

    update();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, isConnected]);

  return (
    <div className="flex items-end justify-center gap-1.5 h-20 w-full mb-4">
      {data.map((val, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-75 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
          style={{
            height: isConnected ? `${20 + val * 100}%` : "10%",
            opacity: isConnected ? 0.3 + val * 0.7 : 0.1,
          }}
        ></div>
      ))}
    </div>
  );
}

function SuggestionCard({
  icon,
  bgColor,
  text,
  onClick,
  theme,
}: {
  icon: React.ReactNode;
  bgColor: string;
  text: string;
  onClick: () => void;
  theme: "light" | "dark";
}) {
  return (
    <div
      onClick={onClick}
      className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-100 shadow-sm"} rounded-[22px] p-4 flex flex-col items-center justify-center text-center shadow-sm border snap-start cursor-pointer hover:shadow-lg transition-all active:scale-95`}
    >
      <div
        className={`w-12 h-12 rounded-[16px] flex items-center justify-center mb-3 shadow-inner ${theme === "dark" ? "bg-gray-800" : bgColor}`}
      >
        {icon}
      </div>
      <p
        className={`text-[11px] font-bold ${theme === "dark" ? "text-gray-300" : "text-slate-600"} leading-snug`}
      >
        {text}
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  bgColor,
  title,
  onClick,
  theme,
}: {
  icon: React.ReactNode;
  bgColor: string;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  theme: "light" | "dark";
}) {
  return (
    <button
      onClick={onClick}
      className={`${theme === "dark" ? "bg-gray-900 border-gray-800 hover:bg-gray-800" : "bg-white border-slate-200 hover:bg-slate-50"} rounded-[18px] flex flex-col items-center justify-center py-3.5 px-2 text-center shadow-sm border ${onClick ? "cursor-pointer active:scale-95 transition-all duration-200" : ""}`}
    >
      <div
        className={`w-10 h-10 rounded-[12px] flex items-center justify-center mb-2 shadow-inner shrink-0 ${bgColor}`}
      >
        {icon}
      </div>
      <h4
        className={`font-bold ${theme === "dark" ? "text-gray-100" : "text-slate-800"} text-[11px] leading-tight px-1 w-full truncate`}
      >
        {title}
      </h4>
    </button>
  );
}

function NavItem({
  icon,
  label,
  active = false,
  onClick,
  theme,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  theme: "light" | "dark";
}) {
  return (
    <div
      className="flex flex-col items-center justify-center w-14 cursor-pointer pt-1 transition-all active:scale-95 group"
      onClick={onClick}
    >
      <div
        className={`mb-1 transition-colors duration-200 ${active ? (theme === "dark" ? "text-white" : "text-indigo-600") : "text-gray-500 group-hover:text-gray-300"}`}
      >
        {icon}
      </div>
      <span
        className={`text-[9px] font-black tracking-widest uppercase transition-colors duration-200 ${active ? (theme === "dark" ? "text-white" : "text-indigo-600") : "text-gray-500 group-hover:text-gray-300"}`}
      >
        {label}
      </span>
    </div>
  );
}

function LibraryView({
  onBack,
  theme,
  onSelectItem,
  onSelectLocalFile,
  initialSearch = "",
}: {
  onBack: () => void;
  theme: "light" | "dark";
  onSelectItem: (slug: string) => void;
  onSelectLocalFile: (url: string, name: string) => void;
  initialSearch?: string;
}) {
  const [filter, setFilter] = useState<"all" | "offline">("all");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [materials, setMaterials] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem("mw_library_materials_cache");
      return cached ? JSON.parse(cached) : DEFAULT_MATERIALS;
    } catch {
      return DEFAULT_MATERIALS;
    }
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  useEffect(() => {
    setSearchQuery(initialSearch);
  }, [initialSearch]);

  const [downloadedIds, setDownloadedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("mw_downloaded_notes");
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let isMounted = true;
    const safetyTimeout = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2500);

    const q = query(collection(db, "materials"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!isMounted) return;
        clearTimeout(safetyTimeout);
        if (!snapshot.empty) {
          const liveData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMaterials(liveData);
          try {
            localStorage.setItem(
              "mw_library_materials_cache",
              JSON.stringify(liveData),
            );
          } catch {}
        }
        setLoading(false);
      },
      (error) => {
        clearTimeout(safetyTimeout);
        if (!error.message.includes("offline")) {
          console.warn("Library snapshot notice:", error);
        }
        if (isMounted) setLoading(false);
      },
    );
    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, []);

  const handleDownload = async (item: any) => {
    setDownloadedIds((prev) => {
      const current = prev || [];
      const next = current.includes(item.id)
        ? current.filter((i) => i !== item.id)
        : [...current, item.id];
      try {
        localStorage.setItem("mw_downloaded_notes", JSON.stringify(next));
      } catch {}
      return next;
    });

    if (item.type === "pdf" && item.content) {
      try {
        await triggerExplicitDownload(item.content, item.title);
      } catch (err) {
        console.error("Trigger explicit download failed:", err);
      }
    }
  };

  const standardSubjects = [
    "All Subjects",
    "Biology",
    "Physics",
    "Chemistry",
    "Mathematics",
    "English",
    "Agriculture",
    "Geography",
    "History",
    "Social Studies",
    "Chichewa",
    "Bible Knowledge",
    "Computer Studies",
  ];

  const dynamicSubjects = Array.from(
    new Set((materials || []).map((m) => m.subject).filter(Boolean)),
  ) as string[];

  const allSubjectsList = Array.from(
    new Set([...standardSubjects.slice(1), ...dynamicSubjects]),
  );

  const uniqueLevels = Array.from(
    new Set([
      "Form 1",
      "Form 2",
      "Form 3",
      "Form 4",
      ...(materials || []).map((m) => m.level).filter(Boolean),
    ]),
  ) as string[];

  const visibleItems = (materials || [])
    .filter((item) => item.type !== "blog")
    .filter((item) =>
      filter === "offline" ? (downloadedIds || []).includes(item.id) : true,
    )
    .filter((item) => {
      if (!filterSubject || filterSubject === "All Subjects") return true;
      const itemSub = (item.subject || "").toLowerCase().trim();
      const targetSub = filterSubject.toLowerCase().trim();
      return itemSub === targetSub || itemSub.includes(targetSub) || targetSub.includes(itemSub);
    })
    .filter((item) => {
      if (!filterLevel || filterLevel === "All Levels") return true;
      const itemLvl = (item.level || "").toLowerCase().trim();
      const targetLvl = filterLevel.toLowerCase().trim();
      return itemLvl === targetLvl || itemLvl.includes(targetLvl);
    })
    .filter((item) => {
      if (!searchQuery.trim()) return true;
      const queryLower = searchQuery.toLowerCase().trim();
      return (
        (item.title && item.title.toLowerCase().includes(queryLower)) ||
        (item.excerpt && item.excerpt.toLowerCase().includes(queryLower)) ||
        (item.subject && item.subject.toLowerCase().includes(queryLower))
      );
    })
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return dateB - dateA;
    });

  const clearFilters = () => {
    setFilterSubject("");
    setFilterLevel("");
    setSearchQuery("");
    setFilter("all");
  };

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col ${theme === "dark" ? "bg-gray-950" : "bg-slate-50"} animate-in slide-in-from-right duration-300`}
    >
      {/* Fixed Header */}
      <div
        className={`${theme === "dark" ? "bg-gray-900/90 border-gray-800" : "bg-white/90 border-slate-200"} backdrop-blur-xl pt-4 pb-2 px-5 flex items-center shrink-0 z-10 border-b shadow-xl`}
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
            Study Library
          </h2>
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">
            MSCE & JCE Syllabus Vault
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-32 space-y-6 hide-scrollbar max-w-4xl mx-auto w-full">
        {/* Search */}
        <div
          className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200 shadow-sm"} rounded-[22px] px-4 py-3 flex items-center border focus-within:border-indigo-500/50 transition-colors`}
        >
          <Search className="text-gray-500 mr-2.5" size={18} strokeWidth={3} />
          <input
            type="text"
            placeholder="Search topics, past papers, notes & books..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`bg-transparent outline-none flex-1 ${theme === "dark" ? "text-white" : "text-slate-900"} text-sm font-bold placeholder-gray-500`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-bold px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div
          className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200 shadow-sm"} p-1.5 rounded-2xl border flex`}
        >
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${filter === "all" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500"}`}
          >
            ALL MATERIALS
          </button>
          <button
            onClick={() => setFilter("offline")}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all flex items-center justify-center gap-2 ${filter === "offline" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500"}`}
          >
            <Download size={14} /> OFFLINE NOTES ({downloadedIds.length})
          </button>
        </div>

        {/* Quick Subject Filter Pill Bar */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              Filter by Subject
            </span>
            {(filterSubject || filterLevel || searchQuery) && (
              <button
                onClick={clearFilters}
                className="text-[10px] font-bold text-indigo-500 hover:underline"
              >
                Reset All Filters
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {standardSubjects.map((sub) => {
              const isSelected =
                (!filterSubject && sub === "All Subjects") ||
                filterSubject.toLowerCase() === sub.toLowerCase();
              return (
                <button
                  key={sub}
                  onClick={() =>
                    setFilterSubject(sub === "All Subjects" ? "" : sub)
                  }
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 border shrink-0 ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                      : theme === "dark"
                      ? "bg-gray-900 text-gray-300 border-gray-800 hover:bg-gray-800 hover:text-white"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600"
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        </div>

        {/* Level Select & Detailed Dropdowns */}
        <div className="flex gap-2">
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-bold ${theme === "dark" ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-slate-200 text-slate-900"} border outline-none`}
          >
            <option value="">All Subjects (Dropdown)</option>
            {allSubjectsList.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-bold ${theme === "dark" ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-slate-200 text-slate-900"} border outline-none`}
          >
            <option value="">All Levels (Forms 1-4)</option>
            {uniqueLevels.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3
              className={`font-black text-sm uppercase tracking-wider ${theme === "dark" ? "text-gray-200" : "text-slate-800"}`}
            >
              {filter === "all" ? "Available Study Packs" : "Downloaded Offline Notes"}
            </h3>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest font-black">
              {visibleItems.length} {visibleItems.length === 1 ? "Item" : "Items"}
            </span>
          </div>

          <div className="space-y-3.5">
            {loading ? (
              <div className="py-10 flex justify-center">
                <EmiSpinner size="md" theme={theme} />
              </div>
            ) : visibleItems.length > 0 ? (
              visibleItems.map((item) => {
                const isCloudinaryPdf =
                  item.type === "pdf" &&
                  item.content &&
                  item.content.includes("res.cloudinary.com");
                const previewUrl = isCloudinaryPdf
                  ? item.content.replace(".pdf", ".jpg")
                  : undefined;
                return (
                  <div key={item.id}>
                    <LibraryItem
                      title={item.title}
                      type={item.type || "doc"}
                      date={
                        item.createdAt?.toDate
                          ? item.createdAt.toDate().toLocaleDateString()
                          : "New"
                      }
                      color={
                        item.type === "pdf"
                          ? "bg-red-500/20 text-red-500"
                          : item.type === "video"
                            ? "bg-blue-500/20 text-blue-500"
                            : item.type === "book"
                              ? "bg-purple-500/20 text-purple-500"
                              : "bg-emerald-500/20 text-emerald-500"
                      }
                      isDownloaded={downloadedIds.includes(item.id)}
                      onDownload={() => handleDownload(item)}
                      onClick={() => onSelectItem(item.slug || item.id)}
                      previewUrl={previewUrl}
                      subject={item.subject}
                      level={item.level}
                      theme={theme}
                    />
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-gray-500/20">
                <div
                  className={`w-16 h-16 ${theme === "dark" ? "bg-gray-900" : "bg-slate-100"} rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-500`}
                >
                  <Download size={32} strokeWidth={1.5} />
                </div>
                <p
                  className={`text-sm font-black ${theme === "dark" ? "text-gray-300" : "text-slate-700"}`}
                >
                  No materials match your current filter.
                </p>
                <p className="text-[11px] text-gray-500 max-w-[260px] mx-auto mt-1 leading-relaxed">
                  Try selecting a different subject or reset your filters to view all syllabus notes.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-transform"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LibraryItem({
  title,
  type,
  date,
  color,
  isDownloaded,
  onDownload,
  onClick,
  previewUrl,
  theme,
  subject,
  level,
}: {
  title: string;
  type: string;
  date: string;
  color: string;
  isDownloaded?: boolean;
  onDownload?: () => void;
  onClick?: () => void;
  previewUrl?: string;
  theme: "light" | "dark";
  subject?: string;
  level?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`${theme === "dark" ? "bg-gray-900 border-gray-800 active:bg-gray-800/50" : "bg-white border-slate-200 active:bg-slate-50 shadow-sm"} rounded-[24px] p-4 flex flex-col sm:flex-row sm:items-center border gap-4 transition-all cursor-pointer group`}
    >
      <div className="flex items-center gap-4 flex-1">
        {previewUrl ? (
          <div className="w-14 h-14 rounded-2xl shrink-0 overflow-hidden bg-gray-100 flex items-center justify-center border shadow-inner">
            <img
              src={previewUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${color} shadow-inner`}
          >
            {type === "pdf" && <ScrollText size={22} />}
            {type === "video" && <Video size={22} />}
            {type === "text" && <FileText size={22} />}
            {type === "image" && <Layers size={22} />}
            {type === "book" && <Library size={22} />}
            {type === "doc" && <Bookmark size={22} />}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4
            className={`font-black ${theme === "dark" ? "text-white" : "text-slate-900"} text-[14px] mb-1 truncate leading-tight`}
          >
            {title}
          </h4>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {type}
            </span>
            {subject && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                <span className="text-[10px] font-bold text-indigo-400">
                  {subject}
                </span>
              </>
            )}
            {level && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                <span className="text-[10px] font-bold text-amber-500">
                  {level}
                </span>
              </>
            )}
            <span className="w-1 h-1 rounded-full bg-gray-700"></span>
            <span className="text-[10px] font-bold text-gray-500">{date}</span>
          </div>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDownload?.();
        }}
        className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isDownloaded ? "bg-indigo-600 text-white border-indigo-500 shadow-lg" : theme === "dark" ? "bg-gray-950 text-gray-600 border-gray-800 hover:text-indigo-400 hover:border-indigo-500" : "bg-slate-50 text-slate-400 border-slate-200 hover:text-indigo-600 hover:border-indigo-300"}`}
      >
        {isDownloaded ? (
          <CheckCheck size={18} strokeWidth={3} />
        ) : (
          <Download size={18} />
        )}
      </button>
    </div>
  );
}

function DictionaryView({
  onBack,
  theme,
}: {
  onBack: () => void;
  theme: "light" | "dark";
}) {
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(() => {
    try {
      const lastWord = localStorage.getItem("mw_dict_last_word");
      if (lastWord && ACADEMIC_DICTIONARY[lastWord.toLowerCase()]) {
        return ACADEMIC_DICTIONARY[lastWord.toLowerCase()];
      }
    } catch {}
    return ACADEMIC_DICTIONARY["photosynthesis"] || null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dictionaryCache, setDictionaryCache] = useState<Record<string, any>>(
    () => {
      try {
        const saved = localStorage.getItem("mw_dictionary_cache_v2");
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    },
  );

  const speak = (text: string) => {
    try {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const utterance = new SpeechSynthesisUtterance(text);

      const setVoiceAndSpeak = () => {
        try {
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(
            (v) =>
              (v.name?.toLowerCase()?.includes("google us english") ||
                v.name?.toLowerCase()?.includes("natural") ||
                v.name?.toLowerCase()?.includes("english") ||
                v.name?.toLowerCase()?.includes("male") ||
                v.name?.toLowerCase()?.includes("david")) &&
              v.lang?.startsWith("en"),
          );

          if (preferredVoice) {
            utterance.voice = preferredVoice;
          } else if (voices.length > 0) {
            utterance.voice = voices.find((v) => v.lang?.startsWith("en")) || voices[0];
          }

          utterance.pitch = 0.95;
          utterance.rate = 0.95;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        } catch (innerErr) {
          console.warn("Speech voice selection ignored:", innerErr);
        }
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
      } else {
        setVoiceAndSpeak();
      }
    } catch (e) {
      console.warn("Speech synthesis notice:", e);
    }
  };

  const performSearch = async (searchTerm: string) => {
    const rawWord = searchTerm.trim();
    if (!rawWord) return;
    const wordKey = rawWord.toLowerCase();

    setLoading(true);
    setError("");

    try {
      localStorage.setItem("mw_dict_last_word", wordKey);
    } catch {}

    // 1. Check local persistent cache
    if (dictionaryCache[wordKey]) {
      setResult(dictionaryCache[wordKey]);
      setLoading(false);
      return;
    }

    // 2. Check built-in curated academic dictionary
    if (ACADEMIC_DICTIONARY[wordKey]) {
      const localEntry = ACADEMIC_DICTIONARY[wordKey];
      const nextCache = { ...dictionaryCache, [wordKey]: localEntry };
      setDictionaryCache(nextCache);
      try {
        localStorage.setItem("mw_dictionary_cache_v2", JSON.stringify(nextCache));
      } catch {}
      setResult(localEntry);
      setLoading(false);
      return;
    }

    // 3. Try Free Dictionary API with timeout
    let found = false;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const cleanWord = encodeURIComponent(wordKey.replace(/[^a-zA-Z0-9 -]/g, ""));
      const dictRes = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (dictRes.ok) {
        const data = await dictRes.json();
        if (Array.isArray(data) && data.length > 0) {
          const entry = data[0];
          const formattedResult = {
            word: entry.word || rawWord,
            phonetic:
              entry.phonetic ||
              entry.phonetics?.find((p: any) => p.text)?.text ||
              "",
            meanings: (entry.meanings || []).map((m: any) => ({
              partOfSpeech: m.partOfSpeech || "general",
              definitions: (m.definitions || []).slice(0, 3).map((d: any) => ({
                definition: d.definition,
                example: d.example || (d.synonyms?.length ? `Synonyms: ${d.synonyms.slice(0, 4).join(", ")}` : undefined),
              })),
            })),
            synonyms: entry.meanings?.flatMap((m: any) => m.synonyms || []).slice(0, 6),
          };

          const nextCache = { ...dictionaryCache, [wordKey]: formattedResult };
          setDictionaryCache(nextCache);
          try {
            localStorage.setItem(
              "mw_dictionary_cache_v2",
              JSON.stringify(nextCache),
            );
          } catch {}
          setResult(formattedResult);
          found = true;
        }
      }
    } catch (apiErr) {
      console.warn("Free Dictionary API attempt timed out or failed:", apiErr);
    }

    if (found) {
      setLoading(false);
      return;
    }

    // 4. Fallback to Gemini AI Dictionary Endpoint with timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const aiRes = await fetch("/api/gemini/dictionary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: rawWord }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        if (aiData && aiData.meanings && aiData.meanings.length > 0) {
          const formattedAiResult = {
            word: aiData.word || rawWord,
            phonetic: aiData.phonetic || "",
            meanings: aiData.meanings,
            synonyms: aiData.synonyms || [],
            subject: aiData.subject || "Academic & General Vocabulary",
          };

          const nextCache = { ...dictionaryCache, [wordKey]: formattedAiResult };
          setDictionaryCache(nextCache);
          try {
            localStorage.setItem(
              "mw_dictionary_cache_v2",
              JSON.stringify(nextCache),
            );
          } catch {}
          setResult(formattedAiResult);
          setLoading(false);
          return;
        }
      }
    } catch (aiErr) {
      console.warn("Gemini dictionary fallback error:", aiErr);
    }

    // 5. Final fallback check if any partial match in local dictionary exists
    const partialMatchKey = Object.keys(ACADEMIC_DICTIONARY).find(
      (k) => k.includes(wordKey) || wordKey.includes(k)
    );
    if (partialMatchKey) {
      setResult(ACADEMIC_DICTIONARY[partialMatchKey]);
      setLoading(false);
      return;
    }

    setError(`Could not find a definition for "${rawWord}". Please check spelling or select one of the suggested academic topics below.`);
    setLoading(false);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    performSearch(query);
  };

  const handleChipClick = (word: string) => {
    setQuery(word);
    performSearch(word);
  };

  const SUBJECT_CATEGORIES = [
    "All",
    "Biology",
    "Physics",
    "Chemistry",
    "Mathematics",
    "English",
    "Geography",
    "Agriculture",
    "History",
  ];

  const filteredWords = selectedSubjectFilter === "All"
    ? POPULAR_DICTIONARY_WORDS
    : Object.values(ACADEMIC_DICTIONARY)
        .filter((entry) => {
          const subj = (entry.subject || "").toLowerCase();
          return subj.includes(selectedSubjectFilter.toLowerCase());
        })
        .map((e) => e.word)
        .slice(0, 15);

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col ${theme === "dark" ? "bg-gray-950 text-gray-100" : "bg-slate-50 text-slate-900"} animate-in slide-in-from-right duration-300`}
    >
      {/* Header */}
      <div
        className={`${theme === "dark" ? "bg-gray-900/90 border-gray-800 text-white" : "bg-white/90 border-slate-200 text-slate-900"} backdrop-blur-xl pt-4 pb-3 px-5 flex items-center justify-between shrink-0 z-10 border-b shadow-md`}
      >
        <div className="flex items-center">
          <button
            onClick={onBack}
            className={`w-10 h-10 ${theme === "dark" ? "bg-gray-800 text-white hover:bg-gray-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"} rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform`}
          >
            <ChevronLeft size={24} strokeWidth={3} />
          </button>
          <div className="ml-4">
            <h2
              className={`font-black ${theme === "dark" ? "text-white" : "text-slate-900"} text-lg leading-tight uppercase tracking-tight`}
            >
              Academic Dictionary
            </h2>
            <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-widest mt-0.5">
              MSCE & JCE Syllabus Lexicon
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-16 hide-scrollbar max-w-4xl mx-auto w-full space-y-5">
        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200 shadow-md"} rounded-[2rem] px-5 py-3 flex items-center border transition-all focus-within:border-indigo-500/50 group`}
        >
          <Search
            className="text-gray-400 mr-3 group-focus-within:text-indigo-500 transition-colors"
            size={20}
            strokeWidth={2.5}
          />
          <input
            type="text"
            placeholder="Search academic terms (e.g. Osmosis, Velocity, Metaphor)..."
            className={`bg-transparent outline-none flex-1 ${theme === "dark" ? "text-white" : "text-slate-900"} text-sm sm:text-base font-semibold placeholder-gray-400`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query.trim() && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-bold mr-2 px-1"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform disabled:opacity-30 shrink-0"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowRight size={18} strokeWidth={3} />
            )}
          </button>
        </form>

        {/* Subject Filter Pills */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">
            <Sparkles size={13} className="text-indigo-500" />
            <span>Curriculum Categories</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
            {SUBJECT_CATEGORIES.map((cat) => {
              const isSelected = selectedSubjectFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedSubjectFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 border shrink-0 ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : theme === "dark"
                      ? "bg-gray-900 text-gray-300 border-gray-800 hover:bg-gray-800 hover:text-white"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Popular / Filtered Terms Chips */}
        <div>
          <div className="flex flex-wrap gap-2">
            {(filteredWords.length > 0 ? filteredWords : POPULAR_DICTIONARY_WORDS).map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => handleChipClick(word)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 border capitalize ${
                  (query && query.toLowerCase() === word.toLowerCase()) || (result && result.word.toLowerCase() === word.toLowerCase())
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : theme === "dark"
                    ? "bg-gray-900 text-gray-300 border-gray-800 hover:bg-gray-800 hover:text-white"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600"
                }`}
              >
                {word}
              </button>
            ))}
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-2xl text-center text-sm font-bold">
            {error}
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom duration-300">
            <div
              className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200 shadow-sm"} rounded-[28px] p-6 sm:p-8 border mb-6`}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3
                      className={`font-black text-3xl sm:text-4xl ${theme === "dark" ? "text-white" : "text-slate-900"} capitalize tracking-tight`}
                    >
                      {result.word}
                    </h3>
                    {result.subject && (
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                        {result.subject}
                      </span>
                    )}
                  </div>
                  {result.phonetic && (
                    <p className="text-sm text-indigo-500 dark:text-indigo-400 font-bold tracking-wider mt-1 font-mono">
                      {result.phonetic}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  title="Listen to pronunciation"
                  onClick={() => speak(result.word)}
                  className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center rounded-2xl shadow-lg shadow-indigo-600/30 active:scale-90 transition-transform shrink-0"
                >
                  <Volume2 size={24} />
                </button>
              </div>

              {/* Meanings & Definitions */}
              <div className="space-y-6">
                {result.meanings && result.meanings.map((meaning: any, i: number) => (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm uppercase tracking-wider font-mono">
                        {meaning.partOfSpeech}
                      </span>
                      <div
                        className={`h-px ${theme === "dark" ? "bg-gray-800" : "bg-slate-200"} flex-1`}
                      ></div>
                    </div>
                    <ul className="space-y-4">
                      {meaning.definitions && meaning.definitions.map((def: any, idx: number) => (
                        <li
                          key={idx}
                          className={`${theme === "dark" ? "text-gray-200" : "text-slate-800"} text-base sm:text-lg leading-relaxed font-semibold border-l-4 border-indigo-500 pl-4 py-0.5`}
                        >
                          <div>{def.definition}</div>
                          {def.example && (
                            <div
                              className={`mt-2.5 p-3.5 rounded-xl ${theme === "dark" ? "bg-indigo-950/30 text-indigo-200 border-indigo-900/40" : "bg-indigo-50 text-indigo-900 border-indigo-100"} text-xs sm:text-sm font-medium leading-relaxed border`}
                            >
                              <span className="text-[10px] uppercase font-black tracking-wider text-indigo-500 block mb-1">
                                Usage Example
                              </span>
                              "{def.example}"
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Synonyms if available */}
                {result.synonyms && result.synonyms.length > 0 && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                    <span className="text-xs uppercase font-black tracking-wider text-gray-400 block mb-2">
                      Related Concepts & Synonyms:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {result.synonyms.map((syn: string, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleChipClick(syn)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${theme === "dark" ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                        >
                          {syn}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!result && !error && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center">
            <div
              className={`w-20 h-20 rounded-3xl ${theme === "dark" ? "bg-gray-900 text-gray-700" : "bg-slate-100 text-slate-300"} flex items-center justify-center mb-4`}
            >
              <BookA size={38} strokeWidth={1.5} />
            </div>
            <h4 className="font-bold text-sm text-gray-500 uppercase tracking-widest mb-1">
              Search Any Academic or General Term
            </h4>
            <p className="text-xs text-gray-400 max-w-sm">
              Instant curriculum-aligned definitions, pronunciation audio, parts of speech, and usage context.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function QuizzesView({
  onBack,
  theme,
  onStartQuiz,
}: {
  onBack: () => void;
  theme: "light" | "dark";
  onStartQuiz: (questions: any[], topic: string) => void;
}) {
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [publicQuizzes, setPublicQuizzes] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem("mw_public_quizzes_cache");
      return cached ? JSON.parse(cached) : DEFAULT_QUIZZES;
    } catch {
      return DEFAULT_QUIZZES;
    }
  });

  useEffect(() => {
    let isMounted = true;
    const safetyTimeout = setTimeout(() => {
      if (isMounted && (!publicQuizzes || publicQuizzes.length === 0)) {
        setPublicQuizzes(DEFAULT_QUIZZES);
      }
    }, 2500);

    const q = query(
      collection(db, "quizzes"),
      orderBy("createdAt", "desc"),
      limit(10),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!isMounted) return;
        clearTimeout(safetyTimeout);
        if (!snapshot.empty) {
          const liveData: any[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          // Merge with DEFAULT_QUIZZES so user always has plenty
          const merged = [...liveData, ...DEFAULT_QUIZZES.filter(dq => !liveData.some((ld: any) => ld.topic === dq.topic))];
          setPublicQuizzes(merged);
          try {
            localStorage.setItem("mw_public_quizzes_cache", JSON.stringify(merged));
          } catch {}
        }
      },
      (error) => {
        clearTimeout(safetyTimeout);
        if (!error.message.includes("offline")) {
          console.warn("Quizzes snapshot notice:", error);
        }
      }
    );
    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, []);

  const [quizHistory, setQuizHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("mw_quiz_history_cache");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const SUGGESTED_TOPICS = [
    "Biology: Genetics & Heredity",
    "Math: Quadratic Equations",
    "Chemistry: Acids & Bases",
    "Physics: Forces & Newton's Laws",
    "English: Grammar & Figure of Speech",
    "Geography: Weather & ITCZ",
    "Agriculture: Soil Fertility",
  ];

  const generateAIQuiz = async () => {
    if (!topic.trim()) return;

    if (!navigator.onLine) {
      alert(
        "You are offline! You can practice the offline syllabus quizzes and your history listed below without internet.",
      );
      return;
    }

    setIsGenerating(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      const response = await fetch("/api/gemini/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, numQuestions }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server Error: ${response.status}`);
      }

      const data = await response.json();

      const questions = JSON.parse(data.text || "[]");
      if (questions.length > 0) {
        try {
          const updatedCache = [
            { topic, questions, date: new Date().toLocaleDateString() },
            ...quizHistory.filter(
              (q: any) => q.topic.toLowerCase() !== topic.toLowerCase(),
            ),
          ].slice(0, 10);
          setQuizHistory(updatedCache);
          localStorage.setItem(
            "mw_quiz_history_cache",
            JSON.stringify(updatedCache),
          );

          await addDoc(collection(db, "quizzes"), {
            topic,
            questions,
            createdAt: serverTimestamp(),
          });
        } catch (e) {
          console.error("Quiz cache/db save error:", e);
        }
        onStartQuiz(questions, topic);
      } else {
        throw new Error("Invalid output from AI");
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Quiz generation error:", err);
      let errorMsg =
        err.message || "Failed to generate quiz. Please try again.";
      if (err.name === "AbortError") {
        errorMsg =
          "Request timed out. The server is taking too long. Please try again.";
      }
      alert(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const startPredefinedQuiz = (name: string) => {
    const found = DEFAULT_QUIZZES.find(q => q.topic.toLowerCase().includes(name.toLowerCase()));
    if (found) {
      onStartQuiz(found.questions, found.topic);
      return;
    }
    const fallbackQuiz = DEFAULT_QUIZZES[0];
    onStartQuiz(fallbackQuiz.questions, fallbackQuiz.topic);
  };

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col ${theme === "dark" ? "bg-gray-950" : "bg-slate-50"} animate-in slide-in-from-right duration-300`}
    >
      {/* Fixed Header */}
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
            Quiz Center
          </h2>
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">
            Test Your Knowledge
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-32 space-y-7 hide-scrollbar max-w-4xl mx-auto w-full">
        {/* AI Generation Card */}
        <div
          className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200 shadow-sm"} p-6 rounded-[32px] border relative overflow-hidden group`}
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Bot size={22} />
              </div>
              <div>
                <h3
                  className={`text-lg font-black ${theme === "dark" ? "text-white" : "text-slate-900"} leading-tight`}
                >
                  AI Quiz Generator
                </h3>
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">
                  Custom Examinations & Instant Quizzes
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div
                className={`${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-slate-50 border-slate-100 shadow-inner"} rounded-2xl p-4 flex items-center border`}
              >
                <Sparkles className="text-gray-500 mr-3 shrink-0" size={18} />
                <input
                  type="text"
                  placeholder="Enter topic (e.g. MSCE Biology Genetics)"
                  className={`bg-transparent outline-none flex-1 ${theme === "dark" ? "text-white" : "text-slate-900"} text-sm font-bold placeholder-gray-600 h-6`}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              {/* Quick Topic Pills */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-2">
                  Quick Topic Recommendations:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_TOPICS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopic(t)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                        topic === t
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : theme === "dark"
                          ? "bg-gray-950 text-gray-400 border-gray-800 hover:text-white"
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:text-indigo-600"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">
                    Questions: {numQuestions}
                  </span>
                  <input
                    type="range"
                    min="5"
                    max="10"
                    step="1"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 h-1.5 rounded-full bg-gray-800"
                  />
                </div>
                <button
                  onClick={generateAIQuiz}
                  disabled={!topic.trim() || isGenerating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] py-3.5 px-6 rounded-2xl active:scale-95 transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50 tracking-widest uppercase"
                >
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Generate"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cached / Offline Practiced Quizzes */}
        {quizHistory.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3
                className={`font-black ${theme === "dark" ? "text-white" : "text-slate-900"} text-sm uppercase tracking-wider`}
              >
                Practiced Offline Quizzes
              </h3>
              <span className="text-[8px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest font-black">
                Ready Offline
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {quizHistory.map((q, idx) => (
                <div
                  key={idx}
                  className={`${theme === "dark" ? "bg-gray-900/60 border-gray-800/80 hover:bg-gray-900" : "bg-white border-slate-200 shadow-sm hover:bg-slate-50"} rounded-2xl p-4 border flex items-center justify-between transition-all group`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-500/10 text-indigo-500 rounded-lg flex items-center justify-center shrink-0">
                      <CheckCheck size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4
                        className={`text-xs font-black ${theme === "dark" ? "text-white" : "text-slate-900"} capitalize truncate`}
                      >
                        {q.topic}
                      </h4>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                        {q.questions.length} Questions • Saved {q.date}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onStartQuiz(q.questions, q.topic)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] uppercase tracking-widest font-black rounded-lg active:scale-95 transition-transform shrink-0"
                  >
                    Start
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Challenge Banner */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-7 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-1.5 leading-tight">
              Daily Challenge: Mathematics
            </h3>
            <p className="text-indigo-100 text-xs font-bold leading-relaxed mb-5 max-w-[240px]">
              Complete today's challenge to earn 500 bonus MSCE knowledge points.
            </p>
            <button
              onClick={() => startPredefinedQuiz("Mathematics")}
              className="bg-white text-indigo-700 font-black text-xs py-2.5 px-5 rounded-xl active:scale-95 transition-all shadow-md uppercase tracking-wider"
            >
              Start Challenge
            </button>
          </div>
          <Target
            className="absolute top-1/2 right-[-15px] -translate-y-1/2 text-white/10 w-40 h-40"
            strokeWidth={1}
          />
        </div>

        {/* Community & Syllabus Quizzes Grid */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3
              className={`font-black ${theme === "dark" ? "text-white" : "text-slate-900"} text-sm uppercase tracking-wider`}
            >
              Syllabus & Community Quizzes
            </h3>
            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">
              {publicQuizzes.length} Quizzes Ready
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {publicQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200 shadow-sm"} rounded-[28px] p-5 border flex flex-col justify-between group relative overflow-hidden`}
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                <div className="flex items-start gap-3.5 mb-4">
                  <div
                    className={`w-12 h-12 ${theme === "dark" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-indigo-50 text-indigo-600 border-indigo-100"} rounded-2xl flex items-center justify-center border shrink-0`}
                  >
                    <BrainCircuit size={24} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4
                      className={`font-black text-sm ${theme === "dark" ? "text-white" : "text-slate-900"} mb-1 leading-snug line-clamp-2`}
                    >
                      {quiz.topic}
                    </h4>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      {quiz.questions?.length || 5} Questions • {quiz.level || "MSCE & JCE"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onStartQuiz(quiz.questions, quiz.topic)}
                  className={`w-full ${theme === "dark" ? "bg-gray-950 border-gray-800 text-white hover:bg-gray-800" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"} font-black py-3 rounded-xl border active:scale-95 transition-all text-[10px] tracking-widest uppercase`}
                >
                  Begin Quiz
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuizTakingView({
  questions,
  topic,
  onEnd,
  theme,
  profile,
  onUpdateProfile,
}: {
  questions: any[];
  topic: string;
  onEnd: () => void;
  theme: "light" | "dark";
  profile?: any;
  onUpdateProfile?: (p: any) => void;
}) {
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(questions.length * 30); // 30s per question
  const [isCorrect, setIsCorrect] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(0);

  const finishQuiz = async (finalScore: number) => {
    setShowResult(true);
    if (profile && onUpdateProfile && auth.currentUser) {
      const completedQuizzes = profile.completedQuizzes || [];
      const quizId = topic.toLowerCase();
      let xpGained = 0;

      if (!completedQuizzes.includes(quizId)) {
        xpGained = 2; // Base XP for completing the quiz

        const percentCorrect = finalScore / questions.length;
        const percentTimeLeft = timeLeft / (questions.length * 30);
        // Reward 3 XP if time + correct answers were well balanced
        if (percentCorrect >= 0.7 && percentTimeLeft >= 0.3) {
          xpGained = 3;
        }

        setXpAwarded(xpGained);
        if (xpGained > 0) {
          const newPoints = (profile.points || 0) + xpGained;
          const newCompleted = [...completedQuizzes, quizId];
          
          // Achievement Checks
          let newAchievements = [...(profile.achievements || [])];
          const hasBadge = (id: string) => newAchievements.includes(id);

          // 1. First Quiz Mastered (Score >= 80% on first completion)
          if (!hasBadge("first_quiz") && percentCorrect >= 0.8) {
            newAchievements.push("first_quiz");
          }
          // 2. Academic Explorer (Completed 5 unique quizzes)
          if (!hasBadge("academic_explorer") && newCompleted.length >= 5) {
            newAchievements.push("academic_explorer");
          }
          // 3. Perfect Score
          let hasPerfectStore = !!profile.hasPerfectScore;
          if (percentCorrect === 1) {
            hasPerfectStore = true;
            if (!hasBadge("perfect_score")) {
              newAchievements.push("perfect_score");
            }
          }

          try {
            await updateDoc(doc(db, "users", auth.currentUser.uid), {
              points: newPoints,
              completedQuizzes: newCompleted,
              achievements: newAchievements,
              hasPerfectScore: hasPerfectStore,
            });
            onUpdateProfile({
              ...profile,
              points: newPoints,
              completedQuizzes: newCompleted,
              achievements: newAchievements,
              hasPerfectScore: hasPerfectStore,
            });
          } catch (e) {
            console.error("Failed to update XP:", e);
          }
        }
      } else {
        setXpAwarded(0); // No XP if already taken
      }
    }
  };

  useEffect(() => {
    if (showResult || showFeedback) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishQuiz(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showResult, showFeedback, score, profile, onUpdateProfile]);

  const handleAnswer = (opt: string) => {
    if (showFeedback) return;
    setSelectedOption(opt);
    const correct = opt === questions[qIndex].answer;
    setIsCorrect(correct);
    if (correct) {
      setScore((s) => s + 1);
    }
    setShowFeedback(true);
  };

  const nextQuestion = () => {
    if (qIndex + 1 < questions.length) {
      setQIndex((q) => q + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      finishQuiz(score);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (showResult) {
    const percentage = (score / questions.length) * 100;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed inset-0 z-[200] flex flex-col items-center justify-center ${theme === "dark" ? "bg-gray-950" : "bg-slate-50"} px-6 text-center overflow-y-auto`}
      >
        {/* Trophy/Badge with pop animation and sparkle particles */}
        <div className="relative mb-6">
          {percentage >= 80 && (
            <>
              {/* Outer pulsing halo animation */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.45, 1], opacity: [0.2, 0.45, 0.2] }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl"
              />

              {/* Left Star burst */}
              <motion.div
                initial={{ scale: 0, x: 0, y: 0, rotate: 0 }}
                animate={{ scale: [0, 1.25, 1], x: -65, y: -20, rotate: 360 }}
                transition={{ type: "spring", delay: 0.2, stiffness: 120 }}
                className="absolute text-amber-500"
              >
                <Star size={24} fill="currentColor" />
              </motion.div>

              {/* Right Star burst */}
              <motion.div
                initial={{ scale: 0, x: 0, y: 0, rotate: 0 }}
                animate={{ scale: [0, 1.25, 1], x: 65, y: -20, rotate: -360 }}
                transition={{ type: "spring", delay: 0.3, stiffness: 120 }}
                className="absolute text-amber-500"
              >
                <Star size={20} fill="currentColor" />
              </motion.div>

              {/* Top Sparkle */}
              <motion.div
                initial={{ scale: 0, x: 0, y: 0, rotate: 0 }}
                animate={{ scale: [0, 1.5, 1], x: 0, y: -72, rotate: 180 }}
                transition={{ type: "spring", delay: 0.4, stiffness: 150 }}
                className="absolute text-amber-300"
              >
                <Sparkles size={28} fill="currentColor" />
              </motion.div>

              {/* Expanding dash border */}
              <motion.div
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ delay: 0.1, duration: 0.8, ease: "easeOut" }}
                className="absolute inset-0 border-2 border-dashed border-amber-400 rounded-full"
              />
            </>
          )}

          {/* Core Badge Circle */}
          <motion.div
            initial={{ scale: 0, rotate: -25 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 160,
              damping: 12,
              delay: 0.1,
            }}
            className={`w-36 h-36 ${percentage >= 80 ? "bg-gradient-to-tr from-amber-500/20 to-yellow-500/5 text-amber-500 border-2 border-amber-400/30" : percentage >= 50 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"} rounded-full flex items-center justify-center shadow-2xl relative z-10`}
          >
            {percentage >= 50 ? (
              <Trophy
                size={72}
                fill={percentage >= 80 ? "currentColor" : "none"}
                className={percentage >= 80 ? "animate-pulse" : ""}
              />
            ) : (
              <Target size={72} />
            )}
          </motion.div>
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`text-4xl font-black ${theme === "dark" ? "text-white" : "text-slate-900"} mb-2 tracking-tighter`}
        >
          {percentage >= 80
            ? "Exceptional score!"
            : percentage >= 50
              ? "Quiz Complete!"
              : "Keep Practicing!"}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-500 font-bold text-lg mb-6 uppercase tracking-widest"
        >
          Topic: <span className="text-indigo-400">{topic}</span>
        </motion.p>

        {xpAwarded > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.4 }}
            className="mb-8 bg-amber-500/20 text-amber-500 px-6 py-2 rounded-full font-black text-sm flex items-center gap-2"
          >
            <Flame size={18} fill="currentColor" /> +{xpAwarded} XP Earned!
          </motion.div>
        )}

        {/* Animated Accuracy Progress Bar */}
        <div className="w-full max-w-sm mb-8 px-2 text-left">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Performance Quotient
            </span>
            <span className="text-xs font-black text-indigo-500">
              {Math.round(percentage)}%
            </span>
          </div>
          <div
            className={`h-3 w-full rounded-full overflow-hidden border ${theme === "dark" ? "bg-gray-900 border-gray-800 shadow-inner" : "bg-slate-100 border-slate-200"}`}
          >
            <motion.div
              className={`h-full rounded-full ${percentage >= 80 ? "bg-gradient-to-r from-indigo-500 to-emerald-500" : "bg-indigo-500"}`}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            />
          </div>
        </div>

        {/* Score Details */}
        <div className="flex gap-4 mb-10 w-full max-w-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
            className={`flex-1 ${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"} p-6 rounded-3xl border shadow-sm`}
          >
            <div
              className={`text-3xl font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}
            >
              {score}/{questions.length}
            </div>
            <div className="text-[10px] uppercase font-black text-gray-500 tracking-widest mt-1">
              Score
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
            className={`flex-1 ${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"} p-6 rounded-3xl border shadow-sm`}
          >
            <div
              className={`text-3xl font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}
            >
              {Math.round(percentage)}%
            </div>
            <div className="text-[10px] uppercase font-black text-gray-500 tracking-widest mt-1">
              Accuracy
            </div>
          </motion.div>
        </div>

        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={onEnd}
          className="w-full max-w-sm bg-indigo-600 text-white font-black py-5 rounded-[2.5rem] active:scale-95 transition-all text-lg shadow-2xl shadow-indigo-600/40 hover:bg-indigo-700"
        >
          Finish Session
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col ${theme === "dark" ? "bg-gray-950" : "bg-slate-50"} animate-in slide-in-from-bottom duration-500`}
    >
      {/* Immersive Header */}
      <div
        className={`${theme === "dark" ? "bg-gray-900/50 border-gray-800" : "bg-white/50 border-slate-200"} backdrop-blur-md pt-4 pb-2 px-6 flex items-center justify-between z-10 border-b`}
      >
        <button
          onClick={onEnd}
          className={`w-10 h-10 ${theme === "dark" ? "bg-gray-800 text-gray-400" : "bg-slate-100 text-slate-500"} rounded-xl flex items-center justify-center active:scale-90 transition-transform`}
        >
          <X size={20} strokeWidth={3} />
        </button>

        <div className="flex-1 max-w-[140px] mx-4">
          <div
            className={`h-2.5 w-full ${theme === "dark" ? "bg-gray-800" : "bg-slate-200"} rounded-full overflow-hidden shadow-inner`}
          >
            <motion.div
              className="h-full bg-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((qIndex + 1) / questions.length) * 100}%` }}
              transition={{ type: "spring", stiffness: 85, damping: 13 }}
            />
          </div>
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${timeLeft < 10 ? "bg-red-500 text-white" : theme === "dark" ? "bg-gray-800 text-indigo-400" : "bg-indigo-50 text-indigo-600"} transition-colors`}
        >
          <Clock size={14} strokeWidth={3} />
          <span className="text-xs font-black tracking-tighter">
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="flex-1 px-6 pt-10 overflow-y-auto pb-32 hide-scrollbar">
        <div className="flex items-center justify-between mb-8">
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">
            Question {qIndex + 1} of {questions.length}
          </span>
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
            Points: {score * 100}
          </span>
        </div>

        <h3
          className={`text-2xl font-black ${theme === "dark" ? "text-white" : "text-slate-900"} leading-tight mb-10`}
        >
          {questions[qIndex].q}
        </h3>

        <div className="space-y-4">
          {questions[qIndex].options.map((opt: string, i: number) => {
            const isSelected = selectedOption === opt;
            const isAnswer = opt === questions[qIndex].answer;

            let variantClass =
              theme === "dark"
                ? "bg-gray-900 border-gray-800 text-gray-300"
                : "bg-white border-slate-200 text-slate-700";

            if (showFeedback) {
              if (isAnswer) {
                variantClass =
                  "bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20";
              } else if (isSelected && !isAnswer) {
                variantClass =
                  "bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/20";
              } else {
                variantClass =
                  theme === "dark"
                    ? "bg-gray-900/30 border-gray-800 text-gray-600 opacity-50"
                    : "bg-slate-50 border-slate-100 text-slate-400 opacity-50";
              }
            } else if (isSelected) {
              variantClass =
                "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20";
            }

            return (
              <button
                key={i}
                disabled={showFeedback}
                onClick={() => handleAnswer(opt)}
                className={`w-full flex items-center justify-between px-6 py-5 rounded-[24px] border-2 font-bold text-left transition-all ${variantClass} ${!showFeedback && "hover:-translate-y-1 active:scale-95"}`}
              >
                <span className="text-[15px]">{opt}</span>
                {showFeedback && isAnswer && (
                  <CheckCircle size={20} strokeWidth={3} />
                )}
                {showFeedback && isSelected && !isAnswer && (
                  <ShieldAlert size={20} strokeWidth={3} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Persistent Feedback Bottom Sheet */}
      {showFeedback && (
        <div
          className={`absolute bottom-0 left-0 right-0 z-20 ${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200 shadow-[0_-10px_50px_rgba(0,0,0,0.1)]"} p-8 border-t rounded-t-[3rem] animate-in slide-in-from-bottom duration-300`}
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isCorrect ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}
            >
              {isCorrect ? <ThumbsUp size={24} /> : <HelpCircle size={24} />}
            </div>
            <div>
              <h4
                className={`text-xl font-black ${isCorrect ? "text-emerald-500" : "text-red-500"}`}
              >
                {isCorrect ? "Brilliant! Correct" : "Not quite right"}
              </h4>
              {!isCorrect && (
                <p
                  className={`text-[10px] font-black uppercase tracking-widest ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}
                >
                  Correct:{" "}
                  <span className="text-emerald-500">
                    {questions[qIndex].answer}
                  </span>
                </p>
              )}
            </div>
          </div>

          <p
            className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-slate-600"} font-bold leading-relaxed mb-6 bg-gray-950/20 p-4 rounded-2xl border border-white/5`}
          >
            {questions[qIndex].summary}
          </p>

          <button
            onClick={nextQuestion}
            className="w-full bg-gray-100 text-gray-900 font-black py-4 rounded-2xl active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 group hover:bg-white"
          >
            {qIndex + 1 === questions.length
              ? "Show My Results"
              : "Continue Learning"}
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
              strokeWidth={3}
            />
          </button>
        </div>
      )}
    </div>
  );
}

function ProfileView({
  onBack,
  profile,
  onUpdate,
  onLogout,
  theme,
  onThemeToggle,
  onShowNotifications,
  onNavigate,
  onShowSettings,
  isAdmin,
}: {
  onBack: () => void;
  profile: any;
  onUpdate: (p: any) => void;
  onLogout: () => void;
  theme: "light" | "dark";
  onThemeToggle: () => void;
  onShowNotifications: () => void;
  onNavigate: (view: ViewState) => void;
  onShowSettings: () => void;
  isAdmin: boolean;
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [tempName, setTempName] = useState(profile?.name || "");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showLevelPicker, setShowLevelPicker] = useState(false);

  // Sync tempName if profile loads late
  useEffect(() => {
    if (profile?.name && !tempName) {
      setTempName(profile.name);
    }
  }, [profile?.name]);

  if (!profile) {
    return <EmiLoader text="Loading Profile..." theme={theme} />;
  }

  const referralLink = `${window.location.origin}/?ref=${profile?.referralCode || "MW-LINK"}`;
  const earnedAchievementIds = profile?.achievements || [];

  const forms = ["Form 1", "Form 2", "Form 3", "Form 4"];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const menuItems = [
    {
      icon: Award,
      label: "My Achievements",
      activeLabel: earnedAchievementIds.length + " Unlocked",
      color: "text-amber-500",
      onClick: () => onNavigate("achievements"),
    },
    {
      icon: CreditCard,
      label: "Subscription & Pay",
      color: "text-indigo-400",
      onClick: () => onNavigate("subscription"),
    },
    ...(isAdmin
      ? [
          {
            icon: ShieldCheck,
            label: "Admin Panel",
            color: "text-amber-500",
            onClick: () => onNavigate("admin"),
          },
        ]
      : []),
    {
      icon: Settings,
      label: "App Settings",
      color: "text-gray-400",
      onClick: onShowSettings,
    },
  ];

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col ${theme === "dark" ? "bg-gray-950" : "bg-slate-50"} animate-in slide-in-from-right duration-300`}
    >
      {/* Fixed Header */}
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
            Profile
          </h2>
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">
            Your Stats & Settings
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-10 pb-32 space-y-10 scroll-smooth">
        {/* User Card */}
        <div className="flex flex-col items-center">
          <div className="relative mb-6 group">
            <div
              className={`w-32 h-32 rounded-[40px] ${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"} border-2 p-1.5 shadow-2xl shadow-indigo-600/20`}
            >
              <div
                className={`w-full h-full rounded-[32px] overflow-hidden border ${theme === "dark" ? "border-gray-800 bg-gray-950" : "border-slate-200 bg-slate-50"} relative`}
              >
                <Avatar
                  user={profile}
                  className="w-full h-full text-5xl rounded-none"
                />
                <button
                  onClick={() => setShowAvatarPicker(true)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                >
                  <Camera size={24} className="text-white" />
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowAvatarPicker(true)}
              className={`absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center border-4 ${theme === "dark" ? "border-gray-950" : "border-slate-50"} shadow-xl active:scale-90 transition-transform`}
            >
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>

          <div className="text-center">
            {isEditingName ? (
              <div className="flex flex-col items-center gap-3">
                <input
                  autoFocus
                  className={`bg-transparent border-b-2 border-indigo-500 text-2xl font-black text-center outline-none w-48 py-1 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={() => {
                    onUpdate({ ...profile, name: tempName });
                    setIsEditingName(false);
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.target as HTMLInputElement).blur()
                  }
                />
                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">
                  Tap out to save
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <h3
                  className={`text-3xl font-black ${theme === "dark" ? "text-white" : "text-slate-900"} flex items-center gap-2 tracking-tight`}
                  onClick={() => setIsEditingName(true)}
                >
                  {profile.name}{" "}
                  {profile.isPro && (
                    <Crown
                      size={22}
                      className="text-yellow-400 drop-shadow-md"
                    />
                  )}{" "}
                  <Smile size={20} className="text-indigo-400 opacity-60" />
                </h3>
                {profile.isPro && (
                  <div className="mt-1 px-3 py-0.5 bg-yellow-400/10 border border-yellow-400/20 rounded-full">
                    <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">
                      Pro Student
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setShowLevelPicker(true)}
                  className={`mt-3 inline-flex items-center gap-2 ${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"} px-4 py-1.5 rounded-full border active:scale-95 transition-all group shadow-sm`}
                >
                  <span
                    className={`text-[10px] font-black ${theme === "dark" ? "text-gray-400" : "text-slate-500"} uppercase tracking-widest leading-none`}
                  >
                    {profile.level || "Form 4"} Student
                  </span>
                  <ChevronDown
                    size={12}
                    className="text-indigo-500 group-hover:translate-y-0.5 transition-transform"
                  />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <div
            className={`flex-1 ${theme === "dark" ? "bg-gray-900/50 border-gray-800" : "bg-white border-slate-200 shadow-sm"} p-3 rounded-2xl border flex flex-col items-center group`}
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
              <Target size={14} />
            </div>
            <div
              className={`text-lg font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}
            >
              {profile.points}
            </div>
            <div className="text-[7px] uppercase font-black text-gray-500 tracking-[0.2em] mt-0.5">
              Total XP
            </div>
          </div>
          <div
            className={`flex-1 ${theme === "dark" ? "bg-gray-900/50 border-gray-800" : "bg-white border-slate-200 shadow-sm"} p-3 rounded-2xl border flex flex-col items-center group`}
          >
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
              <Flame size={14} fill="currentColor" />
            </div>
            <div
              className={`text-lg font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}
            >
              {profile.streak || 1}
            </div>
            <div className="text-[7px] uppercase font-black text-gray-500 tracking-[0.2em] mt-0.5">
              Day Streak
            </div>
          </div>
        </div>

        {/* Earned Badges Row */}
        {earnedAchievementIds.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}>
                Badge Showcase
              </span>
              <button 
                onClick={() => onNavigate("achievements")}
                className="text-[10px] font-black uppercase tracking-widest text-indigo-500"
              >
                View All
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
              {ACHIEVEMENTS.filter(a => earnedAchievementIds.includes(a.id)).map((achievement) => (
                <div 
                  key={achievement.id}
                  onClick={() => onNavigate("achievements")}
                  className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${achievement.color} p-0.5 shadow-lg active:scale-95 transition-transform cursor-pointer`}
                >
                  <div className={`${theme === "dark" ? "bg-gray-900 text-white" : "bg-white"} w-full h-full rounded-[14px] flex items-center justify-center`}>
                    <achievement.icon size={28} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referral Card */}
        <div className="bg-indigo-600/10 border-2 border-indigo-500/20 p-8 rounded-[40px] relative overflow-hidden group">
          <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <h4
              className={`font-black ${theme === "dark" ? "text-white" : "text-slate-900"} text-lg mb-2 tracking-tight`}
            >
              Invite your Classmates
            </h4>
            <p
              className={`text-xs ${theme === "dark" ? "text-indigo-200/70" : "text-slate-600"} font-semibold mb-6 leading-relaxed max-w-[220px]`}
            >
              Help friends join Educate MW and get an exclusive 500 XP and AI Tokens bonus.
            </p>
            
            <div className="flex items-center gap-4 mb-6">
              <a 
                href={`https://wa.me/?text=${encodeURIComponent("🔥 *Educate MW* is the #1 App for MSCE Students in Malawi! Get free 2024 Past Papers, Notes, Quizzes, and an AI Study Assistant called Emi to answer your questions.\n\n🎁 Click my link to join and get *500 free XP & AI Tokens* instantly!\n\n👉 Join now: " + referralLink)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 h-12 bg-[#25D366] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95 transition-all gap-2"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
              </a>
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent("🔥 Educate MW is the #1 App for MSCE Students in Malawi! Get free 2024 Past Papers, Notes, Quizzes, and an AI Study Assistant called Emi. Click my link to join and get 500 free XP & AI Tokens instantly! Join now: " + referralLink)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 h-12 bg-[#1877F2] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all gap-2"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <button 
                onClick={() => {
                  handleCopyLink();
                  alert("Referral link and powerful message copied! Open TikTok and paste it into your video comments or bio.");
                  window.open("https://www.tiktok.com/", "_blank");
                }}
                className="flex-1 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/20 hover:scale-105 active:scale-95 transition-all gap-2"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </button>
            </div>

            <div
              className={`${theme === "dark" ? "bg-gray-950/80 border-indigo-500/30" : "bg-white border-slate-200 shadow-xl"} backdrop-blur-md p-2 rounded-2xl border flex items-center justify-between`}
            >
              <span
                className={`font-bold ${theme === "dark" ? "text-white" : "text-slate-900"} text-xs pl-4 truncate max-w-[200px]`}
              >
                {referralLink}
              </span>
              <button
                onClick={handleCopyLink}
                className={`${isCopied ? "bg-emerald-500" : "bg-indigo-600"} text-white p-3.5 rounded-xl shadow-lg active:scale-90 transition-all hover:opacity-90 shrink-0`}
              >
                {isCopied ? (
                  <CheckCircle size={18} strokeWidth={3} />
                ) : (
                  <Share2 size={18} strokeWidth={2.5} />
                )}
              </button>
            </div>
            {isCopied && (
              <p className="text-[10px] text-emerald-500 font-bold mt-2 animate-bounce">
                Link copied successfully! ✅
              </p>
            )}
          </div>
          <Gift className="absolute bottom-[-15%] left-[-5%] w-32 h-32 text-indigo-500/5 -rotate-12 pointer-events-none" />
        </div>

        {/* Daily Goals - Removed as per user request (already on Home tools) */}

        {/* Suggested Features - Removed as per user request (already on Home grid) */}

        {/* Menu Options */}
        <div className="space-y-3 pb-10">
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              className={`w-full ${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200 shadow-sm"} p-5 rounded-[2.5rem] border flex items-center justify-between group active:scale-95 transition-all`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl ${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-slate-50 border-slate-100"} flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform shadow-inner border shadow-sm`}
                >
                  <item.icon size={20} />
                </div>
                <span
                  className={`font-black ${theme === "dark" ? "text-white" : "text-slate-900"} text-sm tracking-tight`}
                >
                  {item.label}
                </span>
              </div>
              {item.onClick ? (
                <div
                  className={`w-12 h-6 rounded-full relative transition-colors ${theme === "dark" ? "bg-indigo-600" : "bg-slate-300"}`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${theme === "dark" ? "left-7" : "left-1"}`}
                  />
                </div>
              ) : (
                <ChevronRight
                  size={18}
                  className="text-gray-700 group-hover:text-white transition-colors"
                />
              )}
            </button>
          ))}

          <button
            onClick={onLogout}
            className="w-full bg-red-500/5 p-5 rounded-[2.5rem] border border-red-500/10 flex items-center justify-between group active:scale-95 transition-all mt-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-inner">
                <LogOut size={20} />
              </div>
              <span className="font-black text-red-500 text-sm tracking-tight">
                Log Out
              </span>
            </div>
          </button>
        </div>

        {/* Weekly Activity Stats - Removed as per user request for minimal sidebar menu */}
      </div>

      {/* Avatar/Gender Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"} w-full max-w-sm rounded-[2.5rem] p-8 pb-10 border shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto hide-scrollbar`}
          >
            <div
              className={`flex justify-between items-center mb-8 sticky top-0 ${theme === "dark" ? "bg-gray-900 shadow-[0_10px_20px_rgba(17,24,39,0.9)]" : "bg-white shadow-[0_10px_20px_rgba(255,255,255,0.9)]"} z-30 pt-2`}
            >
              <h3
                className={`text-xl font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}
              >
                Pick your Avatar
              </h3>
              <button
                onClick={() => setShowAvatarPicker(false)}
                className={`text-gray-500 hover:${theme === "dark" ? "text-white" : "text-slate-900"} ${theme === "dark" ? "bg-gray-800" : "bg-slate-100"} rounded-full p-2 active:scale-95 transition-transform`}
              >
                <X size={20} />
              </button>
            </div>

            <div
              className={`${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-slate-50 border-slate-200"} rounded-2xl p-1.5 mb-8 border flex`}
            >
              <button
                onClick={() => onUpdate({ ...profile, gender: "male" })}
                className={`flex-1 py-3 font-black text-sm rounded-xl transition-all ${profile.gender === "male" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500 hover:text-indigo-400"}`}
              >
                👦 Boy
              </button>
              <button
                onClick={() => onUpdate({ ...profile, gender: "female" })}
                className={`flex-1 py-3 font-black text-sm rounded-xl transition-all ${profile.gender === "female" ? "bg-pink-600 text-white shadow-lg shadow-pink-600/20" : "text-gray-500 hover:text-pink-400"}`}
              >
                👧 Girl
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {(profile.gender === "female"
                ? FEMININE_GRADIENTS
                : MASCULINE_GRADIENTS
              ).map((gradient, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onUpdate({ ...profile, avatarGradient: gradient });
                    setShowAvatarPicker(false);
                  }}
                  className={`relative aspect-square rounded-[1.5rem] border-4 transition-all overflow-hidden ${theme === "dark" ? "bg-gray-950" : "bg-slate-100"} shadow-md ${profile.avatarGradient === gradient ? "border-none scale-105 shadow-indigo-500/40 ring-4 ring-indigo-500 ring-offset-2 " + (theme === "dark" ? "ring-offset-gray-900" : "ring-offset-white") : "border-transparent active:scale-95"}`}
                >
                  <Avatar
                    user={{ ...profile, avatarGradient: gradient }}
                    className="w-full h-full text-2xl rounded-[1.2rem]"
                  />
                  {profile.avatarGradient === gradient && (
                    <div className="absolute top-1 right-1 bg-white text-indigo-600 p-0.5 rounded-full shadow-lg z-20">
                      <CheckCheck size={12} strokeWidth={4} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-8 text-center px-4">
              <p className="text-[11px] text-gray-500 font-bold leading-snug">
                Choose the avatar that makes you feel most confident and ready
                to study! 🚀
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Level Picker Modal */}
      {showLevelPicker && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-200">
          <div
            className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-100 shadow-2xl"} w-full max-w-xs rounded-3xl p-8 border animate-in zoom-in-95 duration-200`}
          >
            <h3
              className={`text-lg font-black ${theme === "dark" ? "text-white" : "text-slate-900"} mb-6 text-center`}
            >
              Select your Form
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {forms.map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    onUpdate({ ...profile, level: f });
                    setShowLevelPicker(false);
                  }}
                  className={`py-3.5 rounded-2xl font-bold transition-all border ${profile.level === f || (!profile.level && f === "Form 4") ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20" : theme === "dark" ? "bg-gray-950 text-gray-400 border-gray-800 hover:text-white" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowLevelPicker(false)}
              className="mt-6 w-full py-3 text-gray-500 font-bold text-sm tracking-widest uppercase hover:text-indigo-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AuthView({
  onNavigateRegister,
  onNavigateTerms,
  onNavigatePrivacy,
  theme,
}: {
  onNavigateRegister: () => void;
  onNavigateTerms?: () => void;
  onNavigatePrivacy?: () => void;
  theme: "light" | "dark";
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google Login Error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError(""); // Ignore closed popups gracefully
      } else if (err.code === "auth/popup-blocked") {
        setError("Popup blocked by browser. Please allow popups or try Email login.");
      } else if (err.code === "auth/cancelled-popup-request") {
        setError(""); // Multiple clicks ignored
      } else {
        setError(err.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!identifier || !password) {
      setError("Please enter your credentials");
      return;
    }
    setLoading(true);
    try {
      let emailToUse = identifier.trim();
      if (/^[\d\s+\-()]+$/.test(identifier) && identifier.length >= 8) {
        const digits = identifier.replace(/\D/g, "");
        emailToUse = `${digits}@educatemw.app`;
      }
      await signInWithEmailAndPassword(auth, emailToUse, password);
    } catch (err: any) {
      setError(err.message || "Login failed. Check credentials.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex flex-col min-h-full ${theme === "dark" ? "bg-gray-950 text-gray-100" : "bg-slate-50 text-slate-900"} p-4 sm:p-8 pt-12 sm:pt-16 animate-in fade-in duration-500 overflow-y-auto`}
    >
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8 text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[24px] flex items-center justify-center shadow-xl shadow-indigo-600/20 mb-4 overflow-hidden p-1 bg-gradient-to-br from-indigo-600 to-blue-700 border border-indigo-400/30">
          <img
            src="/app-icon.png"
            alt="Educate MW Logo"
            className="w-full h-full object-cover rounded-[20px]"
            referrerPolicy="no-referrer"
          />
        </div>
        <h1
          className={`text-3xl sm:text-4xl font-black ${theme === "dark" ? "text-white" : "text-slate-900"} tracking-tight uppercase`}
        >
          Educate MW
        </h1>
        <p className="text-indigo-500 dark:text-indigo-400 text-xs font-black uppercase tracking-[0.25em] mt-1.5 mb-3">
          Malawi National Secondary Curriculum & AI Study Companion
        </p>

        <p
          className={`text-sm sm:text-base ${theme === "dark" ? "text-gray-300" : "text-slate-600"} max-w-xl font-medium leading-relaxed`}
        >
          The complete digital learning platform built for Malawian students preparing for Junior Certificate of Education (JCE) and Malawi School Certificate of Education (MSCE) exams under MANEB.
        </p>
      </div>

      {/* Main Grid: Login Box + App Functionality & Transparency */}
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
        {/* Left Col: Features & Transparency Overview */}
        <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
          <div
            className={`${theme === "dark" ? "bg-gray-900/80 border-gray-800" : "bg-white border-slate-200"} rounded-3xl p-6 sm:p-8 border shadow-sm space-y-6`}
          >
            <h2
              className={`text-lg font-black ${theme === "dark" ? "text-white" : "text-slate-900"} uppercase tracking-wide flex items-center gap-2`}
            >
              <span>Platform Capabilities</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl ${theme === "dark" ? "bg-gray-950/60 border-gray-800" : "bg-slate-50 border-slate-200"} border`}>
                <div className="font-bold text-indigo-500 text-sm mb-1">🤖 Emi AI Tutor</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  24/7 MANEB syllabus-grounded tutoring, homework steps, and exam memory tips.
                </p>
              </div>

              <div className={`p-4 rounded-2xl ${theme === "dark" ? "bg-gray-950/60 border-gray-800" : "bg-slate-50 border-slate-200"} border`}>
                <div className="font-bold text-emerald-500 text-sm mb-1">📐 MSCE Points Calculator</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Calculate MSCE aggregate points and discover university program requirements.
                </p>
              </div>

              <div className={`p-4 rounded-2xl ${theme === "dark" ? "bg-gray-950/60 border-gray-800" : "bg-slate-50 border-slate-200"} border`}>
                <div className="font-bold text-amber-500 text-sm mb-1">📝 Past Exam Archives</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Access official MSCE & JCE examination papers, marking guides, and practice tests.
                </p>
              </div>

              <div className={`p-4 rounded-2xl ${theme === "dark" ? "bg-gray-950/60 border-gray-800" : "bg-slate-50 border-slate-200"} border`}>
                <div className="font-bold text-pink-500 text-sm mb-1">🧠 Quizzes & Flashcards</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Instant self-assessment drills to reinforce formulas, definitions, and concepts.
                </p>
              </div>
            </div>

            {/* Transparent Data Privacy Disclosure */}
            <div className={`p-5 rounded-2xl ${theme === "dark" ? "bg-indigo-950/30 border-indigo-900/50" : "bg-indigo-50/70 border-indigo-100"} border space-y-2`}>
              <div className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                🔒 Data Privacy & Transparency Notice
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                When you sign in with Google, we only access your basic profile information (Name, Email, and Profile Picture) to create your student profile and securely save your syllabus progress, quiz history, and certificates. <strong>We never sell, rent, or share your data with third parties.</strong>
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <button
                  type="button"
                  onClick={onNavigatePrivacy || (() => { window.history.pushState({}, "", "/privacy"); window.dispatchEvent(new PopStateEvent("popstate")); })}
                  className="hover:underline flex items-center gap-1"
                >
                  View Privacy Policy →
                </button>
                <button
                  type="button"
                  onClick={onNavigateTerms || (() => { window.history.pushState({}, "", "/terms"); window.dispatchEvent(new PopStateEvent("popstate")); })}
                  className="hover:underline flex items-center gap-1"
                >
                  View Terms of Service →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Sign-In / Login Form */}
        <div className="lg:col-span-5 order-1 lg:order-2">
          <div
            className={`${theme === "dark" ? "bg-gray-900 border-gray-800 shadow-2xl" : "bg-white border-slate-200 shadow-xl"} rounded-3xl p-6 sm:p-8 border w-full`}
          >
            <h2
              className={`text-xl font-black ${theme === "dark" ? "text-white" : "text-slate-900"} mb-6 tracking-tight`}
            >
              Sign In to Your Account
            </h2>

            <div className="space-y-4 relative z-10">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className={`w-full ${theme === "dark" ? "bg-white text-gray-900 hover:bg-gray-100" : "bg-white text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-50"} font-bold py-3.5 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50`}
              >
                {loading ? (
                  <div
                    className={`w-5 h-5 border-2 ${theme === "dark" ? "border-gray-900/30 border-t-gray-900" : "border-gray-500/30 border-t-gray-700"} rounded-full animate-spin`}
                  />
                ) : (
                  <>
                    <img
                      src="https://www.google.com/favicon.ico"
                      className="w-5 h-5"
                      alt="Google"
                    />
                    Continue with Google
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 w-full py-1">
                <div
                  className={`h-px ${theme === "dark" ? "bg-gray-800" : "bg-slate-200"} flex-1`}
                ></div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  or email login
                </span>
                <div
                  className={`h-px ${theme === "dark" ? "bg-gray-800" : "bg-slate-200"} flex-1`}
                ></div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                    Email or Phone
                  </label>
                  <div
                    className={`${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-slate-50 border-slate-200"} rounded-xl p-3.5 flex items-center border focus-within:border-indigo-500/50 transition-all`}
                  >
                    <User size={18} className="text-gray-400 mr-3" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="student@example.com or 099..."
                      className={`bg-transparent outline-none flex-1 ${theme === "dark" ? "text-white" : "text-slate-900"} text-sm font-medium placeholder-gray-500`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                    Password
                  </label>
                  <div
                    className={`${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-slate-50 border-slate-200"} rounded-xl p-3.5 flex items-center border focus-within:border-indigo-500/50 transition-all`}
                  >
                    <Lock size={18} className="text-gray-400 mr-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`bg-transparent outline-none flex-1 ${theme === "dark" ? "text-white" : "text-slate-900"} text-sm font-medium placeholder-gray-500`}
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-[11px] font-bold text-center mt-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all mt-4 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Log In"
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-800 flex flex-col items-center gap-3 relative z-10">
              <button
                type="button"
                onClick={onNavigateRegister}
                className={`w-full ${theme === "dark" ? "bg-gray-800 text-white hover:bg-gray-700" : "bg-slate-100 text-slate-900 hover:bg-slate-200"} font-bold py-3 rounded-xl transition-colors shadow-none text-sm`}
              >
                Create New Student Account
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-auto py-6 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 max-w-5xl mx-auto w-full gap-4">
        <p className="font-semibold">
          © {new Date().getFullYear()} Educate MW • Ministry of Education & MANEB Syllabus Companion
        </p>
        <div className="flex items-center gap-4 font-bold">
          <button
            type="button"
            onClick={onNavigatePrivacy || (() => { window.history.pushState({}, "", "/privacy"); window.dispatchEvent(new PopStateEvent("popstate")); })}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={onNavigateTerms || (() => { window.history.pushState({}, "", "/terms"); window.dispatchEvent(new PopStateEvent("popstate")); })}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Terms of Service
          </button>
        </div>
      </footer>
    </div>
  );
}

function SubscriptionView({
  onBack,
  profile,
  theme,
}: {
  onBack: () => void;
  profile: any;
  theme: "light" | "dark";
}) {
  const [copiedLifa, setCopiedLifa] = useState(false);

  const handleCopyLifa = () => {
    try {
      navigator.clipboard.writeText("0999136433");
      setCopiedLifa(true);
      setTimeout(() => setCopiedLifa(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenWhatsApp = (
    planName: string = "Full Pro Access",
    price: string = "K7,000",
  ) => {
    const message = encodeURIComponent(
      `Hi Mr. Lifa, I'm ${profile?.name || "a student"} (${profile?.email || ""}). I've sent ${price} via Airtel Money to 0999136433 for ${planName}. Here is my transaction screenshot.`,
    );
    window.open(`https://wa.me/265999136433?text=${message}`, "_blank");
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col ${theme === "dark" ? "bg-gray-950 text-white" : "bg-slate-50 text-slate-900"} overflow-y-auto animate-in fade-in duration-300`}
    >
      {/* Header */}
      <div
        className={`p-5 flex items-center justify-between sticky top-0 z-20 ${theme === "dark" ? "bg-gray-950/80" : "bg-white/80"} backdrop-blur-xl border-b ${theme === "dark" ? "border-gray-800" : "border-slate-200"}`}
      >
        <button
          onClick={onBack}
          className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${theme === "dark" ? "bg-gray-900 border-gray-800 text-white hover:bg-gray-800" : "bg-white border-slate-200 text-slate-800 hover:bg-slate-100"}`}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-sm font-black uppercase tracking-widest">
            Upgrade to Pro
          </h2>
          <p
            className={`text-[10px] font-bold uppercase tracking-wider ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`}
          >
            Single Fixed Price • Full Access
          </p>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 p-5 pb-20 max-w-3xl mx-auto w-full space-y-6">
        {/* Top Feature Card with Airtel money logo & copy widgets */}
        <div
          className={`${theme === "dark" ? "bg-indigo-950/20 border-indigo-500/30" : "bg-white border-indigo-100 shadow-md"} rounded-3xl p-6 border relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>

          <h3 className="text-sm font-black uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2">
            <img
              src="https://i.ibb.co/KxWc20jw/images-1.png"
              alt="Airtel"
              className="w-5 h-5 object-contain"
              referrerPolicy="no-referrer"
            />
            Official Airtel Money Account
          </h3>

          <div className="relative z-10">
            {/* Account: S. Lifa */}
            <div
              className={`p-5 rounded-2xl border ${theme === "dark" ? "bg-gray-900/80 border-gray-800" : "bg-slate-50 border-slate-200"} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <span className="text-lg font-black text-amber-500">SL</span>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                    OFFICIAL RECEIVER
                  </p>
                  <h4 className="font-extrabold text-base tracking-tight">
                    S. Lifa (Teacher)
                  </h4>
                  <p
                    className={`text-sm font-bold ${theme === "dark" ? "text-gray-300" : "text-slate-700"}`}
                  >
                    0999136433 <span className="text-xs text-red-500 font-semibold">• Airtel Money</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button
                  onClick={handleCopyLifa}
                  className={`py-3 px-5 rounded-xl border font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0 ${
                    copiedLifa
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                      : theme === "dark"
                        ? "bg-gray-950 border-gray-800 text-white hover:bg-gray-800 shadow-sm"
                        : "bg-white border-slate-200 text-slate-800 hover:bg-slate-100 shadow-sm"
                  }`}
                >
                  {copiedLifa ? "Copied 0999136433!" : "Copy Number"}
                </button>
                <button
                  onClick={() =>
                    handleOpenWhatsApp("Educate MW Full Access", "K7,000")
                  }
                  className="py-3 px-5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all active:scale-95 shrink-0 bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-md shadow-[#25D366]/20 cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12.012 2c-5.506 0-9.989 4.478-9.989 9.984 0 1.758.459 3.474 1.33 4.982l-1.413 5.161 5.282-1.385a9.914 9.914 0 0 0 4.79 1.226h.004c5.505 0 9.988-4.478 9.988-9.984s-4.483-9.984-9.989-9.984zm5.836 14.127c-.246.692-1.433 1.32-1.998 1.405-.512.076-1.16.108-1.872-.118-.431-.137-.985-.32-1.694-.626-2.981-1.287-4.927-4.287-5.076-4.487-.149-.199-1.216-1.614-1.216-3.079 0-1.465.769-2.184 1.042-2.483.273-.298.596-.372.794-.372.199 0 .398 0 .571.008.184.009.429-.069.671.511.249.597.845 2.064.92 2.213.075.149.124.323.025.521-.099.199-.149.323-.298.497-.149.174-.314.388-.447.521-.148.148-.326.335-.127.682.199.345.893 1.474 1.918 2.388 1.139 1.016 2.099 1.331 2.397 1.48.298.149.472.124.645-.074.173-.198.744-.868.942-1.166.199-.298.398-.249.671-.149.273.099 1.736.819 2.034.968.298.149.496.223.57.345.075.122.075.718-.173 1.413z"/>
                  </svg>
                  <span>Chat on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-dashed border-gray-200 dark:border-gray-800 flex flex-col gap-2.5 text-left text-xs font-semibold">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span>
                <strong>Step 1:</strong> Dial *211# on your Airtel SIM Card and choose Send Money.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span>
                <strong>Step 2:</strong> Send exactly <strong>K7,000</strong> to <strong>S. Lifa (0999136433)</strong>.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span>
                <strong>Step 3:</strong> Save your confirmation SMS screenshot and click the button below to instantly verify on WhatsApp.
              </span>
            </div>
          </div>
        </div>

        {/* Single Fixed Price Plan Card */}
        <div
          className={`${theme === "dark" ? "bg-gray-900 border-amber-500/40 shadow-[0_20px_50px_rgba(245,158,11,0.1)]" : "bg-white border-amber-300 shadow-xl shadow-amber-600/10"} rounded-3xl p-8 border-2 relative overflow-hidden text-left`}
        >
          <div className="absolute top-0 right-0 bg-amber-500 text-gray-950 text-[10px] font-black uppercase tracking-widest py-1.5 px-5 rounded-bl-2xl">
            ONE FIXED PRICE
          </div>

          <div className="inline-flex items-center bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 mb-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              FULL ACCESS UNLOCKED
            </span>
          </div>

          <h3 className="text-2xl font-black mb-1">
            Educate MW Pro
          </h3>
          <p
            className={`text-xs font-bold mb-6 ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}
          >
            Access everything on Educate MW with a single payment of K7,000. No recurring fees or hidden charges.
          </p>

          <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-baseline gap-2">
            <span className="text-5xl font-black text-amber-500">
              K7,000
            </span>
            <span
              className={`text-xs font-bold uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-slate-600"}`}
            >
              / Full Access
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            <div className="flex items-start gap-2.5">
              <CheckCircle2
                size={18}
                className="text-amber-500 mt-0.5 shrink-0"
              />
              <span className="text-xs font-bold">
                Unlimited Emi AI Questions & Solvers
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2
                size={18}
                className="text-amber-500 mt-0.5 shrink-0"
              />
              <span className="text-xs font-bold">
                Unlimited Live Voice Call Tutoring
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2
                size={18}
                className="text-amber-500 mt-0.5 shrink-0"
              />
              <span className="text-xs font-bold">
                Unlimited JCE & MSCE Past Papers
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2
                size={18}
                className="text-amber-500 mt-0.5 shrink-0"
              />
              <span className="text-xs font-bold">
                Unlimited Study Notes & eBooks
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2
                size={18}
                className="text-amber-500 mt-0.5 shrink-0"
              />
              <span className="text-xs font-bold">
                Official MANEB Solutions & Marking Keys
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2
                size={18}
                className="text-amber-500 mt-0.5 shrink-0"
              />
              <span className="text-xs font-bold">
                Verified Pro Student Badge
              </span>
            </div>
          </div>

          <button
            onClick={() =>
              handleOpenWhatsApp(
                "Educate MW Full Access",
                "K7,000",
              )
            }
            className="w-full py-3.5 px-4 sm:px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-gray-950 font-black uppercase tracking-wider text-[11px] sm:text-xs rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer leading-tight"
          >
            <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-md">
              <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                <path d="M12.012 2c-5.506 0-9.989 4.478-9.989 9.984 0 1.758.459 3.474 1.33 4.982l-1.413 5.161 5.282-1.385a9.914 9.914 0 0 0 4.79 1.226h.004c5.505 0 9.988-4.478 9.988-9.984s-4.483-9.984-9.989-9.984zm5.836 14.127c-.246.692-1.433 1.32-1.998 1.405-.512.076-1.16.108-1.872-.118-.431-.137-.985-.32-1.694-.626-2.981-1.287-4.927-4.287-5.076-4.487-.149-.199-1.216-1.614-1.216-3.079 0-1.465.769-2.184 1.042-2.483.273-.298.596-.372.794-.372.199 0 .398 0 .571.008.184.009.429-.069.671.511.249.597.845 2.064.92 2.213.075.149.124.323.025.521-.099.199-.149.323-.298.497-.149.174-.314.388-.447.521-.148.148-.326.335-.127.682.199.345.893 1.474 1.918 2.388 1.139 1.016 2.099 1.331 2.397 1.48.298.149.472.124.645-.074.173-.198.744-.868.942-1.166.199-.298.398-.249.671-.149.273.099 1.736.819 2.034.968.298.149.496.223.57.345.075.122.075.718-.173 1.413z"/>
              </svg>
            </div>
            <span className="text-center">Verify Payment (K7,000 via WhatsApp)</span>
          </button>
        </div>

        {/* Free Limits card for clarity */}
        <div
          className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-slate-100/60 border-slate-200"} rounded-3xl p-6 border text-left`}
        >
          <h4 className="font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2 text-indigo-500">
            <Shield size={14} /> Free Tier Status & Core Limits
          </h4>
          <div className="space-y-2 text-xs font-semibold">
            <p
              className={theme === "dark" ? "text-gray-400" : "text-slate-600"}
            >
              • <span className="font-extrabold text-indigo-400">4 Points</span>{" "}
              / 2 Emi AI text questions per day limit.
            </p>
            <p
              className={theme === "dark" ? "text-gray-400" : "text-slate-600"}
            >
              • <span className="font-extrabold text-indigo-400">2 Calls</span>{" "}
              / 5 min limit each per day limit.
            </p>
            <p
              className={theme === "dark" ? "text-gray-400" : "text-slate-600"}
            >
              • Daily limits reset globally at UTC 00:00.
            </p>
          </div>
        </div>

        <div className="text-center pt-2 opacity-60">
          <p className="text-[10px] font-black uppercase tracking-widest">
            Airtel money payments managed by S. Lifa. Support & Verification: 0999136433
          </p>
        </div>
      </div>
    </div>
  );
}

function RegisterView({
  onBack,
  theme,
}: {
  onBack: () => void;
  theme: "light" | "dark";
}) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    level: "Form 4",
    gender: "male",
  });
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("mw_referrer_code");
      if (stored) {
        setReferralCode(stored.toUpperCase());
      }
    } catch (e) {}
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.username ||
      !formData.password ||
      (!formData.email && !formData.phone)
    ) {
      setError("Please fill in all required fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let emailToUse = formData.email;
      if (!emailToUse && formData.phone) {
        const digits = formData.phone.replace(/\D/g, "");
        emailToUse = `${digits}@educatemw.app`;
      }

      let isReferralApplied = false;
      let referrerUid = "";
      let referrerName = "";
      const cleanRef = referralCode.trim().toUpperCase();

      if (cleanRef) {
        if (cleanRef === "EDUCATE500") {
          isReferralApplied = true;
        } else {
          // Look up referrer user who owns this code
          const q = query(
            collection(db, "users"),
            where("referralCode", "==", cleanRef),
          );
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            const referrerDoc = querySnap.docs[0];
            referrerUid = referrerDoc.id;
            referrerName = referrerDoc.data().name || "Your Friend";
            isReferralApplied = true;
          } else {
            console.warn(
              "Referral code was not found in the database. Proceeding without bonus.",
            );
          }
        }
      }

      const cred = await createUserWithEmailAndPassword(
        auth,
        emailToUse,
        formData.password,
      );
      await updateProfile(cred.user, { displayName: formData.username });

      const userRef = doc(db, "users", cred.user.uid);
      const gradient = getAvatarGradient(formData.gender, cred.user.uid);
      const today = new Date().toLocaleDateString("en-CA");

      const startingPoints = isReferralApplied ? 1000 : 500; // 500 base + 500 XP bonus
      const startingAiPoints = isReferralApplied ? 20 : 10; // 10 base + 10 Emi AI points bonus

      await setDoc(userRef, {
        name: formData.username,
        email: emailToUse,
        gender: formData.gender,
        avatarGradient: gradient,
        level: formData.level,
        points: startingPoints,
        aiPoints: startingAiPoints,
        aiPointsLastReset: today,
        referredByCode: cleanRef,
        referredByUid:
          referrerUid || (cleanRef === "EDUCATE500" ? "SYSTEM" : ""),
        isPro: false,
        role: "student",
        referralCode:
          "MW-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        createdAt: serverTimestamp(),
      });

      // Reward the referee creator if exists
      if (referrerUid) {
        try {
          const referrerDocRef = doc(db, "users", referrerUid);
          const referrerSnap = await getDoc(referrerDocRef);
          if (referrerSnap.exists()) {
            const rData = referrerSnap.data();
            const currentReferrerAiPoints = rData.aiPoints ?? 10;
            // Reward referrer: 1 friend = 10 Emi study points
            await updateDoc(referrerDocRef, {
              aiPoints: currentReferrerAiPoints + 10,
              aiPointsLastReset: today,
              points: increment(150), // Give them also 150 study XP points as nice motivation
              successfulReferralsCount: increment(1),
            });
          }
        } catch (refErr) {
          console.error("Error updating referrer:", refErr);
        }
      }

      // Clear referral local cache
      try {
        localStorage.removeItem("mw_referrer_code");
      } catch (e) {}

      onBack();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex flex-col min-h-full ${theme === "dark" ? "bg-gray-950 text-white" : "bg-slate-50 text-slate-900"} animate-in fade-in duration-500 overflow-y-auto p-6 pt-12 pb-12`}
    >
      <div className="flex items-center justify-between w-full max-w-md mx-auto mb-8">
        <button
          onClick={onBack}
          className={`w-10 h-10 ${theme === "dark" ? "bg-gray-900 border-gray-800 hover:bg-gray-800" : "bg-white border-slate-200 hover:bg-slate-50"} rounded-xl flex items-center justify-center border shadow-sm transition-colors`}
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <div
        className={`${theme === "dark" ? "bg-gray-900 border-gray-800 shadow-2xl" : "bg-white border-slate-200 shadow-xl"} rounded-2xl p-8 border w-full max-w-md mx-auto`}
      >
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-[22px] flex items-center justify-center mb-6 shadow-xl shadow-blue-600/20 overflow-hidden p-1 bg-blue-600 border border-blue-500/30 rotate-2">
            <img
              src="/app-icon.jpg"
              alt="educate mw logo"
              className="w-full h-full object-cover rounded-[17px]"
              referrerPolicy="no-referrer"
            />
          </div>
          <h3 className="text-2xl font-black mb-2 tracking-tight">
            Create Account
          </h3>
          <p className="text-gray-500 font-medium text-sm">
            Join Malawi's Elite Study Platform
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">
              Student Name
            </label>
            <div
              className={`${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-slate-50 border-slate-200"} rounded-xl p-3.5 flex items-center border focus-within:border-indigo-500/50 transition-all`}
            >
              <User size={18} className="text-gray-400 mr-3" />
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder="Full Name"
                className={`bg-transparent outline-none flex-1 ${theme === "dark" ? "text-white" : "text-slate-900"} text-sm font-medium placeholder-gray-500`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">
              Email or Phone
            </label>
            <div
              className={`${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-slate-50 border-slate-200"} rounded-xl p-3.5 flex items-center border focus-within:border-indigo-500/50 transition-all`}
            >
              <Mail size={18} className="text-gray-400 mr-3" />
              <input
                type="text"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="student@example.com or 099..."
                className={`bg-transparent outline-none flex-1 ${theme === "dark" ? "text-white" : "text-slate-900"} text-sm font-medium placeholder-gray-500`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">
              Password
            </label>
            <div
              className={`${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-slate-50 border-slate-200"} rounded-xl p-3.5 flex items-center border focus-within:border-indigo-500/50 transition-all`}
            >
              <Lock size={18} className="text-gray-400 mr-3" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Secure Password"
                className={`bg-transparent outline-none flex-1 ${theme === "dark" ? "text-white" : "text-slate-900"} text-sm font-medium placeholder-gray-500`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                Gender
              </label>
              <div
                className={`${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-slate-50 border-slate-200"} rounded-xl flex items-center border p-1`}
              >
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: "male" })}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${formData.gender === "male" ? "bg-indigo-600 text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: "female" })}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${formData.gender === "female" ? "bg-indigo-600 text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                >
                  Female
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                Level
              </label>
              <div
                className={`${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-slate-50 border-slate-200"} rounded-xl p-3.5 flex items-center border relative`}
              >
                <select
                  value={formData.level}
                  onChange={(e) =>
                    setFormData({ ...formData, level: e.target.value })
                  }
                  className={`bg-transparent outline-none flex-1 ${theme === "dark" ? "text-white" : "text-slate-900"} text-sm font-medium appearance-none relative z-10 w-full`}
                >
                  <option value="Form 1">Form 1</option>
                  <option value="Form 2">Form 2</option>
                  <option value="Form 3">Form 3</option>
                  <option value="Form 4">Form 4</option>
                </select>
                <ChevronDown
                  size={16}
                  className="text-gray-400 absolute right-3"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 border-t pt-4 border-slate-200 dark:border-gray-800/60 mt-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                <Gift size={12} className="text-indigo-500 animate-pulse" />{" "}
                Referral Code{" "}
                <span className="text-[9px] text-indigo-400 lowercase font-medium">
                  (optional)
                </span>
              </label>
              <button
                type="button"
                onClick={() => setReferralCode("EDUCATE500")}
                className="text-[10px] font-extrabold text-indigo-500 hover:text-indigo-600 transition-colors uppercase tracking-wider"
              >
                Use Default
              </button>
            </div>
            <div
              className={`${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-slate-50 border-slate-200"} rounded-xl p-3 flex items-center border focus-within:border-indigo-500/50 transition-all justify-between`}
            >
              <div className="flex items-center flex-1">
                <Gift size={16} className="text-gray-400 mr-2.5 shrink-0" />
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) =>
                    setReferralCode(e.target.value.toUpperCase())
                  }
                  placeholder="Enter custom or friend's code"
                  className={`bg-transparent outline-none flex-1 ${theme === "dark" ? "text-white" : "text-slate-900"} text-sm font-bold placeholder-gray-500`}
                />
              </div>
              {referralCode === "EDUCATE500" && (
                <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-widest ml-2 border border-emerald-500/20">
                  Default applied
                </span>
              )}
            </div>
            <p className="text-[9.5px] text-gray-500/80 font-bold ml-1 leading-snug">
              🎁 Code awards you{" "}
              <span className="text-indigo-500 font-extrabold">
                +10 Emi AI questions
              </span>{" "}
              and{" "}
              <span className="text-emerald-500 font-extrabold">
                +500 XP bonus
              </span>
              !
            </p>
          </div>

          {error && (
            <p className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-500 text-xs font-bold text-center mt-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all mt-4 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="mt-6 text-[11px] text-gray-500 text-center">
          By signing up, you agree to our{" "}
          <a href="/terms" className="text-indigo-500 hover:underline">
            Terms of Service
          </a>{" "}
          &{" "}
          <a href="/privacy" className="text-indigo-500 hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>

      <footer className="mt-auto py-8 flex flex-col items-center gap-3">
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] opacity-40">
          © {new Date().getFullYear()} educate mw
        </p>
      </footer>
    </div>
  );
}

function NotificationsModal({
  isOpen,
  onClose,
  theme,
}: {
  isOpen: boolean;
  onClose: () => void;
  theme: "light" | "dark";
}) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(10),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setNotifications(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-200">
      <div
        className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"} w-full max-w-sm rounded-[2.5rem] p-8 border shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]`}
      >
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center shadow-inner">
              <Bell size={20} />
            </div>
            <h3
              className={`text-xl font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}
            >
              Board Alerts
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`text-gray-500 hover:${theme === "dark" ? "text-white" : "text-slate-900"} ${theme === "dark" ? "bg-gray-800" : "bg-slate-100"} rounded-full p-2 active:scale-95 transition-transform`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-1 space-y-4 hide-scrollbar">
          {loading ? (
            <div className="py-20 flex justify-center">
              <EmiSpinner size="md" theme={theme} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <BellOff size={32} className="mx-auto mb-3 text-gray-600" />
              <p
                className={`${theme === "dark" ? "text-white" : "text-slate-900"} font-bold text-sm`}
              >
                No alerts yet
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-slate-50 border-slate-100"} p-5 rounded-3xl border shadow-sm`}
              >
                <h4
                  className={`font-black ${theme === "dark" ? "text-white" : "text-slate-900"} text-sm mb-1`}
                >
                  {notif.title}
                </h4>
                <p
                  className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-slate-600"} font-medium leading-relaxed`}
                >
                  {notif.body}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                    {notif.createdAt?.toDate().toLocaleDateString() || "Today"}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({
  onBack,
  theme,
}: {
  onBack: () => void;
  theme: "light" | "dark";
}) {
  const [students, setStudents] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [activeTab, setActiveTab] = useState<
    | "students"
    | "content"
    | "notifications"
    | "settings"
    | "feedback"
    | "payments"
  >("students");
  const [pendingCerts, setPendingCerts] = useState<any[]>([]);
  const [appSettings, setAppSettings] = useState({
    freeDailyLimit: 10,
    totalApiCalls: 0,
  });
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [realTotal, setRealTotal] = useState(0);
  const [realPro, setRealPro] = useState(0);
  const [realForm4, setRealForm4] = useState(0);
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    subject: "",
    level: "",
    content: "",
    excerpt: "",
    image: "",
    tags: "",
    type: "pdf" as "pdf" | "video" | "blog",
  });
  const [notification, setNotification] = useState({ title: "", body: "" });
  const [materials, setMaterials] = useState<any[]>([]);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);

  const stats = {
    total: realTotal || students.length,
    pro: realPro || students.filter((s) => s.isPro).length,
    form4: realForm4 || students.filter((s) => s.level === "Form 4").length,
  };

  const handlePublishNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notification.title || !notification.body) return;
    setPublishing(true);
    try {
      await addDoc(collection(db, "notifications"), {
        ...notification,
        readBy: [],
        createdAt: serverTimestamp(),
      });
      setNotification({ title: "", body: "" });
      alert("Notification published!");
    } catch (err) {
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  useEffect(() => {
    // 0. Fetch real total counts
    const fetchStats = async () => {
      try {
        const coll = collection(db, "users");
        const [totalSnap, proSnap, form4Snap] = await Promise.all([
          getCountFromServer(query(coll)),
          getCountFromServer(query(coll, where("isPro", "==", true))),
          getCountFromServer(query(coll, where("level", "==", "Form 4"))),
        ]);
        setRealTotal(totalSnap.data().count);
        setRealPro(proSnap.data().count);
        setRealForm4(form4Snap.data().count);
      } catch (err) {
        console.error("Error fetching total counts:", err);
      }
    };
    fetchStats();

    // 1. Load from cache for fast startup
    const cachedStudents = localStorage.getItem("mw_admin_students_cache");
    if (cachedStudents) {
      setStudents(JSON.parse(cachedStudents));
      setLoading(false);
    }

    // 2. Snapshot for recent students - simpler query if possible
    const qStudents = query(collection(db, "users"), limit(50));
    const unsubscribeStudents = onSnapshot(
      qStudents,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort in memory if needed or use server ordering
        const sortedData = data.sort((a: any, b: any) => {
          const dateA = a.createdAt?.toMillis?.() || 0;
          const dateB = b.createdAt?.toMillis?.() || 0;
          return dateB - dateA;
        });
        setStudents(sortedData);
        localStorage.setItem(
          "mw_admin_students_cache",
          JSON.stringify(sortedData),
        );
        setLoading(false);
      },
      (error) => {
        console.error("Admin dashboard stream error:", error);
        setLoading(false);
      },
    );

    const qMaterials = query(
      collection(db, "materials"),
      orderBy("createdAt", "desc"),
      limit(20),
    );
    const unsubscribeMaterials = onSnapshot(qMaterials, (snapshot) => {
      setMaterials(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const qNotifications = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(20),
    );
    const unsubscribeNotifications = onSnapshot(qNotifications, (snapshot) => {
      setNotificationsList(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    });

    const qFeedback = query(
      collection(db, "ai_feedback"),
      orderBy("createdAt", "desc"),
      limit(50),
    );
    const unsubscribeFeedback = onSnapshot(qFeedback, (snapshot) => {
      setFeedbackList(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    });

    const unsubscribeSettings = onSnapshot(
      doc(db, "settings", "global"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAppSettings({
            freeDailyLimit: data.freeDailyLimit || 10,
            totalApiCalls: data.totalApiCalls || 0,
          });
        }
      },
    );

    const qCerts = query(collection(db, "certificates"), limit(150));
    const unsubscribeCerts = onSnapshot(
      qCerts,
      (snapshot) => {
        const allCerts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const pendingAndUnconfirmed = allCerts.filter((c: any) => !c.isPaid);
        // Sort by createdAt Milliseconds descending
        pendingAndUnconfirmed.sort((a: any, b: any) => {
          const dateA = a.createdAt?.toMillis?.() || 0;
          const dateB = b.createdAt?.toMillis?.() || 0;
          return dateB - dateA;
        });
        setPendingCerts(pendingAndUnconfirmed);
      },
      (err) => {
        console.error("Error loading pending certificates for admin:", err);
      },
    );

    return () => {
      unsubscribeStudents();
      unsubscribeMaterials();
      unsubscribeNotifications();
      unsubscribeFeedback();
      unsubscribeSettings();
      unsubscribeCerts();
    };
  }, []);

  const saveSettings = async () => {
    try {
      await setDoc(doc(db, "settings", "global"), appSettings, { merge: true });
      alert("Settings updated!");
    } catch (err) {
      console.error(err);
    }
  };

  const deleteMaterial = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this material?"))
      return;
    try {
      await deleteDoc(doc(db, "materials", id));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this notification?"))
      return;
    try {
      await deleteDoc(doc(db, "notifications", id));
    } catch (err) {
      console.error(err);
    }
  };

  const togglePro = async (student: any) => {
    try {
      await updateDoc(doc(db, "users", student.id), {
        isPro: !student.isPro,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.title || !newMaterial.content) return;
    setPublishing(true);
    try {
      const slug = newMaterial.title.toLowerCase().replace(/[^\w]+/g, "-");
      const author = auth.currentUser?.displayName || "Educate MW Team";

      await addDoc(collection(db, "materials"), {
        ...newMaterial,
        slug: slug,
        author: newMaterial.type === "blog" ? author : null,
        tags:
          newMaterial.type === "blog"
            ? newMaterial.tags.split(",").map((t) => t.trim())
            : [],
        date: new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        readTime:
          newMaterial.type === "blog"
            ? `${Math.ceil(newMaterial.content.split(" ").length / 200)} min read`
            : null,
        authorId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      });
      setNewMaterial({
        title: "",
        subject: "",
        level: "",
        content: "",
        excerpt: "",
        image: "",
        tags: "",
        type: "pdf",
      });
      alert(`${newMaterial.type} published successfully!`);
    } catch (err) {
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div
      className={`absolute inset-0 z-[100] flex flex-col ${theme === "dark" ? "bg-gray-950 text-white" : "bg-slate-50 text-slate-900"} animate-in slide-in-from-right duration-300`}
    >
      <div
        className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"} border-b pt-4 pb-2 px-5 flex items-center justify-between z-10 shadow-xl`}
      >
        <div className="flex items-center">
          <button
            onClick={onBack}
            className={`w-10 h-10 ${theme === "dark" ? "bg-gray-800 text-white" : "bg-slate-100 text-slate-700"} rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform mr-4`}
          >
            <ChevronLeft size={24} strokeWidth={3} />
          </button>
          <div>
            <h2
              className={`font-black ${theme === "dark" ? "text-white" : "text-slate-900"} text-lg leading-tight uppercase flex items-center gap-2`}
            >
              Admin <ShieldAlert size={18} className="text-amber-500" />
            </h2>
            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mt-0.5">
              Management Suite
            </p>
          </div>
        </div>
      </div>

      <div
        className={`${theme === "dark" ? "bg-gray-900/50 border-gray-800" : "bg-slate-100 border-slate-200 shadow-sm"} p-2 flex gap-1 mx-5 mt-6 rounded-2xl border shrink-0 overflow-x-auto hide-scrollbar`}
      >
        <button
          onClick={() => setActiveTab("students")}
          className={`flex-1 min-w-[70px] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === "students" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-550 hover:text-gray-300"}`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab("content")}
          className={`flex-1 min-w-[70px] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === "content" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-550 hover:text-gray-300"}`}
        >
          Materials
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex-1 min-w-[70px] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === "notifications" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-550 hover:text-gray-300"}`}
        >
          Alerts
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`flex-1 min-w-[70px] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === "payments" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-550 hover:text-gray-305"} relative`}
        >
          Payments
          {pendingCerts.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white font-black text-[8px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-md">
              {pendingCerts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 min-w-[70px] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === "settings" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-550 hover:text-gray-300"}`}
        >
          Settings
        </button>
        <button
          onClick={() => setActiveTab("feedback")}
          className={`flex-1 min-w-[70px] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === "feedback" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-550 hover:text-gray-300"}`}
        >
          Feedback
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 hide-scrollbar">
        {activeTab === "students" && (
          <div className="space-y-8">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Users", val: stats.total, color: "text-indigo-400" },
                { label: "PRO", val: stats.pro, color: "text-amber-400" },
                {
                  label: "Form 4",
                  val: stats.form4,
                  color: "text-emerald-400",
                },
                {
                  label: "Active Today",
                  val: students.filter(
                    (s) =>
                      s.lastActiveAt && Date.now() - s.lastActiveAt < 86400000,
                  ).length,
                  color: "text-cyan-400",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200 shadow-sm"} p-4 rounded-3xl border flex flex-col items-center`}
                >
                  <div
                    className={`text-xl font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                  >
                    {s.val}
                  </div>
                  <div
                    className={`text-[8px] font-black uppercase tracking-widest mt-1 ${s.color}`}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-4 px-1">
                <div className="flex justify-between items-center">
                  <h3
                    className={`${theme === "dark" ? "text-white" : "text-slate-700"} font-black text-xs uppercase tracking-widest`}
                  >
                    Recent Students
                  </h3>
                  <span className="text-[9px] text-gray-500 font-bold uppercase">
                    Last 50 Entries
                  </span>
                </div>

                <div
                  className={`flex items-center gap-2 px-4 py-2 ${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"} border rounded-xl shadow-sm`}
                >
                  <Search size={16} className="text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs font-bold w-full"
                  />
                </div>
              </div>

              {loading ? (
                <div className="py-20 flex justify-center">
                  <EmiSpinner size="md" theme={theme} />
                </div>
              ) : (
                students
                  .filter(
                    (s) =>
                      s !== null &&
                      (s.name
                        ?.toLowerCase()
                        .includes(userSearch.toLowerCase()) ||
                        s.email
                          ?.toLowerCase()
                          .includes(userSearch.toLowerCase())),
                  )
                  .map((student) => (
                    <div
                      key={student.id}
                      className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200 shadow-sm"} p-4 rounded-3xl flex items-center justify-between group hover:border-indigo-500/30 transition-colors border`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl relative">
                          <Avatar
                            user={student}
                            className="w-full h-full text-lg shadow-inner"
                          />
                          {student.isPro && (
                            <div className="absolute top-0 right-0 p-1 bg-amber-500 rounded-bl-lg">
                              <Sparkles
                                size={8}
                                className="text-white"
                                fill="currentColor"
                              />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4
                            className={`font-black text-sm ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                          >
                            {student.name}
                          </h4>
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">
                            {student.email}
                          </p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <span
                              className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${student.isPro ? "bg-amber-500/20 text-amber-500" : "bg-gray-800 text-gray-600"}`}
                            >
                              {student.isPro ? "PRO" : "FREE"}
                            </span>
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase bg-indigo-500/20 text-indigo-400">
                              {student.level}
                            </span>
                            {student.lastActiveAt &&
                              Date.now() - student.lastActiveAt < 300000 && (
                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase bg-emerald-500/20 text-emerald-500">
                                  Live
                                </span>
                              )}
                            {student.apiUsage && (
                              <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase bg-cyan-500/20 text-cyan-500">
                                API: {student.apiUsage.count || 0}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => togglePro(student)}
                        className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${student.isPro ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}
                      >
                        {student.isPro ? "Demote" : "Make Pro"}
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {activeTab === "content" && (
          <div className="space-y-6">
            <div className="bg-indigo-600/10 border border-indigo-500/20 p-6 rounded-[32px] relative overflow-hidden">
              <FilePlus className="absolute right-[-5%] top-[-10%] w-24 h-24 text-indigo-500/5 -rotate-12" />
              <h3
                className={`font-black text-lg ${theme === "dark" ? "text-white" : "text-slate-900"} mb-1`}
              >
                New Material
              </h3>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest leading-tight">
                Educational Broadcast
              </p>

              <form
                onSubmit={handlePublish}
                className="mt-8 space-y-5 relative z-10"
              >
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">
                    Material Title
                  </label>
                  <input
                    value={newMaterial.title}
                    onChange={(e) =>
                      setNewMaterial({ ...newMaterial, title: e.target.value })
                    }
                    placeholder="Algebra Basics"
                    className={`w-full ${theme === "dark" ? "bg-gray-950 border-gray-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"} rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 border`}
                  />
                </div>
                {newMaterial.type !== "blog" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">
                        Subject
                      </label>
                      <input
                        value={newMaterial.subject}
                        onChange={(e) =>
                          setNewMaterial({
                            ...newMaterial,
                            subject: e.target.value,
                          })
                        }
                        placeholder="Biology, Math..."
                        className={`w-full ${theme === "dark" ? "bg-gray-950 border-gray-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"} rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 border`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">
                        Level / Class
                      </label>
                      <input
                        value={newMaterial.level}
                        onChange={(e) =>
                          setNewMaterial({
                            ...newMaterial,
                            level: e.target.value,
                          })
                        }
                        placeholder="Form 1, Form 2..."
                        className={`w-full ${theme === "dark" ? "bg-gray-950 border-gray-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"} rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 border`}
                      />
                    </div>
                  </div>
                )}
                {newMaterial.type === "pdf" ? (
                  <div className="space-y-2">
                    <CloudinaryUploader
                      theme={theme}
                      allowedType="pdf"
                      onUploadSuccess={(url) =>
                        setNewMaterial((prev) => ({ ...prev, content: url }))
                      }
                      onClear={() =>
                        setNewMaterial((prev) => ({ ...prev, content: "" }))
                      }
                    />
                    {newMaterial.content && (
                      <div className="text-[10px] text-gray-500 font-bold ml-1 flex flex-col gap-1">
                        <span>Uploaded Target URL:</span>
                        <span className="font-mono text-indigo-400 select-all truncate bg-slate-950 p-2 rounded-lg border border-gray-900">
                          {newMaterial.content}
                        </span>
                      </div>
                    )}
                  </div>
                ) : newMaterial.type === "video" ? (
                  <div className="space-y-3">
                    <CloudinaryUploader
                      theme={theme}
                      allowedType="video"
                      onUploadSuccess={(url) =>
                        setNewMaterial((prev) => ({ ...prev, content: url }))
                      }
                      onClear={() =>
                        setNewMaterial((prev) => ({ ...prev, content: "" }))
                      }
                    />
                    {newMaterial.content ? (
                      <div className="text-[10px] text-gray-500 font-bold ml-1 flex flex-col gap-1">
                        <span>Uploaded Video URL:</span>
                        <span className="font-mono text-indigo-400 select-all truncate bg-slate-950 p-2 rounded-lg border border-gray-900">
                          {newMaterial.content}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">
                          Or Paste Video URL / YouTube Link
                        </label>
                        <input
                          value={newMaterial.content}
                          onChange={(e) =>
                            setNewMaterial({
                              ...newMaterial,
                              content: e.target.value,
                            })
                          }
                          placeholder="https://..."
                          className={`w-full ${theme === "dark" ? "bg-gray-950 border-gray-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"} rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 border`}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">
                      Content or Link
                    </label>
                    <textarea
                      value={newMaterial.content}
                      onChange={(e) =>
                        setNewMaterial({
                          ...newMaterial,
                          content: e.target.value,
                        })
                      }
                      rows={4}
                      placeholder={
                        newMaterial.type === "blog"
                          ? "Markdown article content..."
                          : "Provide details or link here..."
                      }
                      className={`w-full ${theme === "dark" ? "bg-gray-950 border-gray-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"} rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 resize-none border`}
                    />
                  </div>
                )}

                {newMaterial.type === "blog" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">
                        Excerpt (Short Summary)
                      </label>
                      <textarea
                        value={newMaterial.excerpt}
                        onChange={(e) =>
                          setNewMaterial({
                            ...newMaterial,
                            excerpt: e.target.value,
                          })
                        }
                        rows={2}
                        placeholder="Brief summary for the blog list..."
                        className={`w-full ${theme === "dark" ? "bg-gray-950 border-gray-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"} rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 resize-none border`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">
                        Featured Image URL
                      </label>
                      <input
                        value={newMaterial.image}
                        onChange={(e) =>
                          setNewMaterial({
                            ...newMaterial,
                            image: e.target.value,
                          })
                        }
                        placeholder="https://..."
                        className={`w-full ${theme === "dark" ? "bg-gray-950 border-gray-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"} rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 border`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">
                        Tags (comma separated)
                      </label>
                      <input
                        value={newMaterial.tags}
                        onChange={(e) =>
                          setNewMaterial({
                            ...newMaterial,
                            tags: e.target.value,
                          })
                        }
                        placeholder="MSCE, Biology, Tips"
                        className={`w-full ${theme === "dark" ? "bg-gray-950 border-gray-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"} rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 border`}
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-2 flex-wrap">
                  {(["pdf", "video", "blog"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewMaterial({ ...newMaterial, type })}
                      className={`flex-1 py-3 px-2 rounded-xl font-bold text-[10px] uppercase tracking-widest border transition-all ${newMaterial.type === type ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20" : theme === "dark" ? "bg-gray-950 border-gray-800 text-gray-500" : "bg-slate-50 border-slate-200 text-slate-400"}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest text-center">
                  {newMaterial.type === "blog"
                    ? "Destined for: Knowledge Hub / Blog"
                    : newMaterial.type === "video"
                      ? "Destined for: Video Library"
                      : "Destined for: Study Library Vault"}
                </p>
                <button
                  type="submit"
                  disabled={publishing}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/20 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
                >
                  {publishing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Post Material <Plus size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <h3
                className={`${theme === "dark" ? "text-white" : "text-slate-700"} font-black text-xs uppercase tracking-widest px-1`}
              >
                Recent Materials
              </h3>
              {materials.map((mat) => (
                <div
                  key={mat.id}
                  className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"} p-4 rounded-3xl border flex items-center justify-between`}
                >
                  <div>
                    <h4
                      className={`font-bold text-sm ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                    >
                      {mat.title}
                    </h4>
                    <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                      {mat.type}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteMaterial(mat.id)}
                    className="p-3 text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500/20"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[32px] relative overflow-hidden">
              <Bell className="absolute right-[-5%] top-[-10%] w-24 h-24 text-amber-500/5 -rotate-12" />
              <h3
                className={`font-black text-lg ${theme === "dark" ? "text-white" : "text-slate-900"} mb-1`}
              >
                Push Notification
              </h3>
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest leading-tight">
                Broadcast to all students
              </p>

              <form
                onSubmit={handlePublishNotification}
                className="mt-8 space-y-5 relative z-10"
              >
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">
                    Alert Title
                  </label>
                  <input
                    value={notification.title}
                    onChange={(e) =>
                      setNotification({
                        ...notification,
                        title: e.target.value,
                      })
                    }
                    placeholder="Important Update"
                    className={`w-full ${theme === "dark" ? "bg-gray-950 border-gray-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"} rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-amber-500/50 border`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">
                    Alert Message
                  </label>
                  <textarea
                    value={notification.body}
                    onChange={(e) =>
                      setNotification({ ...notification, body: e.target.value })
                    }
                    rows={4}
                    placeholder="Type your message here..."
                    className={`w-full ${theme === "dark" ? "bg-gray-950 border-gray-800 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm"} rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-amber-500/50 resize-none border`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={publishing}
                  className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black shadow-xl shadow-amber-600/20 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
                >
                  {publishing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Send Announcement <Send size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <h3
                className={`${theme === "dark" ? "text-white" : "text-slate-700"} font-black text-xs uppercase tracking-widest px-1`}
              >
                Recent Alerts
              </h3>
              {notificationsList.map((notif) => (
                <div
                  key={notif.id}
                  className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"} p-4 rounded-3xl border flex items-center justify-between`}
                >
                  <div className="flex-1 mr-4">
                    <h4
                      className={`font-bold text-sm ${theme === "dark" ? "text-white" : "text-slate-900"} leading-tight`}
                    >
                      {notif.title}
                    </h4>
                    <p className="text-[10px] items-center text-gray-500 line-clamp-1 mt-1 font-medium">
                      {notif.body}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteNotification(notif.id)}
                    className="p-3 text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500/20 shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-8">
            <div
              className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200 shadow-sm"} p-6 rounded-3xl border`}
            >
              <h3
                className={`font-black text-lg ${theme === "dark" ? "text-white" : "text-slate-900"} mb-4`}
              >
                App Settings & API Limits
              </h3>

              <div className="space-y-6">
                <div
                  className={`${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-slate-50 border-slate-100"} p-4 rounded-2xl border flex flex-col items-center justify-center text-center`}
                >
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">
                    Total App API Usage
                  </span>
                  <div className="text-3xl font-black text-indigo-500">
                    {appSettings.totalApiCalls || 0}{" "}
                    <span className="text-[10px] text-gray-400 uppercase leading-none">
                      Requests
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-xs font-bold ${theme === "dark" ? "text-gray-400" : "text-slate-600"} uppercase tracking-widest mb-3`}
                  >
                    Free User Daily API Limit
                  </label>
                  <div
                    className={`${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-slate-50 border-slate-200"} border flex items-center rounded-2xl px-4 py-3 shadow-sm`}
                  >
                    <Activity size={18} className="text-gray-400 mr-3" />
                    <input
                      type="number"
                      value={appSettings.freeDailyLimit}
                      onChange={(e) =>
                        setAppSettings((prev) => ({
                          ...prev,
                          freeDailyLimit: parseInt(e.target.value) || 0,
                        }))
                      }
                      className={`w-full bg-transparent font-black ${theme === "dark" ? "text-white" : "text-slate-900"} outline-none`}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold mt-3 leading-relaxed">
                    Free tier users will be prompted to upgrade once they hit
                    this daily limit on inquiries.
                  </p>
                </div>

                <button
                  onClick={saveSettings}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex justify-center items-center gap-2"
                >
                  Save Settings <Save size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "feedback" && (
          <div className="space-y-4 pb-12">
            <h2
              className={`font-black text-xl px-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
            >
              User Feedback Logs
            </h2>
            {feedbackList.length === 0 && (
              <p className="text-sm font-bold text-gray-500 p-2">
                No feedback reported yet.
              </p>
            )}

            {feedbackList.map((fb) => (
              <div
                key={fb.id}
                className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"} border p-5 rounded-3xl shadow-sm flex flex-col gap-4`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`${fb.type === "positive" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"} text-[10px] uppercase font-black px-2 py-1 rounded-lg tracking-widest flex items-center gap-1`}
                      >
                        {fb.type === "positive" ? (
                          <ThumbsUp size={10} />
                        ) : (
                          <ThumbsDown size={10} />
                        )}
                        {fb.type === "positive" ? "Positive" : "Issue"}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${theme === "dark" ? "text-gray-500" : "text-slate-400"}`}
                      >
                        {fb.createdAt?.toDate
                          ? fb.createdAt.toDate().toLocaleString()
                          : "Just now"}
                      </span>
                    </div>
                    <div
                      className={`text-xs font-bold ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}
                    >
                      <span
                        className={
                          theme === "dark"
                            ? "text-indigo-400"
                            : "text-indigo-600"
                        }
                      >
                        {fb.userName}
                      </span>{" "}
                      ({fb.userEmail}) • {fb.userLevel}
                    </div>
                  </div>
                  {fb.comment && (
                    <div
                      className={`p-3 rounded-xl ${theme === "dark" ? "bg-gray-950 border-gray-800 text-gray-300" : "bg-slate-50 border-slate-200 text-slate-700"} border text-xs font-bold max-w-xs break-words`}
                    >
                      "{fb.comment}"
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div
                    className={`${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-slate-50 border-slate-200"} border p-4 rounded-2xl`}
                  >
                    <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2 flex items-center gap-1">
                      <MessageSquare size={12} /> User Prompt
                    </div>
                    <p
                      className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-slate-900"}`}
                    >
                      {fb.prompt || "(No preceding prompt)"}
                    </p>
                  </div>
                  <div
                    className={`${theme === "dark" ? "bg-indigo-950/30 border-indigo-500/20" : "bg-indigo-50/50 border-indigo-100"} border p-4 rounded-2xl`}
                  >
                    <div className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-2 flex items-center gap-1">
                      <Bot size={12} /> AI Generation
                    </div>
                    <p
                      className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-slate-900"} max-h-40 overflow-y-auto hide-scrollbar line-clamp-6`}
                      title={fb.generation}
                    >
                      {fb.generation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-6 pb-12 animate-in fade-in duration-300">
            <div className="flex justify-between items-center px-1 flex-wrap gap-2">
              <div>
                <h2
                  className={`font-black text-xl ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                >
                  Certificate Approvals
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-1 font-sans">
                  Confirm payment of K5,000 for students waiting to download
                  their official credentials.
                </p>
              </div>
              {pendingCerts.length > 0 && (
                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/25 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1 font-sans">
                  <Award size={12} /> {pendingCerts.length} Pending Approval
                </span>
              )}
            </div>

            {pendingCerts.length === 0 ? (
              <div
                className={`text-center py-24 ${theme === "dark" ? "bg-gray-900/40 border-gray-805" : "bg-white border-slate-200 shadow-inner"} border border-dashed rounded-3xl p-8`}
              >
                <Award
                  size={48}
                  className="mx-auto mb-4 text-gray-655"
                  strokeWidth={1}
                />
                <p className="text-sm font-bold text-gray-500 font-sans">
                  No pending certificate payments to confirm. All clear!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {pendingCerts.map((cert) => (
                  <div
                    key={cert.id}
                    className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200 shadow-sm"} border rounded-3xl p-5 flex flex-col justify-between hover:border-indigo-500/30 transition-all`}
                  >
                    <div>
                      <div className="flex items-start gap-4">
                        {cert.photoUrl ? (
                          <div className="relative w-16 h-20 rounded-xl overflow-hidden border border-indigo-500/30 shrink-0 shadow-md">
                            <img
                              src={cert.photoUrl}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-20 bg-gray-950 border border-gray-800 rounded-xl flex flex-col items-center justify-center text-[8px] text-gray-505 font-black uppercase shrink-0 text-center leading-tight p-1 gap-1">
                            <User size={16} className="text-gray-700" />
                            <span className="font-sans">No Photo</span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0 text-left">
                          <h4
                            className={`font-black text-sm capitalize truncate ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                          >
                            {cert.name}
                          </h4>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mt-0.5 truncate font-sans">
                            {cert.userEmail}
                          </p>

                          <div className="flex gap-2 mt-2 flex-wrap">
                            <span className="text-[8.5px] font-black px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 uppercase font-sans">
                              {cert.type === "attendance"
                                ? "Attendance"
                                : "Appreciation"}
                            </span>
                            <span className="text-[8.5px] font-mono font-black px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/15 uppercase font-sans">
                              {cert.paymentProvider
                                ? cert.paymentProvider.toUpperCase()
                                : "TELECOM"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`mt-5 p-3.5 rounded-2xl ${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-slate-50 border-slate-100"} border text-xs text-left space-y-1.5`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-bold uppercase text-[9px] font-sans">
                            Requested Date
                          </span>
                          <span
                            className={`font-black ${theme === "dark" ? "text-gray-300" : "text-slate-700"}`}
                          >
                            {cert.date}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-505 font-bold uppercase text-[9px] font-sans">
                            Sender Mobile
                          </span>
                          <span className="font-mono font-black text-indigo-400">
                            {cert.phoneNumber || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-bold uppercase text-[9px] font-sans">
                            Serial Code
                          </span>
                          <span className="font-mono font-bold text-gray-500 select-all">
                            {cert.certificateId}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-800/10 dark:border-gray-800/40 flex gap-2 w-full">
                      <button
                        onClick={async () => {
                          if (
                            !window.confirm(
                              `Confirm mobile money payment of K5,000 for ${cert.name}?`,
                            )
                          )
                            return;
                          try {
                            await updateDoc(doc(db, "certificates", cert.id), {
                              isPaid: true,
                              paymentStatus: "approved",
                            });
                            // Store a general system-wide alert so they can receive it in notification feeds
                            await addDoc(collection(db, "notifications"), {
                              title: "Certificate Approved! 🎉",
                              body: `Congratulations ${cert.name}! Your official Certificate of ${cert.type === "attendance" ? "Attendance" : "Appreciation"} has been authenticated by the Educate Mw committee and is now fully downloadable.`,
                              readBy: [],
                              createdAt: serverTimestamp(),
                            });
                            alert(
                              `Confirmed payment for ${cert.name}. Ready to download!`,
                            );
                          } catch (err: any) {
                            alert("Error confirming payment: " + err.message);
                          }
                        }}
                        className="flex-1 py-2.5 bg-emerald-605 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider rounded-xl active:scale-95 transition-all shadow-md cursor-pointer font-sans"
                      >
                        Confirm Payment
                      </button>
                      <button
                        onClick={async () => {
                          if (
                            !window.confirm(
                              `Decline and delete the request for ${cert.name}?`,
                            )
                          )
                            return;
                          try {
                            await deleteDoc(doc(db, "certificates", cert.id));
                            alert("Request deleted.");
                          } catch (err: any) {
                            alert("Error deleting request: " + err.message);
                          }
                        }}
                        className={`py-2.5 px-4 ${theme === "dark" ? "bg-gray-950 hover:bg-gray-800" : "bg-slate-100 hover:bg-slate-200"} text-rose-500 font-black text-[10px] uppercase tracking-wider rounded-xl active:scale-95 transition-all border border-transparent hover:border-rose-500/20 cursor-pointer font-sans`}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AppSettingsModal({
  isOpen,
  onClose,
  theme,
  onThemeToggle,
}: {
  isOpen: boolean;
  onClose: () => void;
  theme: "light" | "dark";
  onThemeToggle: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[200] flex animate-in fade-in duration-200 ${theme === "dark" ? "bg-gray-950" : "bg-slate-50"}`}>
      <div
        className={`w-full h-full p-6 pt-10 sm:p-8 md:p-12 max-w-2xl mx-auto flex flex-col animate-in slide-in-from-right duration-300 overflow-y-auto hide-scrollbar`}
      >
        <div className="mb-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-[24px] p-1 bg-blue-600 overflow-hidden shadow-xl shadow-blue-600/20 mb-4 border border-blue-500/30">
            <img 
              src="/app-icon.jpg" 
              alt="Educate MW Logo" 
              className="w-full h-full object-cover rounded-[20px]" 
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600">v3.5.2 Build</p>
        </div>

        <div className="flex justify-between items-center mb-8 sticky top-0 bg-inherit z-30 pt-2 border-b border-gray-500/10 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === "dark" ? "bg-gray-800 text-gray-300" : "bg-slate-100 text-slate-600"}`}>
              <Settings size={20} />
            </div>
            <h3 className={`text-xl font-black tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
              App Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`text-gray-500 hover:${theme === "dark" ? "text-white" : "text-slate-900"} ${theme === "dark" ? "bg-gray-800 hover:bg-gray-700" : "bg-slate-100 hover:bg-slate-200"} rounded-full p-2.5 active:scale-95 transition-all`}
          >
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        <div className="space-y-4">
          <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 pl-1 ${theme === "dark" ? "text-indigo-400" : "text-indigo-600"}`}>
            Preferences
          </h4>
          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className={`w-full ${theme === "dark" ? "bg-gray-950 border-gray-800 hover:border-gray-700" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"} p-4 rounded-[20px] border flex items-center justify-between group active:scale-[0.98] transition-all`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${theme === "dark" ? "bg-indigo-950/50 text-indigo-400" : "bg-indigo-50 text-indigo-600"} flex items-center justify-center`}>
                {theme === "dark" ? <Moon size={22} strokeWidth={2.5} /> : <Sun size={22} strokeWidth={2.5} />}
              </div>
              <div className="text-left">
                <p className={`font-black tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"} text-sm md:text-base`}>
                  Interface Theme
                </p>
                <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                  {theme === "dark" ? "Dark Mode Active" : "Light Mode Active"}
                </p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full relative transition-colors border shadow-inner ${theme === "dark" ? "bg-indigo-600 border-indigo-700" : "bg-slate-200 border-slate-300"}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${theme === "dark" ? "left-7" : "left-1"}`} />
            </div>
          </button>

          {/* Notifications */}
          <div className={`w-full ${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-slate-50 border-slate-200"} p-4 rounded-[20px] border flex items-center justify-between opacity-60 cursor-not-allowed`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${theme === "dark" ? "bg-blue-950/30 text-blue-400" : "bg-blue-50 text-blue-500"} flex items-center justify-center`}>
                <Bell size={22} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <p className={`font-black tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"} text-sm md:text-base`}>
                  Push Notifications
                </p>
                <p className="text-[10px] md:text-xs text-blue-500 font-black uppercase tracking-widest mt-0.5">
                  Available Soon
                </p>
              </div>
            </div>
            <div className="w-12 h-6 rounded-full relative bg-gray-400/20 shadow-inner border border-gray-500/10">
              <div className="absolute top-1 py-1 left-1 w-4 h-4 rounded-full bg-gray-400/50 shadow-sm" />
            </div>
          </div>

          <div className="pt-6 pb-2">
            <h4
              className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 pl-1 ${theme === "dark" ? "text-indigo-400" : "text-indigo-600"}`}
            >
              Legal & About
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => {
                  onClose();
                  window.history.pushState({}, "", "/terms");
                  window.dispatchEvent(new Event("popstate"));
                  window.location.reload();
                }}
                className={`w-full text-left p-4 rounded-2xl ${theme === "dark" ? "hover:bg-gray-800 text-gray-300" : "hover:bg-slate-50 text-slate-600"} transition-colors font-bold text-sm flex items-center justify-between`}
              >
                Terms of Service
                <ArrowRight size={14} className="opacity-40" />
              </button>
              <button
                onClick={() => {
                  onClose();
                  window.history.pushState({}, "", "/privacy");
                  window.dispatchEvent(new Event("popstate"));
                  window.location.reload();
                }}
                className={`w-full text-left p-4 rounded-2xl ${theme === "dark" ? "hover:bg-gray-800 text-gray-300" : "hover:bg-slate-50 text-slate-600"} transition-colors font-bold text-sm flex items-center justify-between`}
              >
                Privacy Policy
                <ArrowRight size={14} className="opacity-40" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 mb-6 flex flex-col items-center justify-center text-center">
          <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
            Educate MW &bull; v3.5.2
          </p>
          <p className="text-[10px] text-gray-400 font-semibold tracking-tight mt-0.5">
            Malawi's Premier Digital Learning Platform
          </p>
        </div>
      </div>
    </div>
  );
}

function LegalPageView({
  type,
  theme,
  onBack,
}: {
  type: "terms" | "privacy";
  theme: "light" | "dark";
  onBack: () => void;
}) {
  return (
    <div
      className={`min-h-full ${theme === "dark" ? "bg-gray-950" : "bg-slate-50"} p-6 pt-12 animate-in fade-in duration-500`}
    >
      <div className="flex items-center gap-4 mb-8 max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className={`w-12 h-12 ${theme === "dark" ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-slate-200 text-slate-900"} rounded-2xl flex items-center justify-center border shadow-sm active:scale-90 transition-transform`}
        >
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <div>
          <h1
            className={`text-2xl sm:text-3xl font-black ${theme === "dark" ? "text-white" : "text-slate-900"} uppercase tracking-tight`}
          >
            {type === "terms" ? "Terms of Service" : "Privacy Policy"}
          </h1>
          <p className="text-xs text-indigo-500 font-bold tracking-wider uppercase">
            Educate MW • Official Educational Platform
          </p>
        </div>
      </div>
      <div
        className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"} rounded-[2.5rem] p-6 sm:p-10 border shadow-xl max-w-4xl mx-auto`}
      >
        <div
          className={`prose prose-sm max-w-none ${theme === "dark" ? "prose-invert text-gray-300" : "text-slate-700"} font-medium space-y-6 leading-relaxed`}
        >
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
            <span className="text-xs uppercase tracking-widest font-black text-indigo-500">
              Effective Date: January 1, 2026 (Updated)
            </span>
            <span className="text-xs text-gray-500 font-semibold">
              Host: https://educatemw.vercel.app
            </span>
          </div>

          {type === "privacy" ? (
            <>
              <div>
                <h2 className="text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  1. Overview & Application Identity
                </h2>
                <p>
                  <strong>Educate MW</strong> ("we", "our", or "us"), available at <strong>https://educatemw.vercel.app</strong>, is an educational learning application designed to empower secondary school students in Malawi preparing for Junior Certificate of Education (JCE) and Malawi School Certificate of Education (MSCE) national examinations administered by MANEB.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  2. User Data We Collect & Request
                </h2>
                <p>
                  We are committed to full transparency regarding user data. When you access Educate MW, we collect only the minimal data required to provide a personalized, secure educational experience:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Google Account Information (via Google Sign-In):</strong> When you sign in with Google, we access your basic public profile information, specifically your <strong>Name</strong>, <strong>Email Address</strong>, and <strong>Profile Picture</strong>.
                  </li>
                  <li>
                    <strong>Academic Progress Data:</strong> We store your syllabus topic completion checklist, quiz scores, flashcard sets, study streak counters, and authenticated certificates.
                  </li>
                  <li>
                    <strong>Device & Authentication Session Tokens:</strong> Standard Firebase Authentication tokens used strictly to keep your session logged in securely.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  3. Purpose of Data Processing (Why We Request Data)
                </h2>
                <p>We process your data solely for the following educational and functional purposes:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>To authenticate your identity and maintain your student account across multiple devices.</li>
                  <li>To save and synchronize your syllabus progress, mock examination results, and study bookmarks.</li>
                  <li>To generate personalized, grade-appropriate responses from Emi AI tutor tailored to your specific school class (e.g. Form 1, Form 2, Form 3, or Form 4).</li>
                  <li>To issue downloadable and verifiable certificates of academic completion.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  4. Google API User Data Policy & Limited Use Disclosure
                </h2>
                <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800">
                  <p className="font-semibold text-indigo-900 dark:text-indigo-200 text-sm">
                    <strong>Google API Compliance:</strong> Educate MW's use and transfer of information received from Google APIs to any other app will adhere to the{" "}
                    <a
                      href="https://developers.google.com/terms/api-services-user-data-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-bold text-indigo-600 dark:text-indigo-400"
                    >
                      Google API Services User Data Policy
                    </a>
                    , including the Limited Use requirements.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  5. Third-Party Sharing & Data Protection
                </h2>
                <p>
                  <strong>We do NOT sell, rent, monetize, or trade your personal data or Google user data with any third parties or advertisers.</strong>
                </p>
                <p>
                  Your information is stored in secured, encrypted Google Cloud / Firebase Firestore databases with strict role-based access rules preventing unauthorized access.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  6. User Data Rights & Account Deletion
                </h2>
                <p>
                  You retain full ownership of your data. You have the right to request access to, export, or permanently delete your account and all associated data at any time.
                </p>
                <p>
                  To request immediate deletion of your account and all stored records, you can use the in-app account settings or email our data protection administrator at:{" "}
                  <a href="mailto:petedianotech@gmail.com" className="font-bold text-indigo-600 dark:text-indigo-400 underline">
                    petedianotech@gmail.com
                  </a>
                  . Deletion requests are processed within 48 hours.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  1. Agreement to Terms
                </h2>
                <p>
                  By accessing or using <strong>Educate MW</strong> (https://educatemw.vercel.app), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  2. Description of Educational Services
                </h2>
                <p>
                  Educate MW provides Malawian secondary school students with educational study aids, including MANEB syllabus checklists, past paper archives, interactive practice quizzes, flashcards, study notes, and the Emi AI educational tutoring assistant.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  3. Student Code of Conduct & Acceptable Use
                </h2>
                <p>Users agree to:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Use the service solely for legitimate academic and educational learning purposes.</li>
                  <li>Maintain respectful communication in community forums and AI chat sessions.</li>
                  <li>Not attempt to reverse engineer, scrape, overload, or disrupt the platform's infrastructure.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  4. Intellectual Property & Academic Guidance
                </h2>
                <p>
                  Emi AI is an AI-powered educational study companion designed to explain concepts and assist revision. Students are advised to verify critical examination guidelines and dates with official school teachers and MANEB circulars.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  5. Contact Information
                </h2>
                <p>
                  If you have questions regarding these Terms or the platform, contact the Educate Malawi administrative team at:{" "}
                  <a href="mailto:petedianotech@gmail.com" className="font-bold text-indigo-600 dark:text-indigo-400 underline">
                    petedianotech@gmail.com
                  </a>
                  .
                </p>
              </div>
            </>
          )}

          <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <button
              onClick={onBack}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all"
            >
              Return to Homepage
            </button>
            <p className="text-xs text-gray-500 font-semibold">
              © {new Date().getFullYear()} Educate Malawi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getYouTubeId(url: string) {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

function VideosView({
  theme,
  onBack,
}: {
  theme: "light" | "dark";
  onBack: () => void;
}) {
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [videos, setVideos] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem("mw_videos_cache");
      return cached ? JSON.parse(cached) : DEFAULT_VIDEOS;
    } catch {
      return DEFAULT_VIDEOS;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 2500);

    const qVideos = query(
      collection(db, "materials"),
      where("type", "==", "video"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      qVideos,
      (snapshot) => {
        if (!isMounted) return;
        clearTimeout(safetyTimeout);
        if (!snapshot.empty) {
          const liveVideos: any[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          // Merge with DEFAULT_VIDEOS to ensure a rich collection
          const merged = [
            ...liveVideos,
            ...DEFAULT_VIDEOS.filter(dv => !liveVideos.some((lv: any) => lv.title === dv.title)),
          ];
          setVideos(merged);
          try {
            localStorage.setItem("mw_videos_cache", JSON.stringify(merged));
          } catch {}
        } else if (videos.length === 0) {
          setVideos(DEFAULT_VIDEOS);
        }
        setLoading(false);
      },
      (err) => {
        clearTimeout(safetyTimeout);
        if (isMounted) {
          if (!err.message.includes("offline")) {
            console.warn("Videos snapshot notice:", err);
          }
          if (videos.length === 0) {
            setVideos(DEFAULT_VIDEOS);
          }
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, []);

  const VIDEO_SUBJECTS = [
    "All",
    "Biology",
    "Physics",
    "Chemistry",
    "Mathematics",
    "English",
    "Geography",
    "Agriculture",
    "History",
  ];

  const filteredVideos = videos.filter((video) => {
    const matchesSubject =
      selectedSubject === "All" ||
      (video.subject || "").toLowerCase() === selectedSubject.toLowerCase() ||
      (video.title || "").toLowerCase().includes(selectedSubject.toLowerCase()) ||
      (video.desc || "").toLowerCase().includes(selectedSubject.toLowerCase());

    const matchesSearch =
      !searchQuery.trim() ||
      (video.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (video.desc || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (video.subject || "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSubject && matchesSearch;
  });

  return (
    <div
      className={`min-h-full ${theme === "dark" ? "bg-gray-950 text-gray-100" : "bg-slate-50 text-slate-900"} p-5 sm:p-8 pt-8 animate-in fade-in duration-300 pb-28 max-w-5xl mx-auto w-full`}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className={`w-12 h-12 ${theme === "dark" ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-slate-200 text-slate-900"} rounded-2xl flex items-center justify-center border shadow-sm active:scale-90 transition-transform`}
        >
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <div>
          <h1
            className={`text-2xl font-black ${theme === "dark" ? "text-white" : "text-slate-900"} uppercase tracking-tight`}
          >
            Video Lessons & Tutorials
          </h1>
          <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-widest mt-0.5">
            MSCE & JCE Curriculum Visual Guides
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div
        className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200 shadow-sm"} rounded-2xl px-4 py-3 flex items-center border mb-4 focus-within:border-indigo-500 transition-colors`}
      >
        <Search size={18} className="text-gray-400 mr-3 shrink-0" />
        <input
          type="text"
          placeholder="Search video tutorials by topic, subject, or title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`bg-transparent outline-none flex-1 text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"} placeholder-gray-400`}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-1.5"
          >
            Clear
          </button>
        )}
      </div>

      {/* Subject Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 hide-scrollbar">
        {VIDEO_SUBJECTS.map((subject) => {
          const isSelected = selectedSubject === subject;
          return (
            <button
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 border shrink-0 ${
                isSelected
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : theme === "dark"
                  ? "bg-gray-900 text-gray-300 border-gray-800 hover:bg-gray-800 hover:text-white"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600"
              }`}
            >
              {subject}
            </button>
          );
        })}
      </div>

      {loading && videos.length === 0 ? (
        <div className="py-20 flex justify-center">
          <EmiSpinner size="md" theme={theme} />
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-[28px] border border-slate-200 dark:border-gray-800 p-8">
          <div
            className={`w-16 h-16 ${theme === "dark" ? "bg-gray-800 text-gray-500" : "bg-slate-100 text-slate-400"} rounded-2xl flex items-center justify-center mx-auto mb-4`}
          >
            <Video size={32} strokeWidth={1.5} />
          </div>
          <p
            className={`text-base font-black ${theme === "dark" ? "text-white" : "text-slate-900"} uppercase tracking-wider mb-1`}
          >
            No Videos Found
          </p>
          <p className="text-xs text-gray-500 max-w-sm mx-auto font-medium">
            Try adjusting your search query or select "All" from the subject categories above.
          </p>
          <button
            onClick={() => {
              setSelectedSubject("All");
              setSearchQuery("");
            }}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold active:scale-95"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredVideos.map((video) => {
            const videoId = getYouTubeId(video.url || video.content || "");
            return (
              <div
                key={video.id}
                className={`${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"} rounded-3xl overflow-hidden border shadow-md flex flex-col justify-between group hover:border-indigo-500/50 transition-all`}
              >
                <div className="aspect-video bg-black relative">
                  {videoId ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
                      title={video.title}
                      frameBorder="0"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    ></iframe>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 flex-col">
                      <Video size={32} className="mb-2 opacity-50" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Video Preview
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {video.subject && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                          {video.subject}
                        </span>
                      )}
                      {video.level && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          {video.level}
                        </span>
                      )}
                    </div>
                    <h3
                      className={`font-black text-base leading-snug ${theme === "dark" ? "text-white" : "text-slate-900"} mb-1.5`}
                    >
                      {video.title}
                    </h3>
                    {video.desc && (
                      <p
                        className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-slate-600"} font-medium line-clamp-2 leading-relaxed`}
                      >
                        {video.desc}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MaterialDetailView({
  slug,
  onBack,
  theme,
  profile,
  onUpdateProfile,
  onOpenPdf,
}: {
  slug: string;
  onBack: () => void;
  theme: "light" | "dark";
  profile?: any;
  onUpdateProfile?: (p: any) => void;
  onOpenPdf?: (url: string, title: string) => void;
}) {
  const [material, setMaterial] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch specifically by slug or ID
    const q = query(collection(db, "materials"), where("slug", "==", slug));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      let matData: any = null;
      if (!snapshot.empty) {
        matData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      } else {
        // Fallback for direct ID access
        const docRef = doc(db, "materials", slug);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            matData = { id: docSnap.id, ...docSnap.data() };
          }
        } catch (e) {
          console.error("Library material fetch error:", e);
        }
      }

      if (matData) {
        setMaterial(matData);
        // Track view for Library Reader achievement
        if (profile && onUpdateProfile && auth.currentUser) {
          const viewed = profile.viewedMaterials || [];
          if (!viewed.includes(matData.id)) {
            const newViewed = [...viewed, matData.id];
            let newAchievements = [...(profile.achievements || [])];
            if (!newAchievements.includes("library_reader") && newViewed.length >= 5) {
              newAchievements.push("library_reader");
            }
            try {
              await updateDoc(doc(db, "users", auth.currentUser.uid), {
                viewedMaterials: newViewed,
                achievements: newAchievements,
              });
              onUpdateProfile({ ...profile, viewedMaterials: newViewed, achievements: newAchievements });
            } catch (err) {
              console.error("Failed to track view:", err);
            }
          }
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [slug, profile?.id]); // Adding profile?.id to deps to ensure we have it

  if (loading)
    return <EmiLoader text="Opening study material..." theme={theme} />;

  if (!material)
    return (
      <div
        className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center ${theme === "dark" ? "bg-gray-950 text-white" : "bg-slate-50 text-slate-900"}`}
      >
        <button
          onClick={onBack}
          className="mb-4 bg-gray-900 text-white p-2 rounded-lg"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold mb-2 uppercase tracking-widest">
          Material Not Found
        </h2>
        <p className="text-sm opacity-60 font-medium">
          The resource you are looking for does not exist or has been removed.
        </p>
        <button
          onClick={onBack}
          className="mt-6 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/30"
        >
          Explore Library
        </button>
      </div>
    );

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col ${theme === "dark" ? "bg-gray-950 text-white" : "bg-slate-50 text-slate-900"} animate-in slide-in-from-right duration-300`}
    >
      <div
        className={`${theme === "dark" ? "bg-gray-950/80" : "bg-white/80"} backdrop-blur-xl pt-4 pb-2 px-5 flex items-center shrink-0 z-10 border-b ${theme === "dark" ? "border-white/5" : "border-slate-200"}`}
      >
        <button
          onClick={onBack}
          className={`w-10 h-10 ${theme === "dark" ? "bg-gray-800 text-white" : "bg-slate-100 text-slate-700"} rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition-all`}
        >
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <div className="ml-4 flex-1 truncate">
          <h2 className="font-black text-xs leading-tight uppercase tracking-widest truncate">
            {material.title}
          </h2>
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">
            {material.type}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 hide-scrollbar">
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-600/10 text-indigo-400 text-[10px] font-black rounded-lg border border-indigo-500/20 uppercase tracking-widest">
              Library Vault
            </span>
            <span className="text-[10px] font-bold text-gray-500">
              {material.createdAt?.toDate
                ? material.createdAt.toDate().toLocaleDateString()
                : "New Release"}
            </span>
          </div>

          <h1 className="text-3xl font-black leading-[1.1] tracking-tight">
            {material.title}
          </h1>

          <div
            className={`flex items-center gap-4 py-8 border-y ${theme === "dark" ? "border-white/5" : "border-slate-100"}`}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black shadow-lg">
              MW
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                Publisher
              </p>
              <p className="text-sm font-bold">Educate MW Academic Team</p>
            </div>
          </div>

          <div
            className={`prose ${theme === "dark" ? "prose-invert" : ""} max-w-none prose-p:text-base prose-p:leading-relaxed prose-p:font-medium prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest`}
          >
            {material.content?.split("\n").map((para: string, i: number) => {
              const isUrl = para.trim().startsWith("http");
              if (material.type === "pdf" && isUrl) {
                return (
                  <div
                    key={i}
                    className="my-8 p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center text-center"
                  >
                    <ScrollText size={40} className="text-indigo-500 mb-4" />
                    <h4 className="text-sm font-black uppercase tracking-widest mb-1">
                      {para.trim().includes("cloudinary.com")
                        ? "Official Syllabus Document"
                        : "Reference Syllabus Document"}
                    </h4>
                    <p className="text-xs opacity-60 mb-6 leading-relaxed max-w-sm">
                      {para.trim().includes("cloudinary.com")
                        ? "Highly optimized PDF notes securely stored for fast offline download."
                        : "This document is hosted externally (e.g. Google Drive)."}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                      <button
                        onClick={() => {
                          if (onOpenPdf) {
                            let targetUrl = para.trim();
                            if (
                              targetUrl.includes("drive.google.com") &&
                              targetUrl.includes("/view")
                            ) {
                              targetUrl = targetUrl.replace(
                                "/view",
                                "/preview",
                              );
                            }
                            onOpenPdf(targetUrl, material.title);
                          } else {
                            window.open(para.trim(), "_blank");
                          }
                        }}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Read Online
                      </button>

                      {para.trim().includes("cloudinary.com") && (
                        <button
                          onClick={async () => {
                            await triggerExplicitDownload(
                              para.trim(),
                              material.title,
                            );
                          }}
                          className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          Download PDF
                        </button>
                      )}
                    </div>
                  </div>
                );
              }
              return (
                <p key={i} className="mb-4 text-justify whitespace-pre-wrap">
                  {para}
                </p>
              );
            })}
          </div>

          <div
            className={`mt-12 p-8 rounded-[32px] ${theme === "dark" ? "bg-indigo-600/5 border-indigo-500/10" : "bg-indigo-50 border-indigo-200"} border flex flex-col items-center text-center`}
          >
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6">
              <Trophy className="text-indigo-500" size={32} />
            </div>
            <h3 className="text-lg font-black uppercase mb-2">
              Mastered this topic?
            </h3>
            <p className="text-sm opacity-60 font-medium mb-8">
              Great job on finishing your study! Take a quick quiz to cement
              this in your memory.
            </p>
            <button
              onClick={onBack}
              className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all"
            >
              Start Subject Quiz
            </button>
          </div>
        </div>
        <div className="h-20" />
      </div>
    </div>
  );
}

function LocalMaterialView({
  url,
  title,
  onBack,
  theme,
}: {
  url: string;
  title: string;
  onBack: () => void;
  theme: "light" | "dark";
}) {
  return (
    <div
      className={`absolute inset-0 z-[100] flex flex-col ${theme === "dark" ? "bg-gray-950 text-white" : "bg-slate-50 text-slate-900"} animate-in slide-in-from-bottom duration-500`}
    >
      <div
        className={`${theme === "dark" ? "bg-gray-950/80 border-white/5" : "bg-white/80 border-slate-200"} backdrop-blur-xl pt-4 pb-2 px-5 flex items-center shrink-0 z-50 border-b shadow-lg`}
      >
        <button
          onClick={onBack}
          className={`w-10 h-10 ${theme === "dark" ? "bg-gray-800 text-white" : "bg-slate-100 text-slate-700"} rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition-all`}
        >
          <ArrowLeft size={24} strokeWidth={3} />
        </button>
        <div className="ml-4 flex-1 truncate">
          <h2 className="font-black text-xs leading-tight uppercase tracking-widest truncate">
            {title}
          </h2>
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1">
            <CheckCircle2 size={10} /> Local Study Session
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative bg-gray-800">
        <iframe
          src={`${url}#toolbar=0`}
          className="w-full h-full border-none shadow-2xl"
          title="Local Material"
        />

        <div className="absolute inset-0 pointer-events-none border-[12px] border-indigo-600/10 rounded-none z-10"></div>
      </div>

      <div
        className={`p-6 ${theme === "dark" ? "bg-gray-900 border-white/5" : "bg-white border-slate-200"} border-t z-50`}
      >
        <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <FileIcon size={20} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-500">
                Offline Mode
              </p>
              <p className="text-[11px] font-bold">Reading from device</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
          >
            Exit Reader
          </button>
        </div>
      </div>
    </div>
  );
}

function PwaInstallPrompt({
  onInstall,
  onDismiss,
  theme,
}: {
  onInstall: () => void;
  onDismiss: () => void;
  theme: "light" | "dark";
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div
        className={`w-full max-w-sm rounded-[32px] overflow-hidden border p-6 flex flex-col items-center text-center relative ${
          theme === "dark"
            ? "bg-gray-900 border-gray-800 text-white shadow-[0_25px_60px_rgba(0,0,0,0.8)]"
            : "bg-white border-slate-200 text-slate-800 shadow-[0_25px_60px_rgba(4,9,33,0.15)]"
        } animate-in zoom-in-95 duration-300`}
      >
        {/* Close Button */}
        <button
          onClick={onDismiss}
          className={`absolute top-4 right-4 p-2 rounded-full ${
            theme === "dark"
              ? "hover:bg-gray-800 text-gray-400 hover:text-white"
              : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
          } transition-all active:scale-95`}
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {/* Circular glowing badge for app icon */}
        <div className="relative mb-5 mt-2">
          {/* Subtle outer elevation */}
          <div className="absolute -inset-1 bg-blue-600 rounded-[24px] blur-sm opacity-30 animate-pulse"></div>
          <div
            className={`relative w-20 h-20 rounded-[22px] overflow-hidden shadow-xl p-1 bg-blue-600 border border-blue-500/30`}
          >
            <img
              src="/app-icon.jpg"
              alt="Educate MW App Icon"
              className="w-full h-full object-cover rounded-[18px]"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Title & Brand */}
        <div className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/40 mb-3">
          <Sparkles
            size={11}
            className="text-indigo-600 dark:text-indigo-400 animate-spin"
            style={{ animationDuration: "4s" }}
          />
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
            FAST LAUNCH ACTIVE
          </span>
        </div>

        <h3
          className={`text-xl font-black tracking-tight leading-tight mb-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
        >
          Install Educate MW
        </h3>

        <p
          className={`text-xs leading-relaxed font-semibold mb-5 ${theme === "dark" ? "text-gray-400" : "text-slate-500"} max-w-[280px]`}
        >
          Add Educate Malawi to your Home Screen for easy 1-click
          access, super-fast load speeds, and offline MSCE / JCE study
          session packs!
        </p>

        {/* Features list */}
        <div
          className={`w-full rounded-2xl p-4 mb-6 flex flex-col gap-3 text-left border ${
            theme === "dark"
              ? "bg-gray-950/50 border-gray-800"
              : "bg-slate-50/80 border-slate-100"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-500 shrink-0">
              <CheckCircle size={12} strokeWidth={3} />
            </div>
            <span className="text-[11px] font-bold">
              1-Click Fast Home Screen Launcher
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-500/15 flex items-center justify-center text-indigo-500 shrink-0">
              <Download size={12} strokeWidth={3} />
            </div>
            <span className="text-[11px] font-bold">
              Full Offline Note Downloads
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-500 shrink-0">
              <Sparkles size={12} strokeWidth={3} />
            </div>
            <span className="text-[11px] font-bold">
              Optimized Battery & Network Speeds
            </span>
          </div>
        </div>

        {/* Access Buttons */}
        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={onInstall}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black uppercase tracking-wider text-[11px] rounded-2xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Download size={14} strokeWidth={2.5} /> Install Now
          </button>
          <button
            onClick={onDismiss}
            className="w-full py-3 text-[11px] font-black uppercase tracking-wider text-gray-500 hover:text-gray-400"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

function EmiProAdvertisingBanner({
  onUpgrade,
  onDismiss,
  theme,
}: {
  onUpgrade: () => void;
  onDismiss: () => void;
  theme: "light" | "dark";
}) {
  return (
    <div
      className={`px-4 py-4.5 border-t border-b ${
        theme === "dark"
          ? "bg-gradient-to-br from-indigo-950 via-gray-950 to-indigo-950 border-indigo-500/20"
          : "bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 border-indigo-500/30"
      } text-white shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom duration-400 flex flex-col sm:flex-row items-center gap-4 justify-between`}
    >
      {/* Background radial overlays */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

      {/* Title block with sparkles */}
      <div className="flex items-start gap-3 flex-1">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/15">
          <Sparkles size={20} fill="currentColor" fillOpacity={0.2} />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30">
              EXAM READY
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500/25 text-amber-300 px-2 py-0.5 rounded-md">
              LIMITED FREE ACCOUNTS
            </span>
          </div>
          <h4 className="font-black text-sm tracking-tight leading-tight mt-1 mb-0.5">
            Unlock Unlimited MSCE & JCE Exam Success!
          </h4>
          <p className="text-[11px] text-gray-300 font-semibold leading-relaxed max-w-xl">
            You are currently using Emi AI in free tier mode with limited
            question credits. Upgrade to **Educate MW PRO** for K7,000
            (Airtel Money) to ask unlimited syllabus questions,
            voice-call Emi, download past papers and all exam materials!
          </p>
        </div>
      </div>

      {/* Actions and Payment opener */}
      <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0 relative z-10 justify-end">
        <button
          onClick={onUpgrade}
          className="flex-1 sm:flex-none px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-gray-950 font-black uppercase tracking-wider text-[10px] rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-center"
        >
          Unlock Unlimited PRO Access
        </button>
        <button
          onClick={onDismiss}
          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white/80 font-bold uppercase tracking-widest text-[9px] rounded-xl transition-all text-center"
        >
          Hide Offer
        </button>
      </div>
    </div>
  );
}

function EmiLoader({
  text = "Loading Emi AI...",
  theme = "dark",
}: {
  text?: string;
  theme?: "light" | "dark";
}) {
  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col ${theme === "dark" ? "bg-gray-950 text-white" : "bg-slate-50 text-slate-900"} overflow-hidden select-none`}
    >
      {/* Skeleton Header matching Home screen */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 ${theme === "dark" ? "bg-gray-950/90" : "bg-white/90"} backdrop-blur-2xl border-b ${theme === "dark" ? "border-white/5" : "border-slate-200"}`}
      >
        <div className="pt-3.5 pb-2 px-3 sm:px-5 max-w-7xl mx-auto">
          <div className="flex justify-between items-center w-full relative">
            <div className="flex items-center gap-2 sm:gap-3 opacity-50">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center ${theme === "dark" ? "bg-gray-900 border-gray-800 text-gray-400" : "bg-slate-50 border-slate-200 text-slate-500"} shadow-sm border`}
              >
                <Menu size={19} strokeWidth={2.5} />
              </div>

              <div className="flex items-center gap-2 sm:gap-2.5 logo-container select-none">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shadow-sm shadow-blue-600/20 border border-blue-500/30 bg-blue-600 p-0.5 flex items-center justify-center">
                  <img
                    src="/app-icon.jpg"
                    alt="Educate MW"
                    className="w-full h-full object-cover rounded-[9px]"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span
                  className={`font-black text-base sm:text-lg tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                >
                  Educate
                  <span className="text-blue-600 font-bold opacity-90 pl-0.5">
                    MW
                  </span>
                </span>
              </div>
            </div>
            {/* Right side skeleton dots (optional, keeping it simple) */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 opacity-50">
               <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl ${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-slate-100 border-slate-200"} border`}></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main loading area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center max-w-sm px-6 text-center z-10 relative">
          {/* Simple elegant, fast loading ring with logo */}
          <div className="relative w-14 h-14 mb-5 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-blue-600 animate-spin" />
            <div
              className={`w-9 h-9 rounded-xl p-0.5 bg-blue-600 shadow-md flex items-center justify-center z-10 overflow-hidden border border-blue-500/30`}
            >
              <img
                src="/app-icon.jpg"
                alt="Educate MW"
                className="w-full h-full object-cover rounded-[9px]"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Simple crisp lettering */}
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmiSpinner({
  size = "md",
  theme = "dark",
}: {
  size?: "sm" | "md" | "lg";
  theme?: "light" | "dark";
}) {
  const outerSize =
    size === "sm" ? "w-6 h-6" : size === "md" ? "w-10 h-10" : "w-14 h-14";
  const innerSize =
    size === "sm"
      ? "w-4 h-4 p-0.5"
      : size === "md"
        ? "w-7 h-7 p-1"
        : "w-10 h-10 p-1.5";

  return (
    <div
      className={`relative flex items-center justify-center select-none shrink-0 ${outerSize}`}
    >
      <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-blue-600 animate-spin" />
      <div
        className={`rounded-xl p-0.5 bg-blue-600 flex items-center justify-center shadow-md overflow-hidden border border-blue-500/30 ${innerSize}`}
      >
        <img
          src="/app-icon.jpg"
          alt="Educate MW"
          className="w-full h-full object-cover rounded-[7px]"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}
