-- Migration: Fix Database Grants (Add missing status column SELECT grant)
-- Date: 2026-06-25

-- Grant select permission on the status column specifically
GRANT SELECT (status) ON public.emergency_requests TO anon, authenticated, service_role;
