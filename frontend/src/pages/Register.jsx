import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { UserPlus, Settings, CheckCircle2, AlertTriangle, Calendar, Phone, Save, History, ChevronLeft, ChevronRight, LogOut, X, Award, Flame, Droplet, Clock, Download, Printer, ShieldCheck, Check, Eye, EyeOff, Trash2, Heart, Lock } from 'lucide-react';
import { useApp, AREAS, DISTRICT_AREAS, getDistrictBadge, BLOOD_GROUPS, getDonorBadge, getDonorBadgeLabel, normalizeDonor, getDonorDonationCount, getAreaLabel, calculateDaysSince } from '../context/AppContext';
import { dbService } from '../services/db';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { appStorage as localStorage } from '../services/storage';

export default function Register() {
  const { registerDonor, updateDonorProfile, addDonationHistory, deleteDonor, currentDonor, setCurrentDonor, logoutDonor, language, t } = useApp();
  const location = useLocation();
  
  // Tab control: 'register' or 'update'
  const [activeTab, setActiveTab] = useState('register');
  
  // Google OAuth state
  const [googleProfile, setGoogleProfile] = useState(() => location.state?.googleProfile || null);
  
  // Loader and messages
  const [formLoading, setFormLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-dismiss success notification after 5 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Auto-dismiss error notification after 7 seconds
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => {
        setErrorMsg('');
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const [showCertificate, setShowCertificate] = useState(false);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState(null); // 'terms' | 'privacy' | null
  const certificateRef = useRef(null);

  // High-Resolution Image Certificate Generator (Works without third-party dependencies)
  const handleDownloadCertificateImage = async () => {
    if (!foundDonor) return;
    setIsDownloadingPng(true);

    try {
      const width = 1600;
      const height = 1131; // Standard A4 landscape ratio (~1.414)
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // 1. Background Cream/Parchment Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#fffdfa');
      bgGrad.addColorStop(0.5, '#fefefe');
      bgGrad.addColorStop(1, '#fff9f0');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle background watermark circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 380, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.025)';
      ctx.fill();
      ctx.restore();

      // 2. Outer Ornate Border
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 14;
      ctx.strokeRect(36, 36, width - 72, height - 72);

      // Inner Fine Gold Border
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(56, 56, width - 112, height - 112);

      // Corner Accents
      const drawCorner = (x, y, dx, dy) => {
        ctx.save();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, y + dy * 40);
        ctx.lineTo(x, y);
        ctx.lineTo(x + dx * 40, y);
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(x + dx * 16, y + dy * 16, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };
      drawCorner(70, 70, 1, 1);
      drawCorner(width - 70, 70, -1, 1);
      drawCorner(70, height - 70, 1, -1);
      drawCorner(width - 70, height - 70, -1, -1);

      // 3. Organization Header / Brand
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#e11d48';
      ctx.fillText('DARUN DONORS', width / 2, 130);

      ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('OFFICIAL HUMANITARIAN RECOGNITION SYSTEM', width / 2, 160);

      // Divider line with gold diamond
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 200, 185);
      ctx.lineTo(width / 2 + 200, 185);
      ctx.stroke();

      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(width / 2, 185, 4, 0, Math.PI * 2);
      ctx.fill();

      // Certificate Pre-title
      ctx.font = '900 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#b45309';
      ctx.fillText('CERTIFICATE OF APPRECIATION', width / 2, 230);

      // Award Title
      ctx.font = '900 56px Georgia, "Times New Roman", serif';
      const awardGrad = ctx.createLinearGradient(width / 2 - 250, 0, width / 2 + 250, 0);
      awardGrad.addColorStop(0, '#b45309');
      awardGrad.addColorStop(0.5, '#d97706');
      awardGrad.addColorStop(1, '#92400e');
      ctx.fillStyle = awardGrad;
      ctx.fillText('LIFE SAVER AWARD', width / 2, 305);

      // Sub-label
      ctx.font = 'italic 500 20px Georgia, "Times New Roman", serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('This distinguished recognition is proudly presented to', width / 2, 380);

      // Recipient Name
      ctx.font = '900 48px Georgia, "Times New Roman", serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(foundDonor.name || 'Honored Blood Donor', width / 2, 455);

      // Underline under Name
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 260, 490);
      ctx.lineTo(width / 2 + 260, 490);
      ctx.stroke();

      // Commendation Paragraph
      ctx.font = '500 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#334155';
      const line1 = `in profound gratitude for exceptional commitment to saving human lives by donating blood ${foundDonor.total_donations || 1} times.`;
      const line2 = 'Your noble generosity, compassionate service, and selfless dedication directly inspire our entire community.';
      ctx.fillText(line1, width / 2, 545);
      ctx.fillText(line2, width / 2, 578);

      // 4. Gold & Crimson Wax Seal Emblem (Center bottom)
      const sealX = width / 2;
      const sealY = 740;

      // Ribbons
      ctx.save();
      ctx.fillStyle = '#be123c';
      ctx.beginPath();
      ctx.moveTo(sealX - 16, sealY + 20);
      ctx.lineTo(sealX - 34, sealY + 115);
      ctx.lineTo(sealX - 14, sealY + 105);
      ctx.lineTo(sealX + 2, sealY + 115);
      ctx.lineTo(sealX + 2, sealY + 20);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#9f1239';
      ctx.beginPath();
      ctx.moveTo(sealX - 2, sealY + 20);
      ctx.lineTo(sealX - 2, sealY + 115);
      ctx.lineTo(sealX + 14, sealY + 105);
      ctx.lineTo(sealX + 34, sealY + 115);
      ctx.lineTo(sealX + 16, sealY + 20);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Outer gold cog/ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(sealX, sealY, 66, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#d97706';
      ctx.stroke();

      // Crimson inner wax
      ctx.beginPath();
      ctx.arc(sealX, sealY, 56, 0, Math.PI * 2);
      const waxGrad = ctx.createLinearGradient(sealX - 40, sealY - 40, sealX + 40, sealY + 40);
      waxGrad.addColorStop(0, '#e11d48');
      waxGrad.addColorStop(1, '#9f1239');
      ctx.fillStyle = waxGrad;
      ctx.fill();

      // Inner thin gold ring
      ctx.beginPath();
      ctx.arc(sealX, sealY, 46, 0, Math.PI * 2);
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Seal blood group text
      ctx.font = '800 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#fde68a';
      ctx.fillText('BLOOD GROUP', sealX, sealY - 14);

      ctx.font = '900 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(foundDonor.blood_group || 'O+', sealX, sealY + 14);
      ctx.restore();

      // 5. Left Signature / Verification Block
      ctx.textAlign = 'left';
      ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('DATE ISSUED', 160, 720);

      ctx.font = '700 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#1e293b';
      const issueDateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      ctx.fillText(issueDateStr, 160, 750);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(160, 765);
      ctx.lineTo(380, 765);
      ctx.stroke();

      ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Official Issuance Date', 160, 785);

      // 6. Right Authority Signature Block
      ctx.textAlign = 'right';
      ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('VERIFIED AUTHENTICITY', width - 160, 720);

      // Stylish cursive font / simulated executive signature
      ctx.font = 'italic 700 22px Georgia, "Times New Roman", serif';
      ctx.fillStyle = '#e11d48';
      ctx.fillText('Darun Donors Network', width - 160, 748);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(width - 380, 765);
      ctx.lineTo(width - 160, 765);
      ctx.stroke();

      ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Authorized Medical & Donor Registry', width - 160, 785);

      // 7. Footer Certificate ID / Verification Stamp
      ctx.textAlign = 'center';
      const certId = `CERT-BD-${(foundDonor.id || 'DONOR').slice(0, 8).toUpperCase()}-${new Date().getFullYear()}`;
      ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Certificate ID: ${certId}  •  Verify at darun-donors.vercel.app`, width / 2, 920);

      // Download triggered via anchor
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const downloadLink = document.createElement('a');
      const safeName = (foundDonor.name || 'Donor').replace(/[^a-zA-Z0-9]/g, '_');
      downloadLink.download = `Appreciation_Certificate_${safeName}.png`;
      downloadLink.href = dataUrl;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error('Error generating certificate image:', err);
      window.print();
    } finally {
      setIsDownloadingPng(false);
    }
  };

  // Security elements
  const [honeypot, setHoneypot] = useState('');
  const [formLoadTime, setFormLoadTime] = useState(Date.now());

  useEffect(() => {
    setFormLoadTime(Date.now());
  }, [activeTab]);

  // Load session from appStorage on mount & sync with currentDonor
  useEffect(() => {
    try {
      const cached = localStorage.getItem('bb_donor_session');
      let donorData = null;
      let password = '';

      if (cached) {
        const session = JSON.parse(cached);
        if (session && session.donor) {
          donorData = session.donor;
          if (session.password) password = session.password;
        }
      } else if (currentDonor) {
        donorData = currentDonor;
      }

      if (donorData) {
        const donor = normalizeDonor(donorData);
        setFoundDonor(donor);
        if (password) setSearchPassword(password);
        setEditName(donor.name);
        setEditArea(donor.area);
        setEditAvailable(donor.is_available);
        setEditHidePhoto(Boolean(donor.hide_photo));
        setActiveTab('update');
        
        setHistoryLoading(true);
        dbService.getDonationHistory(donor.id).then((historyRes) => {
          if (!historyRes.error) {
            setDonorHistory(historyRes.data || []);
          }
          setHistoryLoading(false);
        }).catch(() => {
          setHistoryLoading(false);
        });
      }
    } catch (e) {
      console.error("Failed to restore donor session:", e);
    }
  }, [currentDonor]);

  // ----------------------------------------
  // REGISTER FORM STATE
  // ----------------------------------------
  const [regName, setRegName] = useState(() => location.state?.googleProfile?.name || '');
  const [regPhone, setRegPhone] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState('O+');
  const [regArea, setRegArea] = useState('Sylhet City Corporation');
  const [regLastDonationDate, setRegLastDonationDate] = useState('');
  const [regTotalDonations, setRegTotalDonations] = useState('');
  const [regAvailable, setRegAvailable] = useState(true);
  const [regDob, setRegDob] = useState('');
  const [regAgreeTerms, setRegAgreeTerms] = useState(false);

  // ----------------------------------------
  // UPDATE FORM STATE
  // ----------------------------------------
  const [searchPassword, setSearchPassword] = useState('');
  const [foundDonor, setFoundDonor] = useState(null);
  const [donorHistory, setDonorHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Pagination for Donation History Log
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when lookup occurs or history list updates
  useEffect(() => {
    setHistoryPage(1);
  }, [donorHistory.length]);

  const totalHistoryPages = Math.max(1, Math.ceil(donorHistory.length / itemsPerPage));
  const paginatedHistory = useMemo(() => {
    const startIndex = (historyPage - 1) * itemsPerPage;
    return donorHistory.slice(startIndex, startIndex + itemsPerPage);
  }, [donorHistory, historyPage]);

  // Profile Edit fields
  const [editName, setEditName] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editAvailable, setEditAvailable] = useState(true);
  const [editHidePhoto, setEditHidePhoto] = useState(false);
  
  // Add new donation event field
  const [newDonationDate, setNewDonationDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDonationConfirmModal, setShowDonationConfirmModal] = useState(false);

  // Account deletion states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePasswordInput, setDeletePasswordInput] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ----------------------------------------
  // ACTIONS: GOOGLE AUTHENTICATION
  // ----------------------------------------
  const handleGoogleSuccess = async (result) => {
    setErrorMsg('');
    const userEmail = String(result?.googleProfile?.email || result?.donor?.email || '').trim().toLowerCase();
    const adminEmails = ['adilh5353@gmail.com', 'daruntech.pvt.ltd@gmail.com'];

    if (userEmail && adminEmails.includes(userEmail)) {
      setErrorMsg("This email belongs to a system administrator and cannot be registered as a public donor account. Please sign in via the Admin Dashboard.");
      setGoogleProfile(null);
      setFoundDonor(null);
      return;
    }

    if (result.isNewUser && result.googleProfile) {
      // New Google User -> populate registration form
      setGoogleProfile(result.googleProfile);
      if (result.googleProfile.name) setRegName(result.googleProfile.name);
      setSuccessMsg(t('googleCompleteProfile'));
    } else if (result.donor) {
      // Existing Google Donor -> log in directly
      const donor = normalizeDonor(result.donor);
      setFoundDonor(donor);
      setEditName(donor.name);
      setEditArea(donor.area);
      setEditAvailable(donor.is_available);
      setEditHidePhoto(Boolean(donor.hide_photo));
      setGoogleProfile(null);
      setSuccessMsg(t('googleAuthSuccess'));

      try {
        localStorage.setItem('bb_donor_session', JSON.stringify({ donor, googleAuth: true }));
        setCurrentDonor(donor);
      } catch (e) {
        console.error("Failed to save donor session:", e);
      }

      setHistoryLoading(true);
      try {
        const historyRes = await dbService.getDonationHistory(donor.id);
        if (!historyRes.error) {
          setDonorHistory(historyRes.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch donation history:", err);
      } finally {
        setHistoryLoading(false);
      }
    }
  };

  // ----------------------------------------
  // ACTIONS: REGISTRATION
  // ----------------------------------------
  const handleRegister = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    // 0. Terms & Conditions and Privacy Policy agreement check
    if (!regAgreeTerms) {
      setErrorMsg(t('mustAgreeTermsError'));
      setFormLoading(false);
      return;
    }

    // 1. Bot check: Honeypot
    if (honeypot.trim() !== '') {
      setErrorMsg("Verification failed. Bot detected.");
      setFormLoading(false);
      return;
    }

    // 2. Bot check: Time elapsed
    const timeElapsed = Date.now() - formLoadTime;
    if (timeElapsed < 1000) {
      setErrorMsg("Submission too fast. Please wait.");
      setFormLoading(false);
      return;
    }

    // 3. Client-side rate limiting: 1 registration in a minute
    const lastRegTime = localStorage.getItem('last_registration_time');
    if (lastRegTime) {
      const timeDiff = Date.now() - Number.parseInt(lastRegTime, 10);
      if (timeDiff < 60000) {
        const secondsLeft = Math.ceil((60000 - timeDiff) / 1000);
        setErrorMsg(`Too many registration attempts. Please wait ${secondsLeft} seconds before trying again.`);
        setFormLoading(false);
        return;
      }
    }

    // Sanitize phone number (strip leading +88 or 88 if entered/pasted)
    let phoneTrimmed = regPhone.trim();
    if (phoneTrimmed.startsWith('+88')) {
      phoneTrimmed = phoneTrimmed.slice(3).trim();
    } else if (phoneTrimmed.startsWith('88')) {
      phoneTrimmed = phoneTrimmed.slice(2).trim();
    }

    // Validate phone number format strictly: 11 digits starting with 013, 014, 015, 016, 017, 018, 019
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(phoneTrimmed)) {
      setErrorMsg(language === 'bn' 
        ? "অবৈধ ফোন নম্বর। +৮৮ এর পর ১১ ডিজিটের সঠিক নম্বর দিন (যেমন: 01711223344) যা 013-019 দিয়ে শুরু।"
        : "Invalid phone number. Must be an 11-digit Bangladeshi mobile number starting with 013-019 (e.g. 01711223344).");
      setFormLoading(false);
      return;
    }

    if (!regDob) {
      setErrorMsg(language === 'bn' ? "জন্ম তারিখ দেওয়া আবশ্যক।" : "Date of birth is required.");
      setFormLoading(false);
      return;
    }

    // Validate minimum age >= 18
    const birthDate = new Date(regDob);
    if (isNaN(birthDate.getTime())) {
      setErrorMsg(language === 'bn' ? "সঠিক জন্ম তারিখ দিন।" : "Please provide a valid date of birth.");
      setFormLoading(false);
      return;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      setErrorMsg(t('age18RequiredError') || "You must be at least 18 years old to register as a blood donor.");
      setFormLoading(false);
      return;
    }

    let totalDonations = null;
    if (regTotalDonations.trim() !== '') {
      const parsedCount = Number.parseInt(regTotalDonations, 10);
      if (Number.isNaN(parsedCount) || parsedCount < 0 || parsedCount > 999) {
        setErrorMsg(t('invalidDonationCountError'));
        setFormLoading(false);
        return;
      }
      totalDonations = parsedCount;
    } else if (regLastDonationDate) {
      totalDonations = 1;
    } else {
      totalDonations = 0;
    }

    const donorData = {
      name: regName.trim(),
      phone: phoneTrimmed,
      blood_group: regBloodGroup,
      area: regArea,
      last_donation_date: regLastDonationDate || null,
      total_donations: totalDonations,
      is_available: regAvailable,
      password: 'GoogleAuth@123',
      dob: regDob,
      google_id: googleProfile?.google_id || null,
      email: googleProfile?.email || null,
      avatar_url: googleProfile?.avatar_url || null,
    };

    try {
      const res = await registerDonor(donorData, honeypot);
      if (res.success) {
        // Save registration time
        localStorage.setItem('last_registration_time', Date.now().toString());

        setSuccessMsg(t('regSuccessMsg', { name: regName }));
        setRegName('');
        setRegPhone('');
        setRegDob('');
        setRegLastDonationDate('');
        setRegTotalDonations('');
        setRegAvailable(true);
        setRegAgreeTerms(false);
        setHoneypot('');

        if (googleProfile) {
          // Auto log-in with Google profile
          const registeredDonor = normalizeDonor(res.data);
          setFoundDonor(registeredDonor);
          setEditName(registeredDonor.name);
          setEditArea(registeredDonor.area);
          setEditAvailable(registeredDonor.is_available);
          setActiveTab('update');
          try {
            localStorage.setItem('bb_donor_session', JSON.stringify({ donor: registeredDonor, googleAuth: true }));
            setCurrentDonor(registeredDonor);
          } catch (e) {}
        }
        setGoogleProfile(null);
      } else {
        setErrorMsg(res.error.message || t('registrationFailed'));
      }
    } catch (err) {
      setErrorMsg(t('unexpectedError'));
    } finally {
      setFormLoading(false);
    }
  };

  // ----------------------------------------
  // ACTIONS: PROFILE UPDATE
  // ----------------------------------------

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!foundDonor) return;

    setFormLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const profileData = {
        name: editName.trim(),
        area: editArea,
        is_available: editAvailable,
        hide_photo: editHidePhoto
      };

      const res = await updateDonorProfile(foundDonor.id, profileData, searchPassword);
      if (res.success) {
        setSuccessMsg(t('profileUpdateSuccess'));
        const updatedDonor = normalizeDonor({
          ...foundDonor,
          ...profileData
        });
        setFoundDonor(updatedDonor);
        try {
          localStorage.setItem('bb_donor_session', JSON.stringify({ donor: updatedDonor, password: searchPassword }));
          setCurrentDonor(updatedDonor);
        } catch (e) {
          console.error("Failed to sync donor session on profile update:", e);
        }
      } else {
        setErrorMsg(res.error.message || t('profileUpdateError'));
      }
    } catch (err) {
      setErrorMsg(t('unexpectedError'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleRequestDonationLog = (e) => {
    e.preventDefault();
    if (!foundDonor || !newDonationDate) return;

    // Check if cooldown is currently active
    const daysSince = calculateDaysSince(foundDonor.last_donation_date);
    if (daysSince < 90) {
      setErrorMsg(t('cooldownActiveDesc', {
        date: foundDonor.last_donation_date
          ? new Date(foundDonor.last_donation_date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : ''
      }));
      return;
    }

    setShowDonationConfirmModal(true);
  };

  const handleConfirmAddDonation = async () => {
    if (!foundDonor || !newDonationDate) return;
    setShowDonationConfirmModal(false);

    setFormLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await addDonationHistory(foundDonor.id, newDonationDate, searchPassword);
      if (res.success) {
        setSuccessMsg(t('donationLoggedSuccess'));
        
        setHistoryLoading(true);
        const historyRes = await dbService.getDonationHistory(foundDonor.id);
        if (!historyRes.error) {
          setDonorHistory(historyRes.data || []);
        }

        const newCount = getDonorDonationCount(foundDonor) + 1;
        const updatedDonor = normalizeDonor({
          ...foundDonor,
          total_donations: newCount,
          lifetime_donation_count: newCount,
          last_donation_date: newDonationDate,
          is_available: false
        });
        setFoundDonor(updatedDonor);
        setEditAvailable(false);
        setNewDonationDate(new Date().toISOString().split('T')[0]);

        try {
          localStorage.setItem('bb_donor_session', JSON.stringify({ donor: updatedDonor, password: searchPassword }));
          setCurrentDonor(updatedDonor);
        } catch (e) {
          console.error("Failed to sync donor session on log donation:", e);
        }
      } else {
        setErrorMsg(res.error.message || t('donationLoggedError'));
      }
    } catch (err) {
      setErrorMsg(t('unexpectedError'));
    } finally {
      setFormLoading(false);
      setHistoryLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!foundDonor) return;

    // If Google user without custom password, require typing DELETE
    const isGoogleDonor = Boolean(foundDonor.google_id);
    if (isGoogleDonor && deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setErrorMsg(language === 'bn' ? 'নিশ্চিত করতে DELETE লিখুন' : 'Please type DELETE to confirm');
      return;
    }

    setDeleteLoading(true);
    setErrorMsg('');
    try {
      const passwordToUse = deletePasswordInput || searchPassword;
      const res = await deleteDonor(foundDonor.id, {
        password: passwordToUse,
        isDonorSelfDelete: true
      });

      if (res.success) {
        setShowDeleteModal(false);
        setFoundDonor(null);
        setDonorHistory([]);
        setSearchPassword('');
        setDeletePasswordInput('');
        setDeleteConfirmText('');
        setActiveTab('register');
        setSuccessMsg(t('accountDeletedSuccess'));
      } else {
        setErrorMsg(res.error?.message || (language === 'bn' ? 'অ্যাকাউন্ট মুছতে ব্যর্থ হয়েছে' : 'Failed to delete account'));
      }
    } catch (err) {
      setErrorMsg(t('unexpectedError'));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {foundDonor
            ? t('managementPortal')
            : googleProfile
            ? t('completeProfileTitle')
            : t('managementPortal')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-lg mx-auto">
          {foundDonor
            ? t('portalDesc')
            : googleProfile
            ? t('completeProfileSubtitle')
            : t('portalDesc')}
        </p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-950/50 text-emerald-800 dark:text-emerald-450 p-4 rounded-2xl text-sm flex items-center justify-between gap-3 animate-fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg('')}
            className="p-1 rounded-lg text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-950/50 text-rose-800 dark:text-rose-450 p-4 rounded-2xl text-sm flex items-center justify-between gap-3 animate-fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="p-1 rounded-lg text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-200 hover:bg-rose-100/50 dark:hover:bg-rose-900/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Forms container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* ============================================================== */}
        {/* SCENARIO 1: NEW GOOGLE USER PROFILE COMPLETION                 */}
        {/* ============================================================== */}
        {googleProfile && !foundDonor && (
          <form 
            onSubmit={handleRegister} 
            className="md:col-span-8 md:col-start-3 glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-200/50 dark:border-zinc-800/50 space-y-5 sm:space-y-6 animate-scale-up"
          >
            {/* High-Visibility Profile Completion Warning Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-red-500/15 border-2 border-amber-500/40 dark:border-amber-500/30 p-4 sm:p-5 shadow-lg shadow-amber-500/5 animate-pulse-glow">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <AlertTriangle className="w-5 h-5 animate-bounce" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-slate-900 dark:text-white text-sm sm:text-base tracking-tight">
                      {t('completeProfileBannerTitle')}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-sm">
                      {t('completeProfileStepNotice')}
                    </span>
                  </div>
                  <p className="text-xs sm:text-xs text-slate-700 dark:text-zinc-300 font-medium leading-relaxed">
                    {t('completeProfileBannerDesc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pb-3 border-b border-slate-200/50 dark:border-zinc-800/50">
              <div className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-md">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight">
                  {t('completeProfileTitle')}
                </h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500">
                  {t('completeProfileSubtitle')}
                </p>
              </div>
            </div>

            {/* Google Verified Account Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 shadow-sm">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {googleProfile.avatar_url ? (
                  <img 
                    src={googleProfile.avatar_url} 
                    alt={googleProfile.name} 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                    className="w-10 h-10 shrink-0 rounded-full border border-blue-300 dark:border-blue-700 shadow-sm object-cover" 
                  />
                ) : null}
                <div 
                  className={`w-10 h-10 shrink-0 rounded-full bg-blue-500 text-white items-center justify-center font-bold text-sm shadow-sm ${googleProfile.avatar_url ? 'hidden' : 'flex'}`}
                >
                  {googleProfile.name?.charAt(0) || 'G'}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-bold text-blue-900 dark:text-blue-100 truncate max-w-full">
                      {googleProfile.name}
                    </span>
                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 whitespace-nowrap">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      {t('googleAccountConnected')}
                    </span>
                  </div>
                  <span className="text-xs text-blue-600 dark:text-blue-300 block truncate">
                    {googleProfile.email}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setGoogleProfile(null); setErrorMsg(''); setSuccessMsg(''); }}
                className="self-end sm:self-center shrink-0 text-xs font-semibold text-slate-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 cursor-pointer px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:border-red-300 transition-colors"
              >
                Disconnect
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Full Name */}
              <div className="space-y-1.5 flex flex-col justify-start">
                <div className="flex items-center justify-between min-h-[22px]">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                    <span>{t('fullName')}</span>
                    <span className="text-red-500 font-black">*</span>
                  </label>
                </div>
                <input
                  type="text"
                  required
                  placeholder={t('donorNamePlaceholder')}
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/80 focus:border-red-500 dark:text-white transition-all shadow-xs"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5 flex flex-col justify-start">
                <div className="flex items-center justify-between min-h-[22px]">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1">
                    <span>{t('phoneUnique')}</span>
                    <span className="text-red-500 font-black">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md border border-red-200/50 dark:border-red-900/50">
                    {language === 'bn' ? 'ইউনিক নম্বর আবশ্যক' : 'Unique phone required'}
                  </span>
                </div>
                <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/40 focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500 transition-all shadow-xs">
                  <div className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100/80 dark:bg-zinc-800/80 border-r border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 font-bold text-sm select-none">
                    <span className="text-base leading-none">🇧🇩</span>
                    <span>+88</span>
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      required
                      maxLength={11}
                      placeholder="01711223344"
                      value={regPhone}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^0-9]/g, '');
                        if (val.startsWith('880')) {
                          val = val.slice(2);
                        }
                        setRegPhone(val.slice(0, 11));
                      }}
                      className="w-full pl-9 pr-3 py-2.5 bg-transparent text-sm focus:outline-none dark:text-white font-medium placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                    />
                    <Phone className="w-3.5 h-3.5 text-red-500 absolute left-3 top-3.5 pointer-events-none" />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-normal">
                  {language === 'bn' 
                    ? '১১ ডিজিটের নম্বর (013, 014, 015, 016, 017, 018, 019)' 
                    : '11 digits starting with 013-019 (e.g. 01711223344)'}
                </span>
              </div>

              {/* Blood Group */}
              <div className="space-y-1.5 flex flex-col justify-start">
                <div className="flex items-center justify-between min-h-[22px]">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1">
                    <span>{t('bloodGroup')}</span>
                    <span className="text-red-500 font-black">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md border border-red-200/50 dark:border-red-900/50">
                    {language === 'bn' ? 'সঠিক গ্রুপ' : 'Accurate Match'}
                  </span>
                </div>
                <select
                  value={regBloodGroup}
                  onChange={(e) => setRegBloodGroup(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white cursor-pointer font-bold shadow-xs transition-all"
                >
                  {BLOOD_GROUPS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Area */}
              <div className="space-y-1.5 flex flex-col justify-start">
                <div className="flex items-center justify-between min-h-[22px]">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1">
                    <span>{t('selectArea')}</span>
                    <span className="text-red-500 font-black">*</span>
                  </label>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-zinc-700/50">
                    {language === 'bn' ? 'সিলেট বিভাগ' : 'Sylhet Division'}
                  </span>
                </div>
                <select
                  value={regArea}
                  onChange={(e) => setRegArea(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white cursor-pointer font-medium shadow-xs transition-all"
                >
                  {DISTRICT_AREAS.map((district) => (
                    <optgroup
                      key={district.id}
                      label={`📍 ${language === 'bn' ? district.nameBn : district.name}`}
                      className={district.color.optGroupClass}
                    >
                      {district.upazilas.map((a) => (
                        <option key={a} value={a} className="text-slate-800 dark:text-zinc-200 font-normal">
                          {getAreaLabel(a, t)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Last Donation Date */}
              <div className="space-y-1.5 flex flex-col justify-start">
                <div className="flex items-center justify-between min-h-[22px]">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                    {t('lastDonationOptional')}
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="date"
                    value={regLastDonationDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setRegLastDonationDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white cursor-pointer shadow-xs transition-all"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Date of Birth (Age must be 18+) */}
              <div className="space-y-1.5 flex flex-col justify-start">
                <div className="flex items-center justify-between min-h-[22px]">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1">
                    <span>{t('dobLabel')}</span>
                    <span className="text-red-500 font-black">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-900/50">
                    {language === 'bn' ? 'বয়স ১৮+ বছর' : 'Must be 18+ years'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="date"
                    required
                    max={(() => {
                      const d = new Date();
                      d.setFullYear(d.getFullYear() - 18);
                      return d.toISOString().split('T')[0];
                    })()}
                    value={regDob}
                    onChange={(e) => setRegDob(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white cursor-pointer shadow-xs transition-all"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-normal">
                  {language === 'bn' ? 'রক্তদানের জন্য আপনার বয়স ১৮ বছর বা তদূর্ধ্ব হতে হবে' : 'Donors must be at least 18 years old'}
                </span>
              </div>

              {/* Total Times Donated */}
              <div className="space-y-1.5 flex flex-col justify-start">
                <div className="flex items-center justify-between min-h-[22px]">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                    {t('timesDonatedOptional')}
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="999"
                    step="1"
                    inputMode="numeric"
                    placeholder={t('timesDonatedPlaceholder')}
                    value={regTotalDonations}
                    onChange={(e) => setRegTotalDonations(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white shadow-xs transition-all"
                  />
                  <History className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block leading-tight font-normal">
                  {t('timesDonatedHelper')}
                </span>
              </div>

              {/* Availability Toggle Card */}
              <div className="space-y-1.5 flex flex-col justify-start">
                <div className="min-h-[22px]" />
                <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none shadow-xs ${
                  regAvailable
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500/30'
                    : 'bg-white/60 dark:bg-zinc-950/40 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                }`}>
                  <input
                    type="checkbox"
                    checked={regAvailable}
                    onChange={(e) => setRegAvailable(e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded-md border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 block">
                      {t('setAvailable')}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500 block leading-tight mt-0.5">
                      {t('availableDesc')}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Honeypot Field */}
            <div className="absolute opacity-0 w-0 h-0 pointer-events-none" aria-hidden="true">
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* Terms & Conditions and Privacy Policy Interactive Toggle */}
            <div className={`p-4 rounded-2xl border transition-all duration-200 mt-2 ${
              regAgreeTerms
                ? 'bg-red-50/50 dark:bg-red-950/20 border-red-500/40 shadow-xs'
                : 'bg-slate-50/80 dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
            }`}>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="reg_agree_terms_cb"
                  required
                  checked={regAgreeTerms}
                  onChange={(e) => setRegAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded-md border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer shrink-0"
                />
                <div className="text-xs leading-relaxed text-slate-700 dark:text-zinc-300 select-none">
                  <label htmlFor="reg_agree_terms_cb" className="font-semibold cursor-pointer">
                    {t('agreeToTermsPrefix')}{' '}
                  </label>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLegalModalTab('terms');
                    }}
                    className="font-extrabold text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer underline-offset-2"
                  >
                    {t('termsAndConditionsText')}
                  </button>{' '}
                  <span className="font-semibold">{t('andText')} </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLegalModalTab('privacy');
                    }}
                    className="font-extrabold text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-0.5 cursor-pointer underline-offset-2"
                  >
                    {t('privacyPolicyText')}
                  </button>
                  <span className="text-red-500 font-bold ml-1">*</span>
                  <label htmlFor="reg_agree_terms_cb" className="block text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5 font-normal cursor-pointer">
                    {language === 'bn'
                      ? 'নিবন্ধন সম্পন্ন ও রক্তদাতা প্রোফাইল চালু করতে এই বক্সে টিক দিয়ে সম্মতি জানান।'
                      : 'Toggle this checkbox to confirm your agreement before creating your donor profile.'}
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black py-3.5 px-6 rounded-2xl shadow-xl shadow-red-500/25 active:scale-[0.99] disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2.5 mt-6 text-sm sm:text-base cursor-pointer tracking-wide"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{formLoading ? t('registeringButton') : t('saveAndEnterDashboard')}</span>
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* SCENARIO 2: UNAUTHENTICATED PORTAL GATEWAY (GOOGLE AUTH FIRST) */}
        {/* ============================================================== */}
        {!googleProfile && !foundDonor && (
          <div className="md:col-span-8 md:col-start-3 space-y-6">
            {/* Exclusive Google Authentication Card */}
            <div className="glass-panel rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200/50 dark:border-zinc-800/50 text-center space-y-6 shadow-xl animate-scale-up">
                
                {/* Official Brand Logo Visual Badge */}
                <div className="w-20 h-20 mx-auto rounded-3xl bg-white/95 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-2.5 shadow-xl shadow-red-500/10 flex items-center justify-center">
                  <img
                    src="/logo.png"
                    alt="Darun Donors Logo"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {language === 'bn' ? 'গুগল দিয়ে প্রবেশ অথবা নতুন নিবন্ধন' : 'Sign In or Join as a Blood Donor'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                    {language === 'bn'
                      ? 'এক ক্লিকেই আপনার গুগল অ্যাকাউন্ট দিয়ে নিরাপদ ও সরাসরি প্রবেশ করুন। নতুন রক্তদাতা হলে প্রবেশের পরই দ্রুত প্রোফাইল সম্পন্ন করা যাবে।'
                      : 'Instant, secure access with your Google account. First-time donors will complete their profile after signing in.'}
                  </p>
                </div>

                {/* Google Auth Button Container */}
                <div className="max-w-sm mx-auto pt-2">
                  <GoogleAuthButton
                    mode="login"
                    onSuccess={handleGoogleSuccess}
                    onError={setErrorMsg}
                    disabled={formLoading}
                  />
                </div>

                {/* Feature Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-200/60 dark:border-zinc-800/60 text-left">
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800">
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block mb-1">
                      ⚡ {language === 'bn' ? '১-ক্লিকে প্রবেশ' : 'Instant 1-Click Access'}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500 block leading-tight">
                      {language === 'bn' ? 'কোনো পাসওয়ার্ড মনে রাখার ঝামেলা নেই।' : 'Zero passwords to remember or reset.'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800">
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block mb-1">
                      🛡️ {language === 'bn' ? 'যাচাইকৃত রক্তদাতা' : 'Verified Identity'}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500 block leading-tight">
                      {language === 'bn' ? 'জরুরি রোগীর আস্থা ও নিরাপদ নেটওয়ার্ক।' : 'Trusted community for emergency patients.'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800">
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block mb-1">
                      🩸 {language === 'bn' ? 'রক্তদানের ইতিহাস' : 'Donation Tracker'}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500 block leading-tight">
                      {language === 'bn' ? 'মোট রক্তদান ও প্রশংসাপত্র ডাউনলোড।' : 'Track cooldowns & get certificates.'}
                    </span>
                  </div>
                </div>

            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SCENARIO 3: LOGGED-IN DONOR DASHBOARD                          */}
        {/* ============================================================== */}
        {foundDonor && (
          <>
            <div className="md:col-span-5 space-y-6">
              {/* Profile summary card when found */}
              <div className="glass-panel border-red-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border relative overflow-hidden space-y-3 sm:space-y-4 animate-slide-up">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl -mr-6 -mt-6" />
                  
                  <div className="flex items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        {foundDonor.avatar_url && !foundDonor.hide_photo ? (
                          <div className="relative">
                            <img 
                              src={foundDonor.avatar_url} 
                              alt={foundDonor.name} 
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                              className="w-12 h-12 rounded-2xl object-cover border-2 border-red-500/30 shadow-md"
                            />
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white font-black text-xl items-center justify-center shadow-md hidden">
                              {foundDonor.blood_group}
                            </div>
                            <span className="absolute -bottom-1 -right-1 bg-gradient-to-br from-red-600 to-rose-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-md shadow-sm border border-white dark:border-zinc-900 leading-tight">
                              {foundDonor.blood_group}
                            </span>
                          </div>
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500 text-white font-black text-lg sm:text-xl flex items-center justify-center shadow-md">
                            {foundDonor.blood_group}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                          {foundDonor.name}
                        </h4>
                        <span className="text-xs text-slate-400 dark:text-zinc-500 font-semibold">
                          {getAreaLabel(foundDonor.area, t)} • {foundDonor.phone}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem('bb_donor_session');
                        setCurrentDonor(null);
                        setFoundDonor(null);
                        setSearchPassword('');
                        setDonorHistory([]);
                        setSuccessMsg('');
                        setErrorMsg('');
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-zinc-900 dark:hover:bg-rose-950/30 text-slate-500 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 transition-all duration-200 cursor-pointer flex items-center gap-1 text-[10px] font-bold shrink-0"
                      title={t('signOutLabel')}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t('signOutLabel')}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {(() => {
                      const badge = getDonorBadge(foundDonor.total_donations);
                      return (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide ${badge.color}`}>
                          {getDonorBadgeLabel(badge.label, t)}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-zinc-950/50 p-3 rounded-xl border border-slate-100 dark:border-zinc-900">
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block mb-0.5">{t('timesDonatedHeader')}</span>
                      <strong className="text-slate-800 dark:text-zinc-200 font-bold text-base">{t('timesUnit', { count: foundDonor.total_donations })}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block mb-0.5">{t('lastDonation')}</span>
                      <strong className="text-slate-800 dark:text-zinc-200 font-bold text-sm">
                        {foundDonor.last_donation_date 
                          ? new Date(foundDonor.last_donation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : t('never')
                        }
                      </strong>
                    </div>
                  </div>
                  {foundDonor.total_donations > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowCertificate(true)}
                      className="w-full mt-2 py-2 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/35 border border-red-200/50 dark:border-red-900/30 text-red-650 dark:text-red-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Award className="w-4 h-4 text-amber-500 shrink-0" />
                      {language === 'bn' ? 'প্রশংসাপত্র ডাউনলোড করুন' : 'Download Appreciation Certificate'}
                    </button>
                  )}

                  {/* Delete Account Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setDeletePasswordInput(searchPassword || '');
                      setDeleteConfirmText('');
                      setShowDeleteModal(true);
                    }}
                    className="w-full mt-2 py-2 px-3 bg-rose-50/60 hover:bg-rose-100/80 dark:bg-rose-950/15 dark:hover:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('deleteAccountBtn')}</span>
                  </button>
                </div>
            </div>

            {/* Profile Update Controls & Log Donation forms */}
            <div className="md:col-span-7 space-y-6 animate-fade-in">
                
                {/* 1. Log Donation Event Form with Cooldown Guard */}
                {(() => {
                  const daysSince = calculateDaysSince(foundDonor.last_donation_date);
                  const isCooldown = daysSince < 90;
                  const daysRemaining = 90 - daysSince;
                  const cooldownEndDate = foundDonor.last_donation_date
                    ? new Date(new Date(foundDonor.last_donation_date).getTime() + 90 * 24 * 60 * 60 * 1000)
                    : null;

                  return (
                    <form 
                      onSubmit={handleRequestDonationLog}
                      className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/50 dark:border-zinc-800/50 space-y-4 font-semibold text-xs relative overflow-hidden"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200/50 dark:border-zinc-800/50">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 ${isCooldown ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                            {isCooldown ? <Clock className="w-4 h-4 animate-spin-slow" /> : <History className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
                              {t('logDonationTitle')}
                            </h3>
                            <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium leading-normal mt-0.5">
                              {language === 'bn' ? 'চিকিৎসা সুরক্ষার জন্য ৯০ দিনের কুলডাউন প্রযোজ্য' : 'Medical safety standard: 90 days cooldown'}
                            </p>
                          </div>
                        </div>

                        {isCooldown && (
                          <div className="self-start sm:self-auto">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1.5 shrink-0">
                              <Clock className="w-3 h-3 animate-pulse" />
                              {t('daysRemainingCooldown', { days: daysRemaining })}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Cooldown Active Warning Box */}
                      {isCooldown ? (
                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 space-y-2 text-xs">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">{t('cooldownActiveTitle')}</p>
                              <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90 leading-relaxed mt-0.5">
                                {t('cooldownActiveDesc', {
                                  date: foundDonor.last_donation_date
                                    ? new Date(foundDonor.last_donation_date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                    : ''
                                })}
                              </p>
                            </div>
                          </div>
                          {cooldownEndDate && (
                            <div className="text-[10px] font-extrabold text-amber-900 dark:text-amber-200 bg-amber-500/15 px-2.5 py-1 rounded-lg inline-block">
                              {t('cooldownEndsOn', {
                                date: cooldownEndDate.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                              })}
                            </div>
                          )}
                        </div>
                      ) : null}

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                          {t('donationDate')}
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            required
                            disabled={isCooldown || formLoading}
                            max={new Date().toISOString().split('T')[0]}
                            value={newDonationDate}
                            onChange={(e) => setNewDonationDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                          <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isCooldown || formLoading}
                        className={`w-full font-extrabold py-2.5 px-4 rounded-xl shadow-md active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 text-xs ${
                          isCooldown
                            ? 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed border border-slate-300/40 dark:border-zinc-700/40 shadow-none'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/10 hover:shadow-emerald-500/20 cursor-pointer disabled:opacity-50'
                        }`}
                      >
                        {isCooldown ? (
                          <>
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span>{t('cooldownRestrictedNotice')}</span>
                          </>
                        ) : formLoading ? (
                          t('loggingButton')
                        ) : (
                          t('logDonationButton')
                        )}
                      </button>
                    </form>
                  );
                })()}

                {/* 2. Edit Profile Form */}
                <form 
                  onSubmit={handleUpdateProfile}
                  className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/50 dark:border-zinc-800/50 space-y-4"
                >
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-200/50 dark:border-zinc-800/50">
                    <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                      <Settings className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      {t('updateDetailsTitle')}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                        {t('fullName')}
                      </label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                        {t('areaLabel')}
                      </label>
                      <select
                        value={editArea}
                        onChange={(e) => setEditArea(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white cursor-pointer"
                      >
                        {DISTRICT_AREAS.map((district) => (
                          <optgroup
                            key={district.id}
                            label={`📍 ${language === 'bn' ? district.nameBn : district.name}`}
                            className={district.color.optGroupClass}
                          >
                            {district.upazilas.map((a) => (
                              <option key={a} value={a} className="text-slate-800 dark:text-zinc-200 font-normal">
                                {getAreaLabel(a, t)}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2 flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="editAvailable"
                        checked={editAvailable}
                        onChange={(e) => setEditAvailable(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="editAvailable" className="cursor-pointer select-none">
                        <span className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                          {t('setAvailable')}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">
                          {t('toggleManualPresence')}
                        </span>
                      </label>
                    </div>

                    {/* Google Profile Photo Visibility Toggle */}
                    {Boolean(foundDonor.avatar_url || foundDonor.google_id) && (
                      <div className="space-y-1.5 sm:col-span-2 flex items-start gap-2.5 pt-2 border-t border-slate-200/50 dark:border-zinc-800/50">
                        <input
                          type="checkbox"
                          id="editHidePhoto"
                          checked={editHidePhoto}
                          onChange={(e) => setEditHidePhoto(e.target.checked)}
                          className="w-5 h-5 mt-0.5 rounded border-slate-300 text-red-500 focus:ring-red-500 cursor-pointer"
                        />
                        <label htmlFor="editHidePhoto" className="cursor-pointer select-none flex-1">
                          <span className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                            {editHidePhoto ? (
                              <EyeOff className="w-4 h-4 text-amber-500 shrink-0" />
                            ) : (
                              <Eye className="w-4 h-4 text-emerald-500 shrink-0" />
                            )}
                            <span>{t('hideGooglePhoto')}</span>
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-zinc-400 block mt-0.5 leading-relaxed">
                            {t('hideGooglePhotoDesc')}
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 text-xs cursor-pointer font-bold"
                  >
                    <Save className="w-4 h-4" />
                    {t('saveChanges')}
                  </button>
                </form>

                {/* 3. Donation History Log Table */}
                <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/50 dark:border-zinc-800/50 space-y-3">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-400" /> {t('donationHistoryTitle')}
                  </h4>
                  {historyLoading ? (
                    <div className="py-4 text-center text-xs text-slate-400 dark:text-zinc-500 animate-pulse font-semibold">
                      {t('loadingDonationHistory')}
                    </div>
                  ) : donorHistory.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-zinc-500 py-2 font-semibold">
                      {t('noDonationEvents')}
                    </p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200/50 dark:border-zinc-800/50 text-slate-400 dark:text-zinc-500">
                            <th className="py-2 font-bold">{t('eventDateLabel')}</th>
                            <th className="py-2 font-bold">{t('statusLabel')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                          {paginatedHistory.map((item, idx) => (
                            <tr key={item.id || idx}>
                              <td className="py-2.5 font-semibold text-slate-700 dark:text-zinc-300">
                                {new Date(item.donation_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </td>
                              <td className="py-2.5">
                                <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-2 py-0.5 rounded-full font-medium">
                                  {t('loggedStatus')}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Pagination Controls */}
                    {totalHistoryPages > 1 && (
                      <div className="flex justify-between items-center pt-4 border-t border-slate-200/50 dark:border-zinc-800/50 animate-fade-in">
                        <button
                          type="button"
                          onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                          disabled={historyPage === 1}
                          className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg text-[10px] font-bold py-1 px-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <ChevronLeft className="w-3 h-3" />
                          {t('previousPage')}
                        </button>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold">
                          {t('pageIndicator', { current: historyPage, total: totalHistoryPages })}
                        </span>
                        <button
                          type="button"
                          onClick={() => setHistoryPage(prev => Math.min(totalHistoryPages, prev + 1))}
                          disabled={historyPage === totalHistoryPages}
                          className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg text-[10px] font-bold py-1 px-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {t('nextPage')}
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </>
                  )}
                </div>
              </div>
          </>
        )}
      </div>

      {/* Certificate Modal Overlay */}
      {showCertificate && foundDonor && (
        <div id="certificate-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/80 dark:bg-black/90 backdrop-blur-md animate-fade-in overflow-y-auto print:bg-white print:p-0">
          <style>{`
            @media print {
              header, footer, nav, aside, .sticky, [role="banner"], button, .print\\:hidden {
                display: none !important;
              }
              @page {
                size: A4 landscape;
                margin: 0 !important;
              }
              body, html, #root {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                overflow: hidden !important;
              }
              main {
                padding: 0 !important;
                margin: 0 !important;
                max-width: 100% !important;
                width: 100% !important;
                height: 100% !important;
              }
              #certificate-modal-overlay {
                position: absolute !important;
                inset: 0 !important;
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                z-index: 9999 !important;
              }
              #certificate-print-area {
                width: 297mm !important;
                height: 210mm !important;
                min-width: 297mm !important;
                min-height: 210mm !important;
                max-width: 297mm !important;
                max-height: 210mm !important;
                padding: 8mm !important;
                margin: 0 !important;
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                background: white !important;
                box-sizing: border-box !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              #certificate-border-container {
                height: 100% !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                padding: 8mm 10mm !important;
                box-sizing: border-box !important;
                border-color: #d97706 !important;
              }
            }
          `}</style>

          <div className="relative max-w-3xl w-full my-auto animate-scale-up">
            {/* Close Button */}
            <button
              onClick={() => setShowCertificate(false)}
              className="absolute -top-3.5 -right-3.5 sm:-top-4 sm:-right-4 w-9 h-9 sm:w-10 sm:h-10 bg-white dark:bg-zinc-900 text-slate-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 rounded-full border border-slate-200 dark:border-zinc-800 flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95 z-20 print:hidden cursor-pointer"
              title="Close Certificate"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div id="certificate-print-area" className="bg-[#fffdf9] text-slate-900 rounded-3xl p-4 sm:p-7 shadow-2xl relative border-2 border-amber-300/60 print:border-0 print:shadow-none print:p-0">
              
              {/* Outer Guilloche / Double Gold Border Container */}
              <div 
                id="certificate-border-container" 
                className="border-[5px] border-double border-amber-600/70 p-5 sm:p-8 rounded-2xl relative bg-white/90 shadow-inner flex flex-col justify-between print:border-amber-600"
              >
                {/* 4 Corner Ornaments */}
                <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-700 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                </div>
                <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-700 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                </div>
                <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-700 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                </div>
                <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-700 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                </div>

                {/* Certificate Header */}
                <div className="text-center space-y-1.5 pt-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center shadow-sm">
                      <Flame className="w-4 h-4 fill-current animate-pulse" />
                    </div>
                    <span className="text-sm font-black tracking-[0.25em] text-slate-900 uppercase">
                      Darun Donors
                    </span>
                  </div>
                  <span className="text-[9px] uppercase tracking-[0.25em] text-slate-400 font-bold block">
                    Official Humanitarian Recognition System
                  </span>

                  <div className="pt-2">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-amber-700 block">
                      Certificate of Appreciation
                    </span>
                    <h2 className="font-serif font-black text-2xl sm:text-4xl text-amber-900 tracking-wide mt-0.5">
                      LIFE SAVER AWARD
                    </h2>
                  </div>

                  {/* Ornate Divider with Award Icon */}
                  <div className="flex items-center justify-center gap-3 my-2">
                    <div className="w-16 sm:w-24 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400 to-amber-600" />
                    <Award className="w-5 h-5 text-amber-600 shrink-0" />
                    <div className="w-16 sm:w-24 h-[1.5px] bg-gradient-to-l from-transparent via-amber-400 to-amber-600" />
                  </div>
                </div>

                {/* Recipient Commendation */}
                <div className="text-center my-3 sm:my-4 space-y-2">
                  <p className="text-xs sm:text-sm text-slate-500 font-serif italic">
                    This distinguished recognition is proudly presented to
                  </p>

                  <h3 className="text-2xl sm:text-4xl font-black text-slate-950 font-serif tracking-tight border-b-2 border-amber-400/80 inline-block px-4 pb-1">
                    {foundDonor.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-700 max-w-lg mx-auto leading-relaxed pt-1.5 font-normal">
                    {language === 'bn' 
                      ? `স্বেচ্ছায় রক্তদান করে মানবতার সেবায় অনন্য ভূমিকা পালনের জন্য এবং সফলভাবে ${foundDonor.total_donations} বার রক্তদান সম্পন্ন করায় আপনাকে এই সম্মাননা স্মারক প্রদান করা হলো। আপনার নিঃস্বার্থ অবদান আমাদের সমাজের জন্য এক অবিস্মরণীয় প্রেরণা।` 
                      : `for outstanding humanitarian dedication and saving precious lives by donating blood ${foundDonor.total_donations} times. Your noble sacrifice and selfless service serve as an enduring inspiration to our entire community.`
                    }
                  </p>
                </div>

                {/* Bottom Details Grid with Wax Seal */}
                <div className="grid grid-cols-3 items-center gap-2 sm:gap-4 pt-4 border-t border-slate-200/90 print:border-slate-300">
                  {/* Left Column: Date Issued */}
                  <div className="text-left space-y-0.5 pl-1">
                    <span className="text-[8px] sm:text-[9px] text-slate-400 block uppercase font-bold tracking-wider">Date Issued</span>
                    <strong className="text-[11px] sm:text-xs font-bold text-slate-800 block border-b border-slate-200 pb-0.5">
                      {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </strong>
                    <span className="text-[7px] sm:text-[8px] text-slate-400 block tracking-tight">Verified Issuance Date</span>
                  </div>

                  {/* Center Column: Red & Gold Wax Seal */}
                  <div className="relative flex justify-center">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-rose-600 via-red-650 to-red-800 flex items-center justify-center border-2 border-amber-300 shadow-xl z-10 print:border-red-600">
                      <div className="border border-amber-200/60 rounded-full w-[calc(100%-8px)] h-[calc(100%-8px)] flex flex-col items-center justify-center bg-gradient-to-br from-rose-700 to-red-900 shadow-inner">
                        <span className="text-[7px] sm:text-[8px] font-bold text-amber-200/90 uppercase tracking-widest leading-none">Group</span>
                        <span className="text-base sm:text-2xl font-black text-white leading-none mt-0.5 drop-shadow-md">
                          {foundDonor.blood_group || 'O+'}
                        </span>
                      </div>
                    </div>
                    {/* Seal Ribbons */}
                    <div className="absolute top-12 sm:top-14 flex justify-center gap-1.5 pointer-events-none">
                      <div className="w-3 sm:w-3.5 h-7 sm:h-9 bg-rose-700 rotate-12 transform origin-top shadow-md rounded-b-sm" />
                      <div className="w-3 sm:w-3.5 h-7 sm:h-9 bg-red-800 -rotate-12 transform origin-top shadow-md rounded-b-sm" />
                    </div>
                  </div>

                  {/* Right Column: Registry Verification */}
                  <div className="text-right space-y-0.5 pr-1">
                    <span className="text-[8px] sm:text-[9px] text-slate-400 block uppercase font-bold tracking-wider">Verification</span>
                    <strong className="text-[11px] sm:text-xs font-bold text-slate-800 block border-b border-slate-200 pb-0.5 font-serif italic text-red-600">
                      Darun Donors Network
                    </strong>
                    <span className="text-[7px] sm:text-[8px] text-slate-400 block tracking-tight">Medical & Donor Registry</span>
                  </div>
                </div>

                {/* Certificate ID Watermark */}
                <div className="text-center pt-3 pb-1">
                  <span className="text-[8px] sm:text-[9px] text-slate-400 font-mono">
                    ID: CERT-BD-{(foundDonor.id || 'DONOR').slice(0, 8).toUpperCase()}-{new Date().getFullYear()} • Official Authenticated Document
                  </span>
                </div>
              </div>
            </div>

            {/* Premium Action Toolbar (Download Image & PDF) */}
            <div className="flex flex-wrap gap-2.5 sm:gap-3 justify-center items-center mt-4 print:hidden">
              <button
                type="button"
                onClick={handleDownloadCertificateImage}
                disabled={isDownloadingPng}
                className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isDownloadingPng ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Generating Image...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Certificate (PNG)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 sm:px-6 py-2.5 sm:py-3 bg-white hover:bg-slate-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 font-extrabold rounded-2xl text-xs sm:text-sm shadow-md border border-slate-200 dark:border-zinc-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-amber-500" />
                <span>Print / Save as PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal Before Logging New Donation */}
      {showDonationConfirmModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/75 dark:bg-black/85 backdrop-blur-md animate-fade-in">
          <div 
            className="w-full max-w-md rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200 dark:border-zinc-800 shadow-2xl animate-scale-up relative bg-white dark:bg-zinc-900"
            style={{ backgroundColor: 'var(--modal-bg, #ffffff)' }}
          >
            {/* Header Icon */}
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
              <History className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {t('confirmDonationModalTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-medium">
                {t('confirmDonationModalDesc', {
                  date: newDonationDate
                    ? new Date(newDonationDate).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : ''
                })}
              </p>
            </div>

            {/* Warning Callout Box */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{language === 'bn' ? '৯০ দিনের কুলডাউন প্রযোজ্য হবে' : 'Mandatory 90-Day Cooldown'}</span>
              </div>
              <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 font-medium">
                {t('confirmDonationCooldownWarning')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDonationConfirmModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
              >
                {t('confirmDonationCancelButton')}
              </button>
              <button
                type="button"
                disabled={formLoading}
                onClick={handleConfirmAddDonation}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {formLoading ? t('loggingButton') : t('confirmDonationProceedButton')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && foundDonor && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-rose-200/50 dark:border-rose-900/30 space-y-5 animate-scale-up"
            style={{ backgroundColor: 'var(--modal-bg, #ffffff)' }}
          >
            {/* Header Icon */}
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {t('deleteAccountConfirmTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 font-medium">
                {t('deleteAccountConfirmDesc')}
              </p>
            </div>

            {/* Warning Callout Box */}
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs space-y-1 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{language === 'bn' ? 'স্থায়ী পরিবর্তন' : 'Permanent Action'}</span>
              </div>
              <p className="text-[11px] text-rose-900/80 dark:text-rose-300/80 font-medium">
                {t('deleteAccountWarning')}
              </p>
            </div>

            {/* Verification Input (Password or Google confirmation text) */}
            <div className="space-y-2">
              {foundDonor.google_id ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    {t('deleteAccountGooglePrompt')}
                  </label>
                  <input
                    type="text"
                    placeholder="DELETE"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white text-xs font-mono tracking-widest focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                    {t('deleteAccountPasswordPrompt')}
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={deletePasswordInput}
                    onChange={(e) => setDeletePasswordInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-white text-xs tracking-wider focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePasswordInput('');
                  setDeleteConfirmText('');
                }}
                disabled={deleteLoading}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
              >
                {t('cancelDeleteBtn')}
              </button>
              <button
                type="button"
                disabled={deleteLoading || (Boolean(foundDonor.google_id) && deleteConfirmText.trim().toUpperCase() !== 'DELETE')}
                onClick={handleDeleteAccount}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-extrabold text-xs shadow-lg shadow-rose-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleteLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{language === 'bn' ? 'মুছে ফেলা হচ্ছে...' : 'Deleting...'}</span>
                  </span>
                ) : (
                  <span>{t('confirmDeleteAccountBtn')}</span>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* In-Place Terms & Privacy Policy Interactive Modal */}
      {legalModalTab && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 dark:bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setLegalModalTab(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[88vh] rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col animate-scale-up z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                    {legalModalTab === 'terms'
                      ? (language === 'bn' ? 'ব্যবহারের শর্তাবলী' : 'Terms and Conditions')
                      : (language === 'bn' ? 'গোপনীয়তা ও তথ্য সুরক্ষা নীতি' : 'Privacy & Data Protection Policy')}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                    {language === 'bn' ? 'দারুণ ডোনার্স প্ল্যাটফর্ম' : 'Darun Donors Official Platform'}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setLegalModalTab(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-Tabs Switcher */}
            <div className="flex p-1 bg-slate-100 dark:bg-zinc-900/60 rounded-xl border border-slate-200/50 dark:border-zinc-800/40 my-3 shrink-0">
              <button
                type="button"
                onClick={() => setLegalModalTab('terms')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  legalModalTab === 'terms'
                    ? 'bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                {language === 'bn' ? 'শর্তাবলী (Terms)' : 'Terms of Service'}
              </button>
              <button
                type="button"
                onClick={() => setLegalModalTab('privacy')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  legalModalTab === 'privacy'
                    ? 'bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                {language === 'bn' ? 'গোপনীয়তা নীতি (Privacy)' : 'Privacy Policy'}
              </button>
            </div>

            {/* Scrollable Document Content */}
            <div className="overflow-y-auto pr-1 space-y-4 text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed max-h-[50vh]">
              {legalModalTab === 'terms' ? (
                <>
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/50">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-red-500" />
                      {language === 'bn' ? '১. অলাভজনক ও মানবিক সেবা' : '1. Non-Profit & Humanitarian Purpose'}
                    </h4>
                    <p className="text-[12px] text-slate-600 dark:text-zinc-400">
                      {language === 'bn'
                        ? 'দারুণ ডোনার্স একটি স্বেচ্ছাসেবী, সম্পূর্ণ অলাভজনক ও মানবিক প্ল্যাটফর্ম। রক্ত কেনাবেচা বা কোনো প্রকার আর্থিক লেনদেন কঠোরভাবে নিষিদ্ধ ও বেআইনি।'
                        : 'Darun Donors operates strictly as a non-profit humanitarian matching portal connecting patients with voluntary donors. The sale or commercial trade of blood is illegal and prohibited.'}
                    </p>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/50">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      {language === 'bn' ? '২. রক্তদাতার যোগ্যতা ও সঠিক তথ্য' : '2. Donor Eligibility & Truthfulness'}
                    </h4>
                    <p className="text-[12px] text-slate-600 dark:text-zinc-400">
                      {language === 'bn'
                        ? 'রক্তদাতা হিসেবে নিবন্ধিত হতে হলে বয়স ন্যূনতম ১৮ বছর হতে হবে। নাম, ফোন নম্বর, রক্তের গ্রুপ এবং এলাকার সঠিক ও নির্ভুল তথ্য প্রদান করা আবশ্যক।'
                        : 'Donors must be at least 18 years old. All profile details including name, phone number, blood group, and location must be genuine and accurate.'}
                    </p>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/50">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      {language === 'bn' ? '৩. রক্তের অনুরোধে আচরণবিধি' : '3. Code of Conduct'}
                    </h4>
                    <p className="text-[12px] text-slate-600 dark:text-zinc-400">
                      {language === 'bn'
                        ? 'ভুয়া অনুরোধ পোস্ট করা, স্প্যামিং বা রক্তদাতাদের অকারণে বিরক্ত করা সম্পূর্ণ নিষিদ্ধ। অপব্যবহারকারী অ্যাকাউন্ট তৎক্ষণাৎ আজীবনের জন্য ব্লক করা হবে।'
                        : 'Spamming, prank calls, or harassment of voluntary donors results in immediate account blacklisting and ban.'}
                    </p>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/50">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                      {language === 'bn' ? '৪. মেডিকেল ও আইনি দায়মুক্তি' : '4. Medical Screening Disclaimer'}
                    </h4>
                    <p className="text-[12px] text-slate-600 dark:text-zinc-400">
                      {language === 'bn'
                        ? 'রক্ত নেওয়ার আগে উপযুক্ত ডায়াগনস্টিক ল্যাবরেটরিতে ক্রস-ম্যাচিং ও স্ক্রিনিং টেস্ট (এইচআইভি, হেপাটাইটিস ইত্যাদি) নিশ্চিত করা রোগী ও পরিবারের নিজস্ব দায়িত্ব।'
                        : 'Receiving patients and hospital caregivers are solely responsible for conducting certified medical screening and cross-matching before transfusion.'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/50">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-red-500" />
                      {language === 'bn' ? '১. সংগৃহীত তথ্য' : '1. Collected Information'}
                    </h4>
                    <p className="text-[12px] text-slate-600 dark:text-zinc-400">
                      {language === 'bn'
                        ? 'জরুরি রক্তদানের সুবিধার্থে আমরা নাম, ফোন নম্বর, রক্তের গ্রুপ, এলাকা এবং গুগল একাউন্ট আইডি সংরক্ষণ করি।'
                        : 'We store your name, contact phone, blood group, area, and Google ID strictly to coordinate lifesaving donations.'}
                    </p>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/50">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      {language === 'bn' ? '২. যোগাযোগ তথ্য সুরক্ষায় লগইন সুরক্ষা' : '2. Contact Information Shield'}
                    </h4>
                    <p className="text-[12px] text-slate-600 dark:text-zinc-400">
                      {language === 'bn'
                        ? 'কোনো অননুমোদিত বট বা সাধারণ ভিজিটর রক্তদাতার ফোন নম্বর দেখতে পারে না। শুধুমাত্র যাচাইকৃত নিবন্ধিত ব্যবহারকারীরাই জরুরি প্রয়োজনে নম্বর দেখতে পারেন।'
                        : 'Phone numbers are never publicly broadcast to scrapers or bots. A visitor must be signed in to view verified contact details.'}
                    </p>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/50">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-500" />
                      {language === 'bn' ? '৩. কোনো বিজ্ঞাপন বা তথ্য বিক্রি নয়' : '3. Zero Data Sharing & Advertising'}
                    </h4>
                    <p className="text-[12px] text-slate-600 dark:text-zinc-400">
                      {language === 'bn'
                        ? 'আপনার ব্যক্তিগত বা যোগাযোগের তথ্য কোনো বিজ্ঞাপনদাতা, মার্কেটিং কোম্পানি বা তৃতীয় পক্ষের কাছে কখনই বিক্রি বা শেয়ার করা হয় না।'
                        : 'We strictly never sell, monetize, rent, or share personal donor data with any third-party marketing or commercial entities.'}
                    </p>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/50">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5 text-purple-500" />
                      {language === 'bn' ? '৪. অ্যাকাউন্ট মুছে ফেলার অধিকার' : '4. Right to Deletion'}
                    </h4>
                    <p className="text-[12px] text-slate-600 dark:text-zinc-400">
                      {language === 'bn'
                        ? 'আপনি যেকোনো সময় আপনার ড্যাশবোর্ড থেকে অ্যাকাউন্ট এবং ডাটা স্থায়ীভাবে মুছে ফেলতে পারেন।'
                        : 'You retain full autonomy to edit your profile or permanently erase your account and logs at any time.'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer with "I Agree" Action */}
            <div className="pt-4 mt-2 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setLegalModalTab(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRegAgreeTerms(true);
                  setLegalModalTab(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-md shadow-red-500/20 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{language === 'bn' ? 'সম্মতি দিয়ে গ্রহণ করুন' : 'Accept & Agree'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
