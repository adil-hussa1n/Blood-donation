import React, { useState, useEffect } from 'react';
import { HelpCircle, MessageSquare, AlertTriangle, CheckCircle2, User, Phone, Clipboard, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dbService } from '../services/db';

export default function Support() {
  const { language, t } = useApp();
  const [activeTab, setActiveTab] = useState('support'); // 'support' or 'problem'
  
  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [issueType, setIssueType] = useState('bug_report');

  const [formLoading, setFormLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Reset notifications on tab switch
  useEffect(() => {
    setSuccessMsg('');
    setErrorMsg('');
  }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedPhone || !trimmedMessage) {
      setErrorMsg(t('fillAllFieldsError'));
      return;
    }

    // Strict phone number check matching BD format
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      setErrorMsg("Invalid phone number. Must be a valid 11-digit Bangladeshi number starting with 013-019.");
      return;
    }

    setFormLoading(true);

    const requestData = {
      type: activeTab, // 'support' or 'problem'
      name: trimmedName,
      phone: trimmedPhone,
      message: trimmedMessage,
      issue_type: activeTab === 'problem' ? issueType : null
    };

    try {
      const res = await dbService.submitSupportRequest(requestData);
      if (res.success) {
        setSuccessMsg(t('supportSuccessMsg'));
        setName('');
        setPhone('');
        setMessage('');
      } else {
        setErrorMsg(res.error?.message || t('supportErrorMsg'));
      }
    } catch (err) {
      setErrorMsg(t('unexpectedError'));
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 animate-fade-in text-left">
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 rounded-2xl bg-red-500/10 text-red-500 dark:bg-red-500/20">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('supportTitle')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium max-w-md mx-auto">
          {t('supportDesc')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-zinc-900/60 rounded-xl border border-slate-200/50 dark:border-zinc-800/40">
        <button
          onClick={() => setActiveTab('support')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'support'
              ? 'bg-white dark:bg-zinc-800 text-red-500 shadow-sm'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          {t('contactSupportTab')}
        </button>
        <button
          onClick={() => setActiveTab('problem')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'problem'
              ? 'bg-white dark:bg-zinc-800 text-red-500 shadow-sm'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          {t('reportProblemTab')}
        </button>
      </div>

      {/* Form Card */}
      <div className="glass-panel rounded-3xl p-5 sm:p-8 space-y-6 relative overflow-hidden">
        {/* Status Alerts */}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-scale-up">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-scale-up">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              {t('supportName')}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Adil Hussain"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-sm transition-all"
                required
              />
            </div>
          </div>

          {/* Phone Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              {t('supportPhone')}
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 01712345678"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-sm transition-all"
                required
              />
            </div>
          </div>

          {/* Issue Type (Only for Problem tab) */}
          {activeTab === 'problem' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                {t('supportIssueType')}
              </label>
              <div className="relative">
                <Clipboard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-sm transition-all appearance-none cursor-pointer"
                >
                  <option value="blocked_account">{t('blockedAccount')}</option>
                  <option value="bug_report">{t('bugReport')}</option>
                  <option value="fake_donor">{t('fakeDonor')}</option>
                  <option value="incorrect_details">{t('incorrectDonorDetails')}</option>
                  <option value="other">{t('otherIssue')}</option>
                </select>
              </div>
            </div>
          )}

          {/* Message Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
              {t('supportMessage')}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={activeTab === 'support' ? "Describe your question or request..." : "Describe the problem in detail..."}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-sm transition-all resize-none"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={formLoading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-extrabold text-sm py-3.5 px-6 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {formLoading ? t('processingButton') : t('supportSubmit')}
          </button>
        </form>
      </div>
    </div>
  );
}
