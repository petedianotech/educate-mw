import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Trash2, ShieldAlert } from 'lucide-react';
import { uploadToCloudinary } from '../lib/cloudinary';

interface CloudinaryUploaderProps {
  onUploadSuccess: (url: string) => void;
  onClear: () => void;
  theme: 'light' | 'dark';
  allowedType?: 'pdf' | 'video' | 'any';
}

export function CloudinaryUploader({ 
  onUploadSuccess, 
  onClear, 
  theme,
  allowedType = 'pdf'
}: CloudinaryUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (selectedFile: File) => {
    const isPdf = selectedFile.name.toLowerCase().endsWith('.pdf');
    const isVideo = selectedFile.type.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/i.test(selectedFile.name);

    if (allowedType === 'pdf' && !isPdf) {
      setStatus('error');
      setErrorMsg('Strictly PDF files (.pdf) are supported for syllabus / study notes.');
      return;
    }

    if (allowedType === 'video' && !isVideo) {
      setStatus('error');
      setErrorMsg('Strictly video files (.mp4, .mov, .avi, .mkv, .webm) are supported.');
      return;
    }

    if (allowedType === 'any' && !isPdf && !isVideo) {
      setStatus('error');
      setErrorMsg('Only PDF and Video files are supported.');
      return;
    }

    // Limit to 25MB for typical Cloudinary unsigned accounts (or 100MB for video)
    const maxBytes = allowedType === 'video' ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
    if (selectedFile.size > maxBytes) {
      setStatus('error');
      setErrorMsg(`File is too large. Maximum size is ${allowedType === 'video' ? '100MB' : '25MB'}.`);
      return;
    }

    setFile(selectedFile);
    setStatus('uploading');
    setProgress(0);
    setErrorMsg('');

    try {
      const res = await uploadToCloudinary(selectedFile, (p) => {
        setProgress(p);
      });
      setCloudinaryUrl(res.secure_url);
      setStatus('success');
      onUploadSuccess(res.secure_url);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'Interrupted Cloudinary connection. Try again.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setFile(null);
    setProgress(null);
    setStatus('idle');
    setCloudinaryUrl('');
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClear();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">
          {allowedType === 'video' ? 'Study Video Upload' : 'Syllabus Notes PDF Upload'}
        </label>
        <span className="text-[8px] text-indigo-400 font-extrabold uppercase bg-indigo-500/10 px-2 py-0.5 rounded">
          Secure Upload
        </span>
      </div>

      {status === 'idle' && (
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
            dragActive 
              ? 'border-indigo-500 bg-indigo-500/5 scale-[1.01]' 
              : theme === 'dark' 
                ? 'border-gray-800 hover:border-gray-700 bg-gray-950/40 hover:bg-gray-950/80' 
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            accept={allowedType === 'video' ? 'video/*' : '.pdf'} 
            onChange={handleFileChange} 
            className="hidden" 
          />
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
            theme === 'dark' ? 'bg-gray-900 text-indigo-400' : 'bg-white text-indigo-600 shadow-sm'
          }`}>
            <Upload size={18} strokeWidth={2.5} />
          </div>
          <div>
            <p className={`text-xs font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Drag & Drop {allowedType === 'video' ? 'video file' : 'syllabus PDF'} here
            </p>
            <p className="text-[10px] text-gray-400 font-bold mt-1">
              or click to browse library files (Max {allowedType === 'video' ? '100MB' : '25MB'})
            </p>
          </div>
        </div>
      )}

      {status === 'uploading' && (
        <div className={`p-5 rounded-3xl border ${
          theme === 'dark' ? 'bg-gray-950 border-gray-900' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center animate-pulse">
              <FileText size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-black truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {file?.name}
              </p>
              <p className="text-[9px] text-gray-400 font-bold">
                {file ? (file.size / (1024 * 1024)).toFixed(2) : 0} MB • Uploading to Cloudinary...
              </p>
            </div>
            <span className="text-xs font-mono font-black text-indigo-500">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-gray-900 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full transition-all duration-300 rounded-full" 
              style={{ width: `${progress || 0}%` }}
            />
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className={`p-5 rounded-3xl border ${
          theme === 'dark' ? 'bg-gray-950 border-gray-900' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-black truncate text-emerald-500`}>
                  Uploaded Successfully!
                </p>
                <p className={`text-[10px] font-mono truncate ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'} mt-0.5`}>
                  Link: {cloudinaryUrl}
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={handleClear}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                theme === 'dark' 
                  ? 'border-gray-800 bg-gray-900 text-rose-500 hover:bg-gray-800' 
                  : 'border-slate-200 bg-slate-50 text-rose-500 hover:bg-slate-100'
              }`}
              title="Delete and replace file"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className={`p-5 rounded-3xl border ${
          theme === 'dark' ? 'bg-gray-900/40 border-rose-950 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
        }`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
              <AlertCircle size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black">Upload Failed</p>
              <p className="text-[10px] font-bold opacity-80 mt-1 leading-normal">
                {errorMsg}
              </p>
              <button 
                type="button"
                onClick={handleClear}
                className={`mt-3 px-3 py-1.5 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all ${
                  theme === 'dark' 
                    ? 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800' 
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm'
                }`}
              >
                Reset Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
