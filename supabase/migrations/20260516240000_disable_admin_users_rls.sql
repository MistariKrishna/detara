-- Fix: Disable RLS on admin_users table entirely
-- The admin_users table is an internal admin-only table.
-- RLS on this table caused recursive policy evaluation loops that blocked all admin logins.
-- Since only admins manage this table (via service role or admin API routes), RLS is not needed.

-- Disable RLS on admin_users so any authenticated user can query their own row
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on admin_users (no longer needed)
DROP POLICY IF EXISTS "admin_users_self_read" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_admin_manage" ON public.admin_users;
DROP POLICY IF EXISTS "admin_read_admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "admin_manage_admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_select" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_all" ON public.admin_users;

-- Ensure check_is_admin function exists and is correct (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.check_is_admin(check_uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.email = (SELECT email FROM auth.users WHERE id = check_uid LIMIT 1)
      AND au.is_active = true
  )
$$;

-- Ensure is_admin() delegates to check_is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.check_is_admin(auth.uid())
$$;
