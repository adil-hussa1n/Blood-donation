-- =============================================================================
-- SECURE DONOR AUTHENTICATION & COLUMN LEVEL SECURITY
-- =============================================================================

-- 1. Create verify_donor_credentials RPC
CREATE OR REPLACE FUNCTION public.verify_donor_credentials(
  p_phone text,
  p_password text
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

  SELECT * INTO v_row
  FROM public.donors
  WHERE phone = trim(p_phone) AND password = p_password;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid phone or password.';
  END IF;

  RETURN json_build_object(
    'id', v_row.id,
    'name', v_row.name,
    'phone', v_row.phone,
    'blood_group', v_row.blood_group,
    'area', v_row.area,
    'last_donation_date', v_row.last_donation_date,
    'is_available', v_row.is_available,
    'total_donations', v_row.total_donations,
    'lifetime_donation_count', v_row.lifetime_donation_count,
    'dob', v_row.dob,
    'created_at', v_row.created_at
  );
END;
$$;

-- Grant execute to public roles
GRANT EXECUTE ON FUNCTION public.verify_donor_credentials(text, text) TO anon, authenticated, service_role;

-- 2. Revoke public SELECT on password and dob to prevent data scraping
REVOKE SELECT ON public.donors FROM anon, authenticated;

-- 3. Grant column-specific SELECT to public roles
GRANT SELECT (
  id, name, phone, blood_group, area, last_donation_date, 
  is_available, total_donations, lifetime_donation_count, created_at
) ON public.donors TO anon, authenticated, service_role;

-- 4. Revoke public SELECT on passcode in emergency_requests
REVOKE SELECT ON public.emergency_requests FROM anon, authenticated;

-- 5. Grant column-specific SELECT to public roles on emergency_requests
GRANT SELECT (
  id, blood_group, area, contact, note, created_at
) ON public.emergency_requests TO anon, authenticated, service_role;
