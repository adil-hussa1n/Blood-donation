-- =============================================================================
-- RUN THIS ENTIRE FILE IN SUPABASE SQL EDITOR (one click, no edge deploy needed)
-- Fixes donation count stuck at 1 by using lifetime_donation_count + secure RPCs
-- =============================================================================

ALTER TABLE public.donors
  ADD COLUMN IF NOT EXISTS lifetime_donation_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.donors.lifetime_donation_count IS
  'Self-reported + logged lifetime donation count (source of truth for the app).';

-- Backfill from total_donations where we have data
UPDATE public.donors
SET lifetime_donation_count = GREATEST(total_donations, lifetime_donation_count)
WHERE lifetime_donation_count = 0 AND total_donations > 0;

-- ---------------------------------------------------------------------------
-- Register donor (called directly from the website — bypasses old edge function)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_donor_secure(
  p_name text,
  p_phone text,
  p_blood_group text,
  p_area text,
  p_last_donation_date date DEFAULT NULL,
  p_is_available boolean DEFAULT true,
  p_password text DEFAULT '123456',
  p_lifetime_count integer DEFAULT 0,
  p_honeypot text DEFAULT ''
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_row public.donors%ROWTYPE;
BEGIN
  IF COALESCE(trim(p_honeypot), '') <> '' THEN
    RAISE EXCEPTION 'Verification failed. Bot detected.';
  END IF;

  IF p_phone IS NULL OR p_phone !~ '^01[3-9][0-9]{8}$' THEN
    RAISE EXCEPTION 'Invalid phone number. Must be a valid 11-digit Bangladeshi number starting with 013-019.';
  END IF;

  IF COALESCE(length(trim(p_password)), 0) < 4 THEN
    RAISE EXCEPTION 'Password must be at least 4 characters long.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.donors WHERE phone = trim(p_phone)) THEN
    RAISE EXCEPTION 'Phone number % is already registered.', trim(p_phone);
  END IF;

  v_count := GREATEST(0, LEAST(COALESCE(p_lifetime_count, 0), 999));
  IF v_count < 1 AND p_last_donation_date IS NOT NULL THEN
    v_count := 1;
  END IF;

  INSERT INTO public.donors (
    name, phone, blood_group, area, last_donation_date,
    is_available, password, total_donations, lifetime_donation_count
  ) VALUES (
    trim(p_name), trim(p_phone), p_blood_group, p_area, p_last_donation_date,
    COALESCE(p_is_available, true), p_password, v_count, v_count
  )
  RETURNING * INTO v_row;

  -- Force counts again (guards against triggers on donors table)
  UPDATE public.donors
  SET total_donations = v_count,
      lifetime_donation_count = v_count
  WHERE id = v_row.id
  RETURNING * INTO v_row;

  -- Do NOT insert donation_history here (that was resetting counts to 1)

  RETURN row_to_json(v_row);
END;
$$;

-- ---------------------------------------------------------------------------
-- Log a donation and increment lifetime count
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_donation_secure(
  p_donor_id uuid,
  p_donation_date date,
  p_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.donors%ROWTYPE;
  v_new_count integer;
BEGIN
  SELECT * INTO v_row FROM public.donors WHERE id = p_donor_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Donor not found.';
  END IF;

  IF v_row.password IS DISTINCT FROM p_password THEN
    RAISE EXCEPTION 'Invalid password credentials.';
  END IF;

  INSERT INTO public.donation_history (donor_id, donation_date)
  VALUES (p_donor_id, p_donation_date);

  v_new_count := GREATEST(COALESCE(v_row.lifetime_donation_count, v_row.total_donations, 0), 0) + 1;

  UPDATE public.donors
  SET lifetime_donation_count = v_new_count,
      total_donations = v_new_count,
      last_donation_date = p_donation_date,
      is_available = false
  WHERE id = p_donor_id
  RETURNING * INTO v_row;

  RETURN row_to_json(v_row);
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_donor_secure(
  text, text, text, text, date, boolean, text, integer, text
) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.log_donation_secure(
  uuid, date, text
) TO anon, authenticated, service_role;
