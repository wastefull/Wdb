# MIU Curation Guide for Phase 9.2 Pilot

**Last Updated:** January 5, 2026

This guide walks you through the process of extracting MIUs (Minimum Interpretable Units) from scientific literature using the Curation Workbench. Our pilot focuses on **PET (Polyethylene Terephthalate)** with a target of **9 MIUs**.

---

## What is an MIU?

An MIU is an atomic unit of scientific evidence. Each MIU captures a single data point from a source document with full traceability. Think of it as a "citation + value + context" bundle that can be audited back to the original source.

---

## Getting Started

### 1. Access the Curation Workbench

1. Navigate to WasteDB (locally: `http://localhost:5173`)
2. Log in with your credentials
3. From the main navigation, go to **Evidence Pipeline** → **Curation Workbench**

### 2. Understand the CR Parameters

For Phase 9.2, we're extracting data for these 5 parameters:

| Code  | Name               | Description                        | Example Units  |
| ----- | ------------------ | ---------------------------------- | -------------- |
| **Y** | Yield              | Material/fiber recovery rate       | %, kg/kg       |
| **D** | Degradability      | Rate of material breakdown         | %, days, score |
| **C** | Compostability     | Breakdown in composting conditions | %, score       |
| **M** | Methane Production | Gas generation potential           | L/kg, m³/ton   |
| **E** | Ecotoxicity        | Environmental impact measures      | mg/L, score    |

---

## Step-by-Step Curation Process

### Step 1: Select a Source

1. The left panel shows available sources from our Source Library
2. Look for sources with a **green unlock icon** (🔓) - these are Open Access
3. Sources with **PDF** badges have full-text PDFs available for inline viewing
4. Click on a source to select it

**Tip:** Prioritize sources that have PDFs uploaded - the keyword scanning feature only works with PDFs.

---

### Step 2: Choose Material

1. Select **PET** (or the appropriate pilot material variant)
2. The system filters to show only pilot materials: PET, HDPE, Cardboard, Paper, Glass

---

### Step 3: Pick Parameter

1. Select the parameter you're extracting (Y, D, C, M, or E)
2. Read the description to ensure you understand what data to look for

---

### Step 4: Extract Value (The Main Work!)

This is where the PDF viewer and keyword scanning help you find relevant passages.

#### Using the Keyword Scanner

1. In the PDF viewer area, find the **"Find Relevant Passages"** section
2. Select the parameter you're looking for from the dropdown
3. Click **"Scan PDF"**
4. The system will search for parameter-specific keywords and show matches

#### Navigating Results

- Results appear in a collapsible **"Keyword Matches"** panel
- Matches are grouped by page number
- Click **"Go →"** to jump to a specific page
- Click on individual match snippets to navigate directly
- **Matching text will be highlighted in green** on the page

#### Selecting Text for Your MIU

1. Once you find a relevant passage, **click and drag** to select the text
2. The selected text automatically fills the **Snippet** field
3. The page number is auto-recorded

#### Fill in the Value Fields

- **Raw Value**: The numeric value exactly as it appears (e.g., "85.3")
- **Raw Unit**: The unit exactly as written (e.g., "%", "kg/ton", "days")
- **Page Number**: Auto-filled when you select text
- **Figure/Table Number**: If the value comes from a figure or table, note it (e.g., "Table 2", "Fig. 3")

---

### Step 5: Add Metadata

1. **Confidence Level**: Rate your confidence in the extraction

   - **High**: Clear, unambiguous value with explicit context
   - **Medium**: Value is clear but requires some interpretation
   - **Low**: Value is inferred or context is unclear

2. **Notes**: Add any relevant context, such as:
   - Experimental conditions
   - Sample preparation methods
   - Any assumptions you made
   - Why you chose this specific value if alternatives existed

---

## Quality Guidelines

### ✅ DO

- Extract values that are **explicitly stated** in the source
- Include the **exact verbatim text** in the snippet field
- Note when values come from figures vs. tables vs. body text
- Record the **specific conditions** (temperature, time, method)
- Flag any uncertainty in the notes field

### ❌ DON'T

- Calculate or derive values yourself
- Round or modify the original values
- Skip the snippet - it's required for audit
- Assume units if they're not explicitly stated
- Extract from abstracts if the full text has more detail

---

## Parameter-Specific Tips

### Y - Yield

Look for: "recovery rate", "fiber yield", "material recovery", "output", "efficiency"
Common contexts: Recycling processes, fiber extraction, material separation

### D - Degradability

Look for: "degradation", "breakdown", "half-life", "decomposition", "weight loss"
Common contexts: Environmental fate studies, composting trials, marine degradation

### C - Compostability

Look for: "compost", "maturity", "stability", "C/N ratio", "germination"
Common contexts: Industrial composting, home composting, certification studies

### M - Methane Production

Look for: "methane", "biogas", "CH4", "anaerobic", "BMP" (biochemical methane potential)
Common contexts: Landfill studies, anaerobic digestion, waste treatment

### E - Ecotoxicity

Look for: "toxicity", "LC50", "EC50", "leachate", "microplastic", "environmental impact"
Common contexts: Aquatic toxicity tests, soil studies, life cycle assessments

---

## Confidence Level Examples by Parameter

Understanding when to assign High, Medium, or Low confidence is critical for data quality. Below are realistic examples for each parameter.

### Y - Yield

**High Confidence:**

> "The mechanical recycling process achieved a PET flake recovery rate of 92.3% ± 1.2% (n=5 trials) at the pilot plant scale."

- ✅ Explicit value with error bounds
- ✅ Clear material (PET flakes)
- ✅ Defined process (mechanical recycling)
- ✅ Sample size reported

**Medium Confidence:**

> "Recovery rates for the tested polymers ranged from 85-95%, with PET showing the highest yields."

- ⚠️ Range given, not a specific value
- ⚠️ "Highest" is relative - actual PET value unclear
- ✅ Material is specified

**Low Confidence:**

> "The recycling efficiency was satisfactory, with most material being recovered."

- ❌ No numeric value
- ❌ "Satisfactory" and "most" are subjective
- ❌ Would need to infer a value from context

---

### D - Degradability

**High Confidence:**

> "PET films (50 μm thickness) showed 0.3% weight loss after 12 months of soil burial at 25°C and 60% relative humidity."

- ✅ Specific value (0.3%)
- ✅ Clear timeframe (12 months)
- ✅ Conditions specified (temp, humidity, soil)
- ✅ Material specification (film thickness)

**Medium Confidence:**

> "Degradation of PET in marine environments is estimated at 450-1000 years based on extrapolation from accelerated weathering studies."

- ⚠️ Wide range
- ⚠️ Extrapolated, not directly measured
- ✅ Environment specified (marine)

**Low Confidence:**

> "PET is known to persist in the environment for centuries."

- ❌ No specific timeframe
- ❌ "Centuries" is vague
- ❌ No experimental basis cited

---

### C - Compostability

**High Confidence:**

> "Under industrial composting conditions (58°C, 50% moisture), the PLA-PET blend achieved 90% disintegration within 84 days per EN 13432 standards."

- ✅ Specific percentage and timeframe
- ✅ Standard method cited (EN 13432)
- ✅ Conditions explicit
- ⚠️ Note: This is a blend, not pure PET

**Medium Confidence:**

> "The material passed visual disintegration requirements but showed limited biodegradation in the 6-month composting trial."

- ⚠️ "Limited" is qualitative
- ⚠️ Disintegration ≠ biodegradation
- ✅ Timeframe given

**Low Confidence:**

> "Conventional PET is not compostable."

- ❌ No quantitative data
- ❌ Binary statement without test conditions
- ❌ May be accurate but not extractable as MIU

---

### M - Methane Production

**High Confidence:**

> "Biochemical methane potential (BMP) testing of PET packaging yielded 2.3 ± 0.4 mL CH4/g VS over 60 days at 37°C under anaerobic conditions."

- ✅ Specific value with error
- ✅ Standard test (BMP)
- ✅ Units, duration, and conditions clear

**Medium Confidence:**

> "Methane generation from landfilled PET was negligible compared to food waste, contributing less than 1% of total biogas production."

- ⚠️ Relative comparison, not absolute value
- ⚠️ "Less than 1%" is a bound, not a measurement
- ✅ Context is clear (landfill)

**Low Confidence:**

> "PET does not significantly contribute to landfill gas generation."

- ❌ No numeric value
- ❌ "Significantly" is subjective
- ❌ Cannot extract a quantitative MIU

---

### E - Ecotoxicity

**High Confidence:**

> "Leachate from aged PET microplastics showed an LC50 of 2,450 mg/L for Daphnia magna after 48-hour exposure (OECD 202)."

- ✅ Specific LC50 value
- ✅ Test organism specified
- ✅ Standard method (OECD 202)
- ✅ Exposure duration clear

**Medium Confidence:**

> "PET microplastics in the 1-5 mm size range showed moderate toxicity to marine invertebrates at concentrations above 100 mg/L."

- ⚠️ "Moderate toxicity" is qualitative
- ⚠️ Threshold given but no specific endpoint
- ✅ Size range and concentration noted

**Low Confidence:**

> "Microplastic pollution from PET poses risks to aquatic ecosystems."

- ❌ No quantitative data
- ❌ General statement
- ❌ Not extractable as MIU

---

## Summary: Confidence Decision Tree

```
Is there a specific numeric value?
├── NO → Low Confidence (or not extractable)
└── YES → Continue...
    │
    Are units explicitly stated?
    ├── NO → Low Confidence
    └── YES → Continue...
        │
        Are conditions/methods specified?
        ├── NO → Medium Confidence
        └── YES → Continue...
            │
            Is error/uncertainty reported?
            ├── NO → Medium Confidence
            └── YES → High Confidence
```

---

## Target MIUs for PET Pilot

Extract **9 MIUs** across the parameters. Suggested distribution:

| Parameter          | Target Count | Notes                             |
| ------------------ | ------------ | --------------------------------- |
| Y (Yield)          | 2            | Focus on recycling recovery rates |
| D (Degradability)  | 2            | Environmental breakdown times     |
| C (Compostability) | 1            | Limited data expected for PET     |
| M (Methane)        | 2            | Landfill/anaerobic scenarios      |
| E (Ecotoxicity)    | 2            | Microplastic/leachate impacts     |

---

## Troubleshooting

### PDF not loading?

- Check if the source has a PDF uploaded (look for PDF badge)
- Try refreshing the page
- Check browser console for errors

### No keyword matches found?

- Try a different parameter
- The PDF may not contain relevant data for that parameter
- Manual reading may be needed for some sources

### Text selection not working?

- Make sure you're clicking directly on the text
- Try zooming in for better precision
- Some scanned PDFs may have poor text layers

---

## Questions?

Reach out to the WasteDB team if you:

- Find conflicting values in the same source
- Are unsure how to categorize a parameter
- Encounter technical issues with the workbench
- Need access to additional sources

Happy curating! 🔬📊
