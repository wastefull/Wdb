BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL ROLE postgres;
SET LOCAL search_path = public, extensions;

SELECT plan(64);

-- Legacy replay prerequisite plus graph and migration-support tables.
SELECT has_table('public'::name, 'kv_store_17cae920'::name);
SELECT has_table('public'::name, 'entity_types'::name);
SELECT has_table('public'::name, 'relationship_types'::name);
SELECT has_table('public'::name, 'tag_types'::name);
SELECT has_table('public'::name, 'content_roles'::name);
SELECT has_table('public'::name, 'lifecycle_focuses'::name);
SELECT has_table('public'::name, 'evidence_uses'::name);
SELECT has_table('public'::name, 'videos'::name);
SELECT has_table('public'::name, 'entities'::name);
SELECT has_table('public'::name, 'entity_canonical_bindings'::name);
SELECT has_table('public'::name, 'entity_relationships'::name);
SELECT has_table('public'::name, 'tags'::name);
SELECT has_table('public'::name, 'entity_tags'::name);
SELECT has_table('public'::name, 'content_entities'::name);
SELECT has_table('public'::name, 'graph_migration_runs'::name);
SELECT has_table('public'::name, 'graph_migration_checkpoints'::name);
SELECT has_table('public'::name, 'graph_migration_issues'::name);
SELECT has_table('public'::name, 'graph_sync_outbox'::name);

-- Additive evidence linkage.
SELECT has_column(
  'public'::name,
  'evidence_points'::name,
  'source_id'::name,
  'evidence_points.source_id should exist'
);
SELECT has_column(
  'public'::name,
  'evidence_points'::name,
  'entity_id'::name,
  'evidence_points.entity_id should exist'
);
SELECT has_column(
  'public'::name,
  'evidence_points'::name,
  'score_category'::name,
  'evidence_points.score_category should exist'
);

-- Identity and binding keys.
SELECT col_is_pk(
  'public'::name,
  'entities'::name,
  'id'::name,
  'entities.id should be the primary key'
);
SELECT col_is_pk(
  'public'::name,
  'entity_canonical_bindings'::name,
  'entity_id'::name,
  'entity_canonical_bindings.entity_id should be the primary key'
);

-- Critical read and worker indexes.
SELECT has_index(
  'public'::name,
  'entities'::name,
  'entities_type_idx'::name
);
SELECT has_index(
  'public'::name,
  'entity_relationships'::name,
  'entity_relationships_source_idx'::name
);
SELECT has_index(
  'public'::name,
  'content_entities'::name,
  'content_entities_subject_idx'::name
);
SELECT has_index(
  'public'::name,
  'graph_sync_outbox'::name,
  'graph_sync_outbox_ready_idx'::name
);

-- Exact policy sets for every graph-era table.
SELECT policies_are(
  'public'::name,
  'entity_types'::name,
  ARRAY[
    'graph_vocab_public_read',
    'graph_vocab_staff_manage',
    'graph_vocab_service_role_all'
  ]
);

SELECT policies_are(
  'public'::name,
  'relationship_types'::name,
  ARRAY[
    'graph_vocab_public_read',
    'graph_vocab_staff_manage',
    'graph_vocab_service_role_all'
  ]
);

SELECT policies_are(
  'public'::name,
  'tag_types'::name,
  ARRAY[
    'graph_vocab_public_read',
    'graph_vocab_staff_manage',
    'graph_vocab_service_role_all'
  ]
);

SELECT policies_are(
  'public'::name,
  'content_roles'::name,
  ARRAY[
    'graph_vocab_public_read',
    'graph_vocab_staff_manage',
    'graph_vocab_service_role_all'
  ]
);

SELECT policies_are(
  'public'::name,
  'lifecycle_focuses'::name,
  ARRAY[
    'graph_vocab_public_read',
    'graph_vocab_staff_manage',
    'graph_vocab_service_role_all'
  ]
);

SELECT policies_are(
  'public'::name,
  'evidence_uses'::name,
  ARRAY[
    'graph_vocab_public_read',
    'graph_vocab_staff_manage',
    'graph_vocab_service_role_all'
  ]
);

SELECT policies_are(
  'public'::name,
  'videos'::name,
  ARRAY[
    'videos_public_read',
    'videos_owner_read',
    'videos_owner_insert',
    'videos_owner_update',
    'videos_staff_manage',
    'videos_service_role_all'
  ]
);

SELECT policies_are(
  'public'::name,
  'entities'::name,
  ARRAY[
    'entities_public_read',
    'entities_owner_read',
    'entities_owner_insert',
    'entities_owner_update',
    'entities_staff_manage',
    'entities_service_role_all'
  ]
);

SELECT policies_are(
  'public'::name,
  'entity_canonical_bindings'::name,
  ARRAY[
    'entity_bindings_public_read',
    'entity_bindings_staff_manage',
    'entity_bindings_service_role_all'
  ]
);

SELECT policies_are(
  'public'::name,
  'entity_relationships'::name,
  ARRAY[
    'entity_relationships_public_read',
    'entity_relationships_owner_read',
    'entity_relationships_owner_insert',
    'entity_relationships_owner_update',
    'entity_relationships_staff_manage',
    'entity_relationships_service_role_all'
  ]
);

SELECT policies_are(
  'public'::name,
  'tags'::name,
  ARRAY[
    'tags_public_read',
    'tags_staff_manage',
    'tags_service_role_all'
  ]
);

SELECT policies_are(
  'public'::name,
  'entity_tags'::name,
  ARRAY[
    'entity_tags_public_read',
    'entity_tags_owner_read',
    'entity_tags_owner_insert',
    'entity_tags_owner_update',
    'entity_tags_staff_manage',
    'entity_tags_service_role_all'
  ]
);

SELECT policies_are(
  'public'::name,
  'content_entities'::name,
  ARRAY[
    'content_entities_public_read',
    'content_entities_owner_read',
    'content_entities_owner_insert',
    'content_entities_owner_update',
    'content_entities_staff_manage',
    'content_entities_service_role_all'
  ]
);

SELECT policies_are(
  'public'::name,
  'graph_migration_runs'::name,
  ARRAY[
    'graph_operations_staff_manage',
    'graph_operations_service_role_all'
  ]
);

SELECT policies_are(
  'public'::name,
  'graph_migration_checkpoints'::name,
  ARRAY[
    'graph_operations_staff_manage',
    'graph_operations_service_role_all'
  ]
);

SELECT policies_are(
  'public'::name,
  'graph_migration_issues'::name,
  ARRAY[
    'graph_operations_staff_manage',
    'graph_operations_service_role_all'
  ]
);

SELECT policies_are(
  'public'::name,
  'graph_sync_outbox'::name,
  ARRAY[
    'graph_operations_staff_manage',
    'graph_operations_service_role_all'
  ]
);

-- RLS and role-capability matrix.
SELECT results_eq(
  $$ SELECT count(*)::bigint
     FROM pg_class
     WHERE relnamespace = 'public'::regnamespace
       AND relname IN (
         'entity_types',
         'relationship_types',
         'tag_types',
         'content_roles',
         'lifecycle_focuses',
         'evidence_uses',
         'videos',
         'entities',
         'entity_canonical_bindings',
         'entity_relationships',
         'tags',
         'entity_tags',
         'content_entities',
         'graph_migration_runs',
         'graph_migration_checkpoints',
         'graph_migration_issues',
         'graph_sync_outbox'
       )
       AND relrowsecurity $$,
  $$ VALUES (17::bigint) $$
);

SELECT results_eq(
  $$
    WITH graph_tables(table_name) AS (
      VALUES
        ('content_entities'),
        ('content_roles'),
        ('entities'),
        ('entity_canonical_bindings'),
        ('entity_relationships'),
        ('entity_tags'),
        ('entity_types'),
        ('evidence_uses'),
        ('graph_migration_checkpoints'),
        ('graph_migration_issues'),
        ('graph_migration_runs'),
        ('graph_sync_outbox'),
        ('lifecycle_focuses'),
        ('relationship_types'),
        ('tag_types'),
        ('tags'),
        ('videos')
    )
    SELECT
      graph_tables.table_name,
      EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND pg_policies.tablename = graph_tables.table_name
          AND cmd = 'SELECT'
          AND 'anon' = ANY(roles)
      ) AS anonymous_read,
      EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND pg_policies.tablename = graph_tables.table_name
          AND 'authenticated' = ANY(roles)
          AND cmd = 'INSERT'
          AND policyname IN (
            'videos_owner_insert',
            'entities_owner_insert',
            'entity_relationships_owner_insert',
            'entity_tags_owner_insert',
            'content_entities_owner_insert'
          )
      ) AS contributor_propose,
      EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND pg_policies.tablename = graph_tables.table_name
          AND policyname IN (
            'graph_vocab_staff_manage',
            'videos_staff_manage',
            'entities_staff_manage',
            'entity_bindings_staff_manage',
            'entity_relationships_staff_manage',
            'tags_staff_manage',
            'entity_tags_staff_manage',
            'content_entities_staff_manage',
            'graph_operations_staff_manage'
          )
      ) AS staff_or_admin_manage,
      EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND pg_policies.tablename = graph_tables.table_name
          AND 'service_role' = ANY(roles)
          AND cmd = 'ALL'
      ) AS service_manage
    FROM graph_tables
    ORDER BY graph_tables.table_name
  $$,
  $$
    VALUES
      ('content_entities', true, true, true, true),
      ('content_roles', true, false, true, true),
      ('entities', true, true, true, true),
      ('entity_canonical_bindings', true, false, true, true),
      ('entity_relationships', true, true, true, true),
      ('entity_tags', true, true, true, true),
      ('entity_types', true, false, true, true),
      ('evidence_uses', true, false, true, true),
      ('graph_migration_checkpoints', false, false, true, true),
      ('graph_migration_issues', false, false, true, true),
      ('graph_migration_runs', false, false, true, true),
      ('graph_sync_outbox', false, false, true, true),
      ('lifecycle_focuses', true, false, true, true),
      ('relationship_types', true, false, true, true),
      ('tag_types', true, false, true, true),
      ('tags', true, false, true, true),
      ('videos', true, true, true, true)
  $$
);

-- Governed vocabulary seeds.
SELECT results_eq(
  $$ SELECT count(*)::bigint
     FROM public.entity_types
     WHERE slug IN ('material', 'video', 'process', 'policy')
       AND description <> ''
       AND active
       AND approved_at IS NOT NULL $$,
  $$ VALUES (4::bigint) $$
);

SELECT results_eq(
  $$ SELECT count(*)::bigint
     FROM public.relationship_types
     WHERE slug IN ('related_to', 'discusses', 'recycled_by', 'explains')
       AND description <> ''
       AND active
       AND approved_at IS NOT NULL $$,
  $$ VALUES (4::bigint) $$
);

SELECT results_eq(
  $$ SELECT count(*)::bigint
     FROM public.tag_types
     WHERE slug IN ('difficulty', 'topic', 'evidence')
       AND description <> ''
       AND active
       AND approved_at IS NOT NULL $$,
  $$ VALUES (3::bigint) $$
);

SELECT results_eq(
  $$ SELECT count(*)::bigint
     FROM public.content_roles
     WHERE slug IN ('primary_subject', 'mentioned', 'evidence')
       AND description <> ''
       AND active
       AND approved_at IS NOT NULL $$,
  $$ VALUES (3::bigint) $$
);

SELECT results_eq(
  $$ SELECT count(*)::bigint
     FROM public.lifecycle_focuses
     WHERE slug IN ('production', 'recycling', 'remediation')
       AND description <> ''
       AND active
       AND approved_at IS NOT NULL $$,
  $$ VALUES (3::bigint) $$
);

SELECT results_eq(
  $$ SELECT count(*)::bigint
     FROM public.evidence_uses
     WHERE slug IN (
       'recyclability',
       'environmental_impact',
       'policy_context'
     )
       AND description <> ''
       AND active
       AND approved_at IS NOT NULL $$,
  $$ VALUES (3::bigint) $$
);

-- Behavioral role checks. Authenticated users currently act as contributors;
-- staff represents editor/curator privileges.
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000061', 'stage6-contributor@example.test'),
  ('00000000-0000-0000-0000-000000000062', 'stage6-staff@example.test'),
  ('00000000-0000-0000-0000-000000000063', 'stage6-admin@example.test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_profiles (id, email, name, role) VALUES
  (
    '00000000-0000-0000-0000-000000000061',
    'stage6-contributor@example.test',
    'Stage 6 Contributor',
    'user'
  ),
  (
    '00000000-0000-0000-0000-000000000062',
    'stage6-staff@example.test',
    'Stage 6 Curator',
    'staff'
  ),
  (
    '00000000-0000-0000-0000-000000000063',
    'stage6-admin@example.test',
    'Stage 6 Admin',
    'admin'
  )
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

SET LOCAL ROLE anon;
SELECT throws_ok(
  $$ INSERT INTO public.entities (entity_type, name, status)
     VALUES ('process', 'Anonymous authority probe', 'active') $$,
  42501,
  NULL,
  'Anonymous users cannot create authoritative entities'
);
RESET ROLE;

SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000061',
  true
);
SET LOCAL ROLE authenticated;
SELECT is(
  (SELECT private.is_staff_or_admin()),
  false,
  'Authenticated contributor is not a curator or admin'
);
SELECT lives_ok(
  $$ INSERT INTO public.entities (
       entity_type,
       name,
       status,
       created_by
     ) VALUES (
       'process',
       'Contributor proposal',
       'pending_review',
       '00000000-0000-0000-0000-000000000061'
     ) $$,
  'Contributors can create non-public proposals'
);
SELECT throws_ok(
  $$ INSERT INTO public.entities (
       entity_type,
       name,
       status,
       created_by
     ) VALUES (
       'process',
       'Contributor authority probe',
       'active',
       '00000000-0000-0000-0000-000000000061'
     ) $$,
  42501,
  NULL,
  'Contributors cannot publish authoritative entities'
);
SELECT throws_ok(
  $$ INSERT INTO public.tags (slug, label, description)
     VALUES (
       'contributor-governance-probe',
       'Contributor governance probe',
       'Contributor writes to governed tags must be denied.'
     ) $$,
  42501,
  NULL,
  'Contributors cannot alter governed tags'
);
RESET ROLE;

SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000062',
  true
);
SET LOCAL ROLE authenticated;
SELECT is(
  (SELECT private.is_staff_or_admin()),
  true,
  'Staff profile receives editor and curator privileges'
);
SELECT lives_ok(
  $$ INSERT INTO public.entities (
       entity_type,
       name,
       status,
       created_by,
       reviewed_by,
       reviewed_at
     ) VALUES (
       'process',
       'Curator-approved entity',
       'active',
       '00000000-0000-0000-0000-000000000061',
       '00000000-0000-0000-0000-000000000062',
       now()
     ) $$,
  'Editor or curator can publish reviewed graph knowledge'
);
RESET ROLE;

SELECT set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000063',
  true
);
SET LOCAL ROLE authenticated;
SELECT is(
  (SELECT private.is_staff_or_admin()),
  true,
  'Admin profile receives governed graph privileges'
);
SELECT lives_ok(
  $$ INSERT INTO public.tag_types (slug, label, description)
     VALUES (
       'admin-governance-probe',
       'Admin governance probe',
       'Inactive proposal created by an admin during authorization testing.'
     ) $$,
  'Admins can manage governed vocabularies'
);
SELECT results_eq(
  $$ SELECT active
     FROM public.tag_types
     WHERE slug = 'admin-governance-probe' $$,
  $$ VALUES (false) $$,
  'New vocabulary proposals remain inactive by default'
);
SELECT throws_ok(
  $$ UPDATE public.tag_types
     SET active = true
     WHERE slug = 'admin-governance-probe' $$,
  23514,
  NULL,
  'Vocabulary proposals cannot activate without approval metadata'
);
RESET ROLE;

SET LOCAL ROLE service_role;
SELECT lives_ok(
  $$ INSERT INTO public.entities (entity_type, name, status)
     VALUES ('process', 'Service role entity', 'active') $$,
  'Service-role workers can perform reviewed server operations'
);
RESET ROLE;

SET LOCAL ROLE postgres;
SELECT * FROM finish();

ROLLBACK;
