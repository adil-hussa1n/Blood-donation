-- =============================================================================
-- HOSPITAL PROFILES & BULK STOCK SCHEMAS
-- =============================================================================

-- 1. Create hospitals table for authentication/profiles
CREATE TABLE IF NOT EXISTS public.hospitals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  area text NOT NULL,
  contact text NOT NULL UNIQUE,
  password text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

-- Allow public read on hospitals
DROP POLICY IF EXISTS "Allow public read on hospitals" ON public.hospitals;
CREATE POLICY "Allow public read on hospitals"
  ON public.hospitals FOR SELECT TO public USING (true);

-- Grant select on hospitals
GRANT SELECT ON public.hospitals TO anon, authenticated, service_role;

-- 2. Link hospital_inventory to hospitals
-- Clear any existing rows to prevent constraint conflicts
TRUNCATE TABLE public.hospital_inventory;

ALTER TABLE public.hospital_inventory 
  ADD COLUMN IF NOT EXISTS hospital_id uuid REFERENCES public.hospitals(id) ON DELETE CASCADE;

-- Drop old constraints and create new ones based on hospital_id instead of text name
ALTER TABLE public.hospital_inventory DROP CONSTRAINT IF EXISTS hospital_blood_unique;
ALTER TABLE public.hospital_inventory ADD CONSTRAINT hospital_blood_unique UNIQUE (hospital_id, blood_group);

-- We don't need hospital_name, area, contact text columns in hospital_inventory anymore, but keeping them as optional or dropping is fine.
-- Let's drop them to normalize the schema, or keep them to prevent code breaks on older features. Let's drop them.
ALTER TABLE public.hospital_inventory DROP COLUMN IF EXISTS hospital_name;
ALTER TABLE public.hospital_inventory DROP COLUMN IF EXISTS area;
ALTER TABLE public.hospital_inventory DROP COLUMN IF EXISTS contact;

-- =============================================================================
-- SECURE FUNCTIONS / RPCS
-- =============================================================================

-- RPC: Register a new hospital securely
CREATE OR REPLACE FUNCTION public.register_hospital(
  p_name text,
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
  IF trim(p_name) = '' OR trim(p_contact) = '' OR trim(p_password) = '' THEN
    RAISE EXCEPTION 'Fields cannot be empty.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.hospitals WHERE contact = p_contact) THEN
    RAISE EXCEPTION 'A hospital with this contact phone number is already registered.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.hospitals WHERE name = p_name) THEN
    RAISE EXCEPTION 'A hospital with this name is already registered.';
  END IF;

  INSERT INTO public.hospitals (name, area, contact, password, created_at)
  VALUES (p_name, p_area, p_contact, p_password, now())
  RETURNING * INTO v_hospital;

  RETURN row_to_json(v_hospital);
END;
$$;

-- RPC: Verify hospital credentials securely
CREATE OR REPLACE FUNCTION public.verify_hospital(
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
  SELECT * INTO v_hospital FROM public.hospitals
  WHERE contact = p_contact AND password = p_password;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid phone number or password.';
  END IF;

  RETURN row_to_json(v_hospital);
END;
$$;

-- RPC: Bulk update hospital stock statuses securely
CREATE OR REPLACE FUNCTION public.update_hospital_stock_bulk(
  p_hospital_id uuid,
  p_stocks jsonb,
  p_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stock_item jsonb;
  v_blood_group text;
  v_stock_status text;
  v_hospital_row public.hospitals%ROWTYPE;
BEGIN
  -- Verify hospital ownership
  SELECT * INTO v_hospital_row FROM public.hospitals
  WHERE id = p_hospital_id AND password = p_password;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Authentication failed.';
  END IF;

  -- Loop through stocks array and upsert stock status
  -- p_stocks format: [{"blood_group": "A+", "stock_status": "low"}, ...]
  FOR v_stock_item IN SELECT * FROM jsonb_array_elements(p_stocks)
  LOOP
    v_blood_group := v_stock_item->>'blood_group';
    v_stock_status := v_stock_item->>'stock_status';

    -- Validate stock status input
    IF v_stock_status NOT IN ('low', 'critical', 'stable') THEN
      RAISE EXCEPTION 'Invalid stock status: %', v_stock_status;
    END IF;

    INSERT INTO public.hospital_inventory (hospital_id, blood_group, stock_status, updated_at)
    VALUES (p_hospital_id, v_blood_group, v_stock_status, now())
    ON CONFLICT (hospital_id, blood_group) DO UPDATE SET
      stock_status = EXCLUDED.stock_status,
      updated_at = now();
  END LOOP;

  RETURN json_build_object('success', true);
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.register_hospital(text, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_hospital(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_hospital_stock_bulk(uuid, jsonb, text) TO anon, authenticated, service_role;
