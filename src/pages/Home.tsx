import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, X, Heart, PlusCircle, AlertTriangle, ArrowRight, Flame, Phone, MessageCircle, CheckCircle2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp, AREAS, BLOOD_GROUPS, calculateDaysSince, getDonorBadge, getDonorBadgeLabel, normalizeDonor, getAreaLabel } from '../context/AppContext';
import QuickStats from '../components/QuickStats';
import DonorCard from '../components/DonorCard';
import { Donor, EmergencyRequest, HospitalInventory } from '../types';

export default function Home() {
  const { donors, emergencyRequests, hospitalInventory, loading, error, language, t } = useApp();
  const [filterOpen, setFilterOpen] = useState(false);
  
  // Active applied filters (used for rendering the list)
  const [appliedBloodGroup, setAppliedBloodGroup] = useState('');
  const [appliedArea, setAppliedArea] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');

  // Local filter form buffers (held before user clicks Search button)
  const [localBloodGroup, setLocalBloodGroup] = useState('');
  const [localArea, setLocalArea] = useState('');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  
  // Security: track revealed contact numbers
  const [revealedContacts, setRevealedContacts] = useState<Record<string, boolean>>({});

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

  // Recent Emergency Requests (limit to 3)
  const recentRequests = useMemo(() => {
    return (emergencyRequests || []).slice(0, 3);
  }, [emergencyRequests]);

  // Critical Hospital Blood Stock Alerts (limit to 3)
  const shortageAlerts = useMemo(() => {
    return (hospitalInventory as HospitalInventory[] || [])
      .filter((item) => (item.stock_status === 'critical' || item.stock_status === 'low') && item.hospitals?.is_verified)
      .sort((a, b) => {
        if (a.stock_status === 'critical' && b.stock_status !== 'critical') return -1;
        if (a.stock_status !== 'critical' && b.stock_status === 'critical') return 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
  }, [hospitalInventory]);

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
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  {t('selectAreaLabel')}
                </label>
                <div className="relative">
                  <select
                    value={localArea}
                    onChange={(e) => setLocalArea(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all dark:text-white appearance-none cursor-pointer"
                  >
                    <option value="">{t('allBeanibazarAreas')}</option>
                    {AREAS.map((area) => (
                      <option key={area} value={area}>
                        {getAreaLabel(area, t)}
                      </option>
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
          
          {/* Critical Hospital Blood Stock Alerts */}
          {shortageAlerts.length > 0 && (
            <div className="glass-panel border-amber-500/20 dark:border-amber-500/20 rounded-3xl p-5 border relative overflow-hidden bg-gradient-to-r from-amber-500/5 to-rose-500/5 text-left">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                  {language === 'en' ? 'Critical Hospital Blood Stock Alerts' : 'হাসপাতাল রক্তের স্টক সতর্কতা'}
                </h3>
                <Link
                  to="/hospitals-stock?shortage=true"
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 group"
                >
                  {language === 'en' ? 'View all' : 'সবগুলো দেখুন'} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {shortageAlerts
                  .slice(0, 3)
                  .map((item) => (
                    <div 
                      key={item.id} 
                      className={`border rounded-xl p-4 flex flex-col justify-between transition-all hover:scale-[1.02] duration-300 ${
                        item.stock_status === 'critical' 
                          ? 'bg-rose-500/5 border-rose-500/20 dark:border-rose-500/30' 
                          : 'bg-amber-500/5 border-amber-500/20 dark:border-amber-500/30'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-black text-slate-900 dark:text-white text-sm leading-tight">
                            {item.hospitals?.name}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            item.stock_status === 'critical'
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'bg-amber-500 text-white'
                          }`}>
                            {item.stock_status === 'critical' ? (language === 'en' ? 'CRITICAL' : 'জরুরী সংকট') : (language === 'en' ? 'LOW STOCK' : 'স্বল্পতা')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-zinc-350 font-bold mb-2 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {getAreaLabel(item.hospitals?.area || '', t)}
                        </p>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-slate-500 dark:text-zinc-400 font-semibold">{language === 'en' ? 'Needed Group:' : 'প্রয়োজনীয় গ্রুপ:'}</span>
                          <span className="font-black text-red-655 dark:text-red-400 text-base">{item.blood_group}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <a 
                          href={`tel:${item.hospitals?.contact || ''}`} 
                          className="text-[10px] bg-slate-900 hover:bg-slate-850 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-extrabold text-center py-1.5 px-2 rounded-lg flex-1 transition-colors shadow-sm"
                        >
                          {language === 'en' ? 'Contact' : 'যোগাযোগ'}
                        </a>
                        <Link 
                          to="/register" 
                          className="text-[10px] bg-red-500 hover:bg-red-650 text-white font-extrabold text-center py-1.5 px-2 rounded-lg flex-1 transition-all shadow-sm"
                        >
                          {language === 'en' ? 'Donate Now' : 'রক্তদান করুন'}
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

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
                {recentRequests.map((req) => (
                  <div key={req.id} className="bg-red-500/5 dark:bg-red-500/5 border border-red-500/10 dark:border-red-500/15 rounded-xl p-4 flex flex-col justify-between hover:border-red-500/30 transition-all hover:scale-[1.02] duration-300">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-black text-red-500 text-lg leading-none">{req.blood_group}</span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
                          {getAreaLabel(req.area, t).split(' ')[0]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-zinc-300 line-clamp-2 mb-2 font-semibold">
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
                            className="text-[10px] bg-red-500 hover:bg-red-650 text-white font-extrabold text-center py-1.5 px-2 rounded-lg flex-1 transition-colors shadow-sm"
                          >
                            {t('call')}
                          </a>
                          <a 
                            href={`https://wa.me/${req.contact.startsWith('0') ? '88' + req.contact : req.contact}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-center py-1.5 px-2 rounded-lg flex-1 transition-colors shadow-sm"
                          >
                            {t('whatsapp')}
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Donors Table Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pt-2">
              <h2 id="donors-directory" className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 scroll-mt-20">
                {t('showingResults')}
                <span className="text-sm font-semibold text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded-md border border-slate-200/30 dark:border-zinc-800/30">
                  {filteredDonors.length} {t('foundSuffix')}
                </span>
              </h2>
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
                    {/* DESKTOP VIEW: Data Table */}
                    <div className="hidden md:block glass-panel border border-slate-200/50 dark:border-zinc-800/50 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm border-collapse table-fixed">
                          <thead>
                            <tr className="border-b border-slate-200/50 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-900/30 text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
                              <th className="p-4 w-[16%]">{t('donorInfoLabel')}</th>
                              <th className="p-4 w-[9%]">{t('bloodGroup')}</th>
                              <th className="p-4 w-[13%]">{t('phone')}</th>
                              <th className="p-4 w-[16%]">{t('areaUnionLabel')}</th>
                              <th className="p-4 w-[13%]">{t('availabilityLabel')}</th>
                              <th className="p-4 w-[11%]">{t('timesDonatedHeader')}</th>
                              <th className="p-4 w-[12%]">{t('lastDonation')}</th>
                              <th className="p-4 w-[10%] text-center">{t('actionsLabel')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/50 dark:divide-zinc-800/50 text-slate-700 dark:text-zinc-300 font-medium">
                            {paginatedDonors.map((donor) => {
                              const normalizedDonor = normalizeDonor(donor);
                              const daysSince = calculateDaysSince(normalizedDonor.last_donation_date);
                              const isCooldownActive = daysSince < 90;
                              const daysRemaining = 90 - daysSince;

                              let statusColor = 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/20';
                              let statusText = t('available');
                              const statusIcon = CheckCircle2;

                              if (!normalizedDonor.is_available) {
                                statusColor = 'text-rose-500 bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/20';
                                statusText = t('notAvailable');
                              } else if (isCooldownActive) {
                                statusColor = 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/20';
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
                                <tr key={normalizedDonor.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                                  <td className="p-4">
                                    <div className="flex flex-col gap-1 truncate overflow-hidden">
                                      <span className="font-extrabold text-slate-900 dark:text-white block truncate">
                                        {normalizedDonor.name}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide w-fit ${badge.color}`}>
                                        {getDonorBadgeLabel(badge.label, t)}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-red-500 text-white font-black text-base shadow-sm">
                                      {normalizedDonor.blood_group}
                                    </span>
                                  </td>
                                  <td className="p-4 text-slate-600 dark:text-zinc-400 font-semibold truncate overflow-hidden">
                                    {revealedContacts[normalizedDonor.id] ? normalizedDonor.phone : maskPhone(normalizedDonor.phone)}
                                  </td>
                                  <td className="p-4 text-slate-600 dark:text-zinc-400 truncate overflow-hidden" title={getAreaLabel(normalizedDonor.area, t)}>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5 text-red-500/60 shrink-0" />
                                      <span className="truncate">{getAreaLabel(normalizedDonor.area, t)}</span>
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${statusColor}`}>
                                      <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate">{statusText}</span>
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 font-black text-sm border border-red-500/15">
                                      {normalizedDonor.total_donations}
                                    </span>
                                    <span className="block text-[10px] font-semibold text-slate-400 dark:text-zinc-500 mt-1">
                                      {t('timesUnit', { count: normalizedDonor.total_donations })}
                                    </span>
                                  </td>
                                  <td className="p-4 text-xs text-slate-500 dark:text-zinc-400">
                                    <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate block">
                                      {normalizedDonor.last_donation_date 
                                        ? new Date(normalizedDonor.last_donation_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                        : t('never')
                                      }
                                    </span>
                                  </td>
                                  <td className="p-4 text-center">
                                    {!revealedContacts[normalizedDonor.id] ? (
                                      <button
                                        onClick={() => setRevealedContacts(prev => ({ ...prev, [normalizedDonor.id]: true }))}
                                        className="px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[10px] font-bold shadow-sm transition-all cursor-pointer"
                                        title={t('showContact')}
                                      >
                                        {t('show')}
                                      </button>
                                    ) : (
                                      <div className="flex gap-1.5 justify-center flex-wrap">
                                        <a
                                          href={`tel:${normalizedDonor.phone}`}
                                          className="p-2 bg-red-500 hover:bg-red-655 text-white rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
                                          title="Call Donor"
                                        >
                                          <Phone className="w-4 h-4" />
                                        </a>
                                        <a
                                          href={`https://wa.me/${waPhone}?text=${waMessage}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-2 bg-emerald-500 hover:bg-emerald-655 text-white rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
                                          title="WhatsApp Message"
                                        >
                                          <MessageCircle className="w-4 h-4" />
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

                    {/* MOBILE VIEW: Card Stack */}
                    <div className="block md:hidden space-y-4">
                      {paginatedDonors.map((donor) => (
                        <DonorCard
                          key={donor.id}
                          donor={donor}
                          revealed={!!revealedContacts[donor.id]}
                          onReveal={() => setRevealedContacts(prev => ({ ...prev, [donor.id]: true }))}
                        />
                      ))}
                    </div>

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
