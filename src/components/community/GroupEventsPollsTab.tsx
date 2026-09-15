import React, { useState, useEffect } from 'react';
import { 
  Calendar, BarChart2, Plus, Users, Clock, MapPin, 
  ExternalLink, Check, Trash2, CheckCircle2, XCircle, 
  HelpCircle, Loader2, X, AlertCircle
} from 'lucide-react';
import { GroupEvent, GroupPoll, PollOption } from '../../types/community';
import { db, auth } from '../../lib/firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, deleteDoc, doc, serverTimestamp, updateDoc
} from 'firebase/firestore';

export function GroupEventsPollsTab({
  groupId,
  groupName,
  theme = 'dark',
  userRole = 'student'
}: {
  groupId: string;
  groupName: string;
  theme?: 'light' | 'dark';
  userRole?: string;
}) {
  const [subTab, setSubTab] = useState<'events' | 'polls'>('events');

  // Events State
  const [events, setEvents] = useState<GroupEvent[]>(() => {
    try {
      const cached = localStorage.getItem(`mw_group_events_${groupId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Polls State
  const [polls, setPolls] = useState<GroupPoll[]>(() => {
    try {
      const cached = localStorage.getItem(`mw_group_polls_${groupId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Modal States
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // New Event Form
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventStart, setEventStart] = useState('16:00');
  const [eventEnd, setEventEnd] = useState('17:30');
  const [eventLink, setEventLink] = useState('');

  // New Poll Form
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['Option 1', 'Option 2', 'Option 3']);

  const currentUserId = auth.currentUser?.uid || (typeof localStorage !== 'undefined' ? localStorage.getItem('mw_anonymous_uid') : null) || 'student-current';
  const currentUserName = auth.currentUser?.displayName || (typeof localStorage !== 'undefined' ? localStorage.getItem('mw_user_name') : null) || 'Educate MW Member';
  const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin' || userRole === 'owner' || true;

  // Firestore Sync for Events
  useEffect(() => {
    let isMounted = true;
    try {
      const q = query(
        collection(db, 'group_events'),
        where('groupId', '==', groupId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        if (!snapshot.empty) {
          const list: GroupEvent[] = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              groupId: d.groupId || groupId,
              title: d.title || '',
              description: d.description || '',
              eventDate: d.eventDate || '',
              startTime: d.startTime || '',
              endTime: d.endTime || '',
              meetingLink: d.meetingLink || '',
              location: d.location || '',
              creatorId: d.creatorId || '',
              creatorName: d.creatorName || 'Instructor',
              rsvps: d.rsvps || { going: [], maybe: [], cantAttend: [] }
            };
          });
          setEvents(list);
          try {
            localStorage.setItem(`mw_group_events_${groupId}`, JSON.stringify(list));
          } catch {}
        }
      }, (err) => {
        console.warn("Events listener notice:", err);
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (e) {
      console.warn("Events init err:", e);
    }
  }, [groupId]);

  // Firestore Sync for Polls
  useEffect(() => {
    let isMounted = true;
    try {
      const q = query(
        collection(db, 'group_polls'),
        where('groupId', '==', groupId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        if (!snapshot.empty) {
          const list: GroupPoll[] = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              groupId: d.groupId || groupId,
              question: d.question || '',
              options: d.options || [],
              creatorId: d.creatorId || '',
              creatorName: d.creatorName || 'Member',
              isClosed: !!d.isClosed,
              totalVotes: d.totalVotes || 0
            };
          });
          setPolls(list);
          try {
            localStorage.setItem(`mw_group_polls_${groupId}`, JSON.stringify(list));
          } catch {}
        }
      }, (err) => {
        console.warn("Polls listener notice:", err);
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (e) {
      console.warn("Polls init err:", e);
    }
  }, [groupId]);

  // Handle RSVP
  const handleRsvp = async (event: GroupEvent, status: 'going' | 'maybe' | 'cantAttend') => {
    const updatedRsvps = {
      going: (event.rsvps?.going || []).filter(u => u !== currentUserId),
      maybe: (event.rsvps?.maybe || []).filter(u => u !== currentUserId),
      cantAttend: (event.rsvps?.cantAttend || []).filter(u => u !== currentUserId)
    };
    updatedRsvps[status].push(currentUserId);

    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, rsvps: updatedRsvps } : e));

    try {
      if (!event.id.startsWith('local-')) {
        await updateDoc(doc(db, 'group_events', event.id), {
          rsvps: updatedRsvps
        });
      }
    } catch (err) {
      console.error("RSVP update error:", err);
    }
  };

  // Handle Poll Vote
  const handleVote = async (poll: GroupPoll, optionId: string) => {
    if (poll.isClosed) return;

    let alreadyVotedInOption = false;
    const updatedOptions = poll.options.map(opt => {
      const cleanVoters = opt.voterIds.filter(u => u !== currentUserId);
      if (opt.id === optionId) {
        cleanVoters.push(currentUserId);
        alreadyVotedInOption = true;
      }
      return {
        ...opt,
        voteCount: cleanVoters.length,
        voterIds: cleanVoters
      };
    });

    const totalVotes = updatedOptions.reduce((acc, curr) => acc + curr.voteCount, 0);

    setPolls(prev => prev.map(p => p.id === poll.id ? { ...p, options: updatedOptions, totalVotes } : p));

    try {
      if (!poll.id.startsWith('local-')) {
        await updateDoc(doc(db, 'group_polls', poll.id), {
          options: updatedOptions,
          totalVotes
        });
      }
    } catch (err) {
      console.error("Vote update error:", err);
    }
  };

  // Create Event Submit
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate) return;

    setSaving(true);
    try {
      const eventData = {
        groupId,
        title: eventTitle.trim(),
        description: eventDesc.trim(),
        eventDate,
        startTime: eventStart,
        endTime: eventEnd,
        meetingLink: eventLink.trim() || null,
        creatorId: currentUserId,
        creatorName: currentUserName,
        rsvps: { going: [currentUserId], maybe: [], cantAttend: [] },
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'group_events'), eventData);

      const localItem: GroupEvent = {
        ...eventData,
        meetingLink: eventData.meetingLink || undefined,
        id: `local-event-${Date.now()}`
      };
      setEvents(prev => [localItem, ...prev]);

      setEventTitle('');
      setEventDesc('');
      setEventDate('');
      setEventLink('');
      setShowEventModal(false);
    } catch (err) {
      console.error("Create event err:", err);
      const localItem: GroupEvent = {
        id: `local-event-${Date.now()}`,
        groupId,
        title: eventTitle.trim(),
        description: eventDesc.trim(),
        eventDate,
        startTime: eventStart,
        endTime: eventEnd,
        creatorId: currentUserId,
        creatorName: currentUserName,
        rsvps: { going: [currentUserId], maybe: [], cantAttend: [] }
      };
      setEvents(prev => [localItem, ...prev]);
      setShowEventModal(false);
    } finally {
      setSaving(false);
    }
  };

  // Create Poll Submit
  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = pollOptions.map(o => o.trim()).filter(Boolean);
    if (!pollQuestion.trim() || validOptions.length < 2) return;

    setSaving(true);
    try {
      const formattedOptions: PollOption[] = validOptions.map((text, idx) => ({
        id: `opt-${idx + 1}`,
        text,
        voteCount: 0,
        voterIds: []
      }));

      const pollData = {
        groupId,
        question: pollQuestion.trim(),
        options: formattedOptions,
        creatorId: currentUserId,
        creatorName: currentUserName,
        isClosed: false,
        totalVotes: 0,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'group_polls'), pollData);

      const localItem: GroupPoll = {
        ...pollData,
        id: `local-poll-${Date.now()}`
      };
      setPolls(prev => [localItem, ...prev]);

      setPollQuestion('');
      setPollOptions(['Option 1', 'Option 2', 'Option 3']);
      setShowPollModal(false);
    } catch (err) {
      console.error("Create poll err:", err);
      const formattedOptions: PollOption[] = validOptions.map((text, idx) => ({
        id: `opt-${idx + 1}`,
        text,
        voteCount: 0,
        voterIds: []
      }));
      const localItem: GroupPoll = {
        id: `local-poll-${Date.now()}`,
        groupId,
        question: pollQuestion.trim(),
        options: formattedOptions,
        creatorId: currentUserId,
        creatorName: currentUserName,
        isClosed: false,
        totalVotes: 0
      };
      setPolls(prev => [localItem, ...prev]);
      setShowPollModal(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'} overflow-y-auto`}>
      {/* Sub-tab Navigation */}
      <div className={`p-4 border-b ${theme === 'dark' ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-slate-200'} shrink-0 flex items-center justify-between`}>
        <div className="flex items-center gap-2 bg-gray-950/40 p-1 rounded-2xl border border-gray-800/80">
          <button
            onClick={() => setSubTab('events')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
              subTab === 'events'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Calendar size={14} />
            <span>Study Sessions & Events</span>
          </button>
          <button
            onClick={() => setSubTab('polls')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
              subTab === 'polls'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart2 size={14} />
            <span>Decision Polls</span>
          </button>
        </div>

        <button
          onClick={() => subTab === 'events' ? setShowEventModal(true) : setShowPollModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md active:scale-95 transition-all"
        >
          <Plus size={15} strokeWidth={3} />
          <span>{subTab === 'events' ? 'Schedule Session' : 'Create Poll'}</span>
        </button>
      </div>

      {/* Events View */}
      {subTab === 'events' ? (
        <div className="flex-1 p-4 space-y-3.5">
          {events.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center border ${
                theme === 'dark' ? 'bg-gray-900 border-gray-800 text-gray-500' : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}>
                <Calendar size={28} />
              </div>
              <h3 className="font-extrabold text-sm mb-1">No Study Sessions Scheduled</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4">
                Organize group revision meetings, virtual study rooms, or teacher webinars.
              </p>
              <button
                onClick={() => setShowEventModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black inline-flex items-center gap-1.5 active:scale-95"
              >
                <Plus size={14} strokeWidth={2.5} /> Schedule First Meeting
              </button>
            </div>
          ) : (
            events.map((ev) => {
              const myRsvp = ev.rsvps?.going?.includes(currentUserId)
                ? 'going'
                : ev.rsvps?.maybe?.includes(currentUserId)
                ? 'maybe'
                : ev.rsvps?.cantAttend?.includes(currentUserId)
                ? 'cantAttend'
                : null;

              const goingCount = ev.rsvps?.going?.length || 0;
              const maybeCount = ev.rsvps?.maybe?.length || 0;

              return (
                <div
                  key={ev.id}
                  className={`p-5 rounded-3xl border transition-all ${
                    theme === 'dark'
                      ? 'bg-gray-900/80 border-gray-800'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {ev.eventDate} • {ev.startTime} - {ev.endTime}
                        </span>
                      </div>
                      <h3 className={`font-black text-sm sm:text-base leading-snug ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {ev.title}
                      </h3>
                      {ev.description && (
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                          {ev.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {ev.meetingLink && (
                    <div className="mb-4 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-blue-400" />
                        <span className="text-xs font-bold text-blue-300">Live Virtual Classroom Link</span>
                      </div>
                      <a
                        href={ev.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1 shadow-md hover:bg-blue-700"
                      >
                        <span>Join Session</span> <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  {/* RSVP Buttons */}
                  <div className="pt-3 border-t border-gray-800/60 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
                      <Users size={13} className="text-blue-400" />
                      <span>{goingCount} Going • {maybeCount} Maybe</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRsvp(ev, 'going')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
                          myRsvp === 'going'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-gray-800/80 border-gray-700 text-gray-300 hover:text-white'
                        }`}
                      >
                        <CheckCircle2 size={12} />
                        <span>Going</span>
                      </button>

                      <button
                        onClick={() => handleRsvp(ev, 'maybe')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
                          myRsvp === 'maybe'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-gray-800/80 border-gray-700 text-gray-300 hover:text-white'
                        }`}
                      >
                        <HelpCircle size={12} />
                        <span>Maybe</span>
                      </button>

                      <button
                        onClick={() => handleRsvp(ev, 'cantAttend')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
                          myRsvp === 'cantAttend'
                            ? 'bg-red-600 text-white border-red-600 shadow-sm'
                            : 'bg-gray-800/80 border-gray-700 text-gray-300 hover:text-white'
                        }`}
                      >
                        <XCircle size={12} />
                        <span>Can't Attend</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        // Polls View
        <div className="flex-1 p-4 space-y-3.5">
          {polls.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center border ${
                theme === 'dark' ? 'bg-gray-900 border-gray-800 text-gray-500' : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}>
                <BarChart2 size={28} />
              </div>
              <h3 className="font-extrabold text-sm mb-1">No Active Polls</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4">
                Ask group members to vote on study topics, convenient session times, or revision choices.
              </p>
              <button
                onClick={() => setShowPollModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black inline-flex items-center gap-1.5 active:scale-95"
              >
                <Plus size={14} strokeWidth={2.5} /> Create Decision Poll
              </button>
            </div>
          ) : (
            polls.map((poll) => {
              const hasVotedAny = poll.options.some(opt => opt.voterIds.includes(currentUserId));

              return (
                <div
                  key={poll.id}
                  className={`p-5 rounded-3xl border ${
                    theme === 'dark'
                      ? 'bg-gray-900/80 border-gray-800'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase text-blue-400">
                      Circle Poll • {poll.totalVotes || 0} Total Votes
                    </span>
                    {hasVotedAny && (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <Check size={11} /> You Voted
                      </span>
                    )}
                  </div>

                  <h3 className={`font-black text-sm sm:text-base leading-snug mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {poll.question}
                  </h3>

                  {/* Options with percentages */}
                  <div className="space-y-2.5">
                    {poll.options.map((opt) => {
                      const isSelected = opt.voterIds.includes(currentUserId);
                      const percentage = poll.totalVotes > 0
                        ? Math.round((opt.voteCount / poll.totalVotes) * 100)
                        : 0;

                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleVote(poll, opt.id)}
                          className={`w-full text-left p-3.5 rounded-2xl border relative overflow-hidden transition-all active:scale-[0.99] ${
                            isSelected
                              ? 'border-blue-500 bg-blue-500/10'
                              : theme === 'dark'
                              ? 'border-gray-800 bg-gray-950/60 hover:border-gray-700'
                              : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          {/* Animated background bar */}
                          <div
                            className={`absolute left-0 top-0 bottom-0 opacity-20 transition-all duration-500 ${
                              isSelected ? 'bg-blue-500' : 'bg-gray-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />

                          <div className="relative z-10 flex items-center justify-between gap-2 text-xs">
                            <span className={`font-extrabold ${isSelected ? 'text-blue-400' : ''}`}>
                              {opt.text}
                            </span>
                            <span className="font-black text-[11px] shrink-0 text-gray-400">
                              {percentage}% ({opt.voteCount})
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-800/40 text-[11px] text-gray-500 font-semibold flex items-center justify-between">
                    <span>Created by {poll.creatorName}</span>
                    <span>Single choice vote</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Schedule Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl border p-5 shadow-2xl ${
            theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
              <h3 className="font-black text-sm">Schedule Group Study Session</h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="w-7 h-7 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. MSCE Chemistry Mock Paper Review"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none border ${
                    theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium outline-none border ${
                    theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium outline-none border ${
                      theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium outline-none border ${
                      theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Virtual Link (Google Meet / Zoom / WhatsApp Room)
                </label>
                <input
                  type="url"
                  value={eventLink}
                  onChange={(e) => setEventLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium outline-none border ${
                    theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Description & Agenda
                </label>
                <textarea
                  rows={3}
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Describe topics to be resolved or questions students should prepare beforehand..."
                  className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium outline-none border resize-none ${
                    theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'
                  }`}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !eventTitle.trim() || !eventDate}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg flex items-center gap-2"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
                  <span>Schedule Event</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Poll Modal */}
      {showPollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl border p-5 shadow-2xl ${
            theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
              <h3 className="font-black text-sm">Create Circle Decision Poll</h3>
              <button
                onClick={() => setShowPollModal(false)}
                className="w-7 h-7 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Poll Question *
                </label>
                <input
                  type="text"
                  required
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="e.g. Which subject requires our longest revision block?"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none border ${
                    theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-black uppercase text-gray-400">
                  Voting Options
                </label>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...pollOptions];
                        newOpts[idx] = e.target.value;
                        setPollOptions(newOpts);
                      }}
                      placeholder={`Option ${idx + 1}`}
                      className={`flex-1 px-3.5 py-2 rounded-xl text-xs font-medium outline-none border ${
                        theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'
                      }`}
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                        className="p-2 text-gray-500 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}

                {pollOptions.length < 6 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions([...pollOptions, ''])}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 pt-1"
                  >
                    <Plus size={13} /> Add another option
                  </button>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowPollModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !pollQuestion.trim()}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-lg flex items-center gap-2"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
                  <span>Publish Poll</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
