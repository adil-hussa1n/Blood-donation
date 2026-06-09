-- Migration: Security Setup, RLS Policies, and Rate Limiting Logs
-- Date: 2026-06-09

-- 1. Create rate_limit_logs table for tracking attempts and rate limiting
CREATE TABLE IF NOT EXISTS rate_limit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address text NOT NULL,
    request_type text NOT NULL, -- 'donor_registration', 'emergency_request', 'donor_update', 'admin_action'
    status text NOT NULL,       -- 'allowed', 'blocked'
    reason text,                -- 'rate_limit', 'invalid_phone', 'auth_failed', 'honeypot_triggered', 'too_fast'
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Index for fast rate-limit lookups by IP and timestamp
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_time ON rate_limit_logs (ip_address, created_at);

-- 2. Enable Row Level Security (RLS) on all tables
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read on donors" ON donors;
DROP POLICY IF EXISTS "Allow public read on emergency_requests" ON emergency_requests;
DROP POLICY IF EXISTS "Allow public read on donation_history" ON donation_history;
DROP POLICY IF EXISTS "Allow public read on admins" ON admins;
DROP POLICY IF EXISTS "Allow public read on rate_limit_logs" ON rate_limit_logs;

-- 4. Create SELECT policies for public read-only tables
CREATE POLICY "Allow public read on donors" ON donors
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read on emergency_requests" ON emergency_requests
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read on donation_history" ON donation_history
    FOR SELECT TO public USING (true);

-- Note: No policies are created for INSERT, UPDATE, or DELETE on any table for public/anon roles.
-- Since RLS is enabled, all write requests (INSERT/UPDATE/DELETE) from the anonymous public API
-- will be automatically rejected.
-- Only database superusers, owners, or calls using the Service Role Key (bypassing RLS)
-- (such as our Supabase Edge Functions) will be allowed to modify data.

-- 5. Strict lock down on admins and rate_limit_logs tables
-- No public read or write access allowed at all.
-- Only accessible via Edge Functions using the service role key.

-- 6. RPC: Auto-reset donor availability after 90 days of cooldown
CREATE OR REPLACE FUNCTION reset_expired_cooldowns()
RETURNS void AS $$
BEGIN
  UPDATE donors 
  SET is_available = true 
  WHERE is_available = false 
    AND last_donation_date <= now() - interval '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: Auto-prune emergency requests older than 24 hours
CREATE OR REPLACE FUNCTION prune_expired_emergencies()
RETURNS void AS $$
BEGIN
  DELETE FROM emergency_requests 
  WHERE created_at <= now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RPC: Securely verify admin credentials without exposing table
CREATE OR REPLACE FUNCTION verify_admin(p_username text, p_password text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins 
    WHERE username = p_username AND password = p_password
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
