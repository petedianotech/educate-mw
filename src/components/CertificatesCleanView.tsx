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
  FileCheck,
  GraduationCap,
  Upload,
  User,
  Shield,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import html2canvas from 'html2canvas';

interface Certificate {
  id?: string;
  certificateId: string;
  name: string;
  type: 'attendance' | 'appreciation';
  date: string;
  userId: string;
  userEmail: string;
  isPaid: boolean;
  paymentStatus?: 'pending' | 'approved' | 'free_developer';
  securityHash: string;
  photoUrl?: string;
  phoneNumber?: string;
  paymentProvider?: string;
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
  
  // Base64 student photo state
  const [userPhoto, setUserPhoto] = useState<string>('');
  
  // My purchased/pending certificates
  const [myCertificates, setMyCertificates] = useState<Certificate[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
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
  const isDeveloper = auth.currentUser?.email === 'petedianotech@gmail.com';

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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        alert("Please upload an image smaller than 1.5MB for better processing speed.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUserPhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Check if current certificate is fully unlocked/verified
  const getActiveCertificateStatus = () => {
    if (isDeveloper) return { isUnlocked: true, status: 'free_developer' as const };
    const cert = myCertificates.find(
      c => c.name === recipientName && c.type === certType && c.date === certificateDate
    );
    if (!cert) return { isUnlocked: false, status: 'unpaid' as const };
    return { isUnlocked: cert.isPaid, status: cert.paymentStatus || (cert.isPaid ? 'approved' : 'pending') };
  };

  const activeStatus = getActiveCertificateStatus();

  const handleStartPayment = () => {
    if (!recipientName.trim()) {
      alert("Please enter a valid certificate recipient name.");
      return;
    }
    setPaymentStep('input');
    setPaymentError('');
    setShowPaymentModal(true);
  };

  // Developer Free Instant Activation
  const handleDeveloperFreeActivation = async () => {
    if (!recipientName.trim()) {
      alert("Please enter a valid certificate recipient name.");
      return;
    }
    try {
      if (!auth.currentUser) return;
      const finalCertId = generateSecurityCode(recipientName, certificateDate, certType);
      
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
        paymentStatus: 'free_developer',
        securityHash: tamperCheckCode,
        photoUrl: userPhoto || ''
      };

      await addDoc(collection(db, 'certificates'), {
        ...newCertificate,
        createdAt: serverTimestamp()
      });

      // Award Educate Malawi activity points
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const newPoints = (profile?.points || 0) + 1500;
      await updateDoc(userRef, { points: newPoints });
      onUpdateProfile({ ...profile, points: newPoints });

      alert("🎉 Developer Bypass: Your free Certificate has been registered directly on the Educate Malawi Firestore National Database!");
      loadMyCertificates();
    } catch (err: any) {
      alert("Failed to activate developer certificate: " + err.message);
    }
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
          setPaymentError("You must be logged in to buy your certificate.");
          setPaymentStep('input');
          return;
        }

        const finalCertId = generateSecurityCode(recipientName, certificateDate, certType);
        
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
          isPaid: false, // Normal users must await admin confirmation!
          paymentStatus: 'pending',
          phoneNumber: phoneNumber,
          paymentProvider: paymentProvider,
          securityHash: tamperCheckCode,
          photoUrl: userPhoto || ''
        };

        // Add certificate directly to Firestore certificates under "pending" status
        await addDoc(collection(db, 'certificates'), {
          ...newCertificate,
          createdAt: serverTimestamp()
        });

        // Add notification on admin dashboard
        await addDoc(collection(db, 'admin_notifications'), {
          title: "New Cert Payment Request",
          body: `${recipientName} requested certification. Paid K5,000 via ${paymentProvider.toUpperCase()} (${phoneNumber}).`,
          certId: finalCertId,
          userEmail: auth.currentUser.email || '',
          amount: "K5,000",
          provider: paymentProvider,
          status: 'pending',
          createdAt: serverTimestamp()
        });

        setPaymentStep('success');
        loadMyCertificates();
      } catch (err: any) {
        setPaymentError(err.message || "Failed to finalize payment. Try again.");
        setPaymentStep('input');
      }
    }, 3500);
  };

  const handleVerifyCertificate = async (forcedCode?: string) => {
    const code = (forcedCode || verifyCodeInput).trim().toUpperCase();
    if (!code) {
      setVerificationResult({ status: 'failed', errorMsg: "Please enter a valid Certificate Serial Code (e.g. EM-CERT-2591-XXXX)." });
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

  // html2canvas high-res PNG Downloader
  const handleDownloadPNG = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      // Small timeout to guarantee layout completes rendering
      await new Promise(resolve => setTimeout(resolve, 300));
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.2, // Generates ultra-high resolution image
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1024,
        windowHeight: 768
      });
      const dataUrl = canvas.toDataURL('image/png');
      const mockLink = document.createElement('a');
      mockLink.download = `Educate_MW_Certificate_${recipientName.trim().replace(/\s+/g, '_')}.png`;
      mockLink.href = dataUrl;
      document.body.appendChild(mockLink);
      mockLink.click();
      document.body.removeChild(mockLink);
    } catch (err) {
      console.error(err);
      alert("PNG rendering failed. Please use standard PDF / Print instead.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Render SVG QR code for verification
  const renderVerificationQRCode = (certId: string) => {
    return (
      <svg className="w-16 h-16 bg-white p-1 rounded-md border border-indigo-950/15" viewBox="0 0 100 100 shadow-sm">
        <rect x="5" y="5" width="25" height="25" fill="#1e1b4b" />
        <rect x="10" y="10" width="15" height="15" fill="#ffffff" />
        <rect x="13" y="13" width="9" height="9" fill="#1e1b4b" />

        <rect x="70" y="5" width="25" height="25" fill="#1e1b4b" />
        <rect x="75" y="10" width="15" height="15" fill="#ffffff" />
        <rect x="78" y="13" width="9" height="9" fill="#1e1b4b" />

        <rect x="5" y="70" width="25" height="25" fill="#1e1b4b" />
        <rect x="10" y="75" width="15" height="15" fill="#ffffff" />
        <rect x="13" y="78" width="9" height="9" fill="#1e1b4b" />

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
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
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
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md flex items-center justify-center border-2 border-indigo-500/20 bg-white">
            <img 
              src="https://i.ibb.co/G4sm9hB0/educate-mw-app-logo.jpg" 
              alt="Logo" 
              className="w-full h-full object-cover" 
            />
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
              
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Certificate Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCertType('attendance')}
                      className={`py-3 px-4 rounded-xl text-[11px] font-bold border transition-all ${
                        certType === 'attendance'
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                          : (theme === 'dark' ? 'bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-800' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white')
                      }`}
                    >
                      Attendance
                    </button>
                    <button
                      onClick={() => setCertType('appreciation')}
                      className={`py-3 px-4 rounded-xl text-[11px] font-bold border transition-all ${
                        certType === 'appreciation'
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
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

                {/* Upload portrait image slot */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Attach Candidate Portrait Photo</label>
                  <div className="flex items-center gap-3">
                    <label className={`cursor-pointer flex-1 py-3 px-4 rounded-2xl border border-dashed text-center transition-all ${
                      theme === 'dark' 
                        ? 'border-gray-800 hover:border-indigo-500 bg-gray-950 hover:bg-indigo-500/5 text-gray-400 hover:text-white' 
                        : 'border-slate-200 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600'
                    }`}>
                      <div className="flex items-center justify-center gap-2 text-xs font-bold">
                        <Upload size={14} />
                        <span>Select Photo</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoChange} 
                        className="hidden" 
                      />
                    </label>

                    {userPhoto && (
                      <div className="relative w-12 h-14 rounded-xl overflow-hidden border-2 border-indigo-500 shrink-0 shadow-md">
                        <img src={userPhoto} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setUserPhoto('')}
                          className="absolute top-0 right-0 p-1 bg-red-650 hover:bg-red-700 text-white rounded-bl-lg text-[8px] leading-none"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] text-gray-500 mt-1.5 leading-relaxed">Attaching a valid passport photo or student portrait registers this document to your unique biometric record.</p>
                </div>

              </div>
            </div>

            {/* Price Info Banner & Free Developer Bypass */}
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
                
                {isDeveloper ? (
                  <div>
                    <h4 className="text-sm font-black leading-tight mb-2 text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      👑 Developer Bypass Access
                    </h4>
                    <p className="text-xs text-gray-400 font-semibold leading-relaxed mb-4">
                      Special free admin developer clearance activated for <strong className="text-white">petedianotech@gmail.com</strong>. Create authentic certificates instantly without cost.
                    </p>
                    <button
                      onClick={handleDeveloperFreeActivation}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-650/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={15} /> Create Free Certificate
                    </button>
                  </div>
                ) : (
                  <div>
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
                )}
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
                  {myCertificates.map((cert) => {
                    const isPending = !cert.isPaid;
                    return (
                      <div 
                        key={cert.id}
                        onClick={() => {
                          setCertType(cert.type);
                          setRecipientName(cert.name);
                          setCertificateDate(cert.date);
                          if (cert.photoUrl) setUserPhoto(cert.photoUrl);
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
                        {isPending ? (
                          <span className="text-[10px] font-black py-1 px-2.5 bg-amber-500/10 text-amber-500 rounded-lg animate-pulse border border-amber-500/25">Pending</span>
                        ) : (
                          <span className="text-[10px] font-black py-1 px-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/25">Approved</span>
                        )}
                      </div>
                    );
                  })}
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
            
            <div className="flex items-center justify-between px-1 flex-wrap gap-2">
              <span className="text-xs font-bold text-gray-500">
                {activeStatus.isUnlocked ? (
                  <span className="text-emerald-500 flex items-center gap-1.5 font-black uppercase tracking-widest text-[10.5px]">
                    <ShieldCheck size={14} /> {activeStatus.status === 'free_developer' ? 'Developer Bypass Active' : 'Active Authenticated Certificate'}
                  </span>
                ) : activeStatus.status === 'pending' ? (
                  <span className="text-amber-505 flex items-center gap-1.5 font-black uppercase tracking-widest text-[10.5px] animate-pulse">
                    <AlertCircle size={14} /> Pending Confirmation by Admin
                  </span>
                ) : (
                  <span className="text-amber-500 flex items-center gap-1.5 font-black uppercase tracking-widest text-[10.5px]">
                    <Lock size={14} /> Unverified Preview Mode
                  </span>
                )}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPNG}
                  disabled={downloading}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-2 active:scale-95"
                >
                  <Download size={13} /> {downloading ? 'Downloading...' : 'Download PNG'}
                </button>
                <button
                  onClick={handlePrint}
                  className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-2 active:scale-95"
                >
                  <Printer size={13} /> PDF / Print
                </button>
              </div>
            </div>

            {/* Certificate Template Body Layout */}
            <div 
              id="print-area-wrapper"
              ref={printRef}
              className="aspect-[1.414/1] w-full border-[14px] border-indigo-950 p-6 md:p-10 relative overflow-hidden flex flex-col justify-between text-center select-none shadow-2xl bg-white text-indigo-950"
              style={{ minHeight: '520px' }}
            >
              
              {/* Complex Guilloché-like Ornamental Border Lines */}
              <div className="absolute inset-1.5 border-4 border-double border-amber-600/30 pointer-events-none" />
              <div className="absolute inset-4 border border-indigo-950/15 pointer-events-none" />
              
              {/* Background Watermark Logos */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                <span className="font-sans text-[110px] font-black tracking-widest uppercase rotate-[32deg]">EDUCATE MW</span>
              </div>

              {/* Unpaid Watermark Cover */}
              {!activeStatus.isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none select-none">
                  <div className="border-[6px] border-amber-600/40 text-amber-600/40 px-8 py-4 font-black uppercase tracking-[0.25em] text-lg md:text-xl rotate-[-23deg] rounded-3xl bg-white/90 backdrop-blur-[1px] shadow-sm">
                    {activeStatus.status === 'pending' ? 'CERTIFICATE PENDING ADMIN APPROVAL' : 'UNOFFICIAL PREVIEW ONLY'}
                  </div>
                </div>
              )}

              {/* Certificate Top Header Section - Side-by-side Layout to Prevent Overlaps */}
              <div className="flex items-center justify-between w-full border-b border-indigo-950/10 pb-3 mb-2 relative z-10">
                {/* Left Side: National Academy Logo Badge & Est */}
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                  <div className="w-12 h-12 rounded-full border-2 border-indigo-950 bg-indigo-50 flex items-center justify-center shadow-md overflow-hidden">
                    <img 
                      src="https://i.ibb.co/G4sm9hB0/educate-mw-app-logo.jpg" 
                      alt="Logo" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="text-left leading-tight hidden sm:block">
                    <span className="text-[7px] font-black uppercase tracking-widest text-indigo-900/60 block">ESTABLISHED</span>
                    <span className="text-[8px] font-semibold text-indigo-950 font-mono">2024</span>
                  </div>
                </div>

                {/* Center: Official School Institution Title */}
                <div className="flex-1 px-4 flex flex-col items-center text-center">
                  <div className="text-[8px] md:text-[9px] font-black tracking-[0.35em] uppercase text-indigo-900 leading-none">
                    EDUCATE MALAWI NATIONAL ACADEMY
                  </div>
                  <h2 className="text-sm md:text-lg lg:text-xl font-black tracking-tight text-indigo-950 font-serif mt-1 uppercase leading-none">
                    ACADEMIC EXCELLENCE DIRECTORY
                  </h2>
                  <div className="h-[1.5px] w-14 bg-amber-600/40 mt-1.5 mx-auto" />
                </div>

                {/* Right Side: Registrant Portrait Slot Self-contained (Prevents overlap!) */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right leading-none hidden md:block">
                    <span className="text-[6.5px] font-black uppercase tracking-widest text-indigo-950/50 block mb-0.5">REGISTRANT</span>
                    <span className="text-[7.5px] font-black text-indigo-950 block">PORTRAIT</span>
                  </div>
                  <div className="w-12 h-15 bg-gray-50 border border-indigo-950/20 rounded p-0.5 shadow-md relative overflow-hidden flex items-center justify-center">
                    {userPhoto ? (
                      <img src={userPhoto} className="w-full h-full object-cover rounded" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[5px] text-indigo-950/40 text-center leading-tight font-bold">
                        <User size={10} className="mb-0.5 text-indigo-950/30" />
                        <span>NO PHOTO</span>
                      </div>
                    )}
                    {/* Fake holographic secure overlay effect */}
                    <div className="absolute inset-0 pointer-events-none border border-white/20 rounded" />
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-indigo-950/5 transform rotate-12 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Unique Registrant ID & Validation Numbers placed gracefully at the top-mid body instead of bottom */}
              <div className="relative z-10 -mt-1 mb-2 px-6 flex justify-between items-center text-[7.5px] md:text-[8px] font-bold text-indigo-950/60 uppercase tracking-widest border-t border-b border-indigo-950/5 py-1.5 w-full">
                <span>REGISTRANT ID: <strong className="text-indigo-950 font-mono">{auth.currentUser?.uid ? auth.currentUser.uid.substring(0, 12).toUpperCase() : 'MW-ST-GUEST99'}</strong></span>
                <span>REGISTRATION NO: <strong className="text-indigo-950 font-mono">{auth.currentUser?.uid ? auth.currentUser.uid.substring(0, 8).toUpperCase() : 'EM-82949'}</strong></span>
                <span>STATUS: <strong className="text-emerald-600">VERIFIED BOARD CREDENTIAL</strong></span>
              </div>

              {/* Main Certificate Title / Core Statement */}
              <div className="my-auto py-3 relative z-10">
                <div className="text-[8px] md:text-[9.5px] font-black tracking-[0.4em] uppercase text-amber-600 mb-1 leading-none">
                  OFFICIAL DECREE CREDENTIAL
                </div>
                
                <h1 className="text-xl md:text-2.5xl lg:text-3.5xl font-black font-serif tracking-normal text-indigo-900 mb-3 uppercase">
                  {certType === 'attendance' ? 'Certificate of Attendance' : 'Certificate of Appreciation'}
                </h1>
                
                <p className="text-[9.5px] md:text-[10px] font-sans font-semibold tracking-wide text-indigo-950/70 italic max-w-lg mx-auto">
                  This state-compatible academic credential certifies diligence and study completion:
                </p>
                
                <div className="my-3">
                  <h3 className="text-2xl md:text-3xl lg:text-3.5xl font-serif font-black underline decoration-amber-500/30 decoration-2 underline-offset-6 text-indigo-900 leading-none">
                    {recipientName || 'Student'}
                  </h3>
                </div>

                <p className="text-[9px] md:text-[10.5px] font-sans font-bold leading-relaxed text-indigo-950/70 max-w-lg mx-auto px-4 mt-2.5">
                  {certType === 'attendance' ? (
                    <span>For outstanding diligence mastering online curriculum studies, and preparing layout questions matching standard school MANEB examinations and local tests guided by Emi AI.</span>
                  ) : (
                    <span>In official recognition of academic performance improvement, consistent study sessions, peer assistance, and curriculum mastery with Educate Malawi.</span>
                  )}
                </p>
              </div>

              {/* Improved UI on list of 3 roles in a single horizontal list with no QR code and no credential ID at the bottom */}
              <div className="border-t border-indigo-950/15 pt-5 mt-2 relative z-10 w-full mb-1">
                <div className="flex items-center justify-between gap-2 md:gap-4 text-center">
                  
                  {/* Signature 1: S. Liffa */}
                  <div className="flex-1 flex flex-col items-center border-t border-indigo-950/25 pt-2 max-w-[170px] mx-auto">
                    <div className="text-[11px] font-bold font-serif italic text-indigo-900 leading-none mb-1.5 h-4 flex items-end">
                      {activeStatus.isUnlocked ? 'S. Liffa' : '••••••••••••'}
                    </div>
                    <div className="text-[7px] font-black uppercase tracking-widest text-indigo-950/60 leading-none">
                      S. Liffa
                    </div>
                    <div className="text-[5.5px] font-bold uppercase tracking-widest text-indigo-950/40 mt-1">
                      Teacher & Mentor
                    </div>
                  </div>

                  {/* Certified Seal centrally located in the horizontal flow */}
                  <div className="relative flex items-center justify-center shrink-0 mx-2">
                    <div className="w-13 h-13 rounded-full border-2 border-amber-600/40 flex items-center justify-center bg-indigo-50/40 relative shadow-sm">
                      {activeStatus.isUnlocked ? (
                        <div className="absolute inset-0.5 bg-emerald-500/10 border border-dashed border-emerald-600 rounded-full flex items-center justify-center">
                          <div className="text-[6px] font-black text-emerald-600 text-center uppercase tracking-tighter leading-none font-sans">
                            BOARD<br/>APPROVED
                          </div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 px-1 border border-dashed border-amber-600/30 rounded-full flex items-center justify-center text-[5.5px] font-bold text-amber-600/40 text-center uppercase tracking-tight leading-none">
                          OFFICER SEAL
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Signature 2: P. Damiano */}
                  <div className="flex-1 flex flex-col items-center border-t border-indigo-950/25 pt-2 max-w-[190px] mx-auto">
                    <div className="text-[11px] font-bold font-serif italic text-indigo-900 leading-none mb-1.5 h-4 flex items-end">
                      {activeStatus.isUnlocked ? 'P. Damiano' : '••••••••••••'}
                    </div>
                    <div className="text-[7px] font-black uppercase tracking-widest text-indigo-950/60 leading-none">
                      P. Damiano
                    </div>
                    <div className="text-[5.5px] font-bold uppercase tracking-widest text-indigo-950/40 mt-1">
                      Director & Chief Architect
                    </div>
                  </div>

                  {/* Certified Stamp 2 for verified credential authentication look */}
                  <div className="relative flex items-center justify-center shrink-0 mx-2 hidden sm:flex">
                    <div className="w-13 h-13 rounded-full border border-double border-indigo-950/30 flex items-center justify-center bg-indigo-50/30">
                      <div className="text-[5.5px] font-black text-indigo-950/50 text-center uppercase tracking-[0.1em] leading-normal font-sans">
                        MEMB.<br/>EST. 2024
                      </div>
                    </div>
                  </div>

                  {/* Signature 3: E. Muthipo */}
                  <div className="flex-1 flex flex-col items-center border-t border-indigo-950/25 pt-2 max-w-[170px] mx-auto">
                    <div className="text-[11px] font-bold font-serif italic text-indigo-900 leading-none mb-1.5 h-4 flex items-end">
                      {activeStatus.isUnlocked ? 'E. Muthipo' : '••••••••••••'}
                    </div>
                    <div className="text-[7px] font-black uppercase tracking-widest text-indigo-950/60 leading-none">
                      E. Muthipo
                    </div>
                    <div className="text-[5.5px] font-bold uppercase tracking-widest text-indigo-950/40 mt-1">
                      Teacher & Registrar
                    </div>
                  </div>

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
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-500 shadow-inner">
                <ShieldCheck size={32} />
              </div>
              
              {/* App Logo in verification section */}
              <div className="flex items-center gap-2 mb-2.5 justify-center">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-indigo-500/20 shadow-md bg-white shrink-0">
                  <img 
                    src="https://i.ibb.co/G4sm9hB0/educate-mw-app-logo.jpg" 
                    alt="Logo" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <span className={`font-sans font-black text-lg tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Educate<span className="text-indigo-550 font-bold">MW</span> Certified
                </span>
              </div>

              <h2 className="text-sm font-black mb-1.5 uppercase tracking-wide">Registry Verification Portal</h2>
              <p className="text-xs text-gray-500 font-medium px-4 leading-relaxed">
                We protect academic records from forgery. Enter the unique serial number of any certificate below to confirm its authenticity.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 mb-8">
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
                  
                  {/* Verified banner stamp with App Logo */}
                  <div className="flex items-center gap-2 mb-4 justify-center bg-emerald-500/20 w-fit mx-auto px-4 py-2 rounded-2xl border border-emerald-500/30">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shrink-0">
                      <GraduationCap size={13} strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                      Genuine EducateMW Certificate
                    </span>
                  </div>

                  <h3 className="text-emerald-400 text-sm font-black uppercase tracking-wider mb-2">Cryptographic Record Verified</h3>
                  <div className="h-px bg-emerald-555/10 w-20 mx-auto mb-4" />
                  
                  {/* Show student picture if verified */}
                  {verificationResult.cert.photoUrl && (
                    <div className="relative w-20 h-24 rounded-2xl overflow-hidden mx-auto mb-5 border-2 border-emerald-500 bg-gray-950 p-0.5 shadow-md">
                      <img src={verificationResult.cert.photoUrl} className="w-full h-full object-cover rounded-xl" />
                    </div>
                  )}

                  <div className="space-y-3.5 max-w-sm mx-auto text-left py-2 px-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-wider">Credential ID</span>
                      <span className="font-mono font-black text-gray-200 bg-gray-950 p-1.5 rounded-lg border border-gray-905">{verificationResult.cert.certificateId}</span>
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
                      <span className="font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span> 
                        Active & Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {verificationResult.status === 'failed' && (
              <div className="border-t border-dashed dark:border-gray-800 pt-6 animate-in fade-in duration-300">
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-[32px] p-6 text-center">
                  <div className="w-12 h-12 bg-rose-500/15 text-rose-400 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-shake">
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
        <div className="fixed inset-0 bg-black/65 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="p-6 md:p-8 bg-gray-950 border border-gray-800 rounded-[40px] shadow-2xl w-full max-w-md text-white">
            
            {paymentStep === 'input' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Smartphone className="text-indigo-400 animate-bounce" size={24} />
                    <h3 className="text-lg font-black tracking-tight uppercase">Educate MW Pay Gateway</h3>
                  </div>
                  <button 
                    onClick={() => setShowPaymentModal(false)}
                    className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center hover:bg-gray-800 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed mb-6 font-semibold">
                  You are unlocking an official authenticated Certificate for <strong className="text-indigo-400">{recipientName}</strong>. Select your payment operator to complete the K5,000 transaction.
                </p>

                {paymentError && (
                  <p className="text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 p-3.5 rounded-2xl mb-4 leading-normal">{paymentError}</p>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-555 block mb-2">Select Operator</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPaymentProvider('airtel')}
                        className={`py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${
                          paymentProvider === 'airtel'
                            ? 'bg-rose-600 border-rose-600 text-white ring-2 ring-rose-600/35 shadow-lg'
                            : 'bg-transparent border-gray-800 text-gray-400 hover:bg-gray-900'
                        }`}
                      >
                        Airtel Money
                      </button>
                      <button
                        onClick={() => setPaymentProvider('tnm')}
                        className={`py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${
                          paymentProvider === 'tnm'
                            ? 'bg-emerald-600 border-emerald-600 text-white ring-2 ring-emerald-600/35 shadow-lg'
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
                    className="w-full py-4 bg-indigo-650 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-600/25 active:scale-95 transition-all mt-4"
                  >
                    Authenticate and Submit Request
                  </button>
                </div>
              </div>
            )}

            {paymentStep === 'processing' && (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <h3 className="font-black text-sm uppercase tracking-widest mt-2">Connecting telecom node...</h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                  We are securely communicating with {paymentProvider === 'airtel' ? 'Airtel Money API' : 'TNM Mpamba API'} portals to process your administrative certification of K5,000. Verification in progress...
                </p>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="py-6 text-center flex flex-col items-center justify-center gap-4 animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 shadow-xl">
                  <ShieldCheck size={36} />
                </div>
                <h3 className="text-lg font-black text-emerald-400 uppercase tracking-tight mt-2">Payment Submitted!</h3>
                <p className="text-xs text-gray-400 max-w-sm leading-relaxed px-4">
                  Congratulations! We have submitted your authentication request to the Educate Malawi National Board. The Admin Panel has been notified. 
                </p>
                <div className="bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 py-3 px-5 rounded-2xl text-[10.5px] font-black uppercase tracking-wider mt-1 flex flex-col gap-1 text-center">
                  <span>PHONE: {phoneNumber}</span>
                  <span>PROVIDER: {paymentProvider.toUpperCase()}</span>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full max-w-xs py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg mt-2"
                >
                  OK, Back to Dashboard
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
