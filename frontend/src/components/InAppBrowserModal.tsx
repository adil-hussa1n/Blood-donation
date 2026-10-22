import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, Copy, Check, Compass, ShieldAlert, ArrowUpRight, MoreHorizontal } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { detectInAppBrowser, getAndroidChromeIntentUrl, copyUrlToClipboard } from '../utils/browser';

interface InAppBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InAppBrowserModal({
  isOpen,
  onClose,
}: InAppBrowserModalProps) {
  const { language } = useApp();
  const [copied, setCopied] = useState(false);
  const browserInfo = detectInAppBrowser();
  const chromeIntentUrl = getAndroidChromeIntentUrl();

  if (!isOpen || typeof document === 'undefined') return null;

  const handleCopyLink = async () => {
    const success = await copyUrlToClipboard();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const appDisplayName = browserInfo.appName || 'Messenger';

  return createPortal(
    <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-5 animate-scale-up text-slate-800 dark:text-zinc-100">
        
        {/* Header with Close */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-snug">
                {language === 'bn' 
                  ? 'ক্রোম বা সাফারিতে সাইটটি ওপেন করুন' 
                  : 'Open in Chrome or Safari'}
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                <span>⚠️</span>
                <span>
                  {language === 'bn'
                    ? `${appDisplayName}-এ গুগল সাইন-ইন সাময়িকভাবে ব্লক থাকে`
                    : `Google blocks sign-in inside ${appDisplayName}`}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Explanation */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
          {language === 'bn'
            ? `অ্যাকাউন্টের সর্বোচ্চ নিরাপত্তার স্বার্থে গুগল সরাসরি ${appDisplayName}-এর ভেতরের ব্রাউজারে সাইন-ইন করা অনুমোদন করে না (ফলে সাদা পাতা বা ব্ল্যাঙ্ক স্ক্রিন দেখাতে পারে)। সম্পূর্ণ ফিচার পেতে ক্রোম বা সাফারিতে খুলুন:`
            : `For your security, Google blocks authentication inside embedded browsers like ${appDisplayName}. This causes Google Sign-In to hang on a blank white page. Please open this page in Chrome or Safari:`}
        </p>

        {/* Android One-Click Chrome Intent Button */}
        {browserInfo.isAndroid ? (
          <div className="space-y-2">
            <a
              href={chromeIntentUrl}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all text-center"
            >
              <Compass className="w-4 h-4 shrink-0 animate-spin-slow" />
              <span>{language === 'bn' ? 'গুগল ক্রোমে ওপেন করুন (১-ক্লিক)' : 'Open in Google Chrome (1-Click)'}</span>
              <ExternalLink className="w-4 h-4 shrink-0" />
            </a>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 text-center">
              {language === 'bn' 
                ? 'এই লিংকে চাপ দিলে সাথে সাথে আসল গুগল ক্রোমে সাইটটি চালু হবে।'
                : 'Instantly opens the official Google Chrome app on your phone.'}
            </p>
          </div>
        ) : (
          /* iOS Step-by-Step Guide */
          <div className="bg-slate-50 dark:bg-zinc-850/70 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-zinc-200">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">1</span>
              <span>
                {language === 'bn'
                  ? 'উপরে ডানে থাকা তিনটি বিন্দু (•••) চাপ দিন'
                  : 'Tap the (•••) menu in the top-right corner'}
              </span>
              <MoreHorizontal className="w-4 h-4 text-blue-500 ml-auto shrink-0" />
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-zinc-200">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">2</span>
              <span>
                {language === 'bn'
                  ? '"Open in Safari" অথবা "Open in Chrome" নির্বাচন করুন'
                  : 'Select "Open in Safari" or "Open in Chrome"'}
              </span>
              <ArrowUpRight className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />
            </div>
          </div>
        )}

        {/* Copy Link Option */}
        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 space-y-2.5">
          <button
            type="button"
            onClick={handleCopyLink}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
              copied
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{language === 'bn' ? 'লিংক কপি হয়েছে! ক্রোম বা সাফারিতে পেস্ট করুন' : 'Link Copied! Paste in Chrome / Safari'}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{language === 'bn' ? 'ওয়েবসাইট লিংক কপি করুন' : 'Copy Website Link'}</span>
              </>
            )}
          </button>

          {/* Dismiss button */}
          <div className="flex items-center justify-center pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 font-medium py-1.5 px-5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
