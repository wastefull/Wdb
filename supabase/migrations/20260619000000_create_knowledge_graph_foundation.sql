-- Stage 6: additive knowledge graph foundation.
--
-- Safety contract:
-- - Domain tables remain authoritative.
-- - No legacy column or table is dropped.
-- - No graph backfill or read cutover occurs in this migration.
-- - Unresolved migration payloads have dedicated durable storage.

BEGIN;

-- ---------------------------------------------------------------------------
-- Private policy helpers
-- ---------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_staff_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('staff', 'admin')
  );
$$;

REVOKE ALL ON FUNCTION private.is_staff_or_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_staff_or_admin()
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Governed vocabularies
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.entity_types (
  slug TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT entity_types_active_approval CHECK (
    NOT active OR approved_at IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS public.relationship_types (
  slug TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT relationship_types_active_approval CHECK (
    NOT active OR approved_at IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS public.tag_types (
  slug TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tag_types_active_approval CHECK (
    NOT active OR approved_at IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS public.content_roles (
  slug TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT content_roles_active_approval CHECK (
    NOT active OR approved_at IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS public.lifecycle_focuses (
  slug TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT lifecycle_focuses_active_approval CHECK (
    NOT active OR approved_at IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS public.evidence_uses (
  slug TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT evidence_uses_active_approval CHECK (
    NOT active OR approved_at IS NOT NULL
  )
);

INSERT INTO public.entity_types (
  slug,
  label,
  description,
  active,
  approved_at
) VALUES
  ('material', 'Material', 'A material or material family.', true, now()),
  ('article', 'Article', 'A WasteDB educational article.', true, now()),
  ('guide', 'Guide', 'A practical or technical guide.', true, now()),
  ('blog_post', 'Blog post', 'A WasteDB editorial post.', true, now()),
  ('video', 'Video', 'A first-class educational video.', true, now()),
  ('source', 'Source', 'A citable evidence source.', true, now()),
  ('process', 'Process', 'A production, use, or recovery process.', true, now()),
  ('policy', 'Policy', 'A law, regulation, or policy instrument.', true, now()),
  ('product', 'Product', 'A product or product category.', true, now()),
  (
    'environmental_impact',
    'Environmental impact',
    'An environmental consequence or impact category.',
    true,
    now()
  ),
  ('organization', 'Organization', 'An organization or institution.', true, now()),
  ('technology', 'Technology', 'A relevant technology or system.', true, now()),
  (
    'remediation_strategy',
    'Remediation strategy',
    'A strategy for prevention, cleanup, or remediation.',
    true,
    now()
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.relationship_types (
  slug,
  label,
  description,
  active,
  approved_at
) VALUES
  (
    'discusses',
    'Discusses',
    'Meaningfully addresses a subject without implying evidentiary support.',
    true,
    now()
  ),
  ('related_to', 'Related to', 'A broad reviewed association.', true, now()),
  ('derived_from', 'Derived from', 'Originates from another entity.', true, now()),
  ('used_in', 'Used in', 'Is used in a product, process, or system.', true, now()),
  ('produced_by', 'Produced by', 'Is produced by a process or organization.', true, now()),
  ('feedstock_for', 'Feedstock for', 'Serves as input feedstock.', true, now()),
  ('contains', 'Contains', 'Contains another entity or material.', true, now()),
  ('affects', 'Affects', 'Has a reviewed effect on another entity.', true, now()),
  ('regulated_by', 'Regulated by', 'Is governed by a policy entity.', true, now()),
  ('recycled_by', 'Recycled by', 'Can be processed by a recycling method.', true, now()),
  ('composted_by', 'Composted by', 'Can be processed by a composting method.', true, now()),
  ('demonstrates', 'Demonstrates', 'Shows a process, method, or behavior.', true, now()),
  ('explains', 'Explains', 'Provides an explanation of a subject.', true, now()),
  ('compares_with', 'Compares with', 'Provides a reviewed comparison.', true, now())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tag_types (
  slug,
  label,
  description,
  active,
  approved_at
) VALUES
  ('difficulty', 'Difficulty', 'Educational difficulty classification.', true, now()),
  ('lifecycle', 'Lifecycle', 'Lifecycle-stage classification.', true, now()),
  ('topic', 'Topic', 'Subject-matter classification.', true, now()),
  ('status', 'Status', 'Reviewed content or entity state.', true, now()),
  ('audience', 'Audience', 'Intended audience classification.', true, now()),
  ('process', 'Process', 'Process-oriented classification.', true, now()),
  ('risk', 'Risk', 'Risk or hazard classification.', true, now()),
  ('policy', 'Policy', 'Policy-oriented classification.', true, now()),
  ('format', 'Format', 'Content format classification.', true, now()),
  ('evidence', 'Evidence', 'Evidence-oriented classification.', true, now())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.content_roles (
  slug,
  label,
  description,
  active,
  approved_at
) VALUES
  ('primary_subject', 'Primary subject', 'The main subject of content.', true, now()),
  ('secondary_subject', 'Secondary subject', 'A substantial secondary subject.', true, now()),
  ('mentioned', 'Mentioned', 'A meaningful but non-primary mention.', true, now()),
  ('comparison', 'Comparison', 'A subject used in a comparison.', true, now()),
  ('case_study', 'Case study', 'A subject examined as a case study.', true, now()),
  ('evidence', 'Evidence', 'A subject linked for evidence context.', true, now()),
  ('demonstrates', 'Demonstrates', 'A subject demonstrated by content.', true, now()),
  ('explains', 'Explains', 'A subject explained by content.', true, now())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.lifecycle_focuses (
  slug,
  label,
  description,
  active,
  approved_at
) VALUES
  ('production', 'Production', 'Raw-material and manufacturing stages.', true, now()),
  ('use', 'Use', 'Use-phase behavior and impacts.', true, now()),
  ('reuse', 'Reuse', 'Reuse, repair, and repeated-use stages.', true, now()),
  ('recycling', 'Recycling', 'Collection and recycling stages.', true, now()),
  ('composting', 'Composting', 'Composting and organic recovery stages.', true, now()),
  ('degradation', 'Degradation', 'Environmental or managed degradation.', true, now()),
  ('toxicity', 'Toxicity', 'Toxicity and residue concerns.', true, now()),
  ('policy', 'Policy', 'Policy and regulatory context.', true, now()),
  ('market', 'Market', 'Market and infrastructure context.', true, now()),
  ('remediation', 'Remediation', 'Prevention, cleanup, and remediation.', true, now())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.evidence_uses (
  slug,
  label,
  description,
  active,
  approved_at
) VALUES
  ('recyclability', 'Recyclability', 'Evidence used for recyclability assessment.', true, now()),
  ('compostability', 'Compostability', 'Evidence used for compostability assessment.', true, now()),
  ('reusability', 'Reusability', 'Evidence used for reusability assessment.', true, now()),
  (
    'environmental_impact',
    'Environmental impact',
    'Evidence used for impact context.',
    true,
    now()
  ),
  ('policy_context', 'Policy context', 'Evidence used for policy context.', true, now()),
  ('historical_context', 'Historical context', 'Evidence used for historical context.', true, now())
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Graph entities and first-class video content
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  youtube_url TEXT NOT NULL,
  youtube_id TEXT UNIQUE,
  description TEXT,
  duration_seconds INTEGER CHECK (
    duration_seconds IS NULL OR duration_seconds >= 0
  ),
  channel_name TEXT,
  thumbnail_url TEXT,
  transcript TEXT,
  summary TEXT,
  key_takeaways TEXT[],
  difficulty_level TEXT CHECK (
    difficulty_level IS NULL
    OR difficulty_level IN ('beginner', 'intermediate', 'advanced')
  ),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'pending_review', 'published', 'archived')
  ),
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL REFERENCES public.entity_types(slug)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'pending_review', 'active', 'archived')
  ),
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_type, slug)
);

CREATE TABLE IF NOT EXISTS public.entity_canonical_bindings (
  entity_id UUID PRIMARY KEY REFERENCES public.entities(id) ON DELETE CASCADE,
  material_id UUID UNIQUE REFERENCES public.materials(id) ON DELETE RESTRICT,
  article_id UUID UNIQUE REFERENCES public.articles(id) ON DELETE RESTRICT,
  guide_id UUID UNIQUE REFERENCES public.guides(id) ON DELETE RESTRICT,
  blog_post_id UUID UNIQUE REFERENCES public.blog_posts(id) ON DELETE RESTRICT,
  source_id UUID UNIQUE REFERENCES public.sources(id) ON DELETE RESTRICT,
  video_id UUID UNIQUE REFERENCES public.videos(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT entity_canonical_binding_exactly_one CHECK (
    num_nonnulls(
      material_id,
      article_id,
      guide_id,
      blog_post_id,
      source_id,
      video_id
    ) = 1
  )
);

CREATE TABLE IF NOT EXISTS public.entity_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id UUID NOT NULL REFERENCES public.entities(id)
    ON DELETE CASCADE,
  target_entity_id UUID NOT NULL REFERENCES public.entities(id)
    ON DELETE CASCADE,
  relationship_type TEXT NOT NULL REFERENCES public.relationship_types(slug)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC CHECK (
    confidence IS NULL OR confidence BETWEEN 0 AND 1
  ),
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (
    status IN ('pending_review', 'active', 'archived')
  ),
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT entity_relationship_no_self CHECK (
    source_entity_id <> target_entity_id
  ),
  CONSTRAINT entity_relationship_unique UNIQUE (
    source_entity_id,
    target_entity_id,
    relationship_type
  )
);

CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  tag_type TEXT REFERENCES public.tag_types(slug)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.entity_tags (
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  confidence NUMERIC CHECK (
    confidence IS NULL OR confidence BETWEEN 0 AND 1
  ),
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (
    status IN ('pending_review', 'active', 'archived')
  ),
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.content_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_entity_id UUID NOT NULL REFERENCES public.entities(id)
    ON DELETE CASCADE,
  subject_entity_id UUID NOT NULL REFERENCES public.entities(id)
    ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'mentioned'
    REFERENCES public.content_roles(slug)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  lifecycle_focus TEXT REFERENCES public.lifecycle_focuses(slug)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  evidence_use TEXT REFERENCES public.evidence_uses(slug)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (
    status IN ('pending_review', 'active', 'archived')
  ),
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT content_entity_no_self CHECK (
    content_entity_id <> subject_entity_id
  ),
  CONSTRAINT content_entity_unique_role UNIQUE (
    content_entity_id,
    subject_entity_id,
    role
  )
);

-- ---------------------------------------------------------------------------
-- Migration observability, quarantine, resume, and compatibility outbox
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.graph_migration_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_version TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('dry_run', 'apply', 'reconcile')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'running', 'completed', 'failed', 'blocked')
  ),
  started_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  report JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.graph_migration_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.graph_migration_runs(id)
    ON DELETE CASCADE,
  phase TEXT NOT NULL,
  cursor JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_count BIGINT NOT NULL DEFAULT 0 CHECK (processed_count >= 0),
  inserted_count BIGINT NOT NULL DEFAULT 0 CHECK (inserted_count >= 0),
  updated_count BIGINT NOT NULL DEFAULT 0 CHECK (updated_count >= 0),
  conflict_count BIGINT NOT NULL DEFAULT 0 CHECK (conflict_count >= 0),
  unresolved_count BIGINT NOT NULL DEFAULT 0 CHECK (unresolved_count >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'running', 'completed', 'failed')
  ),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, phase)
);

CREATE TABLE IF NOT EXISTS public.graph_migration_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.graph_migration_runs(id)
    ON DELETE CASCADE,
  source_table TEXT NOT NULL,
  source_identifier TEXT NOT NULL,
  issue_category TEXT NOT NULL,
  reason TEXT NOT NULL,
  original_payload JSONB NOT NULL,
  candidate_matches JSONB NOT NULL DEFAULT '[]'::jsonb,
  diagnostic_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolution_status TEXT NOT NULL DEFAULT 'unresolved' CHECK (
    resolution_status IN ('unresolved', 'reviewing', 'resolved', 'ignored')
  ),
  resolved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, source_table, source_identifier, issue_category)
);

CREATE TABLE IF NOT EXISTS public.graph_sync_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT NOT NULL UNIQUE,
  source_table TEXT NOT NULL,
  source_identifier TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (
    operation IN ('insert', 'update', 'delete', 'reconcile')
  ),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed')
  ),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  completed_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION private.preserve_graph_issue_original_payload()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.original_payload IS DISTINCT FROM OLD.original_payload THEN
    RAISE EXCEPTION 'graph_migration_issues.original_payload is immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS graph_migration_issue_payload_immutable
  ON public.graph_migration_issues;
CREATE TRIGGER graph_migration_issue_payload_immutable
  BEFORE UPDATE OF original_payload ON public.graph_migration_issues
  FOR EACH ROW
  EXECUTE FUNCTION private.preserve_graph_issue_original_payload();

-- ---------------------------------------------------------------------------
-- Evidence linkage additions
-- ---------------------------------------------------------------------------

ALTER TABLE public.evidence_points
  ADD COLUMN IF NOT EXISTS source_id UUID
    REFERENCES public.sources(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS entity_id UUID
    REFERENCES public.entities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS score_category TEXT;

ALTER TABLE public.evidence_points
  DROP CONSTRAINT IF EXISTS evidence_points_score_category_check;
ALTER TABLE public.evidence_points
  ADD CONSTRAINT evidence_points_score_category_check CHECK (
    score_category IS NULL
    OR score_category IN ('recyclability', 'compostability', 'reusability')
  );

-- ---------------------------------------------------------------------------
-- Timestamps and indexes
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'entity_types',
    'relationship_types',
    'tag_types',
    'content_roles',
    'lifecycle_focuses',
    'evidence_uses',
    'videos',
    'entities',
    'entity_relationships',
    'tags',
    'entity_tags',
    'content_entities',
    'graph_migration_runs',
    'graph_migration_checkpoints',
    'graph_migration_issues',
    'graph_sync_outbox'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON public.%I',
      table_name || '_updated_at',
      table_name
    );
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
      table_name || '_updated_at',
      table_name
    );
  END LOOP;
END
$$;

CREATE INDEX IF NOT EXISTS entities_type_idx
  ON public.entities(entity_type);
CREATE INDEX IF NOT EXISTS entities_status_idx
  ON public.entities(status);
CREATE INDEX IF NOT EXISTS entities_slug_idx
  ON public.entities(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS entities_created_by_idx
  ON public.entities(created_by);

CREATE INDEX IF NOT EXISTS entity_relationships_source_idx
  ON public.entity_relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS entity_relationships_target_idx
  ON public.entity_relationships(target_entity_id);
CREATE INDEX IF NOT EXISTS entity_relationships_type_idx
  ON public.entity_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS entity_relationships_status_idx
  ON public.entity_relationships(status);
CREATE INDEX IF NOT EXISTS entity_relationships_created_by_idx
  ON public.entity_relationships(created_by);

CREATE INDEX IF NOT EXISTS tags_type_idx ON public.tags(tag_type);
CREATE INDEX IF NOT EXISTS tags_active_idx
  ON public.tags(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS entity_tags_tag_idx ON public.entity_tags(tag_id);
CREATE INDEX IF NOT EXISTS entity_tags_status_idx
  ON public.entity_tags(status);
CREATE INDEX IF NOT EXISTS entity_tags_created_by_idx
  ON public.entity_tags(created_by);

CREATE INDEX IF NOT EXISTS content_entities_content_idx
  ON public.content_entities(content_entity_id);
CREATE INDEX IF NOT EXISTS content_entities_subject_idx
  ON public.content_entities(subject_entity_id);
CREATE INDEX IF NOT EXISTS content_entities_role_idx
  ON public.content_entities(role);
CREATE INDEX IF NOT EXISTS content_entities_status_idx
  ON public.content_entities(status);
CREATE INDEX IF NOT EXISTS content_entities_created_by_idx
  ON public.content_entities(created_by);

CREATE INDEX IF NOT EXISTS videos_status_idx ON public.videos(status);
CREATE INDEX IF NOT EXISTS videos_created_by_idx ON public.videos(created_by);

CREATE INDEX IF NOT EXISTS graph_migration_runs_version_idx
  ON public.graph_migration_runs(migration_version, created_at DESC);
CREATE INDEX IF NOT EXISTS graph_migration_runs_status_idx
  ON public.graph_migration_runs(status);
CREATE INDEX IF NOT EXISTS graph_migration_checkpoints_run_idx
  ON public.graph_migration_checkpoints(run_id);
CREATE INDEX IF NOT EXISTS graph_migration_issues_run_idx
  ON public.graph_migration_issues(run_id);
CREATE INDEX IF NOT EXISTS graph_migration_issues_resolution_idx
  ON public.graph_migration_issues(resolution_status);
CREATE INDEX IF NOT EXISTS graph_sync_outbox_ready_idx
  ON public.graph_sync_outbox(status, available_at)
  WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS evidence_points_source_id_idx
  ON public.evidence_points(source_id);
CREATE INDEX IF NOT EXISTS evidence_points_entity_id_idx
  ON public.evidence_points(entity_id);
CREATE INDEX IF NOT EXISTS evidence_points_score_category_idx
  ON public.evidence_points(score_category);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'entity_types',
    'relationship_types',
    'tag_types',
    'content_roles',
    'lifecycle_focuses',
    'evidence_uses'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'DROP POLICY IF EXISTS "graph_vocab_public_read" ON public.%I',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY "graph_vocab_public_read" ON public.%I
       FOR SELECT TO anon, authenticated USING (active = true)',
      table_name
    );
    EXECUTE format(
      'DROP POLICY IF EXISTS "graph_vocab_staff_manage" ON public.%I',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY "graph_vocab_staff_manage" ON public.%I
       FOR ALL TO authenticated
       USING ((SELECT private.is_staff_or_admin()))
       WITH CHECK ((SELECT private.is_staff_or_admin()))',
      table_name
    );
    EXECUTE format(
      'DROP POLICY IF EXISTS "graph_vocab_service_role_all" ON public.%I',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY "graph_vocab_service_role_all" ON public.%I
       FOR ALL TO service_role USING (true) WITH CHECK (true)',
      table_name
    );
  END LOOP;
END
$$;

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS videos_public_read ON public.videos;
CREATE POLICY videos_public_read ON public.videos
  FOR SELECT TO anon, authenticated
  USING (status = 'published');
DROP POLICY IF EXISTS videos_owner_read ON public.videos;
CREATE POLICY videos_owner_read ON public.videos
  FOR SELECT TO authenticated
  USING (created_by = (SELECT auth.uid()));
DROP POLICY IF EXISTS videos_owner_insert ON public.videos;
CREATE POLICY videos_owner_insert ON public.videos
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND status IN ('draft', 'pending_review')
  );
DROP POLICY IF EXISTS videos_owner_update ON public.videos;
CREATE POLICY videos_owner_update ON public.videos
  FOR UPDATE TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    AND status IN ('draft', 'pending_review')
  )
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND status IN ('draft', 'pending_review')
  );
DROP POLICY IF EXISTS videos_staff_manage ON public.videos;
CREATE POLICY videos_staff_manage ON public.videos
  FOR ALL TO authenticated
  USING ((SELECT private.is_staff_or_admin()))
  WITH CHECK ((SELECT private.is_staff_or_admin()));
DROP POLICY IF EXISTS videos_service_role_all ON public.videos;
CREATE POLICY videos_service_role_all ON public.videos
  FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS entities_public_read ON public.entities;
CREATE POLICY entities_public_read ON public.entities
  FOR SELECT TO anon, authenticated
  USING (status = 'active');
DROP POLICY IF EXISTS entities_owner_read ON public.entities;
CREATE POLICY entities_owner_read ON public.entities
  FOR SELECT TO authenticated
  USING (created_by = (SELECT auth.uid()));
DROP POLICY IF EXISTS entities_owner_insert ON public.entities;
CREATE POLICY entities_owner_insert ON public.entities
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND status IN ('draft', 'pending_review')
  );
DROP POLICY IF EXISTS entities_owner_update ON public.entities;
CREATE POLICY entities_owner_update ON public.entities
  FOR UPDATE TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    AND status IN ('draft', 'pending_review')
  )
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND status IN ('draft', 'pending_review')
  );
DROP POLICY IF EXISTS entities_staff_manage ON public.entities;
CREATE POLICY entities_staff_manage ON public.entities
  FOR ALL TO authenticated
  USING ((SELECT private.is_staff_or_admin()))
  WITH CHECK ((SELECT private.is_staff_or_admin()));
DROP POLICY IF EXISTS entities_service_role_all ON public.entities;
CREATE POLICY entities_service_role_all ON public.entities
  FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.entity_canonical_bindings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS entity_bindings_public_read
  ON public.entity_canonical_bindings;
CREATE POLICY entity_bindings_public_read
  ON public.entity_canonical_bindings
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.entities
      WHERE entities.id = entity_canonical_bindings.entity_id
        AND entities.status = 'active'
    )
  );
DROP POLICY IF EXISTS entity_bindings_staff_manage
  ON public.entity_canonical_bindings;
CREATE POLICY entity_bindings_staff_manage
  ON public.entity_canonical_bindings
  FOR ALL TO authenticated
  USING ((SELECT private.is_staff_or_admin()))
  WITH CHECK ((SELECT private.is_staff_or_admin()));
DROP POLICY IF EXISTS entity_bindings_service_role_all
  ON public.entity_canonical_bindings;
CREATE POLICY entity_bindings_service_role_all
  ON public.entity_canonical_bindings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.entity_relationships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS entity_relationships_public_read
  ON public.entity_relationships;
CREATE POLICY entity_relationships_public_read
  ON public.entity_relationships
  FOR SELECT TO anon, authenticated
  USING (status = 'active');
DROP POLICY IF EXISTS entity_relationships_owner_read
  ON public.entity_relationships;
CREATE POLICY entity_relationships_owner_read
  ON public.entity_relationships
  FOR SELECT TO authenticated
  USING (created_by = (SELECT auth.uid()));
DROP POLICY IF EXISTS entity_relationships_owner_insert
  ON public.entity_relationships;
CREATE POLICY entity_relationships_owner_insert
  ON public.entity_relationships
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND status = 'pending_review'
  );
DROP POLICY IF EXISTS entity_relationships_owner_update
  ON public.entity_relationships;
CREATE POLICY entity_relationships_owner_update
  ON public.entity_relationships
  FOR UPDATE TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    AND status = 'pending_review'
  )
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND status = 'pending_review'
  );
DROP POLICY IF EXISTS entity_relationships_staff_manage
  ON public.entity_relationships;
CREATE POLICY entity_relationships_staff_manage
  ON public.entity_relationships
  FOR ALL TO authenticated
  USING ((SELECT private.is_staff_or_admin()))
  WITH CHECK ((SELECT private.is_staff_or_admin()));
DROP POLICY IF EXISTS entity_relationships_service_role_all
  ON public.entity_relationships;
CREATE POLICY entity_relationships_service_role_all
  ON public.entity_relationships
  FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tags_public_read ON public.tags;
CREATE POLICY tags_public_read ON public.tags
  FOR SELECT TO anon, authenticated USING (active = true);
DROP POLICY IF EXISTS tags_staff_manage ON public.tags;
CREATE POLICY tags_staff_manage ON public.tags
  FOR ALL TO authenticated
  USING ((SELECT private.is_staff_or_admin()))
  WITH CHECK ((SELECT private.is_staff_or_admin()));
DROP POLICY IF EXISTS tags_service_role_all ON public.tags;
CREATE POLICY tags_service_role_all ON public.tags
  FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.entity_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS entity_tags_public_read ON public.entity_tags;
CREATE POLICY entity_tags_public_read ON public.entity_tags
  FOR SELECT TO anon, authenticated USING (status = 'active');
DROP POLICY IF EXISTS entity_tags_owner_read ON public.entity_tags;
CREATE POLICY entity_tags_owner_read ON public.entity_tags
  FOR SELECT TO authenticated
  USING (created_by = (SELECT auth.uid()));
DROP POLICY IF EXISTS entity_tags_owner_insert ON public.entity_tags;
CREATE POLICY entity_tags_owner_insert ON public.entity_tags
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND status = 'pending_review'
  );
DROP POLICY IF EXISTS entity_tags_owner_update ON public.entity_tags;
CREATE POLICY entity_tags_owner_update ON public.entity_tags
  FOR UPDATE TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    AND status = 'pending_review'
  )
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND status = 'pending_review'
  );
DROP POLICY IF EXISTS entity_tags_staff_manage ON public.entity_tags;
CREATE POLICY entity_tags_staff_manage ON public.entity_tags
  FOR ALL TO authenticated
  USING ((SELECT private.is_staff_or_admin()))
  WITH CHECK ((SELECT private.is_staff_or_admin()));
DROP POLICY IF EXISTS entity_tags_service_role_all ON public.entity_tags;
CREATE POLICY entity_tags_service_role_all ON public.entity_tags
  FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.content_entities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS content_entities_public_read ON public.content_entities;
CREATE POLICY content_entities_public_read ON public.content_entities
  FOR SELECT TO anon, authenticated USING (status = 'active');
DROP POLICY IF EXISTS content_entities_owner_read ON public.content_entities;
CREATE POLICY content_entities_owner_read ON public.content_entities
  FOR SELECT TO authenticated
  USING (created_by = (SELECT auth.uid()));
DROP POLICY IF EXISTS content_entities_owner_insert
  ON public.content_entities;
CREATE POLICY content_entities_owner_insert
  ON public.content_entities
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND status = 'pending_review'
  );
DROP POLICY IF EXISTS content_entities_owner_update
  ON public.content_entities;
CREATE POLICY content_entities_owner_update
  ON public.content_entities
  FOR UPDATE TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    AND status = 'pending_review'
  )
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND status = 'pending_review'
  );
DROP POLICY IF EXISTS content_entities_staff_manage
  ON public.content_entities;
CREATE POLICY content_entities_staff_manage
  ON public.content_entities
  FOR ALL TO authenticated
  USING ((SELECT private.is_staff_or_admin()))
  WITH CHECK ((SELECT private.is_staff_or_admin()));
DROP POLICY IF EXISTS content_entities_service_role_all
  ON public.content_entities;
CREATE POLICY content_entities_service_role_all
  ON public.content_entities
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'graph_migration_runs',
    'graph_migration_checkpoints',
    'graph_migration_issues',
    'graph_sync_outbox'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'DROP POLICY IF EXISTS "graph_operations_staff_manage" ON public.%I',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY "graph_operations_staff_manage" ON public.%I
       FOR ALL TO authenticated
       USING ((SELECT private.is_staff_or_admin()))
       WITH CHECK ((SELECT private.is_staff_or_admin()))',
      table_name
    );
    EXECUTE format(
      'DROP POLICY IF EXISTS "graph_operations_service_role_all" ON public.%I',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY "graph_operations_service_role_all" ON public.%I
       FOR ALL TO service_role USING (true) WITH CHECK (true)',
      table_name
    );
  END LOOP;
END
$$;

COMMIT;
