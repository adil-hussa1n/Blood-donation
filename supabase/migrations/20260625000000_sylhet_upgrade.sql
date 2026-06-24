-- =============================================================================
-- SYLHET UPGRADE MIGRATION
-- Run this entire file in the Supabase SQL Editor
-- =============================================================================

-- 1. TRUNCATE ALL DATA (clean slate for Sylhet launch)
TRUNCATE TABLE public.donation_history CASCADE;
TRUNCATE TABLE public.emergency_requests CASCADE;
TRUNCATE TABLE public.donors CASCADE;

-- 2. Add Date of Birth column to donors table
ALTER TABLE public.donors
  ADD COLUMN IF NOT EXISTS dob date;

COMMENT ON COLUMN public.donors.dob IS
  'Donor date of birth — used only for identity verification. Never displayed publicly.';

-- 3. Create blocked_donors table
CREATE TABLE IF NOT EXISTS public.blocked_donors (
  phone text PRIMARY KEY,
  reason text,
  blocked_by text,
  blocked_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on blocked_donors
ALTER TABLE public.blocked_donors ENABLE ROW LEVEL SECURITY;

-- No public read/write on blocked_donors — only accessible via SECURITY DEFINER RPCs

-- 4. Update register_donor_secure RPC to include dob + block check + rate limit
CREATE OR REPLACE FUNCTION public.register_donor_secure(
  p_name text,
  p_phone text,
  p_blood_group text,
  p_area text,
  p_last_donation_date date DEFAULT NULL,
  p_is_available boolean DEFAULT true,
  p_password text DEFAULT '123456',
  p_lifetime_count integer DEFAULT 0,
  p_honeypot text DEFAULT '',
  p_dob date DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_row public.donors%ROWTYPE;
  v_recent_attempts integer;
BEGIN
  -- Bot honeypot check
  IF COALESCE(trim(p_honeypot), '') <> '' THEN
    RAISE EXCEPTION 'Verification failed. Bot detected.';
  END IF;

  -- Phone format validation
  IF p_phone IS NULL OR p_phone !~ '^01[3-9][0-9]{8}$' THEN
    RAISE EXCEPTION 'Invalid phone number. Must be a valid 11-digit Bangladeshi number starting with 013-019.';
  END IF;

  -- Password length check
  IF COALESCE(length(trim(p_password)), 0) < 4 THEN
    RAISE EXCEPTION 'Password must be at least 4 characters long.';
  END IF;

  -- DOB required check
  IF p_dob IS NULL THEN
    RAISE EXCEPTION 'Date of birth is required for registration.';
  END IF;

  -- Block check — reject if phone is blocked by admin
  IF EXISTS (SELECT 1 FROM public.blocked_donors WHERE phone = trim(p_phone)) THEN
    RAISE EXCEPTION 'Your account has been blocked. Contact Support.';
  END IF;

  -- Server-side rate limit: max 1 registration attempt per phone per 60 seconds
  SELECT COUNT(*) INTO v_recent_attempts
  FROM public.rate_limit_logs
  WHERE ip_address = trim(p_phone)
    AND request_type = 'donor_registration'
    AND status = 'allowed'
    AND created_at >= now() - interval '60 seconds';

  IF v_recent_attempts >= 1 THEN
    INSERT INTO public.rate_limit_logs (ip_address, request_type, status, reason)
    VALUES (trim(p_phone), 'donor_registration', 'blocked', 'rate_limit');
    RAISE EXCEPTION 'Too many registration attempts. Please wait 1 minute before trying again.';
  END IF;

  -- Duplicate phone check
  IF EXISTS (SELECT 1 FROM public.donors WHERE phone = trim(p_phone)) THEN
    RAISE EXCEPTION 'Phone number % is already registered.', trim(p_phone);
  END IF;

  -- Log this attempt as allowed
  INSERT INTO public.rate_limit_logs (ip_address, request_type, status, reason)
  VALUES (trim(p_phone), 'donor_registration', 'allowed', NULL);

  v_count := GREATEST(0, LEAST(COALESCE(p_lifetime_count, 0), 999));
  IF v_count < 1 AND p_last_donation_date IS NOT NULL THEN
    v_count := 1;
  END IF;

  INSERT INTO public.donors (
    name, phone, blood_group, area, last_donation_date,
    is_available, password, total_donations, lifetime_donation_count, dob
  ) VALUES (
    trim(p_name), trim(p_phone), p_blood_group, p_area, p_last_donation_date,
    COALESCE(p_is_available, true), p_password, v_count, v_count, p_dob
  )
  RETURNING * INTO v_row;

  -- Force counts again (guards against triggers on donors table)
  UPDATE public.donors
  SET total_donations = v_count,
      lifetime_donation_count = v_count
  WHERE id = v_row.id
  RETURNING * INTO v_row;

  RETURN row_to_json(v_row);
END;
$$;

-- 5. Create DOB-verified password reset RPC
CREATE OR REPLACE FUNCTION public.reset_donor_password_secure(
  p_name text,
  p_phone text,
  p_blood_group text,
  p_dob date,
  p_new_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.donors%ROWTYPE;
BEGIN
  -- Block check
  IF EXISTS (SELECT 1 FROM public.blocked_donors WHERE phone = trim(p_phone)) THEN
    RAISE EXCEPTION 'Your account has been blocked. Contact Support.';
  END IF;

  -- Find donor matching name + phone + blood_group + dob
  SELECT * INTO v_row
  FROM public.donors
  WHERE lower(trim(name)) = lower(trim(p_name))
    AND trim(phone) = trim(p_phone)
    AND blood_group = p_blood_group
    AND dob = p_dob;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification failed. No donor matched the provided Name, Phone, Blood Group, and Date of Birth.';
  END IF;

  IF COALESCE(length(trim(p_new_password)), 0) < 4 THEN
    RAISE EXCEPTION 'New password must be at least 4 characters long.';
  END IF;

  UPDATE public.donors
  SET password = p_new_password
  WHERE id = v_row.id
  RETURNING * INTO v_row;

  RETURN row_to_json(v_row);
END;
$$;

-- 6. Admin: Block a donor by phone number
CREATE OR REPLACE FUNCTION public.block_donor_by_phone(
  p_phone text,
  p_admin_username text,
  p_admin_password text,
  p_reason text DEFAULT 'Blocked by admin'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify admin credentials
  IF NOT EXISTS (
    SELECT 1 FROM public.admins
    WHERE username = p_admin_username AND password = p_admin_password
  ) THEN
    RAISE EXCEPTION 'Unauthorized. Invalid admin credentials.';
  END IF;

  IF p_phone IS NULL OR p_phone !~ '^01[3-9][0-9]{8}$' THEN
    RAISE EXCEPTION 'Invalid phone number format.';
  END IF;

  INSERT INTO public.blocked_donors (phone, reason, blocked_by)
  VALUES (trim(p_phone), COALESCE(p_reason, 'Blocked by admin'), p_admin_username)
  ON CONFLICT (phone) DO UPDATE SET
    reason = EXCLUDED.reason,
    blocked_by = EXCLUDED.blocked_by,
    blocked_at = now();

  RETURN json_build_object('success', true, 'phone', trim(p_phone));
END;
$$;

-- 7. Admin: Unblock a donor by phone number
CREATE OR REPLACE FUNCTION public.unblock_donor_by_phone(
  p_phone text,
  p_admin_username text,
  p_admin_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify admin credentials
  IF NOT EXISTS (
    SELECT 1 FROM public.admins
    WHERE username = p_admin_username AND password = p_admin_password
  ) THEN
    RAISE EXCEPTION 'Unauthorized. Invalid admin credentials.';
  END IF;

  DELETE FROM public.blocked_donors WHERE phone = trim(p_phone);

  RETURN json_build_object('success', true, 'phone', trim(p_phone));
END;
$$;

-- 8. Admin: Get list of all blocked phones
CREATE OR REPLACE FUNCTION public.get_blocked_phones(
  p_admin_username text,
  p_admin_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  -- Verify admin credentials
  IF NOT EXISTS (
    SELECT 1 FROM public.admins
    WHERE username = p_admin_username AND password = p_admin_password
  ) THEN
    RAISE EXCEPTION 'Unauthorized. Invalid admin credentials.';
  END IF;

  SELECT json_agg(row_to_json(b))
  INTO v_result
  FROM public.blocked_donors b
  ORDER BY b.blocked_at DESC;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;

-- 8b. Public: Check if a phone is blocked
CREATE OR REPLACE FUNCTION public.is_phone_blocked(p_phone text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.blocked_donors WHERE phone = trim(p_phone));
END;
$$;

-- 9. Grant execute permissions on all new RPCs
GRANT EXECUTE ON FUNCTION public.register_donor_secure(
  text, text, text, text, date, boolean, text, integer, text, date
) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.reset_donor_password_secure(
  text, text, text, date, text
) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.block_donor_by_phone(
  text, text, text, text
) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.unblock_donor_by_phone(
  text, text, text
) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.get_blocked_phones(
  text, text
) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.is_phone_blocked(
  text
) TO anon, authenticated, service_role;

-- 10. Keep existing RPCs that are still needed
GRANT EXECUTE ON FUNCTION public.log_donation_secure(
  uuid, date, text
) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.reset_expired_cooldowns() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.prune_expired_emergencies() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_admin(text, text) TO anon, authenticated, service_role;
