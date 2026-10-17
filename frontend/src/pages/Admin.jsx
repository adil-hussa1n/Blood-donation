import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Shield, AlertTriangle, Trash2, Heart, Flame, LogOut, CheckCircle, MapPin, ChevronLeft, ChevronRight, Ban, MessageSquare, Search, Calendar, Filter, X, UserX, FileX, Clock, Phone, AlertCircle, CreditCard, Tag, Plus, Edit3, Edit2, Edit, Save, Activity, History, UserCheck, RefreshCw, LayoutList, LayoutGrid } from 'lucide-react';
import { useApp, BLOOD_GROUPS, DISTRICT_AREAS, normalizeDonor, getAreaLabel, getDistrictBadge, isDefaultLetterAvatar } from '../context/AppContext';

export default function Admin() {
  const {
    donors,
    emergencyRequests,
    isAdmin,
    isMaintenanceMode,
    loginAdminWithGoogle,
    logoutAdmin,
    deleteDonor,
    deleteEmergencyRequest,
    updateDonorByAdmin,
    updateEmergencyByAdmin,
    getUserActivityLogs,
    blockDonorByPhone,
    unblockDonorByPhone,
    getBlockedPhones,
    getSupportRequests,
    getDeletedDonors,
    getDeletedEmergencies,
    getDonorCardConfig,
    updateDonorCardConfig,
    getDonorCardOffers,
    createDonorCardOffer,
    updateDonorCardOffer,
    deleteDonorCardOffer,
    showToast,
    language,
    t
  } = useApp();

  // Dashboard view state: 'donors' | 'emergencies' | 'blocked' | 'support' | 'deleted_donors' | 'deleted_emergencies' | 'donor_card'
  const [adminTab, setAdminTab] = useState('donors');

  // Blood group filter in Donors view
  const [bloodGroupFilter, setBloodGroupFilter] = useState(''); // '' means All

  // Advanced Filters: Search, Area, and Date
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminAreaFilter, setAdminAreaFilter] = useState('');
  const [adminDateFrom, setAdminDateFrom] = useState('');
  const [adminDateTo, setAdminDateTo] = useState('');

  const [cardConfigForm, setCardConfigForm] = useState({
    card_title: 'Official Voluntary Blood Donor Card',
    card_subtitle: 'Sylhet Emergency Blood Network • Darun Donors',
    front_notes: '',
    back_terms: '',
    emergency_hotline: '+880 1700-000000',
    authorized_signatory_title: 'Medical & Registry Director',
    badge_accent_color: '#dc2626',
    card_theme: 'crimson_dark',
    badge_text: 'Life Saver',
    issue_org: '',
    website_url: 'donors.daruntech.com',
    valid_years: 3,
    show_qr: 1,
    front_tag_label: 'REGISTERED LIFE SAVER',
    qr_label: 'SCAN TO VERIFY',
    back_guidelines_title: 'Guidelines & Partner Benefits',
    security_strip_text: 'DARUN DONORS DIGITAL SECURITY STRIP • VERIFIED VOLUNTARY REGISTRY',
    blood_group_label: 'GROUP',
    district_label: 'District / Area',
    donations_label: 'Total Donations',
    valid_thru_label: 'Valid Thru',
    verified_status_text: 'Verified Voluntary Donor',
    footer_sponsor_text: 'Partner discounts valid at recognized diagnostic centers and clinics.'
  });
  const [cardConfigSaving, setCardConfigSaving] = useState(false);
  const [cardOffersList, setCardOffersList] = useState([]);
  const [cardOffersLoading, setCardOffersLoading] = useState(false);
  const [showAddOfferModal, setShowAddOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [offerForm, setOfferForm] = useState({
    sponsor_name: '',
    sponsor_logo: '',
    title: '',
    discount_text: '',
    description: '',
    promo_code: '',
    valid_until: '',
    category: 'healthcare',
    is_active: true
  });

  const fetchCardData = async () => {
    setCardOffersLoading(true);
    try {
      const [cfgRes, offersRes] = await Promise.all([
        getDonorCardConfig(),
        getDonorCardOffers()
      ]);
      if (cfgRes?.data) setCardConfigForm(cfgRes.data);
      if (offersRes?.data) setCardOffersList(offersRes.data);
    } catch (err) {
      console.warn("Failed to load donor card admin data:", err);
    }
    setCardOffersLoading(false);
  };

  useEffect(() => {
    if (isAdmin && adminTab === 'donor_card') {
      fetchCardData();
    }
  }, [isAdmin, adminTab]);

  // Blocked phone states
  const [blockedPhones, setBlockedPhones] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [blockedError, setBlockedError] = useState(null);
  const [phoneToBlock, setPhoneToBlock] = useState('');
  const [blockReason, setBlockReason] = useState('');

  // Inline Confirmation Banner States
  const [confirmUnblockPhone, setConfirmUnblockPhone] = useState(null);
  const [confirmBlockData, setConfirmBlockData] = useState(null);

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

  // Deleted Donors State & Fetch
  const [deletedDonors, setDeletedDonors] = useState([]);
  const [deletedDonorsLoading, setDeletedDonorsLoading] = useState(false);
  const [deletedDonorsError, setDeletedDonorsError] = useState(null);

  const fetchDeletedDonors = async () => {
    setDeletedDonorsLoading(true);
    setDeletedDonorsError(null);
    const res = await getDeletedDonors();
    if (res.success) {
      setDeletedDonors(res.data || []);
    } else {
      setDeletedDonorsError(res.error?.message || "Failed to fetch deleted donors archive.");
    }
    setDeletedDonorsLoading(false);
  };

  // Deleted Emergencies State & Fetch
  const [deletedEmergencies, setDeletedEmergencies] = useState([]);
  const [deletedEmergenciesLoading, setDeletedEmergenciesLoading] = useState(false);
  const [deletedEmergenciesError, setDeletedEmergenciesError] = useState(null);

  const fetchDeletedEmergencies = async () => {
    setDeletedEmergenciesLoading(true);
    setDeletedEmergenciesError(null);
    const res = await getDeletedEmergencies();
    if (res.success) {
      setDeletedEmergencies(res.data || []);
    } else {
      setDeletedEmergenciesError(res.error?.message || "Failed to fetch deleted emergency requests.");
    }
    setDeletedEmergenciesLoading(false);
  };

  // Activity Logs state & fetch
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLogsLoading, setActivityLogsLoading] = useState(false);
  const [activityLogsError, setActivityLogsError] = useState(null);
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('');

  const fetchActivityLogs = async (filters = {}) => {
    setActivityLogsLoading(true);
    setActivityLogsError(null);
    const res = await getUserActivityLogs({
      userId: filters.userId,
      phone: filters.phone,
      limit: 100
    });
    if (res.success) {
      setActivityLogs(res.data || []);
    } else {
      setActivityLogsError(res.error?.message || 'Failed to fetch user activity logs.');
    }
    setActivityLogsLoading(false);
  };

  // Edit Donor Modal State
  const [editingDonor, setEditingDonor] = useState(null);
  const [editDonorForm, setEditDonorForm] = useState({
    name: '',
    phone: '',
    blood_group: 'A+',
    area: '',
    last_donation_date: '',
    total_donations: 0,
    is_available: true,
    email: '',
    dob: ''
  });
  const [saveDonorLoading, setSaveDonorLoading] = useState(false);

  const openEditDonorModal = (donor) => {
    setEditingDonor(donor);
    setEditDonorForm({
      name: donor.name || '',
      phone: donor.phone || '',
      blood_group: donor.blood_group || 'A+',
      area: donor.area || '',
      last_donation_date: donor.last_donation_date ? donor.last_donation_date.substring(0, 10) : '',
      total_donations: donor.total_donations ?? 0,
      is_available: donor.is_available !== false,
      email: donor.email || '',
      dob: donor.dob ? donor.dob.substring(0, 10) : ''
    });
  };

  const handleSaveDonorDetails = async (e) => {
    e.preventDefault();
    if (!editingDonor) return;
    if (!editDonorForm.name.trim() || !editDonorForm.phone.trim()) {
      showToast('Name and phone number are required', 'warning');
      return;
    }
    setSaveDonorLoading(true);
    const res = await updateDonorByAdmin(editingDonor.id, {
      ...editDonorForm,
      total_donations: Number(editDonorForm.total_donations) || 0
    });
    if (res.success) {
      showToast('Donor details updated successfully!', 'success');
      setEditingDonor(null);
      if (adminTab === 'activity_logs') {
        fetchActivityLogs();
      }
    } else {
      showToast(res.error?.message || 'Failed to update donor details', 'error');
    }
    setSaveDonorLoading(false);
  };

  // Edit Emergency Modal State
  const [editingEmergency, setEditingEmergency] = useState(null);
  const [editEmergencyForm, setEditEmergencyForm] = useState({
    blood_group: 'A+',
    area: '',
    contact: '',
    note: '',
    status: 'needed'
  });
  const [saveEmergencyLoading, setSaveEmergencyLoading] = useState(false);

  const openEditEmergencyModal = (emergency) => {
    setEditingEmergency(emergency);
    setEditEmergencyForm({
      blood_group: emergency.blood_group || 'A+',
      area: emergency.area || '',
      contact: emergency.contact || '',
      note: emergency.note || '',
      status: emergency.status || 'needed'
    });
  };

  const handleSaveEmergencyDetails = async (e) => {
    e.preventDefault();
    if (!editingEmergency) return;
    if (!editEmergencyForm.contact.trim()) {
      showToast('Contact phone number is required', 'warning');
      return;
    }
    setSaveEmergencyLoading(true);
    const res = await updateEmergencyByAdmin(editingEmergency.id, editEmergencyForm);
    if (res.success) {
      showToast('Emergency request updated successfully!', 'success');
      setEditingEmergency(null);
      if (adminTab === 'activity_logs') {
        fetchActivityLogs();
      }
    } else {
      showToast(res.error?.message || 'Failed to update emergency request', 'error');
    }
    setSaveEmergencyLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchBlockedPhones();
      fetchSupportRequests();
      fetchDeletedDonors();
      fetchDeletedEmergencies();
      fetchActivityLogs();
    }
  }, [isAdmin]);

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
  const [confirmDeleteOffer, setConfirmDeleteOffer] = useState(null); // { id, name }
  const [deleting, setDeleting] = useState(false);

  // Google Admin Login states & logic
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [hasRenderedGoogleBtn, setHasRenderedGoogleBtn] = useState(false);
  const [showSimModal, setShowSimModal] = useState(false);
  const [simEmail, setSimEmail] = useState('adilh5353@gmail.com');
  const googleBtnRef = useRef(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const isRealGoogleConfigured = clientId && clientId.trim() !== '' && !clientId.includes('YOUR_GOOGLE_CLIENT_ID');

  useEffect(() => {
    if (!isAdmin && isRealGoogleConfigured && typeof window !== 'undefined') {
      const initGsi = () => {
        if (window.google?.accounts?.id) {
          try {
            window.google.accounts.id.initialize({
              client_id: clientId,
              callback: async (response) => {
                if (response.credential) {
                  await handleAdminGoogleCredential(response.credential);
                }
              },
            });

            if (googleBtnRef.current) {
              googleBtnRef.current.innerHTML = '';
              window.google.accounts.id.renderButton(googleBtnRef.current, {
                theme: 'outline',
                size: 'large',
                width: 320,
                text: 'signin_with',
                shape: 'pill',
                logo_alignment: 'left',
              });
              setHasRenderedGoogleBtn(true);
            }
          } catch (err) {
            console.warn('Admin Google Identity initialization error:', err);
          }
        }
      };

      if (window.google?.accounts?.id) {
        initGsi();
      } else {
        const interval = setInterval(() => {
          if (window.google?.accounts?.id) {
            clearInterval(interval);
            initGsi();
          }
        }, 200);
        return () => clearInterval(interval);
      }
    }
  }, [isAdmin, clientId, isRealGoogleConfigured]);

  const handleAdminGoogleCredential = async (credential) => {
    setGoogleLoading(true);
    setGoogleError('');
    try {
      const res = await loginAdminWithGoogle({ credential });
      if (!res.success) {
        setGoogleError(res.error?.message || 'Access Denied: This Google account is not authorized as an administrator.');
      }
    } catch (err) {
      setGoogleError(err.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSimulatedGoogleSubmit = async (e) => {
    e.preventDefault();
    setGoogleLoading(true);
    setGoogleError('');
    setShowSimModal(false);
    try {
      const res = await loginAdminWithGoogle({
        user: {
          email: simEmail.trim().toLowerCase(),
          name: 'Adil Hussain (Admin)',
          sub: 'google_admin_simulated',
        }
      });
      if (!res.success) {
        setGoogleError(res.error?.message || `Access Denied: The Google account (${simEmail}) is not authorized as an administrator.`);
      }
    } catch (err) {
      setGoogleError(err.message || 'Google authentication failed.');
    } finally {
      setGoogleLoading(false);
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
        } else {
          fetchDeletedDonors();
        }
      } else if (confirmDeleteType === 'emergency') {
        const res = await deleteEmergencyRequest(confirmDeleteId);
        if (!res.success) {
          showToast(t('errorDeletingRequestPrefix') + res.error, 'error');
        } else {
          fetchDeletedEmergencies();
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

  // Safe array references
  const safeDonors = useMemo(() => (donors || []).map(normalizeDonor), [donors]);
  const safeEmergencies = useMemo(() => emergencyRequests || [], [emergencyRequests]);
  const safeBlockedPhones = useMemo(() => blockedPhones || [], [blockedPhones]);
  const safeSupportRequests = useMemo(() => supportRequests || [], [supportRequests]);
  const safeDeletedDonors = useMemo(() => deletedDonors || [], [deletedDonors]);
  const safeDeletedEmergencies = useMemo(() => deletedEmergencies || [], [deletedEmergencies]);

  // Filtered Donors list for Admin with search, area, date, and blood group
  const adminFilteredDonors = useMemo(() => {
    return safeDonors.filter((d) => {
      // Blood Group filter
      if (bloodGroupFilter && d.blood_group !== bloodGroupFilter) return false;

      // Area filter
      if (adminAreaFilter && d.area !== adminAreaFilter) return false;

      // Search Query filter (matches name, phone, email, area)
      if (adminSearchQuery.trim()) {
        const q = adminSearchQuery.trim().toLowerCase();
        const matchName = d.name?.toLowerCase().includes(q);
        const matchPhone = d.phone?.includes(q);
        const matchEmail = d.email?.toLowerCase().includes(q);
        const matchArea = d.area?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail && !matchArea) return false;
      }

      // Date Range filter (created_at or last_donation_date)
      if (adminDateFrom) {
        const itemDate = d.created_at || d.last_donation_date;
        if (!itemDate || new Date(itemDate) < new Date(adminDateFrom)) return false;
      }
      if (adminDateTo) {
        const itemDate = d.created_at || d.last_donation_date;
        const endOfDay = new Date(adminDateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (!itemDate || new Date(itemDate) > endOfDay) return false;
      }

      return true;
    });
  }, [safeDonors, bloodGroupFilter, adminAreaFilter, adminSearchQuery, adminDateFrom, adminDateTo]);

  // Filtered Emergencies list for Admin with search, area, and date
  const adminFilteredEmergencies = useMemo(() => {
    return safeEmergencies.filter((req) => {
      // Area filter
      if (adminAreaFilter && req.area !== adminAreaFilter) return false;

      // Search Query filter
      if (adminSearchQuery.trim()) {
        const q = adminSearchQuery.trim().toLowerCase();
        const matchPatient = req.patient_name?.toLowerCase().includes(q);
        const matchHospital = req.hospital?.toLowerCase().includes(q);
        const matchPhone = req.contact?.includes(q);
        const matchArea = req.area?.toLowerCase().includes(q);
        const matchBlood = req.blood_group?.toLowerCase().includes(q);
        if (!matchPatient && !matchHospital && !matchPhone && !matchArea && !matchBlood) return false;
      }

      // Date Range filter
      if (adminDateFrom) {
        const itemDate = req.created_at || req.date;
        if (!itemDate || new Date(itemDate) < new Date(adminDateFrom)) return false;
      }
      if (adminDateTo) {
        const itemDate = req.created_at || req.date;
        const endOfDay = new Date(adminDateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (!itemDate || new Date(itemDate) > endOfDay) return false;
      }

      return true;
    });
  }, [safeEmergencies, adminAreaFilter, adminSearchQuery, adminDateFrom, adminDateTo]);

  // Compute counts for each blood group (reflecting active area/search/date filters)
  const groupCounts = useMemo(() => {
    const baseList = safeDonors.filter(d => {
      if (adminAreaFilter && d.area !== adminAreaFilter) return false;
      if (adminSearchQuery.trim()) {
        const q = adminSearchQuery.trim().toLowerCase();
        const matchName = d.name?.toLowerCase().includes(q);
        const matchPhone = d.phone?.includes(q);
        const matchEmail = d.email?.toLowerCase().includes(q);
        const matchArea = d.area?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail && !matchArea) return false;
      }
      if (adminDateFrom) {
        const itemDate = d.created_at || d.last_donation_date;
        if (!itemDate || new Date(itemDate) < new Date(adminDateFrom)) return false;
      }
      if (adminDateTo) {
        const itemDate = d.created_at || d.last_donation_date;
        const endOfDay = new Date(adminDateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (!itemDate || new Date(itemDate) > endOfDay) return false;
      }
      return true;
    });

    const counts = { All: baseList.length };
    BLOOD_GROUPS.forEach(g => {
      counts[g] = baseList.filter(d => d.blood_group === g).length;
    });
    return counts;
  }, [safeDonors, adminAreaFilter, adminSearchQuery, adminDateFrom, adminDateTo]);

  // Pagination for Donors
  const [donorPage, setDonorPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when any filter changes
  useEffect(() => {
    setDonorPage(1);
  }, [bloodGroupFilter, adminAreaFilter, adminSearchQuery, adminDateFrom, adminDateTo, safeDonors.length]);

  const totalDonorPages = Math.max(1, Math.ceil(adminFilteredDonors.length / itemsPerPage));
  const paginatedDonors = useMemo(() => {
    const startIndex = (donorPage - 1) * itemsPerPage;
    return adminFilteredDonors.slice(startIndex, startIndex + itemsPerPage);
  }, [adminFilteredDonors, donorPage]);

  // Pagination for Emergencies
  const [emergencyPage, setEmergencyPage] = useState(1);

  // Reset page when emergencies count or filters change
  useEffect(() => {
    setEmergencyPage(1);
  }, [adminFilteredEmergencies.length, adminAreaFilter, adminSearchQuery, adminDateFrom, adminDateTo]);

  const totalEmergencyPages = Math.max(1, Math.ceil(adminFilteredEmergencies.length / itemsPerPage));
  const paginatedEmergencies = useMemo(() => {
    const startIndex = (emergencyPage - 1) * itemsPerPage;
    return adminFilteredEmergencies.slice(startIndex, startIndex + itemsPerPage);
  }, [adminFilteredEmergencies, emergencyPage]);
  // Admin View Mode Switcher ('table' | 'grid')
  const [adminViewMode, setAdminViewMode] = useState(() => {
    try {
      const saved = localStorage.getItem('darun_admin_view_mode');
      return saved === 'grid' ? 'grid' : 'table';
    } catch {
      return 'table';
    }
  });

  const handleAdminViewModeChange = (mode) => {
    setAdminViewMode(mode);
    try {
      localStorage.setItem('darun_admin_view_mode', mode);
    } catch {}
  };

  // Pagination for Activity Logs
  const [activityPage, setActivityPage] = useState(1);
  const activityItemsPerPage = 10;

  useEffect(() => {
    setActivityPage(1);
  }, [activitySearchQuery, activityTypeFilter, activityLogs.length]);
  // RENDER: LOGIN FORM
  // ==============================================================
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 sm:px-0">
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-zinc-800 space-y-6 shadow-2xl relative overflow-hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl animate-fade-in">
          {/* Top Decorative Crimson Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-600" />

          {/* Header */}
          <div className="text-center space-y-3 pt-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-red-500/25 relative group">
              <Shield className="w-7 h-7" />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-xs">
                🔒
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {t('adminAuthTitle')}
              </h2>
              <span className="text-[10px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-widest block">
                {t('adminPortalSub')}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Sign in with your authorized administrator Google account to access moderator records.
            </p>
          </div>

          {/* Single Account Security Enforcement Notice */}
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3 flex items-start gap-2.5 text-left">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0 mt-1" />
            <p className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold leading-normal">
              <strong className="font-bold">Strict 1-Account Enforcement:</strong> Access is locked exclusively to the configured administrator Google account. Unauthorized accounts are strictly rejected.
            </p>
          </div>

          {/* Google Error Banner */}
          {googleError && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 p-4 rounded-2xl text-xs flex items-start gap-3 text-left">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Access Denied</span>
                <span className="font-medium text-[11px] leading-relaxed block">{googleError}</span>
              </div>
            </div>
          )}

          {/* Google Authentication Actions - Displays exactly ONE button */}
          <div className="pt-2 flex flex-col items-center justify-center w-full">
            {/* Real Google Button Container when initialized */}
            <div
              ref={googleBtnRef}
              className={hasRenderedGoogleBtn ? 'flex justify-center w-full min-h-[44px]' : 'hidden'}
            />

            {/* Direct Google Sign In Button - Only shown when Google Identity iframe is not rendered */}
            {!hasRenderedGoogleBtn && (
              <button
                type="button"
                disabled={googleLoading}
                onClick={() => {
                  if (window.google?.accounts?.id && isRealGoogleConfigured) {
                    window.google.accounts.id.prompt();
                  } else {
                    setShowSimModal(true);
                  }
                }}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-red-500/40 dark:hover:border-red-500/40 text-slate-800 dark:text-white font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {/* Google G Logo SVG */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{googleLoading ? 'Verifying Google Account...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Development / Testing Google Auth Modal */}
        {showSimModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-left">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-scale-up">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Admin Google Sign-In</h3>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500">Test or verify admin authorization</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSimModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSimulatedGoogleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                    Google Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={simEmail}
                    onChange={(e) => setSimEmail(e.target.value)}
                    placeholder="e.g. adilh5353@gmail.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                    Pre-set with authorized admin email. Try entering another email to test unauthorized rejection.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSimModal(false)}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={googleLoading}
                    className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {googleLoading ? 'Verifying...' : 'Authorize Admin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
        <button
          onClick={() => setAdminTab('donors')}
          className={`glass-panel p-3 sm:p-5 rounded-2xl border text-left flex justify-between items-center transition-all cursor-pointer ${adminTab === 'donors'
              ? 'border-red-500/40 ring-1 ring-red-500/10 shadow-md'
              : 'hover:border-slate-300 dark:hover:border-zinc-700'
            }`}
        >
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <span className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block truncate">
              {t('manageDonorsTab')}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight block">
              {safeDonors.length}
            </span>
          </div>
          <div className="p-2 sm:p-3 rounded-xl bg-red-500/5 dark:bg-red-500/10 text-red-500 shrink-0">
            <Heart className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </button>

        <button
          onClick={() => setAdminTab('emergencies')}
          className={`glass-panel p-3 sm:p-5 rounded-2xl border text-left flex justify-between items-center transition-all cursor-pointer ${adminTab === 'emergencies'
              ? 'border-rose-500/40 ring-1 ring-rose-500/10 shadow-md'
              : 'hover:border-slate-300 dark:hover:border-zinc-700'
            }`}
        >
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <span className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block truncate">
              {t('manageEmergenciesTab')}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight block">
              {safeEmergencies.length}
            </span>
          </div>
          <div className="p-2 sm:p-3 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 text-rose-500 shrink-0">
            <Flame className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </button>

        <button
          onClick={() => setAdminTab('activity_logs')}
          className={`glass-panel p-3 sm:p-5 rounded-2xl border text-left flex justify-between items-center transition-all cursor-pointer ${adminTab === 'activity_logs'
              ? 'border-indigo-500/40 ring-1 ring-indigo-500/10 shadow-md'
              : 'hover:border-slate-300 dark:hover:border-zinc-700'
            }`}
        >
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <span className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block truncate">
              {language === 'bn' ? 'কার্যক্রম লগ' : 'Activity Logs'}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight block">
              {activityLogs.length}
            </span>
          </div>
          <div className="p-2 sm:p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Activity className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </button>

        <button
          onClick={() => setAdminTab('blocked')}
          className={`glass-panel p-3 sm:p-5 rounded-2xl border text-left flex justify-between items-center transition-all cursor-pointer ${adminTab === 'blocked'
              ? 'border-zinc-500/40 ring-1 ring-zinc-500/10 shadow-md'
              : 'hover:border-slate-300 dark:hover:border-zinc-700'
            }`}
        >
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <span className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block truncate">
              Blocked Phones
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight block">
              {safeBlockedPhones.length}
            </span>
          </div>
          <div className="p-2 sm:p-3 rounded-xl bg-zinc-500/5 dark:bg-zinc-500/10 text-zinc-500 shrink-0">
            <Ban className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </button>

        <button
          onClick={() => setAdminTab('support')}
          className={`glass-panel p-3 sm:p-5 rounded-2xl border text-left flex justify-between items-center transition-all cursor-pointer ${adminTab === 'support'
              ? 'border-blue-500/40 ring-1 ring-blue-500/10 shadow-md'
              : 'hover:border-slate-300 dark:hover:border-zinc-700'
            }`}
        >
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <span className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block truncate">
              Support Tickets
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight block">
              {safeSupportRequests.length}
            </span>
          </div>
          <div className="p-2 sm:p-3 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 text-blue-500 shrink-0">
            <MessageSquare className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </button>

        <button
          onClick={() => setAdminTab('deleted_donors')}
          className={`glass-panel p-3 sm:p-5 rounded-2xl border text-left flex justify-between items-center transition-all cursor-pointer ${adminTab === 'deleted_donors'
              ? 'border-purple-500/40 ring-1 ring-purple-500/10 shadow-md'
              : 'hover:border-slate-300 dark:hover:border-zinc-700'
            }`}
        >
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <span className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block truncate">
              {language === 'bn' ? 'মুছে ফেলা রক্তদাতা' : 'Deleted Donors'}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight block">
              {safeDeletedDonors.length}
            </span>
          </div>
          <div className="p-2 sm:p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
            <UserX className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </button>

        <button
          onClick={() => setAdminTab('deleted_emergencies')}
          className={`glass-panel p-3 sm:p-5 rounded-2xl border text-left flex justify-between items-center transition-all cursor-pointer ${adminTab === 'deleted_emergencies'
              ? 'border-amber-500/40 ring-1 ring-amber-500/10 shadow-md'
              : 'hover:border-slate-300 dark:hover:border-zinc-700'
            }`}
        >
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <span className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block truncate">
              {language === 'bn' ? 'মুছে ফেলা অনুরোধ' : 'Deleted Requests'}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight block">
              {safeDeletedEmergencies.length}
            </span>
          </div>
          <div className="p-2 sm:p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <FileX className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </button>

        <button
          onClick={() => setAdminTab('donor_card')}
          className={`glass-panel p-3 sm:p-5 rounded-2xl border text-left flex justify-between items-center transition-all cursor-pointer ${adminTab === 'donor_card'
              ? 'border-emerald-500/40 ring-1 ring-emerald-500/10 shadow-md'
              : 'hover:border-slate-300 dark:hover:border-zinc-700'
            }`}
        >
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <span className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block truncate">
              {language === 'bn' ? 'ডোনার কার্ড ও অফার' : 'Card & Offers'}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight block">
              {cardOffersList.length}
            </span>
          </div>
          <div className="p-2 sm:p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CreditCard className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </button>
      </div>

      {/* Advanced Filters Toolbar (Search, Area, Date Range) */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-200/60 dark:border-zinc-800/60 shadow-sm text-left space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/40 dark:border-zinc-800/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                {language === 'bn' ? 'ফিল্টার এবং অনুসন্ধান' : 'Filter & Search Records'}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                {language === 'bn' ? 'এলাকা, তারিখ এবং কিওয়ার্ড অনুযায়ী ফিল্টার করুন' : 'Filter by Area, Date Range, or Keyword'}
              </p>
            </div>
          </div>

          {(adminSearchQuery || adminAreaFilter || adminDateFrom || adminDateTo || bloodGroupFilter) && (
            <button
              onClick={() => {
                setAdminSearchQuery('');
                setAdminAreaFilter('');
                setAdminDateFrom('');
                setAdminDateTo('');
                setBloodGroupFilter('');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer self-end sm:self-auto"
            >
              <X className="w-3.5 h-3.5 text-rose-500" />
              <span>{language === 'bn' ? 'ফিল্টার রিসেট' : 'Reset Filters'}</span>
            </button>
          )}
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Keyword Search */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
              {language === 'bn' ? 'অনুসন্ধান (নাম / ফোন / এলাকা)' : 'Search (Name / Phone / Area)'}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={adminSearchQuery}
                onChange={(e) => setAdminSearchQuery(e.target.value)}
                placeholder={language === 'bn' ? 'নাম বা নম্বর দিয়ে খুঁজুন...' : 'Search records...'}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
              {adminSearchQuery && (
                <button
                  type="button"
                  onClick={() => setAdminSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 2. District & Area Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
              {language === 'bn' ? 'জেলা ও উপজেলা / এলাকা' : 'District & Area'}
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={adminAreaFilter}
                onChange={(e) => setAdminAreaFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all appearance-none cursor-pointer"
              >
                <option value="">{language === 'bn' ? 'সকল এলাকা (All Areas)' : 'All Areas'}</option>
                {DISTRICT_AREAS.map((district) => (
                  <optgroup key={district.id} label={`${district.name} (${district.nameBn})`}>
                    {district.upazilas.map((upazila) => (
                      <option key={upazila} value={upazila}>
                        {getAreaLabel(upazila, t)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* 3. Date From */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
              {language === 'bn' ? 'তারিখ থেকে (From)' : 'Date From'}
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={adminDateFrom}
                onChange={(e) => setAdminDateFrom(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* 4. Date To */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
              {language === 'bn' ? 'তারিখ পর্যন্ত (To)' : 'Date To'}
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={adminDateTo}
                onChange={(e) => setAdminDateTo(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Active Filter Indicators */}
        {(adminSearchQuery || adminAreaFilter || adminDateFrom || adminDateTo) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/40 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Active:</span>
            {adminSearchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 font-semibold text-[11px] border border-red-500/20">
                "{adminSearchQuery}"
                <X className="w-3 h-3 cursor-pointer" onClick={() => setAdminSearchQuery('')} />
              </span>
            )}
            {adminAreaFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold text-[11px] border border-amber-500/20">
                {getAreaLabel(adminAreaFilter, t)}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setAdminAreaFilter('')} />
              </span>
            )}
            {adminDateFrom && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold text-[11px] border border-blue-500/20">
                From: {adminDateFrom}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setAdminDateFrom('')} />
              </span>
            )}
            {adminDateTo && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold text-[11px] border border-blue-500/20">
                To: {adminDateTo}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setAdminDateTo('')} />
              </span>
            )}
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 ml-auto">
              {adminTab === 'donors' ? `${adminFilteredDonors.length} matching donors` : `${adminFilteredEmergencies.length} matching emergencies`}
            </span>
          </div>
        )}
      </div>

      {/* Premium Delete Confirmation Modal (Donor & Emergency Request) */}
      {confirmDeleteId && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={cancelDeleteConfirm}
        >
          <div
            className="relative w-full max-w-md rounded-3xl p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl text-left space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 ring-4 ring-rose-500/10">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {t('areYouSureTitle') || 'Confirm Deletion'}
                </h4>
                <p className="text-xs text-slate-400 font-medium">
                  {confirmDeleteType === 'donor' ? 'Voluntary Donor Record' : 'Emergency Request'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-normal bg-slate-50 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800">
              {t('permanentActionWarning', { type: confirmDeleteType === 'donor' ? t('registeredDonorWord') : t('emergencyRequestWord') })}
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={cancelDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs transition-colors cursor-pointer"
              >
                {t('cancelButton') || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleting ? t('deletingButton') : (t('confirmDeleteButton') || 'Delete')}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Premium Delete Offer Confirmation Modal */}
      {confirmDeleteOffer && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={() => setConfirmDeleteOffer(null)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl text-left space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 ring-4 ring-rose-500/10">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Delete Sponsorship Offer?
                </h4>
                <p className="text-xs text-slate-400 font-medium truncate">
                  {confirmDeleteOffer.name}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-normal bg-slate-50 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-1">
              <p>
                Are you sure you want to permanently remove the partner offer for <strong className="text-slate-900 dark:text-white font-bold">{confirmDeleteOffer.name}</strong>?
              </p>
              {confirmDeleteOffer.title && (
                <p className="text-[11px] text-slate-400 dark:text-zinc-400">
                  Offer: "{confirmDeleteOffer.title}"
                </p>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteOffer(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const offerToDelete = confirmDeleteOffer;
                  setConfirmDeleteOffer(null);
                  const res = await deleteDonorCardOffer(offerToDelete.id);
                  if (res.success) {
                    showToast('Offer deleted successfully', 'success');
                    setCardOffersList(prev => prev.filter(o => o.id !== offerToDelete.id));
                  } else {
                    showToast(res.error?.message || 'Failed to delete offer', 'error');
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Offer</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Premium Block Phone Modal */}
      {confirmBlockData && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={() => setConfirmBlockData(null)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl text-left space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0 ring-4 ring-zinc-500/10">
                <Ban className="w-6 h-6 text-rose-500" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Confirm Account Block
                </h4>
                <p className="text-xs text-slate-400 font-mono font-bold">
                  {confirmBlockData.phone}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-normal bg-slate-50 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800">
              You are about to block phone number <strong className="text-slate-900 dark:text-white font-mono">{confirmBlockData.phone}</strong>. Any active session will be invalidated, preventing them from registering or creating emergency blood requests.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmBlockData(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const data = confirmBlockData;
                  setConfirmBlockData(null);
                  await executeBlock(data.phone, data.reason);
                }}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-800 hover:bg-rose-600 dark:hover:bg-rose-600 text-white font-extrabold text-xs shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Ban className="w-4 h-4" />
                <span>Confirm Block</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Premium Unblock Phone Modal */}
      {confirmUnblockPhone && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={() => setConfirmUnblockPhone(null)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl text-left space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 ring-4 ring-amber-500/10">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Confirm Phone Unblock
                </h4>
                <p className="text-xs text-slate-400 font-mono font-bold">
                  {confirmUnblockPhone}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-normal bg-slate-50 dark:bg-zinc-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800">
              Restore full access for <strong className="text-slate-900 dark:text-white font-mono">{confirmUnblockPhone}</strong>. They will be able to register, log in, and post emergency blood requests immediately.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmUnblockPhone(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const phone = confirmUnblockPhone;
                  setConfirmUnblockPhone(null);
                  await executeUnblock(phone);
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm Unblock</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Main Tables */}
      <div className="glass-panel border rounded-3xl overflow-hidden">
        {adminTab === 'donors' && (
          <div className="space-y-4">

            {/* Header with categories & View Switcher */}
            <div className="p-5 border-b border-slate-200/50 dark:border-zinc-800/50 space-y-4 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-extrabold text-slate-950 dark:text-white text-base">
                  {t('donorRecordsHeader')}
                </h3>

                {/* Table / Grid Switcher */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 shadow-xs self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleAdminViewModeChange('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${adminViewMode === 'table'
                      ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                      }`}
                    title={language === 'bn' ? 'টেবিল ভিউ' : 'Table View'}
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'টেবিল' : 'Table'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdminViewModeChange('grid')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${adminViewMode === 'grid'
                      ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                      }`}
                    title={language === 'bn' ? 'গ্রিড ভিউ' : 'Grid View'}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'গ্রিড' : 'Grid'}</span>
                  </button>
                </div>
              </div>

              {/* Category selector */}
              <div className="flex flex-wrap gap-2 items-center animate-fade-in">
                <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mr-2">
                  {t('categoryLabel')}
                </span>

                {/* All pill */}
                <button
                  onClick={() => setBloodGroupFilter('')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${bloodGroupFilter === ''
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${bloodGroupFilter === group
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
                  {adminViewMode === 'table' ? (
                    <>
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
                                  <div className="flex items-center gap-2.5">
                                    {donor.avatar_url && !isDefaultLetterAvatar(donor.avatar_url) ? (
                                      <div className="relative shrink-0">
                                        <img
                                          src={donor.avatar_url}
                                          alt={donor.name}
                                          referrerPolicy="no-referrer"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const fallback = e.currentTarget.nextElementSibling;
                                            if (fallback) fallback.style.display = 'flex';
                                          }}
                                          className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-zinc-700 shadow-xs"
                                        />
                                        <div className="w-8 h-8 rounded-full bg-red-650 text-white font-black text-xs items-center justify-center border border-red-500/30 hidden">
                                          {donor.blood_group}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-rose-600 text-white font-black text-[10px] flex items-center justify-center shadow-xs border border-red-400/40 shrink-0">
                                        {donor.blood_group}
                                      </div>
                                    )}
                                    <span className="truncate">{donor.name}</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="bg-red-500/10 text-red-600 dark:text-red-400 font-black px-2 py-0.5 rounded-md text-xs">
                                    {donor.blood_group}
                                  </span>
                                </td>
                                <td className="p-4 truncate overflow-hidden">{donor.phone}</td>
                                <td className="p-4 truncate overflow-hidden" title={getAreaLabel(donor.area, t)}>
                                  <span className="flex items-center gap-1.5">
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border shrink-0 ${getDistrictBadge(donor.area, language).color.bg} ${getDistrictBadge(donor.area, language).color.text} ${getDistrictBadge(donor.area, language).color.border}`}>
                                      {getDistrictBadge(donor.area, language).label}
                                    </span>
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
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => openEditDonorModal(donor)}
                                      className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 dark:hover:bg-amber-500/15 p-2 rounded-xl transition-all cursor-pointer"
                                      title="Edit donor details"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => startDeleteConfirm(donor.id, 'donor')}
                                      className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 p-2 rounded-xl transition-all cursor-pointer"
                                      title="Delete fake/spam donor"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
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
                              <div className="flex items-center gap-2.5 text-left">
                                {donor.avatar_url && !isDefaultLetterAvatar(donor.avatar_url) ? (
                                  <div className="relative shrink-0">
                                    <img
                                      src={donor.avatar_url}
                                      alt={donor.name}
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const fallback = e.currentTarget.nextElementSibling;
                                        if (fallback) fallback.style.display = 'flex';
                                      }}
                                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-zinc-700 shadow-xs"
                                    />
                                    <div className="w-10 h-10 rounded-full bg-red-650 text-white font-black text-xs items-center justify-center border border-red-500/30 hidden">
                                      {donor.blood_group}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-rose-600 text-white font-black text-xs flex items-center justify-center border border-red-400/40 shadow-xs shrink-0">
                                    {donor.blood_group}
                                  </div>
                                )}
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-slate-900 dark:text-white text-base block">
                                    {donor.name}
                                  </span>
                                  <span className="text-xs text-slate-500 dark:text-zinc-400 font-semibold block">
                                    {donor.phone}
                                  </span>
                                </div>
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

                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                onClick={() => openEditDonorModal(donor)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Edit Details
                              </button>
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
                    </>
                  ) : (
                    /* GRID VIEW FOR DONORS */
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
                      {paginatedDonors.map((donor) => {
                        const distBadge = getDistrictBadge(donor.area, language);
                        return (
                          <div
                            key={donor.id}
                            className="glass-panel p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between text-left space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {donor.avatar_url && !isDefaultLetterAvatar(donor.avatar_url) ? (
                                  <div className="relative shrink-0">
                                    <img
                                      src={donor.avatar_url}
                                      alt={donor.name}
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const fallback = e.currentTarget.nextElementSibling;
                                        if (fallback) fallback.style.display = 'flex';
                                      }}
                                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-zinc-700 shadow-xs"
                                    />
                                    <div className="w-10 h-10 rounded-full bg-red-650 text-white font-black text-xs items-center justify-center border border-red-500/30 hidden">
                                      {donor.blood_group}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-rose-600 text-white font-black text-xs flex items-center justify-center shadow-xs border border-red-400/40 shrink-0">
                                    {donor.blood_group}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm truncate" title={donor.name}>
                                    {donor.name}
                                  </h4>
                                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                                    {donor.phone}
                                  </p>
                                </div>
                              </div>
                              <span className="bg-red-500 text-white font-black px-2.5 py-0.5 rounded-lg text-xs shrink-0 shadow-xs">
                                {donor.blood_group}
                              </span>
                            </div>

                            <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/60">
                              <div className="flex items-center gap-1.5 truncate" title={getAreaLabel(donor.area, t)}>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border shrink-0 ${distBadge.color.bg} ${distBadge.color.text} ${distBadge.color.border}`}>
                                  {distBadge.label}
                                </span>
                                <span className="truncate font-medium">{getAreaLabel(donor.area, t)}</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/50 dark:border-zinc-700/50">
                                <span className="font-medium text-slate-500">Donations:</span>
                                <span className="font-extrabold text-slate-900 dark:text-white">
                                  {normalizeDonor(donor).total_donations} times
                                </span>
                              </div>
                              {donor.last_donation_date && (
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-medium text-slate-500">Last donated:</span>
                                  <span className="font-semibold text-slate-700 dark:text-zinc-300">
                                    {String(donor.last_donation_date).substring(0, 10)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
                              <button
                                onClick={() => openEditDonorModal(donor)}
                                className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => startDeleteConfirm(donor.id, 'donor')}
                                className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-450 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
            <div className="p-5 border-b border-slate-200/50 dark:border-zinc-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-extrabold text-slate-950 dark:text-white text-base">
                {t('activeEmergencyRecordsHeader')}
              </h3>

              {/* Table / Grid Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 shadow-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleAdminViewModeChange('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${adminViewMode === 'table'
                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                  title={language === 'bn' ? 'টেবিল ভিউ' : 'Table View'}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'টেবিল' : 'Table'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAdminViewModeChange('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${adminViewMode === 'grid'
                    ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                  title={language === 'bn' ? 'গ্রিড ভিউ' : 'Grid View'}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'গ্রিড' : 'Grid'}</span>
                </button>
              </div>
            </div>

            {safeEmergencies.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-zinc-400">
                {t('noActiveEmergencies')}
              </div>
            ) : (
              <>
                <div className="animate-fade-in">
                  {adminViewMode === 'table' ? (
                    <>
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
                                <td className="p-4 font-bold text-slate-900 dark:text-white truncate overflow-hidden" title={getAreaLabel(req.area, t)}>
                                  <div className="flex items-center gap-1.5">
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border shrink-0 ${getDistrictBadge(req.area, language).color.bg} ${getDistrictBadge(req.area, language).color.text} ${getDistrictBadge(req.area, language).color.border}`}>
                                      {getDistrictBadge(req.area, language).label}
                                    </span>
                                    <span className="truncate">{getAreaLabel(req.area, t)}</span>
                                  </div>
                                </td>
                                <td className="p-4 truncate overflow-hidden">{req.contact}</td>
                                <td className="p-4 truncate overflow-hidden" title={req.note}>
                                  {req.note || t('noDescription')}
                                </td>
                                <td className="p-4 text-xs text-slate-400 dark:text-zinc-500">
                                  {new Date(req.created_at).toLocaleString()}
                                </td>
                                <td className="p-4 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => openEditEmergencyModal(req)}
                                      className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 dark:hover:bg-amber-500/15 p-2 rounded-xl transition-all cursor-pointer"
                                      title="Edit emergency request details"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => startDeleteConfirm(req.id, 'emergency')}
                                      className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 p-2 rounded-xl transition-all cursor-pointer"
                                      title="Delete emergency request"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
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
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openEditEmergencyModal(req)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => startDeleteConfirm(req.id, 'emergency')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-450 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  {t('deleteRequest')}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    /* GRID VIEW FOR EMERGENCIES */
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
                      {paginatedEmergencies.map((req) => {
                        const distBadge = getDistrictBadge(req.area, language);
                        return (
                          <div
                            key={req.id}
                            className="glass-panel p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between text-left space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2.5">
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border shrink-0 ${distBadge.color.bg} ${distBadge.color.text} ${distBadge.color.border}`}>
                                    {distBadge.label}
                                  </span>
                                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm truncate" title={getAreaLabel(req.area, t)}>
                                    {getAreaLabel(req.area, t)}
                                  </h4>
                                </div>
                                <p className="text-xs font-mono font-bold text-slate-600 dark:text-zinc-400">
                                  {req.contact}
                                </p>
                              </div>
                              <span className="bg-red-600 text-white font-black px-2.5 py-1 rounded-xl text-xs shrink-0 shadow-xs">
                                {req.blood_group}
                              </span>
                            </div>

                            {req.note ? (
                              <p className="text-xs text-slate-650 dark:text-zinc-350 bg-slate-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/60 leading-relaxed line-clamp-3">
                                {req.note}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/60">
                                {t('noDescription')}
                              </p>
                            )}

                            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 space-y-2.5">
                              <span className="text-[11px] text-slate-400 dark:text-zinc-500 block">
                                {new Date(req.created_at).toLocaleString()}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openEditEmergencyModal(req)}
                                  className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => startDeleteConfirm(req.id, 'emergency')}
                                  className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-450 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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

              {blockedLoading && safeBlockedPhones.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold py-4">Loading blocked list...</p>
              ) : safeBlockedPhones.length === 0 ? (
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
                        {safeBlockedPhones.map((b) => (
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
                    {safeBlockedPhones.map((b) => (
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

            {supportLoading && safeSupportRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-zinc-500 font-semibold text-xs animate-pulse">
                Loading support requests...
              </div>
            ) : safeSupportRequests.length === 0 ? (
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
                      {safeSupportRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${req.type === 'problem'
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
                  {safeSupportRequests.map((req) => (
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
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${req.type === 'problem'
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

        {/* ============================================================== */}
        {/* VIEW: DELETED DONORS ARCHIVE                                   */}
        {/* ============================================================== */}
        {adminTab === 'deleted_donors' && (
          <div className="space-y-4">
            <div className="p-5 border-b border-slate-200/50 dark:border-zinc-800/50 text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="font-extrabold text-slate-950 dark:text-white text-base flex items-center gap-2">
                  <UserX className="w-5 h-5 text-purple-500" />
                  {language === 'bn' ? 'মুছে ফেলা রক্তদাতাদের তালিকা (অডিট লগ)' : 'Deleted Donors Archive (Audit Trail)'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  {language === 'bn'
                    ? 'কোন রক্তদাতা অ্যাকাউন্টটি মুছে ফেলেছেন বা অ্যাডমিন মুছে দিয়েছেন তার সম্পূর্ণ বিবরণ।'
                    : 'Full audit history of all deleted donor accounts with registration and deletion details.'}
                </p>
              </div>
              <button
                onClick={fetchDeletedDonors}
                disabled={deletedDonorsLoading}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 transition-all cursor-pointer"
              >
                {deletedDonorsLoading ? 'Loading...' : (language === 'bn' ? 'রিফ্রেশ' : 'Refresh Archive')}
              </button>
            </div>

            {deletedDonorsError && (
              <div className="p-4 mx-5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl text-xs font-semibold">
                {deletedDonorsError}
              </div>
            )}

            {safeDeletedDonors.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500 dark:text-zinc-400 space-y-2">
                <UserX className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
                <p className="font-bold">{language === 'bn' ? 'কোনো মুছে ফেলা রক্তদাতার রেকর্ড নেই' : 'No deleted donor records found.'}</p>
                <p className="text-xs text-slate-400">{language === 'bn' ? 'ভবিষ্যতে কোনো অ্যাকাউন্ট মুছে ফেলা হলে তা এখানে সংরক্ষিত থাকবে।' : 'Whenever an account is removed, its full profile will be archived here.'}</p>
              </div>
            ) : (
              <div className="animate-fade-in">
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/50 dark:border-zinc-800/50 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-50/50 dark:bg-zinc-900/50">
                        <th className="p-4">Donor Name</th>
                        <th className="p-4">Blood Group</th>
                        <th className="p-4">Contact Phone</th>
                        <th className="p-4">Location / Area</th>
                        <th className="p-4">Donation Stats</th>
                        <th className="p-4">Deleted By</th>
                        <th className="p-4">Deleted At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                      {safeDeletedDonors.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/40 transition-colors">
                          <td className="p-4 font-bold text-slate-900 dark:text-white">
                            <div>{d.name}</div>
                            {d.email && <div className="text-xs font-normal text-slate-400">{d.email}</div>}
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                              {d.blood_group}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-xs font-bold text-slate-700 dark:text-zinc-300">
                            <a href={`tel:${d.phone}`} className="hover:underline flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {d.phone}
                            </a>
                          </td>
                          <td className="p-4 text-xs font-medium text-slate-600 dark:text-zinc-400">
                            {getAreaLabel(d.area, t)}
                          </td>
                          <td className="p-4 text-xs">
                            <span className="font-bold text-slate-800 dark:text-zinc-200">{d.lifetime_donation_count || d.total_donations || 0} times</span>
                            {d.last_donation_date && (
                              <div className="text-[11px] text-slate-400">Last: {d.last_donation_date}</div>
                            )}
                          </td>
                          <td className="p-4 text-xs">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${d.deleted_by?.includes('admin')
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                              }`}>
                              {d.deleted_by || 'Unknown'}
                            </span>
                          </td>
                          <td className="p-4 text-xs font-mono text-slate-500 dark:text-zinc-400">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {d.deleted_at ? new Date(d.deleted_at).toLocaleString() : '—'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-zinc-850">
                  {safeDeletedDonors.map((d) => (
                    <div key={d.id} className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-zinc-900/5 transition-colors text-left">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-white text-base block">
                            {d.name}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-zinc-400 font-semibold block">
                            {d.phone} {d.email && `• ${d.email}`}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                          {d.blood_group}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-zinc-400 pt-1 border-t border-slate-100 dark:border-zinc-800/40">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Area</span>
                          <span className="font-semibold">{getAreaLabel(d.area, t)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Donations</span>
                          <span className="font-semibold">{d.lifetime_donation_count || d.total_donations || 0} times</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-zinc-800/40 text-[11px]">
                        <span className="text-slate-500 dark:text-zinc-400">
                          By: <strong className="text-slate-700 dark:text-zinc-200">{d.deleted_by}</strong>
                        </span>
                        <span className="text-slate-400 font-mono">
                          {d.deleted_at ? new Date(d.deleted_at).toLocaleDateString() : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW: DELETED EMERGENCY REQUESTS ARCHIVE                       */}
        {/* ============================================================== */}
        {adminTab === 'deleted_emergencies' && (
          <div className="space-y-4">
            <div className="p-5 border-b border-slate-200/50 dark:border-zinc-800/50 text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="font-extrabold text-slate-950 dark:text-white text-base flex items-center gap-2">
                  <FileX className="w-5 h-5 text-amber-500" />
                  {language === 'bn' ? 'মুছে ফেলা জরুরি রক্তের অনুরোধ (অডিট লগ)' : 'Deleted Emergency Requests Archive'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  {language === 'bn'
                    ? 'আবেদনকারী বা অ্যাডমিন কর্তৃক মুছে ফেলা জরুরি রক্তের পোস্ট ও বিস্তারিত তথ্যাদি।'
                    : 'Full audit history of all emergency blood requests that were removed or completed.'}
                </p>
              </div>
              <button
                onClick={fetchDeletedEmergencies}
                disabled={deletedEmergenciesLoading}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-300 transition-all cursor-pointer"
              >
                {deletedEmergenciesLoading ? 'Loading...' : (language === 'bn' ? 'রিফ্রেশ' : 'Refresh Archive')}
              </button>
            </div>

            {deletedEmergenciesError && (
              <div className="p-4 mx-5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl text-xs font-semibold">
                {deletedEmergenciesError}
              </div>
            )}

            {safeDeletedEmergencies.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500 dark:text-zinc-400 space-y-2">
                <FileX className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
                <p className="font-bold">{language === 'bn' ? 'কোনো মুছে ফেলা জরুরি অনুরোধের রেকর্ড নেই' : 'No deleted emergency request records found.'}</p>
                <p className="text-xs text-slate-400">{language === 'bn' ? 'ভবিষ্যতে কোনো জরুরি পোস্ট মুছে ফেলা হলে তা এখানে সংরক্ষিত থাকবে।' : 'Whenever an emergency blood post is removed, it will be safely logged here.'}</p>
              </div>
            ) : (
              <div className="animate-fade-in">
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200/50 dark:border-zinc-800/50 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-50/50 dark:bg-zinc-900/50">
                        <th className="p-4">Blood Group</th>
                        <th className="p-4">Hospital / Area</th>
                        <th className="p-4">Contact Phone</th>
                        <th className="p-4">Requester Details</th>
                        <th className="p-4">Note / Reason</th>
                        <th className="p-4">Deleted By</th>
                        <th className="p-4">Deleted At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                      {safeDeletedEmergencies.map((emg) => (
                        <tr key={emg.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/40 transition-colors">
                          <td className="p-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              {emg.blood_group}
                            </span>
                          </td>
                          <td className="p-4 text-xs font-bold text-slate-800 dark:text-zinc-200">
                            {getAreaLabel(emg.area, t)}
                          </td>
                          <td className="p-4 font-mono text-xs font-bold text-slate-700 dark:text-zinc-300">
                            <a href={`tel:${emg.contact}`} className="hover:underline flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {emg.contact}
                            </a>
                          </td>
                          <td className="p-4 text-xs text-slate-600 dark:text-zinc-400">
                            {emg.requester_name ? (
                              <div>
                                <span className="font-bold text-slate-800 dark:text-white">{emg.requester_name}</span>
                                <div className="text-[11px] text-slate-400 font-mono">ID: {emg.donor_id?.slice(0, 8)}...</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Direct Contact Request</span>
                            )}
                          </td>
                          <td className="p-4 text-xs text-slate-600 dark:text-zinc-300 max-w-xs truncate" title={emg.note || ''}>
                            {emg.note || <span className="text-slate-400 italic">—</span>}
                          </td>
                          <td className="p-4 text-xs">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${emg.deleted_by?.includes('admin')
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              }`}>
                              {emg.deleted_by || 'requester'}
                            </span>
                          </td>
                          <td className="p-4 text-xs font-mono text-slate-500 dark:text-zinc-400">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {emg.deleted_at ? new Date(emg.deleted_at).toLocaleString() : '—'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-zinc-850">
                  {safeDeletedEmergencies.map((emg) => (
                    <div key={emg.id} className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-zinc-900/5 transition-colors text-left">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-white text-base block">
                            {getAreaLabel(emg.area, t)}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-zinc-400 font-semibold block">
                            Contact: {emg.contact} {emg.requester_name && `(${emg.requester_name})`}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          {emg.blood_group}
                        </span>
                      </div>

                      {emg.note && (
                        <p className="text-xs text-slate-655 dark:text-zinc-350 bg-slate-50 dark:bg-zinc-900/40 p-2.5 rounded-xl border border-slate-200/20 dark:border-zinc-800/30 leading-normal">
                          {emg.note}
                        </p>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-zinc-800/40 text-[11px]">
                        <span className="text-slate-500 dark:text-zinc-400">
                          Deleted By: <strong className="text-slate-700 dark:text-zinc-200">{emg.deleted_by}</strong>
                        </span>
                        <span className="text-slate-400 font-mono">
                          {emg.deleted_at ? new Date(emg.deleted_at).toLocaleDateString() : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 7: DONOR CARD CUSTOMIZATION & SPONSORSHIP OFFERS          */}
        {/* ============================================================== */}
        {adminTab === 'donor_card' && (
          <div className="space-y-6 animate-fade-in text-left">

            {/* Section 1: Donor Card Content & Design Editor */}
            <div className="glass-panel rounded-2xl p-5 sm:p-7 border border-slate-200/60 dark:border-zinc-800/60 space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/50 dark:border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {language === 'bn' ? 'স্মার্ট ডোনার কার্ড ডিজাইন ও টেক্সট এডিটর' : 'Smart Donor Card Design & Text Editor'}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                      {language === 'bn' ? 'ডোনার কার্ডের সামনের এবং পেছনের টেক্সট, টাইটেল, হটলাইন ও থিম কালার কাস্টমাইজ করুন।' : 'Customize card titles, guidelines, emergency hotlines, and theme colors shown to all donors.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={cardConfigSaving}
                  onClick={async () => {
                    setCardConfigSaving(true);
                    const res = await updateDonorCardConfig(cardConfigForm);
                    if (res.success) {
                      showToast(language === 'bn' ? 'ডোনার কার্ড সফলভাবে আপডেট হয়েছে!' : 'Donor Card updated successfully!', 'success');
                    } else {
                      showToast(res.error?.message || 'Failed to update donor card', 'error');
                    }
                    setCardConfigSaving(false);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{cardConfigSaving ? 'Saving...' : (language === 'bn' ? 'কার্ড সেভ করুন' : 'Save Card Changes')}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    Card Theme & Color Profile
                  </label>
                  <select
                    value={cardConfigForm.card_theme || 'crimson_dark'}
                    onChange={(e) => {
                      const theme = e.target.value;
                      let color = '#dc2626';
                      if (theme === 'royal_navy') color = '#2563eb';
                      else if (theme === 'emerald_prestige') color = '#059669';
                      else if (theme === 'onyx_gold') color = '#d97706';
                      setCardConfigForm({ ...cardConfigForm, card_theme: theme, badge_accent_color: color });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="crimson_dark">Crimson Satin & Obsidian (Red Velvet)</option>
                    <option value="royal_navy">Royal Navy & Sapphire (Executive Blue)</option>
                    <option value="emerald_prestige">Emerald & Forest Gold (Life Prestige)</option>
                    <option value="onyx_gold">Onyx Midnight & 24K Gold (VIP Black)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>Card Accent / Border Color</span>
                    <span className="font-mono text-[10px] text-slate-400">{cardConfigForm.badge_accent_color || '#dc2626'}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cardConfigForm.badge_accent_color || '#dc2626'}
                      onChange={(e) => setCardConfigForm({ ...cardConfigForm, badge_accent_color: e.target.value })}
                      className="w-10 h-9 p-0.5 rounded-xl border border-slate-200 dark:border-zinc-700 cursor-pointer bg-white dark:bg-zinc-800 shrink-0"
                    />
                    <input
                      type="text"
                      value={cardConfigForm.badge_accent_color || '#dc2626'}
                      onChange={(e) => setCardConfigForm({ ...cardConfigForm, badge_accent_color: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-mono uppercase focus:ring-2 focus:ring-emerald-500"
                      placeholder="#dc2626"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    Card Title (Front Header Brand)
                  </label>
                  <input
                    type="text"
                    value={cardConfigForm.card_title || ''}
                    onChange={(e) => setCardConfigForm({ ...cardConfigForm, card_title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                    placeholder="DARUN DONORS"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    Card Subtitle / Network Division
                  </label>
                  <input
                    type="text"
                    value={cardConfigForm.card_subtitle || ''}
                    onChange={(e) => setCardConfigForm({ ...cardConfigForm, card_subtitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                    placeholder="Sylhet Emergency Blood Network"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    Front Badge Seal Label
                  </label>
                  <input
                    type="text"
                    value={cardConfigForm.badge_text || ''}
                    onChange={(e) => setCardConfigForm({ ...cardConfigForm, badge_text: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500"
                    placeholder="Life Saver / Hero Donor"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    Emergency Hotline
                  </label>
                  <input
                    type="text"
                    value={cardConfigForm.emergency_hotline || ''}
                    onChange={(e) => setCardConfigForm({ ...cardConfigForm, emergency_hotline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-mono font-medium focus:ring-2 focus:ring-emerald-500"
                    placeholder="+880 1700-000000"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    Issuing Organization / Registry Board
                  </label>
                  <input
                    type="text"
                    value={cardConfigForm.issue_org || ''}
                    onChange={(e) => setCardConfigForm({ ...cardConfigForm, issue_org: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                    placeholder="Darun Tech"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    Signatory Authority Title
                  </label>
                  <input
                    type="text"
                    value={cardConfigForm.authorized_signatory_title || ''}
                    onChange={(e) => setCardConfigForm({ ...cardConfigForm, authorized_signatory_title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                    placeholder="Medical & Registry Director"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    Verification Portal Website URL
                  </label>
                  <input
                    type="text"
                    value={cardConfigForm.website_url || ''}
                    onChange={(e) => setCardConfigForm({ ...cardConfigForm, website_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                    placeholder="donors.daruntech.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    Card Validity Period (Years)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={cardConfigForm.valid_years || 3}
                    onChange={(e) => setCardConfigForm({ ...cardConfigForm, valid_years: parseInt(e.target.value, 10) || 3 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    Front Side Commendation / Note
                  </label>
                  <textarea
                    rows={2}
                    value={cardConfigForm.front_notes || ''}
                    onChange={(e) => setCardConfigForm({ ...cardConfigForm, front_notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                    placeholder="This card certifies that the bearer is a verified voluntary blood donor dedicated to saving human lives in emergency need."
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    Back Side Terms & Benefit Rules (1 per line)
                  </label>
                  <textarea
                    rows={4}
                    value={cardConfigForm.back_terms || ''}
                    onChange={(e) => setCardConfigForm({ ...cardConfigForm, back_terms: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                    placeholder="1. Non-transferable voluntary donor identity.&#10;2. Present this card or QR code to claim partner benefits.&#10;3. Clinical cooldown of 90 days applies between whole blood donations.&#10;4. Always verify medical eligibility before transfusion."
                  />
                </div>

                {/* Sub-section: Granular Card Label Customization */}
                <div className="md:col-span-2 pt-3 pb-1 border-t border-slate-200/50 dark:border-zinc-800/50">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-1">
                    <span>🔤</span>
                    <span>{language === 'bn' ? 'কার্ডের ভেতরের প্রতিটি লেবেল ও টেক্সট কাস্টমাইজেশন' : 'Granular Card Labels & Static Text Customization'}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                    {language === 'bn'
                      ? 'কার্ডের ভেতরের প্রতিটি ফিল্ডের শিরোনাম ও টেক্সট সরাসরি আপনার ইচ্ছামতো পরিবর্তন করুন।'
                      : 'Every single title, badge, and label on the card can be customized below.'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    Front Donor Title / Sub-header Label
                  </label>
                  <input
                    type="text"
                    value={cardConfigForm.front_tag_label || ''}
                    onChange={(e) => setCardConfigForm({ ...cardConfigForm, front_tag_label: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                    placeholder="REGISTERED LIFE SAVER"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    Verified Status Label
                  </label>
                  <input
                    type="text"
                    value={cardConfigForm.verified_status_text || ''}
                    onChange={(e) => setCardConfigForm({ ...cardConfigForm, verified_status_text: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                    placeholder="Verified Voluntary Donor"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    Blood Group Seal Label
                  </label>
                  <input
                    type="text"
                    value={cardConfigForm.blood_group_label || ''}
                    onChange={(e) => setCardConfigForm({ ...cardConfigForm, blood_group_label: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                    placeholder="GROUP"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    1st Column Label (Area)
                  </label>
                  <input
                    type="text"
                    value={cardConfigForm.district_label || ''}
                    onChange={(e) => setCardConfigForm({ ...cardConfigForm, district_label: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                    placeholder="District / Area"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    2nd Column Label (Donations)
                  </label>
                  <input
                    type="text"
                    value={cardConfigForm.donations_label || ''}
                    onChange={(e) => setCardConfigForm({ ...cardConfigForm, donations_label: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                    placeholder="Total Donations"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    3rd Column Label (Validity)
                  </label>
                  <input
                    type="text"
                    value={cardConfigForm.valid_thru_label || ''}
                    onChange={(e) => setCardConfigForm({ ...cardConfigForm, valid_thru_label: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                    placeholder="Valid Thru"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    QR Verification Code Label
                  </label>
                  <input
                    type="text"
                    value={cardConfigForm.qr_label || ''}
                    onChange={(e) => setCardConfigForm({ ...cardConfigForm, qr_label: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                    placeholder="SCAN TO VERIFY"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    Back Guidelines Header Title
                  </label>
                  <input
                    type="text"
                    value={cardConfigForm.back_guidelines_title || ''}
                    onChange={(e) => setCardConfigForm({ ...cardConfigForm, back_guidelines_title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                    placeholder="Guidelines & Partner Benefits"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    Back Security Stripe Text
                  </label>
                  <input
                    type="text"
                    value={cardConfigForm.security_strip_text || ''}
                    onChange={(e) => setCardConfigForm({ ...cardConfigForm, security_strip_text: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                    placeholder="DARUN DONORS DIGITAL SECURITY STRIP • VERIFIED VOLUNTARY REGISTRY"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    Back Footer Default Privilege Text
                  </label>
                  <input
                    type="text"
                    value={cardConfigForm.footer_sponsor_text || ''}
                    onChange={(e) => setCardConfigForm({ ...cardConfigForm, footer_sponsor_text: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                    placeholder="Partner discounts valid at recognized diagnostic centers and clinics."
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">
                    "Issued by" Prefix Label
                  </label>
                  <input
                    type="text"
                    value={cardConfigForm.issued_by_label || ''}
                    onChange={(e) => setCardConfigForm({ ...cardConfigForm, issued_by_label: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                    placeholder="Issued by:"
                  />
                </div>

                <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="show_qr_toggle"
                      checked={cardConfigForm.show_qr !== 0 && cardConfigForm.show_qr !== false}
                      onChange={(e) => setCardConfigForm({ ...cardConfigForm, show_qr: e.target.checked ? 1 : 0 })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="show_qr_toggle" className="font-bold text-slate-700 dark:text-zinc-300 cursor-pointer text-xs">
                      Enable Digital QR Code Verification on Back
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="show_mag_strip_toggle"
                      checked={cardConfigForm.show_magnetic_strip !== 0 && cardConfigForm.show_magnetic_strip !== false}
                      onChange={(e) => setCardConfigForm({ ...cardConfigForm, show_magnetic_strip: e.target.checked ? 1 : 0 })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="show_mag_strip_toggle" className="font-bold text-slate-700 dark:text-zinc-300 cursor-pointer text-xs">
                      Enable Black Security Magnetic Strip on Back
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Sponsorship Offers & Partner Privileges Manager */}
            <div className="glass-panel rounded-2xl p-5 sm:p-7 border border-slate-200/60 dark:border-zinc-800/60 space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/50 dark:border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {language === 'bn' ? 'স্পন্সরশিপ ও পার্টনার অফার ম্যানেজমেন্ট' : 'Sponsorship Offers & Partner Benefits'}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
                      {language === 'bn' ? 'হাসপাতাল, ডায়াগনস্টিক সেন্টার বা ফার্মেসি পার্টনারদের ডিসকাউন্ট অফার যুক্ত ও পরিচালনা করুন।' : 'Add clinics, diagnostic centers, and pharmacies offering discounts to donors.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingOffer(null);
                    setOfferForm({
                      sponsor_name: '',
                      sponsor_logo: '',
                      title: '',
                      discount_text: '',
                      description: '',
                      promo_code: '',
                      valid_until: 'Dec 31, 2026',
                      category: 'healthcare',
                      is_active: true
                    });
                    setShowAddOfferModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'bn' ? 'নতুন অফার যুক্ত করুন' : 'Add New Offer'}</span>
                </button>
              </div>

              {/* Offers Table / Grid */}
              {cardOffersList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  {language === 'bn' ? 'কোনো অফার পাওয়া যায়নি। নতুন অফার যুক্ত করতে উপরের বাটনে ক্লিক করুন।' : 'No sponsor offers configured yet. Click above to add your first partner offer.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {cardOffersList.map((off) => (
                    <div
                      key={off.id}
                      className="p-4 rounded-2xl bg-white dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 shadow-sm flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            {off.sponsor_name}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${off.is_active
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-200 text-slate-600 dark:bg-zinc-700 dark:text-zinc-400'
                            }`}>
                            {off.is_active ? 'Active' : 'Hidden'}
                          </span>
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                          {off.title}
                        </h4>

                        <div className="inline-block px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 font-black text-xs">
                          {off.discount_text}
                        </div>

                        {off.description && (
                          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                            {off.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-zinc-700/60 flex items-center justify-between text-xs">
                        <div className="font-mono text-[11px] text-slate-400">
                          Code: <strong className="text-slate-700 dark:text-zinc-200">{off.promo_code || 'Card Only'}</strong>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingOffer(off);
                              setOfferForm({
                                sponsor_name: off.sponsor_name,
                                sponsor_logo: off.sponsor_logo || '',
                                title: off.title,
                                discount_text: off.discount_text,
                                description: off.description || '',
                                promo_code: off.promo_code || '',
                                valid_until: off.valid_until || '',
                                category: off.category || 'healthcare',
                                is_active: !!off.is_active
                              });
                              setShowAddOfferModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white bg-slate-100 dark:bg-zinc-700/60 cursor-pointer"
                            title="Edit Offer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDeleteOffer({
                                id: off.id,
                                name: off.sponsor_name,
                                title: off.title
                              });
                            }}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                            title="Delete Offer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Offer Modal (Create / Edit) Rendered via createPortal to span 100vw cleanly */}
            {showAddOfferModal && typeof document !== 'undefined' && createPortal(
              <div
                className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in"
                onClick={() => setShowAddOfferModal(false)}
              >
                <div
                  className="relative w-full max-w-lg rounded-3xl p-6 sm:p-7 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xl space-y-5 animate-scale-up overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-zinc-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-xs">
                        <Tag className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-900 dark:text-white">
                          {editingOffer ? 'Edit Sponsor Offer' : 'Add Sponsorship Offer'}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                          Configure partner discount benefits for voluntary donors
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddOfferModal(false)}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (editingOffer) {
                        const res = await updateDonorCardOffer(editingOffer.id, offerForm);
                        if (res.success) {
                          showToast('Offer updated successfully', 'success');
                          setShowAddOfferModal(false);
                          fetchCardData();
                        } else {
                          showToast(res.error?.message || 'Update failed', 'error');
                        }
                      } else {
                        const res = await createDonorCardOffer(offerForm);
                        if (res.success) {
                          showToast('New offer created!', 'success');
                          setShowAddOfferModal(false);
                          fetchCardData();
                        } else {
                          showToast(res.error?.message || 'Create failed', 'error');
                        }
                      }
                    }}
                    className="space-y-4 text-xs"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700 dark:text-zinc-300">Sponsor / Partner Name *</label>
                        <input
                          type="text"
                          required
                          value={offerForm.sponsor_name}
                          onChange={(e) => setOfferForm({ ...offerForm, sponsor_name: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                          placeholder="e.g. Popular Diagnostic"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700 dark:text-zinc-300">Discount Badge Text *</label>
                        <input
                          type="text"
                          required
                          value={offerForm.discount_text}
                          onChange={(e) => setOfferForm({ ...offerForm, discount_text: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                          placeholder="e.g. 25% OFF / FREE"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-zinc-300">Offer Title *</label>
                      <input
                        type="text"
                        required
                        value={offerForm.title}
                        onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                        placeholder="e.g. Complete Blood Count & Routine Tests"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700 dark:text-zinc-300">Details / How to Claim</label>
                      <textarea
                        rows={2}
                        value={offerForm.description}
                        onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                        placeholder="Present this donor card at billing reception to claim discount."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700 dark:text-zinc-300">Promo Code (Optional)</label>
                        <input
                          type="text"
                          value={offerForm.promo_code}
                          onChange={(e) => setOfferForm({ ...offerForm, promo_code: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                          placeholder="e.g. DONOR25"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-700 dark:text-zinc-300">Valid Until</label>
                        <input
                          type="text"
                          value={offerForm.valid_until}
                          onChange={(e) => setOfferForm({ ...offerForm, valid_until: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                          placeholder="e.g. Dec 31, 2026"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 pt-1">
                      <input
                        type="checkbox"
                        id="is_active_check"
                        checked={offerForm.is_active}
                        onChange={(e) => setOfferForm({ ...offerForm, is_active: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                      />
                      <label htmlFor="is_active_check" className="font-bold text-slate-700 dark:text-zinc-300 cursor-pointer">
                        Active & visible to all registered donors
                      </label>
                    </div>

                    <div className="flex gap-2.5 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
                      <button
                        type="button"
                        onClick={() => setShowAddOfferModal(false)}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold shadow-md shadow-amber-500/25 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        {editingOffer ? 'Save Offer' : 'Create Offer'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>,
              document.body
            )}

          </div>
        )}

        {adminTab === 'activity_logs' && (
          <div className="space-y-4">
            {/* Header with Search and Filter */}
            <div className="p-5 border-b border-slate-200/50 dark:border-zinc-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-base">
                    {language === 'bn' ? 'ব্যবহারকারীদের লাইভ কার্যক্রমের লগ' : 'User Activity & Audit Logs'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                    {language === 'bn'
                      ? 'নিবন্ধন, লগইন, প্রোফাইল পরিবর্তন, রক্তদান ও অনুরোধের প্রতিটি কার্যক্রমের ট্র্যাকিং'
                      : 'Real-time trace of registrations, Google/password logins, profile updates, and emergency posts'}
                  </p>
                </div>
              </div>

              {/* Refresh, View Switcher & Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Table / Grid Switcher */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleAdminViewModeChange('table')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${adminViewMode === 'table'
                      ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                      }`}
                    title={language === 'bn' ? 'টেবিল ভিউ' : 'Table View'}
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'টেবিল' : 'Table'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdminViewModeChange('grid')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${adminViewMode === 'grid'
                      ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
                      }`}
                    title={language === 'bn' ? 'গ্রিড ভিউ' : 'Grid View'}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'গ্রিড' : 'Grid'}</span>
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={activitySearchQuery}
                    onChange={(e) => setActivitySearchQuery(e.target.value)}
                    placeholder={language === 'bn' ? 'নাম, ফোন বা ইমেইল খুঁজুন...' : 'Search name, phone, email...'}
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-800/70 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44 sm:w-52"
                  />
                </div>

                <select
                  value={activityTypeFilter}
                  onChange={(e) => setActivityTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-800/70 text-xs font-semibold text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">{language === 'bn' ? 'সব কার্যক্রম' : 'All Activities'}</option>
                  <option value="login">{language === 'bn' ? 'লগইন' : 'Logins'}</option>
                  <option value="register">{language === 'bn' ? 'নিবন্ধন' : 'Registrations'}</option>
                  <option value="profile_update">{language === 'bn' ? 'প্রোফাইল আপডেট' : 'Profile Updates'}</option>
                  <option value="donation">{language === 'bn' ? 'রক্তদান' : 'Donations'}</option>
                  <option value="emergency">{language === 'bn' ? 'জরুরি অনুরোধ' : 'Emergency Requests'}</option>
                  <option value="admin_update">{language === 'bn' ? 'অ্যাডমিন আপডেট' : 'Admin Modifications'}</option>
                </select>

                <button
                  type="button"
                  onClick={() => fetchActivityLogs()}
                  disabled={activityLogsLoading}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Refresh Activity Logs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${activityLogsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Error banner */}
            {activityLogsError && (
              <div className="mx-5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{activityLogsError}</span>
              </div>
            )}

            {/* Table or Empty State */}
            {(() => {
              const filtered = activityLogs.filter(log => {
                const q = activitySearchQuery.trim().toLowerCase();
                const matchesSearch = !q ||
                  (log.user_name && log.user_name.toLowerCase().includes(q)) ||
                  (log.user_phone && log.user_phone.toLowerCase().includes(q)) ||
                  (log.user_email && log.user_email.toLowerCase().includes(q)) ||
                  (log.description && log.description.toLowerCase().includes(q));

                const matchesType = !activityTypeFilter ||
                  (log.activity_type && log.activity_type.toLowerCase().includes(activityTypeFilter.toLowerCase()));

                return matchesSearch && matchesType;
              });

              const totalActivityPages = Math.max(1, Math.ceil(filtered.length / activityItemsPerPage));
              const currentActivityPage = Math.min(activityPage, totalActivityPages);
              const startIndex = (currentActivityPage - 1) * activityItemsPerPage;
              const paginatedLogs = filtered.slice(startIndex, startIndex + activityItemsPerPage);

              if (activityLogsLoading && activityLogs.length === 0) {
                return (
                  <div className="p-12 text-center text-sm text-slate-500 dark:text-zinc-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                    <span>Loading activity audit logs...</span>
                  </div>
                );
              }

              if (filtered.length === 0) {
                return (
                  <div className="p-12 text-center text-sm text-slate-500 dark:text-zinc-400">
                    <Activity className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-2 opacity-60" />
                    <p className="font-bold">No user activity logs found.</p>
                    <p className="text-xs text-slate-400 mt-1">Activities are automatically logged when donors register, sign in, donate, or post requests.</p>
                  </div>
                );
              }

              const getActivityBadge = (type) => {
                const t = (type || '').toLowerCase();
                if (t.includes('register')) {
                  return { label: 'REGISTER', bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' };
                }
                if (t.includes('login')) {
                  return { label: 'LOGIN', bg: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/25' };
                }
                if (t.includes('donation')) {
                  return { label: 'DONATION', bg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25' };
                }
                if (t.includes('emergency')) {
                  return { label: 'EMERGENCY', bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25' };
                }
                if (t.includes('admin')) {
                  return { label: 'ADMIN EDIT', bg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25' };
                }
                return { label: type.toUpperCase() || 'EVENT', bg: 'bg-slate-500/15 text-slate-600 dark:text-zinc-300 border-slate-500/25' };
              };

              // Helper: extract genuine changes from metadata (only fields that actually changed)
              const extractGenuineChanges = (meta) => {
                if (!meta) return [];
                let parsed = meta;
                if (typeof parsed === 'string') {
                  try { parsed = JSON.parse(parsed); } catch { return []; }
                }
                if (!parsed || !parsed.changes || typeof parsed.changes !== 'object') return [];

                return Object.entries(parsed.changes)
                  .filter(([_, val]) => {
                    if (val && typeof val === 'object' && ('from' in val || 'to' in val)) {
                      const fromVal = String(val.from ?? '').trim();
                      const toVal = String(val.to ?? '').trim();
                      return fromVal !== toVal;
                    }
                    return false;
                  })
                  .map(([field, val]) => ({
                    field,
                    from: String(val.from || 'none'),
                    to: String(val.to || 'none')
                  }));
              };

              return (
                <div className="animate-fade-in">
                  {adminViewMode === 'table' ? (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse table-fixed">
                          <thead>
                            <tr className="border-b border-slate-200/50 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-900/30 text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
                              <th className="p-4 w-[18%]">Timestamp</th>
                              <th className="p-4 w-[24%]">User</th>
                              <th className="p-4 w-[15%]">Event Type</th>
                              <th className="p-4 w-[31%]">Description & Context</th>
                              <th className="p-4 w-[12%]">IP Address</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/50 dark:divide-zinc-800/50 text-slate-700 dark:text-zinc-300 font-medium">
                            {paginatedLogs.map((log) => {
                              const badge = getActivityBadge(log.activity_type);
                              const genuineChanges = extractGenuineChanges(log.metadata);
                              return (
                                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                                  <td className="p-4 text-xs font-bold text-slate-500 dark:text-zinc-400">
                                    <span className="block text-slate-900 dark:text-white">
                                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                    <span className="text-[11px] opacity-75">
                                      {new Date(log.created_at).toLocaleDateString()}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <span className="font-extrabold text-slate-900 dark:text-white block truncate">
                                      {log.user_name || 'Guest / Unregistered'}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium block">
                                      {log.user_phone || log.user_email || '—'}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${badge.bg}`}>
                                      {badge.label}
                                    </span>
                                  </td>
                                  <td className="p-4 text-xs text-slate-800 dark:text-zinc-200">
                                    <span className="font-semibold block leading-relaxed">{log.description}</span>
                                    {genuineChanges.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                                        {genuineChanges.map((change) => (
                                          <span key={change.field} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium text-[11px] border border-amber-500/20">
                                            <span className="font-bold capitalize">{change.field.replace(/_/g, ' ')}:</span>
                                            <span className="line-through text-slate-400 dark:text-zinc-500">{change.from}</span>
                                            <span>→</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{change.to}</span>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-4 text-xs font-mono">
                                    {log.ip_address ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-750">
                                        {log.ip_address}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 dark:text-zinc-600">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Stack View */}
                      <div className="md:hidden divide-y divide-slate-100 dark:divide-zinc-850">
                        {paginatedLogs.map((log) => {
                          const badge = getActivityBadge(log.activity_type);
                          const genuineChanges = extractGenuineChanges(log.metadata);
                          return (
                            <div key={log.id} className="p-4 space-y-2 text-left hover:bg-slate-50/50 dark:hover:bg-zinc-900/5 transition-colors">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${badge.bg}`}>
                                  {badge.label}
                                </span>
                                <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                                  {new Date(log.created_at).toLocaleString()}
                                </span>
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                                  {log.user_name || 'Guest / Unregistered'}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-zinc-400 font-semibold block">
                                  {log.user_phone || log.user_email || '—'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 dark:text-zinc-300 leading-normal bg-slate-50 dark:bg-zinc-800/40 p-2 rounded-xl border border-slate-100 dark:border-zinc-800 font-medium">
                                {log.description}
                              </p>
                              {genuineChanges.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {genuineChanges.map((change) => (
                                    <span key={change.field} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium text-[10px] border border-amber-500/20">
                                      <span className="font-bold capitalize">{change.field.replace(/_/g, ' ')}:</span>
                                      <span className="line-through text-slate-400 dark:text-zinc-500">{change.from}</span>
                                      <span>→</span>
                                      <span className="font-bold text-slate-900 dark:text-white">{change.to}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                              {log.ip_address && (
                                <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 block">
                                  IP: {log.ip_address}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    /* GRID VIEW FOR ACTIVITY LOGS */
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                      {paginatedLogs.map((log) => {
                        const badge = getActivityBadge(log.activity_type);
                        const genuineChanges = extractGenuineChanges(log.metadata);
                        return (
                          <div
                            key={log.id}
                            className="glass-panel p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between text-left space-y-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${badge.bg}`}>
                                {badge.label}
                              </span>
                              <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                                {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            </div>

                            <div className="space-y-0.5">
                              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                                {log.user_name || 'Guest / Unregistered'}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                                {log.user_phone || log.user_email || '—'}
                              </p>
                            </div>

                            <div className="bg-slate-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/60 space-y-2">
                              <p className="text-xs text-slate-700 dark:text-zinc-300 font-medium leading-relaxed">
                                {log.description}
                              </p>
                              {genuineChanges.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-200/50 dark:border-zinc-700/50">
                                  {genuineChanges.map((change) => (
                                    <span key={change.field} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium text-[10px] border border-amber-500/20">
                                      <span className="font-bold capitalize">{change.field.replace(/_/g, ' ')}:</span>
                                      <span className="line-through text-slate-400 dark:text-zinc-500">{change.from}</span>
                                      <span>→</span>
                                      <span className="font-bold text-slate-900 dark:text-white">{change.to}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 dark:text-zinc-500 border-t border-slate-100 dark:border-zinc-800/80">
                              <span className="font-mono">
                                {log.ip_address ? `IP: ${log.ip_address}` : 'No IP logged'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Activity Logs Pagination Controls */}
                  {totalActivityPages > 1 && (
                    <div className="flex justify-between items-center p-5 border-t border-slate-200/50 dark:border-zinc-800/50 animate-fade-in">
                      <button
                        type="button"
                        onClick={() => setActivityPage(prev => Math.max(1, prev - 1))}
                        disabled={currentActivityPage === 1}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        {t('previousPage')}
                      </button>
                      <span className="text-xs text-slate-500 dark:text-zinc-400 font-bold">
                        {t('pageIndicator', { current: currentActivityPage, total: totalActivityPages })}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActivityPage(prev => Math.min(totalActivityPages, prev + 1))}
                        disabled={currentActivityPage === totalActivityPages}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {t('nextPage')}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Edit Donor Details Modal rendered via createPortal */}
      {editingDonor && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={() => setEditingDonor(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl p-6 sm:p-7 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xl space-y-5 animate-scale-up overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-xs">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    Edit Donor Details
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Update profile, contact, donations count and status
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDonor(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 bg-slate-100 dark:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDonorDetails} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editDonorForm.name}
                    onChange={(e) => setEditDonorForm({ ...editDonorForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editDonorForm.phone}
                    onChange={(e) => setEditDonorForm({ ...editDonorForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">Blood Group *</label>
                  <select
                    value={editDonorForm.blood_group}
                    onChange={(e) => setEditDonorForm({ ...editDonorForm, blood_group: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    {BLOOD_GROUPS.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">District / Upazila</label>
                  <select
                    value={editDonorForm.area}
                    onChange={(e) => setEditDonorForm({ ...editDonorForm, area: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="">Select Area</option>
                    {DISTRICT_AREAS.map(dist => (
                      <optgroup key={dist.id} label={dist.name}>
                        {dist.upazilas.map(upz => (
                          <option key={upz} value={upz}>{upz}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">Total Donations</label>
                  <input
                    type="number"
                    min="0"
                    value={editDonorForm.total_donations}
                    onChange={(e) => setEditDonorForm({ ...editDonorForm, total_donations: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">Last Donation</label>
                  <input
                    type="date"
                    value={editDonorForm.last_donation_date}
                    onChange={(e) => setEditDonorForm({ ...editDonorForm, last_donation_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">Date of Birth</label>
                  <input
                    type="date"
                    value={editDonorForm.dob}
                    onChange={(e) => setEditDonorForm({ ...editDonorForm, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-zinc-300">Email Address (Optional)</label>
                <input
                  type="email"
                  value={editDonorForm.email}
                  onChange={(e) => setEditDonorForm({ ...editDonorForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  placeholder="donor@example.com"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="donor_avail_check"
                  checked={editDonorForm.is_available}
                  onChange={(e) => setEditDonorForm({ ...editDonorForm, is_available: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                />
                <label htmlFor="donor_avail_check" className="font-bold text-slate-700 dark:text-zinc-300 cursor-pointer">
                  Available for emergency donations right now
                </label>
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setEditingDonor(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveDonorLoading}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold shadow-md shadow-amber-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {saveDonorLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Emergency Request Details Modal rendered via createPortal */}
      {editingEmergency && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={() => setEditingEmergency(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl p-6 sm:p-7 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xl space-y-5 animate-scale-up overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shadow-xs">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    Edit Emergency Request
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Update required group, hospital/area, contact phone & status
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingEmergency(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 bg-slate-100 dark:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEmergencyDetails} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">Blood Group Needed *</label>
                  <select
                    value={editEmergencyForm.blood_group}
                    onChange={(e) => setEditEmergencyForm({ ...editEmergencyForm, blood_group: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  >
                    {BLOOD_GROUPS.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={editEmergencyForm.contact}
                    onChange={(e) => setEditEmergencyForm({ ...editEmergencyForm, contact: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">Hospital / Area</label>
                  <select
                    value={editEmergencyForm.area}
                    onChange={(e) => setEditEmergencyForm({ ...editEmergencyForm, area: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  >
                    <option value="">Select Area / Upazila</option>
                    {DISTRICT_AREAS.map(dist => (
                      <optgroup key={dist.id} label={dist.name}>
                        {dist.upazilas.map(upz => (
                          <option key={upz} value={upz}>{upz}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-zinc-300">Status</label>
                  <select
                    value={editEmergencyForm.status}
                    onChange={(e) => setEditEmergencyForm({ ...editEmergencyForm, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  >
                    <option value="needed">Urgent Needed</option>
                    <option value="responded">Donor Responded</option>
                    <option value="fulfilled">Fulfilled / Done</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-zinc-300">Note / Hospital Details</label>
                <textarea
                  rows={3}
                  value={editEmergencyForm.note}
                  onChange={(e) => setEditEmergencyForm({ ...editEmergencyForm, note: e.target.value })}
                  placeholder="e.g. Osmani Medical College, Bed 24, Contact relative..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                />
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setEditingEmergency(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveEmergencyLoading}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold shadow-md shadow-rose-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {saveEmergencyLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
