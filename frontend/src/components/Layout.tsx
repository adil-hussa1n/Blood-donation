import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, X, Heart, UserPlus, Flame, Shield, Database, Languages, ExternalLink, LucideIcon, ChevronRight, LogOut, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NavigationItem {
  nameKey: string;
  name: string;
  path: string;
  icon: LucideIcon;
}

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { theme, toggleTheme, isAdmin, logoutAdmin, currentDonor, logoutDonor, isDemoMode, language, setLanguage, t } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuAnimKey, setMobileMenuAnimKey] = useState(0);
  const location = useLocation();

  const headerRef = React.useRef<HTMLElement | null>(null);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => {
      if (!prev) setMobileMenuAnimKey((key) => key + 1);
      return !prev;
    });
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Dismiss mobile navbar if user taps outside the header or scrolls on mobile
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    const handleScroll = () => {
      setMobileMenuOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [mobileMenuOpen]);

  const navigation: NavigationItem[] = [
    { nameKey: 'searchDonors', name: 'Search Donors', path: '/', icon: Heart },
    {
      nameKey: currentDonor ? 'donorProfileNav' : 'registerUpdate',
      name: currentDonor ? 'Profile' : 'Sign In / Sign Up',
      path: '/register',
      icon: currentDonor ? User : UserPlus,
    },
    { nameKey: 'emergencyRequests', name: 'Emergency Requests', path: '/emergency', icon: Flame },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Top Banner for Demo Mode */}
      {isDemoMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-1.5 backdrop-blur-sm">
          <Database className="w-3.5 h-3.5" />
          <span>Demo Mode Enabled: Data is saved locally in your browser. Start backend server to connect to MySQL.</span>
        </div>
      )}

      {/* Main Header */}
      <header ref={headerRef} className="sticky top-0 z-40 w-full glass-panel border-b transition-all duration-300 backdrop-blur-md relative" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-[1380px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/90 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-md shadow-red-500/10 p-1 group-hover:scale-105 transition-all duration-300">
                <img
                  src="/logo.png"
                  alt="Darun Donors Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-sm md:text-base leading-tight tracking-tight text-slate-900 dark:text-white group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
                  Darun Donors
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-red-500 dark:text-red-400">
                  Save Lives
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex lg:space-x-0.5 xl:space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.nameKey}
                    to={item.path}
                    className={`flex items-center lg:gap-1 xl:gap-1.5 lg:px-2 lg:py-1.5 xl:px-3 xl:py-2 rounded-xl lg:text-[11px] xl:text-xs 2xl:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${active
                      ? 'bg-red-500 text-white shadow-md shadow-red-500/10'
                      : 'text-slate-600 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-zinc-900'
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t(item.nameKey)}
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  to="/darun"
                  className={`flex items-center lg:gap-1 xl:gap-1.5 lg:px-2 lg:py-1.5 xl:px-3 xl:py-2 rounded-xl lg:text-[11px] xl:text-xs 2xl:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${isActive('/adil')
                    ? 'bg-red-500 text-white shadow-md'
                    : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20'
                    }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  {t('adminDashboard')}
                </Link>
              )}
            </nav>

            {/* Actions (Theme toggle + Mobile menu) */}
            <div className="flex items-center gap-1.5 lg:gap-1.5 xl:gap-2">
              {/* Language Selector */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                className="flex items-center gap-1.5 px-2.5 py-2 lg:gap-1 lg:px-2 lg:py-1.5 xl:gap-1.5 xl:px-3 xl:py-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-zinc-900 transition-all duration-200 border border-slate-200/50 dark:border-zinc-800/50 shadow-sm text-xs font-bold cursor-pointer"
                title={language === 'en' ? 'Switch to Bangla' : 'ইংরেজিতে পরিবর্তন করুন'}
              >
                <Languages className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-red-500 animate-pulse" />
                <span className="text-xs lg:text-[10px] tracking-tight">{language === 'en' ? 'EN' : 'বাং'}</span>
              </button>

              <button
                onClick={(e) => toggleTheme(e)}
                className="relative p-2.5 lg:p-2 xl:p-2.5 rounded-xl text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-zinc-900 transition-all duration-200 border border-slate-200/50 dark:border-zinc-800/50 shadow-sm cursor-pointer group active:scale-95"
                aria-label="Toggle Theme"
                title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
              >
                <span className="inline-block transition-transform duration-300 group-hover:rotate-12">
                  {theme === 'dark' ? <Sun className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-400" /> : <Moon className="w-4 h-4 lg:w-3.5 lg:h-3.5" />}
                </span>
              </button>

              {currentDonor && (
                <Link
                  to="/register"
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-all shadow-sm"
                  title="View your donor profile"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="max-w-[110px] truncate">{currentDonor.name || currentDonor.phone}</span>
                </Link>
              )}

              {isAdmin && (
                <button
                  onClick={logoutAdmin}
                  className="hidden lg:block lg:px-2 lg:py-1 xl:px-3 xl:py-1.5 rounded-lg lg:text-[11px] xl:text-xs font-semibold border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-200 cursor-pointer"
                >
                  {t('logoutAdmin')}
                </button>
              )}

              {/* Hamburger Menu */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden relative p-3 rounded-xl text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-zinc-900 transition-colors duration-200 border border-slate-200/50 dark:border-zinc-800/50 cursor-pointer"
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                <Menu
                  className={`w-5 h-5 mobile-menu-icon absolute inset-0 m-auto ${mobileMenuOpen ? 'mobile-menu-icon--menu-hidden' : 'mobile-menu-icon--menu'
                    }`}
                />
                <X
                  className={`w-5 h-5 mobile-menu-icon absolute inset-0 m-auto ${mobileMenuOpen ? 'mobile-menu-icon--close-visible' : 'mobile-menu-icon--close'
                    }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`lg:hidden mobile-nav-shell ${mobileMenuOpen ? 'mobile-nav-shell--open' : ''}`}
          aria-hidden={!mobileMenuOpen}
        >
          <div className="mobile-nav-dropdown">
            <div key={mobileMenuAnimKey} className="mobile-nav-dropdown__inner space-y-1">
              {/* Logged-in User Profile Header in Mobile Menu */}
              {currentDonor && (
                <div 
                  style={{ animationDelay: '60ms' }}
                  className="mobile-nav-item mb-2.5 p-3 rounded-2xl bg-gradient-to-r from-red-500/10 via-rose-500/10 to-transparent dark:from-red-950/40 dark:via-rose-950/30 border border-red-500/20 dark:border-red-900/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 min-w-0 flex-1 group"
                    >
                      <div className="relative shrink-0">
                        {currentDonor.avatar_url ? (
                          <img
                            src={currentDonor.avatar_url}
                            alt={currentDonor.name || 'Donor'}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                              const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                            className="w-11 h-11 rounded-full object-cover border-2 border-red-500/40 shadow-sm"
                          />
                        ) : null}
                        <div
                          className={`w-11 h-11 rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-white font-bold text-base shadow-sm items-center justify-center ${currentDonor.avatar_url ? 'hidden' : 'flex'}`}
                        >
                          {currentDonor.name?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                        </div>
                        {currentDonor.blood_group && (
                          <span className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-md shadow-sm border border-white dark:border-zinc-900 leading-tight">
                            {currentDonor.blood_group}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-red-500 transition-colors">
                            {currentDonor.name || 'Donor Member'}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 truncate flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>{currentDonor.phone || currentDonor.email || t('verifiedDonorBadge')}</span>
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-transform group-hover:translate-x-0.5 shrink-0" />
                    </Link>
                    <button
                      onClick={() => {
                        logoutDonor();
                        setMobileMenuOpen(false);
                      }}
                      title={t('signOutLabel') || 'Sign Out'}
                      aria-label="Log out donor"
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

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
                    className={`mobile-nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors duration-200 ${active
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
                  to="/darun"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ animationDelay: mobileMenuOpen ? `${100 + navigation.length * 45}ms` : '0ms' }}
                  tabIndex={mobileMenuOpen ? 0 : -1}
                  className={`mobile-nav-item flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors duration-200 ${isActive('/adil') ? 'bg-red-500 text-white' : 'text-rose-500'
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
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 animate-fade-in">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full py-5 sm:py-8 mt-6 sm:mt-12 glass-panel border-t border-slate-200/50 dark:border-zinc-800/50 text-center" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex flex-col items-center md:items-start gap-1.5">
            <div className="flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 fill-current animate-pulse" />
              <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white">
                © {new Date().getFullYear()} Darun Donors
              </span>
              <span className="text-slate-300 dark:text-zinc-700">|</span>
              <Link
                to="/support"
                className="text-xs sm:text-sm font-bold text-slate-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 transition-colors"
              >
                {t('supportTitle')}
              </Link>
              <span className="text-slate-300 dark:text-zinc-700">|</span>
              <Link
                to="/terms"
                className="text-xs sm:text-sm font-bold text-slate-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 transition-colors"
              >
                {t('termsNav')}
              </Link>
              <span className="text-slate-300 dark:text-zinc-700">|</span>
              <Link
                to="/privacy"
                className="text-xs sm:text-sm font-bold text-slate-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 transition-colors"
              >
                {t('privacyNav')}
              </Link>
            </div>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 font-semibold tracking-wide">
              A Humanitarian Initiative by <a href="https://daruntech.com" target="_blank" rel="noopener noreferrer" className="font-extrabold text-purple-600 dark:text-purple-400 hover:underline">Darun tech Private Limited</a>
            </span>
          </div>

          {/* Darun Tech Advertisement & Attribution Badge */}
          <div className="flex flex-col items-center md:items-end gap-1.5">
            <a
              href="https://daruntech.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-purple-500/10 via-fuchsia-500/10 to-indigo-500/10 dark:from-purple-950/40 dark:via-fuchsia-950/30 dark:to-indigo-950/40 border border-purple-500/25 hover:border-purple-500/50 shadow-xs hover:shadow-md hover:scale-[1.02] transition-all duration-300"
              title="Visit Darun Tech Private Limited - daruntech.com"
            >
              <div className="w-8 h-8 rounded-xl bg-white p-1 shadow-xs flex items-center justify-center shrink-0 border border-purple-200/50 dark:border-purple-800/40 group-hover:rotate-6 transition-transform duration-300">
                <img
                  src="/daruntech-icon.png"
                  alt="Darun Tech Icon"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-left md:text-right">
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-purple-700 dark:text-purple-300 block leading-tight">
                  Designed & Developed by
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-tight">
                    Darun Tech Private Limited
                  </span>
                  <ExternalLink className="w-3 h-3 text-purple-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
