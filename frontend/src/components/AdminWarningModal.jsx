import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  AlertTriangle, 
  X, 
  Send, 
  ShieldAlert, 
  Ban, 
  Clock, 
  CheckCircle2, 
  PhoneCall, 
  AlertOctagon, 
  Info, 
  ToggleLeft,
  UserX
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function AdminWarningModal({ donor, isOpen, onClose }) {
  const { createDonorWarning, language } = useApp();

  const isBn = language === 'bn';

  // Preset Templates
  const PRESETS = [
    {
      id: 'denial',
      type: 'denial',
      severity: 'warning',
      autoSetUnavailable: true,
      actionRequired: 'toggle_unavailable',
      icon: Ban,
      label: isBn ? 'রক্তদানে অস্বীকৃতি (Available থাকা সত্ত্বেও)' : 'Refused Donation While Active',
      title: isBn 
        ? 'জরুরি নোটিশ: রক্তদাতা হিসেবে সক্রিয় থেকেও রক্তদানে অস্বীকৃতি' 
        : 'Official Notice: Reported Refusal While Listed as Available',
      message: isBn
        ? 'আমাদের প্ল্যাটফর্মে আপনার প্রোফাইল "রক্তদানে প্রস্তুত (Available)" থাকা সত্ত্বেও জরুরি রোগীর স্বজনদের সাথে যোগাযোগে রক্তদানে অস্বীকৃতি জানানোর অভিযোগ পাওয়া গেছে। আপনি যদি এই মুহূর্তে রক্তদান করতে অপারগ বা অনিচ্ছুক হন, তবে অবিলম্বে আপনার প্রোফাইলে স্ট্যাটাস "Unavailable" করে রাখুন যাতে মুমূর্ষু রোগীর পরিবার বিভ্রান্ত না হয়।'
        : 'We received reports that you declined to donate blood when contacted for an emergency request, despite your profile being listed as Available. If you are temporarily unable or unwilling to donate, you MUST switch your availability to Unavailable so emergency families do not lose vital time.'
    },
    {
      id: 'unresponsive',
      type: 'unresponsive',
      severity: 'warning',
      autoSetUnavailable: true,
      actionRequired: 'toggle_unavailable',
      icon: PhoneCall,
      label: isBn ? 'দীর্ঘক্ষণ সাড়া না দেওয়া / ফোন না ধরা' : 'Unresponsive to Emergency Calls',
      title: isBn 
        ? 'সতর্কতা: জরুরি আহ্বানে কোনো সাড়া না পাওয়া' 
        : 'Notice: Repeatedly Unresponsive to Emergency Requests',
      message: isBn
        ? 'আপনার প্রোফাইল "Available" রাখা থাকা সত্ত্বেও জরুরি পরিস্থিতিতে বারবার ফোন বা মেসেজের কোনো উত্তর পাওয়া যায়নি। আপনি যদি ব্যস্ত বা ভ্রমণে থাকেন, অনুগ্রহ করে আপনার স্ট্যাটাস "Unavailable" করে রাখুন।'
        : 'Multiple emergency seekers were unable to reach you while your profile was listed as Available. Please keep your status OFF whenever you are busy, traveling, or unable to take emergency calls.'
    },
    {
      id: 'unavailability',
      type: 'unavailability',
      severity: 'notice',
      autoSetUnavailable: true,
      actionRequired: 'toggle_unavailable',
      icon: ToggleLeft,
      label: isBn ? 'অপ্রয়োজনে দীর্ঘদিন Available থাকা' : 'Availability Status Reminder',
      title: isBn 
        ? 'অনুরোধ: আপনার রক্তদানের বর্তমান প্রাপ্যতা আপডেট করুন' 
        : 'Reminder: Please Update Your Current Donation Status',
      message: isBn
        ? 'আপনার বর্তমান রক্তদানের সক্ষমতা যাচাই করতে এই নোটিশটি পাঠানো হয়েছে। আপনি যদি আগামী কয়েক সপ্তাহ রক্ত দিতে না পারেন, তবে দয়া করে স্ট্যাটাসটি বন্ধ রাখুন।'
        : 'Please update your availability status. If you have recently donated, are on medication, or are currently ineligible, ensure your status is toggled to Unavailable.'
    },
    {
      id: 'conduct',
      type: 'conduct',
      severity: 'critical',
      autoSetUnavailable: true,
      actionRequired: 'contact_admin',
      icon: AlertOctagon,
      label: isBn ? 'চূড়ান্ত সতর্কবার্তা (অ্যাকাউন্ট ব্লক নোটিশ)' : 'Final Warning Before Account Block',
      title: isBn 
        ? 'চূড়ান্ত সতর্কবার্তা: নিয়মনীতি লঙ্ঘন ও ভুয়া তথ্যের বিরুদ্ধে' 
        : 'Final Disciplinary Notice: Account Suspension Warning',
      message: isBn
        ? 'দারুন ডোনার্স প্ল্যাটফর্মের শৃঙ্খলা রক্ষা ও মুমূর্ষু রোগীদের জরুরি সুরক্ষা নিশ্চিত করতে আপনাকে চূড়ান্তভাবে সতর্ক করা হচ্ছে। তথ্যের অসঙ্গতি বা অসদাচরণ অব্যাহত থাকলে আপনার অ্যাকাউন্টটি চিরতরে ব্লক করা হবে।'
        : 'This is a final warning regarding policy violations or misleading availability reports. Continued failure to comply with voluntary donor ethics will result in permanent blacklisting and account blocking.'
    }
  ];

  const [selectedPreset, setSelectedPreset] = useState('denial');
  const [warningType, setWarningType] = useState('denial');
  const [severity, setSeverity] = useState('warning');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [actionRequired, setActionRequired] = useState('toggle_unavailable');
  const [autoSetUnavailable, setAutoSetUnavailable] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Apply default preset when donor changes or modal opens
  useEffect(() => {
    if (donor && isOpen) {
      applyPreset(PRESETS[0]);
    }
  }, [donor, isOpen, language]);

  const applyPreset = (preset) => {
    setSelectedPreset(preset.id);
    setWarningType(preset.type);
    setSeverity(preset.severity);
    setTitle(preset.title);
    setMessage(preset.message);
    setActionRequired(preset.actionRequired);
    setAutoSetUnavailable(preset.autoSetUnavailable);
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !donor) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      const res = await createDonorWarning({
        donorId: donor.id,
        donorPhone: donor.phone,
        donorName: donor.name,
        warningType,
        severity,
        title: title.trim(),
        message: message.trim(),
        actionRequired,
        autoSetUnavailable
      });

      if (res.success) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col animate-scale-up my-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{isBn ? 'রক্তদাতাকে সতর্কতা বা নোটিশ পাঠান' : 'Send Warning & Alert to Donor'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {isBn 
                ? 'অযথা অনুপলব্ধ থাকা বা রক্তদানে অস্বীকারকারী রক্তদাতাকে অফিসিয়াল সতর্কবার্তা দিন।' 
                : 'Issue formal alerts to donors who refuse donation or stay unresponsive while marked available.'}
            </p>
          </div>
        </div>

        {/* Donor Summary Card */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-rose-700 text-white font-black text-xs flex items-center justify-center border border-red-400/40 shadow-xs shrink-0">
              {donor.blood_group}
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>{donor.name}</span>
                <span className="text-xs text-slate-400 font-mono font-normal">({donor.phone})</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                📍 {donor.area} • {donor.total_donations || 0} {isBn ? 'বার দান' : 'donations'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border ${
              donor.is_available 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25' 
                : 'bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${donor.is_available ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
              <span>{donor.is_available ? (isBn ? 'বর্তমানে Available' : 'Currently Available') : (isBn ? 'Unavailable' : 'Unavailable')}</span>
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-2">
              ⚡ {isBn ? 'দ্রুত কারণ নির্বাচন করুন (Quick Templates):' : 'Select Reason / Preset Template:'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESETS.map((p) => {
                const Icon = p.icon;
                const isSelected = selectedPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200 shadow-xs ring-1 ring-amber-500/30'
                        : 'bg-white dark:bg-zinc-850/60 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${
                      isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold truncate">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity & Action Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                {isBn ? 'সতর্কতার মাত্রা (Severity Level):' : 'Severity Level:'}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'notice', label: isBn ? 'নোটিশ' : 'Notice', color: 'border-blue-500/30 text-blue-600 bg-blue-500/10' },
                  { id: 'warning', label: isBn ? 'সতর্কতা' : 'Warning', color: 'border-amber-500/30 text-amber-600 bg-amber-500/10' },
                  { id: 'critical', label: isBn ? 'চূড়ান্ত' : 'Critical', color: 'border-rose-500/30 text-rose-600 bg-rose-500/10' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSeverity(s.id)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer text-center ${
                      severity === s.id
                        ? `${s.color} ring-1 ring-current shadow-xs`
                        : 'border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                {isBn ? 'প্রয়োজনীয় অ্যাকশন (Action Required):' : 'Action Required from Donor:'}
              </label>
              <select
                value={actionRequired}
                onChange={(e) => setActionRequired(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
              >
                <option value="toggle_unavailable">{isBn ? 'স্ট্যাটাস Unavailable (অফ) করা' : 'Toggle status to Unavailable (Off)'}</option>
                <option value="update_profile">{isBn ? 'ফোন বা তথ্য আপডেট করা' : 'Verify & update contact information'}</option>
                <option value="contact_admin">{isBn ? 'অ্যাডমিন সাপোর্টে যোগাযোগ করা' : 'Contact admin support immediately'}</option>
              </select>
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
              {isBn ? 'সতর্কবার্তার শিরোনাম (Title):' : 'Notice Title:'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Official Notice Regarding Availability Status"
              className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Message Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
              {isBn ? 'সতর্কবার্তার বিস্তারিত বার্তা (Warning Message):' : 'Warning Message Details:'}
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explain the specific report or reason for this warning..."
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 leading-relaxed"
            />
          </div>

          {/* Auto-set Unavailable Option */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="autoSetUnavailable"
              checked={autoSetUnavailable}
              onChange={(e) => setAutoSetUnavailable(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-zinc-700 cursor-pointer"
            />
            <label htmlFor="autoSetUnavailable" className="text-xs text-amber-950 dark:text-amber-200 font-semibold cursor-pointer select-none">
              <strong className="block text-amber-800 dark:text-amber-300 font-extrabold">
                {isBn ? 'রক্তদাতার স্ট্যাটাস তাৎক্ষণিক "Unavailable" (অফ) করুন' : 'Immediately set donor availability to Unavailable (Off)'}
              </strong>
              {isBn 
                ? 'অনুরোধ প্রত্যাখ্যানকারী বা নিষ্ক্রিয় ডোনারকে ডিরেক্টরি থেকে সঙ্গে সঙ্গে হাইড করা হবে যাতে রোগীরা আর ফোন না দেন।' 
                : 'Hides the donor from the active search directory immediately so emergency patients do not call an unwilling donor.'}
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? (isBn ? 'পাঠানো হচ্ছে...' : 'Sending...') : (isBn ? 'সতর্কবার্তা ইস্যু ও প্রেরণ করুন' : 'Issue Warning & Alert Donor')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
