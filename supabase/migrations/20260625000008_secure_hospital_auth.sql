-- Migration: Secure Hospital Authentication (Column-Level Security)
-- Date: 2026-06-25

-- 1. Revoke public SELECT on the entire table to prevent password and credential leakage
REVOKE SELECT ON public.hospitals FROM anon, authenticated;

-- 2. Grant explicit Column-Level SELECT permissions on safe fields only
GRANT SELECT (
  id, name, username, area, contact, is_verified, created_at
) ON public.hospitals TO anon, authenticated, service_role;
