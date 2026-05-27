-- Step 9: Seed materials, articles, and sources from KV store
-- Reads all material:* blobs from kv_store_17cae920 and distributes them
-- across the materials, articles, sources, and material_sources tables.
--
-- KV shape (per key "material:{id}"):
--   value = Material JSON blob with nested:
--     sources[]               → sources + material_sources tables
--     articles.compostability[] } → articles table (three categories)
--     articles.recyclability[]  }
--     articles.reusability[]    }
--     wiki                    → stored as JSONB in materials.wiki
--
-- Sources deduplication: deterministic UUID via md5(title|year|doi|authors)
--   allows ON CONFLICT (id) DO NOTHING across materials that cite the same source.
--
-- Idempotent: safe to re-run. All inserts use ON CONFLICT DO UPDATE/NOTHING.
--
-- Zero production impact: reads KV, writes new relational tables only.
-- The live site still reads from KV until Step 12.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. SEED MATERIALS
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO materials (
  legacy_kv_id,
  name,
  slug,
  aliases,
  category_id,
  description,
  is_hub,
  linked_material_ids,

  compostability,
  recyclability,
  reusability,

  -- CR-v1
  y_value, d_value, c_value, m_value, e_value,
  cr_practical_mean, cr_theoretical_mean,
  cr_practical_ci95, cr_theoretical_ci95,

  -- CC-v1
  b_value, n_value, t_value, h_value,
  cc_practical_mean, cc_theoretical_mean,
  cc_practical_ci95, cc_theoretical_ci95,

  -- RU-v1
  l_value, r_value, u_value, c_ru_value,
  ru_practical_mean, ru_theoretical_mean,
  ru_practical_ci95, ru_theoretical_ci95,

  confidence_level,
  whitepaper_version,
  calculation_timestamp,
  method_version,
  wiki,
  status,

  created_by,
  edited_by,
  writer_name,
  editor_name,
  created_at,
  updated_at
)
SELECT
  value->>'id'                                                              AS legacy_kv_id,
  value->>'name'                                                            AS name,
  -- slug: use the KV id (already URL-safe, uniquely identifies the material)
  value->>'id'                                                              AS slug,
  -- aliases: JSONB string array → TEXT[]
  CASE
    WHEN value->'aliases' IS NOT NULL AND jsonb_typeof(value->'aliases') = 'array'
    THEN ARRAY(SELECT jsonb_array_elements_text(value->'aliases'))
    ELSE NULL
  END                                                                       AS aliases,
  -- categoryId takes precedence over category display name
  COALESCE(value->>'categoryId', value->>'category')                        AS category_id,
  value->>'description'                                                     AS description,
  COALESCE((value->>'isHub')::boolean, false)                               AS is_hub,
  CASE
    WHEN value->'linkedMaterialIds' IS NOT NULL
      AND jsonb_typeof(value->'linkedMaterialIds') = 'array'
    THEN ARRAY(SELECT jsonb_array_elements_text(value->'linkedMaterialIds'))
    ELSE NULL
  END                                                                       AS linked_material_ids,

  -- Public sustainability scores (KV stores as float 0-100; cast to SMALLINT)
  CASE WHEN value->>'compostability' IS NOT NULL
    THEN ROUND((value->>'compostability')::numeric)::smallint ELSE NULL END AS compostability,
  CASE WHEN value->>'recyclability' IS NOT NULL
    THEN ROUND((value->>'recyclability')::numeric)::smallint ELSE NULL END  AS recyclability,
  CASE WHEN value->>'reusability' IS NOT NULL
    THEN ROUND((value->>'reusability')::numeric)::smallint ELSE NULL END    AS reusability,

  -- CR-v1 parameters (NUMERIC(6,4))
  (value->>'Y_value')::numeric                                              AS y_value,
  (value->>'D_value')::numeric                                              AS d_value,
  (value->>'C_value')::numeric                                              AS c_value,
  (value->>'M_value')::numeric                                              AS m_value,
  (value->>'E_value')::numeric                                              AS e_value,
  (value->>'CR_practical_mean')::numeric                                    AS cr_practical_mean,
  (value->>'CR_theoretical_mean')::numeric                                  AS cr_theoretical_mean,
  value->'CR_practical_CI95'                                                AS cr_practical_ci95,
  value->'CR_theoretical_CI95'                                              AS cr_theoretical_ci95,

  -- CC-v1 parameters
  (value->>'B_value')::numeric                                              AS b_value,
  (value->>'N_value')::numeric                                              AS n_value,
  (value->>'T_value')::numeric                                              AS t_value,
  (value->>'H_value')::numeric                                              AS h_value,
  (value->>'CC_practical_mean')::numeric                                    AS cc_practical_mean,
  (value->>'CC_theoretical_mean')::numeric                                  AS cc_theoretical_mean,
  value->'CC_practical_CI95'                                                AS cc_practical_ci95,
  value->'CC_theoretical_CI95'                                              AS cc_theoretical_ci95,

  -- RU-v1 parameters
  (value->>'L_value')::numeric                                              AS l_value,
  (value->>'R_value')::numeric                                              AS r_value,
  (value->>'U_value')::numeric                                              AS u_value,
  (value->>'C_RU_value')::numeric                                           AS c_ru_value,
  (value->>'RU_practical_mean')::numeric                                    AS ru_practical_mean,
  (value->>'RU_theoretical_mean')::numeric                                  AS ru_theoretical_mean,
  value->'RU_practical_CI95'                                                AS ru_practical_ci95,
  value->'RU_theoretical_CI95'                                              AS ru_theoretical_ci95,

  -- Data quality
  CASE WHEN value->>'confidence_level' IN ('High', 'Medium', 'Low')
    THEN value->>'confidence_level' ELSE NULL END                           AS confidence_level,
  value->>'whitepaper_version'                                              AS whitepaper_version,
  CASE WHEN value->>'calculation_timestamp' IS NOT NULL
    THEN (value->>'calculation_timestamp')::timestamptz ELSE NULL END       AS calculation_timestamp,
  value->>'method_version'                                                  AS method_version,
  value->'wiki'                                                             AS wiki,

  COALESCE(
    CASE WHEN value->>'status' IN ('draft', 'published', 'archived')
      THEN value->>'status' ELSE NULL END,
    'published'
  )                                                                         AS status,

  -- Attribution: validate UUID format before casting
  CASE WHEN value->>'created_by' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN (value->>'created_by')::uuid ELSE NULL END                         AS created_by,
  CASE WHEN value->>'edited_by' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN (value->>'edited_by')::uuid ELSE NULL END                          AS edited_by,
  value->>'writer_name'                                                     AS writer_name,
  value->>'editor_name'                                                     AS editor_name,

  COALESCE(
    CASE WHEN value->>'created_at' IS NOT NULL
      THEN (value->>'created_at')::timestamptz ELSE NULL END,
    NOW()
  )                                                                         AS created_at,
  COALESCE(
    CASE WHEN value->>'updated_at' IS NOT NULL
      THEN (value->>'updated_at')::timestamptz ELSE NULL END,
    NOW()
  )                                                                         AS updated_at

FROM kv_store_17cae920
WHERE key LIKE 'material:%'
  AND value IS NOT NULL
  AND value->>'id' IS NOT NULL
  AND value->>'name' IS NOT NULL
ON CONFLICT (legacy_kv_id) DO UPDATE SET
  name                  = EXCLUDED.name,
  slug                  = EXCLUDED.slug,
  aliases               = EXCLUDED.aliases,
  category_id           = EXCLUDED.category_id,
  description           = EXCLUDED.description,
  is_hub                = EXCLUDED.is_hub,
  linked_material_ids   = EXCLUDED.linked_material_ids,
  compostability        = EXCLUDED.compostability,
  recyclability         = EXCLUDED.recyclability,
  reusability           = EXCLUDED.reusability,
  y_value               = EXCLUDED.y_value,
  d_value               = EXCLUDED.d_value,
  c_value               = EXCLUDED.c_value,
  m_value               = EXCLUDED.m_value,
  e_value               = EXCLUDED.e_value,
  cr_practical_mean     = EXCLUDED.cr_practical_mean,
  cr_theoretical_mean   = EXCLUDED.cr_theoretical_mean,
  cr_practical_ci95     = EXCLUDED.cr_practical_ci95,
  cr_theoretical_ci95   = EXCLUDED.cr_theoretical_ci95,
  b_value               = EXCLUDED.b_value,
  n_value               = EXCLUDED.n_value,
  t_value               = EXCLUDED.t_value,
  h_value               = EXCLUDED.h_value,
  cc_practical_mean     = EXCLUDED.cc_practical_mean,
  cc_theoretical_mean   = EXCLUDED.cc_theoretical_mean,
  cc_practical_ci95     = EXCLUDED.cc_practical_ci95,
  cc_theoretical_ci95   = EXCLUDED.cc_theoretical_ci95,
  l_value               = EXCLUDED.l_value,
  r_value               = EXCLUDED.r_value,
  u_value               = EXCLUDED.u_value,
  c_ru_value            = EXCLUDED.c_ru_value,
  ru_practical_mean     = EXCLUDED.ru_practical_mean,
  ru_theoretical_mean   = EXCLUDED.ru_theoretical_mean,
  ru_practical_ci95     = EXCLUDED.ru_practical_ci95,
  ru_theoretical_ci95   = EXCLUDED.ru_theoretical_ci95,
  confidence_level      = EXCLUDED.confidence_level,
  whitepaper_version    = EXCLUDED.whitepaper_version,
  calculation_timestamp = EXCLUDED.calculation_timestamp,
  method_version        = EXCLUDED.method_version,
  wiki                  = EXCLUDED.wiki,
  status                = EXCLUDED.status,
  created_by            = EXCLUDED.created_by,
  edited_by             = EXCLUDED.edited_by,
  writer_name           = EXCLUDED.writer_name,
  editor_name           = EXCLUDED.editor_name,
  updated_at            = NOW();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SEED SOURCES
-- Deterministic UUID: md5(title|year|doi|authors) → idempotent on re-run.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO sources (
  id,
  title,
  authors,
  year,
  doi,
  url,
  pdf_file_name
)
SELECT DISTINCT ON (source_id)
  source_id,
  src->>'title'                                                             AS title,
  src->>'authors'                                                           AS authors,
  CASE WHEN src->>'year' IS NOT NULL AND src->>'year' ~ '^\d{4}$'
    THEN (src->>'year')::smallint ELSE NULL END                             AS year,
  NULLIF(src->>'doi', '')                                                   AS doi,
  NULLIF(src->>'url', '')                                                   AS url,
  -- KV stores as camelCase pdfFileName
  COALESCE(NULLIF(src->>'pdfFileName', ''), NULLIF(src->>'pdf_file_name', '')) AS pdf_file_name
FROM (
  SELECT
    -- Deterministic UUID from md5: format 32 hex chars as 8-4-4-4-12
    CAST(
      regexp_replace(
        md5(
          COALESCE(src->>'title', '') || '|' ||
          COALESCE(src->>'year', '') || '|' ||
          COALESCE(src->>'doi', '') || '|' ||
          COALESCE(src->>'authors', '')
        ),
        '^(.{8})(.{4})(.{4})(.{4})(.{12})$',
        '\1-\2-\3-\4-\5'
      ) AS uuid
    ) AS source_id,
    src
  FROM kv_store_17cae920 kv,
    jsonb_array_elements(kv.value->'sources') AS src
  WHERE kv.key LIKE 'material:%'
    AND kv.value IS NOT NULL
    AND kv.value->'sources' IS NOT NULL
    AND jsonb_typeof(kv.value->'sources') = 'array'
    AND src->>'title' IS NOT NULL
) sub
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. SEED MATERIAL_SOURCES (junction)
-- Links each material KV id to its source rows.
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO material_sources (
  legacy_material_kv_id,
  source_id,
  weight,
  parameters
)
SELECT
  kv.value->>'id'                                                           AS legacy_material_kv_id,
  CAST(
    regexp_replace(
      md5(
        COALESCE(src->>'title', '') || '|' ||
        COALESCE(src->>'year', '') || '|' ||
        COALESCE(src->>'doi', '') || '|' ||
        COALESCE(src->>'authors', '')
      ),
      '^(.{8})(.{4})(.{4})(.{4})(.{12})$',
      '\1-\2-\3-\4-\5'
    ) AS uuid
  )                                                                         AS source_id,
  CASE WHEN src->>'weight' IS NOT NULL AND src->>'weight' ~ '^-?\d*\.?\d+$'
    THEN (src->>'weight')::numeric(4,3) ELSE NULL END                       AS weight,
  CASE
    WHEN src->'parameters' IS NOT NULL AND jsonb_typeof(src->'parameters') = 'array'
    THEN ARRAY(SELECT jsonb_array_elements_text(src->'parameters'))
    ELSE NULL
  END                                                                       AS parameters
FROM kv_store_17cae920 kv,
  jsonb_array_elements(kv.value->'sources') AS src
WHERE kv.key LIKE 'material:%'
  AND kv.value IS NOT NULL
  AND kv.value->'sources' IS NOT NULL
  AND jsonb_typeof(kv.value->'sources') = 'array'
  AND src->>'title' IS NOT NULL
  AND kv.value->>'id' IS NOT NULL
ON CONFLICT (legacy_material_kv_id, source_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SEED ARTICLES — compostability
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO articles (
  legacy_material_kv_id,
  title,
  slug,
  sustainability_category,
  article_type,
  content,
  cover_image_url,
  status,
  version,
  created_by,
  edited_by,
  writer_name,
  editor_name,
  date_added,
  created_at,
  updated_at
)
SELECT
  kv.value->>'id'                                                           AS legacy_material_kv_id,
  art->>'title'                                                             AS title,
  -- slug: use stored slug, or generate from title if missing
  COALESCE(
    NULLIF(art->>'slug', ''),
    lower(regexp_replace(COALESCE(art->>'title', 'untitled'), '[^a-z0-9]+', '-', 'gi'))
  )                                                                         AS slug,
  'compostability'                                                          AS sustainability_category,
  COALESCE(
    CASE WHEN art->>'article_type' IN ('DIY', 'Industrial', 'Experimental')
      THEN art->>'article_type' ELSE NULL END,
    CASE WHEN art->>'articleType' IN ('DIY', 'Industrial', 'Experimental')
      THEN art->>'articleType' ELSE NULL END,
    'DIY'
  )                                                                         AS article_type,
  art->'content'                                                            AS content,
  NULLIF(art->>'cover_image_url', '')                                       AS cover_image_url,
  COALESCE(
    CASE WHEN art->>'status' IN ('draft', 'published', 'archived')
      THEN art->>'status' ELSE NULL END,
    'published'
  )                                                                         AS status,
  COALESCE((art->>'version')::integer, 1)                                   AS version,
  CASE WHEN COALESCE(art->>'author_id', art->>'created_by') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN (COALESCE(art->>'author_id', art->>'created_by'))::uuid ELSE NULL END AS created_by,
  CASE WHEN art->>'edited_by' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN (art->>'edited_by')::uuid ELSE NULL END                            AS edited_by,
  art->>'writer_name'                                                       AS writer_name,
  art->>'editor_name'                                                       AS editor_name,
  COALESCE(art->>'dateAdded', art->>'date_added')                           AS date_added,
  COALESCE(
    CASE WHEN art->>'created_at' IS NOT NULL
      THEN (art->>'created_at')::timestamptz ELSE NULL END,
    NOW()
  )                                                                         AS created_at,
  COALESCE(
    CASE WHEN art->>'updated_at' IS NOT NULL
      THEN (art->>'updated_at')::timestamptz ELSE NULL END,
    NOW()
  )                                                                         AS updated_at
FROM kv_store_17cae920 kv,
  jsonb_array_elements(kv.value->'articles'->'compostability') AS art
WHERE kv.key LIKE 'material:%'
  AND kv.value IS NOT NULL
  AND kv.value->'articles' IS NOT NULL
  AND kv.value->'articles'->'compostability' IS NOT NULL
  AND jsonb_typeof(kv.value->'articles'->'compostability') = 'array'
  AND art->>'title' IS NOT NULL
  AND kv.value->>'id' IS NOT NULL
ON CONFLICT (legacy_material_kv_id, slug) DO UPDATE SET
  title                   = EXCLUDED.title,
  sustainability_category = EXCLUDED.sustainability_category,
  article_type            = EXCLUDED.article_type,
  content                 = EXCLUDED.content,
  cover_image_url         = EXCLUDED.cover_image_url,
  status                  = EXCLUDED.status,
  version                 = EXCLUDED.version,
  created_by              = EXCLUDED.created_by,
  edited_by               = EXCLUDED.edited_by,
  writer_name             = EXCLUDED.writer_name,
  editor_name             = EXCLUDED.editor_name,
  date_added              = EXCLUDED.date_added,
  updated_at              = NOW();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. SEED ARTICLES — recyclability
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO articles (
  legacy_material_kv_id,
  title,
  slug,
  sustainability_category,
  article_type,
  content,
  cover_image_url,
  status,
  version,
  created_by,
  edited_by,
  writer_name,
  editor_name,
  date_added,
  created_at,
  updated_at
)
SELECT
  kv.value->>'id'                                                           AS legacy_material_kv_id,
  art->>'title'                                                             AS title,
  COALESCE(
    NULLIF(art->>'slug', ''),
    lower(regexp_replace(COALESCE(art->>'title', 'untitled'), '[^a-z0-9]+', '-', 'gi'))
  )                                                                         AS slug,
  'recyclability'                                                           AS sustainability_category,
  COALESCE(
    CASE WHEN art->>'article_type' IN ('DIY', 'Industrial', 'Experimental')
      THEN art->>'article_type' ELSE NULL END,
    CASE WHEN art->>'articleType' IN ('DIY', 'Industrial', 'Experimental')
      THEN art->>'articleType' ELSE NULL END,
    'DIY'
  )                                                                         AS article_type,
  art->'content'                                                            AS content,
  NULLIF(art->>'cover_image_url', '')                                       AS cover_image_url,
  COALESCE(
    CASE WHEN art->>'status' IN ('draft', 'published', 'archived')
      THEN art->>'status' ELSE NULL END,
    'published'
  )                                                                         AS status,
  COALESCE((art->>'version')::integer, 1)                                   AS version,
  CASE WHEN COALESCE(art->>'author_id', art->>'created_by') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN (COALESCE(art->>'author_id', art->>'created_by'))::uuid ELSE NULL END AS created_by,
  CASE WHEN art->>'edited_by' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN (art->>'edited_by')::uuid ELSE NULL END                            AS edited_by,
  art->>'writer_name'                                                       AS writer_name,
  art->>'editor_name'                                                       AS editor_name,
  COALESCE(art->>'dateAdded', art->>'date_added')                           AS date_added,
  COALESCE(
    CASE WHEN art->>'created_at' IS NOT NULL
      THEN (art->>'created_at')::timestamptz ELSE NULL END,
    NOW()
  )                                                                         AS created_at,
  COALESCE(
    CASE WHEN art->>'updated_at' IS NOT NULL
      THEN (art->>'updated_at')::timestamptz ELSE NULL END,
    NOW()
  )                                                                         AS updated_at
FROM kv_store_17cae920 kv,
  jsonb_array_elements(kv.value->'articles'->'recyclability') AS art
WHERE kv.key LIKE 'material:%'
  AND kv.value IS NOT NULL
  AND kv.value->'articles' IS NOT NULL
  AND kv.value->'articles'->'recyclability' IS NOT NULL
  AND jsonb_typeof(kv.value->'articles'->'recyclability') = 'array'
  AND art->>'title' IS NOT NULL
  AND kv.value->>'id' IS NOT NULL
ON CONFLICT (legacy_material_kv_id, slug) DO UPDATE SET
  title                   = EXCLUDED.title,
  sustainability_category = EXCLUDED.sustainability_category,
  article_type            = EXCLUDED.article_type,
  content                 = EXCLUDED.content,
  cover_image_url         = EXCLUDED.cover_image_url,
  status                  = EXCLUDED.status,
  version                 = EXCLUDED.version,
  created_by              = EXCLUDED.created_by,
  edited_by               = EXCLUDED.edited_by,
  writer_name             = EXCLUDED.writer_name,
  editor_name             = EXCLUDED.editor_name,
  date_added              = EXCLUDED.date_added,
  updated_at              = NOW();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. SEED ARTICLES — reusability
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO articles (
  legacy_material_kv_id,
  title,
  slug,
  sustainability_category,
  article_type,
  content,
  cover_image_url,
  status,
  version,
  created_by,
  edited_by,
  writer_name,
  editor_name,
  date_added,
  created_at,
  updated_at
)
SELECT
  kv.value->>'id'                                                           AS legacy_material_kv_id,
  art->>'title'                                                             AS title,
  COALESCE(
    NULLIF(art->>'slug', ''),
    lower(regexp_replace(COALESCE(art->>'title', 'untitled'), '[^a-z0-9]+', '-', 'gi'))
  )                                                                         AS slug,
  'reusability'                                                             AS sustainability_category,
  COALESCE(
    CASE WHEN art->>'article_type' IN ('DIY', 'Industrial', 'Experimental')
      THEN art->>'article_type' ELSE NULL END,
    CASE WHEN art->>'articleType' IN ('DIY', 'Industrial', 'Experimental')
      THEN art->>'articleType' ELSE NULL END,
    'DIY'
  )                                                                         AS article_type,
  art->'content'                                                            AS content,
  NULLIF(art->>'cover_image_url', '')                                       AS cover_image_url,
  COALESCE(
    CASE WHEN art->>'status' IN ('draft', 'published', 'archived')
      THEN art->>'status' ELSE NULL END,
    'published'
  )                                                                         AS status,
  COALESCE((art->>'version')::integer, 1)                                   AS version,
  CASE WHEN COALESCE(art->>'author_id', art->>'created_by') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN (COALESCE(art->>'author_id', art->>'created_by'))::uuid ELSE NULL END AS created_by,
  CASE WHEN art->>'edited_by' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN (art->>'edited_by')::uuid ELSE NULL END                            AS edited_by,
  art->>'writer_name'                                                       AS writer_name,
  art->>'editor_name'                                                       AS editor_name,
  COALESCE(art->>'dateAdded', art->>'date_added')                           AS date_added,
  COALESCE(
    CASE WHEN art->>'created_at' IS NOT NULL
      THEN (art->>'created_at')::timestamptz ELSE NULL END,
    NOW()
  )                                                                         AS created_at,
  COALESCE(
    CASE WHEN art->>'updated_at' IS NOT NULL
      THEN (art->>'updated_at')::timestamptz ELSE NULL END,
    NOW()
  )                                                                         AS updated_at
FROM kv_store_17cae920 kv,
  jsonb_array_elements(kv.value->'articles'->'reusability') AS art
WHERE kv.key LIKE 'material:%'
  AND kv.value IS NOT NULL
  AND kv.value->'articles' IS NOT NULL
  AND kv.value->'articles'->'reusability' IS NOT NULL
  AND jsonb_typeof(kv.value->'articles'->'reusability') = 'array'
  AND art->>'title' IS NOT NULL
  AND kv.value->>'id' IS NOT NULL
ON CONFLICT (legacy_material_kv_id, slug) DO UPDATE SET
  title                   = EXCLUDED.title,
  sustainability_category = EXCLUDED.sustainability_category,
  article_type            = EXCLUDED.article_type,
  content                 = EXCLUDED.content,
  cover_image_url         = EXCLUDED.cover_image_url,
  status                  = EXCLUDED.status,
  version                 = EXCLUDED.version,
  created_by              = EXCLUDED.created_by,
  edited_by               = EXCLUDED.edited_by,
  writer_name             = EXCLUDED.writer_name,
  editor_name             = EXCLUDED.editor_name,
  date_added              = EXCLUDED.date_added,
  updated_at              = NOW();
