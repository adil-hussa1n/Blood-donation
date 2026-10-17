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

// Route-based code splitting: each page is loaded on-demand
// This reduces initial JS payload from ~585KB to ~200KB
const Home = React.lazy(() => import('./pages/Home.tsx'));
const Register = React.lazy(() => import('./pages/Register'));
const Emergency = React.lazy(() => import('./pages/Emergency'));
const Admin = React.lazy(() => import('./pages/Admin'));
const Support = React.lazy(() => import('./pages/Support'));
const Legal = React.lazy(() => import('./pages/Legal'));

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
    <AppProvider>
      <Router>
        <ScrollToTop />
        <PageMetadataHandler />
        <HashRedirectHandler />
        <Layout>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/emergency" element={<Emergency />} />
              <Route path="/support" element={<Support />} />
              <Route path="/terms" element={<Legal />} />
              <Route path="/privacy" element={<Legal />} />
              <Route path="/legal" element={<Legal />} />

              {/* Admin routes: support /admin, /adil, and /darun */}
              <Route path="/admin" element={<Admin />} />
              <Route path="/darun" element={<Admin />} />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </AppProvider>
  );
}
