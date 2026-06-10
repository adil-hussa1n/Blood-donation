-- =============================================================================
-- Fix: Backfill lifetime_donation_count from total_donations for existing donors
-- Ensures both columns are in sync after previous migration gaps.
-- Date: 2026-06-10
-- =============================================================================

-- Ensure lifetime_donation_count column exists
ALTER TABLE public.donors
  ADD COLUMN IF NOT EXISTS lifetime_donation_count integer NOT NULL DEFAULT 0;

-- Backfill: set lifetime_donation_count = total_donations where it is still 0 but total_donations > 0
UPDATE public.donors
SET lifetime_donation_count = total_donations
WHERE lifetime_donation_count = 0 AND total_donations > 0;

-- Also sync in reverse: set total_donations = lifetime_donation_count where total_donations is lower
UPDATE public.donors
SET total_donations = lifetime_donation_count
WHERE total_donations < lifetime_donation_count;

-- Drop any remaining triggers that could reset total_donations to 1 (defensive cleanup)
DROP TRIGGER IF EXISTS sync_donor_total_on_history ON public.donation_history;
DROP TRIGGER IF EXISTS trg_sync_total_donations ON public.donation_history;
DROP TRIGGER IF EXISTS update_donor_total_on_history ON public.donation_history;
DROP TRIGGER IF EXISTS sync_total_donations_trigger ON public.donation_history;
DROP TRIGGER IF EXISTS on_donation_history_insert ON public.donation_history;

DROP FUNCTION IF EXISTS public.sync_donor_total_from_history() CASCADE;
DROP FUNCTION IF EXISTS public.update_donor_total_donations() CASCADE;
DROP FUNCTION IF EXISTS public.sync_total_donations() CASCADE;
