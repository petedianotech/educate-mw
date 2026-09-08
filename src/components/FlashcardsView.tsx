import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  BrainCircuit, 
  CheckCircle, 
  Share2, 
  Plus, 
  X, 
  Loader2, 
  Sparkles, 
  ChevronRight,
  BookOpen,
  Search,
  Flame,
  Award,
  HelpCircle,
  ArrowRight,
  BookmarkCheck,
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

export function FlashcardsView({ onBack, theme = 'dark' }: { onBack: () => void, theme?: 'light' | 'dark' }) {
  const [flipped, setFlipped] = useState(false);
  const [currentSetId, setCurrentSetId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  const [flashcardSets, setFlashcardSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  
  const [showGenerate, setShowGenerate] = useState(false);
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'flashcards'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        let sets: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if(sets.length === 0) {
            // Built-in exam-ready Malawian education sets
            sets = [
              {
                id: 'exam-bio',
                name: 'MSCE Biology - Cell Structure',
                cards: [
                  { question: "State the primary function of Mitochondria inside eukaryotic cells.", answer: "It is the site for aerobic respiration which releases energy in the form of ATP." },
                  { question: "Name the plant tissue responsible for transporting water and mineral salts from the soil.", answer: "Xylem tissue provides structural transport from roots to leaves." },
                  { question: "Explain why a plant cell does not burst when placed in a hypotonic school solution.", answer: "It possesses a rigid cellulose cell wall that exerts turgor pressure resisting rupture." },
                  { question: "Identify the organelle where protein synthesis is completed.", answer: "Ribosomes." },
                  { question: "What is the green pigment in plants that traps sunlight during light reaction?", answer: "Chlorophyll." }
                ],
                tag: 'MANEB Practice',
                createdAt: null
              },
              {
                id: 'exam-phy',
                name: "MSCE Physics - Newton's Laws",
                cards: [
                  { question: "Define Newton's First Law of Motion.", answer: "An object stays at rest or in uniform motion unless acted upon by a net external force." },
                  { question: "State the relationship described by Newton's Second Law of Motion.", answer: "Force equals mass multiplied by acceleration (F = ma)." },
                  { question: "According to Newton's Third Law, if a learner actions 10N on a desk, what is the reaction?", answer: "An equal and opposite reaction force of 10N is exerted by the desk on the learner." },
                  { question: "What is the standard SI unit of force?", answer: "The Newton (N)." },
                  { question: "State the difference between mass and weight.", answer: "Mass is the constant measure of matter, whereas weight is the force exerted on that mass by gravity." }
                ],
                tag: 'MANEB Practice',
                createdAt: null
              },
              {
                id: 'exam-agri',
                name: 'MSCE Agriculture - Soil Mechanics',
                cards: [
                  { question: "State are the three primary soil mineral particles in order of particle size.", answer: "Sand (largest), Silt (medium), and Clay (smallest)." },
                  { question: "Name the agricultural process of replenishing soil nitrogen using legume crops.", answer: "Nitrogen fixation through symbiotic Rhizobium bacteria in root nodules." },
                  { question: "What type of soil has the highest water retention capacity?", answer: "Clay soil due to extremely small pore spaces." },
                  { question: "State the role of organic matter (humus) in sandy soils.", answer: "It binds sand particles together to improve structure and water holding capacity." },
                  { question: "Name one method of artificial soil erosion control on steep fields.", answer: "Terracing or planting cover crops." }
                ],
                tag: 'JCE Core Syllabus',
                createdAt: null
              }
            ];
        }
        setFlashcardSets(sets);
        if(!currentSetId && sets.length > 0) {
            setCurrentSetId(sets[0].id);
        }
        setLoading(false);
    }, (err) => {
      console.error("Firestore read error:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentSetId]);

  // Handle active set
  const currentSet = useMemo(() => {
    return flashcardSets.find(s => s.id === currentSetId) || flashcardSets[0];
  }, [flashcardSets, currentSetId]);

  const currentCards = useMemo(() => {
    return currentSet?.cards || [];
  }, [currentSet]);

  // Search filtered previous generations list
  const filteredSets = useMemo(() => {
    if (!searchQuery.trim()) return flashcardSets;
    const queryLower = searchQuery.toLowerCase();
    return flashcardSets.filter(set => 
      set.name?.toLowerCase().includes(queryLower) || 
      set.cards?.some((c: any) => c.question?.toLowerCase().includes(queryLower) || c.answer?.toLowerCase().includes(queryLower))
    );
  }, [flashcardSets, searchQuery]);

  const handleGenerate = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!topic.trim()) return;
      setGenerating(true);
      
      try {
         const response = await fetch('/api/gemini/flashcards', {
             method: 'POST',
             headers: {
                 'Content-Type': 'application/json'
             },
             body: JSON.stringify({ topic })
          });

         if (!response.ok) {
             throw new Error(`Failed to generate: ${response.statusText}`);
         }

         const data = await response.json();
         const text = data.text;
         if (!text) throw new Error("No response generated.");
         
         const generatedCards = JSON.parse(text);
         
         const newDoc = await addDoc(collection(db, 'flashcards'), {
             name: topic,
             cards: generatedCards,
             tag: 'Syllabus Aligned',
             createdAt: serverTimestamp()
         });
         
         setCurrentSetId(newDoc.id);
         setIndex(0);
         setFlipped(false);
         setTopic('');
         setShowGenerate(false);
      } catch(err) {
         console.error(err);
         alert("Failed to generate curriculum flashcards. Make sure internet connection is active!");
      } finally {
         setGenerating(false);
      }
  };

  const handleShareSet = (set: any) => {
    const textToCopy = `Check out this exam study set on "${set.name}" within Educate MW! Get ready to crush MANEB & JCE exam questions together. 📚`;
    navigator.clipboard.writeText(textToCopy);
    setShareFeedback(set.id);
    setTimeout(() => setShareFeedback(null), 2500);
  };

  return (
    <div className={`absolute inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-slate-50 text-slate-800'} animate-in slide-in-from-right duration-300`}>
      
      {/* Premium Header */}
      <div className={`${theme === 'dark' ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90 border-slate-200 shadow-sm'} backdrop-blur-xl pt-4 pb-4 px-5 flex items-center justify-between shrink-0 z-10 border-b`}>
        <div className="flex items-center">
            <button onClick={onBack} className={`w-10 h-10 ${theme === 'dark' ? 'bg-gray-800 text-white hover:bg-gray-750' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} rounded-2xl flex items-center justify-center shrink-0 active:scale-90 transition-transform`}>
              <ChevronLeft size={24} strokeWidth={3} />
            </button>
            <div className="ml-4">
               <h2 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-lg leading-tight uppercase tracking-tight`}>Exam Flashcards</h2>
               <p className="text-[10px] text-indigo-500 font-extrabold uppercase tracking-widest mt-0.5">MANEB / JCE Syllabus Prep</p>
            </div>
        </div>
        
        <button 
          onClick={() => setShowGenerate(true)} 
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-4 py-2.5 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all shrink-0"
        >
          <Sparkles size={14} className="animate-spin text-indigo-100" style={{ animationDuration: '6s' }} />
          <span>Ask AI Creator</span>
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Side: Study sets selector & Syllabus Library representation */}
        <div className={`lg:col-span-4 border-r ${theme === 'dark' ? 'border-gray-900 bg-gray-950' : 'border-slate-200 bg-slate-100'} flex flex-col`}>
          
          {/* Quick Info & Search Header */}
          <div className="p-4 border-b border-gray-800/10 shrink-0 space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-gray-500">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search study topics..."
                className={`w-full py-2.75 pl-11 pr-4 rounded-xl border text-xs font-bold outline-none transition-all ${
                  theme === 'dark' 
                    ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-600 focus:border-indigo-500' 
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-505 shadow-sm'
                }`}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] uppercase font-black text-gray-500 tracking-wider px-1">
              <span>Syllabus Collections</span>
              <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-lg border border-indigo-500/20">{filteredSets.length} Sets</span>
            </div>
          </div>

          {/* List of Previous Generations */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
            {loading ? (
              <div className="text-center py-20 text-gray-500 uppercase font-black text-[10px] tracking-widest">
                <Loader2 size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
                Populating library...
              </div>
            ) : filteredSets.length === 0 ? (
              <div className="text-center py-20 text-gray-400 font-bold text-xs p-6">
                No matching topics found. Tap "Ask AI Creator" to generate a custom set on any national lessons! 📚
              </div>
            ) : (
              filteredSets.map((set, i) => {
                const isActive = set.id === currentSetId;
                return (
                  <motion.div
                    key={set.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => { setCurrentSetId(set.id); setIndex(0); setFlipped(false); }}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex items-start justify-between relative group ${
                      isActive 
                        ? (theme === 'dark' ? 'bg-indigo-900/20 border-indigo-500/50 shadow-lg' : 'bg-indigo-50 border-indigo-300 shadow-sm') 
                        : (theme === 'dark' ? 'bg-gray-900/50 border-gray-850 hover:bg-gray-900/80' : 'bg-white border-slate-200 shadow-sm hover:border-slate-350')
                    }`}
                  >
                    <div className="flex-1 pr-4 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isActive 
                            ? 'bg-indigo-600 text-white' 
                            : (theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-slate-100 text-slate-500')
                        }`}>
                          {set.tag || 'Syllabus Core'}
                        </span>
                        <span className={`text-[9px] font-bold ${isActive ? 'text-indigo-400' : 'text-gray-500'}`}>
                          {set.cards?.length || 0} cards
                        </span>
                      </div>
                      
                      <h4 className={`text-xs font-black truncate leading-tight ${isActive ? 'text-indigo-300' : (theme === 'dark' ? 'text-gray-100' : 'text-slate-800')}`}>
                        {set.name}
                      </h4>
                      
                      <p className="text-[10px] text-gray-500 font-bold mt-1.5 flex items-center gap-1.5">
                        <BookmarkCheck size={11} className="text-emerald-500" />
                        <span>Teacher Approved</span>
                      </p>
                    </div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); handleShareSet(set); }}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isActive 
                          ? (theme === 'dark' ? 'bg-indigo-900/30 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500 hover:text-white' : 'bg-indigo-100 border-indigo-200 text-indigo-600')
                          : (theme === 'dark' ? 'bg-gray-950 border-gray-800 text-gray-500 hover:text-gray-300' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100')
                      }`}
                    >
                      {shareFeedback === set.id ? (
                        <CheckCircle2 size={13} className="text-emerald-500" />
                      ) : (
                        <Share2 size={13} />
                      )}
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active study card viewer */}
        <div className="lg:col-span-8 flex flex-col justify-between p-6 relative overflow-y-auto">
          
          {currentCards.length > 0 ? (
            <div className="w-full max-w-xl mx-auto flex-1 flex flex-col items-center justify-center py-6">
              
              {/* Info Label top */}
              <div className="mb-6 text-center space-y-1.5">
                <span className="text-[9.5px] font-black uppercase tracking-[0.25em] text-indigo-500">Active Lessons Set</span>
                <h2 className={`text-base font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} leading-none tracking-tight`}>
                  {currentSet?.name}
                </h2>
              </div>

              {/* Progress Bar Indicators */}
              <div className="w-full max-w-sm mb-6 flex justify-between items-center gap-4">
                <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-gray-900 overflow-hidden relative">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300" 
                    style={{ width: `${((index + 1) / currentCards.length) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono font-black text-gray-500 uppercase tracking-widest leading-none shrink-0 border border-gray-500/10 px-2 py-0.5 rounded-md">
                  {index + 1} of {currentCards.length}
                </span>
              </div>

              {/* Custom physics-based 3D Flippable card */}
              <div className="w-full max-w-sm relative" style={{ perspective: '1200px' }} onClick={() => setFlipped(!flipped)}>
                <motion.div 
                  className="w-full aspect-[3.5/4.8] relative transition-all cursor-pointer select-none" 
                  style={{ transformStyle: 'preserve-3d' }}
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 14 }}
                >
                  
                  {/* Front View */}
                  <div 
                    className={`absolute inset-0 rounded-[35px] shadow-2xl p-8 xs:p-10 flex flex-col justify-between text-center relative border-2 ${
                      theme === 'dark' 
                        ? 'bg-gradient-to-b from-gray-900 to-gray-950 border-gray-800' 
                        : 'bg-gradient-to-b from-white to-slate-50 border-slate-200 shadow-slate-200/50'
                    }`} 
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="flex justify-between items-center">
                     <span className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10 shadow-inner">
                        <BrainCircuit size={20} />
                     </span>
                     <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                       theme === 'dark' ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600'
                     }`}>
                        Question
                     </span>
                    </div>

                    <div className="pt-4 flex-1 flex flex-col justify-center">
                      <p className={`text-base xs:text-lg font-black leading-snug tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {currentCards[index].question}
                      </p>
                    </div>

                    <div className="space-y-3.5">
                      <div className={`mx-auto w-fit py-2 px-4 rounded-xl text-[10px] font-extrabold uppercase tracking-widest ${
                        theme === 'dark' ? 'bg-indigo-500/15 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                      } hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5`}>
                        <span>Tap to Reveal Solution</span>
                        <ChevronRight size={12} className="rotate-90 text-indigo-400" />
                      </div>
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-500">Malawi Syllabus Aligned</p>
                    </div>
                  </div>

                  {/* Back View */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-b from-indigo-600 to-indigo-800 text-white rounded-[35px] shadow-2xl shadow-indigo-600/30 p-8 xs:p-10 flex flex-col justify-between text-center border-2 border-white/10" 
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <div className="flex justify-between items-center">
                     <span className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white border border-white/20">
                        <CheckCircle size={20} />
                     </span>
                     <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/25 text-white border border-white/20">
                        Solution Correct
                     </span>
                    </div>

                    <div className="pt-4 flex-1 flex flex-col justify-center">
                      <p className="text-base xs:text-lg font-black leading-snug tracking-tight drop-shadow-md text-white">
                        {currentCards[index].answer}
                      </p>
                    </div>

                    <div className="space-y-3.5">
                      <div className="mx-auto w-fit py-2 px-4 rounded-xl text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500 text-white shadow-xl flex items-center gap-1.5">
                        <CheckCircle size={12} />
                        <span>Mastered Item</span>
                      </div>
                      <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/40">Tap anywhere to hide answer</p>
                    </div>
                  </div>

                </motion.div>
              </div>

              {/* Tactile controls panel */}
              <div className="mt-4 flex items-center gap-3 w-full max-w-sm">
                <button
                  type="button"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setFlipped(false); 
                    setTimeout(() => setIndex(prev => Math.max(0, prev - 1)), 150); 
                  }}
                  disabled={index === 0}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all shrink-0 active:scale-95 disabled:opacity-20 ${
                    theme === 'dark' 
                      ? 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700 hover:bg-gray-800' 
                      : 'bg-white border-slate-200 text-slate-500 shadow-sm hover:border-slate-300'
                  }`}
                >
                  <ChevronLeft size={24} strokeWidth={3} />
                </button>

                <button
                  type="button"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (index === currentCards.length - 1) {
                      // Restart
                      setFlipped(false);
                      setTimeout(() => setIndex(0), 150);
                    } else {
                      setFlipped(false);
                      setTimeout(() => setIndex(prev => Math.min(currentCards.length - 1, prev + 1)), 150);
                    }
                  }}
                  className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center border-2 border-indigo-500 shadow-xl shadow-indigo-600/20 gap-2 active:scale-95 transition-all text-sm font-black uppercase tracking-widest"
                >
                  <span>{index === currentCards.length - 1 ? 'Start Again' : 'Next Lesson'}</span>
                  <ChevronRight size={18} strokeWidth={3.5} />
                </button>
              </div>

              {/* Motivational Tip */}
              <p className="text-[10px] text-gray-500 font-bold max-w-xs text-center mt-6 leading-relaxed uppercase tracking-wider">
                💡 Tip: Speak questions aloud to commit definitions successfully into your long-term memory buffer.
              </p>

            </div>
          ) : (
            <div className="text-center py-24 text-gray-500 flex flex-col items-center justify-center">
              <Loader2 size={32} className="text-indigo-500 animate-spin mb-4" />
              <p className="font-black text-sm uppercase tracking-wider">Loading lessons...</p>
            </div>
          )}

        </div>
      </div>

      {/* Ask AI Generator Modal */}
      <AnimatePresence>
        {showGenerate && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-0 animate-in fade-in duration-200">
             <motion.div 
               initial={{ y: 50, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: 50, opacity: 0 }}
               className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800/80 text-white' : 'bg-white border-slate-200 text-slate-900'} w-full max-w-md rounded-[2.5rem] p-8 border shadow-2xl relative overflow-hidden`}
             >
                <div className="flex justify-between items-center mb-6">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
                          <Sparkles size={20} />
                      </div>
                      <div>
                          <h3 className="text-sm font-black leading-tight uppercase tracking-widest">Syllabus Generator</h3>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-500 mt-0.5">MANEB Style Aligned creator</p>
                      </div>
                   </div>
                   <button 
                     type="button"
                     onClick={() => setShowGenerate(false)} 
                     className={`text-gray-500 hover:text-white ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-slate-100 hover:bg-slate-200'} rounded-full p-2`}
                   >
                     <X size={18} />
                   </button>
                </div>

                <div className={`p-4 rounded-2xl mb-6 ${theme === 'dark' ? 'bg-indigo-950/15 border-indigo-500/10' : 'bg-indigo-50/50 border-indigo-100'} border`}>
                  <p className="text-xs font-semibold leading-relaxed text-indigo-400">
                    💡 Our AI will compile high-yielding flashcards using **simple English**. They are generated keeping national standards (like **MANEB examinations, JCE & local tests**) in mind!
                  </p>
                </div>

                <form onSubmit={handleGenerate} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Write your Topic Name</label>
                        <input 
                            type="text" 
                            required
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., Photosynthesis, Chemical Equations, Malawian History" 
                            className={`w-full ${theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} border-2 rounded-2xl px-5 py-3.75 text-sm font-bold outline-none focus:border-indigo-500 transition-colors shadow-inner`}
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={generating || !topic.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black uppercase tracking-widest text-[11px] py-4.5 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
                    >
                        {generating ? (
                            <><Loader2 size={16} className="animate-spin text-white" /> Compiling simple English lessons...</>
                        ) : (
                            <>Compile High-Yielding Lessons</>
                        )}
                    </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
