import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';

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
