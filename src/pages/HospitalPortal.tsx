import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Phone, Hospital, AlertTriangle, CheckCircle2, Key, User, PlusCircle, LogOut, Check } from 'lucide-react';
import { useApp, AREAS, BLOOD_GROUPS, getAreaLabel } from '../context/AppContext';
import { HospitalInventory } from '../types';
import { supabase } from '../services/supabase';

export default function HospitalPortal() {
  const { 
    hospitalInventory, 
    currentHospital, 
    setCurrentHospital,
    loginHospital, 
    logoutHospital, 
    registerHospital, 
    updateHospitalStockBulk, 
    checkHospitalUsernameAvailable,
    refreshData, 
    isDemoMode,
    language, 
    t 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Poll hospital status for auto-approval check
  const [approvalMessage, setApprovalMessage] = useState('');

  useEffect(() => {
    if (!currentHospital || currentHospital.is_verified) return;

    const intervalId = setInterval(async () => {
      try {
        let latestHospital = null;
        if (isDemoMode) {
          const hospitalsList = JSON.parse(window.localStorage.getItem('bb_hospitals') || '[]');
          latestHospital = hospitalsList.find(h => h.id === currentHospital.id);
        } else {
          // Use statically imported supabase reference
          const { data, error } = await supabase
            .from('hospitals')
            .select('is_verified')
            .eq('id', currentHospital.id)
            .maybeSingle();
          if (!error && data) {
            latestHospital = data;
          }
        }

        if (latestHospital && latestHospital.is_verified) {
          // Clinic approved! Update local state/session
          const updatedSession = { ...currentHospital, is_verified: true };
          
          setApprovalMessage(t('accountApprovedMsg'));
          
          setTimeout(() => {
            // Update context state
            setCurrentHospital(updatedSession);
            window.localStorage.setItem('bb_hospital_session', JSON.stringify(updatedSession));
            setApprovalMessage('');
          }, 3000);
          
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error("Error polling hospital approval status:", err);
      }
    }, 4000); // Check every 4 seconds

    return () => clearInterval(intervalId);
  }, [currentHospital, isDemoMode]);

  // Login Form States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [usernameCheck, setUsernameCheck] = useState<{ loading: boolean; message: string; available: boolean | null }>({
    loading: false,
    message: '',
    available: null
  });
  const [regArea, setRegArea] = useState('Sylhet City Corporation');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState('');

  // Stock Dashboard States
  const [stocks, setStocks] = useState<Record<string, 'low' | 'critical' | 'stable'>>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Debounced username availability check
  useEffect(() => {
    if (!regUsername.trim()) {
      setUsernameCheck({ loading: false, message: '', available: null });
      return;
    }

    const reg = /^[a-zA-Z0-9_]{3,15}$/;
    if (!reg.test(regUsername)) {
      setUsernameCheck({
        loading: false,
        message: 'Username must be 3-15 chars (letters, numbers, underscore).',
        available: false
      });
      return;
    }

    setUsernameCheck(prev => ({ ...prev, loading: true, message: 'Checking availability...' }));
    
    const timeoutId = setTimeout(async () => {
      try {
        const res = await checkHospitalUsernameAvailable(regUsername);
        if (res.available) {
          setUsernameCheck({ loading: false, message: 'Username is available!', available: true });
        } else {
          setUsernameCheck({ loading: false, message: 'Username not available.', available: false });
        }
      } catch (err) {
        setUsernameCheck({ loading: false, message: 'Error checking availability.', available: null });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [regUsername]);

  // Load current hospital stock when logged in
  useEffect(() => {
    if (currentHospital) {
      const initialStocks: Record<string, 'low' | 'critical' | 'stable'> = {};
      BLOOD_GROUPS.forEach(bg => {
        // Find existing status in local context inventory
        const item = (hospitalInventory as HospitalInventory[] || []).find(
          x => x.hospital_id === currentHospital.id && x.blood_group === bg
        );
        initialStocks[bg] = item ? item.stock_status : 'stable';
      });
      setStocks(initialStocks);
    }
  }, [currentHospital, hospitalInventory]);

  // Auth: Register Handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (usernameCheck.available !== true) {
      setRegError(usernameCheck.message || 'Please choose an available username.');
      return;
    }

    setRegLoading(true);

    const phoneTrimmed = regPhone.trim();
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(phoneTrimmed)) {
      setRegError('Invalid phone number. Must be a valid 11-digit Bangladeshi mobile number.');
      setRegLoading(false);
      return;
    }

    if (regPassword.length < 4) {
      setRegError('Password must be at least 4 characters long.');
      setRegLoading(false);
      return;
    }

    const hospitalData = {
      name: regName.trim(),
      username: regUsername.trim().toLowerCase(),
      area: regArea,
      contact: phoneTrimmed,
      password: regPassword
    };

    try {
      const res = await registerHospital(hospitalData);
      if (res.success) {
        setRegSuccess('Registration submitted successfully! Verification Status: Pending. Please Contact Support to Verify Hospital / Clinic Account.');
        setActiveTab('login');
        setLoginUsername(regUsername.trim().toLowerCase());
        setLoginPassword(regPassword);
        // Reset registration fields
        setRegName('');
        setRegUsername('');
        setRegPhone('');
        setRegPassword('');
      } else {
        setRegError(res.error?.message || 'Registration failed.');
      }
    } catch (err) {
      setRegError(t('unexpectedError'));
    } finally {
      setRegLoading(false);
    }
  };

  // Auth: Login Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const success = await loginHospital(loginUsername.trim().toLowerCase(), loginPassword);
      if (!success) {
        setLoginError('Invalid username or password.');
      } else {
        await refreshData(true);
      }
    } catch (err) {
      setLoginError('Authentication failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Bulk Stock Save Handler
  const handleSaveStocks = async () => {
    setSaveError('');
    setSaveSuccess('');
    setSaveLoading(true);

    const payload = Object.entries(stocks).map(([bg, status]) => ({
      blood_group: bg,
      stock_status: status
    }));

    try {
      const res = await updateHospitalStockBulk(payload);
      if (res.success) {
        setSaveSuccess('All blood stock levels updated successfully!');
        setTimeout(() => setSaveSuccess(''), 4000);
      } else {
        setSaveError(res.error?.message || 'Failed to update stock.');
      }
    } catch (err) {
      setSaveError(t('unexpectedError'));
    } finally {
      setSaveLoading(false);
    }
  };

  // Logged-in view: Dashboard
  if (currentHospital) {
    const isVerified = currentHospital.is_verified;

    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6 text-left">
        {approvalMessage && (
          <div className="bg-emerald-500 text-white font-extrabold text-xs p-4 rounded-2xl shadow-lg animate-pulse flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{approvalMessage}</span>
          </div>
        )}
        {/* Profile Card Header */}
        <div className="glass-panel border border-slate-200/50 dark:border-zinc-800/50 rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br from-red-650/5 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded">
              <Hospital className="w-3.5 h-3.5" /> {t('clinicProfileLabel')}
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                {currentHospital.name}
              </h2>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {t('approvedLabel')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-full animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-amber-500" /> {t('pendingApprovalLabel')}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold flex items-center gap-4">
              <span>Area: <strong>{getAreaLabel(currentHospital.area, t)}</strong></span>
              <span>Contact: <strong>{currentHospital.contact}</strong></span>
            </p>
          </div>
          <button
            onClick={logoutHospital}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm border border-slate-200/30 dark:border-zinc-800/30 transition-all cursor-pointer w-fit"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            {t('signOutLabel')}
          </button>
        </div>

        {!isVerified ? (
          <div className="glass-panel border border-amber-500/30 rounded-3xl p-8 text-center space-y-4 bg-amber-500/5">
            <div className="w-14 h-14 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 animate-bounce text-amber-500" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-lg font-black text-slate-800 dark:text-white">
                {t('accountVerificationStatusPending')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold">
                {t('clinicVerificationDesc')}
              </p>
              <div className="pt-2">
                <span className="inline-block bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/25 font-black text-[10px] px-4 py-2.5 rounded-2xl uppercase tracking-wider">
                  {t('contactSupportVerify')}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {saveSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 text-emerald-800 dark:text-emerald-400 p-4 rounded-xl text-xs flex items-center gap-2 font-semibold">
                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>{saveSuccess}</span>
              </div>
            )}

            {saveError && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-250 text-rose-800 dark:text-rose-400 p-4 rounded-xl text-xs flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Bulk Stock Management Grid */}
            <div className="glass-panel border border-slate-200/50 dark:border-zinc-800/50 rounded-3xl p-5 sm:p-6 space-y-6">
              <div className="border-b border-slate-200/20 dark:border-zinc-800/35 pb-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {t('bloodStockDashboardTitle')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 font-semibold">
                  {t('bloodStockDashboardDesc')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BLOOD_GROUPS.map((bg) => {
                  const currentStatus = stocks[bg] || 'stable';
                  return (
                    <div 
                      key={bg} 
                      className="flex items-center justify-between p-4 rounded-2xl border border-slate-250/30 dark:border-zinc-800/40 bg-slate-50/20 dark:bg-zinc-950/20"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-red-500 text-white font-black text-sm shadow-sm">
                          {bg}
                        </span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">
                          {t('bloodStockLabel')}
                        </span>
                      </div>
 
                      {/* Segmented Status Pill Selector */}
                      <div className="flex bg-slate-100 dark:bg-zinc-900/60 p-1 rounded-xl border border-slate-200/20 dark:border-zinc-800/20">
                        <button
                          type="button"
                          onClick={() => setStocks(prev => ({ ...prev, [bg]: 'stable' }))}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            currentStatus === 'stable'
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'text-slate-500 dark:text-zinc-450 hover:text-slate-800 dark:hover:text-zinc-250'
                          }`}
                        >
                          {t('stableLabel')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setStocks(prev => ({ ...prev, [bg]: 'low' }))}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            currentStatus === 'low'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'text-slate-500 dark:text-zinc-450 hover:text-slate-800 dark:hover:text-zinc-250'
                          }`}
                        >
                          {t('lowLabel')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setStocks(prev => ({ ...prev, [bg]: 'critical' }))}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            currentStatus === 'critical'
                              ? 'bg-red-500 text-white shadow-sm'
                              : 'text-slate-500 dark:text-zinc-450 hover:text-slate-800 dark:hover:text-zinc-250'
                          }`}
                        >
                          {t('shortageLabel')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-200/20 dark:border-zinc-800/35 flex justify-end">
                <button
                  onClick={handleSaveStocks}
                  disabled={saveLoading}
                  className="bg-red-500 hover:bg-red-600 text-white font-extrabold px-6 py-3 rounded-2xl text-xs shadow-lg hover:shadow-red-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saveLoading ? t('savingChangesMsg') : t('saveStockChangesButton')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Logged-out view: Login & Registration Forms
  return (
    <div className="max-w-md mx-auto space-y-6 py-8 text-left">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <Hospital className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          {t('hospitalStockPortalTitle')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
          {t('hospitalStockPortalDesc')}
        </p>
      </div>

      {regSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-emerald-800 dark:text-emerald-400 p-3.5 rounded-xl text-xs flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{regSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-zinc-900/60 p-1.5 rounded-2xl border border-slate-200/20 dark:border-zinc-800/20">
        <button
          onClick={() => { setActiveTab('login'); setLoginError(''); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'login'
              ? 'bg-white dark:bg-zinc-800 text-red-500 shadow-md'
              : 'text-slate-500 dark:text-zinc-450 hover:text-slate-800 dark:hover:text-zinc-250'
          }`}
        >
          {t('signInTab')}
        </button>
        <button
          onClick={() => { setActiveTab('register'); setRegError(''); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'register'
              ? 'bg-white dark:bg-zinc-800 text-red-500 shadow-md'
              : 'text-slate-500 dark:text-zinc-450 hover:text-slate-800 dark:hover:text-zinc-250'
          }`}
        >
          {t('registerClinicTab')}
        </button>
      </div>

      {/* Login Tab */}
      {activeTab === 'login' ? (
        <div className="space-y-4">
          {loginError && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 text-rose-800 dark:text-rose-400 p-3.5 rounded-xl text-xs flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="glass-panel border border-slate-200/50 dark:border-zinc-800/50 rounded-2xl p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                {t('uniqueUsernameLabel')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Enter unique username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-extrabold py-3 px-4 rounded-xl shadow-lg transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Key className="w-4 h-4" />
              {loginLoading ? t('registeringLabelPortal') : t('signInTab')}
            </button>
          </form>
        </div>
      ) : (
        /* Register Tab */
        <div className="space-y-4">
          {regError && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 text-rose-800 dark:text-rose-400 p-3.5 rounded-xl text-xs flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{regError}</span>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="glass-panel border border-slate-200/50 dark:border-zinc-800/50 rounded-2xl p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                Hospital/Clinic Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Beanibazar General Hospital"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
                />
                <Hospital className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                {t('uniqueUsernameLabel')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. sylhet_central_clinic"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white ${
                    usernameCheck.available === true
                      ? 'border-emerald-500 focus:ring-emerald-500 focus:border-emerald-500'
                      : usernameCheck.available === false
                        ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500'
                        : 'border-slate-200 dark:border-zinc-800'
                  }`}
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
              {usernameCheck.message && (
                <p className={`text-[10px] font-bold ${
                  usernameCheck.available === true
                    ? 'text-emerald-600 dark:text-emerald-555'
                    : usernameCheck.available === false
                      ? 'text-rose-600 dark:text-rose-555'
                      : 'text-slate-400 dark:text-zinc-555'
                }`}>
                  {usernameCheck.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                Select Area
              </label>
              <select
                value={regArea}
                onChange={(e) => setRegArea(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white cursor-pointer"
              >
                {(AREAS as string[]).map((a) => (
                  <option key={a} value={a}>
                    {getAreaLabel(a, t)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                Contact Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="e.g. 01712345678"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                {t('choosePasswordLabelPortal')}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="At least 4 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={regLoading}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-extrabold py-3 px-4 rounded-xl shadow-lg transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              {regLoading ? t('registeringLabelPortal') : t('registerClinicAccountButton')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
