-- Stage 7 compatibility write: every authoritative material must maintain one
-- canonical material entity and binding. Reconciles materials created after
-- the Stage 6 backfill and keeps future material writes synchronized.

BEGIN;

CREATE OR REPLACE FUNCTION private.ensure_material_canonical_binding(
  p_material_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_material public.materials%ROWTYPE;
  v_entity_id UUID;
  v_entity_status TEXT;
BEGIN
  SELECT * INTO v_material
  FROM public.materials
  WHERE id = p_material_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Material does not exist: %', p_material_id;
  END IF;

  v_entity_status := CASE v_material.status
    WHEN 'published' THEN 'active'
    WHEN 'archived' THEN 'archived'
    ELSE 'draft'
  END;

  SELECT entity_id INTO v_entity_id
  FROM public.entity_canonical_bindings
  WHERE material_id = p_material_id;

  IF v_entity_id IS NULL AND v_material.slug IS NOT NULL THEN
    SELECT id INTO v_entity_id
    FROM public.entities
    WHERE entity_type = 'material'
      AND lower(slug) = lower(v_material.slug)
    LIMIT 1;
  END IF;

  IF v_entity_id IS NULL THEN
    INSERT INTO public.entities (
      entity_type, name, slug, description, status, created_by
    ) VALUES (
      'material', v_material.name, v_material.slug, v_material.description,
      v_entity_status, v_material.created_by
    ) RETURNING id INTO v_entity_id;
  ELSE
    UPDATE public.entities
    SET name = v_material.name,
        slug = v_material.slug,
        description = v_material.description,
        status = v_entity_status,
        updated_at = now()
    WHERE id = v_entity_id AND entity_type = 'material';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Canonical binding references a non-material entity: %', v_entity_id;
    END IF;
  END IF;

  INSERT INTO public.entity_canonical_bindings (entity_id, material_id)
  VALUES (v_entity_id, p_material_id)
  ON CONFLICT (material_id) DO NOTHING;

  IF NOT EXISTS (
    SELECT 1 FROM public.entity_canonical_bindings
    WHERE entity_id = v_entity_id AND material_id = p_material_id
  ) THEN
    RAISE EXCEPTION 'Material canonical binding conflicts with another source: %', p_material_id;
  END IF;

  RETURN v_entity_id;
END;
$$;

REVOKE ALL ON FUNCTION private.ensure_material_canonical_binding(UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.ensure_material_canonical_binding(UUID)
  TO service_role;

CREATE OR REPLACE FUNCTION private.sync_material_canonical_binding_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM private.ensure_material_canonical_binding(NEW.id);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.sync_material_canonical_binding_trigger()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS materials_sync_canonical_binding ON public.materials;
CREATE TRIGGER materials_sync_canonical_binding
AFTER INSERT OR UPDATE OF name, slug, description, status
ON public.materials
FOR EACH ROW
EXECUTE FUNCTION private.sync_material_canonical_binding_trigger();

DO $$
DECLARE
  v_material_id UUID;
BEGIN
  FOR v_material_id IN
    SELECT m.id
    FROM public.materials m
    LEFT JOIN public.entity_canonical_bindings binding
      ON binding.material_id = m.id
    WHERE binding.entity_id IS NULL
    ORDER BY m.id
  LOOP
    PERFORM private.ensure_material_canonical_binding(v_material_id);
  END LOOP;
END;
$$;

COMMIT;
