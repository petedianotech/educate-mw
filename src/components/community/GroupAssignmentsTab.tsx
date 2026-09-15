import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Plus, Calendar, Clock, Award, FileText, 
  Upload, CheckCircle2, AlertCircle, Trash2, Check, Loader2, 
  X, ExternalLink, UserCheck, MessageSquare, ChevronRight, Lock
} from 'lucide-react';
import { GroupAssignment, AssignmentSubmission } from '../../types/community';
import { db, auth } from '../../lib/firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, deleteDoc, doc, serverTimestamp, updateDoc, setDoc
} from 'firebase/firestore';
import { formatRealTime } from '../../lib/presence';

export function GroupAssignmentsTab({
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
  const [assignments, setAssignments] = useState<GroupAssignment[]>(() => {
    try {
      const cached = localStorage.getItem(`mw_group_assignments_${groupId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [selectedAssignment, setSelectedAssignment] = useState<GroupAssignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [userSubmission, setUserSubmission] = useState<AssignmentSubmission | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submittingWork, setSubmittingWork] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);
  const [awardedScore, setAwardedScore] = useState<number>(0);
  const [teacherFeedback, setTeacherFeedback] = useState<string>('');
  const [savingGrade, setSavingGrade] = useState(false);

  // Create Assignment Form
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [subject, setSubject] = useState('');
  const [points, setPoints] = useState<number>(20);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [fileName, setFileName] = useState('');

  // Student Submit Form
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionFileName, setSubmissionFileName] = useState('');
  const [submissionFileUrl, setSubmissionFileUrl] = useState('');

  const currentUserId = auth.currentUser?.uid || (typeof localStorage !== 'undefined' ? localStorage.getItem('mw_anonymous_uid') : null) || 'student-current';
  const currentUserName = auth.currentUser?.displayName || (typeof localStorage !== 'undefined' ? localStorage.getItem('mw_user_name') : null) || 'Educate MW Student';
  const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin' || userRole === 'owner' || true; // allow creation

  // Real-time Firestore sync for assignments
  useEffect(() => {
    let isMounted = true;
    try {
      const q = query(
        collection(db, 'group_assignments'),
        where('groupId', '==', groupId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        const list: GroupAssignment[] = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            groupId: d.groupId || groupId,
            title: d.title || '',
            instructions: d.instructions || '',
            subject: d.subject || '',
            points: d.points || 20,
            dueDate: d.dueDate || '2025-12-31',
            dueTime: d.dueTime || '23:59',
            teacherId: d.teacherId || 'teacher',
            teacherName: d.teacherName || 'Instructor',
            isClosed: !!d.isClosed,
            attachmentUrl: d.attachmentUrl || undefined,
            fileName: d.fileName || undefined,
            submissionsCount: d.submissionsCount || 0,
            createdAt: d.createdAt,
            timeText: d.timeText || undefined
          };
        });
        setAssignments(list);
        try {
          localStorage.setItem(`mw_group_assignments_${groupId}`, JSON.stringify(list));
        } catch {}
      }, (err) => {
        console.warn("Assignments listener notice:", err);
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (e) {
      console.warn("Assignments init err:", e);
    }
  }, [groupId]);

  // Load submissions for active assignment
  useEffect(() => {
    if (!selectedAssignment) return;
    let isMounted = true;

    try {
      const q = query(
        collection(db, 'assignment_submissions'),
        where('assignmentId', '==', selectedAssignment.id)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        const list: AssignmentSubmission[] = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            assignmentId: selectedAssignment.id,
            groupId: d.groupId || groupId,
            studentId: d.studentId || '',
            studentName: d.studentName || 'Student',
            content: d.content || '',
            attachmentUrl: d.attachmentUrl || undefined,
            fileName: d.fileName || undefined,
            status: d.status || 'submitted',
            score: d.score,
            feedback: d.feedback,
            submittedAt: d.submittedAt,
            markedAt: d.markedAt
          };
        });
        setSubmissions(list);
        const mySub = list.find(s => s.studentId === currentUserId);
        setUserSubmission(mySub || null);
      }, (err) => {
        console.warn("Submissions query notice:", err);
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (e) {
      console.warn("Submissions listener error:", e);
    }
  }, [selectedAssignment?.id, currentUserId]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !instructions.trim()) return;

    setCreating(true);
    try {
      const newAssign = {
        groupId,
        title: title.trim(),
        instructions: instructions.trim(),
        subject: subject.trim() || groupName,
        points: Number(points) || 20,
        dueDate: dueDate || '2025-12-31',
        dueTime: dueTime || '23:59',
        teacherId: currentUserId,
        teacherName: currentUserName,
        isClosed: false,
        attachmentUrl: attachmentUrl.trim() || null,
        fileName: fileName.trim() || null,
        submissionsCount: 0,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'group_assignments'), newAssign);

      const localItem: GroupAssignment = {
        ...newAssign,
        attachmentUrl: newAssign.attachmentUrl || undefined,
        fileName: newAssign.fileName || undefined,
        id: `local-assign-${Date.now()}`,
        timeText: 'Just now'
      };

      setAssignments(prev => [localItem, ...prev]);

      setTitle('');
      setInstructions('');
      setSubject('');
      setPoints(20);
      setDueDate('');
      setAttachmentUrl('');
      setFileName('');
      setShowCreateModal(false);
    } catch (err) {
      console.error("Failed to create assignment:", err);
      const localItem: GroupAssignment = {
        id: `local-assign-${Date.now()}`,
        groupId,
        title: title.trim(),
        instructions: instructions.trim(),
        subject: subject.trim() || groupName,
        points: Number(points) || 20,
        dueDate: dueDate || '2025-12-31',
        dueTime: dueTime || '23:59',
        teacherId: currentUserId,
        teacherName: currentUserName,
        isClosed: false,
        timeText: 'Just now'
      };
      setAssignments(prev => [localItem, ...prev]);
      setShowCreateModal(false);
    } finally {
      setCreating(false);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || (!submissionContent.trim() && !submissionFileUrl)) return;

    setSubmittingWork(true);
    try {
      const subDocId = `${selectedAssignment.id}_${currentUserId}`;
      const submissionData = {
        assignmentId: selectedAssignment.id,
        assignmentTitle: selectedAssignment.title,
        groupId,
        studentId: currentUserId,
        studentName: currentUserName,
        content: submissionContent.trim(),
        attachmentUrl: submissionFileUrl || null,
        fileName: submissionFileName || null,
        status: 'submitted',
        submittedAt: serverTimestamp()
      };

      const docRef = doc(db, 'assignment_submissions', subDocId);
      await setDoc(docRef, submissionData, { merge: true });

      // Add starter student message to the interactive admin chat subcollection
      try {
        await addDoc(collection(db, `assignment_submissions/${subDocId}/messages`), {
          senderId: currentUserId,
          senderName: currentUserName,
          role: 'student',
          text: `📄 Submitted solution for "${selectedAssignment.title}":\n\n${submissionContent.trim()}`,
          createdAt: serverTimestamp()
        });
      } catch (chatErr) {
        console.warn("Could not add initial submission message:", chatErr);
      }

      const localSub: AssignmentSubmission = {
        ...submissionData,
        id: subDocId,
        status: 'submitted',
        attachmentUrl: submissionData.attachmentUrl || undefined,
        fileName: submissionData.fileName || undefined,
        submittedAt: new Date().toISOString()
      };

      setUserSubmission(localSub);
      setSubmissions(prev => {
        const filtered = prev.filter(s => s.studentId !== currentUserId);
        return [localSub, ...filtered];
      });

      setShowSubmitModal(false);
    } catch (err) {
      console.error("Submission failed:", err);
      const localSub: AssignmentSubmission = {
        id: `local-sub-${Date.now()}`,
        assignmentId: selectedAssignment.id,
        groupId,
        studentId: currentUserId,
        studentName: currentUserName,
        content: submissionContent.trim(),
        status: 'submitted',
        submittedAt: new Date().toISOString()
      };
      setUserSubmission(localSub);
      setShowSubmitModal(false);
    } finally {
      setSubmittingWork(false);
    }
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission || !selectedAssignment) return;

    setSavingGrade(true);
    try {
      const gradeData = {
        score: Number(awardedScore),
        feedback: teacherFeedback.trim(),
        status: 'marked',
        markedAt: serverTimestamp()
      };

      if (!gradingSubmission.id.startsWith('local-')) {
        await updateDoc(doc(db, 'assignment_submissions', gradingSubmission.id), gradeData);
      }

      setSubmissions(prev => prev.map(s => s.id === gradingSubmission.id ? {
        ...s,
        score: Number(awardedScore),
        feedback: teacherFeedback.trim(),
        status: 'marked'
      } : s));

      setGradingSubmission(null);
    } catch (err) {
      console.error("Save grade err:", err);
      setGradingSubmission(null);
    } finally {
      setSavingGrade(false);
    }
  };

  // Student submission file select handler
  const handleSubmissionFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSubmissionFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSubmissionFileUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Single Assignment Workspace View
  if (selectedAssignment) {
    return (
      <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'} overflow-y-auto`}>
        {/* Header */}
        <div className={`p-4 border-b ${theme === 'dark' ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-slate-200'} shrink-0 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedAssignment(null)}
              className="w-8 h-8 rounded-xl bg-gray-800 text-gray-300 hover:text-white flex items-center justify-center active:scale-95"
            >
              <X size={16} />
            </button>
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-400">
                {selectedAssignment.subject} • Max {selectedAssignment.points} Marks
              </span>
              <h3 className="text-sm font-black leading-tight line-clamp-1">
                {selectedAssignment.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black uppercase text-gray-500">Due Date</p>
              <p className="text-xs font-bold text-amber-400">{selectedAssignment.dueDate} {selectedAssignment.dueTime}</p>
            </div>
          </div>
        </div>

        {/* Assignment Brief */}
        <div className="p-5 border-b border-gray-800/60 bg-emerald-500/5 space-y-3 shrink-0">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Published by <strong className="text-white">{selectedAssignment.teacherName}</strong></span>
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <Clock size={12} /> Due {selectedAssignment.dueDate}
            </span>
          </div>

          <h2 className="text-base font-black leading-snug">
            {selectedAssignment.title}
          </h2>

          <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-slate-200'}`}>
            <h4 className="text-[10px] font-black uppercase text-gray-500 mb-1.5">Instructions & Task:</h4>
            <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
              {selectedAssignment.instructions}
            </p>
          </div>

          {selectedAssignment.attachmentUrl && (
            <div className={`p-3 rounded-2xl border flex items-center justify-between ${
              theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-emerald-400" />
                <span className="text-xs font-bold truncate max-w-[200px]">
                  {selectedAssignment.fileName || 'Worksheet / Problem Set.pdf'}
                </span>
              </div>
              <a
                href={selectedAssignment.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 text-xs font-bold flex items-center gap-1"
              >
                <span>View Sheet</span> <ExternalLink size={11} />
              </a>
            </div>
          )}
        </div>

        {/* Submissions Section */}
        <div className="flex-1 p-5 space-y-4">
          {isTeacherOrAdmin ? (
            // Teacher Grading Roster
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">
                  Class Submissions ({submissions.length})
                </h3>
                <span className="text-[11px] font-bold text-emerald-400">
                  {submissions.filter(s => s.status === 'marked').length} of {submissions.length} Graded
                </span>
              </div>

              {submissions.length === 0 ? (
                <div className="text-center py-12 opacity-60">
                  <UserCheck size={32} className="mx-auto mb-2 text-gray-500" />
                  <p className="font-bold text-xs">No Submissions Received Yet</p>
                  <p className="text-[11px] text-gray-500">Student answers will appear here once submitted.</p>
                </div>
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      sub.status === 'marked'
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : theme === 'dark'
                        ? 'bg-gray-900/80 border-gray-800'
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm">{sub.studentName}</span>
                          {sub.status === 'marked' ? (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Graded: {sub.score} / {selectedAssignment.points}
                            </span>
                          ) : (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Submitted • Needs Marking
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setGradingSubmission(sub);
                          setAwardedScore(sub.score || 0);
                          setTeacherFeedback(sub.feedback || '');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 active:scale-95"
                      >
                        <Award size={13} />
                        <span>{sub.status === 'marked' ? 'Edit Grade' : 'Mark Work'}</span>
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800/80 my-2">
                      <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {sub.content || 'Attached File Submission'}
                      </p>
                    </div>

                    {sub.feedback && (
                      <div className="mt-2 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
                        <span className="font-black text-indigo-400 text-[10px] uppercase block mb-0.5">Teacher Feedback:</span>
                        <p className="text-gray-300">{sub.feedback}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            // Student Submission Status & Form
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">
                Your Submission Status
              </h3>

              {userSubmission ? (
                <div className={`p-5 rounded-3xl border ${
                  userSubmission.status === 'marked'
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-indigo-500/30 bg-indigo-500/5'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-400" />
                      <span className="font-black text-sm">
                        {userSubmission.status === 'marked' ? 'Assignment Graded' : 'Work Submitted Successfully'}
                      </span>
                    </div>
                    {userSubmission.status === 'marked' && (
                      <div className="text-right">
                        <span className="text-lg font-black text-emerald-400">
                          {userSubmission.score} / {selectedAssignment.points}
                        </span>
                        <span className="text-[9px] uppercase font-bold text-gray-400 block">Marks</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gray-950/80 border border-gray-800 mb-3">
                    <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {userSubmission.content}
                    </p>
                  </div>

                  {userSubmission.feedback && (
                    <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-3">
                      <p className="text-[10px] font-black uppercase text-indigo-400 mb-1">Teacher Review & Feedback:</p>
                      <p className="text-xs text-white leading-relaxed">{userSubmission.feedback}</p>
                    </div>
                  )}

                  {!selectedAssignment.isClosed && (
                    <button
                      onClick={() => {
                        setSubmissionContent(userSubmission.content || '');
                        setShowSubmitModal(true);
                      }}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline"
                    >
                      Resubmit or Edit Solution
                    </button>
                  )}
                </div>
              ) : (
                <div className={`p-6 rounded-3xl border text-center ${
                  theme === 'dark' ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-slate-200'
                }`}>
                  <AlertCircle size={32} className="mx-auto mb-2 text-amber-400" />
                  <h4 className="font-extrabold text-sm mb-1">You haven't submitted your work yet</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
                    Type your complete solution or attach your handwritten worksheet photos before the due date.
                  </p>
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs inline-flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                  >
                    <Upload size={15} />
                    <span>Submit Assignment Solution</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Student Submit Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-lg rounded-3xl border p-5 shadow-2xl ${
              theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
                <h3 className="font-black text-sm">Submit Solution for Assignment</h3>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="w-7 h-7 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleStudentSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                    Written Solution / Explanations *
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    placeholder="Type your step-by-step mathematical working or essay answer..."
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none border resize-none ${
                      theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                    Attach Worksheet / Photo (Optional)
                  </label>
                  <input
                    type="file"
                    id="subDocFile"
                    onChange={handleSubmissionFileSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="subDocFile"
                    className={`block p-3 rounded-xl border border-dashed text-center cursor-pointer transition-colors ${
                      submissionFileName
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : theme === 'dark' ? 'border-gray-800 hover:border-gray-700 bg-gray-950' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <Upload size={16} className="mx-auto mb-1 opacity-60" />
                    <span className="text-xs font-bold">
                      {submissionFileName || 'Attach PDF solution or photo of working'}
                    </span>
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingWork || !submissionContent.trim()}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg disabled:opacity-40 flex items-center gap-2"
                  >
                    {submittingWork ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} strokeWidth={3} />
                        <span>Confirm Submission</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Teacher Grade Modal */}
        {gradingSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-lg rounded-3xl border p-5 shadow-2xl ${
              theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
                <div>
                  <h3 className="font-black text-sm">Grade Submission</h3>
                  <p className="text-[11px] text-gray-400 font-semibold">{gradingSubmission.studentName}</p>
                </div>
                <button
                  onClick={() => setGradingSubmission(null)}
                  className="w-7 h-7 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSaveGrade} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                    Awarded Marks (Out of {selectedAssignment.points}) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={selectedAssignment.points}
                    required
                    value={awardedScore}
                    onChange={(e) => setAwardedScore(Number(e.target.value))}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-black outline-none border ${
                      theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                    Written Feedback & Correction Notes
                  </label>
                  <textarea
                    rows={4}
                    value={teacherFeedback}
                    onChange={(e) => setTeacherFeedback(e.target.value)}
                    placeholder="Point out mistakes, praise good working, or suggest chapters to revise..."
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none border resize-none ${
                      theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'
                    }`}
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setGradingSubmission(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingGrade}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg flex items-center gap-2"
                  >
                    {savingGrade ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
                    <span>Save & Return Grade</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Assignments Catalog View
  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'} overflow-y-auto`}>
      {/* Header */}
      <div className={`p-4 border-b ${theme === 'dark' ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-slate-200'} shrink-0 flex items-center justify-between`}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <GraduationCap size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight flex items-center gap-2">
              Teacher Assignments & Tasks
            </h2>
            <p className="text-[11px] text-gray-500 font-semibold">
              Homework, problem sets & essay marking workflow
            </p>
          </div>
        </div>

        {isTeacherOrAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md active:scale-95 transition-all"
          >
            <Plus size={15} strokeWidth={3} />
            <span>Publish Task</span>
          </button>
        )}
      </div>

      {/* Assignment List */}
      <div className="flex-1 p-4 space-y-3">
        {assignments.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center border ${
              theme === 'dark' ? 'bg-gray-900 border-gray-800 text-gray-500' : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}>
              <GraduationCap size={28} />
            </div>
            <h3 className="font-extrabold text-sm mb-1">No Active Assignments</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4">
              Teachers publish homework exercises and exam questions with custom marking criteria here.
            </p>
            {isTeacherOrAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black inline-flex items-center gap-1.5 active:scale-95"
              >
                <Plus size={14} strokeWidth={2.5} /> Create First Assignment
              </button>
            )}
          </div>
        ) : (
          assignments.map((assign) => (
            <div
              key={assign.id}
              onClick={() => setSelectedAssignment(assign)}
              className={`p-4 rounded-3xl border cursor-pointer transition-all ${
                theme === 'dark'
                  ? 'bg-gray-900/70 border-gray-800/80 hover:border-emerald-500/40'
                  : 'bg-white border-slate-200 shadow-sm hover:border-emerald-400'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {assign.points} Marks
                  </span>
                  {assign.subject && (
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-800/60 px-2 py-0.5 rounded-md">
                      {assign.subject}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                  <Clock size={11} /> Due: {assign.dueDate}
                </span>
              </div>

              <h3 className={`font-black text-sm leading-snug mb-1.5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {assign.title}
              </h3>
              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">
                {assign.instructions}
              </p>

              <div className="pt-2 border-t border-gray-800/40 flex items-center justify-between text-[11px] text-gray-500 font-semibold">
                <span>By {assign.teacherName}</span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <span>View Details & Submissions</span>
                  <ChevronRight size={13} />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl border p-5 shadow-2xl ${
            theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <GraduationCap size={16} />
                </div>
                <h3 className="font-black text-sm">Publish Academic Assignment</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-7 h-7 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chemistry Titration Numerical Problems"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none border ${
                    theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                    Subject / Topic
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Chemistry"
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium outline-none border ${
                      theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                    Max Marks / Points
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium outline-none border ${
                      theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium outline-none border ${
                      theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium outline-none border ${
                      theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Full Instructions & Questions *
                </label>
                <textarea
                  rows={4}
                  required
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Type full questions, question numbering, and expectations for students..."
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none border resize-none ${
                    theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-emerald-500' : 'bg-slate-50 border-slate-200 focus:border-emerald-500'
                  }`}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !title.trim() || !instructions.trim() || !dueDate}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg disabled:opacity-40 flex items-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} strokeWidth={3} />
                      <span>Publish Assignment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
