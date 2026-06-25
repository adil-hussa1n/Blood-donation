-- Migration: Hospital Approval & Verification
-- Date: 2026-06-25

-- 1. Add is_verified column to hospitals table
ALTER TABLE public.hospitals 
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false NOT NULL;

-- 2. RPC: Approve/Verify hospital by admin
CREATE OR REPLACE FUNCTION public.approve_hospital_admin(
  p_hospital_id uuid,
  p_is_verified boolean,
  p_admin_username text,
  p_admin_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify admin
  IF NOT public.verify_admin(p_admin_username, p_admin_password) THEN
    RAISE EXCEPTION 'Invalid Administrator Credentials.';
  END IF;

  UPDATE public.hospitals
  SET is_verified = p_is_verified
  WHERE id = p_hospital_id;

  RETURN json_build_object('success', true);
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.approve_hospital_admin(uuid, boolean, text, text) TO anon, authenticated, service_role;
