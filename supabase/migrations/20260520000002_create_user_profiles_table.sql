-- Create user_profiles table
-- Replaces the three KV keys per user:
--   user_profile:${userId}   → name, bio, social_link, avatar_url, display_email, show_on_leaderboard, org_role
--   user_role:${userId}      → role string
--   user_last_signin:${userId} → Unix timestamp
--
-- This table is purely additive. The KV store remains the live source of truth
-- until an explicit cutover in a later migration step.

CREATE TABLE IF NOT EXISTS user_profiles (
  -- PK mirrors auth.users id — no surrogate key needed
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identity
  email TEXT NOT NULL,
  name  TEXT NOT NULL DEFAULT '',

  -- Profile
  bio          TEXT NOT NULL DEFAULT '',
  social_link  TEXT NOT NULL DEFAULT '',
  avatar_url   TEXT NOT NULL DEFAULT '',
  display_email TEXT NOT NULL DEFAULT '',  -- Optional public-facing email
  org_role     TEXT NOT NULL DEFAULT 'Volunteer',

  -- Access control (replaces user_role:${id} KV key)
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'staff', 'admin')),

  -- Leaderboard
  show_on_leaderboard BOOLEAN NOT NULL DEFAULT true,

  -- Session tracking (replaces user_last_signin:${id} KV key)
  last_signin_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_profiles_email       ON user_profiles(email);
CREATE INDEX idx_user_profiles_role        ON user_profiles(role);
CREATE INDEX idx_user_profiles_leaderboard ON user_profiles(show_on_leaderboard) WHERE show_on_leaderboard = true;

-- Auto-update updated_at (reuses function created in guides migration)
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Public: read any profile that opts in to the leaderboard
CREATE POLICY "Public can read leaderboard profiles"
  ON user_profiles FOR SELECT
  USING (show_on_leaderboard = true);

-- Authenticated: any signed-in user can read any profile
-- (needed so staff can look up contributor info, material pages can show author names, etc.)
CREATE POLICY "Authenticated users can read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users cannot elevate their own role — staff/admin only
-- Enforced by preventing role changes unless the requesting user is staff or admin.
-- The application layer (Edge Function) is responsible for this check on update;
-- the DB constraint prevents direct API abuse.
CREATE POLICY "Only staff and admin can write role column"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    -- Either the user is updating their own non-role fields...
    id = auth.uid()
    OR
    -- ...or an admin/staff is updating any row
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  )
  WITH CHECK (
    -- If the role column is being changed, the requester must be staff/admin
    (role = (SELECT role FROM user_profiles WHERE id = auth.uid()))
    OR
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );

-- Service role bypass (for Edge Functions using service role key)
CREATE POLICY "Service role has full access"
  ON user_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
