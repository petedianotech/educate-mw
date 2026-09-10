import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  BrainCircuit, 
  CheckCircle, 
  Share2, 
  Sparkles, 
  ChevronRight,
  BookOpen,
  Search,
  CheckCircle2,
  Volume2,
  Shuffle,
  RotateCcw,
  Layers,
  GraduationCap,
  Play,
  X,
  Loader2,
  Award,
  BookMarked
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

interface Flashcard {
  question: string;
  answer: string;
}

interface FlashcardSet {
  id: string;
  name: string;
  cards: Flashcard[];
  tag: string;
  subject?: string;
  createdAt?: any;
}

const DEFAULT_SETS: FlashcardSet[] = [
  {
    id: 'exam-bio-cell',
    name: 'MSCE Biology: Cell Structure & Functions',
    tag: 'MANEB Practice',
    subject: 'Biology',
    cards: [
      { 
        question: "State the primary function of Mitochondria inside eukaryotic cells.", 
        answer: "It is the site for aerobic cellular respiration, which breaks down glucose to release energy in the form of ATP." 
      },
      { 
        question: "Name the plant tissue responsible for transporting water and dissolved mineral salts from the soil to the leaves.", 
        answer: "Xylem tissue provides continuous tubular transport from root hair cells up through the stem to leaves." 
      },
      { 
        question: "Explain why a plant cell does not burst when placed in a hypotonic (pure water) solution.", 
        answer: "The rigid cellulose cell wall exerts opposing turgor pressure (wall pressure) that prevents the protoplast from expanding to the bursting point." 
      },
      { 
        question: "Identify the organelle where protein synthesis is carried out.", 
        answer: "Ribosomes, which can be found free in the cytoplasm or bound to the rough endoplasmic reticulum." 
      },
      { 
        question: "What is the role of chlorophyll during the light-dependent stage of photosynthesis?", 
        answer: "Chlorophyll absorbs radiant sunlight energy and converts it into chemical energy (ATP and NADPH) while photolyzing water to release oxygen." 
      }
    ]
  },
  {
    id: 'exam-phy-newton',
    name: "MSCE Physics: Newton's Laws of Motion",
    tag: 'MANEB Practice',
    subject: 'Physics',
    cards: [
      { 
        question: "State Newton's First Law of Motion (Law of Inertia).", 
        answer: "A body remains in a state of rest or uniform motion in a straight line unless compelled to change that state by an external net resultant force." 
      },
      { 
        question: "State the mathematical formula and relationship for Newton's Second Law of Motion.", 
        answer: "Resultant Force (F) is directly proportional to the rate of change of momentum: F = m × a (Force = Mass × Acceleration), measured in Newtons (N)." 
      },
      { 
        question: "According to Newton's Third Law, if a student pushes against a wall with a force of 50 N, what is the reaction force?", 
        answer: "The wall exerts an equal and opposite normal reaction force of 50 N back onto the student." 
      },
      { 
        question: "What is the distinction between mass and weight in physics?", 
        answer: "Mass is the scalar quantity of matter in an object (measured in kg), while weight is the downward gravitational force acting on that mass: W = m × g (measured in N)." 
      },
      { 
        question: "Define momentum and state its SI unit.", 
        answer: "Momentum is the product of an object's mass and its velocity (p = m × v). Its SI unit is kilogram-metre per second (kg·m/s) or Newton-second (N·s)." 
      }
    ]
  },
  {
    id: 'exam-chem-bonding',
    name: 'MSCE Chemistry: Chemical Bonding & Structure',
    tag: 'MANEB Practice',
    subject: 'Chemistry',
    cards: [
      { 
        question: "Define an ionic (electrovalent) bond.", 
        answer: "The electrostatic force of attraction between oppositely charged ions formed by the complete transfer of one or more electrons from a metal atom to a non-metal atom." 
      },
      { 
        question: "Explain why ionic compounds conduct electricity when molten or in aqueous solution, but not in solid state.", 
        answer: "In solid state, ions are locked in fixed lattice positions. When molten or dissolved in water, the ions are free and mobile to carry electric charge." 
      },
      { 
        question: "What is a covalent bond?", 
        answer: "A chemical bond formed by the sharing of one or more pairs of electrons between non-metallic atoms to achieve a stable octet electron configuration." 
      },
      { 
        question: "Define allotropy and give two allotropes of carbon.", 
        answer: "Allotropy is the existence of an element in two or more different physical forms in the same physical state. Carbon allotropes include Diamond and Graphite." 
      },
      { 
        question: "State the products of the electrolysis of acidified water at the cathode and anode.", 
        answer: "Hydrogen gas (H₂) is produced at the cathode (reduction), and Oxygen gas (O₂) is produced at the anode (oxidation) in a 2:1 volume ratio." 
      }
    ]
  },
  {
    id: 'exam-agri-soil',
    name: 'MSCE Agriculture: Soil Fertility & Mechanics',
    tag: 'Core Syllabus',
    subject: 'Agriculture',
    cards: [
      { 
        question: "List the three primary mineral soil particles in decreasing order of size.", 
        answer: "Sand (largest: 0.05–2.0 mm), Silt (medium: 0.002–0.05 mm), and Clay (smallest: < 0.002 mm)." 
      },
      { 
        question: "Explain how legume crops contribute to soil nitrogen fertility in Malawian farming.", 
        answer: "Legumes host symbiotic Rhizobium bacteria in their root nodules, which fix atmospheric nitrogen gas into plant-available nitrates." 
      },
      { 
        question: "Which soil type has the highest cation exchange capacity (CEC) and water holding capacity?", 
        answer: "Clay soil and humus-rich organic soils, due to high specific surface area and negative electrical charges." 
      },
      { 
        question: "Name two physical soil conservation structures recommended on steep slopes in Malawi.", 
        answer: "Contour marker ridges with vetiver grass planting, and box ridging / terracing to intercept runoff water." 
      },
      { 
        question: "What is the primary role of Phosphorus (P) in crop growth?", 
        answer: "Phosphorus promotes vigorous early root development, energy transfer (ATP), and uniform seed/grain formation." 
      }
    ]
  },
  {
    id: 'exam-hist-malawi',
    name: 'MSCE History: Malawi Independence & Governance',
    tag: 'Humanities',
    subject: 'History',
    cards: [
      { 
        question: "In what year did Nyasaland gain independence from British colonial rule to become Malawi?", 
        answer: "On July 6, 1964, Nyasaland achieved sovereignty under the leadership of Dr. Hastings Kamuzu Banda." 
      },
      { 
        question: "What historic national event occurred in Malawi on June 14, 1993?", 
        answer: "The historic National Referendum in which Malawians voted overwhelmingly (63%) to transition from a one-party state to a multiparty democracy." 
      },
      { 
        question: "Name the three branches of government established under the 1994 Constitution of Malawi.", 
        answer: "The Executive (President & Cabinet), the Legislature (Parliament / National Assembly), and the Judiciary (Courts of Law)." 
      },
      { 
        question: "Who was the hero of the 1915 uprising against colonial plantation forced labour (thangata) in Nyasaland?", 
        answer: "Reverend John Chilembwe of Chiradzulu." 
      }
    ]
  },
  {
    id: 'exam-eng-devices',
    name: 'MSCE English: Literary Devices & Figures of Speech',
    tag: 'Language',
    subject: 'English',
    cards: [
      { 
        question: "What is the difference between a simile and a metaphor?", 
        answer: "A simile compares two things using connective words 'like' or 'as' (e.g., 'fast as lightning'), whereas a metaphor asserts a direct identity comparison without 'like' or 'as' (e.g., 'time is a thief')." 
      },
      { 
        question: "Define personification and give an illustrative example.", 
        answer: "Attributing human qualities, emotions, or actions to non-human objects or abstract concepts (e.g., 'The merciless wind howled through the midnight forest')." 
      },
      { 
        question: "What literary device is used in the phrase 'the buzzing bees bustled in the garden'?", 
        answer: "Onomatopoeia (words that phonetically imitate real sounds) and Alliteration (repetition of the initial 'b' consonant sound)." 
      },
      { 
        question: "Define hyperbole.", 
        answer: "An intentional, extreme exaggeration used for poetic effect or dramatic emphasis not meant to be taken literally (e.g., 'I have walked a thousand miles today')." 
      }
    ]
  }
];

export function FlashcardsView({ onBack, theme = 'dark' }: { onBack: () => void, theme?: 'light' | 'dark' }) {
  // State
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>(() => {
    try {
      const cached = localStorage.getItem('mw_flashcards_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_SETS;
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  
  // Full-Screen Study Mode State
  const [activeSet, setActiveSet] = useState<FlashcardSet | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());
  
  // AI Generator Modal State
  const [showGenerate, setShowGenerate] = useState(false);
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  // Firestore synchronization
  useEffect(() => {
    let isMounted = true;
    const safetyTimeout = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2500);

    try {
      const q = query(collection(db, 'flashcards'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        clearTimeout(safetyTimeout);
        if (!snapshot.empty) {
          const firestoreSets: FlashcardSet[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || 'Untitled Deck',
              cards: Array.isArray(data.cards) ? data.cards : [],
              tag: data.tag || 'AI Generated',
              subject: data.subject || 'General Study',
              createdAt: data.createdAt
            };
          }).filter(s => s.cards.length > 0);

          // Combine with default sets (avoiding duplicates by id)
          const customOnly = firestoreSets.filter(fs => !DEFAULT_SETS.some(ds => ds.id === fs.id));
          const combined = [...DEFAULT_SETS, ...customOnly];
          setFlashcardSets(combined);
          try {
            localStorage.setItem('mw_flashcards_cache', JSON.stringify(combined));
          } catch {}
        }
        setLoading(false);
      }, (err) => {
        clearTimeout(safetyTimeout);
        console.warn("Firestore flashcards live query failed, using built-in sets:", err);
        if (isMounted) setLoading(false);
      });
      return () => {
        isMounted = false;
        clearTimeout(safetyTimeout);
        unsubscribe();
      };
    } catch (e) {
      clearTimeout(safetyTimeout);
      console.warn("Firestore initialization error, using fallback sets:", e);
      if (isMounted) setLoading(false);
    }
  }, []);

  // Filter sets by search and subject
  const filteredSets = useMemo(() => {
    return flashcardSets.filter(set => {
      const matchesSearch = !searchQuery.trim() || 
        set.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        set.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        set.cards.some(c => 
          c.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
          c.answer.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesSubject = selectedSubject === 'All' || 
        set.subject?.toLowerCase() === selectedSubject.toLowerCase() ||
        (selectedSubject === 'Custom' && set.tag?.toLowerCase().includes('ai'));

      return matchesSearch && matchesSubject;
    });
  }, [flashcardSets, searchQuery, selectedSubject]);

  // Distinct subjects for filter tabs
  const subjects = useMemo(() => {
    const list = Array.from(new Set(flashcardSets.map(s => s.subject).filter(Boolean))) as string[];
    return ['All', ...list];
  }, [flashcardSets]);

  // Launch Full-Screen Study Mode
  const startStudySession = (set: FlashcardSet) => {
    setActiveSet(set);
    setCurrentIndex(0);
    setFlipped(false);
    setIsCompleted(false);
    setMasteredCards(new Set());
  };

  // Exit Full-Screen Study Mode
  const exitStudySession = () => {
    setActiveSet(null);
    setCurrentIndex(0);
    setFlipped(false);
    setIsCompleted(false);
  };

  // Navigate Flashcards in Fullscreen Mode
  const handleNext = () => {
    if (!activeSet) return;
    setFlipped(false);
    if (currentIndex >= activeSet.cards.length - 1) {
      setIsCompleted(true);
    } else {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 120);
    }
  };

  const handlePrevious = () => {
    if (!activeSet || currentIndex === 0) return;
    setFlipped(false);
    setTimeout(() => setCurrentIndex(prev => prev - 1), 120);
  };

  const handleShuffle = () => {
    if (!activeSet) return;
    const shuffled = [...activeSet.cards].sort(() => Math.random() - 0.5);
    setActiveSet({ ...activeSet, cards: shuffled });
    setCurrentIndex(0);
    setFlipped(false);
    setIsCompleted(false);
    setMasteredCards(new Set());
  };

  const toggleMastered = (cardIndex: number) => {
    setMasteredCards(prev => {
      const next = new Set(prev);
      if (next.has(cardIndex)) {
        next.delete(cardIndex);
      } else {
        next.add(cardIndex);
      }
      return next;
    });
  };

  // Audio Speech Synthesis for accessibility
  const speakText = (text: string) => {
    try {
      if (!('speechSynthesis' in window)) return;
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => 
        (v.name?.toLowerCase().includes('natural') || 
         v.name?.toLowerCase().includes('google') ||
         v.name?.toLowerCase().includes('en-us') ||
         v.name?.toLowerCase().includes('en-gb')) && 
        v.lang?.startsWith('en')
      );
      if (preferred) utterance.voice = preferred;
      utterance.rate = 0.92;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech synthesis failed:", e);
    }
  };

  // Handle AI Card Generation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTopic = topic.trim();
    if (!cleanTopic) return;
    
    setGenerating(true);
    setGenerateError('');
    
    try {
      const response = await fetch('/api/gemini/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: cleanTopic })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: Failed to generate flashcards`);
      }

      const data = await response.json();
      const rawText = data.text;
      if (!rawText) throw new Error("No response generated.");
      
      const parsedCards: Flashcard[] = JSON.parse(rawText);
      if (!Array.isArray(parsedCards) || parsedCards.length === 0) {
        throw new Error("Invalid format received from AI.");
      }

      // Create new set
      const newDeck: FlashcardSet = {
        id: `ai-${Date.now()}`,
        name: cleanTopic,
        cards: parsedCards,
        tag: 'AI Generated',
        subject: 'Custom Topic',
        createdAt: new Date()
      };

      // Save to Firebase Firestore if possible
      try {
        const docRef = await addDoc(collection(db, 'flashcards'), {
          name: cleanTopic,
          cards: parsedCards,
          tag: 'AI Generated',
          subject: 'Custom Topic',
          createdAt: serverTimestamp()
        });
        newDeck.id = docRef.id;
      } catch (dbErr) {
        console.warn("Could not save to Firestore, using local session state:", dbErr);
      }

      setFlashcardSets(prev => [newDeck, ...prev]);
      setTopic('');
      setShowGenerate(false);
      // Directly start studying the newly generated deck!
      startStudySession(newDeck);
    } catch (err: any) {
      console.error(err);
      setGenerateError(err.message || "Failed to generate flashcards. Please check connection and try again.");
    } finally {
      setGenerating(false);
    }
  };

  // Share set
  const handleShareSet = (e: React.MouseEvent, set: FlashcardSet) => {
    e.stopPropagation();
    const textToCopy = `Study "${set.name}" (${set.cards.length} cards) on Educate MW! Perfect for MSCE and JCE exam preparation.`;
    navigator.clipboard.writeText(textToCopy);
    setShareFeedback(set.id);
    setTimeout(() => setShareFeedback(null), 2500);
  };

  // Keyboard navigation for fullscreen study mode
  useEffect(() => {
    if (!activeSet || isCompleted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'j') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'k') {
        handlePrevious();
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFlipped(prev => !prev);
      } else if (e.key === 'Escape') {
        exitStudySession();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSet, currentIndex, isCompleted]);

  // ==========================================
  // RENDER FULL-SCREEN STUDY MODE
  // ==========================================
  if (activeSet) {
    const currentCard = activeSet.cards[currentIndex];
    const isCurrentMastered = masteredCards.has(currentIndex);
    const progressPercent = Math.round(((currentIndex + 1) / activeSet.cards.length) * 100);

    return (
      <div 
        className={`fixed inset-0 z-[100] flex flex-col ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-slate-900 text-white'} select-none animate-in fade-in duration-200`}
      >
        {/* Fullscreen Header */}
        <div className="w-full px-4 sm:px-8 pt-4 pb-3 flex items-center justify-between border-b border-white/10 shrink-0 backdrop-blur-md bg-black/20">
          <div className="flex items-center gap-3">
            <button
              onClick={exitStudySession}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-95 transition-all"
              title="Exit Fullscreen (Esc)"
            >
              <X size={20} />
            </button>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block">
                {activeSet.subject || 'Exam Study Deck'}
              </span>
              <h3 className="text-sm sm:text-base font-black truncate max-w-[200px] sm:max-w-md text-white leading-tight">
                {activeSet.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShuffle}
              title="Shuffle Cards"
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Shuffle size={14} />
              <span className="hidden sm:inline">Shuffle</span>
            </button>

            <button
              onClick={() => toggleMastered(currentIndex)}
              title={isCurrentMastered ? "Mark as unmastered" : "Mark as mastered"}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all border ${
                isCurrentMastered 
                  ? 'bg-emerald-600/90 text-white border-emerald-500 shadow-md shadow-emerald-600/20' 
                  : 'bg-white/10 hover:bg-white/20 text-gray-300 border-white/10'
              }`}
            >
              <CheckCircle2 size={14} className={isCurrentMastered ? 'text-white' : 'text-gray-400'} />
              <span className="hidden sm:inline">{isCurrentMastered ? 'Mastered' : 'Mark Learned'}</span>
            </button>
          </div>
        </div>

        {/* Progress Line */}
        <div className="w-full bg-white/5 h-1">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Fullscreen Body */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-3xl mx-auto w-full overflow-hidden">
          
          {!isCompleted ? (
            <div className="w-full flex-1 flex flex-col items-center justify-center max-w-xl">
              
              {/* Card Meta Indicator */}
              <div className="w-full flex items-center justify-between text-xs font-bold text-gray-400 mb-3 px-2">
                <span className="uppercase tracking-widest text-[11px] font-mono text-indigo-400">
                  Card {currentIndex + 1} of {activeSet.cards.length}
                </span>
                <span className="text-[11px] text-gray-400">
                  {masteredCards.size} mastered ({Math.round((masteredCards.size / activeSet.cards.length) * 100)}%)
                </span>
              </div>

              {/* 3D Flipping Card Container */}
              <div 
                className="w-full flex-1 max-h-[460px] min-h-[340px] relative cursor-pointer select-none"
                style={{ perspective: '1400px' }}
                onClick={() => setFlipped(prev => !prev)}
              >
                <motion.div
                  className="w-full h-full relative"
                  style={{ transformStyle: 'preserve-3d' }}
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 16 }}
                >
                  {/* FRONT: QUESTION */}
                  <div
                    className="absolute inset-0 rounded-[2.25rem] bg-gradient-to-br from-slate-900 via-gray-900 to-indigo-950/90 border-2 border-indigo-500/30 shadow-2xl p-6 sm:p-10 flex flex-col justify-between text-center"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                        <BrainCircuit size={22} />
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Question
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); speakText(currentCard.question); }}
                        className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                        title="Read Question Aloud"
                      >
                        <Volume2 size={18} />
                      </button>
                    </div>

                    <div className="my-auto py-4 overflow-y-auto hide-scrollbar">
                      <p className="text-lg sm:text-2xl font-black leading-snug text-white tracking-tight">
                        {currentCard.question}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-center gap-2 text-indigo-300 text-xs font-black uppercase tracking-widest">
                      <Sparkles size={14} className="animate-pulse" />
                      <span>Tap to reveal solution</span>
                    </div>
                  </div>

                  {/* BACK: ANSWER */}
                  <div
                    className="absolute inset-0 rounded-[2.25rem] bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 border-2 border-emerald-400/50 shadow-2xl p-6 sm:p-10 flex flex-col justify-between text-center text-white"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
                        <CheckCircle size={22} />
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/25 text-emerald-200 border border-emerald-500/30">
                        Solution Correct
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); speakText(currentCard.answer); }}
                        className="w-10 h-10 rounded-2xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all"
                        title="Read Solution Aloud"
                      >
                        <Volume2 size={18} />
                      </button>
                    </div>

                    <div className="my-auto py-4 overflow-y-auto hide-scrollbar">
                      <p className="text-base sm:text-xl font-bold leading-relaxed text-white drop-shadow-sm">
                        {currentCard.answer}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/20 flex items-center justify-center gap-2 text-emerald-200 text-xs font-black uppercase tracking-widest">
                      <CheckCircle2 size={14} />
                      <span>Tap anywhere to flip back</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Bottom Tactile Controls */}
              <div className="w-full flex items-center justify-between gap-3 mt-6">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="h-14 px-5 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all border border-white/10"
                >
                  <ChevronLeft size={20} strokeWidth={2.5} />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <button
                  onClick={() => setFlipped(prev => !prev)}
                  className="h-14 px-6 rounded-2xl bg-indigo-600/60 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all border border-indigo-400/40 shadow-lg"
                >
                  <RotateCcw size={16} />
                  <span>Flip Card</span>
                </button>

                <button
                  onClick={handleNext}
                  className="h-14 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all shadow-xl shadow-indigo-600/30"
                >
                  <span>{currentIndex >= activeSet.cards.length - 1 ? 'Finish' : 'Next'}</span>
                  <ChevronRight size={20} strokeWidth={2.5} />
                </button>
              </div>

              {/* Keyboard Shortcut Hint */}
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-4 text-center hidden sm:block">
                Press <span className="text-gray-300 font-mono font-bold">Space</span> to flip &bull; <span className="text-gray-300 font-mono font-bold">&larr; / &rarr;</span> for navigation &bull; <span className="text-gray-300 font-mono font-bold">Esc</span> to exit
              </div>
            </div>
          ) : (
            /* Study Complete View */
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-b from-gray-900 to-slate-950 border-2 border-indigo-500/30 rounded-[2.5rem] p-8 sm:p-12 text-center max-w-lg w-full shadow-2xl"
            >
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                <GraduationCap size={44} />
              </div>

              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-1">
                Deck Completed
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
                Outstanding Mastery!
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed mb-6">
                You have reviewed all <span className="font-bold text-white">{activeSet.cards.length} cards</span> in <span className="font-bold text-indigo-400">{activeSet.name}</span>.
              </p>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 mb-8 text-center">
                <div>
                  <span className="text-2xl font-black text-white block">{activeSet.cards.length}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Cards</span>
                </div>
                <div>
                  <span className="text-2xl font-black text-emerald-400 block">{masteredCards.size}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Marked Mastered</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setCurrentIndex(0);
                    setFlipped(false);
                    setIsCompleted(false);
                  }}
                  className="flex-1 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-600/30"
                >
                  <RotateCcw size={16} />
                  <span>Review Again</span>
                </button>
                <button
                  onClick={exitStudySession}
                  className="flex-1 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-widest active:scale-95 transition-all border border-white/10"
                >
                  Return to Library
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER CLEAN FLASHCARDS LIBRARY (LISTING)
  // (NO OPENED FLASHCARD AT THE BOTTOM!)
  // ==========================================
  return (
    <div className={`absolute inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-slate-50 text-slate-800'} animate-in slide-in-from-right duration-300`}>
      
      {/* Top Header */}
      <div className={`${theme === 'dark' ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90 border-slate-200 shadow-sm'} backdrop-blur-xl pt-4 pb-3 px-5 sm:px-8 flex items-center justify-between shrink-0 z-10 border-b`}>
        <div className="flex items-center">
          <button 
            onClick={onBack} 
            className={`w-10 h-10 ${theme === 'dark' ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} rounded-2xl flex items-center justify-center shrink-0 active:scale-90 transition-transform`}
          >
            <ChevronLeft size={24} strokeWidth={3} />
          </button>
          <div className="ml-4">
            <h2 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-lg leading-tight uppercase tracking-tight`}>
              Exam Flashcards
            </h2>
            <p className="text-[10px] text-indigo-500 font-extrabold uppercase tracking-widest mt-0.5">
              MANEB / JCE Syllabus Prep
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => { setShowGenerate(true); setGenerateError(''); }} 
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-4 py-2.5 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all shrink-0"
        >
          <Sparkles size={14} className="text-indigo-200" />
          <span>Ask AI Creator</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full hide-scrollbar">
        
        {/* Search & Subject Filters Bar */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-xl">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, subject or keywords (e.g. Biology, Newton, Soil)..."
              className={`w-full py-3.5 pl-12 pr-4 rounded-2xl border text-sm font-semibold outline-none transition-all ${
                theme === 'dark' 
                  ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-500 focus:border-indigo-500' 
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 shadow-sm'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-4 text-xs font-bold text-gray-400 hover:text-gray-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Subject Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {subjects.map((subj) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 border ${
                  selectedSubject === subj
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                    : theme === 'dark'
                    ? 'bg-gray-900 text-gray-400 border-gray-800 hover:bg-gray-800 hover:text-white'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        {/* Header Stats & Section Title */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-indigo-500" />
            <h3 className={`text-sm font-black uppercase tracking-wider ${theme === 'dark' ? 'text-gray-200' : 'text-slate-800'}`}>
              Available Study Decks
            </h3>
          </div>
          <span className="text-xs font-bold text-gray-400">
            {filteredSets.length} {filteredSets.length === 1 ? 'Deck' : 'Decks'}
          </span>
        </div>

        {/* Flashcards Grid (Pure Clean Cards - No Open Viewer Below) */}
        {loading ? (
          <div className="text-center py-24 text-gray-500 flex flex-col items-center justify-center">
            <Loader2 size={32} className="text-indigo-500 animate-spin mb-4" />
            <p className="font-bold text-xs uppercase tracking-widest">Loading study library...</p>
          </div>
        ) : filteredSets.length === 0 ? (
          <div className={`text-center py-20 px-6 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900/50 border-gray-800 text-gray-400' : 'bg-white border-slate-200 text-slate-600'} shadow-sm`}>
            <BookOpen size={40} className="mx-auto mb-4 text-indigo-500 opacity-60" />
            <h4 className="text-base font-bold mb-1">No matching study decks found</h4>
            <p className="text-xs text-gray-400 max-w-md mx-auto mb-6">
              Create a custom curriculum deck in seconds by tapping the "Ask AI Creator" button!
            </p>
            <button
              onClick={() => { setShowGenerate(true); setGenerateError(''); }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-2xl shadow-md active:scale-95 transition-all"
            >
              Generate AI Flashcards
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-16">
            {filteredSets.map((set, i) => (
              <motion.div
                key={set.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => startStudySession(set)}
                className={`group relative rounded-[2rem] p-6 border text-left cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between ${
                  theme === 'dark'
                    ? 'bg-gradient-to-b from-gray-900 to-gray-950 border-gray-800 hover:border-indigo-500/50 shadow-lg'
                    : 'bg-white border-slate-200 hover:border-indigo-400 shadow-sm'
                }`}
              >
                {/* Top Tags */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' 
                        : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                    }`}>
                      {set.subject || set.tag || 'Curriculum'}
                    </span>

                    <span className="text-[11px] font-mono font-bold text-gray-400 flex items-center gap-1">
                      <Layers size={12} className="text-indigo-500" />
                      {set.cards.length} Cards
                    </span>
                  </div>

                  <h4 className={`text-base font-black leading-snug tracking-tight mb-2 group-hover:text-indigo-400 transition-colors ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {set.name}
                  </h4>

                  {/* Sample Question Preview */}
                  {set.cards[0] && (
                    <div className={`p-3 rounded-xl mb-4 text-xs font-medium line-clamp-2 border ${
                      theme === 'dark' ? 'bg-gray-950/60 border-gray-800/80 text-gray-400' : 'bg-slate-50 border-slate-100 text-slate-600'
                    }`}>
                      <span className="text-indigo-500 font-bold mr-1">Q:</span>
                      "{set.cards[0].question}"
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800/80 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                      <Play size={14} className="ml-0.5 fill-white" />
                    </span>
                    <span className="text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
                      Tap to Study
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleShareSet(e, set)}
                    title="Share Deck"
                    className={`p-2 rounded-xl border transition-all ${
                      theme === 'dark'
                        ? 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'
                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {shareFeedback === set.id ? (
                      <CheckCircle2 size={15} className="text-emerald-500" />
                    ) : (
                      <Share2 size={15} />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>

      {/* Ask AI Generator Modal */}
      <AnimatePresence>
        {showGenerate && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-0 animate-in fade-in duration-200">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'} w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 border shadow-2xl relative overflow-hidden`}
            >
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black leading-tight uppercase tracking-widest">
                      AI Deck Creator
                    </h3>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-500 mt-0.5">
                      MANEB & JCE Curriculum Aligned
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowGenerate(false)} 
                  className={`text-gray-400 hover:text-white ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-slate-100 hover:bg-slate-200'} rounded-full p-2`}
                >
                  <X size={18} />
                </button>
              </div>

              <div className={`p-4 rounded-2xl mb-5 ${theme === 'dark' ? 'bg-indigo-950/20 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'} border`}>
                <p className="text-xs font-semibold leading-relaxed text-indigo-400">
                  💡 Type any Malawian school topic (e.g. <strong>Photosynthesis</strong>, <strong>Acids and Bases</strong>, <strong>Democracy in Malawi</strong>) and our AI will build an exam-ready 5-card study deck!
                </p>
              </div>

              {generateError && (
                <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold text-center">
                  {generateError}
                </div>
              )}

              <form onSubmit={handleGenerate} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                    Study Topic Name
                  </label>
                  <input 
                    type="text" 
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Chemical Equations, Plant Tissues, Electric Circuits" 
                    className={`w-full ${theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} border-2 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:border-indigo-500 transition-colors shadow-inner`}
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={generating || !topic.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-95"
                >
                  {generating ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-white" />
                      <span>Compiling Exam Deck...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Generate & Open Deck</span>
                    </>
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
