// API Configuration for MySQL / Node.js Backend
const rawBaseUrl = (import.meta as any).env.VITE_API_BASE_URL || '';

// Clean trailing slashes
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

// By default, Demo Mode is disabled when connecting to the MySQL backend API.
// You can force demo mode by setting VITE_DEMO_MODE=true in frontend/.env
export const isDemoMode = (import.meta as any).env.VITE_DEMO_MODE === 'true';

export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}/api${cleanEndpoint}`;
}
