# LLM Paper Triage Prompt

**Last Updated:** January 7, 2026  
**Version:** 1.0

This prompt is designed for **Stage 1: Discovery/Filtering** in the MIU extraction workflow. Use this with Semantic Scholar, Elicit, or similar tools to quickly assess whether a paper is worth deeper investigation.

---

## Purpose

LLMs excel at pattern recognition and classification but fail at forensic data extraction. This prompt leverages their strength (triage) while avoiding their weakness (citation accuracy).

**Use this to:**

- Filter search results from Semantic Scholar / Elicit / Google Scholar
- Prioritize which papers to manually review
- Save time by ruling out irrelevant or inaccessible papers

**Do NOT use this to:**

- Extract actual MIU values
- Report citations or quotes
- Make final acceptance decisions

---

## Triage Prompt

```
You are a research assistant helping to filter academic papers for a materials sustainability database. Your job is to assess **likelihood only** — you will NOT extract data, citations, or quotes.

## INPUT

**Material:** [e.g., PET, HDPE, Cardboard]
**Parameter:** [Y / D / C / M / E]
**Paper Title:** [paste title]
**Paper Abstract:** [paste abstract if available]
**DOI/URL:** [paste if available]

---

## PARAMETER DEFINITIONS

- **Y (Yield):** Mechanical recycling recovery rates, fiber yields, mass balances
- **D (Degradability):** Weight loss over time, half-life, mineralization rates in soil/marine environments
- **C (Compostability):** Disintegration %, biodegradation under ISO 14855/ISO 20200 composting conditions
- **M (Methane):** BMP (Biochemical Methane Potential), landfill gas generation, anaerobic digestion
- **E (Ecotoxicity):** LC50, EC50, leachate toxicity, microplastic toxicity endpoints

---

## YOUR TASK

Assess the **probability** that this paper contains a **quantitative, experimentally measured value** for the specified parameter.

Answer these questions:

### 1. Relevance Probability
Does the abstract/title suggest this paper directly measures or reports quantitative data for the specified parameter?

**Answer:** [HIGH / MEDIUM / LOW / NOT RELEVANT]

### 2. Data Type Signal
Based on the abstract, what type of value is most likely reported (if any)?

**Answer:** [MEASURED / CALCULATED / ESTIMATED / QUALITATIVE ONLY / UNCLEAR]

### 3. Access Likelihood
Can you determine if this is Open Access?

**Answer:** [DEFINITELY OA / PROBABLY OA / PROBABLY PAYWALLED / UNCLEAR]

Signals of OA:
- Publisher is MDPI, Frontiers, PLOS, Nature Communications, Scientific Reports
- "Open Access" label visible
- Free PDF link available
- Hosted on PubMed Central, Zenodo, arXiv, ChemRxiv

### 4. Value Specificity Signal
Does the abstract mention specific numeric ranges, units, or experimental methods consistent with the parameter?

Examples:
- Y: "recovery rate of 87%", "yield 0.92 kg/kg"
- D: "weight loss of 12% after 90 days", "half-life 450 years"
- C: "biodegradation 3.2% after 180 days", "disintegration per ISO 20200"
- M: "BMP of 245 mL CH4/g VS", "methane yield 0.15 m³/kg"
- E: "LC50 = 1.2 mg/L", "EC50 = 450 particles/mL"

**Answer:** [YES - specific numeric signal / VAGUE - qualitative only / NO - unrelated]

### 5. Exclusion Flags
Check for any of these red flags:

- [ ] Review/survey paper (no original data)
- [ ] Modeling/simulation only (no experimental validation)
- [ ] Different material (not the target material)
- [ ] Different parameter (measures something else)
- [ ] No abstract available (cannot assess)

### 6. Triage Recommendation

Based on the above, how should this paper be prioritized?

**Recommendation:** [PRIORITY / INVESTIGATE / SKIP]

- **PRIORITY:** HIGH relevance + OA + numeric signal → manual review recommended
- **INVESTIGATE:** MEDIUM relevance OR unclear access → check if accessible before deep review
- **SKIP:** LOW relevance OR definitely paywalled OR major exclusion flags

---

## IMPORTANT RULES

- **DO NOT** report actual numbers, citations, or author names
- **DO NOT** claim to have read the full text
- **DO NOT** make up details — say "UNCLEAR" when uncertain
- **DO** be conservative — when in doubt, recommend "INVESTIGATE"

---

## OUTPUT FORMAT

```

**Material:** [material]
**Parameter:** [parameter code]
**Paper Title:** [title]

**Triage Assessment:**

1. Relevance Probability: [HIGH/MEDIUM/LOW/NOT RELEVANT]
2. Data Type Signal: [MEASURED/CALCULATED/ESTIMATED/QUALITATIVE/UNCLEAR]
3. Access Likelihood: [DEFINITELY OA/PROBABLY OA/PROBABLY PAYWALLED/UNCLEAR]
4. Value Specificity Signal: [YES/VAGUE/NO]
5. Exclusion Flags: [list any checked flags, or "None"]

**Recommendation:** [PRIORITY/INVESTIGATE/SKIP]

**Reasoning:** [1-2 sentence justification]

```

```

---

## Usage Workflow

### Step 1: Run Semantic Scholar / Elicit Search

Search for papers related to your material + parameter:

- "PET mechanical recycling yield"
- "PET biodegradation rate soil"
- "PET microplastic ecotoxicity LC50"

### Step 2: Batch Triage

For each result (or top 20 results):

1. Copy title + abstract + DOI into triage prompt
2. Get triage recommendation
3. Sort results: PRIORITY → INVESTIGATE → SKIP

### Step 3: Manual Access Check

For PRIORITY papers:

1. Click DOI or provided URL
2. Confirm full text is accessible
3. If accessible → proceed to full MIU extraction prompt
4. If paywalled → downgrade to INVESTIGATE or SKIP

### Step 4: Full Extraction

Use the full MIU extraction prompt (from `LLM_MIU_EXTRACTION_PROMPTS.md`) only for papers that pass triage + access check.

---

## Example Triage (PET Yield)

**Input:**

- Material: PET
- Parameter: Y (Yield)
- Title: "Life cycle assessment of mechanical and chemical recycling of post-consumer PET bottles"
- Abstract: "...mechanical recycling achieved material recovery rates between 82-91% across three facilities..."

**Output:**

```
**Material:** PET
**Parameter:** Y (Yield)
**Paper Title:** Life cycle assessment of mechanical and chemical recycling of post-consumer PET bottles

**Triage Assessment:**
1. Relevance Probability: HIGH
2. Data Type Signal: MEASURED
3. Access Likelihood: PROBABLY PAYWALLED (no OA signal)
4. Value Specificity Signal: YES (82-91% recovery rate)
5. Exclusion Flags: None

**Recommendation:** INVESTIGATE

**Reasoning:** Abstract explicitly mentions quantitative recovery rates (82-91%) for mechanical recycling, which is exactly parameter Y. However, no OA signal detected. Worth checking access before committing to deep review.
```

---

## Example Triage (PET Compostability - Negative Case)

**Input:**

- Material: PET
- Parameter: C (Compostability)
- Title: "Review of polymer biodegradation in soil environments"
- Abstract: "...various polymers including PET, PE, and PP show limited biodegradation in soil..."

**Output:**

```
**Material:** PET
**Parameter:** C (Compostability)
**Paper Title:** Review of polymer biodegradation in soil environments

**Triage Assessment:**
1. Relevance Probability: LOW
2. Data Type Signal: QUALITATIVE ONLY
3. Access Likelihood: UNCLEAR
4. Value Specificity Signal: VAGUE
5. Exclusion Flags: [X] Review/survey paper (no original data)

**Recommendation:** SKIP

**Reasoning:** This is a review paper with qualitative assessment ("limited biodegradation") rather than quantitative compostability measurements. Unlikely to contain a specific % biodegradation value needed for MIU.
```

---

## Integration with Extraction Workflow

```
┌─────────────────────────────────────────┐
│  Semantic Scholar / Elicit Search       │
│  "PET + [parameter]"                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  TRIAGE PROMPT (this document)          │
│  Filter 20+ papers → 3-5 PRIORITY       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Manual Access Check                    │
│  Confirm full text available            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  EXTRACTION PROMPT                      │
│  (LLM_MIU_EXTRACTION_PROMPTS.md)        │
│  Full citation + value extraction       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  VERIFICATION PROMPT                    │
│  (LLM_MIU_EXTRACTION_PROMPTS.md)        │
│  10-point quality check                 │
└──────────────┬──────────────────────────┘
               │
               ▼
        [Accept MIU into DB]
```

---

## Tooling Recommendations

Based on research-focused LLM tool analysis (Jan 2026):

### Free Tier (Start Here)

1. **Semantic Scholar** - Best OA discovery, free API, excellent metadata
2. **Elicit** - Free tier for structured paper search
3. **Google Scholar** - Backup for older/obscure papers

### Paid Tier (If Budget Allows)

1. **Elicit Pro** (~$10-20/mo) - Enhanced semantic search
2. **Scite** (~$20-40/mo) - Citation context analysis (useful post-extraction)

### Institutional Access (If Available)

1. **Scopus** - Gold standard for closed journals, requires license
2. **Web of Science** - Curated high-quality index, requires license

---

## Key Principle

**Triage is cheap. Extraction is expensive. Verification is critical.**

Use LLMs to narrow 100 papers → 5 papers.  
Use humans to extract 5 papers → 3 valid MIUs.  
Use verification prompts to ensure 3 MIUs → 3 database entries.

---

## Version History

- **v1.0** (Jan 7, 2026): Initial triage prompt based on two-stage workflow recommendations
