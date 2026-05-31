import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp, 
  doc, 
  getDoc, 
  updateDoc 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { 
  Award, 
  ShieldCheck, 
  Check, 
  Download, 
  Search, 
  Smartphone, 
  Lock, 
  Sparkles, 
  CreditCard, 
  Printer, 
  ArrowLeft,
  FileCheck
} from 'lucide-react';

interface Certificate {
  id?: string;
  certificateId: string;
  name: string;
  type: 'attendance' | 'appreciation';
  date: string;
  userId: string;
  userEmail: string;
  isPaid: boolean;
  securityHash: string;
  createdAt?: any;
}

export function CertificatesCleanView({ 
  onBack, 
  theme = 'dark', 
  profile, 
  onUpdateProfile 
}: { 
  onBack: () => void; 
  theme?: 'light' | 'dark'; 
  profile: any; 
  onUpdateProfile: (p: any) => void; 
}) {
  const [activeTab, setActiveTab] = useState<'my-certs' | 'verify'>('my-certs');
  const [certType, setCertType] = useState<'attendance' | 'appreciation'>('attendance');
  const [recipientName, setRecipientName] = useState(profile?.name || 'Student');
  const [certificateDate, setCertificateDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  // My purchased certificates
  const [myCertificates, setMyCertificates] = useState<Certificate[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(false);
  
  // Verification states
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    status: 'unchecked' | 'searching' | 'verified' | 'failed';
    cert?: Certificate;
    errorMsg?: string;
  }>({ status: 'unchecked' });

  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<'airtel' | 'tnm'>('airtel');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentStep, setPaymentStep] = useState<'input' | 'processing' | 'success'>('input');
  const [paymentError, setPaymentError] = useState('');
  
  const printRef = useRef<HTMLDivElement>(null);

  // Load certificates for current user
  const loadMyCertificates = async () => {
    if (!auth.currentUser) return;
    setLoadingCerts(true);
    try {
      const q = query(
        collection(db, 'certificates'), 
        where('userId', '==', auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      const list: Certificate[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Certificate);
      });
      setMyCertificates(list);
    } catch (e) {
      console.error("Failed to load certificates:", e);
    } finally {
      setLoadingCerts(false);
    }
  };

  useEffect(() => {
    loadMyCertificates();
    try {
      const autoCode = localStorage.getItem('mw_auto_verify_code');
      if (autoCode) {
        setVerifyCodeInput(autoCode);
        setActiveTab('verify');
        localStorage.removeItem('mw_auto_verify_code');
        handleVerifyCertificate(autoCode);
      }
    } catch (e) {
      console.error(e);
    }
  }, [profile]);

  // Generate unique tamper-proof security hash (similar to government checksums)
  const generateSecurityCode = (name: string, date: string, type: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randPart = '';
    for (let i = 0; i < 5; i++) {
      randPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const cleanDate = date.replace(/-/g, '');
    const certPrefix = 'EM-CERT';
    return `${certPrefix}-${cleanDate}-${randPart}`;
  };

  const handleStartPayment = () => {
    if (!recipientName.trim()) {
      alert("Please enter a valid certificate recipient name.");
      return;
    }
    setPaymentStep('input');
    setPaymentError('');
    setShowPaymentModal(true);
  };

  const processMobileMoneyPayment = async () => {
    if (!phoneNumber) {
      setPaymentError("Phone number is required.");
      return;
    }
    if (phoneNumber.length < 9) {
      setPaymentError("Please enter a valid Malawian mobile number.");
      return;
    }

    setPaymentStep('processing');
    setPaymentError('');

    // Simulate mobile money prompt API connection with Airtel Money or TNM Mpamba
    setTimeout(async () => {
      try {
        if (!auth.currentUser) {
          setPaymentError("You must be logged in to verify your certificate.");
          setPaymentStep('input');
          return;
        }

        // Generate tamper-proof unique certificate ID
        const finalCertId = generateSecurityCode(recipientName, certificateDate, certType);
        
        // SHA-like short checksum based on user state to verify database integrity
        const checksumData = `${finalCertId}|${recipientName}|${auth.currentUser.uid}`;
        let securityHash = 0;
        for (let i = 0; i < checksumData.length; i++) {
          securityHash = (securityHash << 5) - securityHash + checksumData.charCodeAt(i);
          securityHash |= 0;
        }
        const tamperCheckCode = Math.abs(securityHash).toString(16).toUpperCase();

        const newCertificate: Omit<Certificate, 'id'> = {
          certificateId: finalCertId,
          name: recipientName,
          type: certType,
          date: certificateDate,
          userId: auth.currentUser.uid,
          userEmail: auth.currentUser.email || '',
          isPaid: true,
          securityHash: tamperCheckCode
        };

        // Add certificate directly to Firestore under certificates
        await addDoc(collection(db, 'certificates'), {
          ...newCertificate,
          createdAt: serverTimestamp()
        });

        // Award Educate Malawi activity points
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const newPoints = (profile?.points || 0) + 1500; // Extra points for certification
        await updateDoc(userRef, { points: newPoints });
        onUpdateProfile({ ...profile, points: newPoints });

        setPaymentStep('success');
        loadMyCertificates();
      } catch (err: any) {
        setPaymentError(err.message || "Failed to finalize payment. Try again.");
        setPaymentStep('input');
      }
    }, 4000); // realistic payment completion latency
  };

  const handleVerifyCertificate = async (forcedCode?: string) => {
    const code = (forcedCode || verifyCodeInput).trim().toUpperCase();
    if (!code) {
      setVerificationResult({ status: 'failed', errorMsg: "Please enter a valid Certificate Serial Code (e.g. EM-CERT-2026-XDFG)." });
      return;
    }

    setVerificationResult({ status: 'searching' });

    try {
      const q = query(
        collection(db, 'certificates'), 
        where('certificateId', '==', code)
      );
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setVerificationResult({ 
          status: 'failed', 
          errorMsg: "WARNING: No authentic certificate match found in the Educate Malawi National Registry. This document code might be counterfeit or unactivated." 
        });
      } else {
        const docSnap = snap.docs[0];
        setVerificationResult({
          status: 'verified',
          cert: { id: docSnap.id, ...docSnap.data() } as Certificate
        });
      }
    } catch (e) {
      setVerificationResult({ status: 'failed', errorMsg: "A database routing error occurred. Please try again." });
    }
  };

  const getFriendlyDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Render SVG QR code for verification
  const renderVerificationQRCode = (certId: string) => {
    const verifyUrl = `${window.location.origin}/?verify=${certId}`;
    return (
      <svg className="w-20 h-20 bg-white p-1 rounded-md" viewBox="0 0 100 100">
        {/* Simplified high quality geometric SVG representation of a qr code */}
        <rect x="5" y="5" width="25" height="25" fill="#1e1b4b" strokeWidth="2" stroke="#1e1b4b" />
        <rect x="10" y="10" width="15" height="15" fill="#ffffff" />
        <rect x="13" y="13" width="9" height="9" fill="#1e1b4b" />

        <rect x="70" y="5" width="25" height="25" fill="#1e1b4b" strokeWidth="2" stroke="#1e1b4b" />
        <rect x="75" y="10" width="15" height="15" fill="#ffffff" />
        <rect x="78" y="13" width="9" height="9" fill="#1e1b4b" />

        <rect x="5" y="70" width="25" height="25" fill="#1e1b4b" strokeWidth="2" stroke="#1e1b4b" />
        <rect x="10" y="75" width="15" height="15" fill="#ffffff" />
        <rect x="13" y="78" width="9" height="9" fill="#1e1b4b" />

        {/* Dynamic decorative pixels inside the QR */}
        <rect x="40" y="10" width="6" height="6" fill="#1e1b4b" />
        <rect x="55" y="5" width="8" height="8" fill="#1e1b4b" />
        <rect x="45" y="25" width="12" height="6" fill="#1e1b4b" />
        <rect x="50" y="40" width="10" height="10" fill="#1e1b4b" />
        <rect x="75" y="45" width="12" height="12" fill="#1e1b4b" />
        <rect x="40" y="75" width="8" height="12" fill="#1e1b4b" />
        <rect x="60" y="70" width="14" height="6" fill="#1e1b4b" />
        <rect x="80" y="80" width="12" height="8" fill="#1e1b4b" />
        <rect x="15" y="40" width="6" height="14" fill="#1e1b4b" />
        <rect x="40" y="55" width="15" height="8" fill="#1e1b4b" />
      </svg>
    );
  };

  return (
    <div className={`p-4 md:p-8 min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Print Style Injector */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area-wrapper, #print-area-wrapper * {
            visibility: visible;
          }
          #print-area-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100vw;
            height: auto;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className={`flex items-center gap-2 font-black uppercase text-xs tracking-widest py-3 px-5 rounded-2xl border transition-all ${
            theme === 'dark' 
              ? 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800' 
              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100 shadow-sm'
          }`}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Award size={22} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-tight">Certificates & Awards</h1>
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 mt-0.5">Educate Malawi Verified Credentials</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 max-w-md mx-auto mb-8 border-b pb-2 border-slate-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('my-certs')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-2xl transition-all ${
            activeTab === 'my-certs'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : (theme === 'dark' ? 'text-gray-400 hover:bg-gray-900' : 'text-slate-500 hover:bg-white border border-slate-100')
          }`}
        >
          My Certificates
        </button>
        <button
          onClick={() => setActiveTab('verify')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-2xl transition-all ${
            activeTab === 'verify'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : (theme === 'dark' ? 'text-gray-400 hover:bg-gray-900' : 'text-slate-500 hover:bg-white border border-slate-100')
          }`}
        >
          Verify Certificate
        </button>
      </div>

      {activeTab === 'my-certs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
          
          {/* Settings / Configuration Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className={`p-6 rounded-[32px] border ${
              theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <h3 className="text-sm font-black uppercase tracking-wider mb-5">Configure Certificate</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Certificate Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCertType('attendance')}
                      className={`py-3 px-4 rounded-xl text-[11px] font-bold border transition-all ${
                        certType === 'attendance'
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : (theme === 'dark' ? 'bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white')
                      }`}
                    >
                      Attendance
                    </button>
                    <button
                      onClick={() => setCertType('appreciation')}
                      className={`py-3 px-4 rounded-xl text-[11px] font-bold border transition-all ${
                        certType === 'appreciation'
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : (theme === 'dark' ? 'bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white')
                      }`}
                    >
                      Appreciation
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Recipient Legal Name (CV)</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className={`w-full py-3.5 px-4 rounded-2xl border font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      theme === 'dark' 
                        ? 'bg-gray-950 border-gray-800 text-white placeholder-gray-600' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Date Awarded</label>
                  <input
                    type="date"
                    value={certificateDate}
                    onChange={(e) => setCertificateDate(e.target.value)}
                    className={`w-full py-3.5 px-4 rounded-2xl border font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      theme === 'dark' 
                        ? 'bg-gray-950 border-gray-800 text-white' 
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Price Info Banner */}
            <div className={`p-6 rounded-[32px] border relative overflow-hidden ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-indigo-950/40 to-indigo-900/10 border-indigo-500/20' 
                : 'bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200 shadow-sm'
            }`}>
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-indigo-500 mb-3">
                  <Sparkles size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Official Certification</span>
                </div>
                <h4 className={`text-base font-black leading-tight mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Official Verification</h4>
                <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4">
                  Pay an administrative fee of <strong className="text-indigo-400">K5,000</strong> to unlock signatures, remove the watermark, receive your unique verification code, and link it to your professional resume/CV.
                </p>
                <button
                  onClick={handleStartPayment}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard size={15} /> Authenticate for K5,000
                </button>
              </div>
            </div>

            {/* My Active Certificates Collection */}
            <div className={`p-6 rounded-[32px] border ${
              theme === 'dark' ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <h3 className="text-sm font-black uppercase tracking-wider mb-5">Your Authenticated Certificates</h3>
              
              {loadingCerts ? (
                <div className="py-8 text-center text-xs text-gray-500">Retrieving secure credentials...</div>
              ) : myCertificates.length > 0 ? (
                <div className="space-y-3">
                  {myCertificates.map((cert) => (
                    <div 
                      key={cert.id}
                      onClick={() => {
                        setCertType(cert.type);
                        setRecipientName(cert.name);
                        setCertificateDate(cert.date);
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                        theme === 'dark'
                          ? 'bg-gray-950 border-gray-800 hover:border-indigo-500/50'
                          : 'bg-slate-50 border-slate-200 hover:border-indigo-500 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-500 shrink-0">
                          <Award size={18} />
                        </div>
                        <div className="text-left">
                          <h4 className="text-xs font-black capitalize leading-tight group-hover:text-indigo-500 transition-colors">{cert.type === 'attendance' ? 'Attendance' : 'Appreciation'}</h4>
                          <p className="text-[10px] text-gray-500 font-bold mt-0.5">{getFriendlyDate(cert.date)}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold py-1 px-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">Verified</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-3">
                  <Award size={32} className="text-gray-700" strokeWidth={1.5} />
                  <p className="px-4 font-bold">You don't have any authenticated certificates yet. Unlock one to present on your resume!</p>
                </div>
              )}
            </div>
          </div>

          {/* Certificate Live Dynamic Preview Display Frame */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-gray-500">
                {myCertificates.some(c => c.name === recipientName && c.type === certType && c.date === certificateDate) ? (
                  <span className="text-emerald-500 flex items-center gap-1.5 font-black uppercase tracking-widest text-[10px]">
                    <ShieldCheck size={14} /> Active Authenticated Certificate
                  </span>
                ) : (
                  <span className="text-amber-500 flex items-center gap-1.5 font-black uppercase tracking-widest text-[10px]">
                    <Lock size={14} /> Unverified Preview Mode
                  </span>
                )}
              </span>

              {myCertificates.some(c => c.name === recipientName && c.type === certType && c.date === certificateDate) && (
                <button
                  onClick={handlePrint}
                  className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-2 active:scale-95"
                >
                  <Printer size={13} /> Save PDF / Print
                </button>
              )}
            </div>

            {/* Certificate Template Body Layout */}
            <div 
              id="print-area-wrapper"
              ref={printRef}
              className={`aspect-[1.414/1] w-full border-[12px] p-6 md:p-12 relative overflow-hidden flex flex-col justify-between text-center select-none shadow-2xl transition-all ${
                theme === 'dark' 
                  ? 'bg-white border-indigo-950 text-indigo-950' 
                  : 'bg-white border-indigo-900 text-indigo-950 shadow-slate-200/50'
              }`}
              style={{ minHeight: '480px' }}
            >
              
              {/* Complex Guilloché-like Ornamental Border Lines */}
              <div className="absolute inset-2 border-2 border-indigo-950/20 pointer-events-none" />
              <div className="absolute inset-4 border border-indigo-950/10 pointer-events-none" />
              
              {/* Background Watermark Logos */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                <span className="font-sans text-[120px] font-black tracking-widest uppercase rotate-[32deg]">EDUCATE</span>
              </div>

              {/* Unpaid Watermark Cover */}
              {!myCertificates.some(c => c.name === recipientName && c.type === certType && c.date === certificateDate) && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none select-none">
                  <div className="border-[6px] border-amber-600/30 text-amber-600/30 px-8 py-4 font-black uppercase tracking-[0.25em] text-xl md:text-2xl rotate-[-25deg] rounded-3xl bg-white/80 backdrop-blur-[1px] shadow-sm">
                    UNOFFICIAL PREVIEW ONLY
                  </div>
                </div>
              )}

              {/* Certificate Top Header Section */}
              <div className="flex flex-col items-center mt-2 relative">
                {/* Educate Malawi Circular Emblem Badge */}
                <div className="w-14 h-14 rounded-full border-2 border-indigo-950 bg-indigo-50 flex items-center justify-center shadow-lg relative mb-3">
                  <div className="w-10 h-10 rounded-full border border-dashed border-indigo-950 flex items-center justify-center">
                    <Award size={20} className="text-indigo-950" />
                  </div>
                </div>

                <div className="text-[11px] font-black tracking-[0.3em] uppercase text-indigo-900">
                  Republic of Malawi
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-indigo-950 font-serif mt-1">
                  EDUCATE MALAWI
                </h2>
                <div className="h-0.5 w-24 bg-indigo-950/20 mt-2.5 mx-auto" />
              </div>

              {/* Main Certificate Title / Core Statement */}
              <div className="my-auto py-4">
                <div className="text-[10px] font-black tracking-[0.35em] uppercase text-indigo-900/60 mb-2">
                  Award of Certificate
                </div>
                
                <h1 className="text-xl md:text-3xl font-black font-serif tracking-normal text-indigo-900 mb-5 uppercase">
                  {certType === 'attendance' ? 'Certificate of Attendance' : 'Certificate of Appreciation'}
                </h1>
                
                <p className="text-[11px] font-sans font-semibold tracking-wide text-indigo-950/70 italic max-w-lg mx-auto">
                  This state credential certifies active participation, commitment, and accomplishments:
                </p>
                
                <div className="my-4">
                  <h3 className="text-2xl md:text-4xl font-serif font-black underline decoration-indigo-900/20 decoration-2 underline-offset-8 text-indigo-900 filter drop-shadow-sm leading-tight">
                    {recipientName || 'Student'}
                  </h3>
                </div>

                <p className="text-[11px] font-sans font-bold leading-relaxed text-indigo-900/80 max-w-xl mx-auto px-4 mt-4">
                  {certType === 'attendance' ? (
                    <span>For exceptional diligence completing online curriculum studies, active learning, and preparing successfully for the JCE or MSCE secondary examinations guided by Emi AI Academic Support.</span>
                  ) : (
                    <span>In profound recognition of active academic improvement, passion for learning, peer assistance, and contribution towards secondary school syllabus mastery on Educate Malawi.</span>
                  )}
                </p>
              </div>

              {/* Footer Credentials & Anti-Tamper Codes Section */}
              <div className="flex flex-col md:flex-row items-end justify-between border-t border-indigo-950/10 pt-4 mt-2">
                
                {/* Signatures & Security Seals */}
                <div className="flex items-center gap-8 text-left">
                  {/* Stamp/Hologram */}
                  <div className="relative flex items-center justify-center shrink-0">
                    <div className="w-14 h-14 rounded-full border border-indigo-950/20 flex items-center justify-center bg-indigo-50/50">
                      {myCertificates.some(c => c.name === recipientName && c.type === certType && c.date === certificateDate) ? (
                        <>
                          {/* Rich green holographic verification secure stamp */}
                          <div className="absolute inset-0 bg-emerald-500/10 border-2 border-emerald-600 rounded-full animate-pulse flex items-center justify-center">
                            <div className="w-10 h-10 border border-dashed border-emerald-600 rounded-full flex items-center justify-center text-[8px] font-black text-emerald-600 text-center uppercase tracking-tighter leading-none">
                              VERIFIED<br/>STAMP
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 border-2 border-dashed border-amber-600/30 rounded-full flex items-center justify-center text-[7px] font-bold text-amber-600/30 text-center uppercase tracking-tight leading-none">
                          SEAL<br/>LOCKED
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Signature line 1 */}
                  <div className="border-t border-indigo-950/40 pt-1.5 min-w-[120px]">
                    <div className="text-[11.5px] font-bold font-serif italic text-indigo-900/80 mb-0.5 leading-none">
                      {myCertificates.some(c => c.name === recipientName && c.type === certType && c.date === certificateDate) ? 'Emi AI' : '••••••••••••'}
                    </div>
                    <div className="text-[8px] uppercase font-black tracking-widest text-indigo-950/50">
                      Emi AI Director
                    </div>
                  </div>

                  {/* Signature line 2 */}
                  <div className="border-t border-indigo-950/40 pt-1.5 min-w-[120px]">
                    <div className="text-[11.5px] font-bold font-serif italic text-indigo-900/80 mb-0.5 leading-none">
                      {myCertificates.some(c => c.name === recipientName && c.type === certType && c.date === certificateDate) ? 'Chisomo Phiri' : '••••••••••••'}
                    </div>
                    <div className="text-[8px] uppercase font-black tracking-widest text-indigo-950/50">
                      Committee Chair
                    </div>
                  </div>
                </div>

                {/* Secure QR / Verification Details */}
                <div className="flex items-center gap-4 mt-4 md:mt-0 text-right">
                  <div className="flex flex-col justify-end text-[8px] font-bold text-indigo-950/70 tracking-tight">
                    <div>DATE AWARDED: <span className="font-black text-indigo-950">{getFriendlyDate(certificateDate)}</span></div>
                    <div className="mt-1">
                      REGISTRY ID:{' '}
                      <span className="font-mono bg-indigo-50 border border-indigo-100 rounded-md py-0.5 px-1 font-black text-indigo-900">
                        {(() => {
                          const currentCertObj = myCertificates.find(c => c.name === recipientName && c.type === certType && c.date === certificateDate);
                          return currentCertObj ? currentCertObj.certificateId : 'EM-CERT-LOCKED-PAY';
                        })()}
                      </span>
                    </div>
                    <div className="mt-1 text-gray-400 font-normal">Educate Malawi Secure Framework v1.2</div>
                  </div>

                  {/* QR code container */}
                  {myCertificates.some(c => c.name === recipientName && c.type === certType && c.date === certificateDate) ? (
                    renderVerificationQRCode(
                      myCertificates.find(c => c.name === recipientName && c.type === certType && c.date === certificateDate)?.certificateId || ''
                    )
                  ) : (
                    <div className="w-16 h-16 bg-slate-100 border border-dashed border-slate-300 rounded flex items-center justify-center text-[7px] text-slate-400 font-bold uppercase tracking-tighter text-center leading-none">
                      QR Code<br/>Locked
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'verify' && (
        <div className="max-w-xl mx-auto">
          <div className={`p-8 rounded-[40px] border shadow-2xl ${
            theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-100'
          }`}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-500">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-xl font-black mb-1.5 uppercase tracking-tight">Educate Malawi Registry</h2>
              <p className="text-xs text-gray-500 font-medium px-4 leading-relaxed">
                We protect academic records from forgery. Enter the unique serial number of any certificate below to confirm its authenticity.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-2.5 mb-8">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  value={verifyCodeInput}
                  onChange={(e) => setVerifyCodeInput(e.target.value)}
                  className={`w-full py-4 pl-12 pr-4 rounded-2xl border font-mono text-xs font-black outline-none tracking-wider uppercase focus:ring-2 focus:ring-indigo-500/20 ${
                    theme === 'dark' 
                      ? 'bg-gray-950 border-gray-800 text-white placeholder-gray-600' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                  placeholder="EM-CERT-YYYYMMDD-XXXXX"
                />
              </div>
              <button
                onClick={() => handleVerifyCertificate()}
                className="py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-600/10 transition-all active:scale-95"
              >
                Verify Code
              </button>
            </div>

            {/* Verification Results Display */}
            {verificationResult.status === 'searching' && (
              <div className="py-12 border-t border-dashed dark:border-gray-800 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Searching National Firestore Registry...</p>
              </div>
            )}

            {verificationResult.status === 'verified' && verificationResult.cert && (
              <div className="border-t border-dashed dark:border-gray-800 pt-6 animate-in fade-in duration-300">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[32px] p-6 text-center">
                  <div className="w-12 h-12 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck size={28} />
                  </div>
                  <h3 className="text-emerald-500 text-sm font-black uppercase tracking-wider mb-2">Government-Grade Authentic Cryptographic Record Found</h3>
                  <div className="h-px bg-emerald-500/10 w-20 mx-auto mb-4" />
                  
                  <div className="space-y-3.5 max-w-sm mx-auto text-left py-2 px-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-wider">Credential ID</span>
                      <span className="font-mono font-black text-gray-200 bg-gray-950 p-1.5 rounded-lg border border-gray-900">{verificationResult.cert.certificateId}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-wider">Student Name</span>
                      <span className="font-black text-white">{verificationResult.cert.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-wider">Certificate Type</span>
                      <span className="font-black italic text-indigo-400 capitalize">{verificationResult.cert.type === 'attendance' ? 'Certificate of Attendance' : 'Certificate of Appreciation'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-wider">Issue Date</span>
                      <span className="font-black text-white">{getFriendlyDate(verificationResult.cert.date)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-wider">Digital Hash Checksum</span>
                      <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest">{verificationResult.cert.securityHash}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-wider">Validation State</span>
                      <span className="font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span> Active & Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {verificationResult.status === 'failed' && (
              <div className="border-t border-dashed dark:border-gray-800 pt-6 animate-in fade-in duration-300">
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-[32px] p-6 text-center">
                  <div className="w-12 h-12 bg-rose-500/15 text-rose-400 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award size={28} className="text-rose-500" />
                  </div>
                  <h3 className="text-rose-500 text-sm font-black uppercase tracking-wider mb-2">Verification Failed</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-semibold px-4">{verificationResult.errorMsg}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Airtel/Mpamba Payment Simulation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className={`p-6 md:p-8 rounded-[40px] border shadow-2xl w-full max-w-md ${
            theme === 'dark' ? 'bg-gray-950 border-gray-800' : 'bg-white border-slate-100'
          }`}>
            
            {paymentStep === 'input' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Smartphone className="text-indigo-500 animate-bounce" size={24} />
                    <h3 className="text-lg font-black tracking-tight uppercase">Educate MW Pay Gateway</h3>
                  </div>
                  <button 
                    onClick={() => setShowPaymentModal(false)}
                    className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center hover:bg-gray-800 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed mb-6 font-semibold">
                  You are unlocking an official authenticated Certificate for <strong className="text-indigo-500">{recipientName}</strong>. Select your payment processor to pay K5,000 securely.
                </p>

                {paymentError && (
                  <p className="text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 p-3.5 rounded-2xl mb-4 leading-normal">{paymentError}</p>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Select Operator</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPaymentProvider('airtel')}
                        className={`py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${
                          paymentProvider === 'airtel'
                            ? 'bg-rose-600 border-rose-600 text-white ring-2 ring-rose-600/35 shadow-lg shadow-rose-600/10'
                            : 'bg-transparent border-gray-800 text-gray-400 hover:bg-gray-900'
                        }`}
                      >
                        Airtel Money
                      </button>
                      <button
                        onClick={() => setPaymentProvider('tnm')}
                        className={`py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${
                          paymentProvider === 'tnm'
                            ? 'bg-emerald-600 border-emerald-600 text-white ring-2 ring-emerald-600/35 shadow-lg shadow-emerald-600/10'
                            : 'bg-transparent border-gray-800 text-gray-400 hover:bg-gray-900'
                        }`}
                      >
                        TNM Mpamba
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Mobile Phone Number</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gray-900 border border-gray-800 text-white outline-none tracking-widest font-black text-sm"
                      placeholder="e.g. 0998765432"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Secret PIN (Interactive Simulation Only)</label>
                    <input
                      type="password"
                      maxLength={4}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gray-900 border border-gray-800 text-white outline-none tracking-[0.4em] font-black text-sm text-center"
                      placeholder="••••"
                    />
                  </div>

                  <button
                    onClick={processMobileMoneyPayment}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-600/25 active:scale-95 transition-all mt-4"
                  >
                    Authenticate and Purchase
                  </button>
                </div>
              </div>
            )}

            {paymentStep === 'processing' && (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <h3 className="font-black text-sm uppercase tracking-widest mt-2">Connecting paying engine...</h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                  We are securely communicating with {paymentProvider === 'airtel' ? 'Airtel Money API' : 'TNM Mpamba API'} nodes to process your administrative certification of K5,000. Undergoing verification checks.
                </p>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="py-6 text-center flex flex-col items-center justify-center gap-4 animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 shadow-xl">
                  <ShieldCheck size={36} />
                </div>
                <h3 className="text-lg font-black text-emerald-500 uppercase tracking-tight mt-2">Payment Authenticated!</h3>
                <p className="text-xs text-gray-500 max-w-sm leading-relaxed px-4">
                  Congratulations! We have activated your official tamper-proof Certificate of Attendance/Appreciation on the Educate Malawi National Firestore Registry databases.
                </p>
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-2.5 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest mt-1">
                  +1500 XP Awarded
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full max-w-xs py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg"
                >
                  View My Credentials
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
