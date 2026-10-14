// Backward-compatibility shim for any lingering imports
import { isDemoMode as apiDemoMode } from './apiConfig';

export const isDemoMode = apiDemoMode;
export const supabase = null;
