import React, { useState, useEffect, useMemo } from 'react';
import { Flame, AlertTriangle, CheckCircle2, Megaphone, Phone, MapPin, ClipboardList, MessageCircle, Calendar, Trash2, Key, X, Clock, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp, AREAS, BLOOD_GROUPS, calculateHoursSince } from '../context/AppContext';
import { dbService } from '../services/db';

export default function Emergency() {
  const { emergencyRequests, createEmergencyRequest, deleteEmergencyRequest, loading, error, isAdmin, language, t } = useApp();
  
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page to 1 when emergencyRequests length changes
  useEffect(() => {
    setCurrentPage(1);
  }, [emergencyRequests.length]);

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(emergencyRequests.length / itemsPerPage));
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return emergencyRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [emergencyRequests, currentPage]);
  
  // Form state
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [area, setArea] = useState('Beanibazar Sadar');
  const [contact, setContact] = useState('');
  const [note, setNote] = useState('');
  const [passcode, setPasscode] = useState(''); // Stores the general password
  
  const [formLoading, setFormLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Security elements
  const [honeypot, setHoneypot] = useState('');
  const [formLoadTime, setFormLoadTime] = useState(Date.now());
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReady, setTurnstileReady] = useState(false);
  const turnstileRef = React.useRef(null);
  const widgetIdRef = React.useRef(null);

  useEffect(() => {
    setFormLoadTime(Date.now());
  }, []);

  useEffect(() => {
    const checkTurnstile = () => {
      if (window.turnstile) {
        setTurnstileReady(true);
      } else {
        setTimeout(checkTurnstile, 200);
      }
    };
    checkTurnstile();
  }, []);

  useEffect(() => {
    if (!turnstileReady || !turnstileRef.current) return;
    
    let widgetId = null;
    try {
      widgetId = window.turnstile.render(turnstileRef.current, {
        sitekey: import.meta.env.VITE_TURNSTILE_SITEKEY || "1x00000000000000000000AA",
        size: 'invisible',
        callback: (token) => {
          setTurnstileToken(token);
        },
        'expired-callback': () => {
          setTurnstileToken('');
          if (widgetId) window.turnstile.reset(widgetId);
        },
        'error-callback': () => {
          setTurnstileToken('');
        }
      });
      widgetIdRef.current = widgetId;
    } catch (err) {
      console.error("Turnstile render error:", err);
    }

    return () => {
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch (e) {}
      }
    };
  }, [turnstileReady]);

  // Password visibility for creation
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  
  // Delete modal state
  const [deletingRequest, setDeletingRequest] = useState(null); // { id, passcode, group }
  const [enteredPasscode, setEnteredPasscode] = useState(''); // Stores password entered during delete
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handlePostRequest = async (e) => {
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

    // Phone validation
    const contactTrimmed = contact.trim();
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(contactTrimmed)) {
      setErrorMsg("Invalid phone number. Must be a valid 11-digit Bangladeshi number starting with 013-019.");
      setFormLoading(false);
      return;
    }

    // Password validation (at least 4 characters)
    const passwordInput = passcode.trim();
    if (passwordInput.length < 4) {
      setErrorMsg(t('passwordLengthError'));
      setFormLoading(false);
      return;
    }

    // Check if the contact phone is a registered donor
    try {
      const donorRes = await dbService.getDonorByPhone(contactTrimmed);
      if (donorRes.data) {
        // Registered donor found! Check if the entered password matches the account password
        if (donorRes.data.password !== passwordInput) {
          setErrorMsg(t('registeredPhonePasswordError'));
          setFormLoading(false);
          return;
        }
      }
    } catch (err) {
      // Ignore lookup error and proceed
    }

    const requestData = {
      blood_group: bloodGroup,
      area: area.trim(),
      contact: contactTrimmed,
      note: note.trim(),
      passcode: passwordInput // Stored in passcode column
    };

    try {
      const res = await createEmergencyRequest(requestData, turnstileToken, honeypot);
      if (res.success) {
        setSuccessMsg(t('postSuccessMsg', { bloodGroup }));
        // Reset form inputs
        setContact('');
        setNote('');
        setPasscode('');
        setHoneypot('');
        setTurnstileToken('');
        if (window.turnstile && widgetIdRef.current) {
          window.turnstile.reset(widgetIdRef.current);
        }
        setFormLoadTime(Date.now()); // reset open timer
      } else {
        setErrorMsg(res.error.message || t('postErrorMsg'));
        if (window.turnstile && widgetIdRef.current) {
          window.turnstile.reset(widgetIdRef.current);
        }
      }
    } catch (err) {
      setErrorMsg(t('unexpectedError'));
    } finally {
      setFormLoading(false);
    }
  };

  const openDeleteModal = (req) => {
    setDeletingRequest(req);
    setEnteredPasscode('');
    setDeleteError('');
    setShowDeletePassword(false);
  };

  const closeDeleteModal = () => {
    setDeletingRequest(null);
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    if (!deletingRequest) return;
    setDeleteError('');

    setDeleteLoading(true);
    try {
      if (!isAdmin) {
        const enteredTrimmed = String(enteredPasscode || '').trim();
        let isValid = false;

        // Check if the contact phone number belongs to a registered donor
        try {
          const donorRes = await dbService.getDonorByPhone(deletingRequest.contact);
          if (donorRes.data && donorRes.data.password) {
            // Verify against current registered password (handles any password changes)
            isValid = String(donorRes.data.password).trim() === enteredTrimmed;
          } else if (deletingRequest.passcode) {
            // Fall back to passcode stored with the request
            isValid = String(deletingRequest.passcode).trim() === enteredTrimmed;
          }
        } catch (err) {
          if (deletingRequest.passcode) {
            // If search fails, check stored passcode
            isValid = String(deletingRequest.passcode).trim() === enteredTrimmed;
          }
        }

        if (!isValid) {
          setDeleteError(t('incorrectPasswordDeleteError'));
          setDeleteLoading(false);
          return;
        }
      }

      const res = await deleteEmergencyRequest(deletingRequest.id, enteredPasscode);
      if (res.success) {
        closeDeleteModal();
        setSuccessMsg(t('deleteSuccess'));
      } else {
        setDeleteError(
          t('deleteErrorPrefix') + 
          (res.error?.message || t('unknownError'))
        );
      }
    } catch (err) {
      setDeleteError(t('unexpectedError'));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      
      {/* Delete Confirmation Modal Overlay */}
      {deletingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/50 dark:border-zinc-800/50 space-y-4 animate-scale-up relative">
            <button 
              onClick={closeDeleteModal}
              className="absolute right-4 top-4 p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/50 dark:border-zinc-800/50">
              <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {t('deleteRequest')}
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400 text-left">
              {t('deletingRequestText')}{' '}
              <strong className="text-slate-800 dark:text-zinc-200">{deletingRequest.blood_group}</strong>
              {' '}{t('bloodAtText')}{' '}
              <strong className="text-slate-800 dark:text-zinc-200">{deletingRequest.area}</strong>.
            </p>

            {deleteError && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 text-rose-800 dark:text-rose-400 p-3.5 rounded-xl text-xs flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <form onSubmit={handleDeleteSubmit} className="space-y-4 text-left">
              {!isAdmin ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                    {t('enterDeletionPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showDeletePassword ? 'text' : 'password'}
                      required
                      placeholder={t('enterPasswordPlaceholder')}
                      value={enteredPasscode}
                      onChange={(e) => setEnteredPasscode(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 dark:text-white"
                    />
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowDeletePassword(!showDeletePassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-250"
                    >
                      {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                  {t('adminAuthSuccessText')}
                </p>
              )}

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {t('cancelButton')}
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  {deleteLoading ? t('processingButton') : t('deleteRequest')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
          <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 fill-current animate-pulse" />
          {t('emergencyTitle')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">
          {t('emergencyDesc')}
        </p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-950/50 text-emerald-800 dark:text-emerald-400 p-4 rounded-2xl text-sm flex items-center gap-3 animate-fade-in max-w-7xl mx-auto">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-950/50 text-rose-800 dark:text-rose-400 p-4 rounded-2xl text-sm flex items-center gap-3 animate-fade-in max-w-7xl mx-auto">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto">
        
        {/* Left: Request Form */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
          <form 
            onSubmit={handlePostRequest} 
            className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/50 dark:border-zinc-800/50 space-y-5 text-left"
          >
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/50 dark:border-zinc-800/50">
              <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center">
                <Megaphone className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {t('createRequestTitle')}
              </h3>
            </div>

            {/* Blood group */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                {t('bloodGroup')}
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white cursor-pointer"
              >
                {BLOOD_GROUPS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Location / Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                {t('locationHospital')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder={t('hospitalPlaceholder')}
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Contact Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                {t('emergencyPhone')}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder={t('phonePlaceholder')}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Deletion / Account Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                {t('accountDeletionPassword')}
              </label>
              <div className="relative">
                <input
                  type={showCreatePassword ? 'text' : 'password'}
                  required
                  placeholder={t('passwordPlaceholder')}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword(!showCreatePassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 block leading-tight">
                {t('passwordHelper')}
              </span>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                {t('additionalDetails')}
              </label>
              <textarea
                rows="3"
                placeholder={t('notePlaceholder')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white resize-none"
              />
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

            {/* Cloudflare Turnstile Container */}
            <div ref={turnstileRef} className="my-2 flex justify-center"></div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-extrabold py-3 px-4 rounded-xl shadow-lg shadow-red-500/10 hover:shadow-red-500/20 active:scale-[0.99] disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              {formLoading ? t('postingButton') : t('postRequestButton')}
            </button>
          </form>
        </div>

        {/* Right: Requests Board */}
        <div className="lg:col-span-8 space-y-6 text-left">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-slate-500" />
              {t('activeFeedTitle')}
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded-md border border-slate-200/30 dark:border-zinc-800/30">
                {emergencyRequests.length} {t('activeCount')}
              </span>
            </h3>
          </div>

          {loading ? (
            <div className="glass-panel border rounded-2xl overflow-hidden animate-pulse">
              <div className="h-12 bg-slate-100 dark:bg-zinc-900 w-full" />
              <div className="p-4 space-y-4">
                {[...Array(3)].map((_, idx) => (
                  <div key={idx} className="flex gap-4 items-center justify-between">
                    <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-12" />
                    <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/4" />
                    <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
                    <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded w-28" />
                  </div>
                ))}
              </div>
            </div>
          ) : emergencyRequests.length === 0 ? (
            <div className="glass-panel rounded-3xl p-10 text-center border space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">{t('allAddressedTitle')}</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                {t('allAddressedDesc')}
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP VIEW: Data Table */}
              <div className="hidden md:block glass-panel border border-slate-200/50 dark:border-zinc-800/50 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm border-collapse table-fixed">
                    <thead>
                      <tr className="border-b border-slate-200/50 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-900/30 text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
                        <th className="p-4 w-[12%]">{t('bloodNeededHeader')}</th>
                        <th className="p-4 w-[20%]">{t('hospitalAreaHeader')}</th>
                        <th className="p-4 w-[15%]">{t('contactPhoneHeader')}</th>
                        <th className="p-4 w-[25%]">{t('noteDetailsHeader')}</th>
                        <th className="p-4 w-[13%]">{t('postedDateHeader')}</th>
                        <th className="p-4 w-[15%] text-center">{t('actionsHeader')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-zinc-800/50 text-slate-700 dark:text-zinc-300 font-medium">
                      {paginatedRequests.map((req) => {
                        const createdDate = new Date(req.created_at);
                        const hours = calculateHoursSince(req.created_at);
                        const isRecent = hours < 12;

                        const cleanPhone = req.contact.trim();
                        const waPhone = cleanPhone.startsWith('0') ? '88' + cleanPhone : cleanPhone;
                        const waMessage = encodeURIComponent(
                          `Assalamu Alaikum, I saw your emergency request for ${req.blood_group} blood at ${req.area} on Beanibazar Blood Donation Platform. I want to help.`
                        );

                        return (
                          <tr 
                            key={req.id} 
                            className={`hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors ${
                              isRecent ? 'bg-red-500/5 dark:bg-red-500/5' : ''
                            }`}
                          >
                            <td className="p-4">
                              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-base shadow-sm relative ${
                                isRecent 
                                  ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white' 
                                  : 'bg-slate-700 text-white'
                              }`}>
                                {req.blood_group}
                                {isRecent && (
                                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-slate-900 dark:text-white truncate overflow-hidden" title={req.area}>{req.area}</td>
                            <td className="p-4 text-slate-600 dark:text-zinc-400 font-semibold truncate overflow-hidden">{req.contact}</td>
                            <td className="p-4 truncate overflow-hidden text-xs font-semibold text-slate-600 dark:text-zinc-300" title={req.note}>
                              {req.note || t('noDescription')}
                            </td>
                            <td className="p-4 text-xs text-slate-400 dark:text-zinc-500">
                              {hours < 1 
                                ? t('justNow') 
                                : hours < 24 
                                  ? t('hoursAgo', { hours: Math.floor(hours) }) 
                                  : createdDate.toLocaleDateString()
                              }
                            </td>
                            <td className="p-4">
                              <div className="flex gap-1.5 justify-center flex-wrap">
                                <a
                                  href={`tel:${req.contact}`}
                                  className="p-2 bg-red-500 hover:bg-red-650 text-white rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
                                  title="Call Now"
                                >
                                  <Phone className="w-4 h-4" />
                                </a>
                                <a
                                  href={`https://wa.me/${waPhone}?text=${waMessage}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 bg-emerald-500 hover:bg-emerald-650 text-white rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
                                  title="WhatsApp Chat"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </a>
                                <button
                                  onClick={() => openDeleteModal(req)}
                                  className="p-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                  title={t('deleteRequest')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
              </div>

              {/* MOBILE VIEW: Card Stack */}
              <div className="block md:hidden space-y-4">
                {paginatedRequests.map((req) => {
                  const createdDate = new Date(req.created_at);
                  const hours = calculateHoursSince(req.created_at);
                  const isRecent = hours < 12;

                  const cleanPhone = req.contact.trim();
                  const waPhone = cleanPhone.startsWith('0') ? '88' + cleanPhone : cleanPhone;
                  const waMessage = encodeURIComponent(
                    `Assalamu Alaikum, I saw your emergency request for ${req.blood_group} blood at ${req.area} on Beanibazar Blood Donation Platform. I want to help.`
                  );

                  return (
                    <div 
                      key={req.id}
                      className={`glass-panel border rounded-2xl p-5 space-y-4 shadow-sm hover:border-red-500/35 transition-all duration-300 relative overflow-hidden ${
                        isRecent ? 'border-red-500/20 shadow-md shadow-red-500/5' : 'border-slate-200/50 dark:border-zinc-800/50'
                      }`}
                    >
                      {isRecent && (
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
                      )}

                      <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-3 items-center">
                          <span className={`inline-flex items-center justify-center w-12 h-12 rounded-xl font-black text-xl shadow-md relative ${
                            isRecent ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white' : 'bg-slate-700 text-white'
                          }`}>
                            {req.blood_group}
                            {isRecent && (
                              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                              </span>
                            )}
                          </span>
                          <div>
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
                              {t('emergencyBloodNeeded', { bloodGroup: req.blood_group })}
                            </h4>
                            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-semibold flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-red-500/50" />
                              {req.area}
                            </span>
                          </div>
                        </div>
                        
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {hours < 1 
                            ? t('justNow') 
                            : hours < 24 
                              ? t('hoursAgo', { hours: Math.floor(hours) }) 
                              : createdDate.toLocaleDateString()
                          }
                        </span>
                      </div>

                      {req.note && (
                        <div className="bg-red-500/5 dark:bg-red-500/5 border border-red-500/10 dark:border-red-500/10 rounded-xl p-3 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-semibold">
                          {req.note}
                        </div>
                      )}

                      <div className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400/80" />
                        <span>
                          {t('contactNumberLabel')}
                          <strong className="text-slate-800 dark:text-zinc-200 font-semibold">{req.contact}</strong>
                        </span>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-zinc-900">
                        <a
                          href={`tel:${req.contact}`}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-650 text-white py-2 px-3 rounded-xl text-xs font-bold shadow-sm"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {t('call')}
                        </a>
                        <a
                          href={`https://wa.me/${waPhone}?text=${waMessage}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-650 text-white py-2 px-3 rounded-xl text-xs font-bold shadow-sm"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          {t('whatsapp')}
                        </a>
                        <button
                          onClick={() => openDeleteModal(req)}
                          className="p-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl shadow-sm transition-all cursor-pointer"
                          title={t('deleteRequest')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center pt-6 mt-4 border-t border-slate-200/50 dark:border-zinc-800/50 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t('previousPage')}
                  </button>
                  <span className="text-xs text-slate-500 dark:text-zinc-400 font-bold">
                    {t('pageIndicator', { current: currentPage, total: totalPages })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
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

      </div>
    </div>
  );
}
