-- =============================================================================
-- REAL-TIME EMERGENCY TIMELINE & HOSPITAL PORTAL SCHEMAS
-- =============================================================================

-- 1. Add status column to emergency_requests table
ALTER TABLE public.emergency_requests 
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'needed' NOT NULL;

-- Add check constraint for valid status values
ALTER TABLE public.emergency_requests 
  DROP CONSTRAINT IF EXISTS emergency_requests_status_check;

ALTER TABLE public.emergency_requests 
  ADD CONSTRAINT emergency_requests_status_check 
  CHECK (status IN ('needed', 'responded', 'fulfilled'));

-- 2. Create hospital_inventory table
CREATE TABLE IF NOT EXISTS public.hospital_inventory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_name text NOT NULL,
  area text NOT NULL,
  contact text NOT NULL,
  blood_group text NOT NULL,
  stock_status text DEFAULT 'stable' NOT NULL, -- 'low', 'critical', 'stable'
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT hospital_blood_unique UNIQUE (hospital_name, blood_group)
);

-- Add check constraint for stock status
ALTER TABLE public.hospital_inventory 
  DROP CONSTRAINT IF EXISTS hospital_inventory_stock_status_check;

ALTER TABLE public.hospital_inventory 
  ADD CONSTRAINT hospital_inventory_stock_status_check 
  CHECK (stock_status IN ('low', 'critical', 'stable'));

-- Enable Row Level Security (RLS)
ALTER TABLE public.hospital_inventory ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Allow public read on hospital_inventory" ON public.hospital_inventory;
CREATE POLICY "Allow public read on hospital_inventory" 
  ON public.hospital_inventory 
  FOR SELECT 
  TO public 
  USING (true);

-- Allow public inserts and updates via secure RPC
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hospital_inventory TO anon, authenticated, service_role;

-- =============================================================================
-- SECURE UPDATE RPCS
-- =============================================================================

-- RPC: Update emergency request status securely
CREATE OR REPLACE FUNCTION public.update_emergency_status(
  p_id uuid,
  p_status text,
  p_passcode text DEFAULT NULL,
  p_admin_username text DEFAULT NULL,
  p_admin_password text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.emergency_requests%ROWTYPE;
BEGIN
  -- Verify either admin credentials or owner passcode
  IF p_admin_username IS NOT NULL AND p_admin_password IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.admins
      WHERE username = p_admin_username AND password = p_admin_password
    ) THEN
      RAISE EXCEPTION 'Unauthorized admin credentials.';
    END IF;
  ELSE
    SELECT * INTO v_row FROM public.emergency_requests WHERE id = p_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Request not found.';
    END IF;
    -- Compare passcode (stored directly in passcode column on emergency_requests)
    IF COALESCE(v_row.passcode, '') <> COALESCE(p_passcode, '') THEN
      RAISE EXCEPTION 'Invalid passcode.';
    END IF;
  END IF;

  UPDATE public.emergency_requests
  SET status = p_status
  WHERE id = p_id
  RETURNING * INTO v_row;

  RETURN row_to_json(v_row);
END;
$$;

-- RPC: Update hospital stock securely (requires admin credentials for authorization)
CREATE OR REPLACE FUNCTION public.update_hospital_stock(
  p_hospital_name text,
  p_area text,
  p_contact text,
  p_blood_group text,
  p_stock_status text,
  p_admin_username text,
  p_admin_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.hospital_inventory%ROWTYPE;
BEGIN
  -- Verify admin credentials
  IF NOT EXISTS (
    SELECT 1 FROM public.admins
    WHERE username = p_admin_username AND password = p_admin_password
  ) THEN
    RAISE EXCEPTION 'Unauthorized admin credentials.';
  END IF;

  INSERT INTO public.hospital_inventory (hospital_name, area, contact, blood_group, stock_status, updated_at)
  VALUES (p_hospital_name, p_area, p_contact, p_blood_group, p_stock_status, now())
  ON CONFLICT (hospital_name, blood_group) DO UPDATE SET
    stock_status = EXCLUDED.stock_status,
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN row_to_json(v_row);
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.update_emergency_status(uuid, text, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_hospital_stock(text, text, text, text, text, text, text) TO anon, authenticated, service_role;
