import React, { useState, useMemo, useEffect } from 'react';
import { Shield, Key, Eye, EyeOff, AlertTriangle, Trash2, Heart, Flame, LogOut, CheckCircle, MapPin, User, ChevronLeft, ChevronRight, Ban, Hospital, MessageSquare } from 'lucide-react';
import { useApp, BLOOD_GROUPS, normalizeDonor, getAreaLabel } from '../context/AppContext';

export default function Admin() {
  const { 
    donors, 
    emergencyRequests, 
    isAdmin, 
    loginAdmin, 
    logoutAdmin, 
    deleteDonor, 
    deleteEmergencyRequest,
    blockDonorByPhone,
    unblockDonorByPhone,
    getBlockedPhones,
    getAllHospitalsAdmin,
    approveHospitalAdmin,
    getSupportRequests,
    showToast,
    t
  } = useApp();

  // Login states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard view state: 'donors' or 'emergencies' or 'blocked'
  const [adminTab, setAdminTab] = useState('donors');
  
  // Blood group filter in Donors view
  const [bloodGroupFilter, setBloodGroupFilter] = useState(''); // '' means All

  // Blocked phone states
  const [blockedPhones, setBlockedPhones] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [blockedError, setBlockedError] = useState(null);
  const [phoneToBlock, setPhoneToBlock] = useState('');
  const [blockReason, setBlockReason] = useState('');

  // Inline Confirmation Banner States
  const [confirmUnblockPhone, setConfirmUnblockPhone] = useState(null);
  const [confirmBlockData, setConfirmBlockData] = useState(null);
  const [confirmClinicVerification, setConfirmClinicVerification] = useState(null);

  const fetchBlockedPhones = async () => {
    setBlockedLoading(true);
    setBlockedError(null);
    const res = await getBlockedPhones();
    if (res.success) {
      setBlockedPhones(res.data || []);
    } else {
      setBlockedError(res.error?.message || "Failed to fetch blocked phone numbers.");
    }
    setBlockedLoading(false);
  };

  const [hospitals, setHospitals] = useState([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [hospitalsError, setHospitalsError] = useState(null);

  const fetchHospitals = async () => {
    setHospitalsLoading(true);
    setHospitalsError(null);
    const res = await getAllHospitalsAdmin();
    if (res.data) {
      setHospitals(res.data);
    } else if (res.error) {
      setHospitalsError(res.error.message || "Failed to fetch registered hospitals.");
    }
    setHospitalsLoading(false);
  };

  const [supportRequests, setSupportRequests] = useState([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportError, setSupportError] = useState(null);

  const fetchSupportRequests = async () => {
    setSupportLoading(true);
    setSupportError(null);
    const res = await getSupportRequests();
    if (res.error) {
      setSupportError(res.error.message || "Failed to fetch support requests.");
    } else if (res.data) {
      setSupportRequests(res.data);
    }
    setSupportLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchBlockedPhones();
      fetchHospitals();
      fetchSupportRequests();
    }
  }, [isAdmin]);

  const handleToggleHospitalVerification = (hospitalId, name, currentStatus) => {
    const nextStatus = !currentStatus;
    setConfirmClinicVerification({ id: hospitalId, name, nextStatus });
  };

  const executeClinicVerification = async (hospitalId, nextStatus) => {
    const res = await approveHospitalAdmin(hospitalId, nextStatus);
    if (res.success) {
      showToast(`Clinic ${nextStatus ? 'approved' : 'revoked'} successfully.`, 'success');
      await fetchHospitals();
    } else {
      showToast("Failed to change verification: " + (res.error?.message || "unknown error"), 'error');
    }
  };

  const handleBlockPhone = (e) => {
    e.preventDefault();
    if (!phoneToBlock.trim()) return;

    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(phoneToBlock.trim())) {
      showToast("Invalid phone number. Must be a valid 11-digit Bangladeshi number starting with 013-019.", 'warning');
      return;
    }

    setConfirmBlockData({ phone: phoneToBlock.trim(), reason: blockReason.trim() });
  };

  const executeBlock = async (phone, reason) => {
    setBlockedLoading(true);
    const res = await blockDonorByPhone(phone, reason || 'Blocked by admin');
    if (res.success) {
      setPhoneToBlock('');
      setBlockReason('');
      await fetchBlockedPhones();
      showToast("Phone number blocked successfully.", 'success');
    } else {
      showToast("Failed to block phone: " + (res.error?.message || "unknown error"), 'error');
    }
    setBlockedLoading(false);
  };

  const handleUnblockPhone = (phone) => {
    setConfirmUnblockPhone(phone);
  };

  const executeUnblock = async (phone) => {
    setBlockedLoading(true);
    const res = await unblockDonorByPhone(phone);
    if (res.success) {
      await fetchBlockedPhones();
      showToast("Phone number unblocked successfully.", 'success');
    } else {
      showToast("Failed to unblock phone: " + (res.error?.message || "unknown error"), 'error');
    }
    setBlockedLoading(false);
  };

  // Modal / Confirm state
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteType, setConfirmDeleteType] = useState(null); // 'donor' or 'emergency'
  const [deleting, setDeleting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const success = await loginAdmin(username, password);
      if (!success) {
        setLoginError(t('adminLoginError'));
      } else {
        setUsername('');
        setPassword('');
      }
    } catch (err) {
      setLoginError(t('adminConnError'));
    } finally {
      setLoginLoading(false);
    }
  };

  const startDeleteConfirm = (id, type) => {
    setConfirmDeleteId(id);
    setConfirmDeleteType(type);
  };

  const cancelDeleteConfirm = () => {
    setConfirmDeleteId(null);
    setConfirmDeleteType(null);
  };

  const executeDelete = async () => {
    if (!confirmDeleteId || !confirmDeleteType) return;
    setDeleting(true);
    
    try {
      if (confirmDeleteType === 'donor') {
        const res = await deleteDonor(confirmDeleteId);
        if (!res.success) {
          showToast(t('errorDeletingDonorPrefix') + res.error, 'error');
        }
      } else if (confirmDeleteType === 'emergency') {
        const res = await deleteEmergencyRequest(confirmDeleteId);
        if (!res.success) {
          showToast(t('errorDeletingRequestPrefix') + res.error, 'error');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
      setConfirmDeleteType(null);
    }
  };

  // Filtered Donors list for Admin
  const adminFilteredDonors = useMemo(() => {
    return donors.filter((d) => {
      return bloodGroupFilter ? d.blood_group === bloodGroupFilter : true;
    });
  }, [donors, bloodGroupFilter]);

  // Compute counts for each blood group
  const groupCounts = useMemo(() => {
    const counts = { All: donors.length };
    BLOOD_GROUPS.forEach(g => {
      counts[g] = donors.filter(d => d.blood_group === g).length;
    });
    return counts;
  }, [donors]);

  // Pagination for Donors
  const [donorPage, setDonorPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when blood group filter changes or donors count changes
  useEffect(() => {
    setDonorPage(1);
  }, [bloodGroupFilter, donors.length]);

  const totalDonorPages = Math.max(1, Math.ceil(adminFilteredDonors.length / itemsPerPage));
  const paginatedDonors = useMemo(() => {
    const startIndex = (donorPage - 1) * itemsPerPage;
    return adminFilteredDonors.slice(startIndex, startIndex + itemsPerPage);
  }, [adminFilteredDonors, donorPage]);

  // Pagination for Emergencies
  const [emergencyPage, setEmergencyPage] = useState(1);

  // Reset page when emergencies count changes
  useEffect(() => {
    setEmergencyPage(1);
  }, [emergencyRequests.length]);

  const totalEmergencyPages = Math.max(1, Math.ceil(emergencyRequests.length / itemsPerPage));
  const paginatedEmergencies = useMemo(() => {
    const startIndex = (emergencyPage - 1) * itemsPerPage;
    return emergencyRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [emergencyRequests, emergencyPage]);

  // ==============================================================
  // RENDER: LOGIN FORM
  // ==============================================================
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-12">
        <form 
          onSubmit={handleLogin} 
          className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-200/50 dark:border-zinc-800/50 space-y-6 shadow-xl relative overflow-hidden"
        >
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center mx-auto shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {t('adminAuthTitle')}
              </h2>
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block">
                {t('adminPortalSub')}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {t('adminDescLogin')}
            </p>
          </div>

          {loginError && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-950/50 text-rose-800 dark:text-rose-400 p-3.5 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span className="font-semibold">{loginError}</span>
            </div>
          )}

          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              {t('adminIdLabel')}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder={t('adminIdPlaceholder')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              {t('adminPassLabel')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={t('adminPassPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
              />
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-650 dark:hover:text-zinc-350"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-extrabold py-3 px-4 rounded-xl shadow-lg shadow-red-500/10 hover:shadow-red-500/20 active:scale-[0.99] disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 text-xs"
          >
            {loginLoading ? t('authenticatingButton') : t('adminLoginButton')}
          </button>
        </form>
      </div>
    );
  }

  // ==============================================================
  // RENDER: ADMIN PANEL DASHBOARD
  // ==============================================================
  return (
    <div className="space-y-5 sm:space-y-8 max-w-6xl mx-auto relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-slate-100 dark:bg-zinc-900/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/50 dark:border-zinc-800/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-md shrink-0">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="text-left">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('adminDashboardTitle')}
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">
              {t('moderatorControlsText')}
            </p>
          </div>
        </div>
        
        <button
          onClick={logoutAdmin}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-400 rounded-xl text-xs font-bold transition-all self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          {t('exitAdminButton')}
        </button>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <button
          onClick={() => setAdminTab('donors')}
          className={`glass-panel p-3 sm:p-5 rounded-2xl border text-left flex justify-between items-center transition-all cursor-pointer ${
            adminTab === 'donors'
              ? 'border-red-500/40 ring-1 ring-red-500/10 shadow-md'
              : 'hover:border-slate-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <span className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block truncate">
              {t('manageDonorsTab')}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight block">
              {donors.length}
            </span>
          </div>
          <div className="p-2 sm:p-3 rounded-xl bg-red-500/5 dark:bg-red-500/10 text-red-500 shrink-0">
            <Heart className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </button>

        <button
          onClick={() => setAdminTab('emergencies')}
          className={`glass-panel p-3 sm:p-5 rounded-2xl border text-left flex justify-between items-center transition-all cursor-pointer ${
            adminTab === 'emergencies'
              ? 'border-rose-500/40 ring-1 ring-rose-500/10 shadow-md'
              : 'hover:border-slate-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <span className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block truncate">
              {t('manageEmergenciesTab')}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight block">
              {emergencyRequests.length}
            </span>
          </div>
          <div className="p-2 sm:p-3 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 text-rose-500 shrink-0">
            <Flame className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </button>

        <button
          onClick={() => setAdminTab('blocked')}
          className={`glass-panel p-3 sm:p-5 rounded-2xl border text-left flex justify-between items-center transition-all cursor-pointer ${
            adminTab === 'blocked'
              ? 'border-zinc-500/40 ring-1 ring-zinc-500/10 shadow-md'
              : 'hover:border-slate-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <span className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block truncate">
              Blocked Phones
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight block">
              {blockedPhones.length}
            </span>
          </div>
          <div className="p-2 sm:p-3 rounded-xl bg-zinc-500/5 dark:bg-zinc-500/10 text-zinc-500 shrink-0">
            <Ban className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </button>

        <button
          onClick={() => setAdminTab('hospitals')}
          className={`glass-panel p-3 sm:p-5 rounded-2xl border text-left flex justify-between items-center transition-all cursor-pointer ${
            adminTab === 'hospitals'
              ? 'border-emerald-500/40 ring-1 ring-emerald-500/10 shadow-md'
              : 'hover:border-slate-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <span className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block truncate">
              Manage Clinics
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight block">
              {hospitals.length}
            </span>
          </div>
          <div className="p-2 sm:p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 shrink-0">
            <Hospital className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </button>

        <button
          onClick={() => setAdminTab('support')}
          className={`glass-panel p-3 sm:p-5 rounded-2xl border text-left flex justify-between items-center transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            adminTab === 'support'
              ? 'border-blue-500/40 ring-1 ring-blue-500/10 shadow-md'
              : 'hover:border-slate-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <span className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block truncate">
              Support Tickets
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight block">
              {supportRequests.length}
            </span>
          </div>
          <div className="p-2 sm:p-3 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 text-blue-500 shrink-0">
            <MessageSquare className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </button>
      </div>

      {/* Delete Confirmation Alert Banner */}
      {confirmDeleteId && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-300 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-left">
              <h4 className="font-bold text-sm">{t('areYouSureTitle')}</h4>
              <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-0.5">
                {t('permanentActionWarning', { type: confirmDeleteType === 'donor' ? t('registeredDonorWord') : t('emergencyRequestWord') })}
              </p>
            </div>
          </div>
          <div className="flex gap-2 self-end sm:self-center">
            <button
              onClick={cancelDeleteConfirm}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              {t('cancelButton')}
            </button>
            <button
              onClick={executeDelete}
              disabled={deleting}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-md cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? t('deletingButton') : t('confirmDeleteButton')}
            </button>
          </div>
        </div>
      )}

      {/* Block Confirmation Alert Banner */}
      {confirmBlockData && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-300 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="text-left">
              <h4 className="font-bold text-sm">Are you absolutely sure?</h4>
              <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-0.5">
                You are about to block the phone number <span className="font-extrabold">{confirmBlockData.phone}</span>. If they have an active session, they will be logged out and prohibited from registering or creating emergency posts.
              </p>
            </div>
          </div>
          <div className="flex gap-2 self-end sm:self-center">
            <button
              onClick={() => setConfirmBlockData(null)}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                const data = confirmBlockData;
                setConfirmBlockData(null);
                await executeBlock(data.phone, data.reason);
              }}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-md cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" />
              Confirm Block
            </button>
          </div>
        </div>
      )}

      {/* Unblock Confirmation Alert Banner */}
      {confirmUnblockPhone && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-900 text-amber-800 dark:text-amber-350 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-left">
              <h4 className="font-bold text-sm">Are you sure?</h4>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                You are about to unblock the phone number <span className="font-bold">{confirmUnblockPhone}</span>. This will restore their access to register, login, and post emergency requests.
              </p>
            </div>
          </div>
          <div className="flex gap-2 self-end sm:self-center">
            <button
              onClick={() => setConfirmUnblockPhone(null)}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                const phone = confirmUnblockPhone;
                setConfirmUnblockPhone(null);
                await executeUnblock(phone);
              }}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-md cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Confirm Unblock
            </button>
          </div>
        </div>
      )}

      {/* Clinic Verification Confirmation Alert Banner */}
      {confirmClinicVerification && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-300 dark:border-blue-900 text-blue-800 dark:text-blue-300 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-left">
              <h4 className="font-bold text-sm">Are you sure?</h4>
              <p className="text-xs text-blue-700/80 dark:text-blue-300/80 mt-0.5">
                You are about to <span className="font-extrabold uppercase">{confirmClinicVerification.nextStatus ? 'approve' : 'revoke'}</span> verification for the clinic <span className="font-bold">"{confirmClinicVerification.name}"</span>.
              </p>
            </div>
          </div>
          <div className="flex gap-2 self-end sm:self-center">
            <button
              onClick={() => setConfirmClinicVerification(null)}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                const clinic = confirmClinicVerification;
                setConfirmClinicVerification(null);
                await executeClinicVerification(clinic.id, clinic.nextStatus);
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-md cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Confirm Changes
            </button>
          </div>
        </div>
      )}

      {/* Main Tables */}
      <div className="glass-panel border rounded-3xl overflow-hidden">
        {adminTab === 'donors' && (
          <div className="space-y-4">
            
            {/* Header with categories */}
            <div className="p-5 border-b border-slate-200/50 dark:border-zinc-800/50 space-y-4 text-left">
              <h3 className="font-extrabold text-slate-950 dark:text-white text-base">
                {t('donorRecordsHeader')}
              </h3>
              
              {/* Category selector */}
              <div className="flex flex-wrap gap-2 items-center animate-fade-in">
                <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mr-2">
                  {t('categoryLabel')}
                </span>
                
                {/* All pill */}
                <button
                  onClick={() => setBloodGroupFilter('')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    bloodGroupFilter === ''
                      ? 'bg-red-500 text-white shadow-sm shadow-red-500/10'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                  }`}
                >
                  {t('allCategoryPill')} ({groupCounts.All})
                </button>

                {/* Blood Group pills */}
                {BLOOD_GROUPS.map(group => (
                  <button
                    key={group}
                    onClick={() => setBloodGroupFilter(group)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      bloodGroupFilter === group
                        ? 'bg-red-500 text-white shadow-sm shadow-red-500/10'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                    }`}
                  >
                    {group} ({groupCounts[group]})
                  </button>
                ))}
              </div>
            </div>
            
            {adminFilteredDonors.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-zinc-400">
                {t('noDonorsInCategory', { category: bloodGroupFilter || t('allCategoryPill') })}
              </div>
            ) : (
              <>
                <div className="animate-fade-in">
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse table-fixed">
                      <thead>
                        <tr className="border-b border-slate-200/50 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-900/30 text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
                          <th className="p-4 w-[22%]">{t('nameHeader')}</th>
                          <th className="p-4 w-[12%]">{t('bloodGroupHeader')}</th>
                          <th className="p-4 w-[18%]">{t('phoneHeader')}</th>
                          <th className="p-4 w-[22%]">{t('areaHeader')}</th>
                          <th className="p-4 w-[14%]">{t('donationsHeader')}</th>
                          <th className="p-4 w-[12%] text-center">{t('actionsHeader')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/50 dark:divide-zinc-800/50 text-slate-700 dark:text-zinc-300 font-medium">
                        {paginatedDonors.map((donor) => (
                          <tr key={donor.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                            <td className="p-4 font-bold text-slate-900 dark:text-white truncate overflow-hidden" title={donor.name}>
                              {donor.name}
                            </td>
                            <td className="p-4">
                              <span className="bg-red-500/10 text-red-600 dark:text-red-400 font-black px-2 py-0.5 rounded-md text-xs">
                                {donor.blood_group}
                              </span>
                            </td>
                            <td className="p-4 truncate overflow-hidden">{donor.phone}</td>
                            <td className="p-4 truncate overflow-hidden" title={getAreaLabel(donor.area, t)}>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-red-500/60 shrink-0" />
                                <span className="truncate">{getAreaLabel(donor.area, t)}</span>
                              </span>
                            </td>
                            <td className="p-4 font-semibold">
                              <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 font-black text-sm border border-red-500/15 mr-2">
                                {normalizeDonor(donor).total_donations}
                              </span>
                              {t('timesUnit', { count: normalizeDonor(donor).total_donations })}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => startDeleteConfirm(donor.id, 'donor')}
                                className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 p-2 rounded-xl transition-all cursor-pointer"
                                title="Delete fake/spam donor"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Stack Card View */}
                  <div className="md:hidden divide-y divide-slate-100 dark:divide-zinc-850">
                    {paginatedDonors.map((donor) => (
                      <div key={donor.id} className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-zinc-900/5 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="text-left space-y-1">
                            <span className="font-extrabold text-slate-900 dark:text-white text-base block">
                              {donor.name}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-zinc-400 font-semibold block">
                              {donor.phone}
                            </span>
                          </div>
                          <span className="bg-red-500/10 text-red-600 dark:text-red-400 font-black px-3 py-1 rounded-lg text-xs">
                            {donor.blood_group}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-slate-650 dark:text-zinc-300 pt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-red-500/60 shrink-0" />
                            <span className="font-medium">{getAreaLabel(donor.area, t)}</span>
                          </span>
                          <span className="font-bold bg-slate-100 dark:bg-zinc-800/60 px-2 py-0.5 rounded-md text-[11px]">
                            {t('timesUnit', { count: normalizeDonor(donor).total_donations })}
                          </span>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => startDeleteConfirm(donor.id, 'donor')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-450 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {t('deleteDonorAction')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              {/* Pagination Controls */}
              {totalDonorPages > 1 && (
                <div className="flex justify-between items-center p-5 border-t border-slate-200/50 dark:border-zinc-800/50 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => setDonorPage(prev => Math.max(1, prev - 1))}
                    disabled={donorPage === 1}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t('previousPage')}
                  </button>
                  <span className="text-xs text-slate-500 dark:text-zinc-400 font-bold">
                    {t('pageIndicator', { current: donorPage, total: totalDonorPages })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDonorPage(prev => Math.min(totalDonorPages, prev + 1))}
                    disabled={donorPage === totalDonorPages}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {t('nextPage')}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
          </div>
        )}

        {adminTab === 'emergencies' && (
          <div className="space-y-4">
            <div className="p-5 border-b border-slate-200/50 dark:border-zinc-800/50 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-950 dark:text-white text-base">
                {t('activeEmergencyRecordsHeader')}
              </h3>
            </div>
            
            {emergencyRequests.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-zinc-400">
                {t('noActiveEmergencies')}
              </div>
            ) : (
              <>
                <div className="animate-fade-in">
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse table-fixed">
                      <thead>
                        <tr className="border-b border-slate-200/50 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-900/30 text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
                          <th className="p-4 w-[12%]">{t('bloodNeededHeader')}</th>
                          <th className="p-4 w-[22%]">{t('hospitalAreaHeader')}</th>
                          <th className="p-4 w-[16%]">{t('contactPhoneHeader')}</th>
                          <th className="p-4 w-[24%]">{t('noteDetailsHeader')}</th>
                          <th className="p-4 w-[14%]">{t('postedDateHeader')}</th>
                          <th className="p-4 w-[12%] text-center">{t('actionsHeader')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/50 dark:divide-zinc-800/50 text-slate-700 dark:text-zinc-300 font-medium">
                        {paginatedEmergencies.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                            <td className="p-4">
                              <span className="bg-red-500 text-white font-extrabold px-2.5 py-0.5 rounded-lg text-xs">
                                {req.blood_group}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-slate-900 dark:text-white truncate overflow-hidden" title={getAreaLabel(req.area, t)}>{getAreaLabel(req.area, t)}</td>
                            <td className="p-4 truncate overflow-hidden">{req.contact}</td>
                            <td className="p-4 truncate overflow-hidden" title={req.note}>
                              {req.note || t('noDescription')}
                            </td>
                            <td className="p-4 text-xs text-slate-400 dark:text-zinc-500">
                              {new Date(req.created_at).toLocaleString()}
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => startDeleteConfirm(req.id, 'emergency')}
                                className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 p-2 rounded-xl transition-all cursor-pointer"
                                title="Delete emergency request"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Stack Card View */}
                  <div className="md:hidden divide-y divide-slate-100 dark:divide-zinc-850">
                    {paginatedEmergencies.map((req) => (
                      <div key={req.id} className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-zinc-900/5 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="text-left space-y-1">
                            <span className="font-extrabold text-slate-900 dark:text-white text-base block">
                              {getAreaLabel(req.area, t)}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-zinc-400 font-semibold block">
                              {req.contact}
                            </span>
                          </div>
                          <span className="bg-red-500 text-white font-black px-3 py-1 rounded-lg text-xs">
                            {req.blood_group}
                          </span>
                        </div>

                        {req.note && (
                          <p className="text-xs text-slate-650 dark:text-zinc-355 bg-slate-50 dark:bg-zinc-900/40 p-2.5 rounded-xl border border-slate-200/20 dark:border-zinc-800/30 text-left leading-normal">
                            {req.note}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500 pt-1">
                          <span>{new Date(req.created_at).toLocaleString()}</span>
                          <button
                            onClick={() => startDeleteConfirm(req.id, 'emergency')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-450 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {t('deleteRequest')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              {/* Pagination Controls */}
              {totalEmergencyPages > 1 && (
                <div className="flex justify-between items-center p-5 border-t border-slate-200/50 dark:border-zinc-800/50 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => setEmergencyPage(prev => Math.max(1, prev - 1))}
                    disabled={emergencyPage === 1}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t('previousPage')}
                  </button>
                  <span className="text-xs text-slate-500 dark:text-zinc-400 font-bold">
                    {t('pageIndicator', { current: emergencyPage, total: totalEmergencyPages })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEmergencyPage(prev => Math.min(totalEmergencyPages, prev + 1))}
                    disabled={emergencyPage === totalEmergencyPages}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {t('nextPage')}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
          </div>
        )}

        {adminTab === 'blocked' && (
          <div className="space-y-6 p-5">
            <h3 className="font-extrabold text-slate-950 dark:text-white text-base border-b border-slate-200/50 dark:border-zinc-800/50 pb-3 text-left">
              Block Users by Phone Number
            </h3>

            {/* Block phone form */}
            <form onSubmit={handleBlockPhone} className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-zinc-950/20 p-5 rounded-2xl border border-slate-200/50 dark:border-zinc-800/30">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 01712345678"
                  value={phoneToBlock}
                  onChange={(e) => setPhoneToBlock(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                  Reason for Block (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spam donor"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={blockedLoading}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5 h-[42px]"
                >
                  <Ban className="w-4 h-4" />
                  Block Phone Number
                </button>
              </div>
            </form>

            {/* Block list */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm text-left">
                Currently Blocked Phone Numbers
              </h4>

              {blockedError && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-950/50 text-rose-800 dark:text-rose-400 p-3.5 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span className="font-semibold">{blockedError}</span>
                </div>
              )}

              {blockedLoading && blockedPhones.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold py-4">Loading blocked list...</p>
              ) : blockedPhones.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold py-4">No blocked phone numbers.</p>
              ) : (
              <>
              {/* Blocked phones — Desktop table */}
              <div className="hidden md:block overflow-x-auto border border-slate-200/50 dark:border-zinc-800/50 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/50 dark:border-zinc-800/50 bg-slate-50 dark:bg-zinc-900/30 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="p-3">Phone</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3">Blocked By</th>
                      <th className="p-3">Blocked At</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-900 text-slate-700 dark:text-zinc-350">
                    {blockedPhones.map((b) => (
                      <tr key={b.phone} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                        <td className="p-3 font-bold">{b.phone}</td>
                        <td className="p-3">{b.reason || 'Blocked by admin'}</td>
                        <td className="p-3">{b.blocked_by || 'Admin'}</td>
                        <td className="p-3">{b.blocked_at ? new Date(b.blocked_at).toLocaleString() : 'N/A'}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleUnblockPhone(b.phone)}
                            disabled={blockedLoading}
                            className="px-2.5 py-1 bg-green-500/15 hover:bg-green-500/25 text-green-600 dark:text-green-400 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all border border-green-500/20 hover:scale-[1.02]"
                          >
                            Unblock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Blocked phones — Mobile cards */}
              <div className="md:hidden space-y-3">
                {blockedPhones.map((b) => (
                  <div key={b.phone} className="glass-panel border border-slate-200/50 dark:border-zinc-800/50 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="space-y-0.5">
                        <span className="font-black text-slate-900 dark:text-white text-base block">{b.phone}</span>
                        <span className="text-xs text-slate-500 dark:text-zinc-400 font-semibold block">{b.reason || 'Blocked by admin'}</span>
                      </div>
                      <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/15">
                        BLOCKED
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                        {b.blocked_at ? new Date(b.blocked_at).toLocaleString() : 'N/A'}
                      </span>
                      <button
                        onClick={() => handleUnblockPhone(b.phone)}
                        disabled={blockedLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/15 hover:bg-green-500/25 text-green-600 dark:text-green-400 rounded-xl text-xs font-extrabold cursor-pointer transition-all border border-green-500/20"
                      >
                        Unblock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              </>
              )}
            </div>
          </div>
        )}

        {adminTab === 'hospitals' && (
          <div className="space-y-4">
            <div className="p-5 border-b border-slate-200/50 dark:border-zinc-800/50 text-left">
              <h3 className="font-extrabold text-slate-950 dark:text-white text-base">
                Clinic & Hospital Verification Console
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 font-semibold">
                Manage registered hospital accounts, verify their status, and approve or revoke stock editing access.
              </p>
            </div>

            {hospitalsError && (
              <div className="mx-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-950/50 text-rose-800 dark:text-rose-400 p-3.5 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="font-semibold">{hospitalsError}</span>
              </div>
            )}

            {hospitalsLoading ? (
              <div className="p-12 text-center text-slate-400 dark:text-zinc-500 font-semibold text-xs">
                Loading hospital records...
              </div>
            ) : hospitals.length === 0 ? (
              <div className="p-12 text-center text-slate-550 dark:text-zinc-450 font-semibold text-xs">
                No clinics or hospitals registered yet.
              </div>
            ) : (
              <div>
                {/* Hospitals — Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 dark:divide-zinc-800">
                    <thead className="bg-slate-50/50 dark:bg-zinc-950/40">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Hospital / Clinic Name</th>
                        <th className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Area Union</th>
                        <th className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Contact Number</th>
                        <th className="px-6 py-4 text-center text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Verification Status</th>
                        <th className="px-6 py-4 text-right text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-transparent divide-y divide-slate-100 dark:divide-zinc-850">
                      {hospitals.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50/40 dark:hover:bg-zinc-900/10 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-left">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white block">{h.name}</span>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500">ID: {h.id}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-left font-bold text-xs text-slate-655 dark:text-zinc-450">
                            {getAreaLabel(h.area, t)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-left font-bold text-xs text-slate-655 dark:text-zinc-450">
                            {h.contact}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {h.is_verified ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-500">
                                <CheckCircle className="w-3.5 h-3.5" /> Approved
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-500">
                                <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold">
                            <button
                              onClick={() => handleToggleHospitalVerification(h.id, h.name, h.is_verified)}
                              className={`px-3 py-1.5 rounded-xl font-bold transition-all text-[10px] uppercase tracking-wider cursor-pointer ${
                                h.is_verified
                                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/15'
                              }`}
                            >
                              {h.is_verified ? 'Revoke Approval' : 'Approve Clinic'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Hospitals — Mobile cards */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-zinc-800">
                  {hospitals.map((h) => (
                    <div key={h.id} className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-zinc-900/5 transition-colors">
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-0.5 min-w-0">
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm block truncate">{h.name}</span>
                          <span className="text-xs text-slate-500 dark:text-zinc-400 font-semibold flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-red-500/60 shrink-0" />
                            {getAreaLabel(h.area, t)}
                          </span>
                        </div>
                        {h.is_verified ? (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-500">
                            <CheckCircle className="w-3 h-3" /> Approved
                          </span>
                        ) : (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-500">
                            <AlertTriangle className="w-3 h-3 animate-pulse" /> Pending
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
                        <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">{h.contact}</span>
                        <button
                          onClick={() => handleToggleHospitalVerification(h.id, h.name, h.is_verified)}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                            h.is_verified
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/15'
                          }`}
                        >
                          {h.is_verified ? 'Revoke' : 'Approve'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {adminTab === 'support' && (
          <div className="space-y-4">
            <div className="p-5 border-b border-slate-200/50 dark:border-zinc-800/50 text-left flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-950 dark:text-white text-base">
                  Help & Support Requests
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 font-semibold">
                  View and manage tickets submitted by donors and users seeking help or reporting problems.
                </p>
              </div>
              <button
                onClick={fetchSupportRequests}
                disabled={supportLoading}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                {supportLoading ? 'Refreshing...' : 'Refresh List'}
              </button>
            </div>

            {supportError && (
              <div className="mx-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-950/50 text-rose-800 dark:text-rose-400 p-3.5 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="font-semibold">{supportError}</span>
              </div>
            )}

            {supportLoading && supportRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-zinc-500 font-semibold text-xs animate-pulse">
                Loading support requests...
              </div>
            ) : supportRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-550 dark:text-zinc-450 font-semibold text-xs">
                No support requests or problem reports found.
              </div>
            ) : (
              <div className="animate-fade-in">
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse table-fixed">
                    <thead>
                      <tr className="border-b border-slate-200/50 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-900/30 text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
                        <th className="p-4 w-[10%]">Type</th>
                        <th className="p-4 w-[18%]">Name</th>
                        <th className="p-4 w-[15%]">Phone</th>
                        <th className="p-4 w-[17%]">Issue Type</th>
                        <th className="p-4 w-[28%]">Message</th>
                        <th className="p-4 w-[12%]">Received At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-zinc-800/50 text-slate-700 dark:text-zinc-300 font-medium">
                      {supportRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                              req.type === 'problem'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            }`}>
                              {req.type === 'problem' ? 'Problem' : 'Support'}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-950 dark:text-white truncate" title={req.name}>
                            {req.name}
                          </td>
                          <td className="p-4">{req.phone}</td>
                          <td className="p-4">
                            {req.issue_type ? (
                              <span className="bg-slate-105 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-2 py-0.5 rounded text-xs">
                                {t(req.issue_type) || req.issue_type}
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-zinc-650">—</span>
                            )}
                          </td>
                          <td className="p-4 truncate" title={req.message}>
                            {req.message}
                          </td>
                          <td className="p-4 text-xs text-slate-400 dark:text-zinc-500">
                            {new Date(req.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-zinc-850">
                  {supportRequests.map((req) => (
                    <div key={req.id} className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-zinc-900/5 transition-colors text-left">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="font-extrabold text-slate-900 dark:text-white text-base block">
                            {req.name}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-zinc-400 font-semibold block">
                            {req.phone}
                          </span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                          req.type === 'problem'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}>
                          {req.type === 'problem' ? 'Problem' : 'Support'}
                        </span>
                      </div>

                      {req.issue_type && (
                        <div className="text-xs">
                          <span className="text-slate-400 dark:text-zinc-500 mr-1.5">Issue:</span>
                          <span className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-2 py-0.5 rounded font-bold">
                            {t(req.issue_type) || req.issue_type}
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-slate-655 dark:text-zinc-350 bg-slate-50 dark:bg-zinc-900/40 p-2.5 rounded-xl border border-slate-200/20 dark:border-zinc-800/30 leading-normal">
                        {req.message}
                      </p>

                      <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                        Received: {new Date(req.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
