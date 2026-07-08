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
  WHERE p.handle IN (
    -- The 14 demo accounts + Alex. Keep in sync with the iOS demo roster
    -- (TAYA/Feed Seeding/demo-personas-and-moves.md). Real users must never
    -- appear on the public landing page; the allowlist lives here, at the
    -- data layer, so the anon endpoint can't leak them regardless of what
    -- the frontend asks for. (Before 2026-07-08 this returned every profile.)
    'jakouuuuu', 'kofi', 'ingrid', 'meilin', 'aisha', 'santi', 'yuki',
    'luca', 'jinsoo', 'fatima', 'mateo', 'mayaaaa', 'sloane.b',
    'theoreyes', 'oubari'
  )
  ORDER BY p.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(limit_count, 200), 1), 500);
$$;

REVOKE ALL ON FUNCTION public.get_landing_profiles(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_landing_profiles(integer) TO anon, authenticated;
