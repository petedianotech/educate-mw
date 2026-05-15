import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, BrainCircuit, CheckCircle, Share2, Plus, X, Loader2, Sparkles, ChevronRight
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function FlashcardsView({ onBack }: { onBack: () => void }) {
  const [flipped, setFlipped] = useState(false);
  const [currentSetId, setCurrentSetId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  const [flashcardSets, setFlashcardSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showGenerate, setShowGenerate] = useState(false);
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'flashcards'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const sets: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if(sets.length === 0) {
            // Mock ones
            sets.push({
                id: 'mock1',
                name: 'Biology Basics',
                cards: [
                    { question: "What is the powerhouse of the cell?", answer: "Mitochondria" },
                    { question: "Which part of the plant carries out photosynthesis?", answer: "Chloroplast (in Leaves)" },
                    { question: "What is the basic unit of life?", answer: "The Cell" }
                ]
            });
        }
        setFlashcardSets(sets);
        if(!currentSetId && sets.length > 0) {
            setCurrentSetId(sets[0].id);
        }
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const currentSet = flashcardSets.find(s => s.id === currentSetId) || flashcardSets[0];
  const currentCards = currentSet?.cards || [];

  const handleGenerate = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!topic.trim()) return;
      setGenerating(true);
      
      try {
         const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: `Generate 5 flashcards about: ${topic}. Return ONLY a JSON array with objects containing 'question' and 'answer' strings. No markdown, no text outside the JSON array.`,
             config: {
                 responseMimeType: 'application/json',
             }
         });

         const text = response.text;
         if (!text) throw new Error("No response generated.");
         
         const generatedCards = JSON.parse(text);
         
         await addDoc(collection(db, 'flashcards'), {
             name: topic,
             cards: generatedCards,
             createdAt: serverTimestamp()
         });
         
         setTopic('');
         setShowGenerate(false);
         // Find the newly generated set naturally via snapshot or select top
      } catch(err) {
         console.error(err);
         alert("Failed to generate flashcards. Please try again.");
      } finally {
          setGenerating(false);
      }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-gray-950 animate-in slide-in-from-right duration-300">
      {/* Fixed Header */}
      <div className="bg-gray-900/90 backdrop-blur-xl pt-14 pb-4 px-5 flex items-center justify-between shrink-0 z-10 border-b border-gray-800 shadow-xl">
        <div className="flex items-center">
            <button onClick={onBack} className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform text-white">
              <ChevronLeft size={24} strokeWidth={3} />
            </button>
            <div className="ml-4">
               <h2 className="font-black text-white text-lg leading-tight uppercase tracking-tight">Flashcards</h2>
               <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Master your knowledge</p>
            </div>
        </div>
        <button onClick={() => setShowGenerate(true)} className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform text-white shadow-lg shadow-indigo-600/20">
           <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Set Selector */}
        <div className="px-5 pt-8 flex gap-3 shrink-0 z-20 overflow-x-auto hide-scrollbar pb-2">
           {flashcardSets.map((set, i) => (
             <button 
               key={set.id}
               onClick={() => { setCurrentSetId(set.id); setIndex(0); setFlipped(false); }}
               className={`shrink-0 px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all border-2 ${currentSetId === set.id ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/20' : 'bg-gray-900 text-gray-500 border-gray-800'}`}
             >
               {set.name}
             </button>
           ))}
        </div>

        {/* Card Area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24 relative">
          {loading ? (
             <Loader2 size={32} className="animate-spin text-indigo-500 mt-20" />
          ) : currentCards.length > 0 ? (
              <>
                 <div className="mb-8 flex items-center gap-1.5 bg-gray-900/50 px-3 py-1 rounded-full border border-gray-800">
                    <div className="flex gap-1 overflow-hidden max-w-full">
                      {currentCards.map((_: any, i: number) => (
                        <div key={i} className={`h-1 rounded-full transition-all duration-300 shrink-0 ${i === index ? 'w-4 bg-indigo-500' : 'w-1 bg-gray-700'}`}></div>
                      ))}
                    </div>
                 </div>

                 <div className="w-full max-w-sm relative" style={{ perspective: '1200px' }} onClick={() => setFlipped(!flipped)}>
                   <div className="w-full aspect-[3.5/5] relative transition-all duration-700 cursor-pointer" style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                     {/* Front */}
                     <div className="absolute inset-0 bg-gray-900 rounded-[40px] shadow-2xl border-2 border-gray-800 flex flex-col items-center justify-center p-8 xs:p-12 text-center" style={{ backfaceVisibility: 'hidden' }}>
                       <div className="absolute top-6 left-6 xs:top-8 xs:left-8 w-10 h-10 xs:w-12 xs:h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                          <BrainCircuit size={20} className="xs:w-6 xs:h-6" />
                       </div>
                       <div className="absolute top-8 right-8 xs:top-10 xs:right-10 flex items-center gap-1 bg-gray-800/50 px-2 py-0.5 rounded-lg border border-gray-700">
                          <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Question</span>
                       </div>

                       <div className="flex-1 flex flex-col items-center justify-center pt-8">
                         <h3 className="text-xl xs:text-2xl font-black text-white leading-tight tracking-tight mb-6">{currentCards[index].question}</h3>
                         <div className="flex items-center gap-3 bg-indigo-500/5 px-4 py-2 rounded-2xl border border-indigo-500/10 active:scale-95 transition-transform group">
                           <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Show Answer</span>
                           <Share2 size={12} className="text-indigo-400 rotate-90" />
                         </div>
                       </div>

                       <div className="mt-8 text-[8px] xs:text-[9px] font-bold text-gray-600 uppercase tracking-[0.3em]">
                          Tap to Flip
                       </div>
                     </div>

                     {/* Back */}
                     <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-[40px] shadow-2xl shadow-indigo-600/30 flex flex-col items-center justify-center p-8 xs:p-12 text-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                       <div className="absolute top-6 left-6 xs:top-8 xs:left-8 w-10 h-10 xs:w-12 xs:h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white border border-white/20 backdrop-blur-md">
                          <CheckCircle size={20} className="xs:w-6 xs:h-6" />
                       </div>
                       
                       <div className="flex-1 flex flex-col items-center justify-center pt-8">
                         <div className="mb-4 xs:mb-6 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                            <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Correct Solution</span>
                         </div>
                         <h3 className="text-2xl xs:text-3xl font-black leading-tight drop-shadow-xl text-white tracking-tight">{currentCards[index].answer}</h3>
                       </div>

                       <div className="mt-8 text-[8px] xs:text-[9px] font-black text-white/50 uppercase tracking-[0.3em]">
                          Tap to go back
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 {/* Controls - Fixed at Bottom */}
                 <div className="mt-8 xs:mt-12 flex items-center gap-4 xs:gap-6 w-full max-w-xs">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setFlipped(false); setTimeout(() => setIndex(Math.max(0, index - 1)), 150); }}
                      disabled={index === 0}
                      className="w-14 h-14 xs:w-16 xs:h-16 bg-gray-900 text-gray-400 rounded-2xl flex items-center justify-center border-2 border-gray-800 disabled:opacity-20 active:scale-90 transition-all shadow-xl shadow-black hover:border-gray-700 shrink-0"
                    >
                       <ChevronLeft size={24} strokeWidth={3} className="xs:w-7 xs:h-7" />
                    </button>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); setFlipped(false); setTimeout(() => setIndex(Math.min(currentCards.length - 1, index + 1)), 150); }}
                      disabled={index === currentCards.length - 1}
                      className="flex-1 h-14 xs:h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center border-2 border-indigo-500 disabled:opacity-50 active:scale-95 transition-all shadow-xl shadow-indigo-600/30 gap-2 xs:gap-3"
                    >
                       <span className="font-black uppercase tracking-widest text-[10px] xs:text-[11px]">{index === currentCards.length - 1 ? 'Finished' : 'Next Card'}</span>
                       <ChevronRight size={18} strokeWidth={4} className="xs:w-5 xs:h-5" />
                    </button>
                 </div>
              </>
          ) : (
              <div className="text-center opacity-50 flex flex-col items-center mt-20">
                 <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                     <BrainCircuit size={32} className="text-gray-500" />
                 </div>
                 <p className="text-white font-black">No cards found in this set</p>
              </div>
          )}
        </div>
      </div>

      {/* Generate Modal */}
      {showGenerate && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-0 animate-in fade-in duration-200">
           <div className="bg-gray-900 w-full max-w-md rounded-[2.5rem] p-8 border border-gray-800 shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-8">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white leading-tight uppercase tracking-tight">AI Generate</h3>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 mt-0.5">Create new flashcards</p>
                    </div>
                 </div>
                 <button onClick={() => setShowGenerate(false)} className="text-gray-500 hover:text-white bg-gray-800 rounded-full p-2"><X size={20} /></button>
              </div>

              <form onSubmit={handleGenerate}>
                  <div className="mb-6">
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Topic or Subject</label>
                      <input 
                          type="text" 
                          required
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="e.g., Photosynthesis, World War 2" 
                          className="w-full bg-gray-950 border-2 border-gray-800 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-indigo-500 transition-colors"
                      />
                  </div>
                  <button 
                      type="submit" 
                      disabled={generating || !topic.trim()}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
                  >
                      {generating ? (
                          <><Loader2 size={16} className="animate-spin" /> Generating...</>
                      ) : (
                          <>Generate Flashcards</>
                      )}
                  </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
