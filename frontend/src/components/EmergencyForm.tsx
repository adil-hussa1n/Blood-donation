import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Megaphone, MapPin, Phone, ClipboardList, ShieldAlert, LogIn, Clock, CheckCircle2, UserCheck, Sparkles } from 'lucide-react';
import { useApp, AREAS, BLOOD_GROUPS, getAreaLabel } from '../context/AppContext';
import GoogleAuthButton from './GoogleAuthButton';

interface EmergencyFormProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function EmergencyForm({ onSuccess, onError }: EmergencyFormProps) {
  const { createEmergencyRequest, checkIfBlocked, currentDonor, setCurrentDonor, language, t } = useApp();
  const navigate = useNavigate();

  const [bloodGroup, setBloodGroup] = useState('O+');
  const [area, setArea] = useState(currentDonor?.area || 'Sylhet City Corporation');
  const [contact, setContact] = useState(currentDonor?.phone || '');
  const [note, setNote] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Security elements
  const [honeypot, setHoneypot] = useState('');
  const [formLoadTime, setFormLoadTime] = useState(Date.now());

  useEffect(() => {
    setFormLoadTime(Date.now());
    if (currentDonor?.phone && !contact) {
      setContact(currentDonor.phone);
    }
    if (currentDonor?.area) {
      setArea(currentDonor.area);
    }
  }, [currentDonor]);

  const handlePostRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    onError('');
    onSuccess('');

    // 0. Enforce Login Requirement
    if (!currentDonor) {
      onError(
        language === 'bn'
          ? 'জরুরি রক্তের অনুরোধ তৈরি করতে অনুগ্রহ করে প্রথমে গুগল দিয়ে লগইন করুন।'
          : 'Please sign in with your account first to create an urgent blood request.'
      );
      setFormLoading(false);
      return;
    }

    // 1. Honeypot check
    if (honeypot.trim() !== '') {
      onError("Verification failed. Bot detected.");
      setFormLoading(false);
      return;
    }

    // 2. Submission speed check
    const timeElapsed = Date.now() - formLoadTime;
    if (timeElapsed < 1500) {
      onError("Submission too fast. Please wait.");
      setFormLoading(false);
      return;
    }

    // 3. Contact format validation
    const contactTrimmed = contact.trim();
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(contactTrimmed)) {
      onError("Invalid phone number. Must be a valid 11-digit Bangladeshi number starting with 013-019.");
      setFormLoading(false);
      return;
    }

    // Check if phone number is blocked
    try {
      const blockRes = await checkIfBlocked(contactTrimmed);
      if (blockRes.data === true) {
        onError(
          language === 'bn'
            ? 'এই ফোন নম্বরটি ব্লক করা হয়েছে। পোস্ট তৈরি করা সম্ভব নয়।'
            : 'This phone number has been blocked by the administrator. Posting is not allowed.'
        );
        setFormLoading(false);
        return;
      }
    } catch (e) {
      console.error("Failed to check block status:", e);
    }

    const requestData = {
      blood_group: bloodGroup,
      area: area.trim(),
      contact: contactTrimmed,
      note: note.trim(),
      passcode: 'verified_user',
      donor_id: currentDonor.id,
    };

    try {
      const res = await createEmergencyRequest(requestData, honeypot);
      if (res.success) {
        onSuccess(t('postSuccessMsg', { bloodGroup }));
        setNote('');
        setHoneypot('');
        setFormLoadTime(Date.now());
      } else {
        onError(res.error?.message || t('postErrorMsg'));
      }
    } catch (err) {
      onError(t('unexpectedError'));
    } finally {
      setFormLoading(false);
    }
  };

  // If user is NOT logged in, show authentication gate card
  if (!currentDonor) {
    return (
      <div className="glass-panel rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-rose-500/30 dark:border-rose-500/20 shadow-xl space-y-5 text-left relative overflow-hidden bg-gradient-to-b from-rose-500/[0.04] to-transparent">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0 border border-rose-500/25">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base">
              {t('loginRequiredToPost')}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
              {language === 'bn' ? 'রোগী ও রক্তদাতার নিরাপত্তা নিশ্চিতকরণ' : 'Patient & Donor Safety Verification'}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-650 dark:text-zinc-350 leading-relaxed font-medium">
          {t('loginRequiredToPostDesc')}
        </p>

        <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-500/5 dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800/60 text-xs text-slate-700 dark:text-zinc-300">
          <div className="flex items-center gap-2 font-semibold">
            <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{language === 'bn' ? 'যাচাইকৃত ফোন নম্বর সরাসরি যুক্ত হয়' : 'Verified phone automatically attached'}</span>
          </div>
          <div className="flex items-center gap-2 font-semibold">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{language === 'bn' ? '২৪ ঘণ্টা পর স্বয়ংক্রিয়ভাবে মুছে যায়' : 'Auto-deleted after 24 hours'}</span>
          </div>
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{language === 'bn' ? 'লগইন থাকা অবস্থায় যেকোনো সময় ১-ক্লিকে মুছুন' : 'Delete anytime with 1-click while logged in'}</span>
          </div>
        </div>

        {/* Direct Google Sign In Button & Link */}
        <div className="space-y-3 pt-1">
          <GoogleAuthButton
            mode="login"
            onSuccess={(data) => {
              if (data.isNewUser) {
                navigate('/register');
              } else if (data.donor) {
                setCurrentDonor(data.donor);
                onSuccess(language === 'bn' ? 'গুগল দিয়ে সফলভাবে লগইন হয়েছে!' : 'Signed in with Google successfully!');
              }
            }}
            onError={(err) => onError(err)}
          />

          <div className="flex items-center gap-2 text-slate-300 dark:text-zinc-700">
            <div className="flex-1 border-t border-slate-200 dark:border-zinc-800" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">{t('orDivider')}</span>
            <div className="flex-1 border-t border-slate-200 dark:border-zinc-800" />
          </div>

          <Link
            to="/register"
            className="w-full py-3.5 px-4 rounded-xl font-extrabold text-xs text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 transition-all shadow-lg shadow-red-500/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{t('signInToPostUrgent')}</span>
          </Link>
        </div>
      </div>
    );
  }

  // Logged-in user form
  return (
    <form
      onSubmit={handlePostRequest}
      className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/50 dark:border-zinc-800/50 space-y-5 text-left relative"
    >
      {/* Bot prevention hidden inputs */}
      <input
        type="text"
        name="website_url_honeypot"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-zinc-800/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              {t('createRequestTitle')}
            </h3>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {t('verifiedRequester')}: {currentDonor.name}
            </span>
          </div>
        </div>
      </div>

      {/* 24-Hour Expiration Notice Banner */}
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-amber-700 dark:text-amber-400 text-xs font-semibold">
        <Clock className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{t('urgentAutoDeleteNotice')}</span>
      </div>

      {/* Blood group */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
          {t('bloodGroup')}
        </label>
        <select
          value={bloodGroup}
          onChange={(e) => setBloodGroup(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white cursor-pointer"
        >
          {(BLOOD_GROUPS as string[]).map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {/* Location / Area */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
            {t('selectAreaLabel')}
          </label>
          {currentDonor?.area && area === currentDonor.area && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-fade-in">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              {language === 'bn' ? 'স্বয়ংক্রিয় সনাক্তকৃত' : 'Auto-detected'}
            </span>
          )}
        </div>
        <div className="relative">
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white cursor-pointer"
          >
            {(AREAS as string[]).map((a) => (
              <option key={a} value={a}>
                {getAreaLabel(a, t)} {currentDonor?.area === a ? (language === 'bn' ? '⭐ (আপনার এলাকা)' : '⭐ (Your Area)') : ''}
              </option>
            ))}
          </select>
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>
      </div>

      {/* Contact Phone */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
            {t('emergencyPhone')}
          </label>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
            {language === 'bn' ? 'ডিফল্ট: আপনার অ্যাকাউন্ট ফোন' : 'Default: Your phone'}
          </span>
        </div>
        <div className="relative">
          <input
            type="tel"
            required
            placeholder={t('phonePlaceholder')}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
          />
          <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
          {t('additionalDetails')}
        </label>
        <div className="relative">
          <textarea
            placeholder={t('notePlaceholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white resize-none"
          />
          <ClipboardList className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>
      </div>

      <button
        type="submit"
        disabled={formLoading}
        className="w-full bg-red-500 hover:bg-red-600 text-white font-extrabold py-3 px-4 rounded-xl shadow-lg transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
      >
        <Megaphone className="w-4 h-4" />
        {formLoading ? t('postingButton') : t('postRequestButton')}
      </button>
    </form>
  );
}
