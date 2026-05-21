-- Step 19: Consolidate user roles into user_profiles
-- Replaces kv.get/set("user_role:*") with a proper column on user_profiles.
-- Existing rows default to 'user'; the seed endpoint back-fills from KV.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- Fast lookup for verifyAdmin and admin user-list queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles (role);
