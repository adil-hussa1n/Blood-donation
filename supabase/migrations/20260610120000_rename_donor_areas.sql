-- =============================================================================
-- Migration: Rename donor areas to sync with updated application area choices
-- Beanibazar Sadar -> Beanibazar Upazila
-- Charikhada -> Charkhai
-- Date: 2026-06-10
-- =============================================================================

-- Update donors table
UPDATE public.donors
SET area = 'Beanibazar Upazila'
WHERE area = 'Beanibazar Sadar';

UPDATE public.donors
SET area = 'Charkhai'
WHERE area = 'Charikhada';

-- Update emergency_requests table
UPDATE public.emergency_requests
SET area = 'Beanibazar Upazila (General Hospital)'
WHERE area = 'Beanibazar Sadar (General Hospital)';

UPDATE public.emergency_requests
SET area = 'Beanibazar Upazila'
WHERE area = 'Beanibazar Sadar';

UPDATE public.emergency_requests
SET area = 'Charkhai'
WHERE area = 'Charikhada';
