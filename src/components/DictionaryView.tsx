import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ChevronLeft,
  Volume2,
  VolumeX,
  Star,
  Bookmark,
  History,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  RotateCcw,
  WifiOff,
  Cloud,
  ArrowRight,
  Trash2,
  Layers,
  AlertCircle,
  Share2,
} from 'lucide-react';
import {
  NormalizedDictionaryEntry,
  WordOfTheDayInfo,
} from '../types/dictionary';
import {
  lookupWord,
  getWordOfTheDay,
  getSavedWords,
  toggleFavoriteWord,
  isWordSaved,
  getRecentSearchesList,
  clearAllRecentSearches,
  normalizeSearchWord,
} from '../services/dictionaryService';
import { ACADEMIC_DICTIONARY, POPULAR_DICTIONARY_WORDS } from '../data/academicDictionary';

interface DictionaryViewProps {
  onBack: () => void;
  theme: 'light' | 'dark';
}

type TabType = 'search' | 'saved' | 'recent' | 'curriculum';

const CURRICULUM_SUBJECTS = [
  'All',
  'Biology',
  'Physics',
  'Chemistry',
  'Mathematics',
  'English',
  'Geography',
  'Agriculture',
  'History',
];

export function DictionaryView({ onBack, theme }: DictionaryViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<NormalizedDictionaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedWords, setSavedWords] = useState<NormalizedDictionaryEntry[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [wordOfTheDay, setWordOfTheDay] = useState<WordOfTheDayInfo | null>(null);
  const [savedSearchQuery, setSavedSearchQuery] = useState('');

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load initial data (Saved words, recent searches)
  useEffect(() => {
    // Pre-trigger Web Speech Synthesis voice loading
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }

    // 2. Recent searches
    setRecentSearches(getRecentSearchesList());

    // 3. Saved words from IndexedDB
    getSavedWords().then((list) => {
      setSavedWords(list);
    }).catch(() => {});

    // 4. Initial default result from last search or photosynthesis
    const lastWord = localStorage.getItem('mw_dict_last_word') || 'photosynthesis';
    performSearch(lastWord, false);
  }, []);

  // Check if current result is bookmarked
  useEffect(() => {
    if (result) {
      isWordSaved(result.normalizedWord).then((saved) => {
        setIsSaved(saved);
      });
    }
  }, [result]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Main search handler
  const performSearch = async (searchTerm: string, switchTab = true) => {
    const cleanWord = normalizeSearchWord(searchTerm);
    if (!cleanWord) return;

    if (switchTab) {
      setActiveTab('search');
    }

    setQuery(searchTerm);
    setLoading(true);
    setError(null);

    // Stop existing audio
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    setIsPlayingAudio(false);

    try {
      localStorage.setItem('mw_dict_last_word', cleanWord);
    } catch {}

    try {
      const entry = await lookupWord(searchTerm);
      setResult(entry);
      // Refresh recent searches list
      setRecentSearches(getRecentSearchesList());
    } catch (err: any) {
      console.warn('Dictionary search failed:', err);
      setError(err?.message || 'Could not find a definition. Please check spelling and try again.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      performSearch(query);
    }
  };

  const handleChipClick = (word: string) => {
    setQuery(word);
    performSearch(word);
  };

  // Audio Pronunciation logic: prefer actual audio URL, fallback to SpeechSynthesis
  const handlePlayPronunciation = () => {
    if (!result) return;

    // Stop current audio if playing
    if (isPlayingAudio) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);

    // 1. Try real audio URL if available (convert HTTP to HTTPS to bypass Mixed Content restrictions)
    if (result.audioUrl) {
      try {
        const secureAudioUrl = result.audioUrl.startsWith('http://')
          ? result.audioUrl.replace('http://', 'https://')
          : result.audioUrl;

        const audio = new Audio(secureAudioUrl);
        activeAudioRef.current = audio;

        audio.onended = () => {
          setIsPlayingAudio(false);
          activeAudioRef.current = null;
        };

        audio.onerror = () => {
          console.warn('Audio URL playback failed, falling back to speech synthesis');
          activeAudioRef.current = null;
          fallbackSpeechSynthesis(result.word);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Audio play promise rejected, using fallback TTS:', err);
            activeAudioRef.current = null;
            fallbackSpeechSynthesis(result.word);
          });
        }
        return;
      } catch (audioErr) {
        console.warn('Audio init error, using speech synthesis fallback:', audioErr);
        activeAudioRef.current = null;
        fallbackSpeechSynthesis(result.word);
      }
    } else {
      // 2. Fallback to Web Speech Synthesis
      fallbackSpeechSynthesis(result.word);
    }
  };

  const fallbackSpeechSynthesis = (wordToSpeak: string) => {
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('Web Speech Synthesis is not supported in this browser.');
        setIsPlayingAudio(false);
        return;
      }

      window.speechSynthesis.cancel();

      // Small delay to let cancel clear the queue
      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(wordToSpeak);
          utterance.pitch = 1.0;
          utterance.rate = 0.95;

          // Find the best available English voice
          const voices = window.speechSynthesis.getVoices();
          const enVoice = voices.find(
            (v) =>
              v.lang.startsWith('en') &&
              (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('US') || v.name.includes('UK'))
          ) || voices.find((v) => v.lang.startsWith('en'));

          if (enVoice) {
            utterance.voice = enVoice;
          }

          utterance.onend = () => {
            setIsPlayingAudio(false);
          };
          utterance.onerror = (evt) => {
            console.warn('Speech synthesis utterance error:', evt);
            setIsPlayingAudio(false);
          };

          window.speechSynthesis.speak(utterance);
        } catch (innerErr) {
          console.warn('SpeechSynthesisUtterance creation/playback failed:', innerErr);
          setIsPlayingAudio(false);
        }
      }, 50);
    } catch (e) {
      console.warn('Speech synthesis fallback error:', e);
      setIsPlayingAudio(false);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async () => {
    if (!result) return;
    const nextState = await toggleFavoriteWord(result);
    setIsSaved(nextState);

    // Refresh saved words list
    const updated = await getSavedWords();
    setSavedWords(updated);
  };

  // Copy definition to clipboard
  const handleCopyDefinition = () => {
    if (!result) return;
    const firstDef = result.meanings[0]?.definitions[0]?.definition || '';
    const textToCopy = `${result.word} (${result.phonetic || ''})\n${firstDef}\n\n— Educate MW Academic Dictionary`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  // Clear search history
  const handleClearHistory = () => {
    clearAllRecentSearches();
    setRecentSearches([]);
  };

  // Filtered curriculum words
  const curriculumWords =
    selectedSubject === 'All'
      ? POPULAR_DICTIONARY_WORDS
      : Object.values(ACADEMIC_DICTIONARY)
          .filter((entry) => (entry.subject || '').toLowerCase().includes(selectedSubject.toLowerCase()))
          .map((e) => e.word);

  // Filtered saved words
  const filteredSavedWords = savedWords.filter((entry) => {
    if (!savedSearchQuery.trim()) return true;
    const q = savedSearchQuery.toLowerCase();
    return (
      entry.word.toLowerCase().includes(q) ||
      (entry.subject || '').toLowerCase().includes(q) ||
      entry.meanings.some((m) => m.definitions.some((d) => d.definition.toLowerCase().includes(q)))
    );
  });

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col ${
        theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-slate-50 text-slate-900'
      } animate-in slide-in-from-right duration-300 select-text`}
    >
      {/* Top Header */}
      <header
        className={`${
          theme === 'dark' ? 'bg-gray-900/90 border-gray-800 text-white' : 'bg-white/90 border-slate-200 text-slate-900'
        } backdrop-blur-xl pt-4 pb-3 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 border-b shadow-sm`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Back to previous screen"
            className={`w-10 h-10 ${
              theme === 'dark' ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            } rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition-transform`}
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg sm:text-xl leading-tight uppercase tracking-tight">
                Academic Dictionary
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                Offline-First
              </span>
            </div>
            <p className="text-[11px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider mt-0.5">
              MSCE & JCE Syllabus Lexicon
            </p>
          </div>
        </div>

        {/* Quick Tabs Pill Menu */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/80 p-1 rounded-2xl border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'search'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white'
            }`}
          >
            <Search size={14} />
            <span className="hidden xs:inline">Search</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'saved'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white'
            }`}
          >
            <Star size={14} className={savedWords.length > 0 ? 'fill-amber-400 text-amber-400' : ''} />
            <span className="hidden xs:inline">Saved</span>
            {savedWords.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-indigo-500/20 text-indigo-400">
                {savedWords.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('recent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'recent'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white'
            }`}
          >
            <History size={14} />
            <span className="hidden xs:inline">History</span>
          </button>

          <button
            onClick={() => setActiveTab('curriculum')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'curriculum'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span className="hidden xs:inline">Topics</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 pt-5 pb-20 max-w-4xl mx-auto w-full space-y-6">
        {/* Persistent Search Input */}
        <form
          onSubmit={handleSearchSubmit}
          className={`${
            theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'
          } rounded-[2rem] px-4 sm:px-5 py-2.5 sm:py-3 flex items-center border transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 group`}
        >
          <Search
            className="text-gray-400 mr-2.5 sm:mr-3 group-focus-within:text-indigo-500 transition-colors shrink-0"
            size={20}
            strokeWidth={2.5}
          />
          <input
            type="text"
            placeholder="Search any English or academic word (e.g. Osmosis, Mitosis, Entropy)..."
            className={`bg-transparent outline-none flex-1 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            } text-sm sm:text-base font-medium placeholder-gray-400`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          {query.trim() && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-bold mr-2 px-2 py-1 rounded-lg"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            disabled={!query.trim() || loading}
            aria-label="Search dictionary"
            className="bg-indigo-600 hover:bg-indigo-700 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform disabled:opacity-30 shrink-0"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowRight size={18} strokeWidth={3} />
            )}
          </button>
        </form>

        {/* TAB 1: SEARCH & RESULT VIEW */}
        {activeTab === 'search' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Loading Skeleton */}
            {loading && (
              <div
                className={`${
                  theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'
                } rounded-[28px] p-6 sm:p-8 border space-y-6 animate-pulse`}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-3">
                    <div className="h-8 w-48 bg-gray-300 dark:bg-gray-800 rounded-xl" />
                    <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800/60 rounded-md" />
                  </div>
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
                </div>
                <div className="space-y-3 pt-4">
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-800/80 rounded-md" />
                  <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800/60 rounded-md" />
                  <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-800/40 rounded-md" />
                </div>
              </div>
            )}

            {/* Error Message & Friendly Offline Guidance */}
            {error && !loading && (
              <div
                className={`p-5 rounded-3xl border flex items-start gap-3.5 ${
                  error.includes('offline')
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}
              >
                {error.includes('offline') ? (
                  <WifiOff size={22} className="shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={22} className="shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-1">
                  <h4 className="font-bold text-sm leading-snug">
                    {error.includes('offline') ? 'Offline Mode' : 'Word Search Notice'}
                  </h4>
                  <p className="text-xs opacity-90 leading-relaxed">{error}</p>
                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => performSearch(query || 'photosynthesis')}
                      className="px-3 py-1 rounded-xl text-xs font-bold bg-white/20 dark:bg-black/20 hover:bg-white/30 flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw size={12} /> Try Again
                    </button>
                    {POPULAR_DICTIONARY_WORDS.slice(0, 4).map((pw) => (
                      <button
                        key={pw}
                        onClick={() => handleChipClick(pw)}
                        className="px-2.5 py-1 rounded-xl text-xs font-medium border border-current/20 hover:bg-current/10 capitalize"
                      >
                        {pw}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Result Display */}
            {result && !loading && (
              <article
                className={`${
                  theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'
                } rounded-[28px] p-6 sm:p-8 border space-y-6 transition-all`}
              >
                {/* Result Header & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2
                        className={`text-3xl sm:text-4xl font-black ${
                          theme === 'dark' ? 'text-white' : 'text-slate-900'
                        } tracking-tight capitalize`}
                      >
                        {result.word}
                      </h2>

                      {result.subject && (
                        <span className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                          {result.subject}
                        </span>
                      )}

                      {result.isOfflineCached && (
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Cloud size={10} /> Saved Offline
                        </span>
                      )}
                    </div>

                    {result.phonetic && (
                      <p className="text-sm text-indigo-600 dark:text-indigo-400 font-bold tracking-wide font-mono">
                        {result.phonetic}
                      </p>
                    )}
                  </div>

                  {/* Top Action Buttons (Audio, Favorite, Copy) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handlePlayPronunciation}
                      title={isPlayingAudio ? 'Stop pronunciation' : 'Listen to pronunciation'}
                      aria-label="Listen to pronunciation"
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all active:scale-95 shadow-md ${
                        isPlayingAudio
                          ? 'bg-emerald-600 text-white animate-pulse'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {isPlayingAudio ? <VolumeX size={22} /> : <Volume2 size={22} />}
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleFavorite}
                      title={isSaved ? 'Remove from saved words' : 'Save word for offline'}
                      aria-label="Save word"
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold border transition-all active:scale-95 ${
                        isSaved
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                          : theme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Star size={22} className={isSaved ? 'fill-amber-500' : ''} />
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyDefinition}
                      title="Copy definition"
                      aria-label="Copy definition"
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold border transition-all active:scale-95 ${
                        copied
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                          : theme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {copied ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                  </div>
                </div>

                {/* Meanings Section */}
                <div className="space-y-6">
                  {result.meanings.map((meaning, mIdx) => (
                    <div key={mIdx} className="space-y-3.5">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm uppercase tracking-wider font-mono px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                          {meaning.partOfSpeech}
                        </span>
                        <div
                          className={`h-px ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-200'} flex-1`}
                        />
                      </div>

                      <div className="space-y-4">
                        {meaning.definitions.map((def, dIdx) => (
                          <div
                            key={dIdx}
                            className={`p-4 rounded-2xl border-l-4 border-indigo-500 ${
                              theme === 'dark'
                                ? 'bg-gray-800/40 border-y border-r border-gray-800'
                                : 'bg-slate-50/80 border-y border-r border-slate-200'
                            } space-y-2`}
                          >
                            <p
                              className={`text-base sm:text-lg font-semibold leading-relaxed ${
                                theme === 'dark' ? 'text-gray-100' : 'text-slate-900'
                              }`}
                            >
                              {def.definition}
                            </p>

                            {/* Example Sentence */}
                            {def.example && (
                              <div
                                className={`mt-2 p-3 rounded-xl text-xs sm:text-sm leading-relaxed border ${
                                  theme === 'dark'
                                    ? 'bg-indigo-950/40 text-indigo-200 border-indigo-900/40'
                                    : 'bg-indigo-50 text-indigo-900 border-indigo-100'
                                }`}
                              >
                                <span className="text-[10px] uppercase font-black tracking-wider text-indigo-500 block mb-0.5">
                                  Usage Example
                                </span>
                                &ldquo;{def.example}&rdquo;
                              </div>
                            )}

                            {/* Definition specific synonyms */}
                            {def.synonyms && def.synonyms.length > 0 && (
                              <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                  Similar:
                                </span>
                                {def.synonyms.slice(0, 4).map((s, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleChipClick(s)}
                                    className="px-2 py-0.5 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition-colors"
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Synonyms section */}
                  {result.synonyms && result.synonyms.length > 0 && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
                        Synonyms & Related Concepts ({result.synonyms.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.synonyms.map((syn, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => handleChipClick(syn)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                              theme === 'dark'
                                ? 'bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700 hover:text-white'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600'
                            }`}
                          >
                            {syn}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Antonyms section */}
                  {result.antonyms && result.antonyms.length > 0 && (
                    <div className="pt-3 space-y-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-rose-500 dark:text-rose-400">
                        Antonyms ({result.antonyms.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.antonyms.map((ant, aIdx) => (
                          <button
                            key={aIdx}
                            type="button"
                            onClick={() => handleChipClick(ant)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-500/20 transition-all active:scale-95 ${
                              theme === 'dark'
                                ? 'bg-rose-950/30 text-rose-300 hover:bg-rose-900/40'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            }`}
                          >
                            {ant}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Attribution */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
                  <span>Definition source: Free Dictionary API & MSCE Lexicon</span>
                  <span className="capitalize">Source: {result.source.replace(/-/g, ' ')}</span>
                </div>
              </article>
            )}


          </div>
        )}

        {/* TAB 2: SAVED / FAVORITE WORDS */}
        {activeTab === 'saved' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-xl leading-tight">Saved & Bookmarked Words</h3>
                <p className="text-xs text-gray-400">
                  {savedWords.length} words saved for instant offline access.
                </p>
              </div>

              {savedWords.length > 0 && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filter saved words..."
                    value={savedSearchQuery}
                    onChange={(e) => setSavedSearchQuery(e.target.value)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs outline-none border ${
                      theme === 'dark'
                        ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-500'
                        : 'bg-white border-slate-200 text-slate-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              )}
            </div>

            {savedWords.length === 0 ? (
              <div
                className={`text-center py-16 rounded-3xl border border-dashed ${
                  theme === 'dark' ? 'border-gray-800 bg-gray-900/40' : 'border-slate-300 bg-white'
                } p-8 space-y-3`}
              >
                <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                  <Star size={32} />
                </div>
                <h4 className="font-bold text-base">No saved words yet</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Star important terms during your studies to review them anytime, even without an internet connection.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('search')}
                  className="px-4 py-2 rounded-2xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition-colors"
                >
                  Explore Dictionary
                </button>
              </div>
            ) : filteredSavedWords.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                No saved words matching &ldquo;{savedSearchQuery}&rdquo;.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredSavedWords.map((item) => (
                  <div
                    key={item.normalizedWord}
                    className={`p-4 rounded-2xl border transition-all ${
                      theme === 'dark'
                        ? 'bg-gray-900 border-gray-800 hover:border-gray-700'
                        : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm'
                    } flex flex-col justify-between gap-3`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h4
                          onClick={() => performSearch(item.word)}
                          className="font-black text-lg hover:text-indigo-600 cursor-pointer capitalize"
                        >
                          {item.word}
                        </h4>
                        {item.subject && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-500">
                            {item.subject}
                          </span>
                        )}
                      </div>

                      {item.phonetic && (
                        <p className="text-xs font-mono text-indigo-500 font-semibold">{item.phonetic}</p>
                      )}

                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {item.meanings[0]?.definitions[0]?.definition || item.definitions?.[0]}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                      <button
                        type="button"
                        onClick={() => performSearch(item.word)}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        View Full Definition <ArrowRight size={12} />
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await toggleFavoriteWord(item);
                          const updated = await getSavedWords();
                          setSavedWords(updated);
                          if (result?.normalizedWord === item.normalizedWord) {
                            setIsSaved(false);
                          }
                        }}
                        className="text-gray-400 hover:text-rose-500 p-1"
                        title="Remove from saved"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RECENT SEARCHES */}
        {activeTab === 'recent' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-xl leading-tight">Recent Searches</h3>
                <p className="text-xs text-gray-400">Your recent search query history stored locally.</p>
              </div>

              {recentSearches.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-500/20 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 size={13} /> Clear History
                </button>
              )}
            </div>

            {recentSearches.length === 0 ? (
              <div
                className={`text-center py-16 rounded-3xl border border-dashed ${
                  theme === 'dark' ? 'border-gray-800 bg-gray-900/40' : 'border-slate-300 bg-white'
                } p-8 space-y-2`}
              >
                <History size={36} className="text-gray-400 mx-auto" />
                <h4 className="font-bold text-base">No search history yet</h4>
                <p className="text-xs text-gray-400">Words you search will appear here for quick access.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSearches.map((term, idx) => (
                  <div
                    key={idx}
                    onClick={() => performSearch(term)}
                    className={`px-4 py-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all active:scale-[0.99] ${
                      theme === 'dark'
                        ? 'bg-gray-900 border-gray-800 hover:border-gray-700 hover:bg-gray-800/50'
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Search size={16} className="text-gray-400" />
                      <span className="font-bold text-sm capitalize">{term}</span>
                    </div>
                    <ArrowRight size={14} className="text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CURRICULUM TOPICS LEXICON */}
        {activeTab === 'curriculum' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h3 className="font-black text-xl leading-tight">Curriculum Categories</h3>
              <p className="text-xs text-gray-400">Browse core syllabus vocabulary by subject.</p>
            </div>

            {/* Subject Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
              {CURRICULUM_SUBJECTS.map((subject) => {
                const isSelected = selectedSubject === subject;
                return (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => setSelectedSubject(subject)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 border shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : theme === 'dark'
                        ? 'bg-gray-900 text-gray-300 border-gray-800 hover:bg-gray-800 hover:text-white'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    {subject}
                  </button>
                );
              })}
            </div>

            {/* Words Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {curriculumWords.map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => performSearch(word)}
                  className={`p-3 rounded-2xl text-left border transition-all active:scale-95 ${
                    result && result.normalizedWord === normalizeSearchWord(word)
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : theme === 'dark'
                      ? 'bg-gray-900 text-gray-200 border-gray-800 hover:border-gray-700'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300 shadow-sm'
                  }`}
                >
                  <span className="block font-bold text-xs capitalize truncate">{word}</span>
                  {ACADEMIC_DICTIONARY[normalizeSearchWord(word)]?.subject && (
                    <span className="text-[10px] opacity-70 block truncate mt-0.5">
                      {ACADEMIC_DICTIONARY[normalizeSearchWord(word)].subject}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
