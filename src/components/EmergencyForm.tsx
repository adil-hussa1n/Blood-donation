import React, { useState, useEffect } from 'react';
import { Megaphone, MapPin, Phone, ClipboardList, Key, Eye, EyeOff } from 'lucide-react';
import { useApp, AREAS, BLOOD_GROUPS, getAreaLabel } from '../context/AppContext';

interface EmergencyFormProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function EmergencyForm({ onSuccess, onError }: EmergencyFormProps) {
  const { createEmergencyRequest, t } = useApp();

  const [bloodGroup, setBloodGroup] = useState('O+');
  const [area, setArea] = useState('Sylhet City Corporation');
  const [contact, setContact] = useState('');
  const [note, setNote] = useState('');
  const [passcode, setPasscode] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Security elements
  const [honeypot, setHoneypot] = useState('');
  const [formLoadTime, setFormLoadTime] = useState(Date.now());
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  useEffect(() => {
    setFormLoadTime(Date.now());
  }, []);

  const handlePostRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    onError('');
    onSuccess('');

    // 1. Honeypot check
    if (honeypot.trim() !== '') {
      onError("Verification failed. Bot detected.");
      setFormLoading(false);
      return;
    }

    // 2. Submission speed check
    const timeElapsed = Date.now() - formLoadTime;
    if (timeElapsed < 2000) {
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

    // 4. Passcode validation
    const passwordInput = passcode.trim();
    if (passwordInput.length < 4) {
      onError(t('passwordLengthError'));
      setFormLoading(false);
      return;
    }

    const requestData = {
      blood_group: bloodGroup,
      area: area.trim(),
      contact: contactTrimmed,
      note: note.trim(),
      passcode: passwordInput
    };

    try {
      const res = await createEmergencyRequest(requestData, honeypot);
      if (res.success) {
        onSuccess(t('postSuccessMsg', { bloodGroup }));
        setContact('');
        setNote('');
        setPasscode('');
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

  return (
    <form
      onSubmit={handlePostRequest}
      className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/50 dark:border-zinc-800/50 space-y-5 text-left"
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

      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/50 dark:border-zinc-800/50">
        <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center">
          <Megaphone className="w-4 h-4" />
        </div>
        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
          {t('createRequestTitle')}
        </h3>
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
        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
          {t('selectAreaLabel')}
        </label>
        <div className="relative">
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white cursor-pointer"
          >
            {(AREAS as string[]).map((a) => (
              <option key={a} value={a}>
                {getAreaLabel(a, t)}
              </option>
            ))}
          </select>
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>
      </div>

      {/* Contact Phone */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
          {t('emergencyPhone')}
        </label>
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

      {/* Passcode */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
          {t('accountDeletionPassword')}
        </label>
        <div className="relative">
          <input
            type={showCreatePassword ? 'text' : 'password'}
            required
            placeholder={t('passwordPlaceholder')}
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white"
          />
          <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <button
            type="button"
            onClick={() => setShowCreatePassword(!showCreatePassword)}
            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-650"
          >
            {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-zinc-550 leading-relaxed">
          {t('passwordHelper')}
        </p>
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
        className="w-full bg-red-500 hover:bg-red-600 text-white font-extrabold py-3 px-4 rounded-xl shadow-lg transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
      >
        <Megaphone className="w-4 h-4" />
        {formLoading ? t('postingButton') : t('postRequestButton')}
      </button>
    </form>
  );
}
