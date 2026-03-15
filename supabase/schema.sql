-- ============================================================
-- TAYA — Supabase schema
-- Run this in the Supabase SQL editor (supabase.com → your project → SQL editor)
-- ============================================================


-- ── profiles ────────────────────────────────────────────────
-- One row per user. id matches the Supabase Auth user id.
-- handle is unique so two people can't grab @same_username.
CREATE TABLE IF NOT EXISTS profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL DEFAULT '',
  handle               TEXT UNIQUE,
  avatar_url           TEXT,
  phone                TEXT,
  email                TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── workouts ────────────────────────────────────────────────
-- One row per workout log. user_id links back to profiles.
-- date is stored as text YYYY-MM-DD to match the existing Workout type.
CREATE TABLE IF NOT EXISTS workouts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date          TEXT NOT NULL,            -- 'YYYY-MM-DD'
  description   TEXT NOT NULL DEFAULT '',
  activity_type TEXT NOT NULL DEFAULT 'other',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workouts_user_id_idx ON workouts(user_id);
CREATE INDEX IF NOT EXISTS workouts_date_idx ON workouts(date);


-- ── follows ─────────────────────────────────────────────────
-- Composite primary key prevents duplicate follows.
-- When a user follows someone: INSERT. Unfollow: DELETE.
CREATE TABLE IF NOT EXISTS follows (
  follower_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS follows_follower_idx  ON follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON follows(following_id);


-- ============================================================
-- Row Level Security (RLS)
-- Every table is locked down by default. These policies define
-- what each authenticated user is allowed to read or write.
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows  ENABLE ROW LEVEL SECURITY;


-- ── profiles RLS ────────────────────────────────────────────
-- Anyone authenticated can read any profile (needed for friends list, feed).
CREATE POLICY "profiles: authenticated users can read all"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own profile.
CREATE POLICY "profiles: users can update own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- A profile row is auto-created in the trigger below (not via INSERT policy),
-- but this allows the onboarding step to upsert.
CREATE POLICY "profiles: users can insert own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);


-- ── workouts RLS ────────────────────────────────────────────
-- Users can read their own workouts, plus workouts from people they follow.
CREATE POLICY "workouts: read own or followed"
  ON workouts FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    user_id IN (
      SELECT following_id FROM follows WHERE follower_id = auth.uid()
    )
  );

-- Users can only write their own workouts.
CREATE POLICY "workouts: insert own"
  ON workouts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "workouts: update own"
  ON workouts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "workouts: delete own"
  ON workouts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- ── follows RLS ─────────────────────────────────────────────
-- Users can see who they follow and who follows them.
CREATE POLICY "follows: read own"
  ON follows FOR SELECT
  TO authenticated
  USING (follower_id = auth.uid() OR following_id = auth.uid());

CREATE POLICY "follows: insert own"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "follows: delete own"
  ON follows FOR DELETE
  TO authenticated
  USING (follower_id = auth.uid());


-- ============================================================
-- Auto-create a profile row when a new auth user signs up.
-- This fires immediately after Supabase Auth creates the user,
-- so there's always a profiles row ready for the onboarding step.
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================================
-- Account deletion — lets users delete their own auth account
-- from the client. Cascades to profiles → workouts, follows.
-- ============================================================

CREATE OR REPLACE FUNCTION delete_own_account()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- Avatar storage bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can overwrite own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars');
