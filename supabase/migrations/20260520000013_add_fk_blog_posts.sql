-- Step 11: Add FK constraint to blog_posts table
-- blog_posts has 0 rows currently — trivially safe.
-- ON DELETE SET NULL so posts survive even if the author's profile is removed.
--
-- Note: blog_posts_created_by_fkey previously existed pointing to auth.users(id) ON DELETE CASCADE.
-- We drop and re-add pointing to user_profiles(id) with SET NULL semantics.

ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_created_by_fkey;
ALTER TABLE blog_posts
  ADD CONSTRAINT blog_posts_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE SET NULL;
