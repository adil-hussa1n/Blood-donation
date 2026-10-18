import React from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled Application Error caught by ErrorBoundary:', error, errorInfo);

    // If dynamic chunk loading failed (e.g. cellular network dropped or updated bundle hash)
    const errMsg = String(error?.message || '');
    const isChunkFailure = 
      errMsg.includes('Failed to fetch dynamically imported module') ||
      errMsg.includes('Loading chunk') ||
      errMsg.includes('Loading CSS chunk') ||
      errMsg.includes('dynamically imported module');

    if (isChunkFailure) {
      const reloadKey = 'darun_chunk_reload_' + window.location.pathname;
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, 'true');
        console.warn('Auto-reloading page to fetch latest application bundle...');
        window.location.reload();
      }
    }

    // Safety: Ensure scroll is never locked if an error occurred while a modal was open
    try {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('preloader-active');
      document.documentElement.classList.remove('preloader-html');
    } catch (e) {}
  }

  handleReload = () => {
    try {
      sessionStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-5 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Something went wrong
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-400 font-medium">
                পৃষ্ঠাটি লোড করার সময় একটি সমস্যা হয়েছে। পৃষ্ঠাটি পুনরায় রিলোড করুন।
              </p>
              <p className="text-xs text-slate-400 dark:text-zinc-500">
                A temporary network or loading glitch occurred. Reloading the page will restore normal operation.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-650 text-white font-bold text-xs shadow-md shadow-red-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page / রিলোড করুন</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs transition-all active:scale-95 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home / হোম</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
