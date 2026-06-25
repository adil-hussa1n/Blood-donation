import React, { useState, useEffect, useMemo } from 'react';
import { Flame, AlertTriangle, CheckCircle2, Phone, MapPin, ClipboardList, MessageCircle, Calendar, Trash2, Key, X, Clock, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp, AREAS, BLOOD_GROUPS, getAreaLabel } from '../context/AppContext';
import TimelineTrack from '../components/TimelineTrack';
import EmergencyForm from '../components/EmergencyForm';
import { EmergencyRequest } from '../types';

export default function Emergency() {
  const { emergencyRequests, deleteEmergencyRequest, updateEmergencyRequestStatus, loading, isAdmin, language, t } = useApp();

  const [currentPage, setCurrentPage] = useState(1);
  const [feedBloodFilter, setFeedBloodFilter] = useState('');
  const [feedAreaFilter, setFeedAreaFilter] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const calculateHoursSince = (dateString: string | null | undefined) => {
    if (!dateString) return 0;
    const diffMs = Date.now() - new Date(dateString).getTime();
    return diffMs / (1000 * 60 * 60);
  };

  const bloodGroupCounts = useMemo(() => {
    const counts = Object.fromEntries((BLOOD_GROUPS as string[]).map((group) => [group, 0]));
    (emergencyRequests as EmergencyRequest[]).forEach((req) => {
      if (counts[req.blood_group] !== undefined) {
        counts[req.blood_group] += 1;
      }
    });
    return counts;
  }, [emergencyRequests]);

  const filteredEmergencyRequests = useMemo(() => {
    return (emergencyRequests as EmergencyRequest[]).filter((req) => {
      const matchBlood = !feedBloodFilter || req.blood_group === feedBloodFilter;
      const matchArea = !feedAreaFilter || req.area === feedAreaFilter;
      return matchBlood && matchArea;
    });
  }, [emergencyRequests, feedBloodFilter, feedAreaFilter]);

  // Reset page when feed filters or request list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [feedBloodFilter, feedAreaFilter, emergencyRequests.length]);

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredEmergencyRequests.length / itemsPerPage));
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmergencyRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmergencyRequests, currentPage]);

  // Delete modal state
  const [deletingRequest, setDeletingRequest] = useState<EmergencyRequest | null>(null);
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Status modal state
  const [statusRequest, setStatusRequest] = useState<EmergencyRequest | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'needed' | 'responded' | 'fulfilled'>('needed');
  const [statusPasscode, setStatusPasscode] = useState('');
  const [showStatusPassword, setShowStatusPassword] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  const openStatusModal = (req: EmergencyRequest) => {
    setStatusRequest(req);
    setSelectedStatus(req.status || 'needed');
    setStatusPasscode('');
    setStatusError('');
    setShowStatusPassword(false);
  };

  const closeStatusModal = () => {
    setStatusRequest(null);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusRequest) return;
    setStatusError('');
    setStatusLoading(true);

    try {
      const res = await updateEmergencyRequestStatus(statusRequest.id, selectedStatus, statusPasscode);
      if (res.success) {
        closeStatusModal();
        setSuccessMsg(language === 'bn' ? 'স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে।' : 'Status updated successfully.');
      } else {
        setStatusError(res.error?.message || 'Failed to update status.');
      }
    } catch (err) {
      setStatusError(t('unexpectedError'));
    } finally {
      setStatusLoading(false);
    }
  };

  const openDeleteModal = (req: EmergencyRequest) => {
    setDeletingRequest(req);
    setEnteredPasscode('');
    setDeleteError('');
    setShowDeletePassword(false);
  };

  const closeDeleteModal = () => {
    setDeletingRequest(null);
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingRequest) return;
    setDeleteError('');

    setDeleteLoading(true);
    try {
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

      {/* Status Update Modal Overlay */}
      {statusRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm animate-fade-in animate-duration-200">
          <div className="glass-panel w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/50 dark:border-zinc-800/50 space-y-4 animate-scale-up relative">
            <button
              onClick={closeStatusModal}
              className="absolute right-4 top-4 p-1 rounded-xl text-slate-400 hover:text-slate-655 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/50 dark:border-zinc-800/50">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center animate-bounce">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {language === 'bn' ? 'অনুরোধের স্ট্যাটাস পরিবর্তন' : 'Update Request Status'}
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400 text-left">
              {language === 'bn' ? 'স্ট্যাটাস আপডেট করুন:' : 'Select the current progress status for your request:'}
            </p>

            {statusError && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 text-rose-800 dark:text-rose-400 p-3.5 rounded-xl text-xs flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{statusError}</span>
              </div>
            )}

            <form onSubmit={handleStatusSubmit} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  {language === 'bn' ? 'স্ট্যাটাস' : 'Status'}
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:text-white cursor-pointer"
                >
                  <option value="needed">{language === 'bn' ? 'জরুরী প্রয়োজন (Needed Urgent)' : 'Needed Urgent'}</option>
                  <option value="responded">{language === 'bn' ? 'সাড়া দিয়েছেন (Donors On Way)' : 'Donors On Way'}</option>
                  <option value="fulfilled">{language === 'bn' ? 'রক্তদান সম্পন্ন (Life Saved!)' : 'Life Saved!'}</option>
                </select>
              </div>

              {!isAdmin ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                    {t('enterDeletionPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showStatusPassword ? 'text' : 'password'}
                      required
                      placeholder={t('enterPasswordPlaceholder')}
                      value={statusPasscode}
                      onChange={(e) => setStatusPasscode(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:text-white"
                    />
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowStatusPassword(!showStatusPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-655 cursor-pointer"
                    >
                      {showStatusPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  onClick={closeStatusModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {t('cancelButton')}
                </button>
                <button
                  type="submit"
                  disabled={statusLoading}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  {statusLoading ? t('processingButton') : (language === 'bn' ? 'স্ট্যাটাস আপডেট করুন' : 'Update Status')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal Overlay */}
      {deletingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/50 dark:border-zinc-800/50 space-y-4 animate-scale-up relative">
            <button
              onClick={closeDeleteModal}
              className="absolute right-4 top-4 p-1 rounded-xl text-slate-400 hover:text-slate-655 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/50 dark:border-zinc-800/50">
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {t('deleteRequest')} ({deletingRequest.blood_group})
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400 text-left leading-relaxed">
              {language === 'bn'
                ? 'রক্তের অনুরোধটি মুছে ফেলার জন্য অনুরোধ পোস্ট করার সময় যে ৪ সংখ্যার বা তার বেশি পাসওয়ার্ড সেট করেছিলেন সেটি দিন।'
                : 'To delete this emergency request, please verify the deletion passcode you defined when creating it.'}
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
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-655 dark:hover:text-zinc-250 cursor-pointer"
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
          <EmergencyForm onSuccess={setSuccessMsg} onError={setErrorMsg} />
        </div>

        {/* Right: Requests Board */}
        <div className="lg:col-span-8 space-y-6 text-left">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
              <ClipboardList className="w-5 h-5 text-slate-500" />
              {t('activeFeedTitle')}
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded-md border border-slate-200/30 dark:border-zinc-800/30">
                {filteredEmergencyRequests.length} {t('activeCount')}
                {feedBloodFilter && (
                  <span className="text-red-500 dark:text-red-400"> · {feedBloodFilter}</span>
                )}
              </span>
            </h3>
          </div>
          {!loading && emergencyRequests.length > 0 && (
            <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-200/50 dark:border-zinc-800/50 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200/20 dark:border-zinc-800/30">
                <span className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                  {t('filterDonorsTitle')}
                </span>
                {(feedBloodFilter || feedAreaFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFeedBloodFilter('');
                      setFeedAreaFilter('');
                    }}
                    className="text-xs font-semibold text-red-500 hover:text-red-655 flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    {t('clearButton')}
                  </button>
                )}
              </div>

              {/* Blood Group selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  {t('filterEmergencyByBlood')}
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedBloodFilter('')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${!feedBloodFilter
                        ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/10'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-red-500 dark:hover:border-red-500/50 bg-slate-50/30 dark:bg-zinc-900/30 text-slate-700 dark:text-zinc-300'
                      }`}
                  >
                    {t('allBloodGroups')}
                    <span className="block text-[10px] font-semibold opacity-80 mt-0.5">
                      {emergencyRequests.length}
                    </span>
                  </button>
                  {(BLOOD_GROUPS as string[]).map((group: string) => {
                    const count = bloodGroupCounts[group] || 0;
                    const active = feedBloodFilter === group;
                    return (
                      <button
                        type="button"
                        key={group}
                        onClick={() => setFeedBloodFilter(active ? '' : group)}
                        disabled={count === 0}
                        className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${count === 0
                            ? 'border-slate-100 dark:border-zinc-900 text-slate-300 dark:text-zinc-600 cursor-not-allowed opacity-60'
                            : active
                              ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/10 cursor-pointer'
                              : 'border-slate-200 dark:border-zinc-800 hover:border-red-500 dark:hover:border-red-500/50 bg-slate-50/30 dark:bg-zinc-900/30 text-slate-700 dark:text-zinc-300 cursor-pointer'
                          }`}
                      >
                        {group}
                        <span className={`block text-[10px] font-semibold mt-0.5 ${active ? 'opacity-90' : 'opacity-70'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Area selection */}
              <div className="space-y-2 pt-2 border-t border-slate-200/20 dark:border-zinc-800/30">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  {t('filterEmergencyByArea')}
                </label>
                <div className="relative">
                  <select
                    value={feedAreaFilter}
                    onChange={(e) => setFeedAreaFilter(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all dark:text-white appearance-none cursor-pointer"
                  >
                    <option value="">{t('allAreas')}</option>
                    {(AREAS as string[]).map((a) => (
                      <option key={a} value={a}>
                        {getAreaLabel(a, t)}
                      </option>
                    ))}
                  </select>
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>
            </div>
          )}

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
          ) : filteredEmergencyRequests.length === 0 ? (
            <div className="glass-panel rounded-3xl p-10 text-center border space-y-4">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {language === 'en'
                  ? 'No active requests matching your filters.'
                  : 'আপনার ফিল্টারের সাথে মিলে যায় এমন কোনো সক্রিয় অনুরোধ পাওয়া যায়নি।'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                {t('noEmergencyForBloodGroupDesc')}
              </p>
              <button
                type="button"
                onClick={() => {
                  setFeedBloodFilter('');
                  setFeedAreaFilter('');
                }}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-red-500 hover:text-red-655 cursor-pointer"
              >
                <X className="w-4 h-4" />
                {t('resetFiltersButton')}
              </button>
            </div>
          ) : (
            <>
              {/* DESKTOP VIEW: Data Table */}
              <div className="hidden md:block glass-panel border border-slate-200/50 dark:border-zinc-800/50 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm border-collapse table-fixed">
                  <thead>
                    <tr className="border-b border-slate-200/50 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-900/30 text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
                      <th className="p-4 w-[10%]">{t('bloodNeededHeader')}</th>
                      <th className="p-4 w-[20%]">{t('hospitalAreaHeader')}</th>
                      <th className="p-4 w-[13%]">{t('contactPhoneHeader')}</th>
                      <th className="p-4 w-[32%]">{t('noteDetailsHeader')}</th>
                      <th className="p-4 w-[10%]">{t('postedDateHeader')}</th>
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
                        `Assalamu Alaikum, I saw your emergency request for ${req.blood_group} blood at ${req.area} on Bloodify247. I want to help.`
                      );

                      return (
                        <tr
                          key={req.id}
                          className={`hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors ${isRecent ? 'bg-red-500/5 dark:bg-red-500/5' : ''
                            }`}
                        >
                          <td className="p-4">
                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-base shadow-sm relative ${isRecent
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
                          <td className="p-4 font-bold text-slate-900 dark:text-white truncate overflow-hidden" title={getAreaLabel(req.area, t)}>{getAreaLabel(req.area, t)}</td>
                          <td className="p-4 text-slate-650 dark:text-zinc-400 font-semibold truncate overflow-hidden">{req.contact}</td>
                          <td className="p-4 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                            <div className="space-y-1.5">
                              <div className="truncate max-w-[280px]" title={req.note || t('noDescription')}>{req.note || t('noDescription')}</div>
                              <TimelineTrack status={req.status || 'needed'} language={language} />
                            </div>
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
                                onClick={() => openStatusModal(req)}
                                className="p-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/30 dark:hover:bg-amber-955/50 text-amber-600 dark:text-amber-400 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                title={language === 'bn' ? 'স্ট্যাটাস আপডেট করুন' : 'Update Status'}
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openDeleteModal(req)}
                                className="p-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-955/30 dark:hover:bg-rose-955/50 text-rose-600 dark:text-rose-400 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
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
                    `Assalamu Alaikum, I saw your emergency request for ${req.blood_group} blood at ${req.area} on Bloodify247. I want to help.`
                  );

                  return (
                    <div
                      key={req.id}
                      className={`glass-panel border rounded-2xl p-5 space-y-4 shadow-sm hover:border-red-500/35 transition-all duration-300 relative overflow-hidden ${isRecent ? 'border-red-500/20 shadow-md shadow-red-500/5' : 'border-slate-200/50 dark:border-zinc-800/50'
                        }`}
                    >
                      {isRecent && (
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
                      )}

                      <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-3 items-center">
                          <span className={`inline-flex items-center justify-center w-12 h-12 rounded-xl font-black text-xl shadow-md relative ${isRecent ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white' : 'bg-slate-700 text-white'
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
                            <div className="mt-2">
                              <TimelineTrack status={req.status || 'needed'} language={language} />
                            </div>
                            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-semibold flex items-center gap-1 mt-1.5">
                              <MapPin className="w-3.5 h-3.5 text-red-500/50" />
                              {getAreaLabel(req.area, t)}
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
                          {t('contactNumberLabel')}{' '}
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
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-655 text-white py-2 px-3 rounded-xl text-xs font-bold shadow-sm"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          {t('whatsapp')}
                        </a>
                        <button
                          onClick={() => openStatusModal(req)}
                          className="p-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/30 dark:hover:bg-amber-955/50 text-amber-600 dark:text-amber-400 rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          title={language === 'bn' ? 'স্ট্যাটাস আপডেট করুন' : 'Update Status'}
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(req)}
                          className="p-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-955/30 dark:hover:bg-rose-955/50 text-rose-650 dark:text-rose-450 rounded-xl shadow-sm transition-all cursor-pointer"
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
