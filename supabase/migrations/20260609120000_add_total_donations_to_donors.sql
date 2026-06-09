-- Add optional self-reported lifetime donation count on donors
-- Safe to run multiple times (IF NOT EXISTS)

ALTER TABLE donors
ADD COLUMN IF NOT EXISTS total_donations integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN donors.total_donations IS
  'Approximate lifetime blood donation count (self-reported at registration or updated from donation history).';

-- Backfill: donors with a last donation date but zero count
UPDATE donors
SET total_donations = 1
WHERE last_donation_date IS NOT NULL
  AND total_donations = 0;

-- Optional: keep total_donations in sync with logged donation_history rows
-- (run manually if you want historical accuracy from the history table)
-- UPDATE donors d
-- SET total_donations = COALESCE(h.cnt, 0)
-- FROM (
--   SELECT donor_id, COUNT(*)::integer AS cnt
--   FROM donation_history
--   GROUP BY donor_id
-- ) h
-- WHERE d.id = h.donor_id;
