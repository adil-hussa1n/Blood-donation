import React from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { useApp, AREAS, BLOOD_GROUPS, getAreaLabel } from '../context/AppContext';

interface DonorFilterProps {
  localBloodGroup: string;
  setLocalBloodGroup: (bg: string) => void;
  localArea: string;
  setLocalArea: (area: string) => void;
  localSearchQuery: string;
  setLocalSearchQuery: (query: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export default function DonorFilter({
  localBloodGroup,
  setLocalBloodGroup,
  localArea,
  setLocalArea,
  localSearchQuery,
  setLocalSearchQuery,
  onSubmit,
  onReset,
  hasActiveFilters
}: DonorFilterProps) {
  const { t } = useApp();

  return (
    <form 
      onSubmit={onSubmit}
      className="glass-panel rounded-2xl p-6 border border-slate-200/50 dark:border-zinc-800/50 text-left space-y-5"
    >
      <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-zinc-800/50 pb-3">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm md:text-base">
          <Search className="w-4 h-4 text-red-500" /> {t('filterDonorsTitle')}
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-0.5 cursor-pointer"
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
              <option value="">{t('allBeanibazarAreas') || 'All Sylhet Areas'}</option>
              {(AREAS as string[]).map((area: string) => (
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
            {(BLOOD_GROUPS as string[]).map((group: string) => {
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
        className="w-full bg-red-500 hover:bg-red-600 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md hover:shadow-red-500/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-xs cursor-pointer mt-4"
      >
        <Search className="w-4 h-4" />
        {t('searchButton')}
      </button>
    </form>
  );
}
