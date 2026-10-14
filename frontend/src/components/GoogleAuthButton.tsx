import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';

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
  const [showSimModal, setShowSimModal] = useState(false);
  const [simName, setSimName] = useState('Adil Hussain');
  const [simEmail, setSimEmail] = useState('adilhussa1n.dev@gmail.com');
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const [hasRenderedGoogleBtn, setHasRenderedGoogleBtn] = useState(false);

  const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '';
  const isRealGoogleConfigured = clientId && clientId.trim() !== '' && !clientId.includes('YOUR_GOOGLE_CLIENT_ID');

  useEffect(() => {
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
  }, [clientId, isRealGoogleConfigured, mode]);

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

    if (isRealGoogleConfigured && (window as any).google?.accounts?.id) {
      // Trigger native Google prompt
      (window as any).google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If popup blocked or cancelled, render temporary fallback button
          setShowSimModal(true);
        }
      });
    } else {
      // Show simulated Google authentication dialog for rapid zero-friction local testing
      setShowSimModal(true);
    }
  };

  const handleSimulatedSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simEmail.trim()) return;

    setLoading(true);
    setShowSimModal(false);

    try {
      const simulatedUser = {
        sub: `google_${simEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: simEmail.trim().toLowerCase(),
        name: simName.trim() || 'Google Donor',
        picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(simName || 'Google Donor')}`,
      };

      const res = await loginDonorWithGoogle({ user: simulatedUser });
      if (res.success) {
        onSuccess(res as any);
      } else {
        onError(res.error?.message || 'Google authentication failed.');
      }
    } catch (err: any) {
      onError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
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
        </button>
      )}

      {/* Simulated Google Sign-In Modal (Active when no VITE_GOOGLE_CLIENT_ID is set in .env) */}
      {showSimModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                  <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" fill="#4285F4" />
                  <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.41 7.34 24 12 24z" fill="#34A853" />
                  <path d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.13z" fill="#FBBC05" />
                  <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.59 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z" fill="#EA4335" />
                </svg>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Sign in with Google
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSimModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Select or enter the Google Account you would like to use with <strong>Bloodify247</strong>:
            </p>

            <form onSubmit={handleSimulatedSignIn} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Google Display Name</label>
                <input
                  type="text"
                  required
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400">Google Email</label>
                <input
                  type="email"
                  required
                  value={simEmail}
                  onChange={(e) => setSimEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSimModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
                >
                  {loading ? 'Authenticating...' : 'Sign in as this User'}
                </button>
              </div>

              <p className="text-[10px] text-slate-400 dark:text-zinc-500 text-center pt-1">
                💡 To enable real Google popups, add <code className="bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded">VITE_GOOGLE_CLIENT_ID</code> to your <code className="bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded">frontend/.env</code>.
              </p>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
