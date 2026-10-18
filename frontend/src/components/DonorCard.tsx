import React from 'react';
import { MapPin, Phone, MessageCircle, AlertTriangle, CheckCircle2, Clock, Calendar, Heart, ShieldCheck } from 'lucide-react';
import { useApp, calculateDaysSince, getDonorBadge, getDonorBadgeLabel, getAreaLabel, getDistrictBadge, isDefaultLetterAvatar } from '../context/AppContext';
import { Donor } from '../types';

interface DonorCardProps {
  donor: Donor;
  revealed: boolean;
  onReveal: () => void;
}

export default function DonorCard({ donor, revealed, onReveal }: DonorCardProps) {
  const { language, t } = useApp();

  const maskPhone = (phone: string) => {
    if (!phone) return '';
    const p = phone.trim();
    return p.slice(0, 5) + '*****' + p.slice(-1);
  };

  const daysSince = calculateDaysSince(donor.last_donation_date);
  const isCooldownActive = daysSince < 90;
  const daysRemaining = 90 - daysSince;

  let statusBg = 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-500/25';
  let statusText = t('available');
  let statusDot = 'bg-emerald-500';
  let StatusIcon = CheckCircle2;

  if (!donor.is_available) {
    statusBg = 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-500/25';
    statusText = t('unavailableManual') || t('notAvailable');
    statusDot = 'bg-rose-500';
    StatusIcon = AlertTriangle;
  } else if (isCooldownActive) {
    statusBg = 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-500/25';
    statusText = t('daysRemainingText', { days: daysRemaining }) || t('daysLeft', { days: daysRemaining });
    statusDot = 'bg-amber-500';
    StatusIcon = Clock;
  }

  const badge = getDonorBadge(donor.total_donations);

  const cleanPhone = donor.phone.trim();
  const waPhone = cleanPhone.startsWith('0') ? '88' + cleanPhone : cleanPhone;
  const waMessage = encodeURIComponent(
    `Assalamu Alaikum ${donor.name}, we found your contact on Darun Donors. We urgently need ${donor.blood_group} blood. Are you available to donate?`
  );

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-xs hover:shadow-xl hover:border-red-500/30 transition-all duration-300 flex flex-col justify-between space-y-4 relative group overflow-hidden">
      {/* Top subtle highlight */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500/0 via-red-500/40 to-rose-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Header: Blood Group, Name, Area & Tier Badge */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Blood Group / Avatar Squircle */}
            {donor.avatar_url && !donor.hide_photo && !isDefaultLetterAvatar(donor.avatar_url) ? (
              <div className="relative shrink-0">
                <img 
                  src={donor.avatar_url} 
                  alt={donor.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-red-500/20 shadow-md shadow-red-500/10"
                />
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white font-black text-xl items-center justify-center shadow-md shadow-red-500/25 tracking-wider hidden">
                  {donor.blood_group}
                </div>
                {/* Prominent high-contrast blood group badge */}
                <span className="absolute -bottom-1.5 -right-1.5 bg-gradient-to-r from-red-650 via-red-600 to-rose-600 text-white text-xs font-black px-2 py-0.5 rounded-lg shadow-md border-2 border-white dark:border-zinc-900 tracking-wider">
                  {donor.blood_group}
                </span>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white font-black text-xl shadow-lg shadow-red-500/30 flex items-center justify-center shrink-0 tracking-wider border-2 border-red-400/30">
                {donor.blood_group}
              </div>
            )}

            {/* Donor Identity */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight break-words group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                  {donor.name}
                </h4>
                {donor.occupation === 'student' && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                    🎓 {t('studentBadge')}
                  </span>
                )}
                {donor.occupation === 'teacher' && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
                    👨‍🏫 {t('teacherBadge')}
                  </span>
                )}
                {donor.occupation === 'doctor' && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shrink-0">
                    🩺 {t('doctorBadge')}
                  </span>
                )}
                {donor.occupation === 'management' && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                    💼 {t('managementBadge')}
                  </span>
                )}
                {donor.occupation === 'staff' && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shrink-0">
                    👔 {t('staffBadge')}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-300 font-medium mt-1">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border shrink-0 ${getDistrictBadge(donor.area, language).color.bg} ${getDistrictBadge(donor.area, language).color.text} ${getDistrictBadge(donor.area, language).color.border}`}>
                  {getDistrictBadge(donor.area, language).label}
                </span>
                <span className="break-words leading-tight text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
                  {getAreaLabel(donor.area, t)}
                </span>
              </div>
              {donor.institute && (
                <div className="mt-1 flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-bold truncate" title={donor.institute}>
                  <span className="shrink-0">🏛️</span>
                  <span className="truncate">{donor.institute}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tier Badge */}
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border shrink-0 self-start ${badge.color}`}>
            {getDonorBadgeLabel(badge.label, t)}
          </span>
        </div>

        {/* Availability Pill */}
        <div className="flex items-center justify-between gap-2">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${statusBg}`}>
            <span className={`w-2 h-2 rounded-full ${statusDot} shrink-0 animate-pulse`} />
            <span className="truncate">{statusText}</span>
          </div>

          {donor.is_available && !isCooldownActive && (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'প্রস্তুত' : 'Ready'}</span>
            </span>
          )}
        </div>

        {/* Cooldown Progress if active */}
        {isCooldownActive && donor.is_available && (
          <div className="space-y-1 bg-amber-50/60 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/40 dark:border-amber-900/30">
            <div className="flex justify-between text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
              <span>{t('cooldownProgress')}</span>
              <span>{Math.round(((90 - daysRemaining) / 90) * 100)}%</span>
            </div>
            <div className="w-full bg-amber-200/50 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, ((90 - daysRemaining) / 90) * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800/80">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              {t('phone')}
            </span>
            <div className="font-mono font-bold text-slate-800 dark:text-zinc-200 text-xs tracking-tight">
              {!donor.is_available ? (
                <span className="text-rose-600 dark:text-rose-400 font-semibold italic text-[11px]">
                  {language === 'bn' ? 'অনুপলব্ধ (গোপন)' : 'Unavailable (Hidden)'}
                </span>
              ) : isCooldownActive ? (
                <span className="text-amber-600 dark:text-amber-400 font-semibold italic text-[11px]">
                  {language === 'bn' ? 'গোপন রাখা হয়েছে' : 'Hidden for rest'}
                </span>
              ) : revealed ? (
                donor.phone
              ) : (
                maskPhone(donor.phone)
              )}
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1">
              <Heart className="w-3 mx-auto text-red-500" />
              {t('timesDonatedHeader')}
            </span>
            <div className="font-bold text-slate-800 dark:text-zinc-200 text-xs">
              {t('timesUnit', { count: donor.total_donations })}
            </div>
          </div>

          <div className="col-span-2 pt-2 border-t border-slate-200/60 dark:border-zinc-700/50 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {t('lastDonation')}
            </span>
            <span className="font-semibold text-slate-700 dark:text-zinc-300 text-xs">
              {donor.last_donation_date 
                ? new Date(donor.last_donation_date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : t('never')
              }
            </span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-2">
        {!donor.is_available ? (
          <div className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 text-xs font-semibold select-none text-center">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="text-[11px] leading-tight">
              {language === 'bn' ? 'রক্তদাতা বর্তমানে অনুপলব্ধ' : 'Donor is currently unavailable'}
            </span>
          </div>
        ) : isCooldownActive ? (
          <div className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-semibold select-none text-center">
            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-[11px] leading-tight">
              {t('cooldownResting')} • {t('daysLeft', { days: daysRemaining })}
            </span>
          </div>
        ) : !revealed ? (
          <button
            type="button"
            onClick={onReveal}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-xs hover:shadow-md hover:shadow-red-500/20 transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{t('showContact')}</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:${donor.phone}`}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-[0.98]"
              title="Call Donor"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{t('call')}</span>
            </a>
            <a
              href={`https://wa.me/${waPhone}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-[0.98]"
              title="WhatsApp Message"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{t('whatsapp')}</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
