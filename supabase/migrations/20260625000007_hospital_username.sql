-- Migration: Hospital Username Field
-- Date: 2026-06-25

-- 1. Add unique username column to hospitals table
ALTER TABLE public.hospitals 
  ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Drop old function overloads first to avoid signature and parameter conflicts
DROP FUNCTION IF EXISTS public.register_hospital(text, text, text, text);
DROP FUNCTION IF EXISTS public.verify_hospital(text, text);

-- 2. RPC: Register a new hospital with username
CREATE OR REPLACE FUNCTION public.register_hospital(
  p_name text,
  p_username text,
  p_area text,
  p_contact text,
  p_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hospital public.hospitals%ROWTYPE;
BEGIN
  -- Basic validation
  IF trim(p_name) = '' OR trim(p_username) = '' OR trim(p_contact) = '' OR trim(p_password) = '' THEN
    RAISE EXCEPTION 'Fields cannot be empty.';
  END IF;

  -- Normalize username to lowercase
  p_username := lower(trim(p_username));

  IF EXISTS (SELECT 1 FROM public.hospitals WHERE username = p_username) THEN
    RAISE EXCEPTION 'Username not available.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.hospitals WHERE contact = p_contact) THEN
    RAISE EXCEPTION 'A hospital with this contact phone number is already registered.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.hospitals WHERE name = p_name) THEN
    RAISE EXCEPTION 'A hospital with this name is already registered.';
  END IF;

  INSERT INTO public.hospitals (name, username, area, contact, password, is_verified, created_at)
  VALUES (p_name, p_username, p_area, p_contact, p_password, false, now())
  RETURNING * INTO v_hospital;

  RETURN row_to_json(v_hospital);
END;
$$;

-- 3. RPC: Verify hospital credentials via username securely
CREATE OR REPLACE FUNCTION public.verify_hospital(
  p_username text,
  p_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hospital public.hospitals%ROWTYPE;
BEGIN
  SELECT * INTO v_hospital FROM public.hospitals
  WHERE lower(username) = lower(trim(p_username)) AND password = p_password;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid username or password.';
  END IF;

  RETURN row_to_json(v_hospital);
END;
$$;

-- 4. RPC: Check username availability dynamically
CREATE OR REPLACE FUNCTION public.check_hospital_username_available(
  p_username text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.hospitals 
    WHERE lower(username) = lower(trim(p_username))
  );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.register_hospital(text, text, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_hospital(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_hospital_username_available(text) TO anon, authenticated, service_role;
