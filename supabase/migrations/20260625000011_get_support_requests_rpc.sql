-- Migration: Add secure function to get support requests for administrators
-- Date: 2026-06-25

CREATE OR REPLACE FUNCTION public.get_support_requests(
  p_admin_username text,
  p_admin_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  -- Verify admin credentials
  IF NOT EXISTS (
    SELECT 1 FROM public.admins
    WHERE username = p_admin_username AND password = p_admin_password
  ) THEN
    RAISE EXCEPTION 'Unauthorized. Invalid admin credentials.';
  END IF;

  SELECT json_agg(row_to_json(s))
  INTO v_result
  FROM (
    SELECT id, type, name, phone, issue_type, message, created_at
    FROM public.support_requests
    ORDER BY created_at DESC
  ) s;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;

-- Grant execute permissions on the RPC
GRANT EXECUTE ON FUNCTION public.get_support_requests(text, text) TO anon, authenticated, service_role;
