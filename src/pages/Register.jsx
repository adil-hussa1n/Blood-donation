import React, { useState, useEffect, useMemo } from 'react';
import { UserPlus, Settings, CheckCircle2, AlertTriangle, Calendar, Phone, Search, Save, History, Sparkles, Key, Eye, EyeOff, User, ArrowLeft, ChevronLeft, ChevronRight, LogOut, X, Award, Flame } from 'lucide-react';
import { useApp, AREAS, BLOOD_GROUPS, getDonorBadge, getDonorBadgeLabel, normalizeDonor, getAreaLabel } from '../context/AppContext';
import { dbService } from '../services/db';

export default function Register() {
  const { registerDonor, updateDonorProfile, addDonationHistory, verifyDonorCredentials, resetDonorPassword, language, t } = useApp();
  
  // Tab control: 'register' or 'update'
  const [activeTab, setActiveTab] = useState('register');
  
  // Loader and messages
  const [formLoading, setFormLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Password visibility states
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showSearchPassword, setShowSearchPassword] = useState(false);
  const [showRecoveryPassword, setShowRecoveryPassword] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  // Security elements
  const [honeypot, setHoneypot] = useState('');
  const [formLoadTime, setFormLoadTime] = useState(Date.now());

  useEffect(() => {
    setFormLoadTime(Date.now());
  }, [activeTab]);

  // Toggle recovery mode
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem('bb_donor_session');
      if (cached) {
        const session = JSON.parse(cached);
        if (session && session.donor && session.password) {
          const donor = normalizeDonor(session.donor);
          setFoundDonor(donor);
          setSearchPhone(donor.phone);
          setSearchPassword(session.password);
          setEditName(donor.name);
          setEditArea(donor.area);
          setEditAvailable(donor.is_available);
          setActiveTab('update');
          
          setHistoryLoading(true);
          dbService.getDonationHistory(donor.id).then((historyRes) => {
            if (!historyRes.error) {
              setDonorHistory(historyRes.data || []);
            }
            setHistoryLoading(false);
          }).catch((err) => {
            setHistoryLoading(false);
          });
        }
      }
    } catch (e) {
      console.error("Failed to restore donor session:", e);
    }
  }, []);

  // ----------------------------------------
  // REGISTER FORM STATE
  // ----------------------------------------
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState('O+');
  const [regArea, setRegArea] = useState('Sylhet City Corporation');
  const [regLastDonationDate, setRegLastDonationDate] = useState('');
  const [regTotalDonations, setRegTotalDonations] = useState('');
  const [regAvailable, setRegAvailable] = useState(true);
  const [regPassword, setRegPassword] = useState('');
  const [regDob, setRegDob] = useState('');

  // ----------------------------------------
  // UPDATE FORM STATE
  // ----------------------------------------
  const [searchPhone, setSearchPhone] = useState('');
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
  
  // Add new donation event field
  const [newDonationDate, setNewDonationDate] = useState(new Date().toISOString().split('T')[0]);

  // ----------------------------------------
  // PASSWORD RECOVERY FORM STATE
  // ----------------------------------------
  const [recoveryName, setRecoveryName] = useState('');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryBloodGroup, setRecoveryBloodGroup] = useState('O+');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryDob, setRecoveryDob] = useState('');

  // ----------------------------------------
  // ACTIONS: REGISTRATION
  // ----------------------------------------
  const handleRegister = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    // 1. Bot check: Honeypot
    if (honeypot.trim() !== '') {
      setErrorMsg("Verification failed. Bot detected.");
      setFormLoading(false);
      return;
    }

    // 2. Bot check: Time elapsed
    const timeElapsed = Date.now() - formLoadTime;
    if (timeElapsed < 2000) {
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

    const phoneTrimmed = regPhone.trim();
    // Validate phone number format strictly
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(phoneTrimmed)) {
      setErrorMsg("Invalid phone number. Must be a valid 11-digit Bangladeshi number starting with 013-019.");
      setFormLoading(false);
      return;
    }

    if (regPassword.length < 4) {
      setErrorMsg(t('passwordLengthError'));
      setFormLoading(false);
      return;
    }

    if (!regDob) {
      setErrorMsg("Date of birth is required.");
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
      password: regPassword,
      dob: regDob
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
        setRegPassword('');
        setHoneypot('');
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
  // ACTIONS: PROFILE LOOKUP & UPDATE
  // ----------------------------------------
  const handleLookup = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setFoundDonor(null);
    setDonorHistory([]);

    const phoneTrimmed = searchPhone.trim();
    const passwordInput = searchPassword.trim();

    if (!phoneTrimmed || !passwordInput) {
      setErrorMsg(t('forgotPasswordPhonePasswordError'));
      return;
    }

    setFormLoading(true);

    try {
      const res = await verifyDonorCredentials(phoneTrimmed, passwordInput);
      
      if (!res.success) {
        setErrorMsg(res.error.message || t('invalidPhonePasswordError'));
        setFormLoading(false);
        return;
      }

      const donor = normalizeDonor(res.donor);
      setFoundDonor(donor);
      setEditName(donor.name);
      setEditArea(donor.area);
      setEditAvailable(donor.is_available);

      try {
        localStorage.setItem('bb_donor_session', JSON.stringify({ donor, password: passwordInput }));
      } catch (e) {
        console.error("Failed to save donor session:", e);
      }

      setHistoryLoading(true);
      const historyRes = await dbService.getDonationHistory(donor.id);
      if (!historyRes.error) {
        setDonorHistory(historyRes.data || []);
      }
    } catch (err) {
      setErrorMsg(t('authErrorTryAgain'));
    } finally {
      setHistoryLoading(false);
      setFormLoading(false);
    }
  };

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
        is_available: editAvailable
      };

      const res = await updateDonorProfile(foundDonor.id, profileData, searchPassword);
      if (res.success) {
        setSuccessMsg(t('profileUpdateSuccess'));
        const updatedDonor = {
          ...foundDonor,
          ...profileData
        };
        setFoundDonor(updatedDonor);
        try {
          localStorage.setItem('bb_donor_session', JSON.stringify({ donor: updatedDonor, password: searchPassword }));
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

  const handleAddDonation = async (e) => {
    e.preventDefault();
    if (!foundDonor || !newDonationDate) return;

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

        const updatedDonor = normalizeDonor({
          ...foundDonor,
          total_donations: (foundDonor.total_donations || 0) + 1,
          last_donation_date: newDonationDate,
          is_available: false
        });
        setFoundDonor(updatedDonor);
        setEditAvailable(false);
        setNewDonationDate(new Date().toISOString().split('T')[0]);

        try {
          localStorage.setItem('bb_donor_session', JSON.stringify({ donor: updatedDonor, password: searchPassword }));
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

  // ----------------------------------------
  // ACTIONS: PASSWORD RECOVERY (RESET)
  // ----------------------------------------
  const handlePasswordRecovery = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const phoneTrimmed = recoveryPhone.trim();
    const nameTrimmed = recoveryName.trim();
    const groupSelected = recoveryBloodGroup;
    const dobSelected = recoveryDob;
    const newPass = recoveryNewPassword.trim();

    if (!nameTrimmed || !phoneTrimmed || !dobSelected || !newPass) {
      setErrorMsg(t('fillAllFieldsError'));
      setFormLoading(false);
      return;
    }

    if (newPass.length < 4) {
      setErrorMsg(t('passwordLengthRecoveryError'));
      setFormLoading(false);
      return;
    }

    try {
      const res = await resetDonorPassword(nameTrimmed, phoneTrimmed, groupSelected, dobSelected, newPass);
      if (res.success) {
        setSuccessMsg(t('recoverySuccess'));
        // Reset recovery fields and toggle back to search lookup
        setRecoveryName('');
        setRecoveryPhone('');
        setRecoveryDob('');
        setRecoveryNewPassword('');
        setSearchPhone(phoneTrimmed);
        setShowForgotPassword(false);
      } else {
        setErrorMsg(res.error?.message || t('recoveryError'));
      }
    } catch (err) {
      setErrorMsg(t('recoveryGeneralError'));
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t('managementPortal')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-lg mx-auto">
          {t('portalDesc')}
        </p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-950/50 text-emerald-800 dark:text-emerald-450 p-4 rounded-2xl text-sm flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-950/50 text-rose-800 dark:text-rose-450 p-4 rounded-2xl text-sm flex items-center gap-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-zinc-900 p-1.5 rounded-2xl max-w-md mx-auto">
        <button
          onClick={() => {
            setActiveTab('register');
            setSuccessMsg('');
            setErrorMsg('');
            setShowForgotPassword(false);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'register'
              ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          {t('newDonorTab')}
        </button>
        <button
          onClick={() => {
            setActiveTab('update');
            setSuccessMsg('');
            setErrorMsg('');
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
            activeTab === 'update'
              ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          {t('updateProfileTab')}
        </button>
      </div>

      {/* Main Forms container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* ============================================================== */}
        {/* TAB 1: REGISTER NEW DONOR                                       */}
        {/* ============================================================== */}
        {activeTab === 'register' && (
          <form 
            onSubmit={handleRegister} 
            className="md:col-span-8 md:col-start-3 glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-200/50 dark:border-zinc-800/50 space-y-5 sm:space-y-6"
          >
            <div className="flex items-center gap-2 pb-4 border-b border-slate-200/50 dark:border-zinc-800/50">
              <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                {t('donorRegistrationTitle')}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  {t('fullName')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('donorNamePlaceholder')}
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  {t('phoneUnique')}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder={t('phonePlaceholder')}
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              {/* Choose Password */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  {t('choosePassword')}
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder={t('choosePasswordPlaceholder')}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-650 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Blood Group */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  {t('bloodGroup')}
                </label>
                <select
                  value={regBloodGroup}
                  onChange={(e) => setRegBloodGroup(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white cursor-pointer"
                >
                  {BLOOD_GROUPS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  {t('selectArea')}
                </label>
                <select
                  value={regArea}
                  onChange={(e) => setRegArea(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white cursor-pointer"
                >
                  {AREAS.map(a => (
                    <option key={a} value={a}>{getAreaLabel(a, t)}</option>
                  ))}
                </select>
              </div>

              {/* Last Donation Date */}
              <div className="space-y-1.5 font-semibold text-xs">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  {t('lastDonationOptional')}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={regLastDonationDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setRegLastDonationDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white cursor-pointer"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  {t('dobLabel')}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={regDob}
                    onChange={(e) => setRegDob(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white cursor-pointer"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              {/* Total Times Donated */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  {t('timesDonatedOptional')}
                </label>
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
                  />
                  <History className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block leading-tight">
                  {t('timesDonatedHelper')}
                </span>
              </div>

              {/* Availability Toggle */}
              <div className="space-y-1.5 flex flex-col justify-end pb-1.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={regAvailable}
                    onChange={(e) => setRegAvailable(e.target.checked)}
                    className="w-5 h-5 rounded-lg border-slate-300 text-red-500 focus:ring-red-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                      {t('setAvailable')}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500 block">
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

            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-extrabold py-3 px-4 rounded-xl shadow-lg shadow-red-500/10 hover:shadow-red-500/20 active:scale-[0.99] disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 mt-6 text-sm cursor-pointer"
            >
              {formLoading ? t('registeringButton') : t('completeRegistration')}
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* TAB 2: UPDATE EXISTING PROFILE / HISTORY / RECOVERY             */}
        {/* ============================================================== */}
        {activeTab === 'update' && (
          <>
            {/* Phone & Password Lookup Form OR Forgot Password Form */}
            <div className={`${foundDonor ? 'md:col-span-5' : 'md:col-span-8 md:col-start-3'} space-y-6 transition-all duration-300`}>
              
              {!foundDonor && (
                <>
                  {!showForgotPassword ? (
                    /* Normal Profile Lookup */
                    <form 
                      onSubmit={handleLookup} 
                      className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/50 dark:border-zinc-800/50 space-y-4"
                    >
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-200/50 dark:border-zinc-800/50">
                        <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center">
                          <Search className="w-4 h-4" />
                        </div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                          {t('findProfile')}
                        </h3>
                      </div>

                      {/* Phone */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                          {t('registeredPhoneLabel')}
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            required
                            placeholder={t('phonePlaceholder')}
                            value={searchPhone}
                            onChange={(e) => setSearchPhone(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
                          />
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                            {t('enterPassword')}
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setShowForgotPassword(true);
                              setSuccessMsg('');
                              setErrorMsg('');
                            }}
                            className="text-[11px] font-bold text-red-500 hover:text-red-650 transition-colors cursor-pointer"
                          >
                            {t('forgotPassword')}
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showSearchPassword ? 'text' : 'password'}
                            required
                            placeholder={t('enterPasswordPlaceholder')}
                            value={searchPassword}
                            onChange={(e) => setSearchPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
                          />
                          <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                          <button
                            type="button"
                            onClick={() => setShowSearchPassword(!showSearchPassword)}
                            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-650 dark:hover:text-zinc-200 cursor-pointer"
                          >
                            {showSearchPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={formLoading}
                        className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 text-xs cursor-pointer"
                      >
                        {formLoading ? t('verifyingButton') : t('loadProfileButton')}
                      </button>
                    </form>
                  ) : (
                    /* Password Recovery Form */
                    <form 
                      onSubmit={handlePasswordRecovery} 
                      className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/50 dark:border-zinc-800/50 space-y-4 animate-scale-up"
                    >
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-200/50 dark:border-zinc-800/50">
                        <button 
                          type="button" 
                          onClick={() => setShowForgotPassword(false)}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-850 text-slate-550 cursor-pointer"
                          title="Go Back"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                          {t('recoveryTab')}
                        </h3>
                      </div>

                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 leading-normal">
                        {t('recoveryDesc')}
                      </p>

                      {/* Recovery Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                          {t('registeredFullNameLabel')}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder={t('donorNamePlaceholder')}
                            value={recoveryName}
                            onChange={(e) => setRecoveryName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
                          />
                          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        </div>
                      </div>

                      {/* Recovery Phone */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                          {t('phone')}
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            required
                            placeholder={t('phonePlaceholder')}
                            value={recoveryPhone}
                            onChange={(e) => setRecoveryPhone(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
                          />
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        </div>
                      </div>

                      {/* Recovery Blood Group */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                          {t('bloodGroup')}
                        </label>
                        <select
                          value={recoveryBloodGroup}
                          onChange={(e) => setRecoveryBloodGroup(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white cursor-pointer"
                        >
                          {BLOOD_GROUPS.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>

                      {/* Recovery Date of Birth */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                          {t('dobLabel')}
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            required
                            max={new Date().toISOString().split('T')[0]}
                            value={recoveryDob}
                            onChange={(e) => setRecoveryDob(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white cursor-pointer"
                          />
                          <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        </div>
                      </div>

                      {/* New Password */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                          {t('chooseNewPasswordLabel')}
                        </label>
                        <div className="relative">
                          <input
                            type={showRecoveryPassword ? 'text' : 'password'}
                            required
                            placeholder={t('recoveryPasswordPlaceholder')}
                            value={recoveryNewPassword}
                            onChange={(e) => setRecoveryNewPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
                          />
                          <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                          <button
                            type="button"
                            onClick={() => setShowRecoveryPassword(!showRecoveryPassword)}
                            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-650 dark:hover:text-zinc-200 cursor-pointer"
                          >
                            {showRecoveryPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={formLoading}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 text-xs cursor-pointer"
                      >
                        {t('verifyResetPasswordButton')}
                      </button>
                    </form>
                  )}
                </>
              )}

              {/* Profile summary card when found */}
              {foundDonor && (
                <div className="glass-panel border-red-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border relative overflow-hidden space-y-3 sm:space-y-4 animate-slide-up">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl -mr-6 -mt-6" />
                  
                  <div className="flex items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500 text-white font-black text-lg sm:text-xl flex items-center justify-center shadow-md">
                        {foundDonor.blood_group}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                          {foundDonor.name}
                          <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-current animate-pulse" />
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
                        setFoundDonor(null);
                        setSearchPhone('');
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
                      <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                      {language === 'bn' ? 'প্রশংসাপত্র ডাউনলোড করুন' : 'Download Appreciation Certificate'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Profile Update Controls & Log Donation forms */}
            {foundDonor && (
              <div className="md:col-span-7 space-y-6 animate-fade-in">
                
                {/* 1. Log Donation Event Form */}
                <form 
                  onSubmit={handleAddDonation}
                  className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/50 dark:border-zinc-800/50 space-y-4 font-semibold text-xs"
                >
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-200/50 dark:border-zinc-800/50">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                      <History className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      {t('logDonationTitle')}
                    </h3>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                      {t('donationDate')}
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        max={new Date().toISOString().split('T')[0]}
                        value={newDonationDate}
                        onChange={(e) => setNewDonationDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white cursor-pointer"
                      />
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.99] disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 text-xs cursor-pointer"
                  >
                    {formLoading ? t('loggingButton') : t('logDonationButton')}
                  </button>
                </form>

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
                        {AREAS.map(a => (
                          <option key={a} value={a}>{getAreaLabel(a, t)}</option>
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
            )}
          </>
        )}
      </div>

      {/* Certificate Modal Overlay */}
      {showCertificate && foundDonor && (
        <div id="certificate-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm animate-fade-in print:bg-white print:p-0">
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
                padding: 12mm !important;
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
                padding: 10mm !important;
                box-sizing: border-box !important;
                border-color: #f59e0b !important;
              }
            }
          `}</style>
          <div id="certificate-print-area" className="bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20 text-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-amber-200/50 shadow-2xl relative space-y-6 text-center print:border-0 print:shadow-none print:p-0 print:my-0 print:mx-auto">
            
            {/* Floating Close Button */}
            <button
              onClick={() => setShowCertificate(false)}
              className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-9 h-9 bg-white dark:bg-zinc-900 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full border border-slate-200 dark:border-zinc-800 flex items-center justify-center shadow-lg transition-all hover:scale-110 hover:rotate-90 z-10 print:hidden cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Certificate Border decoration */}
            <div id="certificate-border-container" className="border-4 border-double border-amber-500/60 p-6 sm:p-10 rounded-2xl space-y-6 relative print:border-amber-500 print:p-8 bg-white/70">
              <div className="absolute top-2.5 left-2.5 w-6 h-6 border-t-2 border-l-2 border-amber-600/80" />
              <div className="absolute top-2.5 right-2.5 w-6 h-6 border-t-2 border-r-2 border-amber-600/80" />
              <div className="absolute bottom-2.5 left-2.5 w-6 h-6 border-b-2 border-l-2 border-amber-600/80" />
              <div className="absolute bottom-2.5 right-2.5 w-6 h-6 border-b-2 border-r-2 border-amber-600/80" />

              {/* Content */}
              <div className="space-y-1">
                {/* Brand Header */}
                <div className="flex flex-col items-center gap-0.5 pb-3">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-red-500 fill-current animate-pulse shrink-0" />
                    <span className="text-xs font-black tracking-widest text-slate-800 uppercase font-sans">
                      Bloodify247
                    </span>
                  </div>
                  <span className="text-[8px] uppercase tracking-[0.15em] text-slate-450 font-bold block leading-none">
                    Powered by GraffixInnovation
                  </span>
                </div>

                <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.25em] text-amber-700 block mb-1 font-sans border-t border-slate-100 pt-3">
                  Certificate of Appreciation
                </span>
                <h2 className="font-serif font-black text-3xl sm:text-4xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 bg-clip-text text-transparent print:text-amber-600 tracking-wide">
                  LIFE SAVER AWARD
                </h2>
                
                {/* Styled Ornament Divider */}
                <div className="flex items-center justify-center gap-3 my-3">
                  <div className="w-14 h-[1px] bg-gradient-to-r from-transparent to-amber-500" />
                  <Award className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="w-14 h-[1px] bg-gradient-to-l from-transparent to-amber-500" />
                </div>
              </div>

              <p className="text-xs text-slate-500 font-semibold leading-relaxed italic max-w-md mx-auto">
                This certificate is proudly presented to
              </p>

              <h3 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight my-3 font-serif">
                {foundDonor.name}
              </h3>

              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed font-medium">
                {language === 'bn' 
                  ? `স্বেচ্ছায় রক্তদান করে মানবতার সেবায় অনন্য ভূমিকা পালনের জন্য এবং সফলভাবে ${foundDonor.total_donations} বার রক্তদান সম্পন্ন করায় আপনাকে এই সম্মাননা স্মারক প্রদান করা হলো।` 
                  : `for their selfless dedication to humanity by donating blood ${foundDonor.total_donations} times. Your noble actions have directly helped save lives and serve as an inspiration to the community.`
                }
              </p>

              {/* Bottom Details Grid with Wax Seal */}
              <div className="grid grid-cols-3 items-center gap-4 pt-6 max-w-lg mx-auto border-t border-slate-200/80 print:border-slate-300">
                {/* Left Column: Date Issued */}
                <div className="text-left space-y-1">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">Date Issued</span>
                  <strong className="text-xs font-semibold text-slate-700 block border-b border-slate-200 pb-1">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </strong>
                  <span className="text-[8px] text-slate-400 block uppercase tracking-tight">Certificate Date</span>
                </div>

                {/* Center Column: Red/Gold Wax Seal */}
                <div className="relative flex justify-center -mt-2">
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center border border-amber-400 shadow-lg z-10 print:border-red-600">
                    <div className="border border-amber-300/40 rounded-full w-[calc(100%-6px)] h-[calc(100%-6px)] flex flex-col items-center justify-center">
                      <span className="text-[8px] font-bold text-amber-200/80 uppercase tracking-tight leading-none">Group</span>
                      <span className="text-lg font-black text-white leading-none mt-0.5 drop-shadow">{foundDonor.blood_group}</span>
                    </div>
                  </div>
                  {/* Seal Ribbons */}
                  <div className="absolute top-12 flex justify-center gap-1 pointer-events-none print:opacity-85">
                    <div className="w-3 h-8 bg-red-650/90 rotate-12 transform origin-top shadow-sm rounded-b-sm" />
                    <div className="w-3 h-8 bg-red-750/90 -rotate-12 transform origin-top shadow-sm rounded-b-sm" />
                  </div>
                </div>

                {/* Right Column: Last Donation */}
                <div className="text-right space-y-1">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">Last Donation</span>
                  <strong className="text-xs font-semibold text-slate-700 block border-b border-slate-200 pb-1">
                    {foundDonor.last_donation_date 
                      ? new Date(foundDonor.last_donation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'N/A'
                    }
                  </strong>
                  <span className="text-[8px] text-slate-400 block uppercase tracking-tight">Donation Log</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 justify-center print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
