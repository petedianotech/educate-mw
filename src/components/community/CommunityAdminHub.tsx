import React, { useState, useEffect } from 'react';
import { 
  Shield, Plus, Check, X, AlertCircle, Clock, Send, 
  MessageSquare, FileText, Megaphone, GraduationCap, 
  Users, Layers, Award, CheckCircle2, Trash2, ArrowLeft,
  ChevronRight, ExternalLink, Filter, Search, Loader2,
  Calendar, Download, UserCheck
} from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { 
  collection, query, orderBy, onSnapshot, addDoc, 
  updateDoc, deleteDoc, doc, serverTimestamp, setDoc, where 
} from 'firebase/firestore';
import { formatRealTime } from '../../lib/presence';
import { 
  GroupRequest, ClassLevel, AssignmentSubmission, 
  GroupAssignment, GroupAnnouncement, AdminSubmissionInboxItem 
} from '../../types/community';

export function CommunityAdminHub({
  onClose,
  theme = 'dark',
  onNavigateToGroup
}: {
  onClose: () => void;
  theme?: 'light' | 'dark';
  onNavigateToGroup?: (groupId: string, tab?: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'publish' | 'submissions' | 'requests' | 'levels'>('publish');
  const [publishType, setPublishType] = useState<'assignment' | 'announcement'>('assignment');

  // Publish Form State
  const [targetGroup, setTargetGroup] = useState<string>('all');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('Sciences');
  const [classLevel, setClassLevel] = useState('Form 4 (MSCE)');
  const [points, setPoints] = useState<number>(25);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);

  // Submissions State (Admin Inbox Chat)
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'needs_marking' | 'marked'>('all');
  const [awardedScore, setAwardedScore] = useState<number>(0);
  const [teacherFeedback, setTeacherFeedback] = useState<string>('');
  const [savingGrade, setSavingGrade] = useState(false);
  
  // Interactive Admin-Student Chat in Submission
  const [chatMessages, setChatMessages] = useState<{
    id: string;
    senderId: string;
    senderName: string;
    role: 'admin' | 'student';
    text: string;
    createdAt?: any;
  }[]>([]);
  const [newAdminReply, setNewAdminReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Group Requests State
  const [groupRequests, setGroupRequests] = useState<GroupRequest[]>([]);
  const [requestFilter, setRequestFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [processingReqId, setProcessingReqId] = useState<string | null>(null);

  // Class Levels State
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [newLevelName, setNewLevelName] = useState('');
  const [newLevelCode, setNewLevelCode] = useState('');
  const [newLevelDesc, setNewLevelDesc] = useState('');
  const [addingLevel, setAddingLevel] = useState(false);

  // Current user info
  const currentUserId = auth.currentUser?.uid || (typeof localStorage !== 'undefined' ? localStorage.getItem('mw_anonymous_uid') : null) || 'admin-user';
  const currentUserName = auth.currentUser?.displayName || (typeof localStorage !== 'undefined' ? localStorage.getItem('mw_user_name') : null) || 'Administrator';

  // 1. Listen to Submissions for Admin Inbox
  useEffect(() => {
    let isMounted = true;
    try {
      const q = query(
        collection(db, 'assignment_submissions'),
        orderBy('submittedAt', 'desc')
      );
      const unsub = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        const list: AssignmentSubmission[] = snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            assignmentId: data.assignmentId || '',
            groupId: data.groupId || 'sciences',
            studentId: data.studentId || '',
            studentName: data.studentName || 'Student',
            content: data.content || '',
            attachmentUrl: data.attachmentUrl || undefined,
            fileName: data.fileName || undefined,
            status: data.status || 'submitted',
            score: data.score,
            feedback: data.feedback,
            submittedAt: data.submittedAt,
            markedAt: data.markedAt
          };
        });
        setSubmissions(list);
      }, (err) => {
        console.warn("Submissions query notice:", err);
      });
      return () => {
        isMounted = false;
        unsub();
      };
    } catch (e) {}
  }, []);

  // 2. Listen to Group Requests
  useEffect(() => {
    let isMounted = true;
    try {
      const q = query(
        collection(db, 'group_requests'),
        orderBy('createdAt', 'desc')
      );
      const unsub = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        const list: GroupRequest[] = snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || 'Untitled Group',
            description: data.description || '',
            category: data.category || 'Sciences',
            classLevel: data.classLevel || 'Form 4',
            requesterId: data.requesterId || '',
            requesterName: data.requesterName || 'Student',
            status: data.status || 'pending',
            rejectionReason: data.rejectionReason,
            createdAt: data.createdAt
          };
        });
        setGroupRequests(list);
      }, (err) => {
        console.warn("Group requests query notice:", err);
      });
      return () => {
        isMounted = false;
        unsub();
      };
    } catch (e) {}
  }, []);

  // 3. Listen to Class Levels
  useEffect(() => {
    let isMounted = true;
    try {
      const q = query(collection(db, 'class_levels'));
      const unsub = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        if (!snapshot.empty) {
          const list: ClassLevel[] = snapshot.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name || '',
              code: data.code || '',
              description: data.description || '',
              order: data.order || 1,
              createdAt: data.createdAt
            };
          });
          setClassLevels(list);
        } else {
          // Initialize standard MSCE & Secondary School Class Levels
          const defaultLevels: ClassLevel[] = [
            { id: 'lvl-1', name: 'Form 1 (Junior)', code: 'FORM_1', order: 1, description: 'Junior secondary foundation curriculum' },
            { id: 'lvl-2', name: 'Form 2 (JCE)', code: 'FORM_2', order: 2, description: 'Junior Certificate Examination revision' },
            { id: 'lvl-3', name: 'Form 3 (Senior)', code: 'FORM_3', order: 3, description: 'Senior secondary curriculum preparation' },
            { id: 'lvl-4', name: 'Form 4 (MSCE)', code: 'FORM_4', order: 4, description: 'National MSCE examination candidates' },
            { id: 'lvl-5', name: 'College / Tertiary', code: 'COLLEGE', order: 5, description: 'University & technical college students' },
            { id: 'lvl-6', name: 'General Open Circle', code: 'OPEN', order: 6, description: 'All student & teacher study topics' }
          ];
          setClassLevels(defaultLevels);
        }
      }, (err) => {
        console.warn("Class levels query notice:", err);
      });
      return () => {
        isMounted = false;
        unsub();
      };
    } catch (e) {}
  }, []);

  // Listen to submission chat thread when a submission is selected
  useEffect(() => {
    if (!selectedSubmission) {
      setChatMessages([]);
      return;
    }
    setAwardedScore(selectedSubmission.score || 0);
    setTeacherFeedback(selectedSubmission.feedback || '');

    let isMounted = true;
    try {
      const q = query(
        collection(db, `assignment_submissions/${selectedSubmission.id}/messages`),
        orderBy('createdAt', 'asc')
      );
      const unsub = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        const msgs = snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            senderId: data.senderId || '',
            senderName: data.senderName || 'Instructor',
            role: data.role || 'admin',
            text: data.text || '',
            createdAt: data.createdAt
          };
        });
        setChatMessages(msgs);
      }, (err) => {
        console.warn("Submission chat notice:", err);
      });
      return () => {
        isMounted = false;
        unsub();
      };
    } catch (e) {}
  }, [selectedSubmission]);

  // Handle Publish Assignment or Announcement
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsPublishing(true);
    setPublishSuccess(null);

    try {
      const targetGroupIds = targetGroup === 'all' 
        ? ['sciences', 'humanities', 'languages', 'general'] 
        : [targetGroup];

      if (publishType === 'assignment') {
        // 1. Create assignment record for target groups
        for (const gId of targetGroupIds) {
          const assignData = {
            groupId: gId,
            title: title.trim(),
            instructions: content.trim(),
            subject: subject.trim(),
            classLevel: classLevel,
            points: Number(points) || 25,
            dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            dueTime: dueTime || '23:59',
            teacherId: currentUserId,
            teacherName: currentUserName,
            attachmentUrl: attachmentUrl || null,
            fileName: fileName || null,
            isClosed: false,
            createdAt: serverTimestamp()
          };
          const docRef = await addDoc(collection(db, 'group_assignments'), assignData);

          // 2. Broadcast directly to the General Feed as [Assigned]
          await addDoc(collection(db, 'feeds'), {
            text: `📝 [Assigned] ${title.trim()}\n\n${content.trim()}\n\n🎯 Points: ${points} | 📅 Due: ${dueDate || 'Next Week'}`,
            userId: currentUserId,
            name: currentUserName,
            userRole: 'admin',
            initial: 'A',
            color: 'bg-emerald-500/20 text-emerald-400',
            subject: subject.trim(),
            classLevel: classLevel,
            groupId: gId,
            groupName: gId.charAt(0).toUpperCase() + gId.slice(1),
            type: 'assignment',
            assignmentId: docRef.id,
            points: Number(points) || 25,
            dueDate: dueDate || '2026-12-31',
            likes: 0,
            likedBy: [],
            repliesCount: 0,
            createdAt: serverTimestamp()
          });
        }
        setPublishSuccess('Academic Assignment published and broadcasted to community feed!');
      } else {
        // Publish Announcement
        for (const gId of targetGroupIds) {
          await addDoc(collection(db, 'group_announcements'), {
            groupId: gId,
            title: title.trim(),
            content: content.trim(),
            authorId: currentUserId,
            authorName: currentUserName,
            authorRole: 'admin',
            isPinned: true,
            attachmentUrl: attachmentUrl || null,
            fileName: fileName || null,
            createdAt: serverTimestamp()
          });

          // Broadcast to General Feed as [Announcement]
          await addDoc(collection(db, 'feeds'), {
            text: `📢 [Announcement] ${title.trim()}\n\n${content.trim()}`,
            userId: currentUserId,
            name: currentUserName,
            userRole: 'admin',
            initial: 'A',
            color: 'bg-indigo-500/20 text-indigo-400',
            subject: subject.trim(),
            classLevel: classLevel,
            groupId: gId,
            groupName: gId.charAt(0).toUpperCase() + gId.slice(1),
            type: 'announcement',
            likes: 0,
            likedBy: [],
            repliesCount: 0,
            createdAt: serverTimestamp()
          });
        }
        setPublishSuccess('Official Announcement published and broadcasted to community feed!');
      }

      // Reset form
      setTitle('');
      setContent('');
      setAttachmentUrl('');
      setFileName('');
      setTimeout(() => setPublishSuccess(null), 4000);
    } catch (err) {
      console.error("Publishing error:", err);
      alert("Failed to publish. Please check connection.");
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle Admin Sending Chat in Submission
  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission || !newAdminReply.trim()) return;

    setSendingReply(true);
    try {
      await addDoc(collection(db, `assignment_submissions/${selectedSubmission.id}/messages`), {
        senderId: currentUserId,
        senderName: currentUserName,
        role: 'admin',
        text: newAdminReply.trim(),
        createdAt: serverTimestamp()
      });
      setNewAdminReply('');
    } catch (err) {
      console.error("Send reply error:", err);
    } finally {
      setSendingReply(false);
    }
  };

  // Handle Mark / Grade Student Work
  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    setSavingGrade(true);
    try {
      await updateDoc(doc(db, 'assignment_submissions', selectedSubmission.id), {
        score: Number(awardedScore),
        feedback: teacherFeedback.trim(),
        status: 'marked',
        markedAt: serverTimestamp()
      });

      // Send grading note message in the interactive chat thread
      await addDoc(collection(db, `assignment_submissions/${selectedSubmission.id}/messages`), {
        senderId: currentUserId,
        senderName: currentUserName,
        role: 'admin',
        text: `🎓 Marked & Graded: Awarded ${awardedScore} marks.\nFeedback: ${teacherFeedback.trim() || 'Well done!'}`,
        createdAt: serverTimestamp()
      });

      setSelectedSubmission(prev => prev ? {
        ...prev,
        score: Number(awardedScore),
        feedback: teacherFeedback.trim(),
        status: 'marked'
      } : null);

      alert("Grade and feedback returned to student successfully!");
    } catch (err) {
      console.error("Error saving grade:", err);
    } finally {
      setSavingGrade(false);
    }
  };

  // Handle Approve Group Request
  const handleApproveRequest = async (req: GroupRequest) => {
    setProcessingReqId(req.id);
    try {
      const generatedGroupId = req.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      // 1. Create the new study group in /groups
      await setDoc(doc(db, 'groups', generatedGroupId), {
        name: req.name,
        description: req.description || 'Active student study circle',
        category: req.category || 'Sciences',
        classLevel: req.classLevel || 'Form 4',
        creatorId: req.requesterId,
        creatorName: req.requesterName,
        adminIds: [currentUserId, req.requesterId],
        teacherIds: [currentUserId],
        moderatorIds: [req.requesterId],
        memberIds: [currentUserId, req.requesterId],
        rules: [
          { id: 'r1', text: '1. Academic discussions only. MSCE curriculum focus.' },
          { id: 'r2', text: '2. Respectful study environment for all learners.' }
        ],
        inviteCode: `MW-${generatedGroupId.toUpperCase().slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: serverTimestamp()
      });

      // 2. Mark request as approved
      await updateDoc(doc(db, 'group_requests', req.id), {
        status: 'approved',
        approvedAt: serverTimestamp()
      });

      // 3. Post notification to Feed
      await addDoc(collection(db, 'feeds'), {
        text: `🎉 New Study Group Approved: [${req.name}] for ${req.classLevel || 'MSCE'} is now active! Tap to join and participate.`,
        userId: currentUserId,
        name: 'Community Administration',
        userRole: 'admin',
        initial: 'A',
        color: 'bg-indigo-500/20 text-indigo-400',
        subject: req.category,
        groupId: generatedGroupId,
        groupName: req.name,
        type: 'group_share',
        likes: 0,
        likedBy: [],
        repliesCount: 0,
        createdAt: serverTimestamp()
      });

      alert(`Study Group "${req.name}" approved and launched!`);
    } catch (err) {
      console.error("Approve request error:", err);
      alert("Failed to approve group.");
    } finally {
      setProcessingReqId(null);
    }
  };

  // Handle Reject Group Request
  const handleRejectRequest = async (reqId: string) => {
    const reason = prompt("Enter optional rejection reason for the student:", "Does not meet community academic guidelines.");
    if (reason === null) return;

    setProcessingReqId(reqId);
    try {
      await updateDoc(doc(db, 'group_requests', reqId), {
        status: 'rejected',
        rejectionReason: reason,
        rejectedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Reject error:", err);
    } finally {
      setProcessingReqId(null);
    }
  };

  // Handle Add Class Level
  const handleAddClassLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLevelName.trim() || !newLevelCode.trim()) return;

    setAddingLevel(true);
    try {
      const levelId = 'lvl-' + Date.now();
      await setDoc(doc(db, 'class_levels', levelId), {
        name: newLevelName.trim(),
        code: newLevelCode.trim().toUpperCase(),
        description: newLevelDesc.trim(),
        order: classLevels.length + 1,
        createdAt: serverTimestamp()
      });
      setNewLevelName('');
      setNewLevelCode('');
      setNewLevelDesc('');
    } catch (err) {
      console.error("Add class level err:", err);
    } finally {
      setAddingLevel(false);
    }
  };

  // Handle Delete Class Level
  const handleDeleteClassLevel = async (levelId: string) => {
    if (!confirm("Are you sure you want to delete this class level?")) return;
    try {
      await deleteDoc(doc(db, 'class_levels', levelId));
      setClassLevels(prev => prev.filter(l => l.id !== levelId));
    } catch (err) {
      console.error("Delete level err:", err);
    }
  };

  const filteredSubmissions = submissions.filter(s => {
    if (submissionFilter === 'needs_marking') return s.status === 'submitted';
    if (submissionFilter === 'marked') return s.status === 'marked';
    return true;
  });

  const filteredRequests = groupRequests.filter(r => r.status === requestFilter);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'} animate-in fade-in duration-200`}>
      {/* Top Header */}
      <div className={`p-4 border-b ${theme === 'dark' ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} shrink-0 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-base font-black tracking-tight flex items-center gap-1.5">
                Community Admin & Publisher Hub
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Staff Control
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Publish assignments & announcements, review student submissions inbox, approve study groups
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            theme === 'dark' ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-slate-200 text-slate-600'
          }`}
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className={`px-4 py-2 border-b ${theme === 'dark' ? 'bg-gray-900/40 border-gray-800' : 'bg-slate-100 border-slate-200'} shrink-0 flex items-center gap-2 overflow-x-auto no-scrollbar`}>
        {[
          { id: 'publish', label: 'Publish to Community', icon: Megaphone, count: null },
          { id: 'submissions', label: 'Student Submissions Inbox', icon: MessageSquare, count: submissions.filter(s => s.status === 'submitted').length },
          { id: 'requests', label: 'Group Approvals', icon: Users, count: groupRequests.filter(r => r.status === 'pending').length },
          { id: 'levels', label: 'Class Levels', icon: Layers, count: classLevels.length }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSelectedSubmission(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-100'
                  : theme === 'dark'
                  ? 'bg-gray-900/80 text-gray-400 hover:text-white border border-gray-800'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-gray-950 font-black text-[10px]">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-6xl w-full mx-auto">
        {/* TAB 1: PUBLISH TO COMMUNITY */}
        {activeTab === 'publish' && (
          <div className="max-w-2xl mx-auto space-y-5">
            {publishSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 size={20} className="shrink-0" />
                <p className="text-xs font-bold leading-relaxed">{publishSuccess}</p>
              </div>
            )}

            <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900/70 border-gray-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between pb-4 border-b border-gray-800/80 mb-5">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-indigo-400">
                    Create Community Broadcast
                  </h2>
                  <p className="text-xs text-gray-400">
                    Published items will instantly show as assigned or announcement cards on the General Feed and target study circle.
                  </p>
                </div>

                {/* Switch Type */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-950 border border-gray-800">
                  <button
                    type="button"
                    onClick={() => setPublishType('assignment')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      publishType === 'assignment' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Assignment
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublishType('announcement')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      publishType === 'announcement' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Announcement
                  </button>
                </div>
              </div>

              <form onSubmit={handlePublish} className="space-y-4">
                {/* Target Group & Class Level */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                      Target Audience / Group *
                    </label>
                    <select
                      value={targetGroup}
                      onChange={(e) => setTargetGroup(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold outline-none border ${
                        theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <option value="all">🌍 All Groups & Community Feed</option>
                      <option value="sciences">🧪 Sciences (Bio, Chem, Phys, Agri)</option>
                      <option value="humanities">📚 Humanities (Hist, Geo, Soc)</option>
                      <option value="languages">✍️ Languages (Chichewa, English)</option>
                      <option value="general">🎓 General MSCE Preparation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                      Class Level *
                    </label>
                    <select
                      value={classLevel}
                      onChange={(e) => setClassLevel(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold outline-none border ${
                        theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {classLevels.map((lvl) => (
                        <option key={lvl.id} value={lvl.name}>{lvl.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                    {publishType === 'assignment' ? 'Assignment Title *' : 'Announcement Headline *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={publishType === 'assignment' ? 'e.g. Physics Form 4: Internal Resistance Calculations' : 'e.g. MSCE Mock Exams Schedule & Examination Timetable'}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold outline-none border ${
                      theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                {/* Instructions / Content */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                    {publishType === 'assignment' ? 'Detailed Task Instructions & Questions *' : 'Detailed Announcement Notice *'}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={publishType === 'assignment' ? 'Provide questions, steps required, and formatting guidelines for students to submit...' : 'Write the official community update, guidelines or notice...'}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none border resize-none ${
                      theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                {/* Assignment Specifics: Subject, Points, Due Date */}
                {publishType === 'assignment' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-gray-950/60 border border-gray-800">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Subject</label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Biology"
                        className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-gray-900 border border-gray-800 text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Max Points (Marks)</label>
                      <input
                        type="number"
                        value={points}
                        onChange={(e) => setPoints(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-gray-900 border border-gray-800 text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-gray-900 border border-gray-800 text-white outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Optional Attachment */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                    Resource Link / Worksheet PDF URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="https://example.com/question-paper.pdf"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none border ${
                      theme === 'dark' ? 'bg-gray-950 border-gray-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isPublishing}
                    className={`w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 ${
                      publishType === 'assignment'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                    }`}
                  >
                    {isPublishing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    <span>
                      {publishType === 'assignment' ? 'Publish Assignment to Feed & Group' : 'Broadcast Announcement to Feed'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: STUDENT SUBMISSIONS INBOX & CHAT */}
        {activeTab === 'submissions' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
            {/* Submissions List Column */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Inbox Submissions ({filteredSubmissions.length})
                </h3>
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  {(['all', 'needs_marking', 'marked'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setSubmissionFilter(st)}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        submissionFilter === st
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                      }`}
                    >
                      {st === 'all' ? 'All' : st === 'needs_marking' ? 'Pending' : 'Graded'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
                {filteredSubmissions.length === 0 ? (
                  <div className="text-center py-16 opacity-60">
                    <UserCheck size={32} className="mx-auto mb-2 text-gray-500" />
                    <p className="font-bold text-xs">No Submissions Found</p>
                    <p className="text-[11px] text-gray-500">Student answers will appear here in real-time.</p>
                  </div>
                ) : (
                  filteredSubmissions.map((sub) => {
                    const isSelected = selectedSubmission?.id === sub.id;
                    return (
                      <div
                        key={sub.id}
                        onClick={() => setSelectedSubmission(sub)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-600/10 shadow-md'
                            : theme === 'dark'
                            ? 'bg-gray-900/80 border-gray-800 hover:border-gray-700'
                            : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-extrabold text-xs">{sub.studentName}</span>
                          {sub.status === 'marked' ? (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Score: {sub.score} Marks
                            </span>
                          ) : (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Needs Marking
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2 mb-2 leading-relaxed">
                          {sub.content || 'Attached File Submission'}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold">
                          <span className="uppercase font-bold text-indigo-400">Group: {sub.groupId}</span>
                          <span>{formatRealTime(sub.submittedAt)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Submission Detail & Interactive Chat Column */}
            <div className="lg:col-span-7">
              {selectedSubmission ? (
                <div className={`p-5 rounded-3xl border h-full flex flex-col ${
                  theme === 'dark' ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  {/* Submission Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-gray-800 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-sm">{selectedSubmission.studentName}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 uppercase">
                          {selectedSubmission.groupId}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500">
                        Submitted on: {formatRealTime(selectedSubmission.submittedAt)}
                      </span>
                    </div>

                    {selectedSubmission.status === 'marked' && (
                      <div className="text-right">
                        <span className="text-lg font-black text-emerald-400">{selectedSubmission.score}</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Graded Score</span>
                      </div>
                    )}
                  </div>

                  {/* Student Work Content */}
                  <div className="p-4 rounded-2xl bg-gray-950/80 border border-gray-800 mb-4">
                    <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                      Student Solution / Answer:
                    </span>
                    <p className="text-xs text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {selectedSubmission.content}
                    </p>
                    {selectedSubmission.attachmentUrl && (
                      <a
                        href={selectedSubmission.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-400 text-xs font-bold border border-indigo-500/30"
                      >
                        <Download size={13} />
                        <span>View Student Attached File</span>
                      </a>
                    )}
                  </div>

                  {/* Teacher Grading Box */}
                  <form onSubmit={handleGradeSubmission} className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 mb-4">
                    <span className="text-[10px] font-black uppercase text-emerald-400 block mb-2">
                      Marking & Feedback Form
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-0.5">Awarded Marks</label>
                        <input
                          type="number"
                          required
                          value={awardedScore}
                          onChange={(e) => setAwardedScore(Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-xl text-xs font-black bg-gray-900 border border-gray-800 text-emerald-400 outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-gray-400 mb-0.5">Teacher Feedback</label>
                        <input
                          type="text"
                          value={teacherFeedback}
                          onChange={(e) => setTeacherFeedback(e.target.value)}
                          placeholder="e.g. Excellent step breakdown on titration..."
                          className="w-full px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-900 border border-gray-800 text-white outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={savingGrade}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 active:scale-95 shadow-md"
                    >
                      {savingGrade ? <Loader2 size={13} className="animate-spin" /> : <Award size={13} />}
                      <span>Save Grade & Return Feedback</span>
                    </button>
                  </form>

                  {/* Admin-Student Two-way Chat in Inbox */}
                  <div className="flex-1 flex flex-col min-h-[160px] border-t border-gray-800 pt-3">
                    <span className="text-[10px] font-black uppercase text-gray-400 block mb-2 flex items-center gap-1">
                      <MessageSquare size={12} className="text-indigo-400" />
                      Two-Way Discussion Chat with {selectedSubmission.studentName}
                    </span>

                    <div className="flex-1 overflow-y-auto space-y-2 mb-3 max-h-44 p-2 rounded-xl bg-gray-950/40">
                      {chatMessages.length === 0 ? (
                        <p className="text-[11px] text-gray-500 text-center py-4">
                          No messages yet. Send an inquiry or clarification to the student below.
                        </p>
                      ) : (
                        chatMessages.map((msg) => {
                          const isAdmin = msg.role === 'admin';
                          return (
                            <div
                              key={msg.id}
                              className={`p-2 rounded-xl text-xs max-w-[85%] ${
                                isAdmin
                                  ? 'ml-auto bg-indigo-600 text-white'
                                  : 'mr-auto bg-gray-800 text-gray-200 border border-gray-700'
                              }`}
                            >
                              <span className="block text-[9px] font-black opacity-75 mb-0.5">
                                {isAdmin ? 'Teacher (You)' : selectedSubmission.studentName}
                              </span>
                              <p className="leading-snug">{msg.text}</p>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form onSubmit={handleSendAdminReply} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newAdminReply}
                        onChange={(e) => setNewAdminReply(e.target.value)}
                        placeholder={`Message ${selectedSubmission.studentName}...`}
                        className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-gray-950 border border-gray-800 text-white outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={sendingReply || !newAdminReply.trim()}
                        className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                      >
                        {sendingReply ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                        <span>Send</span>
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 border border-dashed rounded-3xl border-gray-800 text-center text-gray-500">
                  <MessageSquare size={36} className="mb-2 opacity-50" />
                  <p className="text-xs font-bold">Select a student submission from the list</p>
                  <p className="text-[11px] text-gray-500 max-w-xs mt-1">
                    You can review their submitted answers, return grades, and converse in the admin inbox chat.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: GROUP REQUESTS APPROVALS */}
        {activeTab === 'requests' && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400">
                  User Group Creation Requests
                </h3>
                <p className="text-xs text-gray-500">
                  Students and teachers can submit requests to create new subject clubs and study circles.
                </p>
              </div>

              <div className="flex items-center gap-1">
                {(['pending', 'approved', 'rejected'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setRequestFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                      requestFilter === st
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-16 opacity-60">
                  <Users size={32} className="mx-auto mb-2 text-gray-500" />
                  <p className="font-bold text-xs">No {requestFilter} Group Requests</p>
                  <p className="text-[11px] text-gray-500">User group creation proposals will be listed here.</p>
                </div>
              ) : (
                filteredRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`p-4 rounded-3xl border transition-all ${
                      theme === 'dark' ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black text-sm">{req.name}</h4>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {req.category}
                          </span>
                          {req.classLevel && (
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                              {req.classLevel}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          {req.description}
                        </p>
                      </div>

                      {req.status === 'pending' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleApproveRequest(req)}
                            disabled={processingReqId === req.id}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-md active:scale-95 transition-all"
                          >
                            <Check size={13} strokeWidth={3} />
                            <span>Approve & Launch</span>
                          </button>
                          <button
                            onClick={() => handleRejectRequest(req.id)}
                            disabled={processingReqId === req.id}
                            className="px-3 py-1.5 rounded-xl bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                          >
                            <X size={13} strokeWidth={3} />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between text-[11px] text-gray-500 font-semibold">
                      <span>Requested by {req.requesterName}</span>
                      <span>{formatRealTime(req.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CLASS LEVELS MANAGER */}
        {activeTab === 'levels' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="pb-3 border-b border-gray-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400">
                Academic Class Levels
              </h3>
              <p className="text-xs text-gray-500">
                Configure grade levels (e.g. Form 1 to Form 4 MSCE, College) used for grouping and filtering community assignments.
              </p>
            </div>

            {/* Add New Class Level Form */}
            <form onSubmit={handleAddClassLevel} className={`p-4 rounded-3xl border space-y-3 ${
              theme === 'dark' ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-xs font-black uppercase text-gray-400 block">Add New Class Level</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={newLevelName}
                  onChange={(e) => setNewLevelName(e.target.value)}
                  placeholder="Level Name (e.g. Form 4 (MSCE))"
                  className="px-3 py-2 rounded-xl text-xs bg-gray-950 border border-gray-800 text-white outline-none"
                />
                <input
                  type="text"
                  required
                  value={newLevelCode}
                  onChange={(e) => setNewLevelCode(e.target.value)}
                  placeholder="Code (e.g. FORM_4)"
                  className="px-3 py-2 rounded-xl text-xs bg-gray-950 border border-gray-800 text-white outline-none"
                />
              </div>
              <input
                type="text"
                value={newLevelDesc}
                onChange={(e) => setNewLevelDesc(e.target.value)}
                placeholder="Optional description..."
                className="w-full px-3 py-2 rounded-xl text-xs bg-gray-950 border border-gray-800 text-white outline-none"
              />
              <button
                type="submit"
                disabled={addingLevel}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 active:scale-95"
              >
                {addingLevel ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} strokeWidth={3} />}
                <span>Save Level</span>
              </button>
            </form>

            {/* List of Levels */}
            <div className="space-y-2.5">
              {classLevels.map((lvl) => (
                <div
                  key={lvl.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                    theme === 'dark' ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 font-black text-xs flex items-center justify-center">
                      {lvl.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs">{lvl.name}</h4>
                      <span className="text-[10px] text-gray-500 font-mono">{lvl.code}</span>
                      {lvl.description && (
                        <p className="text-[11px] text-gray-400 mt-0.5">{lvl.description}</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteClassLevel(lvl.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
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
