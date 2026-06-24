-- =============================================================================
-- SUPPORT REQUESTS & PROBLEM REPORTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.support_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL, -- 'support' or 'problem'
  name text NOT NULL,
  phone text NOT NULL,
  issue_type text, -- e.g., 'blocked_account', 'bug_report', 'fake_donor', 'other'
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Phone number format validation constraint
ALTER TABLE public.support_requests 
  DROP CONSTRAINT IF EXISTS support_requests_phone_check;

ALTER TABLE public.support_requests 
  ADD CONSTRAINT support_requests_phone_check 
  CHECK (phone ~ '^01[3-9]\d{8}$');

-- Enable Row Level Security (RLS)
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public inserts
DROP POLICY IF EXISTS "Allow public insert for support requests" ON public.support_requests;
CREATE POLICY "Allow public insert for support requests" 
  ON public.support_requests 
  FOR INSERT 
  WITH CHECK (true);

-- Revoke all direct permissions from public/anonymous roles to prevent any reads
REVOKE SELECT, UPDATE, DELETE ON public.support_requests FROM anon, authenticated;

-- Grant INSERT only to public roles so they can submit forms securely
GRANT INSERT ON public.support_requests TO anon, authenticated, service_role;
