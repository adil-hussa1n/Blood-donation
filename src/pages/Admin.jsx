import React, { useState, useMemo, useEffect } from 'react';
import { Shield, Key, Eye, EyeOff, AlertTriangle, Trash2, Heart, Flame, LogOut, CheckCircle, MapPin, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp, BLOOD_GROUPS } from '../context/AppContext';

export default function Admin() {
  const { 
    donors, 
    emergencyRequests, 
    isAdmin, 
    loginAdmin, 
    logoutAdmin, 
    deleteDonor, 
    deleteEmergencyRequest,
    t
  } = useApp();

  // Login states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard view state: 'donors' or 'emergencies'
  const [adminTab, setAdminTab] = useState('donors');
  
  // Blood group filter in Donors view
  const [bloodGroupFilter, setBloodGroupFilter] = useState(''); // '' means All

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
          alert(t('errorDeletingDonorPrefix') + res.error);
        }
      } else if (confirmDeleteType === 'emergency') {
        const res = await deleteEmergencyRequest(confirmDeleteId);
        if (!res.success) {
          alert(t('errorDeletingRequestPrefix') + res.error);
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
    <div className="space-y-8 max-w-6xl mx-auto relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-100 dark:bg-zinc-900/50 p-6 rounded-3xl border border-slate-200/50 dark:border-zinc-800/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('adminDashboardTitle')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">
              {t('moderatorControlsText')}
            </p>
          </div>
        </div>
        
        <button
          onClick={logoutAdmin}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-400 rounded-xl text-xs font-bold transition-all"
        >
          <LogOut className="w-4 h-4" />
          {t('exitAdminButton')}
        </button>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setAdminTab('donors')}
          className={`glass-panel p-5 rounded-2xl border text-left flex justify-between items-center transition-all ${
            adminTab === 'donors'
              ? 'border-red-500/40 ring-1 ring-red-500/10 shadow-md'
              : 'hover:border-slate-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              {t('manageDonorsTab')}
            </span>
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight block">
              {donors.length}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-red-500/5 dark:bg-red-500/10 text-red-500">
            <Heart className="w-6 h-6" />
          </div>
        </button>

        <button
          onClick={() => setAdminTab('emergencies')}
          className={`glass-panel p-5 rounded-2xl border text-left flex justify-between items-center transition-all ${
            adminTab === 'emergencies'
              ? 'border-rose-500/40 ring-1 ring-rose-500/10 shadow-md'
              : 'hover:border-slate-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              {t('manageEmergenciesTab')}
            </span>
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight block">
              {emergencyRequests.length}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 text-rose-500">
            <Flame className="w-6 h-6" />
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
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold transition-all"
            >
              {t('cancelButton')}
            </button>
            <button
              onClick={executeDelete}
              disabled={deleting}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-md"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? t('deletingButton') : t('confirmDeleteButton')}
            </button>
          </div>
        </div>
      )}

      {/* Main Tables */}
      <div className="glass-panel border rounded-3xl overflow-hidden">
        {adminTab === 'donors' ? (
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
                            <td className="p-4 truncate overflow-hidden" title={donor.area}>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-red-500/60 shrink-0" />
                                <span className="truncate">{donor.area}</span>
                              </span>
                            </td>
                            <td className="p-4 font-semibold">{t('timesUnit', { count: donor.total_donations })}</td>
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
                            <span className="font-medium">{donor.area}</span>
                          </span>
                          <span className="font-bold bg-slate-100 dark:bg-zinc-800/60 px-2 py-0.5 rounded-md text-[11px]">
                            {t('timesUnit', { count: donor.total_donations })}
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
        ) : (
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
                            <td className="p-4 font-bold text-slate-900 dark:text-white truncate overflow-hidden" title={req.area}>{req.area}</td>
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
                              {req.area}
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
                          <p className="text-xs text-slate-650 dark:text-zinc-350 bg-slate-50 dark:bg-zinc-900/40 p-2.5 rounded-xl border border-slate-200/20 dark:border-zinc-800/30 text-left leading-normal">
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
      </div>

    </div>
  );
}
