-- ============================================================
-- One-time: create profiles rows for auth users that have none.
-- Run in Supabase SQL Editor (production) after verifying project.
-- Safe to re-run: ON CONFLICT DO NOTHING.
-- ============================================================

INSERT INTO public.profiles (id, email)
SELECT u.id, u.email
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;
