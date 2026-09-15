import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Upload, Plus, Search, Filter, 
  ExternalLink, Trash2, Check, FileCheck, BookOpen, 
  Image as ImageIcon, Link as LinkIcon, Loader2, X, AlertCircle
} from 'lucide-react';
import { GroupResource, ResourceCategory } from '../../types/community';
import { db, auth } from '../../lib/firebase';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, deleteDoc, doc, serverTimestamp, updateDoc, increment
} from 'firebase/firestore';
import { formatRealTime } from '../../lib/presence';

const RESOURCE_TYPE_FILTERS: { label: string; value: string; icon: any }[] = [
  { label: 'All Files', value: 'all', icon: FileText },
  { label: 'Past Papers', value: 'past_paper', icon: BookOpen },
  { label: 'PDFs & Docs', value: 'pdf', icon: FileCheck },
  { label: 'Notes', value: 'notes', icon: FileText },
  { label: 'Images', value: 'image', icon: ImageIcon },
  { label: 'Links', value: 'link', icon: LinkIcon },
];

export function GroupResourcesTab({
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
  const [resources, setResources] = useState<GroupResource[]>(() => {
    try {
      const cached = localStorage.getItem(`mw_group_resources_${groupId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ResourceCategory>('pdf');
  const [subject, setSubject] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileName, setFileName] = useState('');

  const currentUserId = auth.currentUser?.uid || (typeof localStorage !== 'undefined' ? localStorage.getItem('mw_anonymous_uid') : null) || 'student-current';
  const currentUserName = auth.currentUser?.displayName || (typeof localStorage !== 'undefined' ? localStorage.getItem('mw_user_name') : null) || 'Educate MW Member';

  // Firestore real-time listener
  useEffect(() => {
    let isMounted = true;
    try {
      const q = query(
        collection(db, 'group_resources'),
        where('groupId', '==', groupId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        const list: GroupResource[] = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            groupId: d.groupId || groupId,
            title: d.title || 'Untitled Resource',
            description: d.description || '',
            type: d.type || 'pdf',
            url: d.url || '',
            fileSize: d.fileSize || '500 KB',
            subject: d.subject || '',
            uploaderId: d.uploaderId || 'user',
            uploaderName: d.uploaderName || 'Member',
            uploaderRole: d.uploaderRole || 'student',
            downloads: d.downloads || 0,
            createdAt: d.createdAt,
            timeText: d.timeText || undefined
          };
        });
        setResources(list);
        try {
          localStorage.setItem(`mw_group_resources_${groupId}`, JSON.stringify(list));
        } catch {}
      }, (err) => {
        console.warn("Group resources listener note:", err);
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (e) {
      console.warn("Firestore resources init error:", e);
    }
  }, [groupId]);

  // Handle local file selection for lightweight upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
      const sizeInKB = Math.round(file.size / 1024);
      setFileSize(file.size > 1024 * 1024 ? `${sizeInMB} MB` : `${sizeInKB} KB`);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      // Infer type
      if (file.type.includes('pdf')) setType('pdf');
      else if (file.type.includes('image')) setType('image');
      else setType('doc');

      // Create base64 or blob preview url
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setFileUrl(loadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setUploading(true);
    try {
      const newResourceData = {
        groupId,
        title: title.trim(),
        description: description.trim(),
        type,
        url: fileUrl || 'https://educatemw.org/materials',
        fileSize: fileSize || '350 KB',
        subject: subject.trim() || groupName,
        uploaderId: currentUserId,
        uploaderName: currentUserName,
        uploaderRole: userRole,
        downloads: 0,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'group_resources'), newResourceData);

      // Local optimistic update
      const localItem: GroupResource = {
        ...newResourceData,
        id: `local-res-${Date.now()}`,
        timeText: 'Just now'
      };
      setResources(prev => [localItem, ...prev]);

      // Reset
      setTitle('');
      setDescription('');
      setSubject('');
      setFileUrl('');
      setFileName('');
      setFileSize('');
      setShowUploadModal(false);
    } catch (err) {
      console.error("Failed to upload resource:", err);
      // Fallback local persistence
      const localItem: GroupResource = {
        id: `local-res-${Date.now()}`,
        groupId,
        title: title.trim(),
        description: description.trim(),
        type,
        url: fileUrl || '#',
        fileSize: fileSize || '350 KB',
        subject: subject.trim() || groupName,
        uploaderId: currentUserId,
        uploaderName: currentUserName,
        uploaderRole: userRole,
        downloads: 0,
        timeText: 'Just now'
      };
      setResources(prev => [localItem, ...prev]);
      setShowUploadModal(false);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (resource: GroupResource) => {
    setDownloadNotice(`Preparing "${resource.title}"...`);
    try {
      if (resource.id && !resource.id.startsWith('local-')) {
        const ref = doc(db, 'group_resources', resource.id);
        await updateDoc(ref, {
          downloads: increment(1)
        });
      }
      setResources(prev => prev.map(r => r.id === resource.id ? { ...r, downloads: (r.downloads || 0) + 1 } : r));
    } catch {}

    setTimeout(() => {
      if (resource.url && resource.url.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = resource.url;
        link.download = `${resource.title}.${resource.type === 'pdf' ? 'pdf' : resource.type === 'image' ? 'jpg' : 'txt'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (resource.url && resource.url.startsWith('http')) {
        window.open(resource.url, '_blank');
      }
      setDownloadNotice(null);
    }, 600);
  };

  const handleDelete = async (resId: string) => {
    if (!confirm("Are you sure you want to remove this resource?")) return;
    try {
      if (!resId.startsWith('local-')) {
        await deleteDoc(doc(db, 'group_resources', resId));
      }
      setResources(prev => prev.filter(r => r.id !== resId));
    } catch (err) {
      console.error("Delete resource error:", err);
      setResources(prev => prev.filter(r => r.id !== resId));
    }
  };

  const filteredResources = resources.filter(res => {
    const matchesFilter = filterType === 'all' || res.type === filterType;
    const matchesSearch = !searchQuery.trim() || 
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.subject && res.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (res.description && res.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      res.uploaderName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getIconForType = (resType: ResourceCategory) => {
    switch (resType) {
      case 'past_paper':
        return <BookOpen size={20} className="text-amber-400" />;
      case 'pdf':
        return <FileCheck size={20} className="text-red-400" />;
      case 'image':
        return <ImageIcon size={20} className="text-purple-400" />;
      case 'link':
        return <LinkIcon size={20} className="text-blue-400" />;
      default:
        return <FileText size={20} className="text-emerald-400" />;
    }
  };

  const getTypeBadge = (resType: ResourceCategory) => {
    switch (resType) {
      case 'past_paper':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">Past Paper</span>;
      case 'pdf':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">PDF Doc</span>;
      case 'image':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">Diagram / Image</span>;
      case 'link':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">Web Link</span>;
      default:
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Notes</span>;
    }
  };

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'} overflow-y-auto`}>
      {/* Download Alert Toast */}
      {downloadNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-4 py-2 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <Loader2 size={14} className="animate-spin" />
          {downloadNotice}
        </div>
      )}

      {/* Top Controls & Search Bar */}
      <div className={`p-4 border-b ${theme === 'dark' ? 'bg-gray-900/60 border-gray-800' : 'bg-white border-slate-200'} shrink-0 space-y-3`}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-black tracking-tight flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-400" />
              Shared Study Materials
            </h2>
            <p className="text-[11px] text-gray-500 font-semibold">
              {resources.length} educational files, past papers & summaries organized for this circle
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Plus size={15} strokeWidth={3} />
            <span>Share Material</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search past papers, notes, biology, physics..."
            className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium outline-none border ${
              theme === 'dark'
                ? 'bg-gray-950/80 border-gray-800 text-white placeholder:text-gray-500 focus:border-indigo-500'
                : 'bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
          {RESOURCE_TYPE_FILTERS.map((f) => {
            const Icon = f.icon;
            const active = filterType === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilterType(f.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  active
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : theme === 'dark'
                    ? 'bg-gray-800/60 border-gray-700 text-gray-400 hover:text-gray-200'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon size={12} />
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Resource List */}
      <div className="flex-1 p-4 space-y-3">
        {filteredResources.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center border ${
              theme === 'dark' ? 'bg-gray-900 border-gray-800 text-gray-500' : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}>
              <FileText size={28} />
            </div>
            <h3 className="font-extrabold text-sm mb-1">No Materials Found</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4">
              {searchQuery ? 'No results matched your search keyword.' : 'Be the first student or teacher to share past papers or revision notes in this circle!'}
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black inline-flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Upload size={14} /> Upload First Material
            </button>
          </div>
        ) : (
          filteredResources.map((res) => {
            const canDelete = res.uploaderId === currentUserId || userRole === 'teacher' || userRole === 'admin' || userRole === 'owner';
            return (
              <div
                key={res.id}
                className={`p-4 rounded-2xl border transition-all ${
                  theme === 'dark'
                    ? 'bg-gray-900/70 border-gray-800/80 hover:border-indigo-500/40'
                    : 'bg-white border-slate-200/90 shadow-sm hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-slate-100 border-slate-200'
                    }`}>
                      {getIconForType(res.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {getTypeBadge(res.type)}
                        {res.subject && (
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-800/40 px-2 py-0.5 rounded">
                            {res.subject}
                          </span>
                        )}
                      </div>
                      <h4 className={`font-bold text-sm leading-snug line-clamp-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {res.title}
                      </h4>
                      {res.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                          {res.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2.5 text-[11px] text-gray-500 font-semibold">
                        <span>By {res.uploaderName} {res.uploaderRole === 'teacher' ? '🎓' : ''}</span>
                        <span>•</span>
                        <span>{formatRealTime(res.createdAt, res.timeText)}</span>
                        <span>•</span>
                        <span>{res.fileSize || 'Standard'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-indigo-400 font-bold">
                          <Download size={11} /> {res.downloads || 0} downloads
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => handleDownload(res)}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95"
                    >
                      <Download size={13} />
                      <span>{res.type === 'link' ? 'Open' : 'Download'}</span>
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(res.id)}
                        className="text-gray-500 hover:text-red-400 p-1.5 transition-colors"
                        title="Delete Resource"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload Resource Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl border p-5 shadow-2xl ${
            theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Upload size={16} />
                </div>
                <h3 className="font-black text-sm">Share Study Material with Circle</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="w-7 h-7 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Material Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 2022 MSCE Physical Science Paper 2 Solutions"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none border ${
                    theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                    Category Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ResourceCategory)}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium outline-none border ${
                      theme === 'dark' ? 'bg-gray-950 border-gray-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="past_paper">Past Paper (MANEB/Mock)</option>
                    <option value="pdf">PDF Document / Book</option>
                    <option value="notes">Summary Notes</option>
                    <option value="image">Diagram / Worksheet Image</option>
                    <option value="link">Web Link / Video</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                    Subject / Topic
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Biology, Physics..."
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none border ${
                      theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                  Description / Key Instructions
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize what is inside this document or what chapters it covers..."
                  className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium outline-none border resize-none ${
                    theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'
                  }`}
                />
              </div>

              {type === 'link' ? (
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                    Website or Video URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://..."
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none border ${
                      theme === 'dark' ? 'bg-gray-950 border-gray-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-400 mb-1">
                    Select File (PDF, DOCX, JPG, PNG)
                  </label>
                  <div className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                    fileName ? 'border-indigo-500 bg-indigo-500/10' : theme === 'dark' ? 'border-gray-800 hover:border-gray-700 bg-gray-950' : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}>
                    <input
                      type="file"
                      id="resourceFileInput"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <label htmlFor="resourceFileInput" className="cursor-pointer flex flex-col items-center">
                      <Upload size={24} className={fileName ? 'text-indigo-400 mb-1' : 'text-gray-400 mb-1'} />
                      {fileName ? (
                        <div>
                          <p className="text-xs font-bold text-indigo-400">{fileName}</p>
                          <p className="text-[10px] text-gray-500">{fileSize} • Tap to change</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-bold">Tap to choose file from device</p>
                          <p className="text-[10px] text-gray-500">Supports PDF past papers, notes & worksheets</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || (!fileUrl && !fileName && type !== 'notes')}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-lg disabled:opacity-40 flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Share With Circle</span>
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
