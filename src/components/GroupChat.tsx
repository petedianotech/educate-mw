import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, MoreVertical, Mic, Square, Trash2, Send, Play, Pause, Clock
} from 'lucide-react';

export function GroupChat({ group, onBack, theme = 'dark' }: { group: {name: string, members: number}, onBack: () => void, theme?: 'light' | 'dark' }) {
  const [messages, setMessages] = useState<{id: string, user: string, text: string, isMe: boolean, type?: 'text' | 'voice', audioUrl?: string, duration?: number}[]>([]);
  const [input, setInput] = useState('');
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [spectrum, setSpectrum] = useState<number[]>(new Array(15).fill(2));
  
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop recording timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      mediaRecorderRef.current.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        chunksRef.current = [];
        stream.getTracks().forEach(track => track.stop());
      };

      chunksRef.current = [];
      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
        if (analyserRef.current) {
           const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
           analyserRef.current.getByteFrequencyData(dataArray);
           const newSpectrum = [];
           for(let i=0; i<15; i++) {
             newSpectrum.push(Math.max(2, (dataArray[i * 2] / 255) * 100));
           }
           setSpectrum(newSpectrum);
        }
      }, 100);
      
    } catch (err) {
      console.error("Recording error:", err);
      // Fallback if no mic permission (mock recording)
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
        setSpectrum(Array.from({length: 15}, () => Math.max(2, Math.random() * 80)));
      }, 100);
      
      setTimeout(() => {
        stopRecording();
      }, 2000); // Auto stop mock after 2s
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (!mediaRecorderRef.current) {
        // Mock fallback audio if no mic available
        setAudioUrl('mock');
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const sendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (audioUrl) {
       setMessages(prev => [...prev, { id: Date.now().toString(), user: 'Me', text: '', isMe: true, type: 'voice', audioUrl, duration: recordingTime / 10 }]);
       setAudioUrl(null);
       setAudioBlob(null);
       setRecordingTime(0);
       return;
    }
    
    if (!input.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), user: 'Me', text: input, isMe: true, type: 'text' }]);
    setInput('');
  };

  const deleteMessage = (id: string) => {
     if(window.confirm("Delete this message?")) {
        setMessages(prev => prev.filter(m => m.id !== id));
     }
  };

  const togglePlay = (id: string, url?: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (url && url !== 'mock') {
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => setPlayingId(null);
        audio.play();
      } else {
        // mock audio finish after 2s
        setTimeout(() => setPlayingId(null), 2000);
      }
      setPlayingId(id);
    }
  };

  return (
    <div className={`absolute inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'} animate-in slide-in-from-right duration-300`}>
      {/* Header - Fixed */}
      <div className={`${theme === 'dark' ? 'bg-gray-900/90 border-gray-800 shadow-lg' : 'bg-white/90 border-slate-200 shadow-sm'} backdrop-blur-xl pt-14 pb-4 px-5 flex items-center shrink-0 z-10 border-b shadow-lg`}>
        <button onClick={onBack} className={`w-10 h-10 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-slate-100 text-slate-600'} rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform`}>
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <div className="ml-4 flex-1">
           <h2 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-base leading-tight flex items-center gap-2`}>
             {group.name} 
             <span className="bg-green-500/20 text-green-400 text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-widest border border-green-500/30">Public Group</span>
           </h2>
           <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 mt-0.5">
             <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
             Group is active
           </p>
        </div>
      </div>
      
      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 hide-scrollbar">
         <div className="flex justify-center mb-8">
            <div className={`${theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} px-4 py-1.5 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] border`}>
               Today
            </div>
         </div>

         {messages.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-8">
                 <div className={`w-16 h-16 rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-100'} flex items-center justify-center mb-4`}>
                     <Mic size={32} className="text-gray-500" />
                 </div>
                 <h3 className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-black`}>No messages yet</h3>
                 <p className="text-gray-500 text-xs font-bold mt-2">Start the conversation or drop a voice note!</p>
             </div>
         )}

         {messages.map((msg) => (
           <div 
              key={msg.id} 
              onContextMenu={(e) => { e.preventDefault(); deleteMessage(msg.id); }}
              onTouchStart={(e) => {
                 const timer = setTimeout(() => deleteMessage(msg.id), 800);
                 e.currentTarget.dataset.timer = timer.toString();
              }}
              onTouchEnd={(e) => clearTimeout(Number(e.currentTarget.dataset.timer))}
              onMouseDown={(e) => {
                 const timer = setTimeout(() => deleteMessage(msg.id), 800);
                 e.currentTarget.dataset.timer = timer.toString();
              }}
              onMouseUp={(e) => clearTimeout(Number(e.currentTarget.dataset.timer))}
              className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              title="Long press to delete"
           >
              {!msg.isMe && (
                <div className="flex items-center gap-2 mb-1.5 ml-1">
                  <div className="w-5 h-5 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[8px] font-black border border-indigo-500/20">
                    {msg.user.charAt(0)}
                  </div>
                  <span className="text-[11px] font-black text-gray-400">{msg.user}</span>
                </div>
              )}
              
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] font-medium shadow-sm transition-all select-none ${
                msg.isMe 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : (theme === 'dark' ? 'bg-gray-900 border-gray-800 text-gray-200 rounded-tl-none' : 'bg-white border-slate-200 text-slate-600 rounded-tl-none')
              }`}>
                 {msg.type === 'voice' ? (
                   <div className="flex items-center gap-3 py-1 min-w-[140px]">
                     <button onClick={() => togglePlay(msg.id, msg.audioUrl)} className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-transform active:scale-90 ${msg.isMe ? 'bg-white/20' : 'bg-indigo-500/20 text-indigo-400'}`}>
                        {playingId === msg.id ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                     </button>
                     <div className="flex-1 space-y-1">
                        <div className="flex items-end gap-0.5 h-4">
                           {Array.from({length: 12}).map((_, j) => (
                             <div key={j} className={`w-1 rounded-full ${msg.isMe ? 'bg-white/40' : 'bg-gray-700'}`} style={{height: `${Math.max(20, Math.random() * 100)}%`}}></div>
                           ))}
                        </div>
                        <div className="flex justify-between text-[8px] font-bold opacity-60">
                           <span>{playingId === msg.id ? 'Playing...' : (msg.duration ? `${msg.duration.toFixed(1)}s` : 'Voice')}</span>
                        </div>
                     </div>
                   </div>
                 ) : msg.text}
              </div>
              <span className="text-[9px] font-bold text-gray-600 mt-1.5 mx-1 uppercase">
                {msg.isMe ? 'Tap and hold to delete' : ''}
              </span>
           </div>
         ))}
      </div>
      
      {/* Input - Fixed */}
      <div className={`${theme === 'dark' ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'} backdrop-blur-xl p-4 shrink-0 border-t flex items-center gap-3 pb-safe-4`}>
         
         <div className="flex-1 relative">
            {audioUrl ? (
                <div className={`${theme === 'dark' ? 'bg-gray-800/80 border-indigo-500/30' : 'bg-slate-100 border-indigo-200'} rounded-2xl px-4 py-2 flex items-center gap-3 border`}>
                   <button onClick={() => togglePlay('preview', audioUrl)} className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0">
                      {playingId === 'preview' ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                   </button>
                   <div className="flex-1 h-3 flex items-center gap-0.5 overflow-hidden">
                       {spectrum.map((h, i) => (
                           <div key={i} className="w-1 rounded-full bg-indigo-400" style={{ height: `${Math.max(10, h)}%` }}></div>
                       ))}
                   </div>
                   <button onClick={cancelRecording} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400">
                      <Trash2 size={18} />
                   </button>
                   <button onClick={() => sendMessage()} className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform">
                      <Send size={14} strokeWidth={3} />
                   </button>
                </div>
            ) : (
                <div className={`flex items-center bg-gray-800/50 rounded-2xl px-4 py-2 border transition-all duration-300 ${isRecording ? 'border-red-500/50 ring-2 ring-red-500/10' : 'border-gray-800 focus-within:border-indigo-500/50'}`}>
                    {isRecording ? (
                        <div className="flex-1 flex items-center gap-3 py-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                            <div className="flex-1 flex items-center gap-1 h-4">
                               {spectrum.map((h, i) => (
                                 <div key={i} className="w-1 rounded-full bg-red-400 transition-all duration-75" style={{ height: `${h}%` }}></div>
                               ))}
                            </div>
                            <span className="text-[10px] font-black text-red-500 w-8 text-right">{(recordingTime / 10).toFixed(1)}s</span>
                        </div>
                    ) : (
                        <input 
                          type="text" 
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Message group..." 
                          className="bg-transparent flex-1 outline-none text-[13px] py-1.5 text-gray-200 font-bold placeholder-gray-500"
                          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        />
                    )}

                    {!input.trim() ? (
                        <button 
                            type="button" 
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`ml-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:text-indigo-400'}`}
                        >
                            {isRecording ? <Square size={14} fill="currentColor" /> : <Mic size={18} />}
                        </button>
                    ) : (
                        <button onClick={() => sendMessage()} className="ml-2 w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform">
                            <Send size={14} strokeWidth={3} />
                        </button>
                    )}
                </div>
            )}
         </div>
      </div>
    </div>
  );
}
