import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, X, Heart, UserPlus, Flame, Shield, Database, Sparkles, Languages } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Layout({ children }) {
  const { theme, toggleTheme, isAdmin, logoutAdmin, isDemoMode, language, setLanguage, t } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuAnimKey, setMobileMenuAnimKey] = useState(0);
  const location = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => {
      if (!prev) setMobileMenuAnimKey((key) => key + 1);
      return !prev;
    });
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Obfuscated navigation - Admin panel is accessed only by going to /adil manually
  const navigation = [
    { nameKey: 'searchDonors', name: 'Search Donors', path: '/', icon: Heart },
    { nameKey: 'registerUpdate', name: 'Register / Update', path: '/register', icon: UserPlus },
    { nameKey: 'emergencyRequests', name: 'Emergency Requests', path: '/emergency', icon: Flame },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Top Banner for Demo Mode */}
      {isDemoMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-1.5 backdrop-blur-sm">
          <Database className="w-3.5 h-3.5" />
          <span>Demo Mode Enabled: Data is saved locally in your browser. Configure environment variables to connect Supabase.</span>
        </div>
      )}

      {/* Main Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b transition-all duration-300 backdrop-blur-md" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/20 group-hover:scale-105 transition-all duration-300">
                <svg className="w-6 h-6 animate-pulse" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
                  <path d="M50 12C50 12 22 45 22 65C22 80.46 34.54 93 50 93C65.46 93 78 80.46 78 65C78 45 50 12 50 12Z" fill="#ffffff" />
                  <path d="M32 65h10l4-18 5 32 4-22 4 8h9" stroke="#ef4444" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                
              </div>
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-sm md:text-base leading-tight tracking-tight text-slate-900 dark:text-white group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
                  Bloodify247
                </span>
                <span className="text-[11px] font-bold tracking-wider text-red-500 dark:text-red-400">
                  By GraffixInnovation
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.nameKey}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-red-500 text-white shadow-md shadow-red-500/10'
                        : 'text-slate-600 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t(item.nameKey)}
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  to="/adil"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive('/adil')
                      ? 'bg-red-500 text-white shadow-md'
                      : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  {t('adminDashboard')}
                </Link>
              )}
            </nav>

            {/* Actions (Theme toggle + Mobile menu) */}
            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <button
                onClick={() => setLanguage(prev => (prev === 'en' ? 'bn' : 'en'))}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-zinc-900 transition-all duration-200 border border-slate-200/50 dark:border-zinc-800/50 shadow-sm text-xs font-bold cursor-pointer"
                title={language === 'en' ? 'Switch to Bangla' : 'ইংরেজিতে পরিবর্তন করুন'}
              >
                <Languages className="w-4 h-4 text-red-500 animate-pulse" />
                <span className="text-[10px] tracking-tight">{language === 'en' ? 'EN' : 'বাং'}</span>
              </button>

              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-zinc-900 transition-all duration-200 border border-slate-200/50 dark:border-zinc-800/50 shadow-sm cursor-pointer"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {isAdmin && (
                <button
                  onClick={logoutAdmin}
                  className="hidden md:block px-3 py-1.5 rounded-lg text-xs font-medium border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-200"
                >
                  {t('logoutAdmin')}
                </button>
              )}

              {/* Hamburger Menu */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden relative p-2.5 rounded-xl text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-zinc-900 transition-colors duration-200 border border-slate-200/50 dark:border-zinc-800/50 cursor-pointer"
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                <Menu
                  className={`w-4 h-4 mobile-menu-icon absolute inset-0 m-auto ${
                    mobileMenuOpen ? 'mobile-menu-icon--menu-hidden' : 'mobile-menu-icon--menu'
                  }`}
                />
                <X
                  className={`w-4 h-4 mobile-menu-icon absolute inset-0 m-auto ${
                    mobileMenuOpen ? 'mobile-menu-icon--close-visible' : 'mobile-menu-icon--close'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden mobile-nav-shell ${mobileMenuOpen ? 'mobile-nav-shell--open' : ''}`}
          aria-hidden={!mobileMenuOpen}
        >
          <div className="mobile-nav-dropdown">
            <div key={mobileMenuAnimKey} className="mobile-nav-dropdown__inner space-y-1">
              {navigation.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.nameKey}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ animationDelay: mobileMenuOpen ? `${100 + index * 45}ms` : '0ms' }}
                    tabIndex={mobileMenuOpen ? 0 : -1}
                    className={`mobile-nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors duration-200 ${
                      active
                        ? 'bg-red-500 text-white shadow-md'
                        : 'text-slate-600 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {t(item.nameKey)}
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  to="/adil"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ animationDelay: mobileMenuOpen ? `${100 + navigation.length * 45}ms` : '0ms' }}
                  tabIndex={mobileMenuOpen ? 0 : -1}
                  className={`mobile-nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors duration-200 ${
                    isActive('/adil') ? 'bg-red-500 text-white' : 'text-rose-500'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  {t('adminDashboard')}
                </Link>
              )}
              {isAdmin && (
                <button
                  onClick={() => {
                    logoutAdmin();
                    setMobileMenuOpen(false);
                  }}
                  style={{ animationDelay: mobileMenuOpen ? `${100 + (navigation.length + 1) * 45}ms` : '0ms' }}
                  tabIndex={mobileMenuOpen ? 0 : -1}
                  className="mobile-nav-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  <Shield className="w-5 h-5" />
                  {t('logoutAdmin')}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 animate-fade-in">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full py-5 sm:py-8 mt-6 sm:mt-12 glass-panel border-t border-slate-200/50 dark:border-zinc-800/50 text-center" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 fill-current animate-pulse" />
              <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white">
                © {new Date().getFullYear()} Bloodify247
              </span>
            </div>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 font-semibold tracking-wide">
              Design & Developed By{' '}
              <a
                href="https://www.graffixinnovation.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:underline transition-all font-bold"
              >
                GraffixInnovation
              </a>
            </span>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 dark:text-zinc-500 flex flex-col items-center md:items-end gap-1">
            <span>Dedicated to saving lives in Beanibazar, Sylhet, Bangladesh.</span>
            <a
              href="https://www.graffixinnovation.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-extrabold text-red-500 dark:text-red-400 uppercase tracking-widest text-[8px] sm:text-[9px] bg-red-500/5 dark:bg-red-500/10 hover:bg-red-500/10 dark:hover:bg-red-500/20 px-2 sm:px-2.5 py-0.5 rounded-full border border-red-500/10 hover:border-red-500/20 transition-all"
            >
              A project of GraffixInnovation
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
