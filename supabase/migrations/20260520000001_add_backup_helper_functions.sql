-- Backup helper functions with SECURITY DEFINER so they run as the function
-- owner (postgres/superuser) and bypass RLS entirely. These are used only
-- by the admin-protected /backup/full-export edge function route.
--
-- Callable by any authenticated user, but the edge function enforces admin-only
-- access before invoking these RPCs.

CREATE OR REPLACE FUNCTION backup_get_all_guides()
RETURNS SETOF guides
SECURITY DEFINER
STABLE
SET search_path = public
LANGUAGE sql AS $$
  SELECT * FROM guides ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION backup_get_all_blog_posts()
RETURNS SETOF blog_posts
SECURITY DEFINER
STABLE
SET search_path = public
LANGUAGE sql AS $$
  SELECT * FROM blog_posts ORDER BY published_at DESC;
$$;

-- Grant to service_role so the raw PostgREST fetch (using service role key) can call them.
-- The actual admin gate is enforced in the Edge Function (verifyAdmin).
GRANT EXECUTE ON FUNCTION backup_get_all_guides() TO service_role;
GRANT EXECUTE ON FUNCTION backup_get_all_blog_posts() TO service_role;
