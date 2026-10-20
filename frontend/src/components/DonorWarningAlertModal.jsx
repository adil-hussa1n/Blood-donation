import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  AlertTriangle, 
  ShieldAlert, 
  ToggleLeft, 
  CheckCircle2, 
  Clock, 
  HelpCircle,
  XCircle,
  PhoneCall
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function DonorWarningAlertModal() {
  const { activeDonorWarnings, acknowledgeDonorWarning, currentDonor, language } = useApp();
  const [acknowledging, setAcknowledging] = useState(false);

  const hasWarnings = Boolean(activeDonorWarnings && activeDonorWarnings.length > 0 && currentDonor);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (hasWarnings) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [hasWarnings]);

  // If there are no unacknowledged warnings for currentDonor, don't render anything
  if (!hasWarnings) {
    return null;
  }

  // Display the top unacknowledged warning
  const warning = activeDonorWarnings[0];
  const isBn = language === 'bn';

  const isCritical = warning.severity === 'critical';
  const isNotice = warning.severity === 'notice';

  const handleAcknowledge = async (setUnavailable = false) => {
    setAcknowledging(true);
    try {
      await acknowledgeDonorWarning(warning.id, { setUnavailable });
    } finally {
      setAcknowledging(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-rose-500/40 bg-white dark:bg-zinc-900 flex flex-col animate-scale-up my-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Urgent Header Glow */}
        <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
            isCritical 
              ? 'bg-rose-500/20 text-rose-600 border border-rose-500/40 animate-pulse' 
              : 'bg-amber-500/20 text-amber-600 border border-amber-500/40'
          }`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                isCritical
                  ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                  : isNotice
                  ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
              }`}>
                {warning.severity === 'critical' 
                  ? (isBn ? '🚨 চূড়ান্ত সতর্কবার্তা' : '🚨 Critical Notice') 
                  : (isBn ? '⚠️ অফিশিয়াল সতর্কতা' : '⚠️ Official Warning')}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {warning.created_at ? new Date(warning.created_at).toLocaleDateString() : ''}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1 leading-snug">
              {warning.title}
            </h2>
          </div>
        </div>

        {/* Warning Message Box */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200/80 dark:border-zinc-800 space-y-3">
          <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
            {warning.message}
          </p>

          <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/80 flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {isBn 
                ? 'ইস্যু করেছেন: দারুন ডোনার্স কেন্দ্রীয় অ্যাডমিন টিম' 
                : 'Issued by: Darun Donors Central Moderation'}
            </span>
          </div>
        </div>

        {/* Educational Awareness Note */}
        <div className="mt-3.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-900 dark:text-amber-200 leading-normal">
          <strong className="block text-amber-800 dark:text-amber-300 font-bold mb-0.5">
            💡 {isBn ? 'কেন এটি জরুরি?' : 'Why is this critical?'}
          </strong>
          {isBn
            ? 'সিলেটের জরুরি রোগীরা সরাসরি আপনার নম্বরে কল দেন। আপনি যদি এই মুহূর্তে রক্ত দিতে না পারেন, তবে স্ট্যাটাস "Unavailable" করে রাখলে রোগীর স্বজনরা অন্য রক্তদাতার সাহায্য নিতে পারবেন এবং রোগীর মূল্যবান জীবন বাঁচবে।'
            : 'Critical emergency patients depend on live availability. If you are unable to donate at this time, turning your status OFF ensures families immediately reach an active donor without losing precious emergency minutes.'}
        </div>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2.5">
          {/* Quick Turn Off Button */}
          <button
            type="button"
            disabled={acknowledging}
            onClick={() => handleAcknowledge(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-rose-600 via-red-650 to-rose-700 hover:from-rose-700 hover:to-red-700 shadow-lg shadow-rose-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <ToggleLeft className="w-4 h-4" />
            <span>
              {isBn 
                ? '🔴 আমার স্ট্যাটাস "Unavailable (অফ)" করুন ও নিশ্চিত করুন' 
                : '🔴 Set My Status to "Unavailable (Off)" & Acknowledge'}
            </span>
          </button>

          {/* Standard Acknowledge Button */}
          <button
            type="button"
            disabled={acknowledging}
            onClick={() => handleAcknowledge(false)}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-zinc-300 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 transition-colors cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>
              {isBn ? 'আমি বুঝেছি এবং সম্মত (I Understand)' : 'I Understand & Acknowledge Notice'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
