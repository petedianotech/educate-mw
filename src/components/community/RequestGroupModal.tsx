import React, { useState, useEffect } from 'react';
import { X, Send, Users, Sparkles, Loader2, BookOpen, Layers } from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot } from 'firebase/firestore';
import { ClassLevel } from '../../types/community';

export function RequestGroupModal({
  isOpen,
  onClose,
  theme = 'dark'
}: {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Sciences');
  const [classLevel, setClassLevel] = useState('Form 4 (MSCE)');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const currentUserId = auth.currentUser?.uid || (typeof localStorage !== 'undefined' ? localStorage.getItem('mw_anonymous_uid') : null) || 'student-user';
  const currentUserName = auth.currentUser?.displayName || (typeof localStorage !== 'undefined' ? localStorage.getItem('mw_user_name') : null) || 'Student Scholar';

  useEffect(() => {
    let isMounted = true;
    try {
      const q = query(collection(db, 'class_levels'));
      const unsub = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        if (!snapshot.empty) {
          const list: ClassLevel[] = snapshot.docs.map(d => ({
            id: d.id,
            name: d.data().name || '',
            code: d.data().code || '',
            description: d.data().description || ''
          }));
          setClassLevels(list);
        } else {
          setClassLevels([
            { id: '1', name: 'Form 1 (Junior)', code: 'FORM_1' },
            { id: '2', name: 'Form 2 (JCE)', code: 'FORM_2' },
            { id: '3', name: 'Form 3 (Senior)', code: 'FORM_3' },
            { id: '4', name: 'Form 4 (MSCE)', code: 'FORM_4' },
            { id: '5', name: 'College / Tertiary', code: 'COLLEGE' }
          ]);
        }
      });
      return () => {
        isMounted = false;
        unsub();
      };
    } catch (e) {}
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'group_requests'), {
        name: name.trim(),
        category,
        classLevel,
        description: description.trim() || 'Collaborative MSCE study group',
        requesterId: currentUserId,
        requesterName: currentUserName,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        onClose();
        setName('');
        setDescription('');
      }, 2000);
    } catch (err) {
      console.error("Submit group request error:", err);
      alert("Could not submit request. Please verify internet connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className={`w-full max-w-md rounded-3xl border p-6 ${
        theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
      }`}>
        <div className="flex items-center justify-between pb-4 border-b border-gray-800/80 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Users size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black">Request New Study Group</h3>
              <p className="text-[11px] text-gray-400">Propose a new study circle for admin review</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-800 text-gray-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <h4 className="text-sm font-bold text-emerald-400">Request Submitted!</h4>
            <p className="text-xs text-gray-400">
              Your study circle proposal has been sent to the admins for approval.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                Group Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. MSCE Chemistry Olympiad Club"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold outline-none border ${
                  theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none border ${
                    theme === 'dark' ? 'bg-gray-950 border-gray-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="Sciences">Sciences</option>
                  <option value="Humanities">Humanities</option>
                  <option value="Languages">Languages</option>
                  <option value="General MSCE">General MSCE</option>
                  <option value="Technical">Technical</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Target Class Level *
                </label>
                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none border ${
                    theme === 'dark' ? 'bg-gray-950 border-gray-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {classLevels.map((lvl) => (
                    <option key={lvl.id} value={lvl.name}>{lvl.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                Purpose & Study Goals
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what members will study, topics covered, and revision materials..."
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none border resize-none ${
                  theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-98 transition-all"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                <span>Submit Group Request to Admin</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
