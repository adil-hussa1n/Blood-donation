import React, { useState } from 'react';
import { Phone, Calendar, MapPin, CheckCircle, Clock, AlertTriangle, MessageCircle, Heart } from 'lucide-react';
import { calculateDaysSince, getDonorBadge, useApp } from '../context/AppContext';

export default function DonorCard({ donor, onUpdateAvailability }) {
  const { t } = useApp();
  const [showContact, setShowContact] = useState(false);

  const daysSince = calculateDaysSince(donor.last_donation_date);
  const isCooldownActive = daysSince < 90;
  const daysRemaining = 90 - daysSince;

  // Determine availability status
  let statusColor = 'bg-emerald-500';
  let statusText = 'Available to Donate';
  let statusTextShort = 'Available';
  let statusBg = 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/30';
  let statusIcon = CheckCircle;

  if (!donor.is_available) {
    statusColor = 'bg-rose-500';
    statusText = 'Unavailable (Manually Set)';
    statusTextShort = 'Unavailable';
    statusBg = 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/30';
    statusIcon = AlertTriangle;
  } else if (isCooldownActive) {
    statusColor = 'bg-amber-500';
    statusText = `Available in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`;
    statusTextShort = 'Waiting';
    statusBg = 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/30';
    statusIcon = Clock;
  }

  // Get Priority Badge
  const badge = getDonorBadge(donor.total_donations);

  // Parse phone number for WhatsApp URL (e.g. 01712345678 -> 8801712345678)
  const cleanPhone = donor.phone.trim();
  const waPhone = cleanPhone.startsWith('0') 
    ? '88' + cleanPhone 
    : cleanPhone.startsWith('+') 
      ? cleanPhone.substring(1) 
      : cleanPhone;

  const waMessage = encodeURIComponent(
    `Assalamu Alaikum ${donor.name}, we found your contact on Beanibazar Blood Donation Platform. We urgently need ${donor.blood_group} blood. Are you available to donate?`
  );
  
  const StatusIcon = statusIcon;
  const maskedPhone = cleanPhone.slice(0, 5) + '*****' + cleanPhone.slice(-1);

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl overflow-hidden relative border transition-all duration-300 group flex flex-col justify-between">
      {/* Visual background blob for hero status */}
      {donor.total_donations >= 6 && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 dark:bg-red-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
      )}

      {/* Card Header (Blood Group & Status Indicator) */}
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Blood Group Badge */}
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500 text-white font-extrabold text-2xl shadow-md shadow-red-500/20">
            {donor.blood_group}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
              {donor.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-red-500/70" />
              <span>{donor.area}</span>
            </div>
          </div>
        </div>

        {/* Priority Badge */}
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium tracking-wide ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      {/* Info Section */}
      <div className="px-5 pb-4 space-y-3 text-sm flex-grow">
        
        {/* Availability Badge */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${statusBg}`}>
          <StatusIcon className="w-4 h-4 shrink-0" />
          <span className="font-semibold text-xs leading-none">{statusText}</span>
        </div>

        {/* Cooldown progress bar */}
        {isCooldownActive && donor.is_available && (
          <div className="space-y-1 mt-2">
            <div className="flex justify-between text-[11px] text-slate-400 dark:text-zinc-500">
              <span>Cooldown Progress</span>
              <span>{Math.round(((90 - daysRemaining) / 90) * 100)}% ({daysRemaining} days left)</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${Math.max(0, Math.min(100, ((90 - daysRemaining) / 90) * 100))}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-slate-200/50 dark:border-zinc-800/50 text-xs text-slate-500 dark:text-zinc-400">
          <div className="flex justify-between">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-red-500/60" /> Phone:
            </span>
            <span className="font-semibold text-slate-800 dark:text-zinc-200">
              {showContact ? cleanPhone : maskedPhone}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-red-500/60" /> Last Donation:
            </span>
            <span className="font-medium text-slate-800 dark:text-zinc-200">
              {donor.last_donation_date 
                ? new Date(donor.last_donation_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : 'Never Donated'
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-red-500/60" /> Total Donations:
            </span>
            <span className="font-semibold text-slate-800 dark:text-zinc-200">
              {donor.total_donations} time{donor.total_donations === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 bg-slate-50/50 dark:bg-zinc-900/40 border-t border-slate-200/50 dark:border-zinc-800/50 flex gap-2 rounded-b-2xl">
        {!showContact ? (
          <button
            onClick={() => setShowContact(true)}
            className="w-full flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-650 text-white py-2.5 px-3 rounded-xl text-xs font-bold shadow-md shadow-red-500/10 hover:shadow-red-500/20 active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5" />
            {t('showContact')}
          </button>
        ) : (
          <>
            <a
              href={`tel:${donor.phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-650 text-white py-2 px-3 rounded-xl text-xs font-semibold shadow-md shadow-red-500/10 hover:shadow-red-500/20 active:scale-[0.98] transition-all duration-200"
            >
              <Phone className="w-3.5 h-3.5" />
              {t('call')}
            </a>
            <a
              href={`https://wa.me/${waPhone}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-3 rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all duration-200"
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
