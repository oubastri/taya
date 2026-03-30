-- ============================================================
-- TAYA — Paginated home feed + total counts (Friends + World)
-- Run in Supabase SQL Editor after schema.sql
-- ============================================================

CREATE INDEX IF NOT EXISTS workouts_feed_order_idx
  ON public.workouts (date DESC, created_at DESC, id DESC);


CREATE OR REPLACE FUNCTION public.fetch_feed_total(p_feed_mode text)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint
  FROM public.workouts w
  WHERE auth.uid() IS NOT NULL
    AND (
      p_feed_mode = 'stadium'
      OR w.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.follows f
        WHERE f.follower_id = auth.uid()
          AND f.following_id = w.user_id
      )
    );
$$;


CREATE OR REPLACE FUNCTION public.fetch_feed_page(
  p_feed_mode text,
  p_after_date text DEFAULT NULL,
  p_after_created_at timestamptz DEFAULT NULL,
  p_after_id uuid DEFAULT NULL,
  p_fetch_limit integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  date text,
  description text,
  activity_type text,
  created_at timestamptz,
  author_name text,
  author_handle text,
  author_avatar_url text,
  like_count bigint,
  liked_by_me boolean
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    w.id,
    w.user_id,
    w.date,
    w.description,
    w.activity_type,
    w.created_at,
    COALESCE(p.name, '') AS author_name,
    COALESCE(p.handle, '') AS author_handle,
    p.avatar_url AS author_avatar_url,
    COALESCE(lc.cnt, 0)::bigint AS like_count,
    (my_like.user_id IS NOT NULL) AS liked_by_me
  FROM public.workouts w
  INNER JOIN public.profiles p ON p.id = w.user_id
  LEFT JOIN (
    SELECT l.workout_id, COUNT(*)::bigint AS cnt
    FROM public.likes l
    GROUP BY l.workout_id
  ) lc ON lc.workout_id = w.id
  LEFT JOIN public.likes my_like
    ON my_like.workout_id = w.id
   AND my_like.user_id = auth.uid()
  WHERE auth.uid() IS NOT NULL
    AND (
      p_feed_mode = 'stadium'
      OR w.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.follows f
        WHERE f.follower_id = auth.uid()
          AND f.following_id = w.user_id
      )
    )
    AND (
      p_after_id IS NULL
      OR (w.date, w.created_at, w.id) < (p_after_date, p_after_created_at, p_after_id)
    )
  ORDER BY w.date DESC, w.created_at DESC, w.id DESC
  LIMIT p_fetch_limit;
$$;


GRANT EXECUTE ON FUNCTION public.fetch_feed_total(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_feed_page(text, text, timestamptz, uuid, integer) TO authenticated;
