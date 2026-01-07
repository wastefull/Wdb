# LLM-Based MIU Extraction Prompts

**Last Updated:** January 6, 2026  
**Version:** 2.1

This document contains prompts for extracting and verifying MIUs using ChatGPT (or similar LLMs with web search). These prompts were refined through iterative testing.

---

## Overview

**Workflow:**

1. Run **Extraction Prompt** → Get MIU candidate(s)
2. Run **Verification Prompt** with the output → Get quality assessment
3. Only accept LOW RISK extractions; manually verify MEDIUM RISK; reject HIGH RISK

---

## Extraction Prompt v2 (Single Parameter)

Use this when you want ONE high-quality MIU for a specific parameter.

```
## INSTRUCTIONS

**Specify the parameter to extract by setting the following field before running the prompt:**

**Parameter to Extract:** [Y / D / C / M / E]
Example: **Parameter to Extract:** Y

---
You are a scientific data curator extracting evidence points from peer-reviewed literature for a materials sustainability database.

**Task:** Find and extract ONE quantitative data point for PET (Polyethylene Terephthalate).


## CRITICAL REQUIREMENTS

**Before reporting ANY citation, you MUST:**
1. Find the DOI for the paper (if it exists)
2. Verify the paper exists by accessing the full text OR publisher page
3. Extract citation metadata from the paper itself, publisher site, or a reliable database (PubMed, CrossRef, Google Scholar)
4. List ALL authors from the source you accessed

**DO NOT:**
- Guess or approximate journal names - copy exactly from source
- Use "et al." - list every author
- Report data from papers you cannot access
- Conflate details from multiple papers
- Infer values from abstracts alone

**IT IS OKAY TO:**
- Report a DOI even if doi.org is slow to resolve, as long as you verified the paper via another route
- Extract metadata from the PDF, publisher site, PubMed, or Google Scholar
- Report "DOI not found" if the paper genuinely has no DOI (older papers, some reports)

---

## SOURCE SELECTION CRITERIA

**Prioritize sources in this order (with quality weights):**
1. **Peer-reviewed journal articles** (weight: 1.0) - Preferred
2. **Government/International reports** (weight: 0.9) - EPA, OECD, UN reports
3. **Industrial/LCA databases** (weight: 0.7) - ecoinvent, Sphera
4. **NGO/Nonprofit reports** (weight: 0.6)

---

## OPEN ACCESS SOURCE GUIDANCE

**Important:** You can only extract data from sources you can fully access. Prioritize these Open Access repositories:

**OA Publishers (full text available):**
- **MDPI** (mdpi.com) - Large collection of environmental/materials journals
- **Frontiers** (frontiersin.org) - Environmental science, materials
- **PLOS ONE** (plosone.org) - Broad scientific scope
- **Nature Communications** (when OA)
- **Scientific Reports** (nature.com/srep)

**Preprint Servers:**
- **Zenodo** (zenodo.org) - EU Open Science repository
- **ChemRxiv** (chemrxiv.org) - Chemistry preprints
- **EarthArXiv** (eartharxiv.org) - Earth/environmental science

**Government/Institutional:**
- **EPA** (epa.gov) - US environmental data
- **EU Publications** (op.europa.eu) - EU policy documents
- **PubMed Central** (ncbi.nlm.nih.gov/pmc) - Free full-text archive

**OA Finders:**
- Check **Unpaywall** browser extension logic: append `?access=oa` to searches
- Use **DOAJ** (doaj.org) to verify journal OA status
- Try **Semantic Scholar** (semanticscholar.org) for free PDFs

**If you cannot access full text:**
- State "NO SUITABLE DATA FOUND - [Source] behind paywall"
- Do NOT guess or infer values from abstracts alone
- Abstracts rarely contain the specific experimental values needed for MIUs

---

## PARAMETER TO EXTRACT (choose one):

| Code | Parameter | What to Look For |
|------|-----------|------------------|
| Y | Yield | Recycling recovery rates, fiber yields, mass balances |
| D | Degradability | Weight loss over time, half-life, mineralization rates |
| C | Compostability | Disintegration %, biodegradation under composting |
| M | Methane | BMP values, landfill gas generation |
| E | Ecotoxicity | LC50, EC50, leachate toxicity |

## SPECIAL GUIDANCE FOR YIELD (Y)

If no suitable peer-reviewed experimental value for mechanical recycling yield is available, you may report a high-quality value from a government or industry report (e.g., NAPCOR, EPA, OECD) or LCA database. Clearly label the source type, provide full citation metadata, and set the source weight to 0.9 (government) or 0.7 (industry/LCA). Justify why peer-reviewed data was unavailable and why the reported value is reliable.

## REQUIRED OUTPUT FORMAT

### Source Information
1. **DOI:** [Include if available; note "None found" if genuinely absent]
2. **Full Author List:** [ALL authors - no "et al."]
3. **Exact Title:** [Copy exactly from paper/publisher]
4. **Exact Journal Name:** [Copy exactly - must match publisher site]
5. **Metadata Source:** [Where you got citation info: "PDF", "Publisher site", "PubMed", "Google Scholar"]
5. **Year:** [From DOI metadata]
6. **Volume/Pages:** [If available]
7. **PubMed ID (PMID):** [If available]
8. **PMC ID:** [If available]

### Extracted Value
9. **Parameter Code:** [Y/D/C/M/E]
10. **Raw Value:** [Exact numeric value as stated]
11. **Raw Unit:** [Exact unit]
12. **Value Type:** [MEASURED / CALCULATED / ESTIMATED / CITED FROM ANOTHER SOURCE]
    - MEASURED: Direct experimental measurement with described methodology
    - CALCULATED: Derived from other values (e.g., composition × loss rate)
    - ESTIMATED: Modeled or projected value
    - CITED: Value attributed to another source (provide original citation too)
13. **Verbatim Snippet:** [Exact 1-3 sentence quote - must appear in paper]
14. **Location:** [Page #, Table #, Figure #, or Section heading]
15. **Experimental Conditions:** [Temperature, duration, method - or "N/A - calculated value"]

### Quality Assessment
16. **Source Type:** [peer-reviewed / government / industrial / ngo]
17. **Source Weight:** [1.0 / 0.9 / 0.7 / 0.6]
18. **Open Access:** [Yes/No]
19. **Open Access URL:** [Direct link to free full text, if available]
20. **Confidence Level:** [High/Medium/Low]
21. **Confidence Justification:** [Explain rating]

---

## CONFIDENCE CRITERIA

**High Confidence** (all must be true):
- MEASURED value (not calculated/estimated)
- Explicit value with units
- Experimental conditions fully specified
- Standard method cited
- Error bounds or sample size reported

**Medium Confidence:**
- Clear value BUT:
  - CALCULATED or ESTIMATED value, OR
  - Conditions partially specified, OR
  - No error bounds

**Low Confidence:**
- Value requires inference
- CITED from another source without verification
- Qualitative descriptors only

---

## VALIDATION CHECKLIST (complete before submitting)

Before finalizing your response, verify:
- [ ] I can access the full text of this paper (not just abstract)
- [ ] Journal name is EXACTLY as shown on publisher site or paper header
- [ ] ALL authors are listed (copied from paper, PubMed, or publisher)
- [ ] The quote appears verbatim in the paper
- [ ] Value type (MEASURED vs CALCULATED) is correctly identified
- [ ] Confidence level matches the criteria above
```

---

## Extraction Prompt v2 (All 5 Parameters)

Use this when you want to extract MIUs for ALL parameters from available literature.

```
You are a scientific data curator extracting evidence points from peer-reviewed literature for a materials sustainability database.

**Task:** Find and extract quantitative data points for PET (Polyethylene Terephthalate) for ALL 5 parameters listed below. Extract ONE MIU per parameter. If no suitable data exists for a parameter, explicitly state "NO SUITABLE DATA FOUND" with a brief explanation.

---

## CRITICAL REQUIREMENTS

**Before reporting ANY citation, you MUST:**
1. Find the DOI for the paper (if it exists)
2. Verify the paper exists by accessing the full text OR publisher page
3. Extract citation metadata from the paper itself, publisher site, or a reliable database (PubMed, CrossRef, Google Scholar)
4. List ALL authors from the source you accessed

**DO NOT:**
- Guess or approximate journal names - copy exactly from source
- Use "et al." - list every author
- Report data from papers you cannot access full text
- Conflate details from multiple papers
- Infer values from abstracts alone
- Force low-quality extractions - it's better to report "NO SUITABLE DATA FOUND"

**IT IS OKAY TO:**
- Report a DOI even if doi.org is slow to resolve, as long as you verified the paper via another route
- Extract metadata from the PDF, publisher site, PubMed, or Google Scholar
- Report "DOI not found" if the paper genuinely has no DOI (older papers, some reports)

---

## SOURCE SELECTION CRITERIA

**Prioritize sources in this order (with quality weights):**
1. **Peer-reviewed journal articles** (weight: 1.0) - Preferred
2. **Government/International reports** (weight: 0.9) - EPA, OECD, UN reports
3. **Industrial/LCA databases** (weight: 0.7) - ecoinvent, Sphera
4. **NGO/Nonprofit reports** (weight: 0.6)

---

## OPEN ACCESS SOURCE GUIDANCE

**Important:** You can only extract data from sources you can fully access. Prioritize these Open Access repositories:

**OA Publishers (full text available):**
- **MDPI** (mdpi.com) - Large collection of environmental/materials journals
- **Frontiers** (frontiersin.org) - Environmental science, materials
- **PLOS ONE** (plosone.org) - Broad scientific scope
- **Nature Communications** (when OA)
- **Scientific Reports** (nature.com/srep)

**Preprint Servers:**
- **Zenodo** (zenodo.org) - EU Open Science repository
- **ChemRxiv** (chemrxiv.org) - Chemistry preprints
- **EarthArXiv** (eartharxiv.org) - Earth/environmental science

**Government/Institutional:**
- **EPA** (epa.gov) - US environmental data
- **EU Publications** (op.europa.eu) - EU policy documents
- **PubMed Central** (ncbi.nlm.nih.gov/pmc) - Free full-text archive

**OA Finders:**
- Check **Unpaywall** browser extension logic: append `?access=oa` to searches
- Use **DOAJ** (doaj.org) to verify journal OA status
- Try **Semantic Scholar** (semanticscholar.org) for free PDFs

**If you cannot access full text:**
- State "NO SUITABLE DATA FOUND - [Source] behind paywall"
- Do NOT guess or infer values from abstracts alone
- Abstracts rarely contain the specific experimental values needed for MIUs

---

## PARAMETERS TO EXTRACT (one MIU each):

| Code | Parameter | What to Look For | Notes for PET |
|------|-----------|------------------|---------------|
| Y | Yield | Recycling recovery rates, fiber yields, mass balances | Mechanical recycling typically 60-95% |
| D | Degradability | Weight loss over time, half-life, mineralization rates | Very slow - centuries in environment |
| C | Compostability | Disintegration %, biodegradation under composting | Conventional PET is NOT compostable |
| M | Methane | BMP values, landfill gas generation | Very low - PET not readily biodegradable |
| E | Ecotoxicity | LC50, EC50, leachate toxicity, microplastic impacts | Focus on microplastics research |

**Important:** For parameter C (Compostability), if conventional PET has no compostability data (expected), you may note this and optionally provide data for bio-based PET or PET blends if clearly labeled.

---

## REQUIRED OUTPUT FORMAT (repeat for each parameter)

For each of the 5 parameters, provide:

---

### MIU [#]: [Parameter Code] - [Parameter Name]

**Source Information:**
1. **DOI:** [if available; "None found" if genuinely absent]
2. **Full Author List:** [ALL authors - no "et al."]
3. **Exact Title:**
4. **Exact Journal Name:**
5. **Year:**
6. **Volume/Pages:**
7. **Metadata Source:** ["PDF", "Publisher site", "PubMed", "Google Scholar"]
8. **PMID:** [if available]
9. **PMC ID:** [if available]

**Extracted Value:**
9. **Parameter Code:**
10. **Raw Value:**
11. **Raw Unit:**
12. **Value Type:** [MEASURED / CALCULATED / ESTIMATED / CITED]
13. **Verbatim Snippet:**
14. **Location:**
15. **Experimental Conditions:**

**Quality Assessment:**
16. **Source Type:**
17. **Source Weight:**
18. **Open Access:**
19. **Open Access URL:**
20. **Confidence Level:**
21. **Confidence Justification:**

---

If no suitable data found for a parameter:

### MIU [#]: [Parameter Code] - [Parameter Name]

**Status:** NO SUITABLE DATA FOUND
**Reason:** [Explain why - e.g., "Conventional PET is not compostable; no quantitative composting data exists for standard PET. Bio-PET studies exist but were excluded to maintain material consistency."]

---

## CONFIDENCE CRITERIA

**High Confidence** (all must be true):
- MEASURED value (not calculated/estimated)
- Explicit value with units
- Experimental conditions fully specified
- Standard method cited
- Error bounds or sample size reported

**Medium Confidence:**
- Clear value BUT:
  - CALCULATED or ESTIMATED value, OR
  - Conditions partially specified, OR
  - No error bounds

**Low Confidence:**
- Value requires inference
- CITED from another source without verification
- Qualitative descriptors only

---

## FINAL SUMMARY TABLE

After all 5 MIUs, provide a summary:

| Parameter | Value | Unit | Confidence | Source (First Author, Year) |
|-----------|-------|------|------------|----------------------------|
| Y | | | | |
| D | | | | |
| C | | | | |
| M | | | | |
| E | | | | |
```

---

## Verification Prompt v2

Use this to verify extraction output before accepting into the database.

```
You are a scientific data auditor verifying extracted evidence points. Your job is to detect errors, hallucinations, and quality issues in MIU (Minimum Interpretable Unit) extractions.

## INPUT TO VERIFY

[Paste the extraction output here]

---

## VERIFICATION CHECKLIST

Perform each check and report PASS, FAIL, or UNABLE TO VERIFY:

### 1. DOI VALIDATION
- Does the DOI resolve? Visit: https://doi.org/[DOI]
- Does the resolved page match the claimed title, authors, and journal?
- Report any mismatches (wrong paper, retracted, DOI doesn't exist)

**Result:** [PASS/FAIL/NO DOI PROVIDED]
**Notes:**

### 2. CITATION ACCURACY
- Do the authors listed match the actual paper?
- Is the journal name correct and EXACT?
- Is the publication year correct?
- Do volume/page numbers match (if provided)?

**Result:** [PASS/FAIL/UNABLE TO VERIFY]
**Notes:**

### 3. QUOTE VERIFICATION
- Does the verbatim snippet appear to be real scientific writing?
- Are there signs of hallucination? (overly generic, suspiciously perfect phrasing)
- If you can access the paper, does the quote actually appear?

**Red flags for hallucinated quotes:**
- Round numbers without uncertainty (e.g., "exactly 90%")
- Generic phrasing that could apply to any material
- Inconsistent terminology within the quote
- Quote doesn't match the writing style of the journal

**Result:** [PASS/SUSPICIOUS/FAIL/UNABLE TO VERIFY]
**Notes:**

### 4. VALUE PLAUSIBILITY
- Is the numeric value within reasonable bounds for this parameter?
- Reference ranges for PET:
  - Y (Yield): Mechanical recycling typically 60-95%
  - D (Degradability): Soil/marine degradation extremely slow (centuries); weight loss <1%/year typical
  - C (Compostability): Conventional PET is NOT compostable; only bio-PET or blends
  - M (Methane): Very low BMP expected (<5 mL CH4/g); PET is not readily biodegradable
  - E (Ecotoxicity): LC50 values vary widely; microplastic studies often report effects at mg/L levels

**Result:** [PLAUSIBLE/IMPLAUSIBLE/NEEDS CONTEXT]
**Notes:**

### 5. EXPERIMENTAL CONDITIONS CONSISTENCY
- Are the stated conditions consistent with the parameter being measured?
- Do temperature, time, and method make sense together?
- Are there contradictions?

**Common inconsistencies to flag:**
- Composting at temperatures outside 50-70°C range
- Degradation studies with implausibly short timeframes for PET
- Missing critical conditions (no temperature for biological processes)
- Method names that don't exist or are misspelled

**Result:** [CONSISTENT/INCONSISTENT/INSUFFICIENT DETAIL]
**Notes:**

### 6. SOURCE TYPE & WEIGHT ACCURACY
- Is the source correctly categorized?
- Does the weight match the source type?
  - Peer-reviewed: 1.0
  - Government: 0.9
  - Industrial/LCA: 0.7
  - NGO: 0.6

**Result:** [CORRECT/INCORRECT]
**Notes:**

### 7. CONFIDENCE LEVEL APPROPRIATENESS
- Does the assigned confidence level match the criteria?
- High requires: MEASURED value + units + conditions + error bounds + peer-reviewed
- Medium: clear value but missing some context or CALCULATED
- Low: inferred, qualitative, or CITED from another source

**Result:** [APPROPRIATE/OVERCONFIDENT/UNDERCONFIDENT]
**Notes:**

### 8. OPEN ACCESS CLAIM
- If marked as Open Access, can you actually access the full text?
- Is the provided URL valid and working?

**Result:** [VERIFIED/UNVERIFIED/NOT APPLICABLE]
**Notes:**

### 9. VALUE TYPE ACCURACY
- Is the value directly MEASURED in an experiment?
- Or is it CALCULATED from other values?
- Or is it CITED from another source?

**If calculated/derived:**
- What inputs were used?
- Are those inputs themselves verified?

**Result:** [CORRECTLY CLASSIFIED / MISCLASSIFIED]
**Notes:**

### 10. AUTHOR COMPLETENESS
- Are ALL authors listed?
- Or was "et al." used or only first author provided?
- Cross-check against PubMed/DOI resolution

**Result:** [COMPLETE / INCOMPLETE]
**Notes:**

---

## OVERALL ASSESSMENT

**Verification Score:** [X/10 checks passed]

**Risk Level:**
- LOW RISK (9-10 passed): Reliable, suitable for database
- MEDIUM RISK (6-8 passed): Needs manual verification before use
- HIGH RISK (0-5 passed): Likely contains errors or hallucinations, do not use

**Summary of Issues Found:**
[List all FAILs and SUSPICIOUS findings]

**Recommendation:**
[ ] ACCEPT - Add to database
[ ] VERIFY - Manually check flagged issues before accepting
[ ] REJECT - Too many issues, do not use

---

## KNOWN HALLUCINATION PATTERNS

Flag if you observe any of these:
- [ ] Paper exists but value is not in it
- [ ] Authors are real but paper title is wrong
- [ ] DOI format is valid but doesn't resolve
- [ ] Journal name is slightly wrong
- [ ] Year is off by 1-2 years
- [ ] Conflating multiple papers into one citation
- [ ] Inventing a plausible-sounding methodology
- [ ] Using generic placeholder values (50%, 100 days, 25°C)
```

---

## Verification Prompt v2 (Batch - All 5 Parameters)

Use this when verifying extraction of all 5 parameters at once.

```
You are a scientific data auditor verifying extracted evidence points. Verify each of the 5 MIUs separately using the checklist below.

## INPUT TO VERIFY

[Paste the full 5-parameter extraction output here]

---

## VERIFICATION PROCESS

For EACH of the 5 MIUs (Y, D, C, M, E), perform the 10-point checklist:

1. DOI Validation
2. Citation Accuracy
3. Quote Verification
4. Value Plausibility
5. Experimental Conditions Consistency
6. Source Type & Weight Accuracy
7. Confidence Level Appropriateness
8. Open Access Claim
9. Value Type Accuracy
10. Author Completeness

---

## OUTPUT FORMAT

### MIU 1: Y (Yield)
| Check | Result | Notes |
|-------|--------|-------|
| 1. DOI | | |
| 2. Citation | | |
| 3. Quote | | |
| 4. Plausibility | | |
| 5. Conditions | | |
| 6. Source Type | | |
| 7. Confidence | | |
| 8. Open Access | | |
| 9. Value Type | | |
| 10. Authors | | |

**Score:** X/10
**Risk:** [LOW/MEDIUM/HIGH]
**Recommendation:** [ACCEPT/VERIFY/REJECT]

---

[Repeat for MIUs 2-5]

---

## BATCH SUMMARY

| Parameter | Score | Risk | Recommendation |
|-----------|-------|------|----------------|
| Y | /10 | | |
| D | /10 | | |
| C | /10 | | |
| M | /10 | | |
| E | /10 | | |

**Overall Batch Quality:** [X/5 MIUs acceptable]

**Action Items:**
- [List any MIUs that need manual verification]
- [List any MIUs that should be rejected]
```

---

## Test Results Log

### Trial 1 (Single Parameter - Y)

- **Prompt Version:** v1
- **Verification Score:** 5/8
- **Issues:** No DOI reported (existed), wrong journal name, incomplete authors
- **Outcome:** MEDIUM RISK - Required fixes

### Trial 2 (Single Parameter - D)

- **Prompt Version:** v2
- **Verification Score:** 10/10
- **Issues:** None
- **Outcome:** LOW RISK - Accepted

### Trial 3 (All 5 Parameters)

- **Prompt Version:** v2 + OA guidance
- **Verification Score:** 0/5 extracted
- **Issues:** LLM found data but refused to report due to overly strict "extract metadata FROM DOI resolution page" requirement
- **Outcome:** PROMPT TOO RESTRICTIVE - Relaxed DOI verification in v2.1

### Trial 4 (All 5 Parameters)

- **Prompt Version:** v2.1 (relaxed DOI verification)
- **Verification Score:** 1/5 extracted (E only)
- **Issues:** Tool access bandwidth exhausted mid-run; could not capture full metadata for Y, D, C, M
- **Outcome:** PARTIAL - Single-parameter runs recommended

### Trial 5 (Single Parameter - C)

- **Prompt Version:** v2.1 + parameter field
- **Verification Score:** Pending verification
- **Extracted:** 0.9% weight loss at 45 days (ISO 20200), Kheirandish et al. 2023, Frontiers in Materials
- **Issues:** None apparent; disintegration-by-mass-loss rather than full mineralization
- **Outcome:** MEDIUM confidence - Accepted pending verification

---

## Usage Notes

1. **Always use web search enabled** - These prompts require the LLM to look up real papers
2. **Copy output exactly** - Don't summarize when pasting into verification prompt
3. **Track results** - Update the Test Results Log to identify patterns
4. **Iterate prompts** - If new failure modes emerge, update the prompts
