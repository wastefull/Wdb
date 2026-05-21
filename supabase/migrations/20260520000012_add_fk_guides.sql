-- Step 10: Add FK constraints to guides table
-- All FKs are nullable (ON DELETE SET NULL) to avoid data loss if referenced rows are later removed.
--
-- Integrity verified before applying:
--   created_by : 7/7 existing rows resolve to user_profiles (all safe)
--   reviewed_by: 0/7 existing rows are non-null (trivially safe)
--   material_id : 5/7 non-null rows resolve to materials.legacy_kv_id; 2 are NULL (safe)
--
-- Note: guides_created_by_fkey and guides_reviewed_by_fkey previously existed pointing to
-- auth.users(id). We drop them and re-add pointing to user_profiles(id) with SET NULL semantics.

-- 1. guides.created_by → user_profiles(id)
ALTER TABLE guides DROP CONSTRAINT IF EXISTS guides_created_by_fkey;
ALTER TABLE guides
  ADD CONSTRAINT guides_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- 2. guides.reviewed_by → user_profiles(id)
ALTER TABLE guides DROP CONSTRAINT IF EXISTS guides_reviewed_by_fkey;
ALTER TABLE guides
  ADD CONSTRAINT guides_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- 3. guides.material_id → materials(legacy_kv_id)
--    material_id is TEXT; legacy_kv_id is TEXT UNIQUE — valid FK target.
ALTER TABLE guides DROP CONSTRAINT IF EXISTS guides_material_id_fkey;
ALTER TABLE guides
  ADD CONSTRAINT guides_material_id_fkey
  FOREIGN KEY (material_id) REFERENCES materials(legacy_kv_id) ON DELETE SET NULL;
