-- Landing page: public read of a thin profile slice for anon (unauthenticated) visitors.
-- Run in Supabase SQL Editor. Returns only id, handle, avatar_url, name — no email/phone/bio.
-- SECURITY DEFINER reads rows the anon role cannot SELECT directly under existing RLS.

CREATE OR REPLACE FUNCTION public.get_landing_profiles(limit_count integer DEFAULT 200)
RETURNS TABLE (
  id uuid,
  handle text,
  avatar_url text,
  name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.handle, p.avatar_url, p.name
  FROM public.profiles p
  WHERE p.handle IS NOT NULL
    AND btrim(p.handle) <> ''
  ORDER BY p.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(limit_count, 200), 1), 500);
$$;

REVOKE ALL ON FUNCTION public.get_landing_profiles(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_landing_profiles(integer) TO anon, authenticated;
