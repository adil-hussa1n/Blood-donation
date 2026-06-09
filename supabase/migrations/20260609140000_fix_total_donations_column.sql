-- Fix total_donations being stuck at 1 (generated column or history sync trigger)
-- Run this entire file in Supabase SQL Editor.

-- 1) If total_donations was created as a GENERATED column, convert it to a normal integer
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'donors'
      AND column_name = 'total_donations'
      AND is_generated = 'ALWAYS'
  ) THEN
    ALTER TABLE public.donors
      ALTER COLUMN total_donations DROP EXPRESSION;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not drop generated expression on total_donations: %', SQLERRM;
END $$;

-- 2) Ensure column exists as a plain integer
ALTER TABLE public.donors
  ADD COLUMN IF NOT EXISTS total_donations integer NOT NULL DEFAULT 0;

-- 3) Drop common triggers that overwrite total_donations from donation_history row count
DROP TRIGGER IF EXISTS sync_donor_total_on_history ON public.donation_history;
DROP TRIGGER IF EXISTS trg_sync_total_donations ON public.donation_history;
DROP TRIGGER IF EXISTS update_donor_total_on_history ON public.donation_history;
DROP TRIGGER IF EXISTS sync_total_donations_trigger ON public.donation_history;

DROP FUNCTION IF EXISTS public.sync_donor_total_from_history();
DROP FUNCTION IF EXISTS public.update_donor_total_donations();
DROP FUNCTION IF EXISTS public.sync_total_donations();

-- 4) RPC: force-save self-reported donation count (used by edge functions)
CREATE OR REPLACE FUNCTION public.set_donor_total_donations(p_donor_id uuid, p_total integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.donors
  SET total_donations = GREATEST(0, LEAST(COALESCE(p_total, 0), 999))
  WHERE id = p_donor_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_donor_total_donations(uuid, integer) TO service_role;
