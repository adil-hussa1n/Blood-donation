import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';

// Route-based code splitting: each page is loaded on-demand
// This reduces initial JS payload from ~585KB to ~200KB
const Home = React.lazy(() => import('./pages/Home'));
const Register = React.lazy(() => import('./pages/Register'));
const Emergency = React.lazy(() => import('./pages/Emergency'));
const Admin = React.lazy(() => import('./pages/Admin'));

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
        <Layout>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/emergency" element={<Emergency />} />
              
              {/* Obfuscated Admin route */}
              <Route path="/adil" element={<Admin />} />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </AppProvider>
  );
}
