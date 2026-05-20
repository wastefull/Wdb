-- Allow the service_role (used by Edge Functions with the service key) to
-- read all rows in guides and blog_posts regardless of RLS policies.
-- This is necessary because the supabase-js client inside Edge Functions
-- can have the incoming request's user JWT bleed through into the auth
-- context even when the service role key is passed, causing RLS to silently
-- filter rows. An explicit service_role policy guarantees bypass for admin
-- operations such as full-site backups.

CREATE POLICY "Service role can read all guides"
  ON guides FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can read all blog posts"
  ON blog_posts FOR SELECT
  TO service_role
  USING (true);
