# Source Management Schema Documentation

**Last Updated:** November 12, 2025  
**Status:** Complete  
**Related:** `/types/material.ts`, `/data/sources.ts`, `/docs/SOURCE_TRACEABILITY.md`

---

## Overview

WasteDB uses a comprehensive source citation system to ensure every scientific parameter is traceable to academic literature. This document defines the **Source schema** used throughout the application.

---

## Source Interface Definition

### Primary Source Interface (`/types/material.ts`)

Used for **material-specific source citations** (attached to individual materials):

```typescript
export interface Source {
  title: string; // REQUIRED - Full title of the source
  authors?: string; // Optional - Author(s) name(s)
  year?: number; // Optional - Publication year
  doi?: string; // Optional - Digital Object Identifier
  url?: string; // Optional - Direct URL to source
  weight?: number; // Optional - Source quality weight (0-1)
  parameters?: string[]; // Optional - Parameters this source supports
  pdfFileName?: string; // Optional - Uploaded PDF filename in Supabase Storage
}
```

### Library Source Interface (`/data/sources.ts`)

Used for **global source library** (shared across materials):

```typescript
export interface Source {
  id: string; // REQUIRED - Unique identifier
  title: string; // REQUIRED - Full title of the source
  authors?: string; // Optional - Author(s) name(s)
  year?: number; // Optional - Publication year
  doi?: string; // Optional - Digital Object Identifier
  url?: string; // Optional - Direct URL to source
  weight?: number; // Optional - Source quality weight (0-1)
  type: "peer-reviewed" | "government" | "industrial" | "ngo" | "internal";
  abstract?: string; // Optional - Source abstract/summary
  tags?: string[]; // Optional - Material/topic tags for search
}
```

---

## Field Specifications

### Required Fields

#### `title` (string)

- **Purpose:** Full, official title of the academic source
- **Format:** Title case, complete with subtitle if applicable
- **Example:** `"Life Cycle Assessment of Aluminum Recycling in North America"`
- **Validation:** Must not be empty
- **Best Practice:** Copy exact title from source to ensure searchability

#### `id` (string) - Library sources only

- **Purpose:** Unique identifier within the source library
- **Format:** Kebab-case, descriptive
- **Example:** `"aluminum-recycling-lca-2023"`
- **Validation:** Must be unique across SOURCE_LIBRARY
- **Best Practice:** Use format `{material}-{topic}-{year}`

#### `type` (enum) - Library sources only

- **Purpose:** Categorize source for weight calculation
- **Options:**
  - `'peer-reviewed'` - Academic journal articles (weight: 1.0)
  - `'government'` - Government/international reports (weight: 0.9)
  - `'industrial'` - Industry LCA studies (weight: 0.7)
  - `'ngo'` - NGO/nonprofit publications (weight: 0.6)
  - `'internal'` - Internal/unpublished data (weight: 0.3)
- **Validation:** Must be one of the specified enum values
- **Best Practice:** Choose most specific applicable category

### Optional Fields

#### `authors` (string)

- **Purpose:** Credit original researchers
- **Format:** `"LastName, F., LastName, F., et al."`
- **Example:** `"Smith, J., Jones, A., Brown, K."`
- **Best Practice:**
  - List up to 3 authors, then "et al." if more
  - Use consistent formatting across sources
  - Include institutional authors if no individuals listed

#### `year` (number)

- **Purpose:** Establish recency and relevance
- **Format:** Four-digit year (YYYY)
- **Example:** `2023`
- **Validation:** Must be between 1900 and current year + 1
- **Best Practice:** Use publication year, not accessed date

#### `doi` (string)

- **Purpose:** Permanent identifier for academic verification
- **Format:** DOI string without `https://doi.org/` prefix
- **Example:** `"10.1016/j.resconrec.2023.106789"`
- **Validation:** Should match DOI pattern `10.\d{4,}/.*`
- **Best Practice:**
  - Prefer DOI over URL when both available
  - Validate DOI resolves before saving
  - Strip `https://doi.org/` prefix for storage

#### `url` (string)

- **Purpose:** Direct access to source when DOI unavailable
- **Format:** Full HTTP/HTTPS URL
- **Example:** `"https://www.epa.gov/sites/default/files/2023-report.pdf"`
- **Validation:** Must be valid URL format
- **Best Practice:**
  - Use persistent URLs (avoid bit.ly, tinyurl)
  - Prefer institutional repositories over personal websites
  - Check URL accessibility before saving
  - Use DOI-based URL if DOI exists: `https://doi.org/{doi}`

#### `weight` (number)

- **Purpose:** Quality/relevance score for weighted averaging
- **Format:** Decimal between 0.0 and 1.0
- **Example:** `0.85`
- **Validation:** `0.0 ≤ weight ≤ 1.0`
- **Calculation (Auto-assigned):**
  ```typescript
  Peer-reviewed journal:        1.0
  Government/international:     0.9
  Industry LCA study:           0.7
  NGO/nonprofit report:         0.6
  Internal/unpublished:         0.3
  ```
- **Best Practice:**
  - System auto-assigns based on `type` if not specified
  - Can manually adjust for exceptional quality/relevance
  - Document reason for manual weight adjustments

#### `parameters` (string[])

- **Purpose:** Map source to specific data points it supports
- **Format:** Array of parameter keys
- **Example:** `["Y_value", "D_value", "CR_practical_mean"]`
- **Valid Values:** Any combination of:
  - **CR Parameters:** `Y_value`, `D_value`, `C_value`, `M_value`, `E_value`
  - **CC Parameters:** `B_value`, `N_value`, `T_value`, `H_value`, `M_value`
  - **RU Parameters:** `L_value`, `R_value`, `U_value`, `C_RU_value`, `M_value`
  - **Composite Scores:** `CR_practical_mean`, `CR_theoretical_mean`, `CC_practical_mean`, `CC_theoretical_mean`, `RU_practical_mean`, `RU_theoretical_mean`
  - **Confidence Intervals:** `CR_practical_CI95_lower`, `CR_practical_CI95_upper`, etc.
- **Best Practice:**
  - Be specific - list only parameters directly supported
  - Include both raw parameters and derived scores if applicable
  - Add composite scores when source provides final CR/CC/RU values

#### `pdfFileName` (string) - Material sources only

- **Purpose:** Link to uploaded PDF in Supabase Storage
- **Format:** Filename with extension
- **Example:** `"aluminum-recycling-lca-2023.pdf"`
- **Storage Path:** `make-17cae920-sources/{materialId}/{pdfFileName}`
- **Best Practice:**
  - Use descriptive, unique filenames
  - Sanitize filename (remove spaces, special chars)
  - Keep original extension (.pdf)
  - Maximum 100 characters

#### `abstract` (string) - Library sources only

- **Purpose:** Brief summary for quick reference
- **Format:** Plain text, 1-3 sentences
- **Example:** `"This study examines aluminum recycling rates across North America using LCA methodology. Results show 95% yield with 2% quality degradation. Infrastructure maturity varies by region."`
- **Best Practice:**
  - Extract from source abstract or executive summary
  - Focus on findings relevant to WasteDB parameters
  - Keep under 500 characters

#### `tags` (string[]) - Library sources only

- **Purpose:** Enable smart source matching during migration
- **Format:** Array of lowercase keywords
- **Example:** `["aluminum", "metals", "recycling", "lca", "north-america"]`
- **Tag Categories:**
  - **Materials:** Specific material names (`"aluminum"`, `"pet"`, `"cardboard"`)
  - **Categories:** Broad categories (`"metals"`, `"plastics"`, `"paper"`)
  - **Processes:** Sustainability pathways (`"recycling"`, `"composting"`, `"reuse"`)
  - **Methods:** Research methods (`"lca"`, `"field-study"`, `"modeling"`)
  - **Geography:** Regional scope (`"north-america"`, `"europe"`, `"global"`)
- **Best Practice:**
  - Include 5-15 tags per source
  - Use singular form (`"metal"` not `"metals"`)
  - Include both specific and general terms
  - Add alternative spellings (`"aluminum"` and `"aluminium"`)

---

## Usage Examples

### Example 1: Material-Specific Source (High Quality)

```typescript
{
  title: "Circular Economy Metrics for Aluminum Packaging",
  authors: "Smith, J., Johnson, A., et al.",
  year: 2023,
  doi: "10.1016/j.resconrec.2023.106789",
  url: "https://doi.org/10.1016/j.resconrec.2023.106789",
  weight: 1.0,
  parameters: [
    "Y_value",
    "D_value",
    "E_value",
    "CR_practical_mean",
    "CR_theoretical_mean"
  ]
}
```

**Characteristics:**

- ✅ Peer-reviewed journal (weight 1.0)
- ✅ Has DOI for verification
- ✅ Recent publication (2023)
- ✅ Maps to specific parameters
- ✅ Complete author attribution

### Example 2: Government Report (Medium-High Quality)

```typescript
{
  title: "Municipal Solid Waste Recycling Infrastructure Assessment 2024",
  authors: "U.S. Environmental Protection Agency",
  year: 2024,
  url: "https://www.epa.gov/sites/default/files/2024-recycling-report.pdf",
  weight: 0.9,
  parameters: [
    "M_value",
    "CR_practical_mean",
    "CC_practical_mean",
    "RU_practical_mean"
  ]
}
```

**Characteristics:**

- ✅ Government source (weight 0.9)
- ✅ Broad coverage (M_value across all dimensions)
- ⚠️ No DOI (government reports often lack them)
- ✅ Institutional author
- ✅ Maps infrastructure parameter to all pathways

### Example 3: Library Source (Full Featured)

```typescript
{
  id: "pet-recycling-contamination-2022",
  title: "Contamination Effects on PET Bottle Recycling Quality",
  authors: "Chen, L., Rodriguez, M., Kim, S.",
  year: 2022,
  doi: "10.1021/acs.est.2c05432",
  url: "https://doi.org/10.1021/acs.est.2c05432",
  weight: 1.0,
  type: "peer-reviewed",
  abstract: "Field study examining how contamination affects PET recycling yield and quality degradation. Results show 8% yield loss and 12% quality degradation at 5% contamination levels.",
  tags: [
    "pet",
    "plastic",
    "plastics",
    "recycling",
    "contamination",
    "quality",
    "yield",
    "degradation",
    "field-study"
  ]
}
```

**Characteristics:**

- ✅ Complete metadata
- ✅ Comprehensive tagging for discovery
- ✅ Abstract provides context
- ✅ Unique ID for library management
- ✅ Type specified for automatic weight assignment

### Example 4: Source with Uploaded PDF

```typescript
{
  title: "Biodegradation Rates of Common Packaging Materials",
  authors: "Green, R., White, P.",
  year: 2021,
  doi: "10.1002/bbb.2187",
  url: "https://doi.org/10.1002/bbb.2187",
  weight: 0.95,
  parameters: [
    "B_value",
    "N_value",
    "T_value",
    "CC_practical_mean"
  ],
  pdfFileName: "biodegradation-packaging-2021.pdf"
}
```

**Characteristics:**

- ✅ Has uploaded PDF for offline access
- ✅ Maps to compostability parameters
- ✅ Slightly lower weight (0.95) - manual adjustment
- ✅ DOI + PDF provides redundant access

---

## Validation Rules

### Required Field Validation

```typescript
// Title must exist and be non-empty
function validateTitle(source: Source): boolean {
  return source.title && source.title.trim().length > 0;
}

// Library sources must have ID and type
function validateLibrarySource(source: LibrarySource): boolean {
  return (
    source.id &&
    source.id.trim().length > 0 &&
    ["peer-reviewed", "government", "industrial", "ngo", "internal"].includes(
      source.type
    )
  );
}
```

### Optional Field Validation

```typescript
// Year must be reasonable if provided
function validateYear(year?: number): boolean {
  if (!year) return true; // Optional field
  const currentYear = new Date().getFullYear();
  return year >= 1900 && year <= currentYear + 1;
}

// Weight must be in valid range if provided
function validateWeight(weight?: number): boolean {
  if (!weight) return true; // Optional field
  return weight >= 0.0 && weight <= 1.0;
}

// DOI should match expected pattern if provided
function validateDOI(doi?: string): boolean {
  if (!doi) return true; // Optional field
  return /^10\.\d{4,}\/\S+$/.test(doi);
}

// URL should be valid if provided
function validateURL(url?: string): boolean {
  if (!url) return true; // Optional field
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Parameters must be valid parameter keys if provided
function validateParameters(parameters?: string[]): boolean {
  if (!parameters) return true; // Optional field
  const validParams = new Set([
    "Y_value",
    "D_value",
    "C_value",
    "M_value",
    "E_value",
    "B_value",
    "N_value",
    "T_value",
    "H_value",
    "L_value",
    "R_value",
    "U_value",
    "C_RU_value",
    "CR_practical_mean",
    "CR_theoretical_mean",
    "CC_practical_mean",
    "CC_theoretical_mean",
    "RU_practical_mean",
    "RU_theoretical_mean",
    "CR_practical_CI95_lower",
    "CR_practical_CI95_upper",
    "CC_practical_CI95_lower",
    "CC_practical_CI95_upper",
    "RU_practical_CI95_lower",
    "RU_practical_CI95_upper",
  ]);

  return parameters.every((param) => validParams.has(param));
}
```

### Complete Validation Function

```typescript
function validateSource(source: Source): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!validateTitle(source)) {
    errors.push("Title is required and must not be empty");
  }

  if (!validateYear(source.year)) {
    errors.push(
      `Year must be between 1900 and ${new Date().getFullYear() + 1}`
    );
  }

  if (!validateWeight(source.weight)) {
    errors.push("Weight must be between 0.0 and 1.0");
  }

  if (!validateDOI(source.doi)) {
    errors.push("DOI format is invalid (expected: 10.xxxx/...)");
  }

  if (!validateURL(source.url)) {
    errors.push("URL format is invalid");
  }

  if (!validateParameters(source.parameters)) {
    errors.push("Parameters array contains invalid parameter keys");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

---

## Best Practices

### For Material Sources

1. **Minimum Requirements:**

   - Always include `title`
   - Prefer `doi` over `url` when both available
   - Include at least 3 sources per material
   - Map each source to specific `parameters`

2. **Quality Standards:**

   - Use peer-reviewed sources when possible (weight ≥ 0.8)
   - Recent sources preferred (within 5 years)
   - Specific to material/category
   - Accessible (working DOI/URL)

3. **Parameter Mapping:**
   - Be specific - only list parameters directly supported
   - Cross-check: every parameter should appear in at least one source
   - Include composite scores when source provides them
   - Document shared parameters (M_value used across CR/CC/RU)

### For Library Sources

1. **Comprehensive Metadata:**

   - Always include `id`, `title`, `type`
   - Add `abstract` for context
   - Use 5-15 relevant `tags`
   - Include `authors` and `year` when available

2. **Tagging Strategy:**

   - Include material-specific tags (`"aluminum"`, `"pet"`)
   - Add category tags (`"metals"`, `"plastics"`)
   - Include process tags (`"recycling"`, `"composting"`)
   - Add methodology tags (`"lca"`, `"field-study"`)
   - Consider geographic scope (`"global"`, `"north-america"`)

3. **Maintenance:**
   - Review and update sources annually
   - Replace outdated sources (>10 years old)
   - Verify DOIs and URLs still resolve
   - Add new high-quality sources as published

### For Both

1. **Traceability:**

   - Every parameter value must trace to at least one source
   - Parameters array should cover all non-zero values
   - Confidence level should reflect source count and weights

2. **Accessibility:**

   - Prefer open-access sources when possible
   - Upload PDFs for paywalled sources (if permitted)
   - Provide alternative URLs if primary link breaks
   - Include author/year for manual lookup if DOI unavailable

3. **Documentation:**
   - Comment on unusual weight adjustments
   - Note when sources are estimates vs. measured data
   - Document regional specificity of sources
   - Track source update history

---

## Common Patterns

### Pattern 1: Single Authoritative Source

Used when one comprehensive study covers all parameters:

```typescript
{
  title: "Complete LCA of Aluminum Production and End-of-Life",
  authors: "Smith et al.",
  year: 2023,
  doi: "10.1234/complete.lca",
  weight: 1.0,
  parameters: [
    "Y_value", "D_value", "C_value", "M_value", "E_value",
    "CR_practical_mean", "CR_theoretical_mean",
    "CR_practical_CI95_lower", "CR_practical_CI95_upper"
  ]
}
```

### Pattern 2: Multiple Complementary Sources

Used when different sources cover different parameters:

```typescript
// Source 1: Recycling metrics
{
  title: "Aluminum Recycling Performance Study",
  parameters: ["Y_value", "D_value", "CR_practical_mean"]
}

// Source 2: Contamination study
{
  title: "Contamination Tolerance in Metal Recycling",
  parameters: ["C_value"]
}

// Source 3: Infrastructure report
{
  title: "North American Recycling Infrastructure",
  parameters: ["M_value"]
}

// Source 4: Energy analysis
{
  title: "Energy Requirements for Aluminum Recycling",
  parameters: ["E_value"]
}
```

### Pattern 3: Dimension-Specific Sources

Used when materials have distinct sources per pathway:

```typescript
// CR-specific source
{
  title: "Aluminum Recycling Analysis",
  parameters: ["Y_value", "D_value", "C_value", "M_value", "E_value"]
}

// CC-specific source (minimal for metals)
{
  title: "Biodegradation of Inorganic Materials",
  parameters: ["B_value", "N_value", "T_value", "H_value"]
}

// RU-specific source
{
  title: "Durability and Reuse Potential of Aluminum Products",
  parameters: ["L_value", "R_value", "U_value", "C_RU_value"]
}
```

---

## Integration with WasteDB

### Data Flow

```
Source Library (sources.ts)
    ↓
Material Migration
    ↓
Material.sources[] (material-specific citations)
    ↓
Scientific Data Editor (add/edit/delete)
    ↓
Supabase KV Store
    ↓
Material Card (display sources)
    ↓
Export (CSV/JSON with full citations)
```

### Component Usage

**Source Library Manager:**

- Browse global source library
- Add/edit/delete library sources
- View which materials use each source
- Upload PDF files to Supabase Storage

**Scientific Data Editor:**

- Add material-specific sources
- Map sources to parameters
- Auto-suggest sources from library
- Validate source coverage

**Material Card:**

- Display source count badge
- Show source details on click
- Link to DOI/URL for verification
- Display parameters each source supports

**Export:**

- Include full source metadata in CSV
- Provide sources as JSON array
- Enable citation in research papers
- Support reproducibility

---

## Related Documentation

- **`/docs/SOURCE_TRACEABILITY.md`** - Philosophy and workflow
- **`/types/material.ts`** - TypeScript definitions
- **`/data/sources.ts`** - Global source library
- **`/docs/SOURCE_LIBRARY_MANAGER_PRODUCTION.md`** - UI guide
- **`/data/README.md`** - Source library overview
- **`/data/SOURCE_SELECTION_EXAMPLES.md`** - Tagging examples

---

## Migration & Updates

### Adding a New Source to Library

```typescript
// 1. Create source object
const newSource: Source = {
  id: "new-material-study-2025",
  title: "New Material Sustainability Study",
  authors: "Researcher, A., et al.",
  year: 2025,
  doi: "10.1234/new.study",
  url: "https://doi.org/10.1234/new.study",
  weight: 1.0,
  type: "peer-reviewed",
  abstract: "Brief summary of findings...",
  tags: ["material-name", "category", "process", "method"],
};

// 2. Add to SOURCE_LIBRARY in /data/sources.ts
export const SOURCE_LIBRARY: Source[] = [
  // ... existing sources
  newSource,
];

// 3. Use in migration or manual assignment
```

### Updating Existing Source

```typescript
// Find source by ID
const source = SOURCE_LIBRARY.find(
  (s) => s.id === "aluminum-recycling-lca-2023"
);

// Update fields
if (source) {
  source.url = "https://new-url.com/paper.pdf";
  source.pdfFileName = "new-file.pdf";
  source.tags.push("new-tag");
}
```

### Removing Outdated Source

```typescript
// 1. Check if any materials use this source
const materialsUsingSource = materials.filter((m) =>
  m.sources?.some((s) => s.title === "Outdated Study")
);

// 2. If used, replace with newer source first
materialsUsingSource.forEach((material) => {
  material.sources = material.sources?.map((s) =>
    s.title === "Outdated Study" ? newSource : s
  );
});

// 3. Remove from library
export const SOURCE_LIBRARY = SOURCE_LIBRARY.filter(
  (s) => s.id !== "outdated-study-2015"
);
```

---

## Summary

The Source schema in WasteDB ensures:

- ✅ **Traceability** - Every parameter traces to academic literature
- ✅ **Quality** - Weighted sources reflect reliability
- ✅ **Accessibility** - DOIs and URLs enable verification
- ✅ **Flexibility** - Multiple sources support different parameters
- ✅ **Transparency** - Parameter mapping is explicit
- ✅ **Reproducibility** - Full metadata enables citation

**Key Principles:**

1. **Title is required** - Everything else enhances discoverability
2. **DOI preferred** - Most reliable permanent identifier
3. **Parameters are explicit** - No ambiguity about what source supports
4. **Weight reflects quality** - Peer-reviewed > government > industry > NGO
5. **Tags enable discovery** - Library sources need good tagging
6. **Validation ensures quality** - Schema enforcement prevents bad data

This schema is the foundation of WasteDB's scientific credibility.

---

**Last Updated:** November 12, 2025  
**Status:** Production  
**Version:** 2025.1
