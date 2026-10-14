import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Flame, AlertTriangle, CheckCircle2, Phone, MapPin, ClipboardList, MessageCircle, Calendar, Trash2, Key, X, Clock, Eye, EyeOff, ChevronLeft, ChevronRight, ShieldCheck, Sparkles, Check, LayoutGrid, LayoutList, Navigation } from 'lucide-react';
import { useApp, AREAS, DISTRICT_AREAS, getDistrictForArea, getDistrictBadge, BLOOD_GROUPS, getAreaLabel } from '../context/AppContext';
import TimelineTrack from '../components/TimelineTrack';
import EmergencyForm from '../components/EmergencyForm';
import { EmergencyRequest } from '../types';

export default function Emergency() {
  const { emergencyRequests, deleteEmergencyRequest, updateEmergencyRequestStatus, loading, isAdmin, currentDonor, language, t } = useApp();

  const [currentPage, setCurrentPage] = useState(1);
  const [feedBloodFilter, setFeedBloodFilter] = useState('');
  const [feedAreaFilter, setFeedAreaFilter] = useState(currentDonor?.area || '');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('bloodify_emergency_view') as 'table' | 'grid') || 'table';
    }
    return 'table';
  });

  const handleViewModeChange = (mode: 'table' | 'grid') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bloodify_emergency_view', mode);
    }
  };

  // Auto-detect registered user address for area filter
  useEffect(() => {
    if (currentDonor?.area && !feedAreaFilter) {
      setFeedAreaFilter(currentDonor.area);
    }
  }, [currentDonor?.area]);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-dismiss notifications
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => {
        setErrorMsg('');
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const calculateHoursSince = (dateString: string | null | undefined) => {
    if (!dateString) return 0;
    const diffMs = Date.now() - new Date(dateString).getTime();
    return diffMs / (1000 * 60 * 60);
  };

  const calculateRemainingHours = (dateString: string | null | undefined) => {
    if (!dateString) return 0;
    const createdTime = new Date(dateString).getTime();
    const expiryTime = createdTime + 24 * 60 * 60 * 1000;
    const remainingMs = expiryTime - Date.now();
    return Math.max(0, remainingMs / (1000 * 60 * 60));
  };

  const isMyRequest = (req: EmergencyRequest | null | undefined) => {
    if (!req || !currentDonor) return false;
    if (req.donor_id && String(req.donor_id) === String(currentDonor.id)) return true;
    if (req.contact && currentDonor.phone && req.contact.trim() === currentDonor.phone.trim()) return true;
    return false;
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

  const userLocationArea = currentDonor?.area || '';
  const userDistrictId = useMemo(() => {
    return userLocationArea ? getDistrictForArea(userLocationArea).id : null;
  }, [userLocationArea]);

  const filteredEmergencyRequests = useMemo(() => {
    const list = (emergencyRequests as EmergencyRequest[]).filter((req) => {
      const matchBlood = !feedBloodFilter || req.blood_group === feedBloodFilter;
      const matchArea = !feedAreaFilter || req.area === feedAreaFilter;
      return matchBlood && matchArea;
    });

    // If user has not picked a specific area filter, prioritize requests by user location proximity
    return [...list].sort((a, b) => {
      if (!feedAreaFilter && userLocationArea) {
        const aExact = a.area && a.area.toLowerCase() === userLocationArea.toLowerCase() ? 2 : 0;
        const bExact = b.area && b.area.toLowerCase() === userLocationArea.toLowerCase() ? 2 : 0;
        
        const aDistrict = userDistrictId && getDistrictForArea(a.area).id === userDistrictId ? 1 : 0;
        const bDistrict = userDistrictId && getDistrictForArea(b.area).id === userDistrictId ? 1 : 0;

        const aScore = Math.max(aExact, aDistrict);
        const bScore = Math.max(bExact, bDistrict);

        if (aScore !== bScore) {
          return bScore - aScore;
        }
      }

      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [emergencyRequests, feedBloodFilter, feedAreaFilter, userLocationArea, userDistrictId]);

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

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (statusRequest || deletingRequest) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [statusRequest, deletingRequest]);

  const openStatusModal = (req: EmergencyRequest) => {
    if (!isMyRequest(req) && !isAdmin) {
      setErrorMsg(language === 'bn' 
        ? 'শুধুমাত্র যে নিবন্ধিত ব্যবহারকারী এই জরুরি অনুরোধটি পোস্ট করেছেন তিনিই স্ট্যাটাস আপডেট করতে পারেন।' 
        : 'Only the verified user who posted this emergency request can update it.');
      return;
    }
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
      const isAuthor = isMyRequest(statusRequest);
      const res = await updateEmergencyRequestStatus(
        statusRequest.id,
        selectedStatus,
        undefined,
        isAuthor ? { donorId: currentDonor?.id, donorPhone: currentDonor?.phone } : undefined
      );
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
    if (!isMyRequest(req) && !isAdmin) {
      setErrorMsg(language === 'bn' 
        ? 'শুধুমাত্র যে নিবন্ধিত ব্যবহারকারী এই জরুরি অনুরোধটি পোস্ট করেছেন তিনিই এটি মুছে ফেলতে পারেন।' 
        : 'Only the verified user who posted this emergency request can delete it.');
      return;
    }
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
      const isAuthor = isMyRequest(deletingRequest);
      const res = await deleteEmergencyRequest(
        deletingRequest.id,
        undefined,
        isAuthor ? { donorId: currentDonor?.id, donorPhone: currentDonor?.phone } : undefined
      );
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
      {statusRequest && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg rounded-2xl border border-slate-200 dark:border-zinc-800 transition-all duration-200 animate-scale-up relative shadow-2xl overflow-hidden p-5 sm:p-6 space-y-4">
            
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 text-left">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm transition-colors duration-200 ${
                  selectedStatus === 'needed'
                    ? 'bg-rose-600'
                    : selectedStatus === 'responded'
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                }`}>
                  {selectedStatus === 'needed' ? (
                    <Flame className="w-5 h-5 fill-current" />
                  ) : selectedStatus === 'responded' ? (
                    <Clock className="w-5 h-5" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">
                    {language === 'bn' ? 'অনুরোধের স্ট্যাটাস পরিবর্তন' : 'Update Request Status'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    {language === 'bn' ? 'বর্তমান অগ্রগতির স্ট্যাটাস নির্বাচন করুন:' : 'Select the current progress status for your request:'}
                  </p>
                </div>
              </div>

              <button
                onClick={closeStatusModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Request Summary Strip */}
            <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-3 border border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-center shrink-0">
                  <span className="text-rose-600 dark:text-rose-400 font-extrabold text-xs">
                    {statusRequest.blood_group}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{getAreaLabel(statusRequest.area, t)}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate mt-0.5">
                    {statusRequest.note || (language === 'bn' ? 'জরুরি রক্তের চাহিদা' : 'Urgent blood request')} • {statusRequest.contact}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-zinc-700/80">
                  <Clock className="w-3 h-3 text-amber-500" />
                  {calculateHoursSince(statusRequest.created_at) < 1 
                    ? (language === 'bn' ? 'এইমাত্র' : 'Just now')
                    : `${Math.round(calculateHoursSince(statusRequest.created_at))}h ${language === 'bn' ? 'আগে' : 'ago'}`}
                </span>
              </div>
            </div>

            {statusError && (
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-rose-800 dark:text-rose-400 p-3 rounded-xl text-xs flex items-center gap-2 font-medium text-left">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{statusError}</span>
              </div>
            )}

            <form onSubmit={handleStatusSubmit} className="space-y-4 text-left">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                  {language === 'bn' ? 'স্ট্যাটাস নির্বাচন' : 'Status'}
                </label>
                
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    {
                      value: 'needed',
                      label: language === 'bn' ? 'জরুরী প্রয়োজন (Needed Urgent)' : 'Needed Urgent',
                      desc: language === 'bn' ? 'রক্তের জন্য জরুরী সন্ধান করা হচ্ছে — ডোনারদের নোটিফিকেশন সচল' : 'Active search for blood donors — alerts live across network',
                      icon: Flame,
                      activeCard: 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-500 dark:border-rose-500',
                      activeIcon: 'bg-rose-600 text-white',
                      radioActive: 'bg-rose-600 border-rose-600 text-white'
                    },
                    {
                      value: 'responded',
                      label: language === 'bn' ? 'সাড়া দিয়েছেন (Donors On Way)' : 'Donors On Way',
                      desc: language === 'bn' ? 'রক্তদাতা রক্ত দেওয়ার জন্য হাসপাতালের উদ্দেশ্যে রওনা হয়েছেন' : 'Donor is confirmed and currently traveling to the hospital',
                      icon: Clock,
                      activeCard: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-500 dark:border-amber-500',
                      activeIcon: 'bg-amber-500 text-white',
                      radioActive: 'bg-amber-500 border-amber-500 text-white'
                    },
                    {
                      value: 'fulfilled',
                      label: language === 'bn' ? 'রক্তদান সম্পন্ন (Life Saved!)' : 'Life Saved!',
                      desc: language === 'bn' ? 'সফলভাবে রক্তদান সম্পন্ন হয়েছে এবং রোগীর জীবন রক্ষা পেয়েছে' : 'Blood donation is completed successfully — life saved!',
                      icon: Sparkles,
                      activeCard: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 dark:border-emerald-500',
                      activeIcon: 'bg-emerald-600 text-white',
                      radioActive: 'bg-emerald-600 border-emerald-600 text-white'
                    }
                  ].map((status) => {
                    const isSelected = selectedStatus === status.value;
                    const Icon = status.icon;
                    return (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() => setSelectedStatus(status.value as any)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? `${status.activeCard} border-2 shadow-xs`
                            : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:bg-slate-50/60 dark:hover:bg-zinc-800/50 hover:border-slate-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? status.activeIcon : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-zinc-300'}`}>
                              {status.label}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-normal mt-0.5 leading-snug">
                              {status.desc}
                            </div>
                          </div>
                        </div>
                        
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          isSelected 
                            ? `${status.radioActive} border-transparent` 
                            : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Verified Author Row */}
              <div className="rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 px-3.5 py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate block">
                      {isAdmin 
                        ? (language === 'bn' ? 'অ্যাডমিন অ্যাক্সেস' : 'Admin Authorized')
                        : (language === 'bn' 
                          ? `যাচাইকৃত লেখক: ${currentDonor?.name || 'লগইন সদস্য'}` 
                          : `Verified Author: ${currentDonor?.name || 'Logged-in user'}`)}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-zinc-500 shrink-0">
                  {language === 'bn' ? 'তাৎক্ষণিক আপডেট' : 'Real-time sync'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-2 justify-end border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={closeStatusModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  {t('cancelButton')}
                </button>
                <button
                  type="submit"
                  disabled={statusLoading}
                  className={`px-5 py-2 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                    selectedStatus === 'needed'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                      : selectedStatus === 'responded'
                        ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  }`}
                >
                  {statusLoading ? (
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                  ) : selectedStatus === 'needed' ? (
                    <Flame className="w-3.5 h-3.5" />
                  ) : selectedStatus === 'responded' ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {statusLoading 
                      ? t('processingButton') 
                      : (language === 'bn' ? 'স্ট্যাটাস আপডেট করুন' : 'Update Status')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Modal Overlay */}
      {deletingRequest && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-zinc-800 space-y-4 animate-scale-up relative shadow-2xl">
            <button
              onClick={closeDeleteModal}
              className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all duration-200 cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">
                  {t('deleteRequest')} ({deletingRequest.blood_group})
                </h3>
                <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                  {language === 'bn' ? 'জরুরি রক্তের অনুরোধ মুছে ফেলুন' : 'Remove your emergency blood request'}
                </p>
              </div>
            </div>

            <div className="bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/40 p-3.5 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-xs text-rose-800 dark:text-rose-300 font-bold leading-normal">
                  {t('confirmDeleteMyRequest')}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  {isAdmin
                    ? t('adminAuthSuccessText')
                    : (language === 'bn'
                      ? `আপনি ${currentDonor?.name || 'যাচাইকৃত লেখক'} হিসেবে লগইন আছেন। এই জরুরি রক্তের অনুরোধটি মুছে ফেলতে নিশ্চিত করুন।`
                      : `Signed in as verified creator ${currentDonor?.name || ''}. Confirm to delete this urgent request.`)}
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-rose-800 dark:text-rose-400 p-3.5 rounded-2xl text-xs flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <form onSubmit={handleDeleteSubmit} className="space-y-4 text-left">
              <div className="flex items-center gap-3 pt-3 justify-end border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-extrabold transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                  {t('cancelButton')}
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  {deleteLoading ? t('processingButton') : t('deleteRequest')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
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
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-950/50 text-emerald-800 dark:text-emerald-400 p-4 rounded-2xl text-sm flex items-center justify-between gap-3 animate-fade-in max-w-7xl mx-auto shadow-sm">
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
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-950/50 text-rose-800 dark:text-rose-400 p-4 rounded-2xl text-sm flex items-center justify-between gap-3 animate-fade-in max-w-7xl mx-auto shadow-sm">
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
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                    {t('filterEmergencyByArea')}
                  </label>
                  {currentDonor?.area && feedAreaFilter === currentDonor.area && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-fade-in">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      {language === 'bn' ? 'স্বয়ংক্রিয় সনাক্তকৃত' : 'Auto-detected'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <select
                    value={feedAreaFilter}
                    onChange={(e) => setFeedAreaFilter(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all dark:text-white appearance-none cursor-pointer"
                  >
                    <option value="">{t('allAreas')}</option>
                    {DISTRICT_AREAS.map((district) => (
                      <optgroup
                        key={district.id}
                        label={`📍 ${language === 'bn' ? district.nameBn : district.name}`}
                        className={district.color.optGroupClass}
                      >
                        {district.upazilas.map((a) => (
                          <option key={a} value={a} className="text-slate-800 dark:text-zinc-200 font-normal">
                            {getAreaLabel(a, t)} {currentDonor?.area === a ? (language === 'bn' ? '⭐ (আপনার এলাকা)' : '⭐ (Your Area)') : ''}
                          </option>
                        ))}
                      </optgroup>
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
            <div className="space-y-4">
              {/* Results Count & View Mode Switcher Header */}
              <div className="flex flex-wrap justify-between items-center gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">
                    {language === 'bn' ? 'জরুরি রক্তের অনুরোধসমূহ' : 'Emergency Blood Requests'}
                  </h3>
                  <span className="text-xs font-bold text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full border border-slate-200/60 dark:border-zinc-700/60">
                    {filteredEmergencyRequests.length}
                  </span>
                </div>

                {/* Table / Grid Switcher */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'table'
                        ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                    title={language === 'bn' ? 'টেবিল ভিউ' : 'Data Table View'}
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'টেবিল' : 'Table'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('grid')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                    title={language === 'bn' ? 'গ্রিড ভিউ' : 'Card Grid View'}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'গ্রিড' : 'Grid'}</span>
                  </button>
                </div>
              </div>

              {/* TABLE VIEW */}
              {viewMode === 'table' ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm animate-fade-in">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse min-w-[780px]">
                      <thead>
                        <tr className="border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
                          <th className="py-3.5 px-4 w-[13%]">{t('bloodNeededHeader')}</th>
                          <th className="py-3.5 px-4 w-[22%]">{t('hospitalAreaHeader')}</th>
                          <th className="py-3.5 px-4 w-[16%]">{t('contactPhoneHeader')}</th>
                          <th className="py-3.5 px-4 w-[24%]">{t('noteDetailsHeader')}</th>
                          <th className="py-3.5 px-4 w-[11%]">{t('postedDateHeader')}</th>
                          <th className="py-3.5 px-4 w-[14%] text-right">{t('actionsHeader')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-slate-700 dark:text-zinc-300 font-medium">
                        {paginatedRequests.map((req) => {
                          const createdDate = new Date(req.created_at);
                          const hours = calculateHoursSince(req.created_at);
                          const isRecent = hours < 12;
                          const remainingHours = calculateRemainingHours(req.created_at);
                          const isMine = isMyRequest(req);

                          const cleanPhone = req.contact.trim();
                          const waPhone = cleanPhone.startsWith('0') ? '88' + cleanPhone : cleanPhone;
                          const waMessage = encodeURIComponent(
                            `Assalamu Alaikum, I saw your emergency request for ${req.blood_group} blood at ${req.area} on Bloodify247. I want to help.`
                          );

                          return (
                            <tr
                              key={req.id}
                              className={`transition-colors duration-150 ${
                                isMine
                                  ? 'bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/70 dark:hover:bg-rose-950/30'
                                  : isRecent
                                    ? 'bg-slate-50/40 dark:bg-zinc-900/30 hover:bg-slate-50/80 dark:hover:bg-zinc-800/40'
                                    : 'hover:bg-slate-50/60 dark:hover:bg-zinc-800/30'
                              }`}
                            >
                              {/* Blood Needed */}
                              <td className="py-4 px-4 align-middle">
                                <div className="flex items-center gap-2.5">
                                  <span className={`inline-flex items-center justify-center w-11 h-11 rounded-xl font-black text-base shadow-xs shrink-0 relative ${
                                    isRecent
                                      ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-rose-500/20'
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
                                  {isMine && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 whitespace-nowrap">
                                      {language === 'bn' ? 'আপনার' : 'You'}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Hospital / Area */}
                              <td className="py-4 px-4 align-middle">
                                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${getDistrictBadge(req.area, language).color.bg} ${getDistrictBadge(req.area, language).color.text} ${getDistrictBadge(req.area, language).color.border}`}>
                                    {getDistrictBadge(req.area, language).label}
                                  </span>
                                  <span className="leading-snug">{getAreaLabel(req.area, t)}</span>
                                </div>
                              </td>

                              {/* Contact Phone */}
                              <td className="py-4 px-4 align-middle">
                                <span className="inline-block font-mono text-xs font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-zinc-700/60 whitespace-nowrap">
                                  {req.contact}
                                </span>
                              </td>

                              {/* Note / Details */}
                              <td className="py-4 px-4 align-middle">
                                <div className="space-y-1.5 max-w-sm">
                                  <p className="text-xs font-medium text-slate-600 dark:text-zinc-300 line-clamp-2 leading-relaxed" title={req.note || t('noDescription')}>
                                    {req.note || t('noDescription')}
                                  </p>
                                  <TimelineTrack status={req.status || 'needed'} language={language} />
                                </div>
                              </td>

                              {/* Posted Date */}
                              <td className="py-4 px-4 align-middle whitespace-nowrap">
                                <div className="space-y-1">
                                  <div className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                                    {hours < 1
                                      ? t('justNow')
                                      : hours < 24
                                        ? t('hoursAgo', { hours: Math.floor(hours) })
                                        : createdDate.toLocaleDateString()
                                    }
                                  </div>
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                    <Clock className="w-2.5 h-2.5" />
                                    {remainingHours > 1 
                                      ? t('expiresInHours', { hours: Math.ceil(remainingHours) })
                                      : t('expiresInMinutes', { minutes: Math.max(1, Math.round(remainingHours * 60)) })
                                    }
                                  </span>
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="py-4 px-4 align-middle text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5 justify-end">
                                  <a
                                    href={`tel:${req.contact}`}
                                    className="w-8 h-8 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-xs transition-transform hover:scale-105 active:scale-95"
                                    title="Call Now"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                  <a
                                    href={`https://wa.me/${waPhone}?text=${waMessage}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-xs transition-transform hover:scale-105 active:scale-95"
                                    title="WhatsApp Chat"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </a>
                                  {(isMine || isAdmin) && (
                                    <>
                                      <button
                                        onClick={() => openStatusModal(req)}
                                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-xs ${
                                          req.status === 'responded'
                                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                            : req.status === 'fulfilled'
                                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700'
                                        }`}
                                        title={language === 'bn' ? 'স্ট্যাটাস পরিবর্তন করুন' : 'Update Status'}
                                      >
                                        <Clock className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => openDeleteModal(req)}
                                        className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer border border-rose-200/60 dark:border-rose-900/40"
                                        title={isMine ? t('deleteMyRequest') : t('deleteRequest')}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* GRID VIEW */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 animate-fade-in">
                  {paginatedRequests.map((req) => {
                    const createdDate = new Date(req.created_at);
                    const hours = calculateHoursSince(req.created_at);
                    const isRecent = hours < 12;
                    const remainingHours = calculateRemainingHours(req.created_at);
                    const isMine = isMyRequest(req);

                    const cleanPhone = req.contact.trim();
                    const waPhone = cleanPhone.startsWith('0') ? '88' + cleanPhone : cleanPhone;
                    const waMessage = encodeURIComponent(
                      `Assalamu Alaikum, I saw your emergency request for ${req.blood_group} blood at ${req.area} on Bloodify247. I want to help.`
                    );

                    return (
                      <div
                        key={req.id}
                        className={`bg-white dark:bg-zinc-900 border rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-xl hover:border-red-500/30 transition-all duration-300 relative group overflow-hidden ${
                          isMine
                            ? 'border-rose-300/80 dark:border-rose-900/60 shadow-xs hover:border-rose-400'
                            : isRecent
                              ? 'border-red-500/30'
                              : 'border-slate-200/80 dark:border-zinc-800'
                        }`}
                      >
                        {/* Top Accent Strip */}
                        {isMine && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-red-500 to-rose-600" />
                        )}

                        <div className="space-y-3">
                          {/* Card Header: Blood Group, Area, and Post Status */}
                          <div className="flex items-start justify-between gap-3 pt-0.5">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl font-black text-xl shadow-md shrink-0 relative ${
                                isRecent
                                  ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-rose-500/25'
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

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border shrink-0 ${getDistrictBadge(req.area, language).color.bg} ${getDistrictBadge(req.area, language).color.text} ${getDistrictBadge(req.area, language).color.border}`}>
                                    {getDistrictBadge(req.area, language).label}
                                  </span>
                                  <span className="truncate">{getAreaLabel(req.area, t)}</span>
                                </div>
                                <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>
                                    {hours < 1
                                      ? t('justNow')
                                      : hours < 24
                                        ? t('hoursAgo', { hours: Math.floor(hours) })
                                        : createdDate.toLocaleDateString()
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>

                            {isMine && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0 whitespace-nowrap">
                                {language === 'bn' ? 'আপনার পোস্ট' : 'Your Post'}
                              </span>
                            )}
                          </div>

                          {/* Countdown Expiry Badge */}
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[11px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>
                                {remainingHours > 1 
                                  ? t('expiresInHours', { hours: Math.ceil(remainingHours) })
                                  : t('expiresInMinutes', { minutes: Math.max(1, Math.round(remainingHours * 60)) })
                                }
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Note / Details & Timeline */}
                        <div className="space-y-2.5 bg-slate-50/80 dark:bg-zinc-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800/80">
                          <p className="text-xs text-slate-700 dark:text-zinc-300 font-medium line-clamp-2 leading-relaxed">
                            {req.note || t('noDescription')}
                          </p>
                          <TimelineTrack status={req.status || 'needed'} language={language} />
                        </div>

                        {/* Card Footer: Phone + Action Buttons */}
                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                          <span className="font-mono text-xs font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 shrink-0">
                            {req.contact}
                          </span>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <a
                              href={`tel:${req.contact}`}
                              className="w-8 h-8 rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-xs transition-transform hover:scale-105 active:scale-95"
                              title="Call Now"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`https://wa.me/${waPhone}?text=${waMessage}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-xs transition-transform hover:scale-105 active:scale-95"
                              title="WhatsApp Chat"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                            {(isMine || isAdmin) && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openStatusModal(req)}
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-xs ${
                                    req.status === 'responded'
                                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                      : req.status === 'fulfilled'
                                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700'
                                  }`}
                                  title={language === 'bn' ? 'স্ট্যাটাস পরিবর্তন করুন' : 'Update Status'}
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDeleteModal(req)}
                                  className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer border border-rose-200/60 dark:border-rose-900/40"
                                  title={isMine ? t('deleteMyRequest') : t('deleteRequest')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
