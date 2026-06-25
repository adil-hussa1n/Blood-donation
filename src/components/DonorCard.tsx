import React from 'react';
import { MapPin, Phone, MessageCircle, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { useApp, calculateDaysSince, getDonorBadge, getDonorBadgeLabel, getAreaLabel } from '../context/AppContext';
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

  let statusColor = 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/20';
  let statusText = t('available');
  let statusIcon = CheckCircle2;

  if (!donor.is_available) {
    statusColor = 'text-rose-500 bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/20';
    statusText = t('unavailableManual') || t('notAvailable');
    statusIcon = AlertTriangle;
  } else if (isCooldownActive) {
    statusColor = 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/20';
    statusText = t('daysRemainingText', { days: daysRemaining }) || t('daysLeft', { days: daysRemaining });
    statusIcon = Clock;
  }

  const badge = getDonorBadge(donor.total_donations);
  const StatusIcon = statusIcon;

  const cleanPhone = donor.phone.trim();
  const waPhone = cleanPhone.startsWith('0') ? '88' + cleanPhone : cleanPhone;
  const waMessage = encodeURIComponent(
    `Assalamu Alaikum ${donor.name}, we found your contact on Bloodify247. We urgently need ${donor.blood_group} blood. Are you available to donate?`
  );

  return (
    <div className="glass-panel border border-slate-200/50 dark:border-zinc-800/50 rounded-2xl p-5 space-y-4 shadow-sm hover:border-red-500/35 transition-all duration-300">
      <div className="flex justify-between items-start gap-4">
        <div className="flex gap-3 items-center">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-500 text-white font-black text-xl shadow-md">
            {donor.blood_group}
          </span>
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
              {donor.name}
            </h4>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-semibold flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-red-500/50" />
              {getAreaLabel(donor.area, t)}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide ${badge.color}`}>
            {getDonorBadgeLabel(badge.label, t)}
          </span>
          <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 font-black text-sm border border-red-500/15">
            {donor.total_donations}
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold w-fit ${statusColor}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {statusText}
        </div>

        {isCooldownActive && donor.is_available && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
              <span>{t('cooldownProgress')}</span>
              <span>{Math.round(((90 - daysRemaining) / 90) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-zinc-900 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-amber-500 h-1.5 rounded-full"
                style={{ width: `${Math.max(0, Math.min(100, ((90 - daysRemaining) / 90) * 100))}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-zinc-900 text-[11px] text-slate-400 dark:text-zinc-500">
          <div>
            <span>{t('phone')}:</span>
            <strong className="text-slate-700 dark:text-zinc-300 block font-bold mt-0.5">
              {revealed ? donor.phone : maskPhone(donor.phone)}
            </strong>
          </div>
          <div>
            <span>{t('timesDonatedHeader')}:</span>
            <strong className="text-slate-700 dark:text-zinc-300 block font-bold mt-0.5">
              {t('timesUnit', { count: donor.total_donations })}
            </strong>
          </div>
          <div className="col-span-2">
            <span>{t('lastDonation')}:</span>
            <strong className="text-slate-700 dark:text-zinc-300 block font-bold mt-0.5">
              {donor.last_donation_date 
                ? new Date(donor.last_donation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : t('never')
              }
            </strong>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-zinc-900">
        {!revealed ? (
          <button
            onClick={onReveal}
            className="w-full flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-650 text-white py-2 px-3 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5" />
            {t('showContact')}
          </button>
        ) : (
          <>
            <a
              href={`tel:${donor.phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-650 text-white py-2 px-3 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <Phone className="w-3.5 h-3.5" />
              {t('call')}
            </a>
            <a
              href={`https://wa.me/${waPhone}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-650 text-white py-2 px-3 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {t('whatsapp')}
            </a>
          </>
        )}
      </div>
    </div>
  );
}
