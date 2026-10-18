import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GraduationCap, Building2, Search, Check, ChevronDown, X } from 'lucide-react';
import { SYLHET_INSTITUTES, EducationalInstitute } from '../data/sylhetInstitutes';
import { useApp } from '../context/AppContext';

interface InstituteAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  language?: 'en' | 'bn' | string;
  compact?: boolean;
}

export default function InstituteAutocomplete({
  value,
  onChange,
  placeholder,
  label,
  required = false,
  disabled = false,
  compact = false,
}: InstituteAutocompleteProps) {
  const { language, t } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value with local searchTerm
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter institutes based on typed search term
  const filteredList = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) {
      // Show top prominent institutes first
      return SYLHET_INSTITUTES.slice(0, 15);
    }
    return SYLHET_INSTITUTES.filter((inst) => {
      return (
        inst.name.toLowerCase().includes(q) ||
        inst.nameBn.includes(q) ||
        inst.location.toLowerCase().includes(q) ||
        inst.aliases.some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [searchTerm]);

  const handleSelect = (inst: EducationalInstitute) => {
    const displayName = language === 'bn' ? inst.nameBn : inst.name;
    setSearchTerm(displayName);
    onChange(displayName);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setSearchTerm(nextVal);
    onChange(nextVal);
    if (!isOpen) setIsOpen(true);
  };

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
    setIsOpen(false);
  };

  return (
    <div className={`${compact ? 'space-y-1' : 'space-y-1.5'} relative text-left`} ref={containerRef}>
      {label && (
        <label className={`${compact ? 'text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400' : 'text-xs font-bold text-slate-700 dark:text-zinc-300'} flex items-center justify-between`}>
          <span className="flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-red-500" />
            {label}
          </span>
          {required && <span className="text-[10px] text-red-500 font-extrabold">* Required</span>}
        </label>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Building2 className="w-4 h-4" />
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          placeholder={placeholder || (language === 'bn' ? 'কলেজ বা বিশ্ববিদ্যালয়ের নাম টাইপ করুন...' : 'Type college or university name...')}
          className={`w-full pl-9 pr-14 ${compact ? 'py-2 text-xs' : 'py-2.5 text-xs sm:text-sm'} rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-xs`}
        />

        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
          {searchTerm && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-md transition-colors cursor-pointer"
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-md transition-colors cursor-pointer"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-red-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown List */}
      {isOpen && !disabled && (
        <div className="absolute z-[100] left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-1.5 space-y-1 animate-scale-up">
          <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <span>Sylhet Regional Institutes ({filteredList.length})</span>
            <span className="text-red-500 font-bold">Select or type custom</span>
          </div>

          {filteredList.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-500 dark:text-zinc-400">
              <p>No predefined institute matches "{searchTerm}".</p>
              <p className="text-[11px] text-red-500 mt-1 font-semibold">
                You can keep this as your custom institute name.
              </p>
            </div>
          ) : (
            filteredList.map((inst) => {
              const displayName = language === 'bn' ? inst.nameBn : inst.name;
              const isSelected = searchTerm.trim().toLowerCase() === displayName.trim().toLowerCase() ||
                searchTerm.trim().toLowerCase() === inst.name.trim().toLowerCase() ||
                searchTerm.trim().toLowerCase() === inst.nameBn.trim().toLowerCase();

              const typeBadge =
                inst.type === 'university'
                  ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20'
                  : inst.type === 'medical_college'
                  ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                  : inst.type === 'polytechnic'
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                  : 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20';

              const typeLabel =
                inst.type === 'university'
                  ? 'University'
                  : inst.type === 'medical_college'
                  ? 'Medical College'
                  : inst.type === 'polytechnic'
                  ? 'Polytechnic'
                  : 'College';

              return (
                <button
                  type="button"
                  key={inst.id}
                  onClick={() => handleSelect(inst)}
                  className={`w-full text-left p-2.5 rounded-xl flex items-start justify-between gap-3 transition-colors cursor-pointer group ${
                    isSelected
                      ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold truncate group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                        {displayName}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-zinc-400">
                      <span className="truncate">📍 {inst.location}</span>
                    </div>
                  </div>

                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${typeBadge}`}>
                    {typeLabel}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
