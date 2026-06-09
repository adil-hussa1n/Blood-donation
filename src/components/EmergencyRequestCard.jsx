import React, { useState } from 'react';
import { Phone, MapPin, MessageCircle, AlertCircle, Clock, Calendar } from 'lucide-react';

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  if (diffMs < 0) return 'Just now'; // Handle tiny clock drift
  
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

import { useApp } from '../context/AppContext';

export default function EmergencyRequestCard({ request, onDelete, showAdminActions }) {
  const { t } = useApp();
  const [showContact, setShowContact] = useState(false);
  const timeAgo = formatTimeAgo(request.created_at);
  const isRecent = new Date().getTime() - new Date(request.created_at).getTime() < 24 * 60 * 60 * 1000;

  // Clean phone number for WhatsApp
  const cleanPhone = request.contact.trim();
  const waPhone = cleanPhone.startsWith('0') 
    ? '88' + cleanPhone 
    : cleanPhone.startsWith('+') 
      ? cleanPhone.substring(1) 
      : cleanPhone;

  const waMessage = encodeURIComponent(
    `Assalamu Alaikum, I saw your emergency request for ${request.blood_group} blood at ${request.area} on Beanibazar Blood Donation Platform. I want to help.`
  );

  const maskedPhone = cleanPhone.slice(0, 5) + '*****' + cleanPhone.slice(-1);

  return (
    <div className={`glass-panel rounded-2xl overflow-hidden border transition-all duration-300 relative ${
      isRecent 
        ? 'border-red-500/30 dark:border-red-500/30 shadow-md ring-1 ring-red-500/10' 
        : 'border-slate-200/50 dark:border-zinc-800/50'
    }`}>
      
      {/* Visual pulse glow for recent requests */}
      {isRecent && (
        <div className="absolute top-0 left-0 w-2 h-full bg-red-500 pulse-glow" />
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-14 h-14 rounded-2xl text-white font-extrabold text-2xl shadow-lg relative ${
              isRecent 
                ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/20' 
                : 'bg-slate-700 dark:bg-zinc-800 shadow-slate-900/10'
            }`}>
              {request.blood_group}
              {isRecent && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                </span>
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-slate-800 dark:text-white text-base">
                  Emergency {request.blood_group} Required
                </h4>
                {isRecent && (
                  <span className="bg-red-500/10 text-red-650 dark:text-red-450 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                    Recent
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 mt-1">
                <MapPin className="w-3.5 h-3.5 text-red-500/70 shrink-0" />
                <span className="font-medium">{request.area}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Note / Description */}
        {request.note && (
          <div className="bg-red-500/5 dark:bg-red-500/5 border border-red-500/10 dark:border-red-500/10 rounded-xl p-3 text-sm text-slate-700 dark:text-zinc-300 mb-4 leading-relaxed font-medium">
            {request.note}
          </div>
        )}

        {/* Contact Info */}
        <div className="text-xs text-slate-500 dark:text-zinc-400 mb-4 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-red-500/60" />
          <span>Contact Number: <strong className="text-slate-700 dark:text-zinc-300 font-semibold">{showContact ? cleanPhone : maskedPhone}</strong></span>
        </div>

        {/* Buttons / Actions */}
        <div className="flex gap-2">
          {!showContact ? (
            <button
              onClick={() => setShowContact(true)}
              className="w-full flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-650 text-white py-2 px-3 rounded-xl text-xs font-bold shadow-md shadow-red-500/10 hover:shadow-red-500/20 active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              {t('showContact')}
            </button>
          ) : (
            <>
              <a
                href={`tel:${request.contact}`}
                className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-xl text-xs font-semibold shadow-md shadow-red-500/10 hover:shadow-red-500/20 active:scale-[0.98] transition-all duration-200"
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

          {showAdminActions && onDelete && (
            <button
              onClick={() => onDelete(request.id)}
              className="bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 dark:text-rose-300 p-2 rounded-xl transition-colors text-xs font-bold"
              title="Delete request"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
