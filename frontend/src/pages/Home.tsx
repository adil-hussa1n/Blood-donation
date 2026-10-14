import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, X, Heart, PlusCircle, AlertTriangle, ArrowRight, Flame, Phone, MessageCircle, CheckCircle2, Clock, ChevronLeft, ChevronRight, LayoutGrid, LayoutList, Navigation, Sparkles } from 'lucide-react';
import { useApp, AREAS, DISTRICT_AREAS, getDistrictForArea, getDistrictBadge, BLOOD_GROUPS, calculateDaysSince, getDonorBadge, getDonorBadgeLabel, normalizeDonor, getAreaLabel } from '../context/AppContext';
import QuickStats from '../components/QuickStats';
import DonorCard from '../components/DonorCard';
import { Donor, EmergencyRequest } from '../types';

export default function Home() {
  const { donors, emergencyRequests, currentDonor, loading, error, language, t } = useApp();
  const [filterOpen, setFilterOpen] = useState(false);
  
  // Active applied filters (used for rendering the list)
  const [appliedBloodGroup, setAppliedBloodGroup] = useState('');
  const [appliedArea, setAppliedArea] = useState(currentDonor?.area || '');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');

  // Local filter form buffers (held before user clicks Search button)
  const [localBloodGroup, setLocalBloodGroup] = useState('');
  const [localArea, setLocalArea] = useState(currentDonor?.area || '');
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  // Auto-detect registered user address for area filter
  useEffect(() => {
    if (currentDonor?.area && !appliedArea && !localArea) {
      setLocalArea(currentDonor.area);
      setAppliedArea(currentDonor.area);
    }
  }, [currentDonor?.area]);
  
  // Security: track revealed contact numbers
  const [revealedContacts, setRevealedContacts] = useState<Record<string, boolean>>({});

  // Table vs Grid View State with localStorage persistence
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bloodify_donors_view');
      if (saved === 'table' || saved === 'grid') return saved;
    }
    return 'table';
  });

  const handleViewModeChange = (mode: 'table' | 'grid') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bloodify_donors_view', mode);
    }
  };

  const maskPhone = (phone: string) => {
    if (!phone) return '';
    const p = phone.trim();
    return p.slice(0, 5) + '*****' + p.slice(-1);
  };

  // Form submission / search trigger
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Apply local state buffers to active applied filters
    setAppliedBloodGroup(localBloodGroup);
    setAppliedArea(localArea);
    setAppliedSearchQuery(localSearchQuery);
    
    // Smoothly scroll down to the directory title
    setTimeout(() => {
      const element = document.getElementById('donors-directory');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // Reset all filters
  const resetFilters = () => {
    setLocalBloodGroup('');
    setLocalArea('');
    setLocalSearchQuery('');
    
    setAppliedBloodGroup('');
    setAppliedArea('');
    setAppliedSearchQuery('');
  };

  // Filtered Donors List (computed using applied filters)
  const filteredDonors = useMemo(() => {
    return (donors || [])
      .map(normalizeDonor)
      .filter((donor: Donor) => {
        const matchBlood = appliedBloodGroup ? donor.blood_group === appliedBloodGroup : true;
        const matchArea = appliedArea ? donor.area === appliedArea : true;
        const matchSearch = appliedSearchQuery
          ? donor.name.toLowerCase().includes(appliedSearchQuery.toLowerCase()) ||
            donor.phone.includes(appliedSearchQuery)
          : true;
        return matchBlood && matchArea && matchSearch;
      });
  }, [donors, appliedBloodGroup, appliedArea, appliedSearchQuery]);

  const [currentPage, setCurrentPage] = useState(1);

  // Reset page to 1 when filters are changed
  useEffect(() => {
    setCurrentPage(1);
  }, [appliedBloodGroup, appliedArea, appliedSearchQuery]);

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredDonors.length / itemsPerPage));
  const paginatedDonors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDonors.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDonors, currentPage]);

  // Determine effective user location for prioritization (logged in donor area, or filtered area)
  const userLocationArea = currentDonor?.area || appliedArea || localArea || '';
  const userDistrictId = useMemo(() => {
    return userLocationArea ? getDistrictForArea(userLocationArea).id : null;
  }, [userLocationArea]);

  // Recent Emergency Requests: prioritize by user location (exact upazila match > same district > others), then by recency
  const recentRequests = useMemo(() => {
    if (!emergencyRequests || emergencyRequests.length === 0) return [];
    
    const sorted = [...(emergencyRequests as EmergencyRequest[])].sort((a, b) => {
      if (userLocationArea) {
        const aExact = a.area && a.area.toLowerCase() === userLocationArea.toLowerCase() ? 2 : 0;
        const bExact = b.area && b.area.toLowerCase() === userLocationArea.toLowerCase() ? 2 : 0;
        
        const aDistrict = userDistrictId && getDistrictForArea(a.area).id === userDistrictId ? 1 : 0;
        const bDistrict = userDistrictId && getDistrictForArea(b.area).id === userDistrictId ? 1 : 0;

        const aScore = Math.max(aExact, aDistrict);
        const bScore = Math.max(bExact, bDistrict);

        if (aScore !== bScore) {
          return bScore - aScore; // Highest location score first
        }
      }

      // Secondary: Most recent first
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

    return sorted.slice(0, 3);
  }, [emergencyRequests, userLocationArea, userDistrictId]);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-red-600 to-rose-700 dark:from-red-950 dark:to-zinc-950 text-white p-5 sm:p-8 md:p-12 shadow-xl shadow-red-500/10">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-red-400/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="max-w-3xl relative z-10 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold uppercase tracking-wider text-red-200">
            <Heart className="w-3.5 h-3.5 fill-current text-red-300 animate-pulse" />
            {t('empoweringCommunity')}
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight leading-tight">
            {language === 'en' ? 'Every Blood Donor is a ' : 'প্রতিটি রক্তদাতাই একজন '}<span className="text-rose-200 dark:text-red-400">{t('lifesaverWord')}</span>
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg text-slate-100 dark:text-zinc-300 font-medium leading-relaxed max-w-2xl">
            {t('heroDescText')}
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
            <Link
              to="/register"
              className="w-full sm:w-auto bg-white hover:bg-slate-50 text-red-600 font-bold px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <PlusCircle className="w-5 h-5" />
              {t('registerAsDonorButton')}
            </Link>
            <Link
              to="/emergency"
              className="w-full sm:w-auto bg-red-500/20 hover:bg-red-500/30 text-white border border-white/20 font-bold px-6 py-3 rounded-2xl backdrop-blur-sm active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Flame className="w-5 h-5 text-red-300 fill-current animate-pulse" />
              {t('postRequestButton')}
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <QuickStats donors={donors} emergencyRequests={emergencyRequests} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        
        {/* Left Filters Panel */}
        <div className="lg:col-span-1 space-y-3 lg:space-y-6">
          {/* Mobile filter toggle */}
          <button
            type="button"
            onClick={() => setFilterOpen(prev => !prev)}
            className="lg:hidden w-full flex items-center justify-between px-4 py-3 glass-panel rounded-2xl border border-slate-200/50 dark:border-zinc-800/50 text-sm font-bold text-slate-700 dark:text-zinc-300 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4 text-red-500" />
              {t('filterDonorsTitle')}
              {(appliedBloodGroup || appliedArea || appliedSearchQuery) && (
                <span className="w-2 h-2 bg-red-500 rounded-full" />
              )}
            </span>
            <span className={`text-slate-400 text-xs transition-transform duration-200 ${filterOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>
          <form 
            onSubmit={handleSearchSubmit}
            className={`glass-panel rounded-2xl p-4 sm:p-6 border border-slate-200/50 dark:border-zinc-800/50 text-left space-y-5 ${filterOpen ? 'block' : 'hidden'} lg:block`}
          >
            <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-zinc-800/50 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm md:text-base">
                <Search className="w-4 h-4 text-red-500" /> {t('filterDonorsTitle')}
              </h3>
              {(localBloodGroup || localArea || localSearchQuery || appliedBloodGroup || appliedArea || appliedSearchQuery) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-semibold text-red-500 hover:text-red-650 flex items-center gap-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" /> {t('clearButton')}
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Search input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  {t('searchByNamePhoneLabel')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('searchQueryPlaceholder')}
                    value={localSearchQuery}
                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all dark:text-white"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Area select */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    {t('selectAreaLabel')}
                  </label>
                  {currentDonor?.area && localArea === currentDonor.area && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-fade-in">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      {language === 'bn' ? 'স্বয়ংক্রিয় সনাক্তকৃত' : 'Auto-detected'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <select
                    value={localArea}
                    onChange={(e) => setLocalArea(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all dark:text-white appearance-none cursor-pointer"
                  >
                    <option value="">{t('allBeanibazarAreas')}</option>
                    {DISTRICT_AREAS.map((district) => (
                      <optgroup
                        key={district.id}
                        label={`📍 ${language === 'bn' ? district.nameBn : district.name}`}
                        className={district.color.optGroupClass}
                      >
                        {district.upazilas.map((area) => (
                          <option key={area} value={area} className="text-slate-800 dark:text-zinc-200 font-normal">
                            {getAreaLabel(area, t)} {currentDonor?.area === area ? (language === 'bn' ? '⭐ (আপনার এলাকা)' : '⭐ (Your Area)') : ''}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
              </div>

              {/* Quick Blood Group pills */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  {t('bloodGroup')}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {BLOOD_GROUPS.map((group) => {
                    const active = localBloodGroup === group;
                    return (
                      <button
                        type="button"
                        key={group}
                        onClick={() => setLocalBloodGroup(active ? '' : group)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          active
                            ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/10'
                            : 'border-slate-200 dark:border-zinc-800 hover:border-red-500 dark:hover:border-red-500/50 bg-slate-50/30 dark:bg-zinc-900/30 text-slate-700 dark:text-zinc-300'
                        }`}
                      >
                        {group}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Search Submit Button */}
            <button
              type="submit"
              className="w-full bg-red-500 hover:bg-red-650 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md hover:shadow-red-500/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-xs cursor-pointer mt-4"
            >
              <Search className="w-4 h-4" />
              {t('searchButton')}
            </button>
          </form>
        </div>

        {/* Right Donors List + Emergency feed */}
        <div className="lg:col-span-3 space-y-8 text-left">
          
          {/* Recent Emergencies Highlight banner */}
          {recentRequests.length > 0 && (
            <div className="glass-panel border-red-500/20 dark:border-red-500/20 rounded-3xl p-5 border relative overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-500 fill-current animate-bounce" />
                  {t('recentEmergencyRequestsTitle')}
                </h3>
                <Link
                  to="/emergency"
                  className="text-xs font-semibold text-red-500 hover:text-red-650 flex items-center gap-1 group"
                >
                  {t('viewAllRequestsLink')} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentRequests.map((req) => {
                  const isExactLocation = !!(userLocationArea && req.area && req.area.toLowerCase() === userLocationArea.toLowerCase());
                  const isSameDistrict = !isExactLocation && !!(userDistrictId && getDistrictForArea(req.area).id === userDistrictId);
                  const distBadge = getDistrictBadge(req.area, language);

                  return (
                    <div 
                      key={req.id} 
                      className={`relative rounded-xl p-4 flex flex-col justify-between transition-all hover:scale-[1.02] duration-300 ${
                        isExactLocation 
                          ? 'bg-red-500/10 dark:bg-red-500/15 border-2 border-red-500 shadow-md shadow-red-500/10 ring-1 ring-red-500/30' 
                          : isSameDistrict
                            ? 'bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30 dark:border-amber-500/30'
                            : 'bg-red-500/5 dark:bg-red-500/5 border border-red-500/10 dark:border-red-500/15 hover:border-red-500/30'
                      }`}
                    >
                      {/* Proximity / Priority Ribbon */}
                      {isExactLocation && (
                        <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 border border-white/20">
                          <Navigation className="w-2.5 h-2.5 fill-current animate-pulse" />
                          {t('nearYouBadge')}
                        </div>
                      )}
                      {isSameDistrict && (
                        <div className="absolute -top-2.5 right-3 bg-amber-600 dark:bg-amber-500 text-white text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          {t('sameDistrictBadge')}
                        </div>
                      )}

                      <div>
                        <div className="flex justify-between items-start mb-2 pt-0.5">
                          <span className="font-black text-red-500 text-xl leading-none tracking-tight">{req.blood_group}</span>
                          <div className="flex flex-col items-end gap-1">
                            <span 
                              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider border ${distBadge.color.bg} ${distBadge.color.text} ${distBadge.color.border}`}
                            >
                              {distBadge.label}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold truncate max-w-[130px]">
                              {getAreaLabel(req.area, t)}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-zinc-200 line-clamp-2 mb-2 font-medium">
                          {req.note || t('noDescriptionProvided')}
                        </p>
                        <span className="text-[11px] text-slate-550 dark:text-zinc-450 block mb-3 font-semibold">
                          Contact: {revealedContacts[req.id] ? req.contact : maskPhone(req.contact)}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {!revealedContacts[req.id] ? (
                          <button
                            onClick={() => setRevealedContacts(prev => ({ ...prev, [req.id]: true }))}
                            className="text-[10px] bg-red-500 hover:bg-red-600 text-white font-extrabold text-center py-1.5 px-2 rounded-lg flex-1 transition-all shadow-sm cursor-pointer"
                          >
                            {t('showContact')}
                          </button>
                        ) : (
                          <>
                            <a 
                              href={`tel:${req.contact}`} 
                              className="text-[10px] bg-red-500 hover:bg-red-650 text-white font-extrabold text-center py-1.5 px-2 rounded-lg flex-1 transition-colors shadow-sm flex items-center justify-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              {t('call')}
                            </a>
                            <a 
                              href={`https://wa.me/${req.contact.startsWith('0') ? '88' + req.contact : req.contact}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-center py-1.5 px-2 rounded-lg flex-1 transition-colors shadow-sm flex items-center justify-center gap-1"
                            >
                              <MessageCircle className="w-3 h-3" />
                              {t('whatsapp')}
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Donors Table Section */}
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
              <h2 id="donors-directory" className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 scroll-mt-20">
                {t('showingResults')}
                <span className="text-sm font-semibold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-900 px-2.5 py-0.5 rounded-full border border-slate-200/50 dark:border-zinc-800/50">
                  {filteredDonors.length} {t('foundSuffix')}
                </span>
              </h2>

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
                  title={language === 'bn' ? 'টেবিল ভিউ' : 'Table View'}
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
                  title={language === 'bn' ? 'গ্রিড ভিউ' : 'Grid View'}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'গ্রিড' : 'Grid'}</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-950 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Loader / Skeletons */}
            {loading ? (
              <div className="glass-panel border rounded-2xl overflow-hidden animate-pulse">
                <div className="h-12 bg-slate-100 dark:bg-zinc-900 w-full" />
                <div className="p-4 space-y-4">
                  {[...Array(5)].map((_, idx) => (
                    <div key={idx} className="flex gap-4 items-center justify-between">
                      <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/4" />
                      <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-12" />
                      <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-1/5" />
                      <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-16" />
                      <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded w-28" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {filteredDonors.length === 0 ? (
                  <div className="glass-panel rounded-2xl p-10 text-center border max-w-md mx-auto space-y-4 mt-8">
                    <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
                      <Heart className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">{t('noDonorsFoundTitle')}</h3>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">
                      {t('noDonorsFoundDesc')}
                    </p>
                    <div className="flex gap-2 justify-center">
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="border border-slate-200 dark:border-zinc-800 text-xs font-semibold px-4 py-2 rounded-xl text-slate-700 dark:text-zinc-300 hover:border-red-500 transition-colors cursor-pointer"
                      >
                        {t('resetFiltersButton')}
                      </button>
                      <Link
                        to="/register"
                        className="bg-red-500 hover:bg-red-650 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-md shadow-red-500/10"
                      >
                        {t('registerDonorLink')}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* TABLE VIEW */}
                    {viewMode === 'table' ? (
                      <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm animate-fade-in">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm border-collapse min-w-[860px]">
                            <thead>
                              <tr className="border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
                                <th className="py-3.5 px-4 w-[18%]">{t('donorInfoLabel')}</th>
                                <th className="py-3.5 px-4 w-[10%]">{language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}</th>
                                <th className="py-3.5 px-4 w-[15%]">{t('phone')}</th>
                                <th className="py-3.5 px-4 w-[18%]">{t('areaUnionLabel')}</th>
                                <th className="py-3.5 px-4 w-[14%]">{t('availabilityLabel')}</th>
                                <th className="py-3.5 px-4 w-[10%]">{t('timesDonatedHeader')}</th>
                                <th className="py-3.5 px-4 w-[15%]">{t('lastDonation')}</th>
                                <th className="py-3.5 px-4 w-[12%] text-right">{t('actionsLabel')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-slate-700 dark:text-zinc-300 font-medium">
                              {paginatedDonors.map((donor) => {
                                const normalizedDonor = normalizeDonor(donor);
                                const daysSince = calculateDaysSince(normalizedDonor.last_donation_date);
                                const isCooldownActive = daysSince < 90;
                                const daysRemaining = 90 - daysSince;

                                let statusColor = 'text-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/25';
                                let statusText = t('available');
                                const statusIcon = CheckCircle2;

                                if (!normalizedDonor.is_available) {
                                  statusColor = 'text-rose-600 bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/25';
                                  statusText = t('notAvailable');
                                } else if (isCooldownActive) {
                                  statusColor = 'text-amber-600 bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/25';
                                  statusText = t('daysLeft', { days: daysRemaining });
                                }

                                const badge = getDonorBadge(normalizedDonor.total_donations);
                                const StatusIcon = statusIcon;

                                const cleanPhone = normalizedDonor.phone.trim();
                                const waPhone = cleanPhone.startsWith('0') ? '88' + cleanPhone : cleanPhone;
                                const waMessage = encodeURIComponent(
                                  `Assalamu Alaikum ${normalizedDonor.name}, we found your contact on Bloodify247. We urgently need ${normalizedDonor.blood_group} blood. Are you available to donate?`
                                );

                                return (
                                  <tr key={normalizedDonor.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors duration-150">
                                    <td className="py-4 px-4 align-middle">
                                      <div className="flex items-center gap-3">
                                        {normalizedDonor.avatar_url ? (
                                          <div className="relative shrink-0">
                                            <img 
                                              src={normalizedDonor.avatar_url} 
                                              alt={normalizedDonor.name}
                                              referrerPolicy="no-referrer"
                                              onError={(e) => {
                                                (e.target as HTMLElement).style.display = 'none';
                                                const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                                                if (fallback) fallback.style.display = 'flex';
                                              }}
                                              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-zinc-700 shadow-xs"
                                            />
                                            <div className="w-9 h-9 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-xs items-center justify-center border border-red-500/20 hidden">
                                              {normalizedDonor.name?.charAt(0) || 'D'}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold text-xs flex items-center justify-center border border-slate-200/60 dark:border-zinc-700 shrink-0">
                                            {normalizedDonor.name?.charAt(0) || 'D'}
                                          </div>
                                        )}
                                        <div className="flex flex-col gap-1 min-w-0">
                                          <span className="font-extrabold text-slate-900 dark:text-white leading-snug truncate">
                                            {normalizedDonor.name}
                                          </span>
                                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide w-fit ${badge.color}`}>
                                            {getDonorBadgeLabel(badge.label, t)}
                                          </span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-4 px-4 align-middle">
                                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white font-black text-sm shadow-xs">
                                        {normalizedDonor.blood_group}
                                      </span>
                                    </td>
                                    <td className="py-4 px-4 align-middle">
                                      <span className="inline-block font-mono text-xs font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-zinc-700/60 whitespace-nowrap">
                                        {revealedContacts[normalizedDonor.id] ? normalizedDonor.phone : maskPhone(normalizedDonor.phone)}
                                      </span>
                                    </td>
                                    <td className="py-4 px-4 align-middle">
                                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${getDistrictBadge(normalizedDonor.area, language).color.bg} ${getDistrictBadge(normalizedDonor.area, language).color.text} ${getDistrictBadge(normalizedDonor.area, language).color.border}`}>
                                          {getDistrictBadge(normalizedDonor.area, language).label}
                                        </span>
                                        <span className="leading-snug">{getAreaLabel(normalizedDonor.area, t)}</span>
                                      </div>
                                    </td>
                                    <td className="py-4 px-4 align-middle whitespace-nowrap">
                                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${statusColor}`}>
                                        <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                                        <span>{statusText}</span>
                                      </span>
                                    </td>
                                    <td className="py-4 px-4 align-middle whitespace-nowrap">
                                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-xs border border-red-500/15">
                                        {t('timesUnit', { count: normalizedDonor.total_donations })}
                                      </span>
                                    </td>
                                    <td className="py-4 px-4 align-middle whitespace-nowrap text-xs text-slate-600 dark:text-zinc-400 font-medium">
                                      {normalizedDonor.last_donation_date 
                                        ? new Date(normalizedDonor.last_donation_date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                        : t('never')
                                      }
                                    </td>
                                    <td className="py-4 px-4 align-middle text-right whitespace-nowrap">
                                      {!revealedContacts[normalizedDonor.id] ? (
                                        <button
                                          onClick={() => setRevealedContacts(prev => ({ ...prev, [normalizedDonor.id]: true }))}
                                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                          title={t('showContact')}
                                        >
                                          {t('show')}
                                        </button>
                                      ) : (
                                        <div className="inline-flex items-center gap-1.5 justify-end">
                                          <a
                                            href={`tel:${normalizedDonor.phone}`}
                                            className="w-8 h-8 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-xs transition-transform hover:scale-105 active:scale-95"
                                            title="Call Donor"
                                          >
                                            <Phone className="w-3.5 h-3.5" />
                                          </a>
                                          <a
                                            href={`https://wa.me/${waPhone}?text=${waMessage}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-xs transition-transform hover:scale-105 active:scale-95"
                                            title="WhatsApp Message"
                                          >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                          </a>
                                        </div>
                                      )}
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 animate-fade-in">
                        {paginatedDonors.map((donor) => (
                          <DonorCard
                            key={donor.id}
                            donor={donor}
                            revealed={!!revealedContacts[donor.id]}
                            onReveal={() => setRevealedContacts(prev => ({ ...prev, [donor.id]: true }))}
                          />
                        ))}
                      </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex justify-between items-center pt-6 mt-4 border-t border-slate-200/50 dark:border-zinc-800/50">
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
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
