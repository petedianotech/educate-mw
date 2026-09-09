import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  Circle,
  Sparkles,
  BookOpen,
  GraduationCap,
  Flame,
  Award,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Calculator,
  Dna,
  Atom,
  Sprout,
  Globe,
  Landmark,
  Users,
  Laptop,
  Feather,
  Copy,
  Check,
  BrainCircuit,
  FileQuestion,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  SYLLABUS_TOPICS,
  SUBJECTS_META,
  SyllabusTopic,
} from '../data/syllabusData';

interface StudyProgressTrackerProps {
  onBack: () => void;
  theme?: 'light' | 'dark';
  profile?: any;
  onUpdateProfile?: (updated: any) => void;
  onNavigateToEmi?: (initialPrompt?: string) => void;
}

export function StudyProgressTracker({
  onBack,
  theme = 'light',
  profile,
  onUpdateProfile,
  onNavigateToEmi,
}: StudyProgressTrackerProps) {
  const isDark = theme === 'dark';
  const userKey = profile?.uid || 'guest';

  // Persistence for completed topic IDs
  const [completedTopicIds, setCompletedTopicIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`mw_syllabus_progress_${userKey}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        `mw_syllabus_progress_${userKey}`,
        JSON.stringify(completedTopicIds)
      );
    } catch (e) {
      console.error('Failed to save syllabus progress:', e);
    }
  }, [completedTopicIds, userKey]);

  // UI Filter States
  const [selectedForm, setSelectedForm] = useState<number | 'all'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'completed' | 'uncompleted'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  // Toggle completion of a topic
  const toggleTopicCompletion = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCompletedTopicIds((prev) => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter((item) => item !== id) : [...prev, id];
      
      // Award XP when checking off new topic
      if (!exists && onUpdateProfile && profile) {
        const newXp = (profile.xp || 0) + 15;
        onUpdateProfile({ ...profile, xp: newXp });
      }
      return updated;
    });
  };

  // Reset progress
  const handleResetProgress = () => {
    if (window.confirm('Are you sure you want to reset your syllabus progress?')) {
      setCompletedTopicIds([]);
    }
  };

  // Quick Action for Emi
  const handleAskEmi = (topic: SyllabusTopic, e: React.MouseEvent) => {
    e.stopPropagation();
    const prompt = `Please teach me the Malawi syllabus topic "${topic.title}" from ${topic.unit} for Form ${topic.form}. Explain the key concepts (${topic.keyConcepts.join(', ')}) with clear step-by-step notes and exam tips.`;
    
    if (onNavigateToEmi) {
      onNavigateToEmi(prompt);
    } else {
      navigator.clipboard.writeText(prompt);
      setCopiedPromptId(topic.id);
      setTimeout(() => setCopiedPromptId(null), 2500);
    }
  };

  // Filtered topics
  const filteredTopics = useMemo(() => {
    return SYLLABUS_TOPICS.filter((topic) => {
      if (selectedForm !== 'all' && topic.form !== selectedForm) return false;
      if (selectedSubject !== 'all' && topic.subject !== selectedSubject) return false;
      
      const isCompleted = completedTopicIds.includes(topic.id);
      if (selectedStatus === 'completed' && !isCompleted) return false;
      if (selectedStatus === 'uncompleted' && isCompleted) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = topic.title.toLowerCase().includes(q);
        const matchesUnit = topic.unit.toLowerCase().includes(q);
        const matchesSubject = topic.subject.toLowerCase().includes(q);
        const matchesConcepts = topic.keyConcepts.some((c) => c.toLowerCase().includes(q));
        const matchesObjectives = topic.objectives.some((o) => o.toLowerCase().includes(q));
        return matchesTitle || matchesUnit || matchesSubject || matchesConcepts || matchesObjectives;
      }

      return true;
    });
  }, [selectedForm, selectedSubject, selectedStatus, searchQuery, completedTopicIds]);

  // Overall calculations
  const totalTopics = SYLLABUS_TOPICS.length;
  const completedTotal = completedTopicIds.length;
  const overallPercentage = totalTopics > 0 ? Math.round((completedTotal / totalTopics) * 100) : 0;

  // Form level completion
  const formStats = useMemo(() => {
    return [1, 2, 3, 4].map((formNum) => {
      const formTopics = SYLLABUS_TOPICS.filter((t) => t.form === formNum);
      const formCompleted = formTopics.filter((t) => completedTopicIds.includes(t.id)).length;
      const pct = formTopics.length > 0 ? Math.round((formCompleted / formTopics.length) * 100) : 0;
      return {
        form: formNum,
        total: formTopics.length,
        completed: formCompleted,
        percentage: pct,
      };
    });
  }, [completedTopicIds]);

  // Subject icon helper
  const renderSubjectIcon = (iconName: string, className: string = 'w-4 h-4') => {
    switch (iconName) {
      case 'Calculator':
        return <Calculator className={className} />;
      case 'Dna':
        return <Dna className={className} />;
      case 'Atom':
        return <Atom className={className} />;
      case 'Sprout':
        return <Sprout className={className} />;
      case 'BookOpen':
        return <BookOpen className={className} />;
      case 'Feather':
        return <Feather className={className} />;
      case 'Globe':
        return <Globe className={className} />;
      case 'Landmark':
        return <Landmark className={className} />;
      case 'Users':
        return <Users className={className} />;
      case 'Laptop':
        return <Laptop className={className} />;
      default:
        return <BookOpen className={className} />;
    }
  };

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col ${
        isDark ? 'bg-gray-950 text-gray-100' : 'bg-slate-50 text-slate-800'
      } animate-in slide-in-from-right duration-300 overflow-hidden select-none`}
    >
      {/* Top Sticky Header */}
      <div
        className={`${
          isDark ? 'bg-gray-900/90 border-gray-800' : 'bg-white/90 border-slate-200'
        } border-b backdrop-blur-md flex items-center justify-between py-3.5 px-4 md:px-6 shrink-0 shadow-sm z-30`}
      >
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={onBack}
            className={`w-10 h-10 rounded-xl ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            } flex items-center justify-center transition-transform active:scale-95`}
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className={`text-base md:text-lg font-black tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                } uppercase leading-none`}
              >
                Syllabus Tracker
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                MANEB Curated
              </span>
            </div>
            <p className="text-[10.5px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
              Form 1 - Form 4 Mastery Checklist
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetProgress}
            className={`p-2 rounded-xl text-xs font-bold ${
              isDark
                ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
            } transition-colors`}
            title="Reset Completed Items"
          >
            <RefreshCw size={16} />
          </button>
          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-mono text-xs font-black ${
              isDark
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            <Award size={14} />
            <span>{overallPercentage}% Done</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-5 max-w-5xl mx-auto w-full pb-28">
        
        {/* Progress Overview Card */}
        <div
          className={`p-5 rounded-3xl border ${
            isDark
              ? 'bg-gradient-to-br from-indigo-950/40 via-gray-900 to-gray-950 border-indigo-500/20'
              : 'bg-white border-slate-200 shadow-sm'
          } relative overflow-hidden`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <GraduationCap size={18} />
                </span>
                <span className="text-xs font-black uppercase tracking-widest text-indigo-500">
                  National Curriculum Progress
                </span>
              </div>
              <h2
                className={`text-xl md:text-2xl font-black tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {completedTotal} of {totalTopics} Core Topics Mastered
              </h2>
              <p className="text-xs text-gray-500 font-medium max-w-lg leading-relaxed">
                Track every unit across Form 1 through Form 4. Tick off concepts as your school covers them to prepare for the Junior Certificate (JCE) and MSCE exams.
              </p>
            </div>

            {/* Circular/Metric Visual */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex flex-col items-center">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className={isDark ? 'text-gray-800' : 'text-slate-200'}
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-indigo-600 transition-all duration-700 ease-out"
                      strokeDasharray={`${overallPercentage}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-base font-black leading-none">{overallPercentage}%</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">MSCE</span>
                  </div>
                </div>
              </div>

              {/* Quick Form Pill Status */}
              <div className="grid grid-cols-2 gap-2 text-left">
                {formStats.map((st) => (
                  <div
                    key={st.form}
                    className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 ${
                      isDark ? 'bg-gray-900 border-gray-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-gray-400">F{st.form}:</span>
                    <span className="font-mono font-black text-indigo-500">{st.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Smooth Overall Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-800 h-2.5 rounded-full mt-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics, unit titles, objectives or MANEB concepts..."
              className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-xs font-semibold ${
                isDark
                  ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-500 focus:border-indigo-500'
                  : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500'
              } outline-none transition-all shadow-sm`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-200 font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Form Class Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            <button
              onClick={() => setSelectedForm('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
                selectedForm === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : isDark
                  ? 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Forms
            </button>
            {[1, 2, 3, 4].map((formNum) => (
              <button
                key={formNum}
                onClick={() => setSelectedForm(formNum)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5 ${
                  selectedForm === formNum
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : isDark
                    ? 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>Form {formNum}</span>
                {formNum === 2 && (
                  <span className="text-[9px] px-1 py-0.2 bg-emerald-500/20 text-emerald-400 rounded">
                    JCE
                  </span>
                )}
                {formNum === 4 && (
                  <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-400 rounded">
                    MSCE
                  </span>
                )}
              </button>
            ))}

            {/* Status Selector */}
            <div className="ml-auto flex items-center gap-1.5 shrink-0">
              <button
                onClick={() =>
                  setSelectedStatus(
                    selectedStatus === 'all'
                      ? 'completed'
                      : selectedStatus === 'completed'
                      ? 'uncompleted'
                      : 'all'
                  )
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                  selectedStatus === 'completed'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    : selectedStatus === 'uncompleted'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                    : isDark
                    ? 'bg-gray-900 border-gray-800 text-gray-400'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <span>Status: {selectedStatus === 'all' ? 'All' : selectedStatus === 'completed' ? 'Completed' : 'Unfinished'}</span>
              </button>
            </div>
          </div>

          {/* Subject Horizontal Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            <button
              onClick={() => setSelectedSubject('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all ${
                selectedSubject === 'all'
                  ? 'bg-slate-800 text-white dark:bg-gray-100 dark:text-gray-900'
                  : isDark
                  ? 'bg-gray-900 text-gray-400 border border-gray-800'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              All Subjects
            </button>
            {SUBJECTS_META.map((sub) => {
              const count = SYLLABUS_TOPICS.filter((t) => t.subject === sub.id).length;
              const completedCount = SYLLABUS_TOPICS.filter(
                (t) => t.subject === sub.id && completedTopicIds.includes(t.id)
              ).length;
              const isSelected = selectedSubject === sub.id;

              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubject(sub.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all border ${
                    isSelected
                      ? `${sub.accentBg} font-black shadow-sm`
                      : isDark
                      ? 'bg-gray-900/80 border-gray-800 text-gray-400 hover:text-gray-200'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {renderSubjectIcon(sub.iconName, 'w-3.5 h-3.5')}
                  <span>{sub.name}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                      completedCount === count
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isDark
                        ? 'bg-gray-800 text-gray-400'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {completedCount}/{count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Topics List Card Container */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-gray-400">
              Showing {filteredTopics.length} Curriculum Units
            </span>
            <span className="text-[11px] text-indigo-500 font-bold">
              Tap card to inspect objectives
            </span>
          </div>

          {filteredTopics.length === 0 ? (
            <div
              className={`p-12 text-center rounded-3xl border ${
                isDark ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-slate-200'
              } space-y-3`}
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
                <HelpCircle size={24} />
              </div>
              <h3 className="text-base font-black">No Syllabus Topics Match Filters</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Try clearing your search query or selecting "All Forms" and "All Subjects".
              </p>
              <button
                onClick={() => {
                  setSelectedForm('all');
                  setSelectedSubject('all');
                  setSelectedStatus('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredTopics.map((topic) => {
              const isCompleted = completedTopicIds.includes(topic.id);
              const isExpanded = expandedTopicId === topic.id;
              const subMeta = SUBJECTS_META.find((s) => s.id === topic.subject);

              return (
                <div
                  key={topic.id}
                  onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                  className={`rounded-2xl border transition-all cursor-pointer ${
                    isCompleted
                      ? isDark
                        ? 'bg-emerald-950/15 border-emerald-500/30'
                        : 'bg-emerald-50/40 border-emerald-200'
                      : isDark
                      ? 'bg-gray-900/60 border-gray-800/80 hover:border-gray-700'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="p-4 flex items-start gap-3.5">
                    {/* Interactive Checkbox */}
                    <button
                      onClick={(e) => toggleTopicCompletion(topic.id, e)}
                      className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
                        isCompleted
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : isDark
                          ? 'bg-gray-800 border border-gray-700 text-gray-500 hover:border-gray-500'
                          : 'bg-slate-100 border border-slate-300 text-slate-400 hover:border-slate-400'
                      }`}
                      title={isCompleted ? 'Mark as Incomplete' : 'Mark as Completed'}
                    >
                      {isCompleted ? (
                        <Check size={14} strokeWidth={3} />
                      ) : (
                        <Circle size={10} strokeWidth={2} />
                      )}
                    </button>

                    {/* Topic Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            subMeta ? subMeta.accentBg : 'bg-gray-500/10 text-gray-400'
                          }`}
                        >
                          {subMeta?.name || topic.subject}
                        </span>

                        <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-500/10 px-2 py-0.5 rounded-md">
                          Form {topic.form} • Term {topic.term}
                        </span>

                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                            topic.manebFrequency === 'Essential'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}
                        >
                          MANEB: {topic.manebFrequency}
                        </span>
                      </div>

                      <h4
                        className={`text-sm md:text-base font-black tracking-tight ${
                          isCompleted
                            ? isDark
                              ? 'text-emerald-300 line-through decoration-emerald-500/50'
                              : 'text-emerald-800'
                            : isDark
                            ? 'text-white'
                            : 'text-slate-900'
                        }`}
                      >
                        {topic.title}
                      </h4>

                      <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                        {topic.unit}
                      </p>

                      {/* Key Concepts Pills preview */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                        {topic.keyConcepts.map((concept, idx) => (
                          <span
                            key={idx}
                            className={`text-[10.5px] px-2 py-0.5 rounded-md font-medium ${
                              isDark ? 'bg-gray-800/80 text-gray-300' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Expand Arrow */}
                    <div className="text-gray-400 mt-1">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Expanded Syllabus Breakdown & Actions */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`px-4 pb-4 pt-2 border-t ${
                          isDark ? 'border-gray-800/80' : 'border-slate-100'
                        } space-y-3`}
                      >
                        {/* Learning Objectives List */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">
                            Key MANEB Learning Objectives:
                          </span>
                          <ul className="space-y-1 text-xs text-gray-400 list-disc pl-4 font-medium">
                            {topic.objectives.map((obj, i) => (
                              <li key={i} className="leading-relaxed">
                                {obj}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Quick AI Action Buttons */}
                        <div className="flex items-center gap-2 pt-2 flex-wrap">
                          <button
                            onClick={(e) => handleAskEmi(topic, e)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 transition-transform"
                          >
                            <BrainCircuit size={14} />
                            <span>
                              {copiedPromptId === topic.id ? 'Prompt Copied!' : 'Ask Emi AI to Teach This'}
                            </span>
                          </button>

                          <button
                            onClick={(e) => toggleTopicCompletion(topic.id, e)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border transition-all ${
                              isCompleted
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700'
                            }`}
                          >
                            <CheckCircle2 size={14} />
                            <span>{isCompleted ? 'Completed' : 'Mark as Mastered (+15 XP)'}</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
