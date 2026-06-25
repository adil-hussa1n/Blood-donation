import React, { useState, useMemo } from 'react';
import { Hospital, MapPin, Phone, Search, AlertTriangle, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { useApp, AREAS, BLOOD_GROUPS, getAreaLabel } from '../context/AppContext';
import { HospitalInventory } from '../types';
import { Link, useSearchParams } from 'react-router-dom';

interface HospitalGrouped {
  id: string;
  name: string;
  area: string;
  contact: string;
  stocks: Record<string, 'low' | 'critical' | 'stable'>;
  updated_at: string;
}

export default function HospitalsDirectory() {
  const { hospitalInventory, loading, language, t } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [searchParams] = useSearchParams();
  const [shortageFilter, setShortageFilter] = useState(searchParams.get('shortage') === 'true');

  // Group the flat inventory rows by hospital profile
  const groupedHospitals = useMemo(() => {
    const map: Record<string, HospitalGrouped> = {};

    (hospitalInventory as any[] || []).forEach((item) => {
      const h = item.hospitals;
      if (!h) return; // Skip if missing relation
      if (!h.is_verified) return; // Skip if clinic is pending admin verification

      if (!map[h.id]) {
        map[h.id] = {
          id: h.id,
          name: h.name,
          area: h.area,
          contact: h.contact,
          stocks: {},
          updated_at: item.updated_at
        };
        // Populate defaults
        BLOOD_GROUPS.forEach(bg => {
          map[h.id].stocks[bg] = 'stable';
        });
      }

      map[h.id].stocks[item.blood_group] = item.stock_status;
      if (new Date(item.updated_at) > new Date(map[h.id].updated_at)) {
        map[h.id].updated_at = item.updated_at;
      }
    });

    return Object.values(map);
  }, [hospitalInventory]);

  // Filter hospitals list
  const filteredHospitals = useMemo(() => {
    return groupedHospitals.filter((h) => {
      const matchSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          h.contact.includes(searchQuery);
      const matchArea = !areaFilter || h.area === areaFilter;
      
      const hasShortages = Object.values(h.stocks).some(status => status === 'low' || status === 'critical');
      const matchShortage = !shortageFilter || hasShortages;

      return matchSearch && matchArea && matchShortage;
    });
  }, [groupedHospitals, searchQuery, areaFilter, shortageFilter]);

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
          <Hospital className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 fill-current" />
          {t('hospitalsStockTitle')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">
          {t('hospitalsStockDesc')}
        </p>
      </div>

      {/* Search & Filters */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-200/50 dark:border-zinc-800/50 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Search */}
        <div className="md:col-span-4 relative">
          <input
            type="text"
            placeholder={t('searchHospitalPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all dark:text-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        {/* Area */}
        <div className="md:col-span-4">
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white cursor-pointer"
          >
            <option value="">All Sylhet Areas</option>
            {(AREAS as string[]).map((a) => (
              <option key={a} value={a}>
                {getAreaLabel(a, t)}
              </option>
            ))}
          </select>
        </div>

        {/* Shortage Toggle */}
        <div className="md:col-span-4 flex items-center gap-2 md:justify-end">
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={shortageFilter}
              onChange={(e) => setShortageFilter(e.target.checked)}
              className="sr-only peer cursor-pointer" 
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none dark:bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-700 peer-checked:bg-red-500"></div>
            <span className="ml-2.5 text-xs font-bold text-slate-700 dark:text-zinc-300">{t('showShortageAlerts')}</span>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="glass-panel border rounded-3xl p-6 h-64 bg-slate-100 dark:bg-zinc-900" />
          ))}
        </div>
      ) : filteredHospitals.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <Hospital className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">{t('noHospitalStocksFound')}</h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            {t('noHospitalStocksFoundDesc')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredHospitals.map((h) => (
            <div 
              key={h.id} 
              className="glass-panel border border-slate-200/50 dark:border-zinc-800/50 rounded-3xl p-6 space-y-5 hover:border-red-500/25 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-black text-slate-900 dark:text-white text-lg leading-snug">
                    {h.name}
                  </h3>
                  <a 
                    href={`tel:${h.contact}`} 
                    className="p-2 bg-slate-100 hover:bg-red-500 hover:text-white dark:bg-zinc-850 dark:hover:bg-red-500 text-slate-655 dark:text-zinc-350 rounded-xl transition-all"
                    title={t('callClinic')}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-550 dark:text-zinc-450 font-semibold">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500/50" />
                    {getAreaLabel(h.area, t)}
                  </span>
                  <span>{t('contactLabel')}: {h.contact}</span>
                </div>

                {/* Stock Dashboard Grid */}
                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-200/20 dark:border-zinc-800/20">
                  {BLOOD_GROUPS.map((bg) => {
                    const status = h.stocks[bg] || 'stable';
                    return (
                      <div 
                        key={bg} 
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 ${
                          status === 'critical'
                            ? 'bg-rose-500/5 border-rose-500/20 text-rose-500 animate-pulse'
                            : status === 'low'
                              ? 'bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400'
                              : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-500'
                        }`}
                      >
                        <span className="font-black text-sm">{bg}</span>
                        <span className="text-[8px] font-extrabold uppercase tracking-wider text-center">
                          {status === 'critical' ? t('shortageLabel') : status === 'low' ? t('lowLabel') : t('stableLabel')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/15 dark:border-zinc-800/15 flex items-center justify-between text-[10px] text-slate-450 dark:text-zinc-550">
                <span>{t('updatedLabel')}: {new Date(h.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <Link 
                  to="/register"
                  className="flex items-center gap-1 font-bold text-red-500 hover:text-red-655"
                >
                  {t('donateToClinic')} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
