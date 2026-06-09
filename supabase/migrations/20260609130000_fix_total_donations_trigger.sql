-- Fix donors whose total_donations was overwritten to 1 by a history-count trigger.
-- Run in Supabase SQL Editor, then redeploy secure-insert-donor edge function.

-- Optional: list triggers on donation_history that may reset donor totals
-- SELECT tgname, pg_get_triggerdef(oid)
-- FROM pg_trigger
-- WHERE tgrelid = 'public.donation_history'::regclass AND NOT tgisinternal;

-- Manual fix for a specific donor (replace phone number):
-- UPDATE donors SET total_donations = 4 WHERE phone = '01712345678';

-- If you have a trigger that sets total_donations = history count, drop it:
-- DROP TRIGGER IF EXISTS sync_donor_total_on_history ON donation_history;
-- DROP FUNCTION IF EXISTS sync_donor_total_from_history();
