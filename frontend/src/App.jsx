import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';

// Scroll to top on every route change so pages never open mid-scroll from footer clicks
function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    // Instantly scroll window to top
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}

// Dynamically manage page titles & meta descriptions per route for optimal SEO
function PageMetadataHandler() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    let title = 'Darun Donors - Emergency Blood Donation Platform | Sylhet';
    let description = 'Find voluntary, verified blood donors instantly across Sylhet Division. Post emergency blood requests and save lives 24/7.';

    if (pathname === '/emergency') {
      title = 'Live Emergency Blood Requests | Darun Donors Sylhet';
      description = 'View real-time emergency blood requests in Sylhet. Connect directly with patients and emergency seekers to donate blood immediately.';
    } else if (pathname === '/register') {
      title = 'Register as Voluntary Blood Donor | Darun Donors';
      description = 'Sign up as a voluntary blood donor in Sylhet. Manage your donation cooldown, availability, and receive local emergency blood alerts.';
    } else if (pathname === '/support') {
      title = 'Help & Support Center | Darun Donors';
      description = 'Need help or have questions about blood donation in Sylhet? Reach out to the Darun Donors volunteer and technical support team.';
    } else if (pathname === '/terms') {
      title = 'Terms of Service | Darun Donors';
      description = 'Review the official guidelines and terms of service for utilizing the Darun Donors emergency blood network.';
    } else if (pathname === '/privacy') {
      title = 'Privacy Policy & Data Security | Darun Donors';
      description = 'Learn how Darun Donors protects your personal information, phone number privacy, and blood donation records.';
    } else if (pathname === '/install' || pathname === '/manual' || pathname === '/pwa') {
      title = 'Web App User Manual (Android, iOS, PC, Mac) | Darun Donors';
      description = 'Step-by-step user manual instructions to install and use Darun Donors as a fast, offline-ready web app on Android, iPhone/iPad (iOS), Windows, and Mac.';
    } else if (pathname === '/admin' || pathname === '/darun') {
      title = 'Staff Verification | Darun Donors';
      description = 'Authorized portal verification for staff moderators.';
    }

    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    }
  }, [pathname]);

  return null;
}

// Automatically clean up and redirect any accidental hash fragments (e.g. /emergency#/register -> /register)
function HashRedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      const targetPath = window.location.hash.replace('#', '');
      window.history.replaceState(null, '', targetPath);
      navigate(targetPath, { replace: true });
    }
  }, [location, navigate]);

  return null;
}

import ErrorBoundary from './components/ErrorBoundary';

// Resilient dynamic importer for mobile devices & flaky networks:
// Retries failed chunk downloads and auto-recovers from bundle hash changes
function lazyWithRetry(componentImport) {
  return React.lazy(async () => {
    const pageKey = 'chunk_retry_' + window.location.pathname;
    try {
      const component = await componentImport();
      try { sessionStorage.removeItem(pageKey); } catch (e) {}
      return component;
    } catch (error) {
      console.warn('Initial chunk load failed on mobile network, retrying in 350ms...', error);
      try {
        await new Promise((resolve) => setTimeout(resolve, 350));
        const component = await componentImport();
        try { sessionStorage.removeItem(pageKey); } catch (e) {}
        return component;
      } catch (retryErr) {
        let alreadyRetried = false;
        try {
          alreadyRetried = sessionStorage.getItem(pageKey) === 'true';
          if (!alreadyRetried) {
            sessionStorage.setItem(pageKey, 'true');
          }
        } catch (e) {}

        if (!alreadyRetried) {
          console.warn('Retrying with full page reload to fetch latest bundle...');
          window.location.reload();
          return new Promise(() => {});
        }
        throw retryErr;
      }
    }
  });
}

// Route-based code splitting with resilient network retry
const Home = lazyWithRetry(() => import('./pages/Home.tsx'));
const Register = lazyWithRetry(() => import('./pages/Register'));
const Emergency = lazyWithRetry(() => import('./pages/Emergency'));
const Admin = lazyWithRetry(() => import('./pages/Admin'));
const Support = lazyWithRetry(() => import('./pages/Support'));
const Legal = lazyWithRetry(() => import('./pages/Legal'));

// Lightweight loading fallback for lazy-loaded routes
function RouteLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
          Loading...
        </span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <ScrollToTop />
          <PageMetadataHandler />
          <HashRedirectHandler />
          <Layout>
            <ErrorBoundary>
              <Suspense fallback={<RouteLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/emergency" element={<Emergency />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/terms" element={<Legal />} />
                  <Route path="/privacy" element={<Legal />} />
                  <Route path="/legal" element={<Legal />} />
                  <Route path="/install" element={<Legal />} />
                  <Route path="/manual" element={<Legal />} />
                  <Route path="/pwa" element={<Legal />} />

                  {/* Admin routes: support /admin, /adil, and /darun */}
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/darun" element={<Admin />} />

                  {/* Fallback route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </Layout>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}
