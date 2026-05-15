/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
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
  limit
} from 'firebase/firestore';
import { auth, db, googleProvider } from './lib/firebase';
import {
  Menu,
  GraduationCap,
  Flame,
  Bell,
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
  Home,
  Book,
  HelpCircle,
  User,
  ChevronRight,
  MessageSquareText,
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
  Key,
  Languages,
  LayoutDashboard,
  ShieldAlert,
  UserCheck,
  UserMinus,
  FilePlus,
  Eye,
  Settings,
  CreditCard,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';

export type ViewState = 'home' | 'emi' | 'library' | 'dictionary' | 'quizzes' | 'flashcards' | 'community' | 'profile' | 'auth' | 'register' | 'admin';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const adminEmails = ['petedianotech@gmail.com', 'mscepreparation@gmail.com'];

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
            setUserProfile(userDoc.data());
          } else {
            const newProfile = {
              name: firebaseUser.displayName || 'Student',
              email: firebaseUser.email,
              avatar: firebaseUser.photoURL || `https://api.dicebear.com/9.x/notionists/svg?seed=${firebaseUser.uid}&gesture=ok`,
              level: 'Form 4',
              points: 500,
              isPro: false,
              role: adminEmails.includes(firebaseUser.email || '') ? 'admin' : 'student',
              referralCode: 'MW-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
              createdAt: serverTimestamp()
            };
            await setDoc(userRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (err) {
          console.error("Error loading profile:", err);
          setUserProfile({ name: firebaseUser.displayName || 'Student', email: firebaseUser.email, level: 'Form 4', points: 0 });
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
    setCurrentView('home');
  };

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-slate-50 text-slate-930'} min-h-screen flex justify-center font-sans selection:bg-indigo-900/30 selection:text-indigo-100`}>
      <div className={`w-full max-w-md h-[100dvh] ${theme === 'dark' ? 'bg-gray-900 sm:border-gray-800' : 'bg-white sm:border-slate-200'} shadow-2xl relative overflow-hidden flex flex-col sm:border-x`}>
        
        {!isOnline && (
          <div className="absolute top-0 left-0 right-0 z-[110] bg-amber-500 text-gray-950 text-[10px] font-black py-1 px-4 text-center uppercase tracking-widest flex items-center justify-center gap-2">
            <Wifi size={12} strokeWidth={3} /> Offline Mode Active
          </div>
        )}

        {/* Scrollable Main Content */}
        <div className={`flex-1 overflow-x-hidden overflow-y-auto hide-scrollbar ${theme === 'dark' ? 'bg-gray-950' : 'bg-slate-50'}`}>
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center">
              <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
              <p className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Loading Education...</p>
            </div>
          ) : !isLoggedIn ? (
            currentView === 'register' ? (
              <RegisterView 
                onBack={() => setCurrentView('home')} 
              />
            ) : (
              <AuthView 
                onNavigateRegister={() => setCurrentView('register')}
              />
            )
          ) : (
            <>
              {currentView === 'home' && <HomeView onNavigate={setCurrentView} onMenuClick={() => setIsSidebarOpen(true)} profile={userProfile} />}
              {currentView === 'emi' && <EmiChatView onBack={() => setCurrentView('home')} />}
              {currentView === 'library' && <LibraryView onBack={() => setCurrentView('home')} />}
              {currentView === 'dictionary' && <DictionaryView onBack={() => setCurrentView('home')} />}
              {currentView === 'quizzes' && <QuizzesView onBack={() => setCurrentView('home')} />}
              {currentView === 'flashcards' && <FlashcardsView onBack={() => setCurrentView('home')} />}
              {currentView === 'community' && <CommunityView onBack={() => setCurrentView('home')} />}
              {currentView === 'admin' && isAdmin && <AdminDashboard onBack={() => setCurrentView('home')} />}
              {currentView === 'profile' && (
                <ProfileView 
                  onBack={() => setCurrentView('home')} 
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
                />
              )}
            </>
          )}
        </div>

        {/* Bottom Navigation */}
        {isLoggedIn && !['emi', 'dictionary', 'flashcards', 'community', 'admin'].includes(currentView) && (
          <div className="absolute bottom-0 w-full left-0 right-0 z-[60] bg-gray-950 border-t border-gray-900 pb-safe pt-2 px-1">
            <div className="flex justify-around items-center w-full max-w-md mx-auto">
              <NavItem icon={<Home size={26} fill={currentView === 'home' ? 'currentColor' : 'none'} />} label="Home" active={currentView === 'home'} onClick={() => setCurrentView('home')} />
              <NavItem icon={<Book size={26} fill={currentView === 'library' ? 'currentColor' : 'none'} />} label="Library" active={currentView === 'library'} onClick={() => setCurrentView('library')} />
              
              {/* Distinctive Center Action Button */}
              <div className="relative -mt-4 px-2">
                <button 
                  onClick={() => setCurrentView('emi')}
                  className="relative w-[48px] h-[34px] rounded-xl flex items-center justify-center active:scale-95 transition-all outline-none bg-indigo-500 overflow-hidden"
                >
                  <div className="absolute left-0 w-1/3 h-full bg-cyan-400"></div>
                  <div className="absolute right-0 w-1/3 h-full bg-pink-500"></div>
                  <div className="absolute inset-0 bg-indigo-500 rounded-xl m-[2px] flex items-center justify-center border border-indigo-400 z-10">
                    <Bot size={18} className="text-white" fill="currentColor" />
                  </div>
                </button>
              </div>

              <NavItem icon={<CheckSquare size={26} fill={currentView === 'quizzes' ? 'currentColor' : 'none'} />} label="Quizzes" active={currentView === 'quizzes'} onClick={() => setCurrentView('quizzes')} />
              <NavItem icon={<User size={26} fill={currentView === 'profile' ? 'currentColor' : 'none'} />} label="Profile" active={currentView === 'profile'} onClick={() => setCurrentView('profile')} />
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
                <div className="w-16 h-16 rounded-2xl bg-gray-800 border border-gray-700 overflow-hidden shadow-lg">
                  <img src={userProfile.avatar} alt="User" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg leading-tight">{userProfile.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full shadow-lg ${isOnline ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-amber-500 shadow-amber-500/50'}`}></span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isOnline ? 'Online' : 'Offline'}</span>
                </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {isAdmin && (
                  <SidebarItem icon={<LayoutDashboard size={20} className="text-amber-500" />} label="Admin Panel" onClick={() => { setCurrentView('admin'); setIsSidebarOpen(false); }} active={currentView === 'admin'} />
                )}
                <SidebarItem icon={<BookA size={20} />} label="Dictionary" onClick={() => { setCurrentView('dictionary'); setIsSidebarOpen(false); }} active={currentView === 'dictionary'} />
                <SidebarItem icon={<Users size={20} />} label="Study Groups" onClick={() => { setCurrentView('community'); setIsSidebarOpen(false); }} active={currentView === 'community'} />
                
                <div className="h-[1px] bg-gray-800 my-4 mx-2" />
                
                <SidebarItem 
                  icon={theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />} 
                  label={`Theme: ${theme === 'dark' ? 'Dark' : 'Light'}`} 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
                />
                <SidebarItem icon={<CreditCard size={20} />} label="Subscription & Pay" onClick={() => { alert('Payment integration coming soon!'); setIsSidebarOpen(false); }} />
                <SidebarItem icon={<Settings size={20} />} label="App Settings" onClick={() => { alert('Settings page coming soon!'); setIsSidebarOpen(false); }} />
                <SidebarItem icon={<LogOut size={20} className="text-red-400" />} label="Sign Out" onClick={() => { handleLogout(); setIsSidebarOpen(false); }} />
              </div>

              <div className="p-6 border-t border-gray-800 mt-auto">
                <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 flex items-center justify-between">
                   <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                         <Sparkles size={16} />
                      </div>
                      <span className="text-xs font-bold text-gray-200">Educate Pro</span>
                   </div>
                   <button className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Upgrade</button>
                </div>
              </div>
            </div>
          </div>
        )}
        
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

function HomeView({ onNavigate, onMenuClick, profile }: { onNavigate: (view: ViewState) => void, onMenuClick: () => void, profile: any }) {
  return (
    <div className="flex flex-col h-full bg-gray-950 overflow-hidden relative">
      {/* Fixed Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center bg-gray-950/80 backdrop-blur-xl pt-14 pb-4 px-5 border-b border-gray-900">
            <button onClick={onMenuClick} className="w-10 h-10 bg-gray-900 rounded-xl shadow-sm border border-gray-800 flex items-center justify-center active:scale-95 transition-transform text-white">
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <GraduationCap className="text-indigo-500" size={22} fill="currentColor" />
              <span className="font-black text-lg text-white tracking-tight">Educate MW</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onNavigate('profile')}
                className="w-10 h-10 bg-gray-900 rounded-xl shadow-sm border border-gray-800 flex items-center justify-center relative overflow-hidden active:scale-95 transition-transform"
              >
                <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
              </button>
            </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-5 pt-32 pb-32 hide-scrollbar">
           {/* Greeting */}
           <div className="mb-6 pl-1 animate-in fade-in slide-in-from-top-4 duration-500">
             <h2 className="text-indigo-400 font-bold text-[10px] mb-1 uppercase tracking-[0.2em]">Welcome back</h2>
             <h1 className="text-3xl font-black text-white leading-tight">Hello, {profile.name.split(' ')[0]}! 👋</h1>
           </div>

           {/* Search */}
           <div className="mb-6 animate-in fade-in slide-in-from-top-6 duration-600">
             <div className="bg-gray-900 rounded-2xl px-5 py-3.5 flex items-center border border-gray-800 shadow-inner group focus-within:border-indigo-500/50 transition-all">
               <Search className="text-gray-500 mr-3 group-focus-within:text-indigo-400 transition-colors" size={18} strokeWidth={3}/>
               <input 
                 type="text" 
                 placeholder="Search topics, notes, tutors..." 
                 className="bg-transparent outline-none flex-1 text-white text-sm font-bold placeholder-gray-600"
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
                <span className="text-[10px] font-black uppercase tracking-widest">Powered by Gemini</span>
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
                  <img src="https://i.ibb.co/RpjS0C6P/emi-ai-1.png" alt="Emi AI" className="w-full h-full object-contain" />
                  {/* Gradient masks to blend square edges */}
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-800/80 via-transparent to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-indigo-700/40"></div>
               </div>
            </div>
          </div>

          {/* Grid Menu */}
          <div className="grid grid-cols-3 gap-3 content-start shrink-0">
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
            />
          </div>
      </div>
    </div>
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

function EmiChatView({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
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
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [...messages, userMessage].map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: "You are an AI study assistant named Emi. Answer the student's questions clearly, concisely, and informally. Help them with homework, study tips, or explanations of academic concepts."
        }
      });
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: response.text || 'Sorry, I couldn\'t find an answer to that.',
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
    return <CallingView onEnd={() => setIsCalling(false)} />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-950 relative overflow-hidden">
      {/* Header */}
      <div className="bg-gray-950/80 backdrop-blur-xl border-b border-gray-800 pt-14 pb-4 px-5 flex justify-between items-center shrink-0 z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 bg-gray-900 border border-gray-800 shadow-sm rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform">
            <ChevronLeft size={24} className="text-gray-300" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center overflow-hidden">
               <img src="https://i.ibb.co/RpjS0C6P/emi-ai-1.png" alt="Emi" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="font-bold text-[17px] text-white leading-none mb-1 flex items-center gap-1">Emi AI <Sparkles size={14} className="text-indigo-400" fill="currentColor" /></h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-gray-400 text-[10px] font-bold tracking-wide uppercase">Always active</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => setIsCalling(true)} className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform">
            <Phone size={18} fill="currentColor" />
          </button>
          <button className="w-10 h-10 bg-gray-900 text-gray-400 border border-gray-800 rounded-full flex items-center justify-center shrink-0 active:scale-90 transition-transform">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28 space-y-7 hide-scrollbar">
        {/* Intro Card */}
        {messages.length === 0 && (
          <div className="bg-gradient-to-br from-indigo-900/30 to-gray-900 rounded-3xl p-6 shadow-sm border border-indigo-500/20 flex flex-col gap-4 text-center items-center mt-4">
            <div className="w-24 h-24 bg-gray-800 shadow-md rounded-2xl flex items-center justify-center shrink-0 border border-gray-700 transform -rotate-3 hover:rotate-0 transition-transform overflow-hidden">
               <img src="https://i.ibb.co/RpjS0C6P/emi-ai-1.png" alt="Emi AI" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-[22px] text-white mb-1.5">How can I help?</h3>
              <p className="text-[14px] text-gray-400 font-medium leading-relaxed max-w-[250px]">I can help you understand concepts, solve problems, or just chat.</p>
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
              text="Solve this equation: 2x + 5 = 15" 
              onClick={() => handleSend("Solve this equation: 2x + 5 = 15")}
            />
            <SuggestionCard 
              icon={<BookOpen size={20} fill="currentColor" className="text-[#20CA78]" />} 
              bgColor="bg-emerald-50" 
              text="Give me tips to study better" 
              onClick={() => handleSend("Give me tips to study better")}
            />
            <SuggestionCard 
              icon={<ScrollText size={20} fill="currentColor" className="text-[#F8912A]" />} 
              bgColor="bg-orange-50" 
              text="Summarize The Indian revolution" 
              onClick={() => handleSend("Summarize The Indian revolution")}
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
                <div className="w-8 h-8 rounded-full bg-indigo-900/50 border border-indigo-500/30 shrink-0 flex items-center justify-center overflow-hidden mt-1">
                   <img src="https://i.ibb.co/RpjS0C6P/emi-ai-1.png" alt="Emi" className="w-full h-full object-cover" />
                </div>
              )}
              <div className={`max-w-[85%] relative group`}>
                <div className={`p-4 shadow-sm relative ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm' : 'bg-gray-900 border border-gray-800 rounded-2xl rounded-tl-sm text-gray-200 font-medium'}`}>
                  <p className={`text-[14.5px] leading-relaxed whitespace-pre-wrap ${msg.sender === 'user' ? 'text-white' : 'text-gray-200'}`}>{msg.text}</p>
                  <div className={`flex items-center gap-1.5 mt-2 text-[10px] font-bold ${msg.sender === 'user' ? 'justify-end text-white/70' : 'text-gray-400'}`}>
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'user' && <CheckCheck size={10} strokeWidth={3} />}
                  </div>
                </div>
                
                {msg.sender === 'ai' && (
                  <div className="flex gap-4 mt-2 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-gray-400 hover:text-indigo-400"><Copy size={14} /></button>
                    <button className="text-gray-400 hover:text-indigo-400"><Volume2 size={14} /></button>
                    <button className="text-gray-400 hover:text-indigo-400"><ThumbsUp size={14} /></button>
                    <button className="text-gray-400 hover:text-indigo-400"><ThumbsDown size={14} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-900/50 border border-indigo-500/30 shrink-0 bg-[url('https://api.dicebear.com/9.x/bottts/svg?seed=emi&backgroundColor=transparent&primaryColor=5a42f2')] bg-cover bg-center mt-1"></div>
              <div className="bg-gray-900 shadow-sm border border-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 min-w-[60px] flex items-center justify-center">
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
      <div className="absolute bottom-0 left-0 right-0 z-40 bg-gray-950/80 backdrop-blur-xl border-t border-gray-800 pb-safe-4">
        <div className="p-4 pt-3">
          <div className="bg-gray-900/95 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-gray-800 p-2 pl-4 flex items-center">
          <input 
            type="text" 
            placeholder="Ask anything..." 
            className="flex-1 bg-transparent text-[15px] outline-none text-white placeholder-gray-500 font-medium h-10"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
          />
          <button className="w-10 h-10 flex items-center justify-center shrink-0 text-gray-400 hover:text-indigo-400 transition-colors mr-1">
            <Paperclip size={20} strokeWidth={2} />
          </button>
          <button 
            className={`w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0 transition-all ${
              !input.trim() || isLoading ? 'bg-gray-800 text-gray-600' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
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

function CallingView({ onEnd }: { onEnd: () => void }) {
  const [seconds, setSeconds] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isConnected) {
      timer = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isConnected]);

  useEffect(() => {
    let active = true;
    const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || '' });

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
              
              const source = audioContext.createMediaStreamSource(stream);
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
            onclose: () => setIsConnected(false)
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
            },
            systemInstruction: "You are Emi, a friendly AI learning assistant.",
          },
        });
        sessionRef.current = sessionPromise;
      } catch (err: any) {
        console.error("Mic access denied or error:", err);
        setErrorMsg(err.message || 'Microphone access denied. Please allow microphone access to use this feature.');
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
  }, []);

  const isMutedRef = useRef(false);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 bg-gray-950 flex flex-col items-center justify-between py-16 px-8 text-white absolute inset-0 z-50 overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[60%] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="flex flex-col items-center relative z-10 pt-16">
        <h2 className="text-sm font-bold mb-8 tracking-widest text-indigo-400 uppercase">Voice AI</h2>
        
        <div className="mb-12 relative flex items-center justify-center">
           <div className="w-40 h-40 bg-gray-900 rounded-full flex items-center justify-center border border-indigo-500/30 relative z-10 p-2 shadow-[0_0_40px_rgba(79,70,229,0.2)]">
              <div className="w-full h-full bg-gray-800 rounded-full flex items-center justify-center overflow-hidden shadow-inner border border-gray-700">
                 <img src="https://i.ibb.co/RpjS0C6P/emi-ai-1.png" alt="Emi AI" className="w-full h-full object-cover p-3" />
              </div>
           </div>
           {isConnected && <div className="absolute inset-0 bg-indigo-500 rounded-full opacity-20 animate-ping -z-0" style={{animationDuration: '2s'}}></div>}
           {isConnected && <div className="absolute inset-0 bg-indigo-600 rounded-full opacity-10 scale-150 animate-pulse -z-10" style={{animationDuration: '3s'}}></div>}
        </div>
        <h3 className="text-4xl font-black mb-3 tracking-tight text-white drop-shadow-md">Emi</h3>
        <div className="bg-gray-900/60 px-4 py-1.5 rounded-full backdrop-blur-md border border-gray-800">
           <p className={`text-[12px] font-bold tracking-widest ${isConnected ? 'text-indigo-400' : 'text-gray-400'}`}>
              {!isConnected ? (errorMsg ? 'Connection Failed' : 'Connecting to AI...') : formatTime(seconds)}
           </p>
        </div>
        
        {errorMsg && (
          <div className="mt-6 bg-red-500/10 px-5 py-3 rounded-2xl border border-red-500/30 text-center max-w-[280px]">
            <p className="text-red-400 text-sm font-semibold leading-snug">{errorMsg}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-12 relative z-10 w-full mb-10">
        <div className="flex items-center justify-center gap-1.5 h-20 w-full">
           {isConnected ? Array.from({ length: 24 }).map((_, i) => (
             <div 
               key={i} 
               className="w-1 bg-indigo-500 rounded-full transition-all duration-150 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
               style={{ 
                 height: `${Math.random() * 80 + 20}%`,
                 animation: 'pulse 1s ease-in-out infinite alternate',
                 animationDelay: `${i * 0.05}s`
               }}
             ></div>
           )) : (
             <div className="text-gray-600 text-sm font-medium tracking-widest uppercase animate-pulse">Waiting for audio...</div>
           )}
        </div>

        <div className="flex items-center justify-center gap-6 w-full px-4">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-gray-900 text-gray-300 border border-gray-800 hover:bg-gray-800 hover:text-white shadow-lg'}`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          <button 
            onClick={onEnd} 
            className="w-20 h-20 bg-red-600 hover:bg-red-500 rounded-[28px] flex items-center justify-center text-white shadow-[0_10px_30px_rgba(220,38,38,0.4)] active:scale-95 transition-all"
          >
            <PhoneOff size={32} />
          </button>
          <button className="w-16 h-16 bg-gray-900 text-gray-300 border border-gray-800 hover:bg-gray-800 hover:text-white rounded-full flex items-center justify-center transition-all shadow-lg">
             <Volume2 size={24} />
          </button>
        </div>
        
        <div className="mt-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 animate-pulse">Voice mode powered by Gemini Live</p>
        </div>
      </div>
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

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center w-14 cursor-pointer pt-1 transition-all active:scale-95 group" onClick={onClick}>
      <div className={`mb-1 transition-colors duration-200 ${active ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
        {icon}
      </div>
      <span className={`text-[9px] font-black tracking-widest uppercase transition-colors duration-200 ${active ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
        {label}
      </span>
    </div>
  );
}

function LibraryView({ onBack }: { onBack: () => void }) {
  const [filter, setFilter] = useState<'all' | 'offline'>('all');
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadedIds, setDownloadedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('mw_downloaded_notes');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const q = query(collection(db, 'materials'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMaterials(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDownload = (id: string) => {
    setDownloadedIds(prev => {
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      localStorage.setItem('mw_downloaded_notes', JSON.stringify(next));
      return next;
    });
  };

  const visibleItems = filter === 'offline' 
    ? materials.filter(item => downloadedIds.includes(item.id))
    : materials;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-gray-950 animate-in slide-in-from-right duration-300">
      {/* Fixed Header */}
      <div className="bg-gray-900/90 backdrop-blur-xl pt-14 pb-4 px-5 flex items-center shrink-0 z-10 border-b border-gray-800 shadow-xl">
        <button onClick={onBack} className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform text-white">
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <div className="ml-4">
           <h2 className="font-black text-white text-lg leading-tight uppercase tracking-tight">Library</h2>
           <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Your study vault</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-32 space-y-7 hide-scrollbar">
        {/* Search */}
        <div className="bg-gray-900 rounded-[22px] px-4 py-3.5 flex items-center shadow-inner border border-gray-800 focus-within:border-indigo-500/50 transition-colors">
          <Search className="text-gray-500 mr-2.5" size={18} strokeWidth={3}/>
          <input 
            type="text" 
            placeholder="Search your notes & books..." 
            className="bg-transparent outline-none flex-1 text-white text-sm font-bold placeholder-gray-600"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-gray-900 p-1.5 rounded-2xl border border-gray-800">
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
          <h3 className="font-bold text-gray-100 mb-4 px-1 flex items-center justify-between">
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
                        />
                    </div>
                ))
            )}
            {!loading && visibleItems.length === 0 && (
              <div className="text-center py-10">
                 <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-600">
                    <Download size={32} strokeWidth={1.5} />
                 </div>
                 <p className="text-sm font-bold text-gray-400">No materials available.</p>
                 <p className="text-[11px] text-gray-500 max-w-[200px] mx-auto mt-2 leading-relaxed">Admin will publish materials soon. Check back later!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LibraryItem({ title, type, date, color, isDownloaded, onDownload }: { title: string, type: string, date: string, color: string, isDownloaded?: boolean, onDownload?: () => void }) {
  return (
    <div className="bg-gray-900 rounded-[24px] p-4 flex items-center shadow-sm border border-gray-800 gap-4 active:bg-gray-800/50 transition-all cursor-pointer group">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${color} shadow-inner`}>
        {type === 'pdf' && <ScrollText size={22} />}
        {type === 'image' && <Layers size={22} />}
        {type === 'book' && <Library size={22} />}
        {type === 'doc' && <Bookmark size={22} />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-black text-white text-[14px] mb-1 truncate leading-tight">{title}</h4>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{type}</span>
           <span className="w-1 h-1 rounded-full bg-gray-700"></span>
           <span className="text-[10px] font-bold text-gray-500">{date}</span>
        </div>
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); onDownload?.(); }}
        className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isDownloaded ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : 'bg-gray-950 text-gray-600 border-gray-800 hover:text-indigo-400 hover:border-indigo-500'}`}
      >
        {isDownloaded ? <CheckCheck size={18} strokeWidth={3} /> : <Download size={18} />}
      </button>
    </div>
  );
}

function DictionaryView({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Priorities for high-quality male voices
      const maleVoice = voices.find(v => (
        v.name.toLowerCase().includes('google us english male') ||
        v.name.toLowerCase().includes('microsoft james') ||
        v.name.toLowerCase().includes('guy') ||
        v.name.toLowerCase().includes('david') ||
        v.name.toLowerCase().includes('male') ||
        v.name.toLowerCase().includes('daniel')
      ) && v.lang.includes('en'));
      
      if (maleVoice) {
        utterance.voice = maleVoice;
      } else {
        const fallbackMale = voices.find(v => v.name.toLowerCase().includes('male') && v.lang.includes('en'));
        utterance.voice = fallbackMale || voices.find(v => v.lang.includes('en')) || voices[0];
      }
      
      utterance.pitch = 0.8; // Lower pitch for deeper male voice
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

    const apiKey = (import.meta as any).env.VITE_CEREBRAS_API_KEY;
    if (!apiKey) {
       // Fallback to public dictionary if no key provided yet
       try {
         const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`);
         if (!res.ok) throw new Error('Word not found.');
         const data = await res.json();
         setResult(data[0]);
       } catch (err: any) {
         setError('Please configure Cerebras API Key for full dictionary support.');
       } finally {
         setLoading(false);
       }
       return;
    }

    try {
      const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama3.1-70b',
          messages: [
            {
              role: 'system',
              content: 'You are a professional dictionary for an educational app. Provide very simple, clear, and easy-to-understand definitions in English suitable for students. Absolutely NO slang, NO complex jargon unless explained simply. The answer must be clear and instructive. Return ONLY a JSON object with this structure: {"word": "word", "phonetic": "/phonetic/", "meanings": [{"partOfSpeech": "noun/verb/etc", "definitions": [{"definition": "simple definition", "example": "simple example"}]}]}'
            },
            {
              role: 'user',
              content: `Define the word: ${query}`
            }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) throw new Error('Failed to fetch definition');
      const data = await response.json();
      const contentRaw = data.choices[0].message.content;
      // Strip markdown code blocks if the AI accidentally included them
      const cleanContent = contentRaw.replace(/```json|```/g, '').trim();
      const content = JSON.parse(cleanContent);
      setResult(content);
    } catch (err: any) {
      setError('Could not find definition. Try another word.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (phonetics: any[]) => {
    const audioObj = phonetics.find(p => p.audio);
    if (audioObj && audioObj.audio) {
      new Audio(audioObj.audio).play().catch(() => {});
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-gray-950 animate-in slide-in-from-right duration-300">
      {/* Fixed Header */}
      <div className="bg-gray-900/90 backdrop-blur-xl pt-14 pb-4 px-5 flex items-center shrink-0 z-10 border-b border-gray-800 shadow-xl">
        <button onClick={onBack} className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform text-white">
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <div className="ml-4">
           <h2 className="font-black text-white text-lg leading-tight uppercase tracking-tight">Dictionary</h2>
           <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Explore Language</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-10 hide-scrollbar">
        {/* Search */}
        <form onSubmit={searchWord} className="bg-gray-900 rounded-[2rem] px-5 py-3.5 flex items-center shadow-inner border border-gray-800/50 mb-8 mt-2 transition-all focus-within:border-indigo-500/50 group">
          <Search className="text-gray-500 mr-2.5 group-focus-within:text-indigo-400 transition-colors" size={18} strokeWidth={3}/>
          <input 
            type="text" 
            placeholder="Search any word..." 
            className="bg-transparent outline-none flex-1 text-white text-sm font-black placeholder-gray-600"
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
          <div className="bg-indigo-600/10 rounded-[24px] p-6 shadow-sm border border-indigo-500/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-black text-3xl text-white mb-1 capitalize tracking-tight">{result.word}</h3>
                {result.phonetic && <p className="text-sm text-indigo-400 font-black tracking-widest">{result.phonetic}</p>}
              </div>
              <button 
                onClick={() => speak(result.word)}
                className="w-12 h-12 bg-indigo-600 text-white flex items-center justify-center rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-90 transition-transform"
              >
                <Volume2 size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {result.meanings.map((meaning: any, i: number) => (
                <div key={i}>
                  <div className="flex items-center gap-3 mb-3">
                     <span className="font-black text-indigo-400 text-sm tabular-nums italic uppercase tracking-widest">{meaning.partOfSpeech}</span>
                     <div className="h-[1px] bg-gray-800 flex-1"></div>
                  </div>
                  <ul className="space-y-4">
                    {meaning.definitions.slice(0, 3).map((def: any, idx: number) => (
                      <li key={idx} className="text-white text-[15px] leading-relaxed font-bold">
                        <span className="text-indigo-400 mr-2">{idx + 1}.</span> {def.definition}
                        {def.example && (
                          <div className="text-indigo-300/60 text-[13px] mt-2 italic font-medium pl-6 border-l-2 border-indigo-500/30">"{def.example}"</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {!result && !error && !loading && (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <BookA size={48} strokeWidth={1} className="mb-4 text-gray-200" />
            <p className="font-semibold text-sm">Search any word to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

function QuizzesView({ onBack }: { onBack: () => void }) {
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);

  if (activeQuiz) {
    return <QuizSession topic={activeQuiz} onEnd={() => setActiveQuiz(null)} />;
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-gray-950 animate-in slide-in-from-right duration-300">
      {/* Fixed Header */}
      <div className="bg-gray-900/90 backdrop-blur-xl pt-14 pb-4 px-5 flex items-center shrink-0 z-10 border-b border-gray-800 shadow-xl">
        <button onClick={onBack} className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform text-white">
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <div className="ml-4">
           <h2 className="font-black text-white text-lg leading-tight uppercase tracking-tight">Quiz Center</h2>
           <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Test Your Skills</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-10 space-y-8 hide-scrollbar">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden mt-2">
           <div className="relative z-10">
              <h3 className="text-2xl font-black mb-2 leading-tight">Daily Challenge</h3>
              <p className="text-indigo-100 text-xs font-bold leading-relaxed mb-6 max-w-[200px]">Unlock 500 bonus points by completing today's challenge.</p>
              <button className="bg-white text-indigo-700 font-black text-xs py-3 px-6 rounded-2xl active:scale-95 transition-all">Start Now</button>
           </div>
           <Target className="absolute top-1/2 right-[-20px] -translate-y-1/2 text-white/10 w-48 h-48" strokeWidth={1} />
        </div>

        <div>
          <h3 className="font-black text-white text-lg mb-6 px-1">Trending Quizzes</h3>
          <div className="grid grid-cols-1 gap-5">
            <div className="bg-gray-900 rounded-[32px] p-6 shadow-xl border border-gray-800 flex flex-col items-center text-center group relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
               <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-5 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <CheckCheck size={32} strokeWidth={2.5} />
               </div>
               <h3 className="text-lg font-black text-white mb-2 tracking-tight">Math Fundamentals</h3>
               <p className="text-xs text-gray-500 font-bold mb-6 px-4 leading-relaxed">Master the core concepts of algebra and geometry step by step.</p>
               <button onClick={() => setActiveQuiz('Math Fundamentals')} className="w-full bg-gray-800 text-white font-black py-4 rounded-2xl border border-gray-700 active:scale-95 hover:bg-gray-750 transition-all text-xs tracking-widest uppercase">
                 Begin Test
               </button>
            </div>

            <div className="bg-gray-900 rounded-[32px] p-6 shadow-xl border border-gray-800 flex flex-col items-center text-center group relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
               <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-5 border border-blue-500/20 group-hover:scale-110 transition-transform">
                  <BrainCircuit size={32} strokeWidth={2.5} />
               </div>
               <h3 className="text-lg font-black text-white mb-2 tracking-tight">Science Trivia</h3>
               <p className="text-xs text-gray-500 font-bold mb-6 px-4 leading-relaxed">Physics, chemistry, and biology combined in one rapid-fire round.</p>
               <button onClick={() => setActiveQuiz('Science Trivia')} className="w-full bg-gray-800 text-white font-black py-4 rounded-2xl border border-gray-700 active:scale-95 hover:bg-gray-750 transition-all text-xs tracking-widest uppercase">
                 Begin Test
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuizSession({ topic, onEnd }: { topic: string, onEnd: () => void }) {
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  
  const questions = topic === 'Math Fundamentals' ? [
     { q: "What is 5x + 2 = 17?", options: ["x=2", "x=3", "x=4", "x=5"], answer: "x=3" },
     { q: "What is the formula for the Area of a circle?", options: ["πr²", "2πr", "π²r", "r²"], answer: "πr²" },
     { q: "What is 15% of 200?", options: ["15", "20", "30", "45"], answer: "30" }
  ] : [
     { q: "Which planet is the hottest in the solar system?", options: ["Venus", "Mars", "Mercury", "Jupiter"], answer: "Venus" },
     { q: "What is the chemical symbol for Gold?", options: ["Ag", "Au", "Pb", "Fe"], answer: "Au" },
     { q: "What gas do plants absorb during photosynthesis?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], answer: "Carbon Dioxide" }
  ];

  const handleAnswer = (opt: string) => {
    if (opt === questions[qIndex].answer) setScore(s => s + 1);
    if (qIndex + 1 < questions.length) {
      setQIndex(q => q + 1);
    } else {
      setShowResult(true);
    }
  };

  if (showResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-950 px-6 text-center">
         <div className="w-32 h-32 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
            <CheckCheck size={64} />
         </div>
         <h2 className="text-3xl font-black text-gray-100 mb-2">Quiz Complete!</h2>
         <p className="text-gray-400 font-medium mb-8">You scored {score} out of {questions.length}</p>
         <button onClick={onEnd} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl active:scale-95 transition-transform text-lg hover:shadow-lg hover:bg-indigo-700">Back to Quizzes</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <div className="bg-gray-900 border-b border-gray-800 pt-16 pb-4 px-5 flex items-center justify-between z-10 shrink-0">
         <div className="flex-1">
             <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${(qIndex / questions.length) * 100}%` }}></div>
             </div>
         </div>
         <span className="font-bold text-sm text-gray-400 ml-4">{qIndex + 1}/{questions.length}</span>
      </div>
      <div className="flex-1 px-5 pt-8 overflow-y-auto">
         <h3 className="text-2xl font-black text-gray-800 leading-snug mb-8">{questions[qIndex].q}</h3>
         <div className="space-y-3">
            {questions[qIndex].options.map((opt, i) => (
               <button key={i} onClick={() => handleAnswer(opt)} className="w-full bg-gray-900 border-2 border-gray-800 hover:border-[#5D44F2] hover:bg-blue-50 text-left px-5 py-4 rounded-[20px] font-bold text-gray-300 transition-colors">
                  {opt}
               </button>
            ))}
         </div>
      </div>
    </div>
  );
}

function FlashcardsView({ onBack }: { onBack: () => void }) {
  const [flipped, setFlipped] = useState(false);
  const [currentSet, setCurrentSet] = useState(0);
  const [index, setIndex] = useState(0);

  const flashcards = [
    [
      { question: "What is the powerhouse of the cell?", answer: "Mitochondria" },
      { question: "Which part of the plant carries out photosynthesis?", answer: "Chloroplast (in Leaves)" },
      { question: "What is the basic unit of life?", answer: "The Cell" },
      { question: "What gas do humans exhale as waste?", answer: "Carbon Dioxide" },
      { question: "What is the green pigment in plants called?", answer: "Chlorophyll" }
    ],
    [
      { question: "In what year did Malawi gain independence?", answer: "1964" },
      { question: "Who was the first president of Malawi?", answer: "Dr. Hastings Kamuzu Banda" },
      { question: "What is the capital city of Malawi?", answer: "Lilongwe" },
      { question: "What was Malawi formerly known as?", answer: "Nyasaland" },
      { question: "Which lake is the third largest in Africa?", answer: "Lake Malawi" }
    ]
  ];

  const currentCards = flashcards[currentSet];

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-gray-950 animate-in slide-in-from-right duration-300">
      {/* Fixed Header */}
      <div className="bg-gray-900/90 backdrop-blur-xl pt-14 pb-4 px-5 flex items-center shrink-0 z-10 border-b border-gray-800 shadow-xl">
        <button onClick={onBack} className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform text-white">
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <div className="ml-4">
           <h2 className="font-black text-white text-lg leading-tight uppercase tracking-tight">Flashcards</h2>
           <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Master your knowledge</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Set Selector */}
        <div className="px-5 pt-8 flex gap-3 shrink-0 z-20">
           {['Biology', 'History'].map((setName, i) => (
             <button 
               key={i}
               onClick={() => { setCurrentSet(i); setIndex(0); setFlipped(false); }}
               className={`flex-1 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all border-2 ${currentSet === i ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/20' : 'bg-gray-900 text-gray-500 border-gray-800'}`}
             >
               {setName}
             </button>
           ))}
        </div>

        {/* Card Area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24 relative">
          {/* Card Count Indicator */}
          <div className="mb-8 flex items-center gap-1.5 bg-gray-900/50 px-3 py-1 rounded-full border border-gray-800">
             <div className="flex gap-1">
               {currentCards.map((_, i) => (
                 <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === index ? 'w-4 bg-indigo-500' : 'w-1 bg-gray-700'}`}></div>
               ))}
             </div>
          </div>

          <div className="w-full max-w-sm relative" style={{ perspective: '1200px' }} onClick={() => setFlipped(!flipped)}>
            <div className="w-full aspect-[3.5/5] relative transition-all duration-700 cursor-pointer" style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
              {/* Front */}
              <div className="absolute inset-0 bg-gray-900 rounded-[40px] shadow-2xl border-2 border-gray-800 flex flex-col items-center justify-center p-12 text-center" style={{ backfaceVisibility: 'hidden' }}>
                <div className="absolute top-8 left-8 w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                   <BrainCircuit size={24} />
                </div>
                <div className="absolute top-10 right-10 flex items-center gap-1 bg-gray-800/50 px-2 py-0.5 rounded-lg border border-gray-700">
                   <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                   <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Question</span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center">
                  <h3 className="text-2xl font-black text-white leading-tight tracking-tight mb-6">{currentCards[index].question}</h3>
                  <div className="flex items-center gap-3 bg-indigo-500/5 px-4 py-2 rounded-2xl border border-indigo-500/10 active:scale-95 transition-transform group">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Show Answer</span>
                    <Share2 size={12} className="text-indigo-400 rotate-90" />
                  </div>
                </div>

                <div className="mt-8 text-[9px] font-bold text-gray-600 uppercase tracking-[0.3em]">
                   Tap to Flip
                </div>
              </div>

              {/* Back */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-[40px] shadow-2xl shadow-indigo-600/30 flex flex-col items-center justify-center p-12 text-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <div className="absolute top-8 left-8 w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white border border-white/20 backdrop-blur-md">
                   <CheckCircle size={24} />
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="mb-6 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                     <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Correct Solution</span>
                  </div>
                  <h3 className="text-3xl font-black leading-tight drop-shadow-xl text-white tracking-tight">{currentCards[index].answer}</h3>
                </div>

                <div className="mt-8 text-[9px] font-black text-white/50 uppercase tracking-[0.3em]">
                   Tap to go back
                </div>
              </div>
            </div>
          </div>
          
          {/* Controls - Fixed at Bottom */}
          <div className="mt-12 flex items-center gap-6 w-full max-w-xs">
             <button 
               onClick={(e) => { e.stopPropagation(); setFlipped(false); setTimeout(() => setIndex(Math.max(0, index - 1)), 150); }}
               disabled={index === 0}
               className="w-16 h-16 bg-gray-900 text-gray-400 rounded-2xl flex items-center justify-center border-2 border-gray-800 disabled:opacity-20 active:scale-90 transition-all shadow-xl shadow-black hover:border-gray-700"
             >
                <ChevronLeft size={28} strokeWidth={3} />
             </button>
             
             <div className="flex-1 flex flex-col items-center">
                <div className="flex items-baseline gap-1">
                   <span className="font-black text-white text-3xl leading-none">{index + 1}</span>
                   <span className="text-sm font-bold text-gray-600">/</span>
                   <span className="font-bold text-gray-500 text-sm tracking-widest">{currentCards.length}</span>
                </div>
                <div className="w-12 h-1 bg-gray-800 rounded-full mt-3 overflow-hidden">
                   <div 
                    className="h-full bg-indigo-500 transition-all duration-500" 
                    style={{ width: `${((index + 1) / currentCards.length) * 100}%` }}
                   ></div>
                </div>
             </div>

             <button 
               onClick={(e) => { e.stopPropagation(); setFlipped(false); setTimeout(() => setIndex(Math.min(currentCards.length - 1, index + 1)), 150); }}
               disabled={index === currentCards.length - 1}
               className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center border-2 border-indigo-500 disabled:opacity-20 active:scale-90 transition-all shadow-xl shadow-indigo-600/20 hover:bg-indigo-500"
             >
                <ChevronRight size={28} strokeWidth={3} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommunityView({ onBack }: { onBack: () => void }) {
  const [activeGroup, setActiveGroup] = useState<{name: string, members: number} | null>(null);

  if (activeGroup) {
    return <GroupChat group={activeGroup} onBack={() => setActiveGroup(null)} />;
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-gray-950 animate-in slide-in-from-right duration-300">
      {/* Fixed Header */}
      <div className="bg-gray-900/90 backdrop-blur-xl pt-14 pb-4 px-5 flex items-center shrink-0 z-10 border-b border-gray-800 shadow-xl">
        <button onClick={onBack} className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform text-white">
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <div className="ml-4">
           <h2 className="font-black text-white text-lg leading-tight uppercase tracking-tight">Community</h2>
           <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Study Together</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-32">
         {/* Online users */}
         <div className="px-5 pt-8 pb-4">
            <h3 className="font-black text-white text-lg mb-6">Popular Circles</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar -mx-5 px-5">
               {[
                 { name: 'Physics 101', members: 1254, icon: Hash, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
                 { name: 'SAT Prep', members: 842, icon: BookOpen, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                 { name: 'MSCE Exams', members: 3210, icon: GraduationCap, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
                 { name: 'Biology Lab', members: 567, icon: FlaskConical, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
               ].map((group, i) => (
                 <div key={i} onClick={() => setActiveGroup(group)} className="bg-gray-900 min-w-[145px] rounded-[32px] p-6 shadow-2xl border border-gray-800 flex flex-col items-start cursor-pointer transition-all active:scale-95 group hover:border-indigo-500/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                       {React.createElement(group.icon, { size: 48 })}
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 border ${group.color} shadow-inner bg-opacity-10 backdrop-blur-sm group-hover:scale-110 transition-transform`}>
                       {React.createElement(group.icon, { size: 24, strokeWidth: 2.5 })}
                    </div>
                    <span className="font-black text-white text-[13px] mb-2 leading-tight truncate w-full">{group.name}</span>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-950 rounded-full border border-gray-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-wider">{group.members}</span>
                    </div>
                 </div>
               ))}
            </div>
         </div>
         
         <div className="px-5 pt-4">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-white text-lg">Trending Feed</h3>
                <MessageCircle size={18} className="text-gray-600" />
            </div>
            <div className="space-y-4">
               {[
                 { name: 'James T.', initial: 'J', time: '2 hours ago', text: "Can someone explain Newton's third law with an example? Confused about action-reaction pairs.", color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                 { name: 'Sarah M.', initial: 'S', time: '5 hours ago', text: "Here's a great cheat sheet for the SAT Math section I compiled. Hope it helps!", color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' }
               ].map((post, i) => (
                 <div key={i} className="bg-gray-900 p-6 rounded-[32px] shadow-sm border border-gray-800 transition-all hover:border-gray-700 animate-in fade-in slide-in-from-bottom-4" style={{animationDelay: `${i * 100}ms`}}>
                    <div className="flex items-center gap-3 mb-4">
                       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm border ${post.color}`}>
                          {post.initial}
                       </div>
                       <div>
                          <h4 className="font-black text-white text-sm leading-tight">{post.name}</h4>
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">{post.time}</p>
                       </div>
                    </div>
                    <p className="text-gray-300 text-[14px] font-medium leading-relaxed mb-6">{post.text}</p>
                    <div className="flex items-center gap-6">
                       <button className="flex items-center gap-2 text-gray-500 hover:text-indigo-400 transition-colors">
                          <ThumbsUp size={16} />
                          <span className="text-[11px] font-black uppercase tracking-widest">12</span>
                       </button>
                       <button className="flex items-center gap-2 text-gray-500 hover:text-indigo-400 transition-colors">
                          <MessageCircle size={16} />
                          <span className="text-[11px] font-black uppercase tracking-widest">4</span>
                       </button>
                       <button className="ml-auto text-gray-700">
                          <Share2 size={16} />
                       </button>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}

function ProfileView({ onBack, profile, onUpdate, onLogout, theme, onThemeToggle }: { onBack: () => void, profile: any, onUpdate: (p: any) => void, onLogout: () => void, theme: 'light' | 'dark', onThemeToggle: () => void }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile.name);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showLevelPicker, setShowLevelPicker] = useState(false);

  const referralLink = `${window.location.origin}/${profile.referralCode}`;

  const forms = ['Form 1', 'Form 2', 'Form 3', 'Form 4'];

  const boyAvatars = [
    { url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Felix&gesture=ok', id: 'boy1' },
    { url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Leo&gesture=thumbsUp', id: 'boy2' }
  ];

  const girlAvatars = [
    { url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Aria&gesture=raisedHand', id: 'girl1' },
    { url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Luna&gesture=none', id: 'girl2' }
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
  };

  const menuItems = [
    { icon: Bell, label: 'Notifications', color: 'text-blue-400' },
        { icon: Sparkles, label: `Theme: ${theme === 'dark' ? 'Dark' : 'Light'}`, color: 'text-purple-400', onClick: onThemeToggle },
    { icon: Hexagon, label: 'Language', color: 'text-amber-400' }
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

      <div className="flex-1 overflow-y-auto px-5 pt-10 pb-32 space-y-10 hide-scrollbar">
        {/* User Card */}
        <div className="flex flex-col items-center">
            <div className="relative mb-6 group">
                <div className={`w-32 h-32 rounded-[40px] ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} border-2 border-indigo-500/50 p-1.5 shadow-2xl shadow-indigo-600/20`}>
                    <div className={`w-full h-full rounded-[32px] overflow-hidden border ${theme === 'dark' ? 'border-gray-800 bg-gray-950' : 'border-slate-200 bg-slate-50'} relative`}>
                        <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <Camera size={24} className="text-white" />
                        </div>
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
                            {profile.name} <Smile size={20} className="text-indigo-400 opacity-60" />
                        </h3>
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
                <div className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>12</div>
                <div className="text-[8px] uppercase font-black text-gray-500 tracking-[0.2em] mt-1">Day Streak</div>
            </div>
        </div>

        {/* Referral Card */}
        <div className="bg-indigo-600/10 border-2 border-indigo-500/20 p-8 rounded-[40px] relative overflow-hidden group">
           <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl transition-transform group-hover:scale-110"></div>
           <div className="relative z-10">
              <h4 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-lg mb-2 tracking-tight`}>Invite your Classmates</h4>
              <p className={`text-xs ${theme === 'dark' ? 'text-indigo-200/70' : 'text-slate-600'} font-semibold mb-6 leading-relaxed max-w-[220px]`}>Help friends join Educate Pro and get 500 XP exclusive bonus.</p>
              <div className={`${theme === 'dark' ? 'bg-gray-950/80 border-indigo-500/30' : 'bg-white border-slate-200 shadow-xl'} backdrop-blur-md p-2 rounded-2xl border flex items-center justify-between`}>
                 <span className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-sm tracking-widest pl-4 uppercase`}>{profile.referralCode}</span>
                 <button onClick={handleCopyLink} className="bg-indigo-600 text-white p-3.5 rounded-xl shadow-lg active:scale-90 transition-all hover:bg-indigo-500">
                    <Share2 size={18} strokeWidth={2.5} />
                 </button>
              </div>
           </div>
           <Gift className="absolute bottom-[-15%] left-[-5%] w-32 h-32 text-indigo-500/5 -rotate-12" />
        </div>

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
                        <PhoneOff size={20} />
                    </div>
                    <span className="font-black text-red-500 text-sm tracking-tight">Log Out</span>
                </div>
            </button>
        </div>
      </div>

      <div className="px-5 mt-8 space-y-6">
        {/* Referral Section */}
        <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-4 mb-4">
             <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center">
                <Gift size={24} />
             </div>
             <div>
                <h4 className="font-bold text-white">Refer a Friend</h4>
                <p className="text-[11px] text-gray-400 font-medium leading-tight">Share Educate MW and earn 500 bonus points!</p>
             </div>
          </div>
          
          <div className="bg-gray-950 rounded-2xl p-4 flex flex-col gap-3 relative z-10">
             <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Referral Link</span>
                <button onClick={handleCopyLink} className="text-indigo-400 font-bold text-xs flex items-center gap-1.5 active:scale-95">
                  <Copy size={14} /> Copy
                </button>
             </div>
             <div className="bg-gray-900 border border-gray-800 rounded-xl py-3 px-4 text-xs font-mono text-gray-300 truncate">
                {referralLink}
             </div>
             
             <div className="mt-2 flex items-center justify-between px-1">
                <div>
                   <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Code</span>
                   <span className="text-lg font-black text-white tracking-widest">{profile.referralCode}</span>
                </div>
                <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 active:scale-95 shadow-lg shadow-indigo-600/20">
                   <Share2 size={16} /> Share Now
                </button>
             </div>
          </div>
        </div>

        {/* Stats */}
        <div>
          <h3 className="font-bold text-gray-100 mb-4 px-1">Weekly Activity</h3>
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
                <div className="flex justify-between items-start mb-2">
                   <span className="p-1.5 bg-emerald-500/20 text-emerald-500 rounded-lg"><Target size={18} /></span>
                   <span className="text-[10px] font-bold text-emerald-500">+12%</span>
                </div>
                <h4 className="font-black text-xl text-white">8.5 hrs</h4>
                <p className="text-[11px] text-gray-400 font-medium">Study Focus Time</p>
             </div>
             <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
                <div className="flex justify-between items-start mb-2">
                   <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg"><CheckSquare size={18} /></span>
                   <span className="text-[10px] font-bold text-indigo-400">+5%</span>
                </div>
                <h4 className="font-black text-xl text-white">124</h4>
                <p className="text-[11px] text-gray-400 font-medium">Quizzes Completed</p>
             </div>
          </div>
        </div>
      </div>

      {/* Avatar/Gender Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-gray-900 w-full max-w-sm rounded-[2.5rem] p-8 pb-10 border border-gray-800 shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-black text-white">Pick your Avatar</h3>
                 <button onClick={() => setShowAvatarPicker(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
              </div>

              <div className="flex bg-gray-950 rounded-2xl p-1.5 mb-8">
                 <button 
                  onClick={() => onUpdate({...profile, gender: 'boy'})}
                  className={`flex-1 py-3 font-black text-sm rounded-xl transition-all ${profile.gender === 'boy' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                 >👦 Boy</button>
                 <button 
                  onClick={() => onUpdate({...profile, gender: 'girl'})}
                  className={`flex-1 py-3 font-black text-sm rounded-xl transition-all ${profile.gender === 'girl' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                 >👧 Girl</button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 {(profile.gender === 'girl' ? girlAvatars : boyAvatars).map((avatar) => (
                    <button 
                      key={avatar.id}
                      onClick={() => { onUpdate({...profile, avatar: avatar.url}); setShowAvatarPicker(false); }}
                      className={`relative aspect-square rounded-[2rem] border-4 transition-all overflow-hidden bg-gray-950 shadow-md ${profile.avatar === avatar.url ? 'border-indigo-500 scale-105 shadow-indigo-500/20' : 'border-transparent active:scale-95'}`}
                    >
                       <img src={avatar.url} alt="Profile option" className="w-full h-full object-cover" />
                       {profile.avatar === avatar.url && (
                         <div className="absolute top-2 right-2 bg-indigo-500 text-white p-1 rounded-full shadow-lg">
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
           <div className="bg-gray-900 w-full max-w-xs rounded-3xl p-8 border border-gray-800 shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-black text-white mb-6 text-center">Select your Form</h3>
              <div className="grid grid-cols-1 gap-3">
                 {forms.map((f) => (
                    <button 
                      key={f}
                      onClick={() => { onUpdate({...profile, level: f}); setShowLevelPicker(false); }}
                      className={`py-3.5 rounded-2xl font-bold transition-all border ${profile.level === f || (!profile.level && f === 'Form 4') ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' : 'bg-gray-950 text-gray-400 border-gray-800 hover:text-white hover:border-gray-700'}`}
                    >
                       {f}
                    </button>
                 ))}
              </div>
              <button 
                onClick={() => setShowLevelPicker(false)}
                className="mt-6 w-full py-3 text-gray-500 font-bold text-sm tracking-widest uppercase hover:text-gray-300 transition-colors"
                >Cancel</button>
           </div>
        </div>
      )}
    </div>
  );
}

function GroupChat({ group, onBack }: { group: {name: string, members: number}, onBack: () => void }) {
  const [messages, setMessages] = useState<{user: string, text: string, isMe: boolean, type?: 'text' | 'voice'}[]>([
     { user: 'Sarah M.', text: 'Hey guys, when is the next study session?', isMe: false, type: 'text' },
     { user: 'James T.', text: 'I think it is tomorrow at 5PM.', isMe: false, type: 'text' },
     { user: 'Brave K.', text: 'voice_message_pseudo', isMe: false, type: 'voice' }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  const sendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    setMessages(prev => [...prev, { user: 'Me', text: input, isMe: true, type: 'text' }]);
    setInput('');
  };

  const toggleRecording = () => {
    if (isRecording) {
      setMessages(prev => [...prev, { user: 'Me', text: 'voice_message_pseudo', isMe: true, type: 'voice' }]);
    }
    setIsRecording(!isRecording);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-gray-950 animate-in slide-in-from-right duration-300">
      {/* Header - Fixed */}
      <div className="bg-gray-900/90 backdrop-blur-xl pt-14 pb-4 px-5 flex items-center shrink-0 z-10 border-b border-gray-800 shadow-lg">
        <button onClick={onBack} className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform text-white">
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <div className="ml-4 flex-1">
           <h2 className="font-black text-white text-base leading-tight flex items-center gap-2">
             {group.name} 
             <span className="bg-green-500/20 text-green-400 text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-widest border border-green-500/30">Public Group</span>
           </h2>
           <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 mt-0.5">
             <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
             {group.members} students online
           </p>
        </div>
        <button className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform text-gray-400">
          <MoreVertical size={20} />
        </button>
      </div>
      
      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 hide-scrollbar">
         <div className="flex justify-center mb-8">
            <div className="bg-gray-900/50 border border-gray-800 px-4 py-1.5 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
               Today
            </div>
         </div>

         {messages.map((msg, i) => (
           <div key={i} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              {!msg.isMe && (
                <div className="flex items-center gap-2 mb-1.5 ml-1">
                  <div className="w-5 h-5 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[8px] font-black border border-indigo-500/20">
                    {msg.user.charAt(0)}
                  </div>
                  <span className="text-[11px] font-black text-gray-400">{msg.user}</span>
                </div>
              )}
              
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] font-medium shadow-sm transition-all ${
                msg.isMe 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-none'
              }`}>
                 {msg.type === 'voice' ? (
                   <div className="flex items-center gap-3 py-1 min-w-[140px]">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center ${msg.isMe ? 'bg-white/20' : 'bg-indigo-500/20 text-indigo-400'}`}>
                        <Play size={14} fill="currentColor" />
                     </div>
                     <div className="flex-1 space-y-1">
                        <div className="flex items-end gap-0.5 h-4">
                           {[2, 4, 3, 5, 2, 6, 4, 3, 5, 2, 4].map((h, j) => (
                             <div key={j} className={`w-1 rounded-full ${msg.isMe ? 'bg-white/40' : 'bg-gray-700'}`} style={{height: `${h * 20}%`}}></div>
                           ))}
                        </div>
                        <div className="flex justify-between text-[8px] font-bold opacity-60">
                           <span>0:14</span>
                        </div>
                     </div>
                   </div>
                 ) : msg.text}
              </div>
              <span className="text-[9px] font-bold text-gray-600 mt-1.5 mx-1 uppercase">
                {msg.isMe ? 'Read' : '10:42 AM'}
              </span>
           </div>
         ))}
      </div>
      
      {/* Input - Fixed */}
      <div className="bg-gray-900/95 backdrop-blur-xl p-4 shrink-0 border-t border-gray-800 flex items-center gap-3 pb-safe-4">
         <button className="w-10 h-10 rounded-xl bg-gray-800 text-gray-400 flex items-center justify-center active:bg-gray-700 transition-colors shadow-inner">
            <Plus size={20} />
         </button>
         
         <div className="flex-1 relative">
            <form onSubmit={sendMessage} className={`flex items-center bg-gray-800/50 rounded-2xl px-4 py-2.5 border transition-all duration-300 ${isRecording ? 'border-red-500/50 ring-2 ring-red-500/10' : 'border-gray-800 focus-within:border-indigo-500/50'}`}>
               <input 
                 type="text" 
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 disabled={isRecording}
                 placeholder={isRecording ? "Recording..." : "Message group..."} 
                 className={`bg-transparent flex-1 outline-none text-xs text-gray-200 font-bold placeholder-gray-500 transition-opacity ${isRecording ? 'opacity-50' : 'opacity-100'}`}
               />
               {!input.trim() ? (
                 <button 
                  type="button" 
                  onClick={toggleRecording}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-indigo-400'}`}
                 >
                   {isRecording ? <MicOff size={16} /> : <Mic size={18} />}
                 </button>
               ) : (
                 <button type="submit" className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform">
                   <Send size={14} strokeWidth={3} />
                 </button>
               )}
            </form>
            {isRecording && (
              <div className="absolute -top-12 left-0 right-0 flex justify-center">
                <div className="bg-red-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></div>
                  Recording Voice Message
                </div>
              </div>
            )}
         </div>
      </div>
    </div>
  );
}

function AuthView({ onNavigateRegister }: { onNavigateRegister: () => void }) {
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
    <div className="flex flex-col min-h-full bg-gray-950 p-6 pt-20 animate-in fade-in duration-500 overflow-y-auto">
      <div className="flex flex-col items-center mb-12">
        <div className="w-20 h-20 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-600/40 mb-6">
          <GraduationCap size={40} className="text-white" fill="currentColor" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Educate Pro</h1>
        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Empowering Students</p>
      </div>

      <div className="bg-gray-900 rounded-[40px] p-8 border border-gray-800 shadow-2xl">
        <h2 className="text-xl font-black text-white mb-8 tracking-tight">Access Account</h2>
        
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
            <div className="h-px bg-gray-800 flex-1"></div>
            <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">or email/phone</span>
            <div className="h-px bg-gray-800 flex-1"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email or Phone</label>
              <div className="bg-gray-950 rounded-2xl p-4 flex items-center border border-gray-800 focus-within:border-indigo-500/50 transition-all">
                <User size={18} className="text-gray-600 mr-3" />
                <input 
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="student@example.com or 099..." 
                  className="bg-transparent outline-none flex-1 text-white text-sm font-bold placeholder-gray-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Password</label>
              <div className="bg-gray-950 rounded-2xl p-4 flex items-center border border-gray-800 focus-within:border-indigo-500/50 transition-all">
                <Lock size={18} className="text-gray-600 mr-3" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="bg-transparent outline-none flex-1 text-white text-sm font-bold placeholder-gray-700"
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
            className="w-full bg-gray-950 text-white text-[10px] font-black py-4 rounded-2xl border border-gray-800 active:scale-95 transition-all uppercase tracking-widest shadow-none"
          >
            Create New Account
          </button>
          <p className="text-[9px] text-gray-600 font-black text-center uppercase tracking-wider leading-relaxed">
            By continuing, you agree to our <span className="text-indigo-400">Terms</span> and <span className="text-indigo-400">Privacy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

function RegisterView({ onBack }: { onBack: () => void }) {
  const [method, setMethod] = useState<'email'|'phone'>('email');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    level: 'Form 4'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
        setError('Name and password are required');
        return;
    }
    if (method === 'email' && !formData.email) {
        setError('Email is required');
        return;
    }
    if (method === 'phone' && !formData.phone) {
        setError('Phone number is required');
        return;
    }
    setLoading(true);
    try {
      let emailToUse = formData.email;
      if (method === 'phone') {
        const digits = formData.phone.replace(/\D/g, '');
        emailToUse = `${digits}@educatemw.app`;
      }
      
      const cred = await createUserWithEmailAndPassword(auth, emailToUse, formData.password);
      await updateProfile(cred.user, { displayName: formData.username });
      
      const userRef = doc(db, 'users', cred.user.uid);
      await setDoc(userRef, {
        name: formData.username,
        email: emailToUse,
        avatar: cred.user.photoURL || `https://api.dicebear.com/9.x/notionists/svg?seed=${cred.user.uid}&gesture=ok`,
        level: formData.level,
        points: 500,
        isPro: false,
        role: 'student',
        referralCode: 'MW-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        createdAt: serverTimestamp()
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-950 p-6 pt-16 animate-in slide-in-from-right duration-500 overflow-y-auto">
      <button onClick={onBack} className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shrink-0 mb-8 border border-gray-800 text-white active:scale-95 transition-transform relative z-10">
        <ChevronLeft size={24} />
      </button>

      <div className="mb-10">
        <h1 className="text-4xl font-black text-white tracking-tight leading-tight uppercase">New<br/><span className="text-indigo-500">Student</span></h1>
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-3">Join the future of learning</p>
      </div>

      <div className="bg-gray-900 rounded-[40px] p-8 border border-gray-800 shadow-2xl relative">
        <div className="flex bg-gray-950 p-1 rounded-2xl mb-6 border border-gray-800">
          <button 
            type="button" 
            onClick={() => setMethod('email')} 
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${method === 'email' ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}
          >
            Email
          </button>
          <button 
            type="button" 
            onClick={() => setMethod('phone')} 
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${method === 'phone' ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}
          >
            Phone
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
            <div className="bg-gray-950 rounded-2xl p-4 flex items-center border border-gray-800 focus-within:border-indigo-500/50 transition-all">
              <User size={18} className="text-gray-600 mr-3" />
              <input 
                type="text" 
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="John Doe" 
                className="bg-transparent outline-none flex-1 text-white text-sm font-bold placeholder-gray-700"
              />
            </div>
          </div>

          {method === 'email' ? (
            <div className="space-y-1.5 animate-in fade-in">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="bg-gray-950 rounded-2xl p-4 flex items-center border border-gray-800 focus-within:border-indigo-500/50 transition-all">
                <Sparkles size={18} className="text-gray-600 mr-3" />
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="student@example.com" 
                  className="bg-transparent outline-none flex-1 text-white text-sm font-bold placeholder-gray-700"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 animate-in fade-in">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="bg-gray-950 rounded-2xl p-4 flex items-center border border-gray-800 focus-within:border-indigo-500/50 transition-all">
                <Smartphone size={18} className="text-gray-600 mr-3" />
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="099..." 
                  className="bg-transparent outline-none flex-1 text-white text-sm font-bold placeholder-gray-700"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Password</label>
            <div className="bg-gray-950 rounded-2xl p-4 flex items-center border border-gray-800 focus-within:border-indigo-500/50 transition-all">
              <Lock size={18} className="text-gray-600 mr-3" />
              <input 
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Secure Password" 
                className="bg-transparent outline-none flex-1 text-white text-sm font-bold placeholder-gray-700"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Level</label>
            <div className="bg-gray-950 rounded-2xl p-4 flex items-center border border-gray-800 focus-within:border-indigo-500/50 transition-all relative">
                <select 
                    value={formData.level}
                    onChange={(e) => setFormData({...formData, level: e.target.value})}
                    className="bg-transparent outline-none flex-1 text-white text-sm font-bold appearance-none relative z-10 w-full"
                >
                    <option value="Form 1">Form 1</option>
                    <option value="Form 2">Form 2</option>
                    <option value="Form 3">Form 3</option>
                    <option value="Form 4">Form 4</option>
                </select>
                <ChevronDown size={14} className="text-gray-600 absolute right-4" />
            </div>
          </div>

          {error && <p className="text-red-500 text-[9px] font-black uppercase text-center">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all mt-4 disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'CREATE ACCOUNT'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminDashboard({ onBack }: { onBack: () => void }) {
  const [students, setStudents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'students' | 'content'>('students');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ title: '', content: '', type: 'text' as 'text' | 'pdf' | 'video' });

  useEffect(() => {
    // Stream students
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
      await addDoc(collection(db, 'materials'), {
        ...newMaterial,
        authorId: auth.currentUser?.uid,
        createdAt: serverTimestamp()
      });
      setNewMaterial({ title: '', content: '', type: 'text' });
      setActiveTab('students');
    } catch (err) {
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[100] flex flex-col bg-gray-950 animate-in slide-in-from-right duration-300">
      <div className="bg-gray-900 border-b border-gray-800 pt-14 pb-4 px-5 flex items-center justify-between z-10 shadow-xl">
        <div className="flex items-center">
            <button onClick={onBack} className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform text-white mr-4">
                <ChevronLeft size={24} strokeWidth={3} />
            </button>
            <div>
                <h2 className="font-black text-white text-lg leading-tight uppercase flex items-center gap-2">
                    Admin <ShieldAlert size={18} className="text-amber-500" />
                </h2>
                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mt-0.5">Management Suite</p>
            </div>
        </div>
      </div>

      <div className="bg-gray-900/50 p-2 flex gap-1 mx-5 mt-6 rounded-2xl border border-gray-800">
        <button 
            onClick={() => setActiveTab('students')}
            className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'students' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
        >
            Students
        </button>
        <button 
            onClick={() => setActiveTab('content')}
            className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'content' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
        >
            Publish Content
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 hide-scrollbar">
        {activeTab === 'students' ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-white font-black text-xs uppercase tracking-widest">Active Students ({students.length})</h3>
                <span className="text-[9px] text-gray-500 font-bold uppercase">Real-time update</span>
            </div>
            
            {loading ? (
                <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" /></div>
            ) : (
                students.map((student) => (
                    <div key={student.id} className="bg-gray-900 border border-gray-800 p-4 rounded-3xl flex items-center justify-between group hover:border-gray-700 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gray-800 border border-gray-700 overflow-hidden relative">
                                <img src={student.avatar} className="w-full h-full object-cover" alt="" />
                                {student.isPro && (
                                    <div className="absolute top-0 right-0 p-1 bg-amber-500 rounded-bl-lg">
                                        <Sparkles size={8} className="text-white" fill="currentColor" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="text-white font-black text-sm">{student.name}</h4>
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
        ) : (
          <div className="space-y-6">
            <div className="bg-indigo-600/10 border border-indigo-500/20 p-6 rounded-[32px] relative overflow-hidden">
                <FilePlus className="absolute right-[-5%] top-[-10%] w-24 h-24 text-indigo-500/5 -rotate-12" />
                <h3 className="text-white font-black text-lg mb-1">New Material</h3>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest leading-tight">Educational Broadcast</p>
                
                <form onSubmit={handlePublish} className="mt-8 space-y-5 relative z-10">
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Material Title</label>
                        <input 
                            value={newMaterial.title}
                            onChange={e => setNewMaterial({...newMaterial, title: e.target.value})}
                            placeholder="Algebra Basics" 
                            className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Content / URL</label>
                        <textarea 
                            value={newMaterial.content}
                            onChange={e => setNewMaterial({...newMaterial, content: e.target.value})}
                            placeholder="Details or resource link..." 
                            rows={4}
                            className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-500 resize-none"
                        />
                    </div>
                    <div className="flex gap-3">
                        {(['text', 'pdf', 'video'] as const).map(t => (
                            <button 
                                key={t}
                                type="button"
                                onClick={() => setNewMaterial({...newMaterial, type: t})}
                                className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${newMaterial.type === t ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-950 border-gray-800 text-gray-600'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <button 
                        type="submit" 
                        disabled={publishing}
                        className="w-full bg-white text-gray-950 font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                    >
                        {publishing ? <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" /> : 'PUBLISH NOW'}
                    </button>
                </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
