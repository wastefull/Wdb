# WasteDB Source Integration & Evidence Pipeline Specification

_A foundation document for future product, data, and design changes._

---

## 0. Purpose and scope

Define a unified, auditable pipeline that converts literature sources into structured evidence, aggregates parameters for materials, and exposes results to both public and research users—without duplicating the existing Source Library Manager.

---

## 1. Principles

- **Single source of truth:** The Source Library Manager remains canonical for bibliographic metadata, source types, default weights, and usage tracking.
- **Traceable evidence:** Every numeric parameter is derived from immutable, minimally interpretable units (MIUs) that link directly to a source location.
- **Transparent transforms:** Normalization and derived calculations are versioned and publicly documented.
- **Accessibility and inclusivity:** Visualizations and UI affordances remain WCAG-compliant and understandable in plain language.

---

## 2. Key terms

- **Library Source (global):** A source object in the Source Library Manager (e.g., peer-reviewed article, government report) with stable `id`, `type`, default weight, tags, and optional PDF.
- **Evidence Point (MIU):** A single extracted data item tied to a Library Source with parameter, raw value, units, locator (page/figure/table), verbatim snippet, and normalization metadata.
- **Parameter Aggregation:** A computed statistic (mean, SE, CI95, n) for a given material × parameter based on selected MIUs and documented weighting rules.

---

## 3. Information architecture updates

- **Admin → Data Processing:** Add entry point “Open Curation Workbench.”
- **Admin → Curation Workbench (new):** Split pane with Source Viewer (left) and Evidence Wizard (right).
- **Material Detail → Evidence tab (new, public):** Read-only MIU list powering each parameter with links to Library Sources.

---

## 4. Evidence Wizard (5-step flow)

1. **Locate:** Select Library Source; record page/figure/table; capture a verbatim snippet and optional screenshot crop.
2. **Classify:** Choose parameter (Y, C, M, D, or E); add context tags (process, stream, region, cycles, contamination %, scale).
3. **Quantify:** Enter raw value + units; convert units; normalize to 0–1 via a chosen transform version; if derived, provide formula and inputs.
4. **Confidence:** Record method completeness, sample size, and any notes; cache source type and default weight from the Library Source.
5. **Review & Save:** Create immutable MIU; display MIU ID; offer actions to add another MIU from the same source or proceed to aggregation.

_Objectives:_ Median time per MIU < 3 minutes after first day; inter-curator agreement κ ≥ 0.7 on categorical fields; median numeric delta ≤ 5%.

---

## 5. Parameter aggregation workflow

- Filter/select MIUs for a material × parameter (by source type, region, process, etc.).
- Compute weighted mean, SE, CI95, and n using documented weighting policy.
- Save aggregation with list of MIU IDs, weight policy snapshot, methods version, timestamp, and operator identity.
- Update material-level fields (e.g., `Y_value`, `D_value`, `CR_practical_mean`, `CR_theoretical_mean`) via application logic.

---

## 6. Database schema (Supabase/Postgres)

### 6.1 New table: `public.evidence_points` (MIUs)

```sql
create table if not exists public.evidence_points (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references public.materials(id) on delete cascade,

  -- Link to Source Library Manager
  source_ref text not null,      -- Library Source id (string)
  source_type text,              -- cached type (e.g., 'peer_reviewed')
  source_weight numeric,         -- cached default or override at extraction time

  parameter text not null,       -- 'Y'|'C'|'M'|'D'|'E'
  value_raw numeric not null,
  units text not null,
  value_norm numeric,            -- null for parameter='E'
  transform_version text not null default 'v1.0',

  page int, figure text, table_ref text, paragraph text,
  snippet text not null,

  process text, stream text, cycles int,
  contamination_percent numeric, temperature_c numeric, time_minutes numeric,
  region text, scale text,

  is_derived boolean not null default false,
  derived_formula text, assumptions text,

  method_completeness text, sample_size int,
  curator_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  codebook_version text not null default 'v0'
);

create index if not exists ep_material_param on public.evidence_points (material_id, parameter);
create index if not exists ep_source_ref on public.evidence_points (source_ref);
```

### 6.2 New table: `public.parameter_aggregations`

```sql
create table if not exists public.parameter_aggregations (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references public.materials(id) on delete cascade,
  parameter text not null,
  mean numeric not null,
  se numeric,
  ci95 numrange,
  n_mius int not null,
  miu_ids uuid[] not null,
  weights_used jsonb not null,         -- snapshot of policy for audit
  methods_version text not null,
  calculated_at timestamptz not null default now(),
  calculated_by uuid references auth.users(id)
);

create unique index if not exists agg_unique on public.parameter_aggregations (material_id, parameter);
alter table public.parameter_aggregations
  add constraint ci95_ordered check (lower(ci95) <= upper(ci95));
```

### 6.3 Materials table (non-breaking extensions)

- Add fields if absent: `y_value`, `c_value`, `m_value`, `d_value`, `e_value`,
  `cr_practical_mean`, `cr_practical_ci95`, `cr_practical_label`,
  `cr_theoretical_mean`, `cr_theoretical_ci95`, `cr_theoretical_label`,
  `confidence`, `whitepaper_version`, `calculation_timestamp`.

### 6.4 Views for export

- **Public view (`v_materials_public`):** 0–100 practical outputs for lay audiences.
- **Research view (`v_materials_research`):** normalized parameters, CI ranges, and aggregation joins.

### 6.5 RLS policies

- Read for all; write for admins (and optional contributor insert for MIUs before lock).
- Prevent deletion of Library Sources referenced by any MIU (enforced in service layer using usage counts).

---

## 7. API endpoints

### Existing (Library Sources)

- `GET/POST/PUT/DELETE /make-server-17cae920/sources`
- `POST /make-server-17cae920/sources/batch`

### New (Evidence & Aggregation)

- `GET  /make-server-17cae920/evidence?material&parameter`
- `POST /make-server-17cae920/evidence` (create MIU)
- `GET  /make-server-17cae920/aggregations?material`
- `POST /make-server-17cae920/aggregate` (compute & save aggregation)
- `GET  /make-server-17cae920/export/public` (CSV)
- `GET  /make-server-17cae920/export/full` (JSON)

_Validation:_ MIU requires parameter, raw value + units, locator, snippet, transform version; “derived” requires a formula. Aggregation requires ≥3 MIUs or applies a “low confidence” label.

---

## 8. Weighting and calibration policy

- **Default source weights:** derived from Library Source `type` (peer-reviewed, government, industrial, NGO, internal) and cached in MIUs at extraction time for reproducibility.
- **Calibration:** When real-world targets are available (e.g., capture rates), learn weights via constrained regression or Bayesian inference; store weight vectors with version, cross-validation metrics, and sensitivity results.
- **Region/stream specificity:** Allow separate weight vectors where data suffices; fall back to global priors otherwise.

---

## 9. Visual design updates (Figma)

### Components

- **Workbench** (split pane), **Wizard** (5 steps), **Chips/Badges** (parameter, process, stream, confidence), **Evidence Card** (public read-only), **Aggregation Table**, **Diff/Double-Extraction** view.
- **Quantile–Halo–Gap** chart grammar for research and public views, with accessible color + pattern signaling.

### Tokens

- Colors: brand blues for theoretical halos; neutral grays for practical halos; neutral blended gradient for gap zone; high-contrast fallbacks.
- Typography: Sniglet display headings; system body; monospaced math/code.
- Spacing, radii, shadows as per existing design system.

---

## 10. Curator Codebook v0 (human-oriented)

### Golden rules

1. Every MIU must be independently checkable (locator + snippet).
2. Record raw first, then normalize with a declared transform version.
3. For derived values, include formula and inputs.
4. Unknowns remain blank; assumptions are explicit.

### Parameter guidance

- **Y (Yield, 0–1 beneficial):** Prefer mass_out/mass_in for the same stream; record process and stream.
- **D (Degradation, 0–1 penalty):** Prefer tensile retention or IV loss; compute `D = 1 − retention`; include cycles, temp.
- **C (Contamination tolerance, 0–1 beneficial):** Capture threshold/curve; normalize with documented function.
- **M (Maturity, 0–1 beneficial):** Map TRL or facility count by region via published table.
- **E (Energy, MJ/kg):** Store raw MJ/kg (or delta vs virgin). Do not fold into CR.

### MIU checklist

- Parameter; raw value + units; normalized value + transform version; context tags; locator; snippet; screenshot (optional); method completeness; sample size; derived formula if applicable; curator ID; timestamps; codebook version.

### Double-extraction

- A sample of sources receives independent extraction by two curators; targets: κ ≥ 0.7 and ≤ 5% median numeric delta; adjudication triggers codebook updates.

---

## 11. Validation & quality gates

- CI width alerts for unusually broad intervals; import validators for missing locator/snippet; duplicate MIU detection (same source_ref + page + parameter + value).
- Aggregations display n and MIU IDs; research exports include MIU IDs and `source_ref` for replication.

---

## 12. Migration plan (minimal change)

1. Retain existing Source Library Manager; no duplication of source records.
2. Introduce `evidence_points` and `parameter_aggregations`.
3. Connect Wizard to Library Source search and selection; cache `source_type` and `source_weight`.
4. Enforce usage guards: sources referenced by MIUs cannot be deleted.
5. Add Evidence tab to material pages and research/public export endpoints.

---

## 13. Expected outcomes

- Consistent, auditable data intake that scales with volunteers.
- Parameter values traceable to specific passages, figures, and formulas.
- Reproducible public and research exports with explicit method/version metadata.
- A durable foundation for weight calibration, sensitivity analysis, and region-specific modeling—without altering public simplicity.
