import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if keys are properly provided
const isConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.trim() !== '' && 
  supabaseAnonKey.trim() !== '' &&
  !supabaseUrl.includes('YOUR_SUPABASE') &&
  !supabaseAnonKey.includes('YOUR_SUPABASE');

export const isDemoMode = !isConfigured;

if (isDemoMode) {
  console.warn(
    "⚠️ Supabase keys are missing or invalid in your .env file.\n" +
    "The application is running in DEMO MODE using LocalStorage.\n" +
    "To connect to a live database, please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file."
  );
}

export const supabase = isDemoMode ? null : createClient(supabaseUrl, supabaseAnonKey);
