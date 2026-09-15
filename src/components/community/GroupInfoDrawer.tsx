import React, { useState, useEffect } from 'react';
import { 
  X, Users, Shield, Award, Link as LinkIcon, Copy, 
  RefreshCw, Bell, BellOff, Check, Plus, Trash2, 
  Edit3, ShieldCheck, UserCheck, Lock, UserMinus, 
  VolumeX, Volume2, Share2, Info, BookOpen
} from 'lucide-react';
import { CommunityGroup, GroupMember, GroupRole, GroupRule, GroupNotificationSetting } from '../../types/community';
import { db, auth } from '../../lib/firebase';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';

const DEFAULT_RULES: GroupRule[] = [
  { id: 'r-1', text: '1. Respect and academic tone only. No vulgarity or spam.' },
  { id: 'r-2', text: '2. All questions must relate to the MSCE curriculum and study syllabi.' },
  { id: 'r-3', text: '3. Show steps when sharing calculations to help others learn.' },
  { id: 'r-4', text: '4. Voice notes should be concise and focused on educational topics.' }
];

export function GroupInfoDrawer({
  group,
  isOpen,
  onClose,
  theme = 'dark',
  userRole = 'student'
}: {
  group: { id?: string; name: string; desc?: string; members?: number };
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  userRole?: string;
}) {
  const groupId = group.id || group.name.toLowerCase().replace(/\s+/g, '-');
  const isTeacherOrAdmin = userRole === 'teacher' || userRole === 'admin' || userRole === 'owner';

  // Group Rules State
  const [rules, setRules] = useState<GroupRule[]>(() => {
    try {
      const cached = localStorage.getItem(`mw_group_rules_${groupId}`);
      if (cached) return JSON.parse(cached);
    } catch {}
    return DEFAULT_RULES;
  });
  const [newRuleText, setNewRuleText] = useState('');
  const [showAddRule, setShowAddRule] = useState(false);

  // Invite Code State
  const [inviteCode, setInviteCode] = useState(() => {
    return `MW-${groupId.toUpperCase().slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [copiedLink, setCopiedLink] = useState(false);

  // Notification Preferences
  const [notifSetting, setNotifSetting] = useState<GroupNotificationSetting>(() => {
    return (localStorage.getItem(`mw_group_notif_${groupId}`) as GroupNotificationSetting) || 'all';
  });

  // Members list - dynamic from presence/users
  const [members, setMembers] = useState<GroupMember[]>([]);

  useEffect(() => {
    let isMounted = true;
    try {
      const q = query(collection(db, 'user_presence'), limit(50));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        const colorPalette = [
          'bg-amber-500/20 text-amber-400',
          'bg-indigo-500/20 text-indigo-400',
          'bg-purple-500/20 text-purple-400',
          'bg-blue-500/20 text-blue-400',
          'bg-emerald-500/20 text-emerald-400',
          'bg-cyan-500/20 text-cyan-400'
        ];

        const activeList: GroupMember[] = snapshot.docs.map((doc, idx) => {
          const d = doc.data();
          const name = d.displayName || 'Educate MW Member';
          return {
            userId: doc.id,
            name,
            role: (d.role as GroupRole) || (idx === 0 ? 'teacher' : 'student'),
            initial: name.charAt(0).toUpperCase() || 'M',
            avatarColor: colorPalette[idx % colorPalette.length],
            isOnline: d.isOnline !== false
          };
        });

        // Add current user if not in list
        const currentUid = auth.currentUser?.uid || (typeof localStorage !== 'undefined' ? localStorage.getItem('mw_anonymous_uid') : null) || 'me';
        const currentName = auth.currentUser?.displayName || (typeof localStorage !== 'undefined' ? localStorage.getItem('mw_user_name') : null) || 'You (Active)';
        if (!activeList.some(m => m.userId === currentUid)) {
          activeList.unshift({
            userId: currentUid,
            name: currentName,
            role: (userRole as GroupRole) || 'student',
            initial: currentName.charAt(0).toUpperCase() || 'Y',
            avatarColor: 'bg-emerald-500/20 text-emerald-400',
            isOnline: true
          });
        }

        setMembers(activeList);
      }, (err) => {
        console.warn("Members presence load note:", err);
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (e) {
      console.warn("Presence load error:", e);
    }
  }, [groupId, userRole]);

  if (!isOpen) return null;

  const handleCopyInvite = () => {
    const link = `https://educatemw.org/community?join=${inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRegenerateInvite = () => {
    if (!confirm("Regenerating the invite link will invalidate old invite links. Continue?")) return;
    const freshCode = `MW-${groupId.toUpperCase().slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`;
    setInviteCode(freshCode);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleText.trim()) return;
    const newRule: GroupRule = {
      id: `rule-${Date.now()}`,
      text: newRuleText.trim()
    };
    const updated = [...rules, newRule];
    setRules(updated);
    try {
      localStorage.setItem(`mw_group_rules_${groupId}`, JSON.stringify(updated));
    } catch {}
    setNewRuleText('');
    setShowAddRule(false);
  };

  const handleDeleteRule = (ruleId: string) => {
    const updated = rules.filter(r => r.id !== ruleId);
    setRules(updated);
    try {
      localStorage.setItem(`mw_group_rules_${groupId}`, JSON.stringify(updated));
    } catch {}
  };

  const handleNotifChange = (setting: GroupNotificationSetting) => {
    setNotifSetting(setting);
    localStorage.setItem(`mw_group_notif_${groupId}`, setting);
  };

  const handleRoleChange = (userId: string, newRole: GroupRole) => {
    setMembers(prev => prev.map(m => m.userId === userId ? { ...m, role: newRole } : m));
  };

  const handleToggleRestrict = (userId: string) => {
    setMembers(prev => prev.map(m => m.userId === userId ? { ...m, isRestricted: !m.isRestricted } : m));
  };

  const handleRemoveMember = (userId: string) => {
    if (!confirm("Remove this student from the circle?")) return;
    setMembers(prev => prev.filter(m => m.userId !== userId));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-md h-full flex flex-col border-l shadow-2xl overflow-y-auto ${
        theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Drawer Header */}
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-slate-200'} shrink-0 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <Info size={18} className="text-indigo-400" />
            <h3 className="font-black text-sm">Circle Details & Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center active:scale-95"
          >
            <X size={16} />
          </button>
        </div>

        {/* Group Hero Header */}
        <div className="p-6 text-center border-b border-gray-800/60 bg-gradient-to-b from-indigo-500/10 to-transparent">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-3 text-2xl font-black shadow-lg">
            {group.name[0]}
          </div>
          <h2 className="text-lg font-black">{group.name}</h2>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
            {group.desc || 'Active MSCE curriculum study and teacher consultation circle.'}
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
              {members.length} Registered Members
            </span>
          </div>
        </div>

        <div className="p-5 space-y-6 flex-1">
          {/* Notification Preferences */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <Bell size={13} className="text-indigo-400" />
              Notification Settings
            </h4>
            <div className={`p-3 rounded-2xl border ${theme === 'dark' ? 'bg-gray-950/60 border-gray-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'all', label: 'All Messages' },
                  { id: 'mentions', label: 'Mentions Only' },
                  { id: 'announcements', label: 'Announcements Only' },
                  { id: 'assignments', label: 'Assignments Only' },
                  { id: 'events', label: 'Events Only' },
                  { id: 'muted', label: 'Mute Group' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNotifChange(item.id as GroupNotificationSetting)}
                    className={`p-2 rounded-xl text-left font-bold transition-all border ${
                      notifSetting === item.id
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : theme === 'dark'
                        ? 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Group Invite Link */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                <LinkIcon size={13} className="text-indigo-400" />
                Group Invite Link
              </h4>
              {isTeacherOrAdmin && (
                <button
                  onClick={handleRegenerateInvite}
                  className="text-[11px] font-bold text-gray-400 hover:text-white flex items-center gap-1"
                >
                  <RefreshCw size={11} /> Revoke & Regenerate
                </button>
              )}
            </div>

            <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2 ${
              theme === 'dark' ? 'bg-gray-950/60 border-gray-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="truncate">
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Invite Code</span>
                <span className="text-xs font-black text-indigo-400">{inviteCode}</span>
              </div>
              <button
                onClick={handleCopyInvite}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Group Rules */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-indigo-400" />
                Circle Rules & Guidelines
              </h4>
              {isTeacherOrAdmin && (
                <button
                  onClick={() => setShowAddRule(true)}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Plus size={12} /> Add Rule
                </button>
              )}
            </div>

            <div className={`p-4 rounded-2xl border space-y-2.5 ${
              theme === 'dark' ? 'bg-gray-950/60 border-gray-800' : 'bg-slate-50 border-slate-200'
            }`}>
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-start justify-between gap-2 text-xs">
                  <p className="text-gray-300 leading-relaxed flex-1">{rule.text}</p>
                  {isTeacherOrAdmin && (
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-gray-500 hover:text-red-400 p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}

              {showAddRule && (
                <form onSubmit={handleAddRule} className="pt-2 border-t border-gray-800 flex gap-2">
                  <input
                    type="text"
                    required
                    value={newRuleText}
                    onChange={(e) => setNewRuleText(e.target.value)}
                    placeholder="Enter new rule..."
                    className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-gray-900 border border-gray-800 text-white outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                  >
                    Add
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Member Management */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
              <Users size={13} className="text-indigo-400" />
              Member Roster & Roles ({members.length})
            </h4>

            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.userId}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                    theme === 'dark' ? 'bg-gray-950/60 border-gray-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${m.avatarColor || 'bg-indigo-500/20 text-indigo-400'}`}>
                        {m.initial || m.name[0]}
                      </div>
                      {m.isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-gray-950" />
                      )}
                    </div>
                    <div>
                      <h5 className="font-extrabold text-xs leading-tight flex items-center gap-1.5">
                        {m.name}
                        {m.isRestricted && (
                          <span className="text-[9px] font-bold text-red-400 uppercase bg-red-500/10 px-1 rounded">
                            Restricted
                          </span>
                        )}
                      </h5>
                      <span className="text-[10px] font-bold text-gray-500 uppercase">
                        {m.role}
                      </span>
                    </div>
                  </div>

                  {isTeacherOrAdmin && (
                    <div className="flex items-center gap-1">
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.userId, e.target.value as GroupRole)}
                        className="text-[11px] font-bold bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2 py-1 outline-none"
                      >
                        <option value="student">Student</option>
                        <option value="moderator">Moderator</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>

                      <button
                        onClick={() => handleToggleRestrict(m.userId)}
                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                          m.isRestricted ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-white'
                        }`}
                        title={m.isRestricted ? "Unrestrict sending" : "Restrict from sending messages"}
                      >
                        <VolumeX size={13} />
                      </button>

                      <button
                        onClick={() => handleRemoveMember(m.userId)}
                        className="p-1.5 text-gray-400 hover:text-red-400"
                        title="Remove Member"
                      >
                        <UserMinus size={13} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
