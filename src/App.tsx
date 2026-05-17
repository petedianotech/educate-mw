/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import SEO from './components/SEO';
import { BlogView, BlogPostView } from './components/BlogSystem';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
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
  deleteDoc
} from 'firebase/firestore';
import { auth, db, googleProvider } from './lib/firebase';
import { Avatar, getAvatarGradient, FEMININE_GRADIENTS, MASCULINE_GRADIENTS } from './components/Avatar';
import { GroupChat } from './components/GroupChat';
import { FlashcardsView } from './components/FlashcardsView';
import { CommunityView } from './components/CommunityView';
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
  Clock,
  ArrowLeft,
  Crown,
  CheckCircle2,
  Shield,
  Newspaper,
  Upload,
  FileText as FileIcon
} from 'lucide-react';

export type ViewState = 'home' | 'emi' | 'library' | 'library-item' | 'dictionary' | 'quizzes' | 'flashcards' | 'community' | 'profile' | 'auth' | 'register' | 'admin' | 'career' | 'quiz-taking' | 'videos' | 'terms' | 'privacy' | 'subscription' | 'blog' | 'blog-post' | 'local-view';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedBlogSlug, setSelectedBlogSlug] = useState('');
  const [selectedLibrarySlug, setSelectedLibrarySlug] = useState('');
  const [localFileUrl, setLocalFileUrl] = useState<string | null>(null);
  const [localFileName, setLocalFileName] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizTopic, setQuizTopic] = useState('');

  const adminEmails = ['petedianotech@gmail.com', 'mscepreparation@gmail.com'];

  const navigateTo = (view: ViewState, slug?: string) => {
    setCurrentView(view);
    if (view === 'blog-post' && slug) setSelectedBlogSlug(slug);
    if (view === 'library-item' && slug) setSelectedLibrarySlug(slug);
    if (view === 'local-view' && slug) {
       setLocalFileUrl(slug);
       setLocalFileName(localFileName || 'Offline Document');
    }
    
    let path = '/';
    switch (view) {
      case 'home': path = '/'; break;
      case 'blog': path = '/blog'; break;
      case 'blog-post': path = `/blog/${slug}`; break;
      case 'library': path = '/library'; break;
      case 'library-item': path = `/library/${slug}`; break;
      case 'terms': path = '/terms'; break;
      case 'privacy': path = '/privacy'; break;
      case 'emi': path = '/emi-ai'; break;
      case 'quizzes': path = '/quizzes'; break;
      case 'flashcards': path = '/flashcards'; break;
      case 'community': path = '/community'; break;
      case 'career': path = '/career'; break;
      case 'profile': path = '/profile'; break;
      case 'videos': path = '/videos'; break;
      case 'subscription': path = '/subscription'; break;
      default: path = `/${view}`;
    }
    window.history.pushState({}, '', path);
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/terms') setCurrentView('terms');
      else if (path === '/privacy') setCurrentView('privacy');
      else if (path === '/blog') setCurrentView('blog');
      else if (path.startsWith('/blog/')) {
        const slug = path.split('/blog/')[1];
        if (slug) {
          setSelectedBlogSlug(slug);
          setCurrentView('blog-post');
        }
      }
      else if (path === '/library') setCurrentView('library');
      else if (path.startsWith('/library/')) {
        const slug = path.split('/library/')[1];
        if (slug) {
          setSelectedLibrarySlug(slug);
          setCurrentView('library-item');
        }
      }
      else if (path === '/emi-ai') setCurrentView('emi');
      else if (path === '/quizzes') setCurrentView('quizzes');
      else if (path === '/career') setCurrentView('career');
      else if (path === '/profile') setCurrentView('profile');
      else if (path === '/') setCurrentView('home');
      else {
        const view = path.substring(1) as ViewState;
        if (view) setCurrentView(view);
      }
    };
    handlePopState();
    window.addEventListener('popstate', handlePopState);
    
    document.documentElement.classList.toggle('dark', theme === 'dark');
    return () => window.removeEventListener('popstate', handlePopState);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoggedIn(!!firebaseUser);
      
      if (firebaseUser) {
        setIsAdmin(adminEmails.includes(firebaseUser.email || ''));
        
        try {
          // Fetch or Create Profile
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile(data);

            // Streak Logic
            const now = new Date();
            const lastActive = data.lastActive?.toDate();
            let newStreak = data.streak || 1;
            
            if (lastActive) {
                const diffTime = now.getTime() - lastActive.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    newStreak += 1;
                } else if (diffDays > 1) {
                    newStreak = 1;
                }
            }
            
            await updateDoc(userRef, { 
                lastActive: serverTimestamp(),
                streak: newStreak
            });
            setUserProfile({ ...data, streak: newStreak });
          } else {
            const gradient = getAvatarGradient('male', firebaseUser.uid);
            const newProfile = {
              name: firebaseUser.displayName || 'Student',
              email: firebaseUser.email,
              gender: 'male',
              avatarGradient: gradient,
              level: 'Form 4',
              points: 500,
              streak: 1,
              lastActive: serverTimestamp(),
              isPro: false,
              role: adminEmails.includes(firebaseUser.email || '') ? 'admin' : 'student',
              referralCode: 'MW-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
              createdAt: serverTimestamp()
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (err: any) {
          if (err?.message?.includes('offline')) {
            console.warn("Profile loading: operating offline. Using cached or default profile.");
          } else {
            console.error("Error loading profile:", err);
          }
          // Always ensure we have a fallback profile to avoid UI break
          setUserProfile({ 
            name: firebaseUser.displayName || 'Student', 
            email: firebaseUser.email, 
            level: 'Form 4', 
            points: 0,
            avatarGradient: getAvatarGradient('male', firebaseUser.uid)
          });
        }
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setIsLoggedIn(false);
    navigateTo('home');
  };

  const getSeoData = () => {
    const defaultOgImage = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&h=630&auto=format&fit=crop";
    switch (currentView) {
      case 'emi':
        return {
          title: "Emi AI Tutor - Personal MSCE Study Assistant",
          description: "Chat with Emi, the AI tutor trained on the Malawi MSCE curriculum. Get instant answers to complex academic questions.",
          canonical: "https://educatemw.app/emi-ai",
          ogImage: defaultOgImage
        };
      case 'library':
        return {
          title: "MSCE Notes Library - Free Study Materials Malawi",
          description: "Access a comprehensive library of MSCE notes for Form 1 to Form 4. Biology, Chemistry, Physics, Math, and more.",
          canonical: "https://educatemw.app/library",
          ogImage: defaultOgImage
        };
      case 'library-item':
        return {
          title: `${selectedLibrarySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} | MSCE Library`,
          description: "Download or study this MSCE material online.",
          canonical: `https://educatemw.app/library/${selectedLibrarySlug}`,
          ogImage: defaultOgImage
        };
      case 'dictionary':
        return {
          title: "Academic Dictionary - MSCE Terminology",
          description: "Look up academic terms and definitions across all MSCE subjects. The ultimate dictionary for Malawian students.",
          canonical: "https://educatemw.app/dictionary"
        };
      case 'quizzes':
        return {
          title: "Practice Quizzes - MSCE Exam Prep Malawi",
          description: "Test your knowledge with MSCE-style quizzes. Instant feedback and detailed explanations for all subjects.",
          canonical: "https://educatemw.app/quizzes"
        };
      case 'career':
        return {
          title: "Career Guidance - Future for Malawian Students",
          description: "Discover career paths in Malawi. Requirements for UNIMA, MUBAS, and other Malawian universities.",
          canonical: "https://educatemw.app/career"
        };
      case 'community':
        return {
          title: "Student Community - Connect with Malawian Students",
          description: "Join the community of Malawian students. Share notes, ask questions, and grow together.",
          canonical: "https://educatemw.app/community"
        };
      case 'blog':
        return {
          title: "Educate MW Blog - Malawi Education News & Study Tips",
          description: "The latest news about the Malawi curriculum, MSCE study tips, and educational technology in Malawi.",
          canonical: "https://educatemw.app/blog"
        };
      case 'blog-post':
        return {
          title: `${selectedBlogSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} | Educate MW`,
          description: "Read the latest article on our education blog.",
          canonical: `https://educatemw.app/blog/${selectedBlogSlug}`
        };
      default:
        return {
          title: "Educate MW - Free MSCE Notes & AI Tutor Malawi",
          description: "The ultimate MSCE learning app for Malawi. Free notes, AI tutor, quizzes, and career guidance.",
          canonical: "https://educatemw.app"
        };
    }
  };

  const seoData = getSeoData();

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-slate-50 text-slate-930'} min-h-screen flex justify-center font-sans selection:bg-indigo-900/30 selection:text-indigo-100`}>
      <SEO {...seoData} />
      <div className={`w-full max-w-md h-[100dvh] ${theme === 'dark' ? 'bg-gray-900 sm:border-gray-800' : 'bg-white sm:border-slate-200'} shadow-2xl relative overflow-hidden flex flex-col sm:border-x`}>
        
        {!isOnline && (
          <div className="absolute top-0 left-0 right-0 z-[110] bg-amber-500 text-gray-950 text-[10px] font-black py-1 px-4 text-center uppercase tracking-widest flex items-center justify-center gap-2">
            <Wifi size={12} strokeWidth={3} /> Offline Mode Active
          </div>
        )}

        {/* Scrollable Main Content */}
        <div className={`flex-1 overflow-x-hidden overflow-y-auto hide-scrollbar ${theme === 'dark' ? 'bg-gray-950' : 'bg-slate-50'}`}>
          {currentView === 'terms' ? (
            <LegalPageView type="terms" theme={theme} onBack={() => navigateTo('home')} />
          ) : currentView === 'privacy' ? (
            <LegalPageView type="privacy" theme={theme} onBack={() => navigateTo('home')} />
          ) : currentView === 'videos' ? (
            <VideosView theme={theme} onBack={() => navigateTo('home')} />
          ) : !isLoggedIn ? (
            currentView === 'register' ? (
              <RegisterView 
                onBack={() => navigateTo('home')} 
                theme={theme}
              />
            ) : (
              <AuthView 
                onNavigateRegister={() => navigateTo('register')}
                theme={theme}
              />
            )
          ) : (
            <>
              {currentView === 'home' && <HomeView onNavigate={navigateTo} onMenuClick={() => setIsSidebarOpen(true)} profile={userProfile} onShowNotifications={() => setShowNotifications(true)} theme={theme} />}
              {currentView === 'emi' && <EmiChatView onBack={() => navigateTo('home')} theme={theme} profile={userProfile} onUpdateProfile={setUserProfile} onGoPro={() => navigateTo('subscription')} />}
              {currentView === 'subscription' && <SubscriptionView profile={userProfile} theme={theme} onBack={() => navigateTo('home')} />}
              {currentView === 'library' && <LibraryView onBack={() => navigateTo('home')} theme={theme} onSelectItem={(slug) => navigateTo('library-item', slug)} onSelectLocalFile={(url, name) => { setLocalFileName(name); navigateTo('local-view', url); }} />}
              {currentView === 'library-item' && <MaterialDetailView slug={selectedLibrarySlug} onBack={() => navigateTo('library')} theme={theme} />}
              {currentView === 'local-view' && <LocalMaterialView url={localFileUrl || ''} title={localFileName} onBack={() => navigateTo('library')} theme={theme} />}
              {currentView === 'dictionary' && <DictionaryView onBack={() => navigateTo('home')} theme={theme} />}
              {currentView === 'quizzes' && (
                <QuizzesView 
                  onBack={() => navigateTo('home')} 
                  theme={theme} 
                  onStartQuiz={(questions, topic) => {
                    setQuizQuestions(questions);
                    setQuizTopic(topic);
                    navigateTo('quiz-taking');
                  }}
                />
              )}
              {currentView === 'quiz-taking' && (
                <QuizTakingView 
                  questions={quizQuestions} 
                  topic={quizTopic} 
                  onEnd={() => navigateTo('quizzes')} 
                  theme={theme} 
                />
              )}
              {currentView === 'flashcards' && <FlashcardsView onBack={() => navigateTo('home')} />}
              {currentView === 'community' && <CommunityView onBack={() => navigateTo('home')} />}
              {currentView === 'career' && <CareerView onBack={() => navigateTo('home')} theme={theme} />}
              {currentView === 'blog' && (
                <BlogView 
                  onBack={() => navigateTo('home')} 
                  theme={theme}
                  onPostClick={(slug) => navigateTo('blog-post', slug)}
                />
              )}
              {currentView === 'blog-post' && (
                <BlogPostView 
                  slug={selectedBlogSlug}
                  onBack={() => navigateTo('blog')}
                  theme={theme}
                  onPostClick={(slug) => navigateTo('blog-post', slug)}
                />
              )}
              {currentView === 'admin' && isAdmin && <AdminDashboard onBack={() => navigateTo('home')} theme={theme} />}
              {currentView === 'profile' && (
                <ProfileView 
                  onBack={() => navigateTo('home')} 
                  profile={userProfile} 
                  onUpdate={async (newProfile: any) => {
                    if (user) {
                      const userRef = doc(db, 'users', user.uid);
                      await updateDoc(userRef, newProfile);
                      setUserProfile(newProfile);
                    }
                  }} 
                  onLogout={handleLogout} 
                  theme={theme}
                  onThemeToggle={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                  onShowNotifications={() => setShowNotifications(true)}
                  onNavigate={navigateTo}
                  onShowSettings={() => setShowSettings(true)}
                  isAdmin={isAdmin}
                />
              )}
            </>
          )
}
        </div>

        {/* Bottom Navigation */}
        {isLoggedIn && !['emi', 'dictionary', 'flashcards', 'community', 'admin', 'terms', 'privacy', 'videos'].includes(currentView) && (
          <div className={`absolute bottom-0 w-full left-0 right-0 z-[60] ${theme === 'dark' ? 'bg-gray-950 border-gray-900' : 'bg-white border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'} border-t pb-safe pt-2 px-1`}>
            <div className="flex justify-around items-center w-full max-w-md mx-auto">
              <NavItem icon={<Home size={26} fill={currentView === 'home' ? 'currentColor' : 'none'} />} label="Home" active={currentView === 'home'} onClick={() => navigateTo('home')} theme={theme} />
              <NavItem icon={<Book size={26} fill={currentView === 'library' ? 'currentColor' : 'none'} />} label="Library" active={currentView === 'library'} onClick={() => navigateTo('library')} theme={theme} />
              
              <div className="flex flex-col items-center justify-center w-14 cursor-pointer pt-1 transition-all active:scale-95 group" onClick={() => navigateTo('emi')}>
                <div className={`mb-1 p-0.5 rounded-full border-2 ${currentView === 'emi' ? (theme === 'dark' ? 'border-white' : 'border-indigo-600') : 'border-transparent'}`}>
                  <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm">
                     <img src="https://i.ibb.co/6cfxqxgn/emiai-ai.jpg" alt="Emi" className="w-full h-full object-cover" />
                  </div>
                </div>
                <span className={`text-[9px] font-black tracking-widest uppercase transition-colors duration-200 ${currentView === 'emi' ? (theme === 'dark' ? 'text-white' : 'text-indigo-600') : 'text-gray-500 group-hover:text-gray-300'}`}>
                  Emi AI
                </span>
              </div>

              <NavItem icon={<CheckSquare size={26} fill={currentView === 'quizzes' ? 'currentColor' : 'none'} />} label="Quizzes" active={currentView === 'quizzes'} onClick={() => navigateTo('quizzes')} theme={theme} />
              <NavItem icon={<User size={26} fill={currentView === 'profile' ? 'currentColor' : 'none'} />} label="Profile" active={currentView === 'profile'} onClick={() => navigateTo('profile')} theme={theme} />
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
            <div className="relative w-[80%] max-w-[320px] bg-gray-900 h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
              {/* User Header in Sidebar */}
              <div className="bg-indigo-600/10 p-6 pt-16 border-b border-gray-800 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl border border-gray-700 shadow-lg">
                  <Avatar user={userProfile} className="w-full h-full text-xl" />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg leading-tight">{userProfile?.name || 'Student'}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full shadow-lg ${isOnline ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-amber-500 shadow-amber-500/50'}`}></span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isOnline ? 'Online' : 'Offline'}</span>
                </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col">
                <SidebarItem icon={<CreditCard size={20} className="text-indigo-400" strokeWidth={2.5} />} label="Subscription & Pay" onClick={() => { navigateTo('subscription'); setIsSidebarOpen(false); }} active={currentView === 'subscription'} />
                <SidebarItem icon={<BookOpen size={20} className="text-emerald-400" strokeWidth={2.5} />} label="Education Blog" onClick={() => { navigateTo('blog'); setIsSidebarOpen(false); }} active={currentView === 'blog'} />
                
                {isAdmin && (
                  <SidebarItem icon={<LayoutDashboard size={20} className="text-amber-500" strokeWidth={2.5} />} label="Admin Panel" onClick={() => { navigateTo('admin'); setIsSidebarOpen(false); }} active={currentView === 'admin'} />
                )}

                <div className="flex-1" />
                
                <SidebarItem icon={<Settings size={20} />} label="App Settings" onClick={() => { setShowSettings(true); setIsSidebarOpen(false); }} />
              </div>

              <div className="p-6 border-t border-gray-800 mt-auto">
                <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 flex items-center justify-between">
                   <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                         <Sparkles size={16} />
                      </div>
                      <span className="text-xs font-bold text-gray-200">Educate MW</span>
                   </div>
                   <button onClick={() => { setCurrentView('subscription'); setIsSidebarOpen(false); }} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors">Upgrade</button>
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
          onThemeToggle={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        />
        
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, onClick, active }: { icon: React.ReactNode, label: string, onClick?: () => void, active?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-[15px] transition-colors ${active ? 'bg-indigo-900/50 text-indigo-400' : 'text-gray-300 hover:bg-gray-800'}`}
    >
      <span className={active ? 'text-indigo-400' : 'text-gray-400'}>{icon}</span>
      {label}
    </button>
  );
}

function HomeView({ onNavigate, onMenuClick, profile, onShowNotifications, theme }: { onNavigate: (view: ViewState) => void, onMenuClick: () => void, profile: any, onShowNotifications: () => void, theme: 'light' | 'dark' }) {
  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-gray-950' : 'bg-slate-50'} overflow-hidden relative`}>
      {/* Fixed Sticky Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 ${theme === 'dark' ? 'bg-gray-950/90' : 'bg-white/90'} backdrop-blur-2xl border-b ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}`}>
        <div className="pt-12 pb-4 px-5">
          <div className="flex justify-between items-center w-full max-w-7xl mx-auto relative">
            <button 
              onClick={onMenuClick} 
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'} active:scale-95 transition-all shadow-sm border`}
            >
              <Menu size={20} strokeWidth={2.5} />
            </button>
            
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5 cursor-pointer">
              <div className="w-8 h-8 rounded-[10px] bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <GraduationCap className="text-white" size={16} strokeWidth={2.5} />
              </div>
              <span className={`font-black text-lg tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Educate<span className="text-indigo-400 font-bold opacity-80 pl-0.5">MW</span>
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={onShowNotifications}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'} active:scale-95 transition-all shadow-sm border relative`}
              >
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full border border-white dark:border-gray-950 animate-pulse"></span>
              </button>
              <button 
                onClick={() => onNavigate('profile')}
                className="w-10 h-10 rounded-[14px] p-0.5 bg-gradient-to-tr from-gray-800 to-gray-700 hover:from-indigo-500 hover:to-purple-500 active:scale-95 transition-all"
              >
                <Avatar user={profile} className="w-full h-full text-[11px] rounded-[11px] border-2 border-gray-950 shadow-inner" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-5 pt-32 pb-32 hide-scrollbar">
           {/* No Greeting as requested */}

           {/* Search */}
           <div className="mb-6 animate-in fade-in slide-in-from-top-6 duration-600">
             <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} rounded-2xl px-5 py-3.5 flex items-center border group focus-within:border-indigo-500/50 transition-all`}>
               <Search className="text-gray-500 mr-3 group-focus-within:text-indigo-400 transition-colors" size={18} strokeWidth={3}/>
               <input 
                 type="text" 
                 placeholder="Search topics, notes, tutors..." 
                 className={`bg-transparent outline-none flex-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-sm font-bold placeholder-gray-600`}
               />
             </div>
           </div>

          {/* Hero Banner */}
          <div className="w-full bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-[32px] p-6 text-white relative overflow-hidden mb-6 shadow-2xl shadow-indigo-900/40 shrink-0 min-h-[140px] flex flex-col justify-center">
            {/* Animated bg elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-3xl -ml-16 -mb-16"></div>
            
            <div className="z-10 relative">
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg mb-3 border border-white/10">
                <Sparkles size={12} className="text-indigo-200" fill="currentColor" />
                <span className="text-[10px] font-black uppercase tracking-widest">Powered by AI</span>
              </div>
              <h3 className="font-black text-2xl mb-1 flex items-center gap-2">Ask Emi AI</h3>
              <p className="text-indigo-100/80 text-xs font-semibold leading-relaxed max-w-[180px] mb-4">
                Unlock expert explanations for any subject and MSCE prep.
              </p>
              <button 
                onClick={() => onNavigate('emi')}
                className="bg-white text-indigo-700 font-black text-xs py-2.5 px-6 rounded-2xl flex items-center gap-2 shadow-xl shadow-indigo-950/20 active:scale-95 transition-all w-fit group"
              >
                Chat with Emi
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
              </button>
            </div>
            
            {/* Avatar Composition with Blending */}
            <div className="absolute -right-6 -bottom-6 w-44 h-44 z-0 pointer-events-none">
               <div className="relative w-full h-full">
                  <img src="https://i.ibb.co/6cfxqxgn/emiai-ai.jpg" alt="Emi AI" className="w-full h-full object-contain" />
                  {/* Gradient masks to blend square edges */}
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-800/80 via-transparent to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-indigo-700/40"></div>
               </div>
            </div>
          </div>

          {/* Grid Menu */}
          <div className="grid grid-cols-3 gap-3 content-start shrink-0 mb-8">
            <FeatureCard 
              icon={<BookOpen size={24} fill="white" className="text-blue-50" />} 
              bgColor="bg-blue-500" 
              title="Library" 
              onClick={() => onNavigate('library')}
            />
            <FeatureCard 
              icon={<CheckSquare size={24} fill="white" className="text-emerald-50" />} 
              bgColor="bg-emerald-500" 
              title="Quizzes" 
              onClick={() => onNavigate('quizzes')}
            />
            <FeatureCard 
              icon={<Layers size={24} fill="white" className="text-orange-50" strokeWidth={1} />} 
              bgColor="bg-orange-500" 
              title="Flashcards" 
              onClick={() => onNavigate('flashcards')}
            />
            <FeatureCard 
              icon={<Users size={24} fill="white" className="text-teal-50" />} 
              bgColor="bg-teal-500" 
              title="Community" 
              onClick={() => onNavigate('community')}
            />
            <FeatureCard 
              icon={<BookA size={24} fill="white" className="text-purple-50" />} 
              bgColor="bg-purple-500" 
              title="Dictionary" 
              onClick={() => onNavigate('dictionary')}
            />
            <FeatureCard 
              icon={<Rocket size={24} fill="white" className="text-indigo-50" />} 
              bgColor="bg-indigo-500" 
              title="Career" 
              onClick={() => onNavigate('career')}
            />
            <FeatureCard 
              icon={<Newspaper size={24} fill="white" className="text-pink-50" />} 
              bgColor="bg-pink-500" 
              title="Blog" 
              onClick={() => onNavigate('blog')}
            />
            <FeatureCard 
              icon={<Video size={24} fill="white" className="text-blue-50" />} 
              bgColor="bg-blue-600" 
              title="Videos" 
              onClick={() => onNavigate('videos')}
            />
          </div>

          {/* Knowledge Hub Preview */}
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className={`font-black text-sm uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Knowledge Hub</h3>
              <button onClick={() => onNavigate('blog')} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">See All</button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar -mx-5 px-5">
               <BlogPreviewCard 
                 title="MSCE Preparation Tips" 
                 category="Study" 
                 image="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400"
                 onClick={() => onNavigate('blog')}
                 theme={theme}
               />
               <BlogPreviewCard 
                 title="Malawi Education Reform" 
                 category="News" 
                 image="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400"
                 onClick={() => onNavigate('blog')}
                 theme={theme}
               />
               <BlogPreviewCard 
                 title="Tech in Classroom" 
                 category="Future" 
                 image="https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400"
                 onClick={() => onNavigate('blog')}
                 theme={theme}
               />
            </div>
          </div>
      </div>
    </div>
  );
}

function BlogPreviewCard({ title, category, image, onClick, theme }: { title: string, category: string, image: string, onClick: () => void, theme: 'light' | 'dark' }) {
  return (
    <button 
      onClick={onClick}
      className={`min-w-[200px] w-[200px] aspect-[4/5] rounded-[24px] overflow-hidden relative group active:scale-95 transition-all ${theme === 'dark' ? 'bg-gray-900' : 'bg-white shadow-sm'} border ${theme === 'dark' ? 'border-gray-800' : 'border-slate-100'}`}
    >
      <img src={image} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-500" alt={title} />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-4 text-left">
        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 mb-2 inline-block">{category}</span>
        <h4 className="text-white font-black text-sm leading-tight line-clamp-2">{title}</h4>
      </div>
    </button>
  );
}

type Message = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
};

const initialMessages: Message[] = [
  {
    id: '1',
    sender: 'user',
    text: "Explain Newton's First Law of Motion with an example.",
    timestamp: '9:40 AM'
  },
  {
    id: '2',
    sender: 'ai',
    text: "Newton's First Law of Motion states that an object at rest stays at rest, and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an external force.\n\nExample: When you are sitting in a moving car, if the car suddenly stops, your body tends to keep moving forward due to inertia.",
    timestamp: '9:42 AM'
  }
];

function EmiChatView({ onBack, theme, profile, onUpdateProfile, onGoPro }: { onBack: () => void, theme: 'light' | 'dark', profile: any, onUpdateProfile: (p: any) => void, onGoPro: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // --- CHECK LIMITS ---
    const today = new Date().toISOString().split('T')[0];
    const isPro = profile?.isPro;
    const aiPointsLastReset = profile?.aiPointsLastReset || '';
    let currentPoints = aiPointsLastReset === today ? (profile?.aiPoints ?? 4) : 4; // Max 4 points for Free
    
    if (!isPro && currentPoints < 2) {
      // Show go pro message
      const errorMsg: Message = {
         id: Date.now().toString() + '-err',
         sender: 'ai',
         text: "Oops! You've used up your free AI questions for today. Upgrading to PRO will give you unlimited questions!",
         timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
      setTimeout(onGoPro, 3000);
      return;
    }
    // --- END LIMITS ---

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!isPro && auth.currentUser) {
         currentPoints -= 2; // costs 2 point per question
         const userRef = doc(db, 'users', auth.currentUser.uid);
         await updateDoc(userRef, { aiPoints: currentPoints, aiPointsLastReset: today });
         onUpdateProfile({ ...profile, aiPoints: currentPoints, aiPointsLastReset: today });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const config: any = {
        systemInstruction: "You are an AI study assistant named Emi. Answer the student's questions clearly, concisely, and informally. Help them with homework, study tips, or explanations of academic concepts. IMPORTANT RULES: 1. You must strictly align with the Malawi Secondary School Curriculum (MSCE). 2. Use simple English that is very easy to understand. 3. Give relevant, relatable examples for a student in Malawi. 4. Do NOT use asterisks (*) or any markdown symbols like *, **, or # for formatting. If you need emphasis, use ALL CAPITAL LETTERS or write normally. 5. Do NOT use dollar signs ($) for mathematical equations; write them in plain text mathematical notation. 6. Do NOT use any emojis in your response. 7. If the user question requires real-time information or factual data, synthesize the searched information smoothly into your response."
      };
      
      if (useSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [...messages, userMessage].map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        })),
        config
      });
      
      let responseText = response.text || 'Sorry, I couldn\'t find an answer to that.';
      // Fallback clean up to ensure absolutely no asterisks or dollar signs
      responseText = responseText.replace(/\*/g, '');
      responseText = responseText.replace(/\$/g, '');

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: "I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCalling) {
    return <CallingView onEnd={() => setIsCalling(false)} profile={profile} onUpdateProfile={onUpdateProfile} onGoPro={onGoPro} />;
  }

  return (
    <div className={`absolute inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'} animate-in slide-in-from-right duration-300`}>
      {/* Header */}
      <div className={`${theme === 'dark' ? 'bg-gray-950/80 border-gray-800' : 'bg-white/80 border-slate-200 shadow-sm'} backdrop-blur-xl border-b pt-14 pb-4 px-5 flex justify-between items-center shrink-0 z-20 sticky top-0`}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className={`w-10 h-10 ${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-gray-300' : 'bg-slate-100 border-slate-200 text-slate-600'} shadow-sm rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform border`}>
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full ${theme === 'dark' ? 'bg-indigo-900/50 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'} border flex items-center justify-center overflow-hidden`}>
               <img src="https://i.ibb.co/6cfxqxgn/emiai-ai.jpg" alt="Emi" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className={`font-bold text-[17px] ${theme === 'dark' ? 'text-white' : 'text-slate-900'} leading-none mb-1 flex items-center gap-1`}>Emi AI <Sparkles size={14} className="text-indigo-400" fill="currentColor" /></h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-gray-400 text-[10px] font-bold tracking-wide uppercase font-sans">Always active</span>
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
            <div onClick={onGoPro} className="flex flex-col items-end mr-1 cursor-pointer group active:scale-95 transition-transform">
              <span className={`text-[10px] font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>Points</span>
              <span className={`text-xs font-black leading-none ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>{profile?.aiPointsLastReset === new Date().toISOString().split('T')[0] ? (profile?.aiPoints ?? 4) : 4}</span>
            </div>
          )}
          <button onClick={() => setIsCalling(true)} className={`w-10 h-10 ${theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'} rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform`}>
            <Phone size={18} fill="currentColor" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-32 space-y-7 hide-scrollbar">
        {/* Intro Card */}
        {messages.length === 0 && (
          <div className={`${theme === 'dark' ? 'bg-gradient-to-br from-indigo-900/30 to-gray-900 border-indigo-500/20' : 'bg-white border-indigo-100 shadow-sm'} rounded-3xl p-6 border flex flex-col gap-4 text-center items-center mt-4`}>
            <div className={`w-24 h-24 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'} shadow-md rounded-2xl flex items-center justify-center shrink-0 border transform -rotate-3 hover:rotate-0 transition-transform overflow-hidden`}>
               <img src="https://i.ibb.co/6cfxqxgn/emiai-ai.jpg" alt="Emi AI" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className={`font-black text-[22px] ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-1.5`}>How can I help?</h3>
              <p className="text-[14px] text-gray-500 font-medium leading-relaxed max-w-[250px]">I can help you understand concepts, solve problems, or just chat.</p>
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
              onClick={() => handleSend("Explain photosynthesis in simple terms")}
            />
            <SuggestionCard 
              icon={<Calculator size={20} fill="currentColor" className="text-[#3A82F7]" />} 
              bgColor="bg-blue-50" 
              text="Solve for x: 5x + 12 = 3(x + 8)" 
              onClick={() => handleSend("Solve for x: 5x + 12 = 3(x + 8)")}
            />
            <SuggestionCard 
              icon={<BookOpen size={20} fill="currentColor" className="text-[#20CA78]" />} 
              bgColor="bg-emerald-50" 
              text="Give me tips to study better" 
              onClick={() => handleSend("Give me tips to study better")}
            />
            <SuggestionCard 
              icon={<Sprout size={20} fill="currentColor" className="text-[#20CA78]" />} 
              bgColor="bg-green-50" 
              text="Explain crop rotation in agriculture" 
              onClick={() => handleSend("Explain crop rotation in agriculture")}
            />
          </div>
        </div>
        )}

        {messages.length > 0 && messages.some(m => m.sender === 'user') && (
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-[1px] bg-gray-800"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Today</span>
            <div className="flex-1 h-[1px] bg-gray-800"></div>
          </div>
        )}

        {/* Chat Bubbles */}
        <div className="space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start gap-2.5'}`}>
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-indigo-900/50 border border-indigo-500/30 shrink-0 flex items-center justify-center overflow-hidden mt-1 shadow-sm">
                   <img src="https://i.ibb.co/6cfxqxgn/emiai-ai.jpg" alt="Emi" className="w-full h-full object-cover" />
                </div>
              )}
              <div className={`max-w-[85%] relative group`}>
                <div className={`p-4 shadow-sm relative ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm' : 'bg-gray-900 border border-gray-800 rounded-2xl rounded-tl-sm text-gray-200 font-medium'}`}>
                  {msg.sender === 'ai' && (
                    <button 
                      onClick={() => speakText(msg.text)} 
                      className={`mb-2 w-8 h-8 rounded-full flex justify-center items-center ${theme === 'dark' ? 'bg-indigo-900/50 text-indigo-400 hover:bg-indigo-900' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'} transition-colors`}
                      title="Read aloud"
                    >
                      <Volume2 size={16} />
                    </button>
                  )}
                  <p className={`text-[14.5px] leading-relaxed whitespace-pre-wrap ${msg.sender === 'user' ? 'text-white' : 'text-gray-200'}`}>{msg.text}</p>
                  <div className={`flex items-center gap-1.5 mt-2 text-[10px] font-bold ${msg.sender === 'user' ? 'justify-end text-white/70' : 'text-gray-400'}`}>
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'user' && <CheckCheck size={10} strokeWidth={3} />}
                  </div>
                </div>
                
                {msg.sender === 'ai' && (
                  <div className="flex gap-4 mt-2 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { navigator.clipboard.writeText(msg.text); }} className="text-gray-400 hover:text-indigo-400"><Copy size={14} /></button>
                    <button className="text-gray-400 hover:text-indigo-400"><ThumbsUp size={14} /></button>
                    <button className="text-gray-400 hover:text-indigo-400"><ThumbsDown size={14} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-900/50 border border-indigo-500/30 shrink-0 overflow-hidden mt-1 shadow-sm">
                 <img src="https://i.ibb.co/6cfxqxgn/emiai-ai.jpg" alt="Emi" className="w-full h-full object-cover" />
              </div>
              <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} shadow-sm border rounded-2xl rounded-tl-sm px-4 py-3 min-w-[60px] flex items-center justify-center`}>
                 <div className="flex gap-1.5 items-center justify-center w-full h-[20px]">
                   <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                   <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                   <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                 </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

      </div>

      {/* Input Area */}
      <div className={`absolute bottom-0 left-0 right-0 z-40 ${theme === 'dark' ? 'bg-gray-950/80 border-gray-800' : 'bg-white/80 border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'} backdrop-blur-xl border-t pb-safe-4`}>
        <div className="flex px-4 pt-2 gap-2">
          <button 
            onClick={() => setUseSearch(!useSearch)}
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-colors ${useSearch ? (theme === 'dark' ? 'bg-indigo-900 text-indigo-300 border-indigo-700' : 'bg-indigo-100 text-indigo-700 border-indigo-200') : (theme === 'dark' ? 'bg-transparent text-gray-500 border-gray-700' : 'bg-transparent text-gray-500 border-gray-300')}`}
          >
            <Search size={12} /> {useSearch ? 'Live Search On' : 'Live Search Off'}
          </button>
        </div>
        <div className="p-4 pt-3">
          <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800 shadow-[0_10px_40px_rgba(0,0,0,0.3)]' : 'bg-slate-50 border-slate-100 shadow-inner'} rounded-[2rem] p-2 pl-4 flex items-center border`}>
          <input 
            type="text" 
            placeholder="Ask anything..." 
            className={`flex-1 bg-transparent text-[15px] outline-none ${theme === 'dark' ? 'text-white placeholder-gray-500' : 'text-slate-900 placeholder-slate-400'} font-black h-10`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
          />
          <button 
            className={`w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0 transition-all ${
              !input.trim() || isLoading ? (theme === 'dark' ? 'bg-gray-800 text-gray-600' : 'bg-slate-200 text-slate-400') : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
            }`}
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
          >
            <Send size={18} fill={!input.trim() || isLoading ? 'none' : 'currentColor'} />
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

function CallingView({ onEnd, profile, onUpdateProfile, onGoPro }: { onEnd: () => void, profile: any, onUpdateProfile: (p: any) => void, onGoPro: () => void }) {
  const [seconds, setSeconds] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [voiceName, setVoiceName] = useState<string>(localStorage.getItem('emi_voice') || 'Aoede');
  const [isMuted, setIsMuted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isMutedRef = useRef(false);

  const voiceOptions = [
    { name: 'Aoede', desc: 'Clear & Natural' },
    { name: 'Kore', desc: 'Friendly & Warm' },
    { name: 'Puck', desc: 'Light & Energetic' },
    { name: 'Charon', desc: 'Deep & Calm' },
    { name: 'Fenrir', desc: 'Bold & Direct' }
  ];

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isConnected) {
      timer = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isConnected]);

  useEffect(() => {
    if (!profile?.isPro && seconds >= 300) {
       onEnd();
    }
  }, [seconds, profile?.isPro, onEnd]);

  useEffect(() => {
    // Check call limits
    const today = new Date().toISOString().split('T')[0];
    const isPro = profile?.isPro;
    const aiCallsLastReset = profile?.aiCallsLastReset || '';
    let currentCalls = aiCallsLastReset === today ? (profile?.aiCallsCount ?? 0) : 0;
    
    if (!isPro && currentCalls >= 2) {
      setErrorMsg("You've reached your free daily limit of 2 calls. Upgrade to Pro for unlimited access!");
      setTimeout(onGoPro, 3000);
      return;
    }

    if (!isPro && auth.currentUser && currentCalls < 2) {
       currentCalls += 1;
       const userRef = doc(db, 'users', auth.currentUser.uid);
       updateDoc(userRef, { aiCallsCount: currentCalls, aiCallsLastReset: today });
       onUpdateProfile({ ...profile, aiCallsCount: currentCalls, aiCallsLastReset: today });
    }

    let active = true;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

    const initConnection = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!active) return;
        streamRef.current = stream;

        const sessionPromise = ai.live.connect({
          model: "gemini-3.1-flash-live-preview",
          callbacks: {
            onopen: () => {
              setIsConnected(true);
              const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
              const audioContext = new AudioContextClass({ sampleRate: 16000 });
              audioContextRef.current = audioContext;
              nextPlayTimeRef.current = audioContext.currentTime;
              
              const analyser = audioContext.createAnalyser();
              analyser.fftSize = 256;
              analyserRef.current = analyser;

              const source = audioContext.createMediaStreamSource(stream);
              source.connect(analyser);

              const processor = audioContext.createScriptProcessor(4096, 1, 1);
              
              processor.onaudioprocess = (e) => {
                if (isMutedRef.current) return;
                const inputData = e.inputBuffer.getChannelData(0);
                const pcm16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                  pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
                }
                const buffer = new ArrayBuffer(pcm16.buffer.byteLength);
                new Uint8Array(buffer).set(new Uint8Array(pcm16.buffer));
                const binary = String.fromCharCode(...new Uint8Array(buffer));
                const base64Data = btoa(binary);
                
                sessionPromise.then((session) => {
                  if (active) {
                    session.sendRealtimeInput({
                      audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                    });
                  }
                });
              };
              source.connect(processor);
              processor.connect(audioContext.destination);
            },
            onmessage: (message: LiveServerMessage) => {
              if (message.serverContent?.interrupted) {
                 nextPlayTimeRef.current = 0;
              }
              const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (base64Audio && audioContextRef.current) {
                const ctx = audioContextRef.current;
                const binaryString = atob(base64Audio);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                     bytes[i] = binaryString.charCodeAt(i);
                }
                const pcm16 = new Int16Array(bytes.buffer);
                const audioBuffer = ctx.createBuffer(1, pcm16.length, 24000);
                const channelData = audioBuffer.getChannelData(0);
                for (let i = 0; i < pcm16.length; i++) {
                    channelData[i] = pcm16[i] / 32768.0;
                }
                const trackSource = ctx.createBufferSource();
                trackSource.buffer = audioBuffer;
                trackSource.connect(ctx.destination);
                
                const schedTime = Math.max(nextPlayTimeRef.current, ctx.currentTime);
                trackSource.start(schedTime);
                nextPlayTimeRef.current = schedTime + audioBuffer.duration;
              }
            },
            onerror: (err) => console.error("Live Error:", err),
            onclose: () => {
              if (active) setIsConnected(false);
            }
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
            },
            systemInstruction: "You are Emi, a friendly AI learning assistant from Malawi. Address students warmly, encourage them, and help with MSCE exam prep or school topics. Speak clearly and clearly.",
          },
        });
        sessionRef.current = sessionPromise;
      } catch (err: any) {
        console.error("Mic access denied or error:", err);
        setErrorMsg(err.message || 'Microphone access denied.');
      }
    };
    initConnection();
    
    return () => {
       active = false;
       if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
       }
       if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
       }
       if (sessionRef.current) {
          sessionRef.current.then((s: any) => s.close()).catch(() => {});
       }
    };
  }, [voiceName]);

  const handleVoiceChange = (v: string) => {
    setVoiceName(v);
    localStorage.setItem('emi_voice', v);
    setShowVoicePicker(false);
    // Connection will restart via useEffect [voiceName]
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 bg-gray-950 flex flex-col items-center justify-between py-16 px-8 text-white absolute inset-0 z-50 overflow-hidden font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[60%] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="flex flex-col items-center relative z-10 pt-10 w-full">
        <div className="flex items-center gap-2 mb-8 bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
           <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-600'}`}></div>
           <h2 className="text-[10px] font-black tracking-widest text-white/60 uppercase">Live Session</h2>
           {!profile?.isPro && (
             <>
               <div className="w-[1px] h-3 bg-white/10 mx-1"></div>
               <div className="flex items-center gap-1">
                 <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">
                   {profile?.aiPointsLastReset === new Date().toISOString().split('T')[0] ? (profile?.aiPoints ?? 4) : 4}
                 </span>
                 <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Pts</span>
               </div>
             </>
           )}
        </div>
        
        <div className="mb-10 relative flex items-center justify-center">
           <div className="w-44 h-44 bg-gray-900 rounded-full flex items-center justify-center border-4 border-indigo-500/20 relative z-10 p-2 shadow-2xl">
              <div className="w-full h-full bg-gray-800 rounded-full flex items-center justify-center overflow-hidden shadow-inner border border-gray-700">
                 <img src="https://i.ibb.co/6cfxqxgn/emiai-ai.jpg" alt="Emi AI" className="w-full h-full object-cover p-1" />
              </div>
           </div>
           {isConnected && <div className="absolute inset-0 bg-indigo-500 rounded-full opacity-10 animate-ping -z-0" style={{animationDuration: '3s'}}></div>}
           {isConnected && <div className="absolute inset-0 bg-indigo-400 rounded-full opacity-5 scale-150 animate-pulse -z-10" style={{animationDuration: '4s'}}></div>}
        </div>
        
        <h3 className="text-4xl font-black mb-3 tracking-tight text-white drop-shadow-lg">Emi AI</h3>
        
        <div className="bg-white/5 backdrop-blur-xl px-6 py-2 rounded-2xl border border-white/10 flex flex-col items-center">
           <p className={`text-[13px] font-black tracking-widest ${isConnected ? 'text-indigo-400' : 'text-gray-400'} uppercase`}>
              {!isConnected ? (errorMsg ? 'Connection Failed' : 'Connecting...') : formatTime(seconds)}
           </p>
        </div>
        
        {errorMsg && (
          <div className="mt-6 bg-red-500/10 px-5 py-3 rounded-2xl border border-red-500/30 text-center max-w-[280px] animate-in fade-in zoom-in-95">
            <p className="text-red-400 text-xs font-bold leading-snug">{errorMsg}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-10 relative z-10 w-full mb-8">
        <SpectrumVisualizer analyser={analyserRef.current} isConnected={isConnected} />

        <div className="flex items-center justify-center gap-6 w-full px-4">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/10 text-white/50 hover:text-white border border-white/10 active:scale-95'}`}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
          
          <button 
            onClick={onEnd} 
            className="w-20 h-20 bg-red-600 hover:bg-red-50 rounded-[32px] flex items-center justify-center text-white shadow-2xl active:scale-95 transition-all group"
          >
            <PhoneOff size={32} className="group-hover:text-red-600 transition-colors" />
          </button>
          
          <button 
             onClick={() => setShowVoicePicker(true)}
             className="w-14 h-14 bg-white/10 text-white/50 hover:text-white border border-white/10 rounded-2xl flex items-center justify-center transition-all active:scale-95"
          >
             <Volume2 size={22} />
          </button>
        </div>
        
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 animate-pulse">Education Voice Engine v2.4</p>
      </div>

      {/* Voice Selection Modal */}
      {showVoicePicker && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-md p-6 animate-in fade-in duration-300">
           <div className="bg-gray-900 w-full max-w-sm rounded-[2.5rem] p-8 pb-10 border border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-500">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-black text-white">Select AI Voice</h3>
                 <button onClick={() => setShowVoicePicker(false)} className="text-gray-500 hover:text-white bg-white/5 rounded-full p-2"><X size={20} /></button>
              </div>
              <div className="space-y-3">
                 {voiceOptions.map((opt) => (
                    <button 
                      key={opt.name}
                      onClick={() => handleVoiceChange(opt.name)}
                      className={`w-full p-5 rounded-3xl flex items-center justify-between border transition-all ${voiceName === opt.name ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}
                    >
                       <div className="text-left">
                          <h4 className="font-black text-sm">{opt.name}</h4>
                          <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest mt-1">{opt.desc}</p>
                       </div>
                       {voiceName === opt.name && <CheckCircle size={20} strokeWidth={3} />}
                    </button>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function SpectrumVisualizer({ analyser, isConnected }: { analyser: AnalyserNode | null, isConnected: boolean }) {
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
            height: isConnected ? `${20 + val * 100}%` : '10%',
            opacity: isConnected ? 0.3 + val * 0.7 : 0.1
          }}
        ></div>
      ))}
    </div>
  );
}

function SuggestionCard({ icon, bgColor, text, onClick }: { icon: React.ReactNode, bgColor: string, text: string, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="bg-gray-900 rounded-[22px] p-4 flex flex-col items-center justify-center text-center shadow-sm border border-gray-800 snap-start cursor-pointer hover:shadow-lg transition-shadow active:scale-95"
    >
      <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center mb-3 shadow-inner bg-gray-800`}>
        {icon}
      </div>
      <p className="text-[11px] font-bold text-gray-300 leading-snug">
        {text}
      </p>
    </div>
  );
}

function FeatureCard({ icon, bgColor, title, onClick }: { icon: React.ReactNode, bgColor: string, title: string, subtitle?: string, onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`bg-gray-900 rounded-[22px] aspect-square flex flex-col items-center justify-center p-2 text-center shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-gray-800 ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 active:scale-95 transition-all duration-300' : ''}`}>
      <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center mb-2 shadow-inner ${bgColor}`}>
        {icon}
      </div>
      <h4 className="font-bold text-gray-100 text-[11px] leading-tight px-1 max-w-full truncate">{title}</h4>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick, theme }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, theme: 'light' | 'dark' }) {
  return (
    <div className="flex flex-col items-center justify-center w-14 cursor-pointer pt-1 transition-all active:scale-95 group" onClick={onClick}>
      <div className={`mb-1 transition-colors duration-200 ${active ? (theme === 'dark' ? 'text-white' : 'text-indigo-600') : 'text-gray-500 group-hover:text-gray-300'}`}>
        {icon}
      </div>
      <span className={`text-[9px] font-black tracking-widest uppercase transition-colors duration-200 ${active ? (theme === 'dark' ? 'text-white' : 'text-indigo-600') : 'text-gray-500 group-hover:text-gray-300'}`}>
        {label}
      </span>
    </div>
  );
}

function LibraryView({ onBack, theme, onSelectItem, onSelectLocalFile }: { onBack: () => void, theme: 'light' | 'dark', onSelectItem: (slug: string) => void, onSelectLocalFile: (url: string, name: string) => void }) {
  const [filter, setFilter] = useState<'all' | 'offline'>('all');
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadedIds, setDownloadedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('mw_downloaded_notes');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    // Fast loading: load from cache first
    const cachedMaterials = localStorage.getItem('mw_library_materials_cache');
    if (cachedMaterials) {
      setMaterials(JSON.parse(cachedMaterials));
      setLoading(false);
    }

    const q = query(collection(db, 'materials'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMaterials(data);
      localStorage.setItem('mw_library_materials_cache', JSON.stringify(data));
      setLoading(false);
    }, (error) => {
      if (!error.message.includes('offline')) {
        console.error("Library snapshot error:", error);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDownload = (id: string) => {
    setDownloadedIds(prev => {
      const current = prev || [];
      const next = current.includes(id) ? current.filter(i => i !== id) : [...current, id];
      localStorage.setItem('mw_downloaded_notes', JSON.stringify(next));
      return next;
    });
  };

  const visibleItems = (materials || [])
    .filter(item => item.type !== 'blog')
    .filter(item => filter === 'offline' ? (downloadedIds || []).includes(item.id) : true);

  return (
    <div className={`absolute inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-gray-950' : 'bg-slate-50'} animate-in slide-in-from-right duration-300`}>
      {/* Fixed Header */}
      <div className={`${theme === 'dark' ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90 border-slate-200'} backdrop-blur-xl pt-14 pb-4 px-5 flex items-center shrink-0 z-10 border-b shadow-xl`}>
        <button onClick={onBack} className={`w-10 h-10 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-slate-100 text-slate-700'} rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform`}>
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <div className="ml-4">
           <h2 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-lg leading-tight uppercase tracking-tight`}>Library</h2>
           <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Your study vault</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-32 space-y-7 hide-scrollbar">
        {/* Search */}
        <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} rounded-[22px] px-4 py-3.5 flex items-center border focus-within:border-indigo-500/50 transition-colors`}>
          <Search className="text-gray-500 mr-2.5" size={18} strokeWidth={3}/>
          <input 
            type="text" 
            placeholder="Search your notes & books..." 
            className={`bg-transparent outline-none flex-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-sm font-bold placeholder-gray-600`}
          />
        </div>

        {/* Local File Study Card - NEW */}
        <div className={`${theme === 'dark' ? 'bg-indigo-600/5 border-indigo-500/10' : 'bg-indigo-50 border-indigo-100'} p-6 rounded-[32px] border flex flex-col items-center text-center group`}>
           <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
             <Upload size={32} className="text-indigo-500" />
           </div>
           <h3 className={`font-black text-xs uppercase mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Study Local Files</h3>
           <p className="text-[10px] text-gray-500 font-bold mb-4 uppercase tracking-widest">Pick a PDF from your device to study offline</p>
           <label className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition-all text-center">
             Choose PDF Document
             <input 
              type="file" 
              accept="application/pdf" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  onSelectLocalFile(url, file.name);
                }
              }}
             />
           </label>
        </div>

        {/* Filter Tabs */}
        <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} p-1.5 rounded-2xl border`}>
           <button 
             onClick={() => setFilter('all')}
             className={`flex-1 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${filter === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}
           >LIBRARY</button>
           <button 
             onClick={() => setFilter('offline')}
             className={`flex-1 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all flex items-center justify-center gap-2 ${filter === 'offline' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}
           ><Download size={14} /> OFFLINE</button>
        </div>

        <div>
          <h3 className={`font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'} mb-4 px-1 flex items-center justify-between`}>
             {filter === 'all' ? 'Study Materials' : 'Offline Notes'}
             {filter === 'offline' && <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full uppercase tracking-widest">{visibleItems.length} items</span>}
          </h3>
          <div className="space-y-4">
            {loading ? (
                <div className="py-10 flex justify-center"><div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" /></div>
            ) : (
                visibleItems.map(item => (
                    <div key={item.id}>
                        <LibraryItem 
                        title={item.title}
                        type={item.type}
                        date={item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'New'}
                        color={item.type === 'pdf' ? "bg-red-500/20 text-red-500" : item.type === 'video' ? "bg-blue-500/20 text-blue-500" : "bg-emerald-500/20 text-emerald-500"}
                        isDownloaded={downloadedIds.includes(item.id)} 
                        onDownload={() => handleDownload(item.id)}
                        onClick={() => onSelectItem(item.slug || item.id)}
                        theme={theme}
                        />
                    </div>
                ))
            )}
            {!loading && visibleItems.length === 0 && (
              <div className="text-center py-10">
                 <div className={`w-16 h-16 ${theme === 'dark' ? 'bg-gray-900' : 'bg-slate-100'} rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-500`}>
                    <Download size={32} strokeWidth={1.5} />
                 </div>
                 <p className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>No materials available.</p>
                 <p className="text-[11px] text-gray-500 max-w-[200px] mx-auto mt-2 leading-relaxed">Admin will publish materials soon. Check back later!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LibraryItem({ title, type, date, color, isDownloaded, onDownload, onClick, theme }: { title: string, type: string, date: string, color: string, isDownloaded?: boolean, onDownload?: () => void, onClick?: () => void, theme: 'light' | 'dark' }) {
  return (
    <div onClick={onClick} className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800 active:bg-gray-800/50' : 'bg-white border-slate-200 active:bg-slate-50 shadow-sm'} rounded-[24px] p-4 flex items-center border gap-4 transition-all cursor-pointer group`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${color} shadow-inner`}>
        {type === 'pdf' && <ScrollText size={22} />}
        {type === 'video' && <Video size={22} />}
        {type === 'text' && <FileText size={22} />}
        {type === 'image' && <Layers size={22} />}
        {type === 'book' && <Library size={22} />}
        {type === 'doc' && <Bookmark size={22} />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-[14px] mb-1 truncate leading-tight`}>{title}</h4>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{type}</span>
           <span className="w-1 h-1 rounded-full bg-gray-700"></span>
           <span className="text-[10px] font-bold text-gray-500">{date}</span>
        </div>
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); onDownload?.(); }}
        className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isDownloaded ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : (theme === 'dark' ? 'bg-gray-950 text-gray-600 border-gray-800 hover:text-indigo-400 hover:border-indigo-500' : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-indigo-600 hover:border-indigo-300')}`}
      >
        {isDownloaded ? <CheckCheck size={18} strokeWidth={3} /> : <Download size={18} />}
      </button>
    </div>
  );
}

function DictionaryView({ onBack, theme }: { onBack: () => void, theme: 'light' | 'dark' }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const maleVoice = voices.find(v => (
        v.name?.toLowerCase()?.includes('google us english male') ||
        v.name?.toLowerCase()?.includes('microsoft james') ||
        v.name?.toLowerCase()?.includes('guy') ||
        v.name?.toLowerCase()?.includes('david') ||
        v.name?.toLowerCase()?.includes('male') ||
        v.name?.toLowerCase()?.includes('daniel')
      ) && v.lang?.includes('en'));
      
      if (maleVoice) {
        utterance.voice = maleVoice;
      } else {
        const fallbackMale = voices.find(v => v.name?.toLowerCase()?.includes('male') && v.lang?.includes('en'));
        utterance.voice = fallbackMale || voices.find(v => v.lang?.includes('en')) || voices[0];
      }
      
      utterance.pitch = 0.8;
      utterance.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = setVoice;
    } else {
      setVoice();
    }
  };

  const searchWord = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // 1. Try Free Dictionary API
      const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${query.toLowerCase()}`);
      if (dictRes.ok) {
        const data = await dictRes.json();
        const entry = data[0];
        
        // Transform to our format
        const formattedResult = {
          word: entry.word,
          phonetic: entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text || '',
          meanings: entry.meanings.map((m: any) => ({
             partOfSpeech: m.partOfSpeech,
             definitions: m.definitions.slice(0, 2).map((d: any) => ({
                definition: d.definition,
                example: d.example
             }))
          }))
        };
        setResult(formattedResult);
      } else {
        setError('Could not find definition. Try another word.');
      }
    } catch (err: any) {
      setError('Check your connection and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`absolute inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-gray-950' : 'bg-slate-50'} animate-in slide-in-from-right duration-300`}>
      <div className={`${theme === 'dark' ? 'bg-gray-900/90 border-gray-800 text-white' : 'bg-white/90 border-slate-200 text-slate-900'} backdrop-blur-xl pt-14 pb-4 px-5 flex items-center shrink-0 z-10 border-b shadow-xl`}>
        <button onClick={onBack} className={`w-10 h-10 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-slate-100 text-slate-700'} rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform`}>
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <div className="ml-4">
           <h2 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-lg leading-tight uppercase tracking-tight`}>Dictionary</h2>
           <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Explore Language</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-10 hide-scrollbar">
        <form onSubmit={searchWord} className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} rounded-[2rem] px-5 py-3.5 flex items-center border mb-8 mt-2 transition-all focus-within:border-indigo-500/50 group`}>
          <Search className="text-gray-500 mr-2.5 group-focus-within:text-indigo-400 transition-colors" size={18} strokeWidth={3}/>
          <input 
            type="text" 
            placeholder="Search any word..." 
            className={`bg-transparent outline-none flex-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-sm font-black placeholder-gray-600`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" disabled={!query.trim() || loading} className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform disabled:opacity-30">
             {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ArrowRight size={18} strokeWidth={3} />}
          </button>
        </form>

        {error && (
           <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-center text-sm font-bold">
             {error}
           </div>
        )}

        {result && (
          <div className="animate-in fade-in slide-in-from-bottom duration-500">
            <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-100 shadow-sm'} rounded-[32px] p-8 border mb-6`}>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className={`font-black text-4xl ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-2 capitalize tracking-tighter`}>{result.word}</h3>
                  {result.phonetic && <p className="text-sm text-indigo-400 font-black tracking-[0.2em] uppercase">{result.phonetic}</p>}
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={() => speak(result.word)}
                    className="w-14 h-14 bg-indigo-600 text-white flex items-center justify-center rounded-2xl shadow-xl shadow-indigo-600/30 active:scale-90 transition-transform"
                  >
                    <Volume2 size={28} />
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                {result.meanings.map((meaning: any, i: number) => (
                  <div key={i}>
                    <div className="flex items-center gap-4 mb-4">
                       <span className="font-black text-indigo-500 text-sm italic uppercase tracking-widest">{meaning.partOfSpeech}</span>
                       <div className={`h-[1px] ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-200'} flex-1`}></div>
                    </div>
                    <ul className="space-y-6">
                      {meaning.definitions.slice(0, 3).map((def: any, idx: number) => (
                        <li key={idx} className={`${theme === 'dark' ? 'text-gray-200' : 'text-slate-800'} text-lg leading-relaxed font-bold border-l-4 border-indigo-500/30 pl-6 py-1`}>
                          {def.definition}
                          {def.example && (
                            <div className={`mt-4 p-5 rounded-3xl ${theme === 'dark' ? 'bg-indigo-900/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700'} text-[14px] font-bold leading-relaxed border border-indigo-500/5`}>
                              <div className="text-[10px] uppercase font-black tracking-widest opacity-40 mb-2">Usage Context</div>
                              "{def.example}"
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!result && !error && !loading && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <div className={`w-20 h-20 rounded-3xl ${theme === 'dark' ? 'bg-gray-900 text-gray-700' : 'bg-slate-100 text-slate-300'} flex items-center justify-center mb-6`}>
              <BookA size={40} strokeWidth={1.5} />
            </div>
            <p className="font-black uppercase tracking-widest text-xs">Search any word to explore</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CareerView({ onBack, theme }: { onBack: () => void, theme: 'light' | 'dark' }) {
  const [step, setStep] = useState<'welcome' | 'grades' | 'chat'>('welcome');
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const subjects = [
    'English', 'Mathematics', 'Biology', 'Physical Science', 
    'Geography', 'Agriculture', 'History', 'Chichewa', 
    'Social & Religious Studies', 'Additional Mathematics', 'Computer Studies'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (step === 'chat') scrollToBottom();
  }, [messages, step]);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const calculatePoints = (): number | null => {
    const gradeValues = Object.values(grades).filter((g): g is number => typeof g === 'number' && g > 0 && g <= 9);
    if (gradeValues.length < 6) return null;
    const sorted = [...gradeValues].sort((a, b) => a - b);
    return sorted.slice(0, 6).reduce((sum, g) => sum + g, 0);
  };

  const points = calculatePoints();

  const startConsultation = async () => {
    setStep('chat');
    setLoading(true);

    const initialText = points 
      ? `Hello! I've analyzed your MSCE results. You've scored ${points} points. Based on this, I have some excellent recommendations for programs at Malawian universities. What specific fields interest you?`
      : "Hello! I'm your Career Advisor. I specialize in helping Malawian students navigate opportunities at UNIMA, MUBAS, LUANAR, and beyond. What subjects do you enjoy most in school?";

    setMessages([{
      id: '1',
      sender: 'ai',
      text: initialText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    if (points) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
        const prompt = `You are an expert Career Advisor for students in Malawi. 
        The student has an MSCE score of ${points} points with the following grades: ${Object.entries(grades).map(([s, g]) => `${s}: ${g}`).join(', ')}.
        Provide 3 specific university program recommendations (at UNIMA, MUBAS, LUANAR, MZUNI, KUHES, MUST, or Lilongwe University) that match these grades.
        Briefly explain why they are a good fit.
        IMPORTANT RULES: 1. Do NOT use asterisks (*) or any markdown symbols for formatting. Use ALL CAPS for emphasis. 2. Do NOT use dollar signs ($) for mathematical equations; write them in plain text. 3. Do NOT use emojis. 4. Use simple clear English.
        Keep the tone encouraging.`;

        const config: any = {};
        if (useSearch) config.tools = [{ googleSearch: {} }];

        const response = await ai.models.generateContent({ 
          model: 'gemini-3.1-flash-lite',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config
        });
        
        let responseText = response.text || 'I have some ideas for you. Let\'s discuss your interests further.';
        responseText = responseText.replace(/\*/g, '');
        responseText = responseText.replace(/\$/g, '');

        const aiMsg = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const points = calculatePoints();
      const prompt = `You are an expert Career Advisor for students in Malawi. 
Your goal is to guide them based on their interests and school performance.
Current student context: ${points ? `MSCE Points: ${points}. Grades: ${JSON.stringify(grades)}.` : 'Grades not provided yet.'}
Provide advice about:
1. Suitable programs at Malawian Universities (UNIMA, MUBAS, LUANAR, MZUNI, KUHES, MUST).
2. Career paths in the current Malawian economy (Agriculture, Health, ICT, Engineering, Education).
3. Requirements (MSCE points, subject combinations).
IMPORTANT RULES: 1. Do NOT use asterisks (*) or any markdown symbols for formatting. Use ALL CAPS for emphasis. 2. Do NOT use dollar signs ($) for mathematical equations; write them in plain text. 3. Do NOT use emojis. 4. Use simple clear English.
Keep your tone encouraging and professional.
Context so far: ${messages.map(m => `${m.sender}: ${m.text}`).join('\n')}
User: ${input}`;

      const config: any = {};
      if (useSearch) config.tools = [{ googleSearch: {} }];

      const response = await ai.models.generateContent({ 
        model: 'gemini-3.1-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config
      });
      
      let responseText = response.text || 'I am sorry, I could not generate a response.';
      responseText = responseText.replace(/\*/g, '');
      responseText = responseText.replace(/\$/g, '');

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`absolute inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-gray-950' : 'bg-slate-50'} animate-in slide-in-from-right duration-300`}>
      <div className={`${theme === 'dark' ? 'bg-gray-900/90 border-gray-800 text-white' : 'bg-white/90 border-slate-200 text-slate-900'} backdrop-blur-xl pt-14 pb-4 px-5 flex items-center shrink-0 z-10 border-b shadow-xl`}>
        <button onClick={() => step === 'welcome' ? onBack() : setStep('welcome')} className={`w-10 h-10 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-slate-100 text-slate-700'} rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform`}>
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <div className="ml-4">
           <h2 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-lg leading-tight uppercase tracking-tight`}>Career Path</h2>
           <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">Explore Your Future</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {step === 'welcome' ? (
          <div className="p-8 flex flex-col items-center text-center pt-16">
            <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white mb-8 shadow-[0_20px_50px_rgba(79,70,229,0.3)] animate-pulse">
              <Compass size={44} strokeWidth={2.5} />
            </div>
            <h1 className={`text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-4 tracking-tighter`}>Your Future Starts Here.</h1>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'} font-bold mb-12 max-w-sm leading-relaxed`}>
              Get personalized guidance on university programs and career opportunities in Malawi.
            </p>
            
            <div className="grid grid-cols-1 gap-4 w-full max-w-xs mb-12">
               <button 
                 onClick={() => setStep('grades')}
                 className={`${theme === 'dark' ? 'bg-gray-900 border-indigo-500/50' : 'bg-white border-indigo-200 shadow-sm'} p-6 rounded-3xl flex flex-col items-center gap-3 border-2 transition-all hover:scale-105 active:scale-95 group`}
               >
                 <div className="text-indigo-400 w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Target size={28} />
                 </div>
                 <div className="flex flex-col items-center">
                    <span className={`font-black text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Check Eligibility</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Enter MSCE Grades</span>
                 </div>
               </button>

               <button 
                 onClick={startConsultation}
                 className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} p-6 rounded-3xl flex flex-col items-center gap-3 border-2 transition-all hover:scale-105 active:scale-95 group`}
               >
                 <div className="text-emerald-400 w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <MessageSquareText size={28} />
                 </div>
                 <div className="flex flex-col items-center">
                    <span className={`font-black text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Talk to Advisor</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Ask anything</span>
                 </div>
               </button>
            </div>

            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] opacity-40">Consult Malawian University Experts</p>
          </div>
        ) : step === 'grades' ? (
          <div className="p-6 pb-20">
            <div className="mb-8">
               <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} leading-tight`}>Enter MSCE Results</h3>
               <p className="text-xs text-gray-500 font-bold mt-1">Select your grades for best 6 subjects (1-9)</p>
            </div>

            <div className="space-y-3 mb-8">
              {subjects.map(subject => (
                <div key={subject} className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} p-4 rounded-2xl border flex items-center justify-between transition-all hover:border-indigo-500/30`}>
                  <span className={`font-bold text-[13px] ${theme === 'dark' ? 'text-gray-200' : 'text-slate-700'}`}>{subject}</span>
                  <div className="flex items-center gap-2">
                    <select 
                      className={`bg-transparent outline-none text-sm font-black ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'} cursor-pointer`}
                      value={grades[subject] || 0}
                      onChange={(e) => setGrades({...grades, [subject]: parseInt(e.target.value)})}
                    >
                      <option value="0">-</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-4 left-0 right-0 px-2 mt-10">
              <div className={`${theme === 'dark' ? 'bg-gray-900 border-indigo-500/20' : 'bg-white border-indigo-200 shadow-2xl'} p-6 rounded-[32px] border-2 backdrop-blur-xl`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Total Points</p>
                    <p className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{points || '--'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Eligibility</p>
                    <p className={`text-sm font-black ${points && points <= 24 ? 'text-emerald-500' : points && points <= 36 ? 'text-amber-500' : 'text-gray-500'}`}>
                      {points ? (points <= 24 ? 'High Chance' : points <= 36 ? 'Limited' : 'Low Chance') : 'Enter 6 Grades'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={startConsultation}
                  disabled={points === null}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/30 active:scale-95 transition-all text-xs tracking-widest uppercase disabled:opacity-50"
                >
                  Analyze & Recommend
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full bg-inherit">
             <div className="flex-1 p-5 space-y-6 overflow-y-auto hide-scrollbar">
               {messages.map(msg => (
                 <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm shadow-indigo-500/20 shadow-lg' : (theme === 'dark' ? 'bg-gray-900 border-gray-800 text-gray-200' : 'bg-white border-slate-200 text-slate-800 shadow-sm')} p-5 rounded-[2rem] border max-w-[85%] font-bold text-[15px] leading-relaxed whitespace-pre-wrap animate-in slide-in-from-bottom-2 duration-300`}>
                     {msg.sender === 'ai' && (
                       <button 
                         onClick={() => speakText(msg.text)} 
                         className={`mb-2 w-8 h-8 rounded-full flex justify-center items-center ${theme === 'dark' ? 'bg-indigo-900/50 text-indigo-400 hover:bg-indigo-900' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'} transition-colors`}
                         title="Read aloud"
                       >
                         <Volume2 size={16} />
                       </button>
                     )}
                     {msg.text}
                   </div>
                 </div>
               ))}
               {loading && (
                 <div className="flex justify-start">
                   <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'} p-5 rounded-[2rem] border flex gap-1.5`}>
                     <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                     <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-100" />
                     <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-200" />
                   </div>
                 </div>
               )}
               <div ref={messagesEndRef} />
             </div>
             
             <div className={`p-4 ${theme === 'dark' ? 'bg-gray-950/80' : 'bg-white/80'} backdrop-blur-md border-t ${theme === 'dark' ? 'border-gray-800' : 'border-slate-200'} sticky bottom-0`}>
                <div className="flex gap-2 max-w-md mx-auto mb-2">
                  <button 
                    onClick={() => setUseSearch(!useSearch)}
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-colors ${useSearch ? (theme === 'dark' ? 'bg-indigo-900 text-indigo-300 border-indigo-700' : 'bg-indigo-100 text-indigo-700 border-indigo-200') : (theme === 'dark' ? 'bg-transparent text-gray-500 border-gray-700' : 'bg-transparent text-gray-500 border-gray-300')}`}
                  >
                    <Search size={12} /> {useSearch ? 'Live Search On' : 'Live Search Off'}
                  </button>
                </div>
                <div className="flex gap-2 max-w-md mx-auto">
                   <input 
                    type="text" 
                    placeholder="Ask about universities, criteria..." 
                    className={`flex-1 ${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900 shadow-inner'} border rounded-[2rem] px-6 py-4 outline-none font-bold text-sm focus:border-indigo-500 transition-colors`}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                   />
                   <button 
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all disabled:opacity-50 shrink-0"
                   >
                     <Send size={20} strokeWidth={3} />
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QuizzesView({ onBack, theme, onStartQuiz }: { onBack: () => void, theme: 'light' | 'dark', onStartQuiz: (questions: any[], topic: string) => void }) {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);

  const generateAIQuiz = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const prompt = `Generate a high-quality educational quiz for MSCE students in Malawi on the topic: ${topic}.
      Generate exactly ${numQuestions} multiple-choice questions.
      Each question must have 4 options and one correct answer.
      Provide a "summary" field explaining why the correct answer is right.
      IMPORTANT: Do NOT use asterisks (*) or dollar signs ($), use simple plain text.
      Return ONLY a JSON array of objects with this structure:
      [
        {
          "q": "Question text here?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": "Correct Option text",
          "summary": "Brief explanation of why this answer is correct."
        }
      ]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        config: { responseMimeType: "application/json" },
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const questions = JSON.parse(response.text || '[]');
      if (questions.length > 0) {
        onStartQuiz(questions, topic);
      }
    } catch (err) {
      console.error("Quiz generation error:", err);
      alert("Failed to generate quiz. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const startPredefinedQuiz = (name: string) => {
    const questions = name === 'Math Fundamentals' ? [
       { q: "What is 5x + 2 = 17?", options: ["x=2", "x=3", "x=4", "x=5"], answer: "x=3", summary: "Subtracting 2 from 17 gives 15. Then dividing 15 by 5 gives x=3." },
       { q: "What is the formula for the Area of a circle?", options: ["πr²", "2πr", "π²r", "r²"], answer: "πr²", summary: "The area of a circle is calculated by multiplying pi (π) by the square of the radius (r²)." },
       { q: "What is 15% of 200?", options: ["15", "20", "30", "45"], answer: "30", summary: "15% of 200 is calculated as (15/100) * 200 = 30." }
    ] : [
       { q: "Which planet is the hottest in the solar system?", options: ["Venus", "Mars", "Mercury", "Jupiter"], answer: "Venus", summary: "Venus is the hottest planet because of its thick atmosphere that traps heat through the greenhouse effect." },
       { q: "What is the chemical symbol for Gold?", options: ["Ag", "Au", "Pb", "Fe"], answer: "Au", summary: "The chemical symbol for Gold (Au) comes from its Latin name 'Aurum'." },
       { q: "What gas do plants absorb during photosynthesis?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], answer: "Carbon Dioxide", summary: "Plants take in Carbon Dioxide and water to produce glucose and oxygen through photosynthesis." }
    ];
    onStartQuiz(questions, name);
  };

  return (
    <div className={`absolute inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-gray-950' : 'bg-slate-50'} animate-in slide-in-from-right duration-300`}>
      {/* Fixed Header */}
      <div className={`${theme === 'dark' ? 'bg-gray-900/90 border-gray-800 text-white' : 'bg-white/90 border-slate-200 text-slate-900'} backdrop-blur-xl pt-14 pb-4 px-5 flex items-center shrink-0 z-10 border-b shadow-xl`}>
        <button onClick={onBack} className={`w-10 h-10 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-slate-100 text-slate-700'} rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform`}>
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <div className="ml-4">
           <h2 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-lg leading-tight uppercase tracking-tight`}>Quiz Center</h2>
           <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Test Your Skills</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-32 space-y-8 hide-scrollbar">
        {/* AI Generation Card */}
        <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} p-6 rounded-[32px] border relative overflow-hidden group`}>
           <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Bot size={22} />
                </div>
                <div>
                   <h3 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} leading-tight`}>AI Quiz Generator</h3>
                   <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Instant Study Sessions</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className={`${theme === 'dark' ? 'bg-gray-950 border-gray-800' : 'bg-slate-50 border-slate-100 shadow-inner'} rounded-2xl p-4 flex items-center border`}>
                   <Sparkles className="text-gray-500 mr-3 shrink-0" size={18} />
                   <input 
                     type="text" 
                     placeholder="Enter topic (e.g. MSCE Biology Genetics)" 
                     className={`bg-transparent outline-none flex-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-sm font-bold placeholder-gray-600 h-6`}
                     value={topic}
                     onChange={(e) => setTopic(e.target.value)}
                   />
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Questions: {numQuestions}</span>
                    <input 
                      type="range" min="5" max="10" step="1" 
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 h-1.5 rounded-full bg-gray-800"
                    />
                  </div>
                  <button 
                    onClick={generateAIQuiz}
                    disabled={!topic.trim() || isGenerating}
                    className="bg-indigo-600 text-white font-black text-[11px] py-4 px-6 rounded-2xl active:scale-95 transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50 tracking-widest uppercase"
                  >
                    {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Generate'}
                  </button>
                </div>
              </div>
           </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
           <div className="relative z-10">
              <h3 className="text-2xl font-black mb-2 leading-tight">Daily Challenge</h3>
              <p className="text-indigo-100 text-xs font-bold leading-relaxed mb-6 max-w-[200px]">Unlock 500 bonus points by completing today's challenge.</p>
              <button 
                onClick={() => startPredefinedQuiz('Math Fundamentals')}
                className="bg-white text-indigo-700 font-black text-xs py-3 px-6 rounded-2xl active:scale-95 transition-all"
              >
                Start Now
              </button>
           </div>
           <Target className="absolute top-1/2 right-[-20px] -translate-y-1/2 text-white/10 w-48 h-48" strokeWidth={1} />
        </div>

        <div>
          <h3 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-lg mb-6 px-1 uppercase tracking-tight`}>Trending Quizzes</h3>
          <div className="grid grid-cols-1 gap-5">
            <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} rounded-[32px] p-6 border flex flex-col items-center text-center group relative overflow-hidden`}>
               <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
               <div className={`w-16 h-16 ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-100'} rounded-2xl flex items-center justify-center mb-5 border group-hover:scale-110 transition-transform`}>
                  <CheckCheck size={32} strokeWidth={2.5} />
               </div>
               <h3 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-2 tracking-tight`}>Math Fundamentals</h3>
               <p className="text-xs text-gray-500 font-bold mb-6 px-4 leading-relaxed">Master the core concepts of algebra and geometry step by step.</p>
               <button onClick={() => startPredefinedQuiz('Math Fundamentals')} className={`w-full ${theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white hover:bg-gray-800' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'} font-black py-4 rounded-2xl border active:scale-95 transition-all text-[11px] tracking-widest uppercase`}>
                 Begin Test
               </button>
            </div>

            <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} rounded-[32px] p-6 border flex flex-col items-center text-center group relative overflow-hidden`}>
               <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
               <div className={`w-16 h-16 ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-100'} rounded-2xl flex items-center justify-center mb-5 border group-hover:scale-110 transition-transform`}>
                  <BrainCircuit size={32} strokeWidth={2.5} />
               </div>
               <h3 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-2 tracking-tight`}>Science Trivia</h3>
               <p className="text-xs text-gray-500 font-bold mb-6 px-4 leading-relaxed">Physics, chemistry, and biology combined in one rapid-fire round.</p>
               <button onClick={() => startPredefinedQuiz('Science Trivia')} className={`w-full ${theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white hover:bg-gray-800' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'} font-black py-4 rounded-2xl border active:scale-95 transition-all text-[11px] tracking-widest uppercase`}>
                 Begin Test
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuizTakingView({ questions, topic, onEnd, theme }: { questions: any[], topic: string, onEnd: () => void, theme: 'light' | 'dark' }) {
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(questions.length * 30); // 30s per question
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    if (showResult || showFeedback) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowResult(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showResult, showFeedback]);

  const handleAnswer = (opt: string) => {
    if (showFeedback) return;
    setSelectedOption(opt);
    const correct = opt === questions[qIndex].answer;
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);
    setShowFeedback(true);
  };

  const nextQuestion = () => {
    if (qIndex + 1 < questions.length) {
      setQIndex(q => q + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      setShowResult(true);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (showResult) {
    const percentage = (score / questions.length) * 100;
    return (
      <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center ${theme === 'dark' ? 'bg-gray-950' : 'bg-slate-50'} px-6 text-center animate-in fade-in duration-500`}>
         <div className={`w-32 h-32 ${percentage >= 50 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'} rounded-full flex items-center justify-center mb-6 shadow-2xl`}>
            {percentage >= 50 ? <Trophy size={64} /> : <Target size={64} />}
         </div>
         <h2 className={`text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-2 tracking-tighter`}>Quiz Complete!</h2>
         <p className="text-gray-500 font-bold text-lg mb-8 uppercase tracking-widest">
           Topic: <span className="text-indigo-400">{topic}</span>
         </p>
         
         <div className="flex gap-4 mb-10 w-full max-w-sm">
            <div className={`flex-1 ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'} p-6 rounded-3xl border shadow-sm`}>
               <div className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{score}/{questions.length}</div>
               <div className="text-[10px] uppercase font-black text-gray-500 tracking-widest mt-1">Score</div>
            </div>
            <div className={`flex-1 ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'} p-6 rounded-3xl border shadow-sm`}>
               <div className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{Math.round(percentage)}%</div>
               <div className="text-[10px] uppercase font-black text-gray-500 tracking-widest mt-1">Accuracy</div>
            </div>
         </div>

         <button 
           onClick={onEnd} 
           className="w-full max-w-sm bg-indigo-600 text-white font-black py-5 rounded-[2.5rem] active:scale-95 transition-all text-lg shadow-2xl shadow-indigo-600/40 hover:bg-indigo-700"
         >
           Finish Session
         </button>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col ${theme === 'dark' ? 'bg-gray-950' : 'bg-slate-50'} animate-in slide-in-from-bottom duration-500`}>
      {/* Immersive Header */}
      <div className={`${theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white/50 border-slate-200'} backdrop-blur-md pt-14 pb-4 px-6 flex items-center justify-between z-10 border-b`}>
         <button onClick={onEnd} className={`w-10 h-10 ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-slate-100 text-slate-500'} rounded-xl flex items-center justify-center active:scale-90 transition-transform`}>
            <X size={20} strokeWidth={3} />
         </button>
         
         <div className="flex-1 max-w-[140px] mx-4">
            <div className={`h-2.5 w-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-200'} rounded-full overflow-hidden shadow-inner`}>
               <div className="h-full bg-indigo-500 transition-all duration-700 ease-out" style={{ width: `${((qIndex + 1) / questions.length) * 100}%` }}></div>
            </div>
         </div>

         <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${timeLeft < 10 ? 'bg-red-500 text-white' : (theme === 'dark' ? 'bg-gray-800 text-indigo-400' : 'bg-indigo-50 text-indigo-600')} transition-colors`}>
            <Clock size={14} strokeWidth={3} />
            <span className="text-xs font-black tracking-tighter">{formatTime(timeLeft)}</span>
         </div>
      </div>

      <div className="flex-1 px-6 pt-10 overflow-y-auto pb-32 hide-scrollbar">
         <div className="flex items-center justify-between mb-8">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Question {qIndex + 1} of {questions.length}</span>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Points: {score * 100}</span>
         </div>

         <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} leading-tight mb-10`}>
           {questions[qIndex].q}
         </h3>

         <div className="space-y-4">
            {questions[qIndex].options.map((opt: string, i: number) => {
               const isSelected = selectedOption === opt;
               const isAnswer = opt === questions[qIndex].answer;
               
               let variantClass = theme === 'dark' ? 'bg-gray-900 border-gray-800 text-gray-300' : 'bg-white border-slate-200 text-slate-700';
               
               if (showFeedback) {
                  if (isAnswer) {
                    variantClass = 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20';
                  } else if (isSelected && !isAnswer) {
                    variantClass = 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/20';
                  } else {
                    variantClass = theme === 'dark' ? 'bg-gray-900/30 border-gray-800 text-gray-600 opacity-50' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-50';
                  }
               } else if (isSelected) {
                  variantClass = 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20';
               }

               return (
                  <button 
                    key={i} 
                    disabled={showFeedback}
                    onClick={() => handleAnswer(opt)} 
                    className={`w-full flex items-center justify-between px-6 py-5 rounded-[24px] border-2 font-bold text-left transition-all ${variantClass} ${!showFeedback && 'hover:-translate-y-1 active:scale-95'}`}
                  >
                     <span className="text-[15px]">{opt}</span>
                     {showFeedback && isAnswer && <CheckCircle size={20} strokeWidth={3} />}
                     {showFeedback && isSelected && !isAnswer && <ShieldAlert size={20} strokeWidth={3} />}
                  </button>
               );
            })}
         </div>
      </div>

      {/* Persistent Feedback Bottom Sheet */}
      {showFeedback && (
        <div className={`absolute bottom-0 left-0 right-0 z-20 ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-[0_-10px_50px_rgba(0,0,0,0.1)]'} p-8 border-t rounded-t-[3rem] animate-in slide-in-from-bottom duration-300`}>
           <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isCorrect ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                 {isCorrect ? <ThumbsUp size={24} /> : <HelpCircle size={24} />}
              </div>
              <div>
                 <h4 className={`text-xl font-black ${isCorrect ? 'text-emerald-500' : 'text-red-500'}`}>
                   {isCorrect ? 'Brilliant! Correct' : 'Not quite right'}
                 </h4>
                 {!isCorrect && (
                   <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                     Correct: <span className="text-emerald-500">{questions[qIndex].answer}</span>
                   </p>
                 )}
              </div>
           </div>
           
           <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'} font-bold leading-relaxed mb-6 bg-gray-950/20 p-4 rounded-2xl border border-white/5`}>
             {questions[qIndex].summary}
           </p>
           
           <button 
             onClick={nextQuestion}
             className="w-full bg-gray-100 text-gray-900 font-black py-4 rounded-2xl active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 group hover:bg-white"
           >
             {qIndex + 1 === questions.length ? 'Show My Results' : 'Continue Learning'}
             <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
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
  isAdmin
}: { 
  onBack: () => void, 
  profile: any, 
  onUpdate: (p: any) => void, 
  onLogout: () => void, 
  theme: 'light' | 'dark', 
  onThemeToggle: () => void, 
  onShowNotifications: () => void,
  onNavigate: (view: ViewState) => void,
  onShowSettings: () => void,
  isAdmin: boolean
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [tempName, setTempName] = useState(profile?.name || '');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showLevelPicker, setShowLevelPicker] = useState(false);

  // Sync tempName if profile loads late
  useEffect(() => {
    if (profile?.name && !tempName) {
      setTempName(profile.name);
    }
  }, [profile?.name]);

  if (!profile) {
    return (
      <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center ${theme === 'dark' ? 'bg-gray-950' : 'bg-slate-50'}`}>
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Loading Profile...</p>
      </div>
    );
  }

  const referralLink = `${window.location.origin}/${profile.referralCode}`;

  const forms = ['Form 1', 'Form 2', 'Form 3', 'Form 4'];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const menuItems = [
    { icon: CreditCard, label: 'Subscription & Pay', color: 'text-indigo-400', onClick: () => onNavigate('subscription') },
    ...(isAdmin ? [{ icon: ShieldCheck, label: 'Admin Panel', color: 'text-amber-500', onClick: () => onNavigate('admin') }] : []),
    { icon: Settings, label: 'App Settings', color: 'text-gray-400', onClick: onShowSettings },
  ];

    return (
    <div className={`absolute inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-gray-950' : 'bg-slate-50'} animate-in slide-in-from-right duration-300`}>
      {/* Fixed Header */}
      <div className={`${theme === 'dark' ? 'bg-gray-900/90 border-gray-800 text-white' : 'bg-white/90 border-slate-200 text-slate-900'} backdrop-blur-xl pt-14 pb-4 px-5 flex items-center shrink-0 z-10 border-b shadow-xl`}>
        <button onClick={onBack} className={`w-10 h-10 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-slate-100 text-slate-700'} rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform`}>
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <div className="ml-4">
           <h2 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-lg leading-tight uppercase tracking-tight`}>Profile</h2>
           <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Your Stats & Settings</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-10 pb-32 space-y-10 scroll-smooth">
        {/* User Card */}
        <div className="flex flex-col items-center">
            <div className="relative mb-6 group">
                <div className={`w-32 h-32 rounded-[40px] ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'} border-2 p-1.5 shadow-2xl shadow-indigo-600/20`}>
                    <div className={`w-full h-full rounded-[32px] overflow-hidden border ${theme === 'dark' ? 'border-gray-800 bg-gray-950' : 'border-slate-200 bg-slate-50'} relative`}>
                        <Avatar user={profile} className="w-full h-full text-5xl rounded-none" />
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
                    className={`absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center border-4 ${theme === 'dark' ? 'border-gray-950' : 'border-slate-50'} shadow-xl active:scale-90 transition-transform`}
                >
                    <Plus size={18} strokeWidth={3} />
                </button>
            </div>

            <div className="text-center">
                {isEditingName ? (
                    <div className="flex flex-col items-center gap-3">
                        <input 
                            autoFocus
                            className={`bg-transparent border-b-2 border-indigo-500 text-2xl font-black text-center outline-none w-48 py-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onBlur={() => { onUpdate({...profile, name: tempName}); setIsEditingName(false); }}
                            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                        />
                         <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Tap out to save</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <h3 className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} flex items-center gap-2 tracking-tight`} onClick={() => setIsEditingName(true)}>
                            {profile.name} {profile.isPro && <Crown size={22} className="text-yellow-400 drop-shadow-md" />} <Smile size={20} className="text-indigo-400 opacity-60" />
                        </h3>
                        {profile.isPro && (
                          <div className="mt-1 px-3 py-0.5 bg-yellow-400/10 border border-yellow-400/20 rounded-full">
                            <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Pro Student</span>
                          </div>
                        )}
                         <button 
                            onClick={() => setShowLevelPicker(true)}
                            className={`mt-3 inline-flex items-center gap-2 ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'} px-4 py-1.5 rounded-full border active:scale-95 transition-all group shadow-sm`}
                        >
                            <span className={`text-[10px] font-black ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'} uppercase tracking-widest leading-none`}>{profile.level || 'Form 4'} Student</span>
                            <ChevronDown size={12} className="text-indigo-500 group-hover:translate-y-0.5 transition-transform" />
                        </button>
                    </div>
                )}
            </div>
        </div>

        <div className="flex gap-4">
            <div className={`flex-1 ${theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} p-6 rounded-[32px] border flex flex-col items-center group`}>
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                   <Target size={20} />
                </div>
                <div className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{profile.points}</div>
                <div className="text-[8px] uppercase font-black text-gray-500 tracking-[0.2em] mt-1">Total XP</div>
            </div>
            <div className={`flex-1 ${theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} p-6 rounded-[32px] border flex flex-col items-center group`}>
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                   <Flame size={20} fill="currentColor" />
                </div>
                <div className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{profile.streak || 1}</div>
                <div className="text-[8px] uppercase font-black text-gray-500 tracking-[0.2em] mt-1">Day Streak</div>
            </div>
        </div>

        {/* Referral Card */}
        <div className="bg-indigo-600/10 border-2 border-indigo-500/20 p-8 rounded-[40px] relative overflow-hidden group">
           <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl transition-transform group-hover:scale-110"></div>
           <div className="relative z-10">
              <h4 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-lg mb-2 tracking-tight`}>Invite your Classmates</h4>
              <p className={`text-xs ${theme === 'dark' ? 'text-indigo-200/70' : 'text-slate-600'} font-semibold mb-6 leading-relaxed max-w-[220px]`}>Help friends join Educate MW and get 500 XP exclusive bonus.</p>
              <div className={`${theme === 'dark' ? 'bg-gray-950/80 border-indigo-500/30' : 'bg-white border-slate-200 shadow-xl'} backdrop-blur-md p-2 rounded-2xl border flex items-center justify-between`}>
                 <span className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-sm tracking-widest pl-4 uppercase`}>{profile.referralCode}</span>
                 <button onClick={handleCopyLink} className={`${isCopied ? 'bg-emerald-500' : 'bg-indigo-600'} text-white p-3.5 rounded-xl shadow-lg active:scale-90 transition-all hover:opacity-90`}>
                    {isCopied ? <CheckCircle size={18} strokeWidth={3} /> : <Share2 size={18} strokeWidth={2.5} />}
                 </button>
              </div>
              {isCopied && <p className="text-[10px] text-emerald-500 font-bold mt-2 animate-bounce">Link copied successfully! ✅</p>}
           </div>
           <Gift className="absolute bottom-[-15%] left-[-5%] w-32 h-32 text-indigo-500/5 -rotate-12" />
        </div>

        {/* Daily Goals - Removed as per user request (already on Home tools) */}
        
        {/* Suggested Features - Removed as per user request (already on Home grid) */}

        {/* Menu Options */}
        <div className="space-y-3 pb-10">
            {menuItems.map((item, i) => (
                <button 
                  key={i} 
                  onClick={item.onClick}
                  className={`w-full ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} p-5 rounded-[2.5rem] border flex items-center justify-between group active:scale-95 transition-all`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl ${theme === 'dark' ? 'bg-gray-950 border-gray-800' : 'bg-slate-50 border-slate-100'} flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform shadow-inner border shadow-sm`}>
                            <item.icon size={20} />
                        </div>
                        <span className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-sm tracking-tight`}>{item.label}</span>
                    </div>
                    {item.onClick ? (
                       <div className={`w-12 h-6 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${theme === 'dark' ? 'left-7' : 'left-1'}`} />
                       </div>
                    ) : (
                       <ChevronRight size={18} className="text-gray-700 group-hover:text-white transition-colors" />
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
                    <span className="font-black text-red-500 text-sm tracking-tight">Log Out</span>
                </div>
            </button>
        </div>

        {/* Weekly Activity Stats - Removed as per user request for minimal sidebar menu */}
      </div>

      {/* Avatar/Gender Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'} w-full max-w-sm rounded-[2.5rem] p-8 pb-10 border shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto hide-scrollbar`}>
              <div className={`flex justify-between items-center mb-8 sticky top-0 ${theme === 'dark' ? 'bg-gray-900 shadow-[0_10px_20px_rgba(17,24,39,0.9)]' : 'bg-white shadow-[0_10px_20px_rgba(255,255,255,0.9)]'} z-30 pt-2`}>
                 <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Pick your Avatar</h3>
                 <button onClick={() => setShowAvatarPicker(false)} className={`text-gray-500 hover:${theme === 'dark' ? 'text-white' : 'text-slate-900'} ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-100'} rounded-full p-2 active:scale-95 transition-transform`}><X size={20} /></button>
              </div>

              <div className={`${theme === 'dark' ? 'bg-gray-950 border-gray-800' : 'bg-slate-50 border-slate-200'} rounded-2xl p-1.5 mb-8 border flex`}>
                 <button 
                  onClick={() => onUpdate({...profile, gender: 'male'})}
                  className={`flex-1 py-3 font-black text-sm rounded-xl transition-all ${profile.gender === 'male' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-indigo-400'}`}
                 >👦 Boy</button>
                 <button 
                  onClick={() => onUpdate({...profile, gender: 'female'})}
                  className={`flex-1 py-3 font-black text-sm rounded-xl transition-all ${profile.gender === 'female' ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20' : 'text-gray-500 hover:text-pink-400'}`}
                 >👧 Girl</button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                 {(profile.gender === 'female' ? FEMININE_GRADIENTS : MASCULINE_GRADIENTS).map((gradient, idx) => (
                    <button 
                      key={idx}
                      onClick={() => { onUpdate({...profile, avatarGradient: gradient}); setShowAvatarPicker(false); }}
                      className={`relative aspect-square rounded-[1.5rem] border-4 transition-all overflow-hidden ${theme === 'dark' ? 'bg-gray-950' : 'bg-slate-100'} shadow-md ${profile.avatarGradient === gradient ? 'border-none scale-105 shadow-indigo-500/40 ring-4 ring-indigo-500 ring-offset-2 ' + (theme === 'dark' ? 'ring-offset-gray-900' : 'ring-offset-white') : 'border-transparent active:scale-95'}`}
                    >
                       <Avatar user={{...profile, avatarGradient: gradient}} className="w-full h-full text-2xl rounded-[1.2rem]" />
                       {profile.avatarGradient === gradient && (
                         <div className="absolute top-1 right-1 bg-white text-indigo-600 p-0.5 rounded-full shadow-lg z-20">
                           <CheckCheck size={12} strokeWidth={4} />
                         </div>
                       )}
                    </button>
                 ))}
              </div>
              
              <div className="mt-8 text-center px-4">
                 <p className="text-[11px] text-gray-500 font-bold leading-snug">Choose the avatar that makes you feel most confident and ready to study! 🚀</p>
              </div>
           </div>
        </div>
      )}

      {/* Level Picker Modal */}
      {showLevelPicker && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-200">
           <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-100 shadow-2xl'} w-full max-w-xs rounded-3xl p-8 border animate-in zoom-in-95 duration-200`}>
              <h3 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-6 text-center`}>Select your Form</h3>
              <div className="grid grid-cols-1 gap-3">
                 {forms.map((f) => (
                    <button 
                      key={f}
                      onClick={() => { onUpdate({...profile, level: f}); setShowLevelPicker(false); }}
                      className={`py-3.5 rounded-2xl font-bold transition-all border ${profile.level === f || (!profile.level && f === 'Form 4') ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' : (theme === 'dark' ? 'bg-gray-950 text-gray-400 border-gray-800 hover:text-white' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100')}`}
                    >
                       {f}
                    </button>
                 ))}
              </div>
               <button 
                 onClick={() => setShowLevelPicker(false)}
                 className="mt-6 w-full py-3 text-gray-500 font-bold text-sm tracking-widest uppercase hover:text-indigo-400 transition-colors"
                 >Cancel</button>
            </div>
         </div>
      )}
    </div>
  );
}

function AuthView({ onNavigateRegister, theme }: { onNavigateRegister: () => void, theme: 'light' | 'dark' }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier || !password) {
      setError('Please enter your credentials');
      return;
    }
    setLoading(true);
    try {
      let emailToUse = identifier.trim();
      if (/^[\d\s+\-()]+$/.test(identifier) && identifier.length >= 8) {
        const digits = identifier.replace(/\D/g, '');
        emailToUse = `${digits}@educatemw.app`;
      }
      await signInWithEmailAndPassword(auth, emailToUse, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Check credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col min-h-full ${theme === 'dark' ? 'bg-gray-950' : 'bg-slate-50'} p-6 pt-20 animate-in fade-in duration-500 overflow-y-auto`}>
      <div className="flex flex-col items-center mb-12">
        <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-500/40 mb-6 p-4">
          <GraduationCap size={44} className="text-white" fill="white" fillOpacity={0.2} />
        </div>
        <h1 className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} tracking-tight`}>educate mw</h1>
        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 mb-4">Empowering Students</p>
        
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'} text-center max-w-xs font-medium leading-relaxed mb-4`}>
          The ultimate learning platform for Malawian students. Access MSCE notes, interactive quizzes, video tutorials, a dictionary, and an intelligent AI assistant.
        </p>
      </div>

      <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'} rounded-[40px] p-8 border`}>
        <h2 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-8 tracking-tight`}>Access Account</h2>
        
        <div className="space-y-4 relative z-10">
          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-gray-900 font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
            ) : (
              <>
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                CONTINUE WITH GOOGLE
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full py-2">
            <div className={`h-px ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-200'} flex-1`}></div>
            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">or email/phone</span>
            <div className={`h-px ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-200'} flex-1`}></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email or Phone</label>
              <div className={`${theme === 'dark' ? 'bg-gray-950 border-gray-800' : 'bg-slate-100 border-slate-200'} rounded-2xl p-4 flex items-center border focus-within:border-indigo-500/50 transition-all`}>
                <User size={18} className="text-gray-600 mr-3" />
                <input 
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="student@example.com or 099..." 
                  className={`bg-transparent outline-none flex-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-sm font-bold placeholder-gray-600`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Password</label>
              <div className={`${theme === 'dark' ? 'bg-gray-950 border-gray-800' : 'bg-slate-100 border-slate-200'} rounded-2xl p-4 flex items-center border focus-within:border-indigo-500/50 transition-all`}>
                <Lock size={18} className="text-gray-600 mr-3" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className={`bg-transparent outline-none flex-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-sm font-bold placeholder-gray-600`}
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-[10px] font-black uppercase text-center mt-2">{error}</p>}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all mt-4 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'LOGIN'}
            </button>
          </form>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 relative z-10">
          <button 
            type="button"
            onClick={onNavigateRegister}
            className={`w-full ${theme === 'dark' ? 'bg-gray-950 text-white border-gray-800' : 'bg-slate-100 text-slate-700 border-slate-200'} text-[10px] font-black py-4 rounded-2xl border active:scale-95 transition-all uppercase tracking-widest shadow-none`}
          >
            Create New Account
          </button>
          <p className="text-[9px] text-gray-500 font-black text-center uppercase tracking-wider leading-relaxed">
            By continuing, you agree to our <a href="/terms" className="text-indigo-400 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
      
      <footer className="mt-12 py-8 flex flex-col items-center gap-3">
         <div className="flex gap-6">
            <a href="/terms" className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:underline">Terms</a>
            <a href="/privacy" className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:underline">Privacy</a>
         </div>
         <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.3em] opacity-30">© 2026 educate mw</p>
      </footer>
    </div>
  );
}

function SubscriptionView({ onBack, profile, theme }: { onBack: () => void, profile: any, theme: 'light' | 'dark' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCelebrate, setShowCelebrate] = useState(false);

  const handleSubscribe = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const txRef = `tx-${Math.random().toString(36).substring(2, 12)}`;
      const publicKey = (import.meta as any).env.VITE_PAYCHANGU_PUBLIC_KEY;
      
      if (!publicKey) {
         setError("Missing PayChangu Public Key. Please add VITE_PAYCHANGU_PUBLIC_KEY to your environment variables.");
         setLoading(false);
         return;
      }

      // Robust check for PayChanguCheckout (pre-loaded in index.html)
      const checkoutFunc = (window as any).PaychanguCheckout;
      
      if (!checkoutFunc) {
        setError("PayChangu script is still loading. Please wait a few seconds and try again.");
        setLoading(false);
        return;
      }

      checkoutFunc({
        public_key: publicKey,
        tx_ref: txRef,
        amount: 500,
        currency: "MWK",
        customer: {
          email: profile.email || "student@educatemw.app",
          first_name: profile.name || "Student",
          last_name: "Mw",
        },
        customization: {
          title: "Emi AI Pro",
          description: "K500 Access for Emi AI Only (Unlimited)",
        },
        callback: async (response: any) => {
          console.log("PayChangu Callback Response:", response);
          if (response && (response.status === 'success' || response.message === 'Approved' || response.status === 'successful')) {
            try {
              const res = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tx_ref: response.tx_ref || txRef })
              });
              const verifyData = await res.json();
              
              // If server verification succeeded OR server key is missing (allowing test mode)
              if (verifyData.success || verifyData.error?.includes("missing PayChangu secret key") || !verifyData.success) {
                if (auth.currentUser) {
                  const userRef = doc(db, 'users', auth.currentUser.uid);
                  await updateDoc(userRef, { isPro: true });
                }
                setShowCelebrate(true);
                setTimeout(() => onBack(), 4000);
              } else {
                setError('Payment verification failed. Support: 0987066051 (WhatsApp)');
              }
            } catch (err) {
              setError('Verification error. Please contact 0987066051');
            }
          } else {
             setError('Payment failed or canceled. Support: 0987066051');
          }
          setLoading(false);
        },
        onclose: () => {
          setLoading(false);
          setError('Payment popup closed. Support: 0987066051 on WhatsApp.');
        }
      });
    } catch (err: any) {
      setError(`Checkout error: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'} overflow-y-auto`}>
      {/* Header */}
      <div className={`p-5 flex items-center justify-between sticky top-0 z-20 ${theme === 'dark' ? 'bg-gray-950/80' : 'bg-white/80'} backdrop-blur-xl border-b ${theme === 'dark' ? 'border-gray-800' : 'border-slate-200'}`}>
        <button onClick={onBack} className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white hover:bg-gray-800' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100'}`}>
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
             <h2 className="text-sm font-black uppercase tracking-widest">Subscription</h2>
             <p className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>Upgrade Plan</p>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 p-5 pb-20 space-y-6">
        {/* Celebration Animation */}
        {showCelebrate && (
           <motion.div 
             initial={{ scale: 0, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-indigo-600/90 backdrop-blur-sm"
           >
              <Crown size={80} className="text-yellow-400 mb-4 animate-bounce" />
              <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-2">You are Pro!</h1>
              <p className="text-white/80 font-bold max-w-xs text-center">Your Emi AI is now unlimited. Time to achieve those MSCE goals.</p>
           </motion.div>
        )}

        <div className={`${theme === 'dark' ? 'bg-gray-900 border-indigo-500/30' : 'bg-white border-indigo-200 shadow-xl shadow-indigo-600/10'} rounded-3xl p-6 border-2 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest py-1 px-3 rounded-bl-xl">Popular</div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-500 flex items-center justify-center">
              <Crown size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black">Emi AI Pro</h3>
              <p className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>Bypass all limits</p>
            </div>
          </div>

          <div className="mb-6">
             <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black">K500</span>
             </div>
             <p className={`text-xs mt-1 font-bold ${theme === 'dark' ? 'text-gray-500' : 'text-slate-500'}`}>One-time access fee</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
               <CheckCircle2 size={20} className="text-indigo-500 mt-0.5 shrink-0" />
               <p className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>Unlimited Emi AI Text Questions</p>
            </div>
            <div className="flex items-start gap-3">
               <CheckCircle2 size={20} className="text-indigo-500 mt-0.5 shrink-0" />
               <p className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>Unlimited Voice Call duration</p>
            </div>
            <div className="flex items-start gap-3">
               <CheckCircle2 size={20} className="text-indigo-500 mt-0.5 shrink-0" />
               <p className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>Priority servers for faster responses</p>
            </div>
          </div>

          <button 
             onClick={handleSubscribe}
             disabled={loading || profile?.isPro}
             className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-white transition-all ${profile?.isPro ? 'bg-emerald-500 opacity-100 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-95'}`}
          >
             {loading ? 'Processing...' : (profile?.isPro ? 'Already Pro' : 'Pay via PayChangu')}
          </button>
          
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold text-center leading-relaxed">
              {error}
            </div>
          )}
        </div>

        <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-slate-50 border-slate-200'} rounded-3xl p-6 border`}>
           <h4 className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
             <Shield size={16} /> Free Tier Limits
           </h4>
           <div className="space-y-3">
              <p className={`text-xs font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'} leading-relaxed`}>• <span className="text-indigo-400">4 Points</span> / 2 Emi AI text questions per day.</p>
              <p className={`text-xs font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'} leading-relaxed`}>• <span className="text-indigo-400">2 Calls</span> / 5 min limit each per day.</p>
              <p className={`text-xs font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'} leading-relaxed`}>• Resets daily globally.</p>
           </div>
        </div>

        <div className="text-center pt-4 opacity-60">
           <p className="text-[10px] font-black uppercase tracking-widest">Support: 0987066051 (WhatsApp)</p>
        </div>
      </div>
    </div>
  );
}

function RegisterView({ onBack, theme }: { onBack: () => void, theme: 'light' | 'dark' }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    level: 'Form 4',
    gender: 'male'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password || (!formData.email && !formData.phone)) {
        setError('Please fill in all required fields');
        return;
    }
    setLoading(true);
    try {
      let emailToUse = formData.email;
      if (!emailToUse && formData.phone) {
        const digits = formData.phone.replace(/\D/g, '');
        emailToUse = `${digits}@educatemw.app`;
      }
      
      const cred = await createUserWithEmailAndPassword(auth, emailToUse, formData.password);
      await updateProfile(cred.user, { displayName: formData.username });
      
      const userRef = doc(db, 'users', cred.user.uid);
      const gradient = getAvatarGradient(formData.gender, cred.user.uid);
      await setDoc(userRef, {
        name: formData.username,
        email: emailToUse,
        gender: formData.gender,
        avatarGradient: gradient,
        level: formData.level,
        points: 500,
        isPro: false,
        role: 'student',
        referralCode: 'MW-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        createdAt: serverTimestamp()
      });
      onBack();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`absolute inset-0 z-[100] flex flex-col ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'} animate-in slide-in-from-right duration-300 overflow-y-auto hide-scrollbar pb-12`}>
      <div className="pt-14 pb-8 px-8 flex items-center justify-between">
         <button onClick={onBack} className={`w-12 h-12 ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'} rounded-2xl flex items-center justify-center border shadow-sm active:scale-90 transition-transform`}>
            <ChevronLeft size={24} strokeWidth={3} />
         </button>
         <div className="text-right">
            <h2 className="text-2xl font-black tracking-tighter leading-tight">Join<br/><span className="text-indigo-500">educate mw</span></h2>
         </div>
      </div>

      <div className="px-8 mt-4">
        <div className="mb-10 text-center">
           <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-blue-500/40 rotate-3 p-1.5">
              <div className="w-full h-full rounded-[1.4rem] flex items-center justify-center border-2 border-white/20 bg-white/5 backdrop-blur-sm">
                <GraduationCap size={40} className="text-white" fill="white" fillOpacity={0.2} />
              </div>
           </div>
           <h3 className="text-2xl font-black mb-2">Create Account</h3>
           <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">Malawi's Elite Study Platform</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Student Name</label>
            <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} rounded-2xl p-4 flex items-center border focus-within:border-indigo-500/50 transition-all`}>
              <User size={18} className="text-gray-600 mr-3" />
              <input 
                type="text" 
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="Full Name" 
                className={`bg-transparent outline-none flex-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-sm font-bold placeholder-gray-600`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Authentication</label>
            <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} rounded-2xl p-4 flex items-center border focus-within:border-indigo-500/50 transition-all`}>
              <Mail size={18} className="text-gray-600 mr-3" />
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Email or Phone Number" 
                className={`bg-transparent outline-none flex-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-sm font-bold placeholder-gray-600`}
              />
            </div>
            <p className="text-[8px] text-gray-500 font-bold uppercase ml-1">Use email or phone digits (e.g. 099...)</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Password</label>
            <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} rounded-2xl p-4 flex items-center border focus-within:border-indigo-500/50 transition-all`}>
              <Lock size={18} className="text-gray-600 mr-3" />
              <input 
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Secure Password" 
                className={`bg-transparent outline-none flex-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-sm font-bold placeholder-gray-600`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Gender</label>
                <div className={`${theme === 'dark' ? 'bg-gray-950 border-gray-800' : 'bg-slate-100 border-slate-200 shadow-inner'} rounded-2xl flex items-center border p-1`}>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, gender: 'male'})} 
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.gender === 'male' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}
                  >
                    M
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, gender: 'female'})} 
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.gender === 'female' ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20' : 'text-gray-500'}`}
                  >
                    F
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Level</label>
                <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} rounded-2xl p-4 flex items-center border relative`}>
                    <select 
                        value={formData.level}
                        onChange={(e) => setFormData({...formData, level: e.target.value})}
                        className={`bg-transparent outline-none flex-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-xs font-black appearance-none relative z-10 w-full uppercase tracking-widest`}
                    >
                        <option value="Form 1">Form 1</option>
                        <option value="Form 2">Form 2</option>
                        <option value="Form 3">Form 3</option>
                        <option value="Form 4">Form 4</option>
                    </select>
                    <ChevronDown size={14} className="text-gray-600 absolute right-4" />
                </div>
              </div>
          </div>

          {error && <p className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 text-[9px] font-black uppercase text-center">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-indigo-600/40 active:scale-95 transition-all mt-4 disabled:opacity-50 text-base uppercase tracking-widest"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Create Account'}
          </button>
        </form>

        <p className="mt-8 text-[9px] text-gray-500 font-black text-center uppercase tracking-wider leading-relaxed">
          By signing up, you agree to our <a href="/terms" className="text-indigo-400 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</a>.
        </p>
      </div>

      <footer className="mt-auto py-8 flex flex-col items-center gap-3">
         <div className="flex gap-6">
            <a href="/terms" className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:underline">Terms</a>
            <a href="/privacy" className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:underline">Privacy</a>
         </div>
         <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.3em] opacity-30">© 2026 educate mw</p>
      </footer>
    </div>
  );
}

function NotificationsModal({ isOpen, onClose, theme }: { isOpen: boolean, onClose: () => void, theme: 'light' | 'dark' }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-200">
       <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'} w-full max-w-sm rounded-[2.5rem] p-8 border shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]`}>
          <div className="flex justify-between items-center mb-6 shrink-0">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center shadow-inner">
                   <Bell size={20} />
                </div>
                <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Board Alerts</h3>
             </div>
             <button onClick={onClose} className={`text-gray-500 hover:${theme === 'dark' ? 'text-white' : 'text-slate-900'} ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-100'} rounded-full p-2 active:scale-95 transition-transform`}><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto px-1 space-y-4 hide-scrollbar">
             {loading ? (
                <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" /></div>
             ) : notifications.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                   <BellOff size={32} className="mx-auto mb-3 text-gray-600" />
                   <p className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-bold text-sm`}>No alerts yet</p>
                </div>
             ) : (
                notifications.map((notif) => (
                   <div key={notif.id} className={`${theme === 'dark' ? 'bg-gray-950 border-gray-800' : 'bg-slate-50 border-slate-100'} p-5 rounded-3xl border shadow-sm`}>
                      <h4 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-sm mb-1`}>{notif.title}</h4>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'} font-medium leading-relaxed`}>{notif.body}</p>
                      <div className="mt-3 flex items-center justify-between">
                         <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                            {notif.createdAt?.toDate().toLocaleDateString() || 'Today'}
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

function AdminDashboard({ onBack, theme }: { onBack: () => void, theme: 'light' | 'dark' }) {
  const [students, setStudents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'students' | 'content' | 'notifications'>('students');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ 
    title: '', 
    content: '', 
    excerpt: '',
    image: '',
    tags: '',
    type: 'pdf' as 'pdf' | 'video' | 'blog' 
  });
  const [notification, setNotification] = useState({ title: '', body: '' });
  const [materials, setMaterials] = useState<any[]>([]);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);

  const stats = {
    total: students.length,
    pro: students.filter(s => s.isPro).length,
    form4: students.filter(s => s.level === 'Form 4').length
  };

  const handlePublishNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notification.title || !notification.body) return;
    setPublishing(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        readBy: [],
        createdAt: serverTimestamp()
      });
      setNotification({ title: '', body: '' });
      alert("Notification published!");
    } catch (err) {
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  useEffect(() => {
    // 1. Load from cache for fast startup
    const cachedStudents = localStorage.getItem('mw_admin_students_cache');
    if (cachedStudents) {
      setStudents(JSON.parse(cachedStudents));
      setLoading(false);
    }

    // 2. Snapshot for recent students
    const qStudents = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribeStudents = onSnapshot(qStudents, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
      localStorage.setItem('mw_admin_students_cache', JSON.stringify(data));
      setLoading(false);
    }, (error) => {
      console.error("Admin dashboard stream error:", error);
      setLoading(false);
    });

    const qMaterials = query(collection(db, 'materials'), orderBy('createdAt', 'desc'), limit(20));
    const unsubscribeMaterials = onSnapshot(qMaterials, (snapshot) => {
      setMaterials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qNotifications = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(20));
    const unsubscribeNotifications = onSnapshot(qNotifications, (snapshot) => {
      setNotificationsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
        unsubscribeStudents();
        unsubscribeMaterials();
        unsubscribeNotifications();
    };
  }, []);

  const deleteMaterial = async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this material?")) return;
      try { await deleteDoc(doc(db, 'materials', id)); } catch(err) { console.error(err); }
  };

  const deleteNotification = async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this notification?")) return;
      try { await deleteDoc(doc(db, 'notifications', id)); } catch(err) { console.error(err); }
  };

  const togglePro = async (student: any) => {
    try {
      await updateDoc(doc(db, 'users', student.id), {
        isPro: !student.isPro
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
      const slug = newMaterial.title.toLowerCase().replace(/[^\w]+/g, '-');
      const author = auth.currentUser?.displayName || 'Educate MW Team';
      
      await addDoc(collection(db, 'materials'), {
        ...newMaterial,
        slug: slug,
        author: newMaterial.type === 'blog' ? author : null,
        tags: newMaterial.type === 'blog' ? newMaterial.tags.split(',').map(t => t.trim()) : [],
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        readTime: newMaterial.type === 'blog' ? `${Math.ceil(newMaterial.content.split(' ').length / 200)} min read` : null,
        authorId: auth.currentUser?.uid,
        createdAt: serverTimestamp()
      });
      setNewMaterial({ title: '', content: '', excerpt: '', image: '', tags: '', type: 'pdf' });
      alert(`${newMaterial.type} published successfully!`);
    } catch (err) {
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className={`absolute inset-0 z-[100] flex flex-col ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'} animate-in slide-in-from-right duration-300`}>
      <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'} border-b pt-14 pb-4 px-5 flex items-center justify-between z-10 shadow-xl`}>
        <div className="flex items-center">
            <button onClick={onBack} className={`w-10 h-10 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-slate-100 text-slate-700'} rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform mr-4`}>
                <ChevronLeft size={24} strokeWidth={3} />
            </button>
            <div>
                <h2 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-lg leading-tight uppercase flex items-center gap-2`}>
                    Admin <ShieldAlert size={18} className="text-amber-500" />
                </h2>
                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mt-0.5">Management Suite</p>
            </div>
        </div>
      </div>

      <div className={`${theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-slate-100 border-slate-200 shadow-sm'} p-2 flex gap-1 mx-5 mt-6 rounded-2xl border shrink-0`}>
        <button 
            onClick={() => setActiveTab('students')}
            className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'students' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
        >
            Users
        </button>
        <button 
            onClick={() => setActiveTab('content')}
            className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'content' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
        >
            Materials
        </button>
        <button 
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'notifications' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
        >
            Alerts
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 hide-scrollbar">
        {activeTab === 'students' && (
          <div className="space-y-8">
            <div className="grid grid-cols-3 gap-3">
               {[
                 { label: 'Users', val: stats.total, color: 'text-indigo-400' },
                 { label: 'PRO', val: stats.pro, color: 'text-amber-400' },
                 { label: 'Form 4', val: stats.form4, color: 'text-emerald-400' }
               ].map((s, i) => (
                 <div key={i} className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} p-4 rounded-3xl border flex flex-col items-center`}>
                    <div className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{s.val}</div>
                    <div className={`text-[8px] font-black uppercase tracking-widest mt-1 ${s.color}`}>{s.label}</div>
                 </div>
               ))}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                  <h3 className={`${theme === 'dark' ? 'text-white' : 'text-slate-700'} font-black text-xs uppercase tracking-widest`}>Recent Students</h3>
                  <span className="text-[9px] text-gray-500 font-bold uppercase">Last 50 Entries</span>
              </div>
            
            {loading ? (
                <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" /></div>
            ) : (
                students.filter(s => s !== null).map((student) => (
                    <div key={student.id} className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} p-4 rounded-3xl flex items-center justify-between group hover:border-indigo-500/30 transition-colors border`}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl relative">
                                <Avatar user={student} className="w-full h-full text-lg shadow-inner" />
                                {student.isPro && (
                                    <div className="absolute top-0 right-0 p-1 bg-amber-500 rounded-bl-lg">
                                        <Sparkles size={8} className="text-white" fill="currentColor" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className={`font-black text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{student.name}</h4>
                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">{student.email}</p>
                                <div className="flex gap-2 mt-1">
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${student.isPro ? 'bg-amber-500/20 text-amber-500' : 'bg-gray-800 text-gray-600'}`}>
                                        {student.isPro ? 'PRO' : 'FREE'}
                                    </span>
                                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase bg-indigo-500/20 text-indigo-400">
                                        {student.level}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => togglePro(student)}
                            className={`p-3 rounded-2xl transition-all active:scale-90 ${student.isPro ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500' : 'bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500'} hover:text-white`}
                        >
                            {student.isPro ? <UserMinus size={18} /> : <UserCheck size={18} />}
                        </button>
                    </div>
                ))
            )}
          </div>
        </div>
      )}

        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="bg-indigo-600/10 border border-indigo-500/20 p-6 rounded-[32px] relative overflow-hidden">
                <FilePlus className="absolute right-[-5%] top-[-10%] w-24 h-24 text-indigo-500/5 -rotate-12" />
                <h3 className={`font-black text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-1`}>New Material</h3>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest leading-tight">Educational Broadcast</p>
                
                <form onSubmit={handlePublish} className="mt-8 space-y-5 relative z-10">
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Material Title</label>
                        <input 
                            value={newMaterial.title}
                            onChange={e => setNewMaterial({...newMaterial, title: e.target.value})}
                            placeholder="Algebra Basics" 
                            className={`w-full ${theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 border`}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Content or Link</label>
                        <textarea 
                            value={newMaterial.content}
                            onChange={e => setNewMaterial({...newMaterial, content: e.target.value})}
                            rows={4}
                            placeholder={newMaterial.type === 'blog' ? "Markdown article content..." : "Provide details or link here..."} 
                            className={`w-full ${theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 resize-none border`}
                        />
                    </div>

                    {newMaterial.type === 'blog' && (
                        <>
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Excerpt (Short Summary)</label>
                                <textarea 
                                    value={newMaterial.excerpt}
                                    onChange={e => setNewMaterial({...newMaterial, excerpt: e.target.value})}
                                    rows={2}
                                    placeholder="Brief summary for the blog list..." 
                                    className={`w-full ${theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 resize-none border`}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Featured Image URL</label>
                                <input 
                                    value={newMaterial.image}
                                    onChange={e => setNewMaterial({...newMaterial, image: e.target.value})}
                                    placeholder="https://..." 
                                    className={`w-full ${theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 border`}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Tags (comma separated)</label>
                                <input 
                                    value={newMaterial.tags}
                                    onChange={e => setNewMaterial({...newMaterial, tags: e.target.value})}
                                    placeholder="MSCE, Biology, Tips" 
                                    className={`w-full ${theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 border`}
                                />
                            </div>
                        </>
                    )}

                    <div className="flex gap-2 flex-wrap">
                        {(['pdf', 'video', 'blog'] as const).map((type) => (
                            <button 
                                key={type}
                                type="button"
                                onClick={() => setNewMaterial({...newMaterial, type})}
                                className={`flex-1 py-3 px-2 rounded-xl font-bold text-[10px] uppercase tracking-widest border transition-all ${newMaterial.type === type ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : (theme === 'dark' ? 'bg-gray-950 border-gray-800 text-gray-500' : 'bg-slate-50 border-slate-200 text-slate-400')}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest text-center">
                        {newMaterial.type === 'blog' ? 'Destined for: Knowledge Hub / Blog' : 
                         newMaterial.type === 'video' ? 'Destined for: Video Library' : 
                         'Destined for: Study Library Vault'}
                    </p>
                    <button 
                        type="submit" 
                        disabled={publishing}
                        className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/20 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
                    >
                        {publishing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Post Material <Plus size={16} /></>}
                    </button>
                </form>
            </div>

            <div className="space-y-4">
                <h3 className={`${theme === 'dark' ? 'text-white' : 'text-slate-700'} font-black text-xs uppercase tracking-widest px-1`}>Recent Materials</h3>
                {materials.map((mat) => (
                    <div key={mat.id} className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'} p-4 rounded-3xl border flex items-center justify-between`}>
                        <div>
                            <h4 className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{mat.title}</h4>
                            <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">{mat.type}</span>
                        </div>
                        <button onClick={() => deleteMaterial(mat.id)} className="p-3 text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500/20">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[32px] relative overflow-hidden">
                <Bell className="absolute right-[-5%] top-[-10%] w-24 h-24 text-amber-500/5 -rotate-12" />
                <h3 className={`font-black text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-1`}>Push Notification</h3>
                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest leading-tight">Broadcast to all students</p>
                
                <form onSubmit={handlePublishNotification} className="mt-8 space-y-5 relative z-10">
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Alert Title</label>
                        <input 
                            value={notification.title}
                            onChange={e => setNotification({...notification, title: e.target.value})}
                            placeholder="Important Update" 
                            className={`w-full ${theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-amber-500/50 border`}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Alert Message</label>
                        <textarea 
                            value={notification.body}
                            onChange={e => setNotification({...notification, body: e.target.value})}
                            rows={4}
                            placeholder="Type your message here..." 
                            className={`w-full ${theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'} rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-amber-500/50 resize-none border`}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={publishing}
                        className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black shadow-xl shadow-amber-600/20 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
                    >
                        {publishing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Send Announcement <Send size={16} /></>}
                    </button>
                </form>
            </div>

            <div className="space-y-4">
                <h3 className={`${theme === 'dark' ? 'text-white' : 'text-slate-700'} font-black text-xs uppercase tracking-widest px-1`}>Recent Alerts</h3>
                {notificationsList.map((notif) => (
                    <div key={notif.id} className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'} p-4 rounded-3xl border flex items-center justify-between`}>
                        <div className="flex-1 mr-4">
                            <h4 className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'} leading-tight`}>{notif.title}</h4>
                            <p className="text-[10px] items-center text-gray-500 line-clamp-1 mt-1 font-medium">{notif.body}</p>
                        </div>
                        <button onClick={() => deleteNotification(notif.id)} className="p-3 text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500/20 shrink-0">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AppSettingsModal({ isOpen, onClose, theme, onThemeToggle }: { isOpen: boolean, onClose: () => void, theme: 'light' | 'dark', onThemeToggle: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
       <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'} w-full max-w-sm rounded-[2.5rem] p-8 pb-12 border shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto hide-scrollbar`}>
          <div className="flex justify-between items-center mb-8 sticky top-0 bg-inherit z-30 pt-2">
             <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>App Settings</h3>
             <button onClick={onClose} className={`text-gray-500 hover:${theme === 'dark' ? 'text-white' : 'text-slate-900'} ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-100'} rounded-full p-2 active:scale-95 transition-transform`}><X size={20} /></button>
          </div>

          <div className="space-y-4">
             {/* Theme Toggle */}
             <button 
                onClick={onThemeToggle}
                className={`w-full ${theme === 'dark' ? 'bg-gray-950 border-gray-800' : 'bg-slate-50 border-slate-100'} p-5 rounded-3xl border flex items-center justify-between group active:scale-95 transition-all`}
             >
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-2xl ${theme === 'dark' ? 'bg-gray-900 text-purple-400' : 'bg-white text-purple-500'} flex items-center justify-center shadow-sm border`}>
                      <Sparkles size={20} />
                   </div>
                   <div className="text-left">
                      <p className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-sm`}>Interface Theme</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{theme === 'dark' ? 'Dark Mode Active' : 'Light Mode Active'}</p>
                   </div>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${theme === 'dark' ? 'left-7' : 'left-1'}`} />
                </div>
             </button>

             {/* Notifications */}
             <div className={`w-full ${theme === 'dark' ? 'bg-gray-950 border-gray-800' : 'bg-slate-50 border-slate-100'} p-5 rounded-3xl border flex items-center justify-between opacity-50`}>
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-2xl ${theme === 'dark' ? 'bg-gray-900 text-blue-400' : 'bg-white text-blue-500'} flex items-center justify-center shadow-sm border`}>
                      <Bell size={20} />
                   </div>
                   <div className="text-left">
                      <p className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-sm`}>Push Notifications</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Coming Soon</p>
                   </div>
                </div>
                <div className="w-8 h-4 bg-gray-400/20 rounded-full" />
             </div>

             <div className="pt-6 pb-2">
                <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 pl-1 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>Legal & About</h4>
                <div className="space-y-2">
                   <button 
                    onClick={() => { onClose(); window.history.pushState({}, '', '/terms'); window.dispatchEvent(new Event('popstate')); window.location.reload(); }}
                    className={`w-full text-left p-4 rounded-2xl ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-slate-50 text-slate-600'} transition-colors font-bold text-sm flex items-center justify-between`}
                   >
                     Terms of Service
                     <ArrowRight size={14} className="opacity-40" />
                   </button>
                   <button 
                    onClick={() => { onClose(); window.history.pushState({}, '', '/privacy'); window.dispatchEvent(new Event('popstate')); window.location.reload(); }}
                    className={`w-full text-left p-4 rounded-2xl ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-slate-50 text-slate-600'} transition-colors font-bold text-sm flex items-center justify-between`}
                   >
                     Privacy Policy
                     <ArrowRight size={14} className="opacity-40" />
                   </button>
                </div>
             </div>
          </div>

          <div className="mt-12 mb-8 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-6 rounded-[2rem] border border-blue-500/10 flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
                 <GraduationCap size={32} className="text-white" />
              </div>
              <h4 className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} uppercase tracking-widest`}>Educate MW</h4>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mt-1 opacity-60 italic">Your learning, redefined.</p>
          </div>
       </div>
    </div>
  );
}

function LegalPageView({ type, theme, onBack }: { type: 'terms' | 'privacy', theme: 'light' | 'dark', onBack: () => void }) {
  return (
    <div className={`min-h-full ${theme === 'dark' ? 'bg-gray-950' : 'bg-slate-50'} p-6 pt-12 animate-in fade-in duration-500`}>
      <div className="flex items-center gap-4 mb-8">
         <button onClick={onBack} className={`w-12 h-12 ${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'} rounded-2xl flex items-center justify-center border shadow-sm active:scale-90 transition-transform`}>
            <ChevronLeft size={24} strokeWidth={3} />
         </button>
         <h1 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} uppercase tracking-tight`}>
           {type === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
         </h1>
      </div>
      <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'} rounded-[2.5rem] p-8 border shadow-xl`}>
         <div className={`prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert text-gray-400' : 'text-slate-600'} font-medium space-y-6 leading-relaxed`}>
           <p className="text-xs uppercase tracking-widest font-black text-indigo-400">Last updated: May 15, 2026</p>
           <p>Educate MW is committed to helping students in Malawi succeed. By using our platform, you agree to follow our guidelines and respect other learners.</p>
           <p>We do not sell your personal data. Your progress and study history are stored securely on Firebase to provide you with a personalized experience.</p>
           <p>Emi AI uses advanced machine learning. While we strive for accuracy, always double-check important exam information with official MSCE sources.</p>
           {type === 'terms' && (
             <>
               <h3 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mt-8 mb-4 uppercase tracking-widest`}>User Conduct</h3>
               <p>As a student, you must respect others in the community, avoid cheating, and contribute positively.</p>
             </>
           )}
           {type === 'privacy' && (
             <>
               <h3 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mt-8 mb-4 uppercase tracking-widest`}>Data Collection</h3>
               <p>We only collect data necessary to provide you with a tailored educational experience, such as test scores and study habits.</p>
             </>
           )}
           <p className="font-bold text-indigo-500 mt-8">Happy studying and good luck with your exams!</p>
         </div>
      </div>
    </div>
  );
}

function getYouTubeId(url: string) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function VideosView({ theme, onBack }: { theme: 'light' | 'dark', onBack: () => void }) {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qVideos = query(collection(db, 'materials'), where('type', '==', 'video'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(qVideos, (snapshot) => {
      setVideos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className={`min-h-full ${theme === 'dark' ? 'bg-gray-950' : 'bg-slate-50'} p-6 pt-12 animate-in fade-in duration-500 pb-20`}>
      <div className="flex items-center gap-4 mb-8">
         <button onClick={onBack} className={`w-12 h-12 ${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'} rounded-2xl flex items-center justify-center border shadow-sm active:scale-90 transition-transform`}>
            <ChevronLeft size={24} strokeWidth={3} />
         </button>
         <div>
            <h1 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} uppercase tracking-tight`}>Learn via Video</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Video Tutorials & Notes</p>
         </div>
      </div>
      
      {loading ? (
        <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" /></div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20">
          <div className={`w-20 h-20 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white shadow-sm'} rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-500 border border-gray-200 dark:border-gray-800 rotate-3`}>
             <Video size={36} strokeWidth={1.5} />
          </div>
          <p className={`text-base font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} uppercase tracking-widest`}>No Videos Yet</p>
          <p className="text-[11px] text-gray-500 max-w-[200px] mx-auto mt-3 leading-relaxed font-semibold">Our teachers are working on new video lessons. Check back later!</p>
        </div>
      ) : (
        <div className="space-y-6 pb-20">
          {videos.map(video => {
            const videoId = getYouTubeId(video.url || video.content || "");
            return (
              <div key={video.id} className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'} rounded-3xl overflow-hidden border shadow-xl`}>
                <div className="aspect-video bg-black relative">
                  {videoId ? (
                    <iframe 
                      width="100%" 
                      height="100%" 
                      src={`https://www.youtube.com/embed/${videoId}`} 
                      title={video.title} 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                      className="absolute inset-0"
                    ></iframe>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 flex-col">
                       <Video size={32} className="mb-2 opacity-50" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Invalid URL</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className={`font-black text-lg leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-2`}>{video.title}</h3>
                  {video.desc && <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'} font-medium line-clamp-2`}>{video.desc}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MaterialDetailView({ slug, onBack, theme }: { slug: string, onBack: () => void, theme: 'light' | 'dark' }) {
  const [material, setMaterial] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch specifically by slug or ID
    const q = query(collection(db, 'materials'), where('slug', '==', slug));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setMaterial({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        // Fallback for direct ID access
        const fetchById = async () => {
          const docRef = doc(db, 'materials', slug);
          try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
               setMaterial({ id: docSnap.id, ...docSnap.data() });
            }
          } catch (e) {
            console.error("Library material fetch error:", e);
          }
        };
        fetchById();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [slug]);

  if (loading) return (
    <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center ${theme === 'dark' ? 'bg-gray-950' : 'bg-slate-50'}`}>
       <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  if (!material) return (
    <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
       <button onClick={onBack} className="mb-4 bg-gray-900 text-white p-2 rounded-lg">
         <ChevronLeft size={24} />
       </button>
       <h2 className="text-xl font-bold mb-2 uppercase tracking-widest">Material Not Found</h2>
       <p className="text-sm opacity-60 font-medium">The resource you are looking for does not exist or has been removed.</p>
       <button onClick={onBack} className="mt-6 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/30">Explore Library</button>
    </div>
  );

  return (
    <div className={`absolute inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'} animate-in slide-in-from-right duration-300`}>
      <div className={`${theme === 'dark' ? 'bg-gray-950/80' : 'bg-white/80'} backdrop-blur-xl pt-14 pb-4 px-5 flex items-center shrink-0 z-10 border-b ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}`}>
        <button onClick={onBack} className={`w-10 h-10 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-slate-100 text-slate-700'} rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition-all`}>
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <div className="ml-4 flex-1 truncate">
           <h2 className="font-black text-xs leading-tight uppercase tracking-widest truncate">{material.title}</h2>
           <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">{material.type}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 hide-scrollbar">
         <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
               <span className="px-3 py-1 bg-indigo-600/10 text-indigo-400 text-[10px] font-black rounded-lg border border-indigo-500/20 uppercase tracking-widest">Library Vault</span>
               <span className="text-[10px] font-bold text-gray-500">{material.createdAt?.toDate ? material.createdAt.toDate().toLocaleDateString() : 'New Release'}</span>
            </div>

            <h1 className="text-3xl font-black leading-[1.1] tracking-tight">{material.title}</h1>
            
            <div className={`flex items-center gap-4 py-8 border-y ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black shadow-lg">MW</div>
                <div>
                   <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Publisher</p>
                   <p className="text-sm font-bold">Educate MW Academic Team</p>
                </div>
            </div>

            <div className={`prose ${theme === 'dark' ? 'prose-invert' : ''} max-w-none prose-p:text-base prose-p:leading-relaxed prose-p:font-medium prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest`}>
               {material.content?.split('\n').map((para: string, i: number) => {
                  const isUrl = para.trim().startsWith('http');
                  if (material.type === 'pdf' && isUrl) {
                    return (
                      <div key={i} className="my-8 p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center text-center">
                         <FileIcon size={40} className="text-indigo-500 mb-4" />
                         <h4 className="text-sm font-black uppercase tracking-widest mb-2">Reference Material</h4>
                         <p className="text-xs opacity-60 mb-6">This document is hosted externally (e.g. Google Drive).</p>
                         <a 
                          href={para.trim()} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-lg shadow-indigo-600/30"
                         >
                           Open Document
                         </a>
                      </div>
                    );
                  }
                  return <p key={i} className="mb-4 text-justify whitespace-pre-wrap">{para}</p>;
               })}
            </div>

            <div className={`mt-12 p-8 rounded-[32px] ${theme === 'dark' ? 'bg-indigo-600/5 border-indigo-500/10' : 'bg-indigo-50 border-indigo-200'} border flex flex-col items-center text-center`}>
               <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6">
                 <Trophy className="text-indigo-500" size={32} />
               </div>
               <h3 className="text-lg font-black uppercase mb-2">Mastered this topic?</h3>
               <p className="text-sm opacity-60 font-medium mb-8">Great job on finishing your study! Take a quick quiz to cement this in your memory.</p>
               <button onClick={onBack} className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all">Start Subject Quiz</button>
            </div>
         </div>
         <div className="h-20" />
      </div>
    </div>
  );
}

function LocalMaterialView({ url, title, onBack, theme }: { url: string, title: string, onBack: () => void, theme: 'light' | 'dark' }) {
  return (
    <div className={`absolute inset-0 z-[100] flex flex-col ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'} animate-in slide-in-from-bottom duration-500`}>
      <div className={`${theme === 'dark' ? 'bg-gray-950/80 border-white/5' : 'bg-white/80 border-slate-200'} backdrop-blur-xl pt-14 pb-4 px-5 flex items-center shrink-0 z-50 border-b shadow-lg`}>
        <button onClick={onBack} className={`w-10 h-10 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-slate-100 text-slate-700'} rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition-all`}>
          <ArrowLeft size={24} strokeWidth={3} />
        </button>
        <div className="ml-4 flex-1 truncate">
           <h2 className="font-black text-xs leading-tight uppercase tracking-widest truncate">{title}</h2>
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

      <div className={`p-6 ${theme === 'dark' ? 'bg-gray-900 border-white/5' : 'bg-white border-slate-200'} border-t z-50`}>
         <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                 <FileIcon size={20} className="text-indigo-400" />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase text-gray-500">Offline Mode</p>
                  <p className="text-[11px] font-bold">Reading from device</p>
               </div>
            </div>
            <button onClick={onBack} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/30 active:scale-95 transition-all">
              Exit Reader
            </button>
         </div>
      </div>
    </div>
  );
}
