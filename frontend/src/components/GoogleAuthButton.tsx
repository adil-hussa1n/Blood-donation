import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { detectInAppBrowser } from '../utils/browser';
import InAppBrowserModal from './InAppBrowserModal';

interface GoogleAuthButtonProps {
  mode: 'login' | 'register';
  onSuccess: (data: {
    isNewUser: boolean;
    donor?: any;
    googleProfile?: { google_id: string; email: string; name: string; avatar_url: string };
    token?: string;
  }) => void;
  onError: (errMsg: string) => void;
  disabled?: boolean;
}

export default function GoogleAuthButton({
  mode,
  onSuccess,
  onError,
  disabled = false,
}: GoogleAuthButtonProps) {
  const { loginDonorWithGoogle, t, language } = useApp();
  const [loading, setLoading] = useState(false);
  const [showInAppModal, setShowInAppModal] = useState(false);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const [hasRenderedGoogleBtn, setHasRenderedGoogleBtn] = useState(false);

  const browserInfo = detectInAppBrowser();
  const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '';
  const isRealGoogleConfigured = clientId && clientId.trim() !== '' && !clientId.includes('YOUR_GOOGLE_CLIENT_ID');

  useEffect(() => {
    // If user is inside an in-app browser like Messenger or Facebook, DO NOT render Google's iframe button.
    // Google strictly blocks authentication inside WebViews and Messenger sandboxing breaks popup communication,
    // causing a blank white page. We keep hasRenderedGoogleBtn as false so our safe branded button is shown.
    if (browserInfo.isInApp) {
      setHasRenderedGoogleBtn(false);
      return;
    }

    // If real Google Client ID is configured, initialize Google Identity Services
    if (isRealGoogleConfigured && typeof window !== 'undefined') {
      const initGsi = () => {
        if ((window as any).google?.accounts?.id) {
          try {
            (window as any).google.accounts.id.initialize({
              client_id: clientId,
              callback: async (response: any) => {
                if (response.credential) {
                  await handleGoogleCredential(response.credential);
                }
              },
            });

            if (googleBtnContainerRef.current) {
              googleBtnContainerRef.current.innerHTML = '';
              (window as any).google.accounts.id.renderButton(googleBtnContainerRef.current, {
                theme: 'outline',
                size: 'large',
                width: 320,
                text: mode === 'register' ? 'signup_with' : 'signin_with',
                shape: 'pill',
                logo_alignment: 'left',
              });
              setHasRenderedGoogleBtn(true);
            }
          } catch (err) {
            console.warn('Google Identity initialization error:', err);
          }
        }
      };

      if ((window as any).google?.accounts?.id) {
        initGsi();
      } else {
        // Wait for script to load
        const interval = setInterval(() => {
          if ((window as any).google?.accounts?.id) {
            clearInterval(interval);
            initGsi();
          }
        }, 200);
        return () => clearInterval(interval);
      }
    }
  }, [clientId, isRealGoogleConfigured, mode, browserInfo.isInApp]);

  const handleGoogleCredential = async (credential: string) => {
    setLoading(true);
    try {
      const res = await loginDonorWithGoogle({ credential });
      if (res.success) {
        onSuccess(res as any);
      } else {
        onError(res.error?.message || 'Google sign-in failed.');
      }
    } catch (err: any) {
      onError(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (disabled || loading) return;

    // Intercept in-app browser to prevent Google's blank screen / disallowed_useragent error
    if (browserInfo.isInApp) {
      setShowInAppModal(true);
      return;
    }

    if (isRealGoogleConfigured && (window as any).google?.accounts?.id) {
      // Trigger native Google prompt
      (window as any).google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          onError(
            language === 'bn'
              ? 'গুগল সাইন-ইন উইন্ডোটি ব্লক বা বন্ধ হয়েছে। অনুগ্রহ করে পপ-আপ অনুমোদন করে পুনরায় চেষ্টা করুন।'
              : 'Google sign-in popup was blocked or closed. Please allow popups or try again.'
          );
        }
      });
    } else {
      onError(
        language === 'bn'
          ? 'গুগল সাইন-ইন সেবা লোড হচ্ছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
          : 'Google sign-in service is initializing. Please try again in a moment.'
      );
    }
  };

  const label = mode === 'register' ? t('registerWithGoogle') : t('signInWithGoogle');

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Official Google GIS rendered button container */}
      <div 
        ref={googleBtnContainerRef} 
        className={hasRenderedGoogleBtn ? 'flex justify-center w-full min-h-[44px]' : 'hidden'} 
      />

      {/* Branded fallback button */}
      {!hasRenderedGoogleBtn && (
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={disabled || loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-zinc-750 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 font-bold text-sm shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-850 hover:border-slate-300 dark:hover:border-zinc-700 active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-50"
        >
          {/* Google G logo */}
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
              fill="#4285F4"
            />
            <path
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.41 7.34 24 12 24z"
              fill="#34A853"
            />
            <path
              d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.13z"
              fill="#FBBC05"
            />
            <path
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.59 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
              fill="#EA4335"
            />
          </svg>

          <span>{loading ? 'Connecting Google...' : label}</span>

          {browserInfo.isInApp && (
            <span className="text-[10px] bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/20 ml-auto sm:ml-1">
              {browserInfo.appName || 'In-App'}
            </span>
          )}
        </button>
      )}

      {/* In-App Browser Guidance Modal (Prevents blank white page when clicking inside Messenger/FB) */}
      <InAppBrowserModal
        isOpen={showInAppModal}
        onClose={() => setShowInAppModal(false)}
      />
    </div>
  );
}
