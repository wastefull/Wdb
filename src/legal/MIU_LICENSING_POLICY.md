# WasteDB MIU Licensing & Usage Policy

**Effective Date:** November 12, 2025  
**Version:** 1.0  
**Updated:** December 18, 2025

---

## 🎯 Overview

This document establishes the licensing framework for all data generated and distributed by WasteDB, including Minimally Interpretable Units (MIUs), structured datasets, source citations, and content extracted from academic literature.

WasteDB is committed to **open science** while respecting **intellectual property rights** of original source authors and publishers.

---

## 📊 Data Types & Licenses

### **1. Structured MIU Data (Database Records)**

**License:** [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)

**Applies to:**

- MIU records (parameter values, locators, context tags, normalization metadata)
- Aggregated parameter statistics (weighted means, confidence intervals, sample sizes)
- Material sustainability scores (CR, CC, RU composite scores)
- Curator attribution data (usernames, contribution counts, reputation scores)
- Release manifests and version metadata

**What This Means:**

- ✅ **You are free to:** Share, copy, redistribute, adapt, remix, transform, and build upon this data
- ✅ **For any purpose:** Commercial, non-commercial, academic, or personal use
- ✅ **Under this condition:** You must give appropriate credit to WasteDB and indicate if changes were made

**Example Citation:**

```
WasteDB Contributors (2026). WasteDB: Evidence-Based Materials Sustainability Data v2026.Q1.
DOI: 10.xxxxx/wastedb.v2026.Q1. Licensed under CC BY 4.0.
```

---

### **2. Verbatim Snippets from Academic Sources**

**License:** Fair Use / Fair Dealing (varies by jurisdiction)

**Applies to:**

- Direct quotations extracted from academic papers, reports, and technical documents
- Text snippets stored in MIU records (typically 20-250 words)
- Context surrounding extracted numeric values

**Legal Basis:**
WasteDB's use of verbatim snippets constitutes **fair use** under U.S. Copyright Law (17 U.S.C. § 107) and similar doctrines internationally, based on:

1. **Purpose:** Educational and research purposes (non-commercial platform)
2. **Nature:** Factual, scientific information (not creative works)
3. **Amount:** Small portions (<250 words per source, minimal relative to source length)
4. **Effect:** Does not substitute for original work (drives citation traffic to sources)

**Usage Guidelines:**

- ✅ **Permitted:** Snippets are extractable for research, analysis, and education
- ✅ **Required:** Full source citation must accompany snippet (DOI, URL, title, authors, year)
- ⚠️ **Prohibited:** Aggregating snippets to reconstruct substantial portions of original work
- ⚠️ **Prohibited:** Removing source attribution from snippets

**Redistribution:**
If you redistribute WasteDB data containing snippets:

- ✅ You must maintain source citations
- ✅ You must indicate snippets are subject to original copyright
- ✅ You should link to original sources where possible

---

### **3. Screenshots and Figures**

**License:** Fair Use / Fair Dealing + Attribution Required

**Applies to:**

- Screenshots of figures, charts, tables, or diagrams from academic sources
- Image captures uploaded by curators to document MIU extraction

**Legal Basis:**
Screenshots are used for **illustrative and educational purposes** under fair use, serving as visual anchors for numeric data extraction.

**Usage Guidelines:**

- ✅ **Permitted:** Screenshots displayed alongside MIU records for verification
- ✅ **Required:** Full source citation with figure/table number
- ✅ **Required:** "Screenshot from [Source Title]" attribution on image
- ⚠️ **Prohibited:** High-resolution screenshots that substitute for original publication
- ⚠️ **Prohibited:** Redistribution of screenshots outside context of MIU citation

**Retention Policy:**

- Screenshots retained for **7 years** after last MIU reference
- Archived with aggregation snapshots for reproducibility
- Subject to takedown requests (see below)

---

### **4. Source PDFs and Full-Text Documents**

**License:** NOT REDISTRIBUTED

**Policy:**

- ❌ WasteDB does **not redistribute** original source PDFs or full-text articles
- ❌ PDF files stored in Supabase Storage are for **internal curation use only**
- ❌ Public API provides only **metadata and links** to external sources (DOI, URL)

**Access:**

- Public users see bibliographic metadata and DOI/URL links
- Curators (authenticated admins) may upload PDFs for extraction workflow
- PDF access restricted via signed URLs with time-limited expiry
- Users must obtain original publications through legal channels (university access, open access repositories, publisher purchase)

---

## 📝 Conflict of Interest (COI) Disclosure

**Requirement:**
Curators must disclose conflicts of interest when extracting MIUs from sources where:

- The source was funded by industry with financial interest in the material
- The curator has financial or employment relationship with source authors/organizations
- The source is self-published by the curator's employer

**Implementation:**

- COI field required in Evidence Wizard (Step 4: Confidence)
- COI disclosures appear on public Evidence tab with ⚠️ badge
- Example: "⚠️ This source was funded by the Plastics Industry Association"

**Purpose:**
Transparency ensures users can assess potential bias in evidence base.

---

## 🛡️ Data Retention Policy

**MIU Records:**

- Retained **indefinitely** (immutable scientific record)
- Deletion only via DMCA takedown process (see below)
- Redacted MIUs preserve aggregation metadata but remove snippets

**Screenshots:**

- Retained for **7 years** after last MIU reference
- Archived with quarterly release snapshots
- Subject to takedown requests

**Source PDFs:**

- Retained while MIUs reference them
- Removed if source deleted from Library
- Never publicly redistributed

**Aggregations:**

- Retained indefinitely with policy snapshots
- Historical aggregations preserved even if MIUs updated
- Supports reproducibility of published research

---

## ⚖️ DMCA Takedown Process

**If you believe content on WasteDB infringes your copyright:**

1. **Submit takedown request:** Use form at [/legal/takedown](#) or email compliance@wastefull.org
2. **Provide information:**
   - URL of infringing content on WasteDB
   - Original copyrighted work identification
   - Your contact information
   - Good faith statement: "I believe use is not authorized by copyright owner"
   - Accuracy statement: "Information is accurate, and I am authorized to act"
   - Signature (electronic or physical)
3. **Review timeline:** WasteDB will respond within **72 hours**
4. **Resolution options:**
   - Remove snippet and replace with "[Redacted per DMCA request]"
   - Remove screenshot but preserve MIU metadata
   - Remove entire MIU if redaction insufficient
   - Preserve aggregations (derived statistics not subject to copyright)

**See:** `/legal/TAKEDOWN_PROCESS.md` for detailed procedure

---

## 🌐 International Considerations

**European Union (GDPR):**

- MIUs do not contain personal data (no PII in scientific parameters)
- Curator attribution respects opt-in/opt-out preferences
- Data export includes right to rectification (correction of errors)

**Text and Data Mining Exceptions:**

- EU Copyright Directive Article 3: TDM for scientific research (applies)
- UK Copyright, Designs and Patents Act Section 29A: Research exception (applies)
- Japan Copyright Act Article 47: Library and educational exceptions (applies)

WasteDB's MIU extraction falls under scientific research and educational exceptions in most jurisdictions.

---

## ✅ User Rights and Responsibilities

### **As a User of WasteDB Data:**

**You may:**

- ✅ Download and analyze all structured MIU data
- ✅ Cite WasteDB in academic papers and reports
- ✅ Build applications and tools using WasteDB API
- ✅ Use data for commercial product development (with attribution)
- ✅ Create derivative datasets (with CC BY 4.0 compliance)

**You must:**

- ✅ Provide attribution to WasteDB (see citation guide: `/cite`)
- ✅ Maintain source citations when redistributing snippets
- ✅ Indicate if you modified the data
- ✅ Share derivative datasets under same or compatible license

**You must not:**

- ❌ Misrepresent data as your own original work
- ❌ Remove attribution or licensing information
- ❌ Reconstruct full text of sources from snippets
- ❌ Violate original source copyrights through aggregation

---

## 📚 Additional Resources

- **Citation Guide:** [/cite](#) - How to cite WasteDB correctly
- **Takedown Process:** [/legal/TAKEDOWN_PROCESS.md](#) - Copyright concerns
- **API Terms:** [/docs/API.md](#) - API usage guidelines
- **Curator Codebook:** [/docs/CURATOR_CODEBOOK_v0.md](#) - Extraction guidelines
- **Privacy Policy:** [/legal/PRIVACY.md](#) - User data handling (future)

---

## 📧 Contact

**Legal Questions:**  
compliance@wastefull.org

**Data Licensing Questions:**  
natalie@wastefull.org

**General Inquiries:**  
info@wastefull.org

---

## 📜 License Summary

| Data Type    | License           | Commercial Use | Attribution Required |
| ------------ | ----------------- | -------------- | -------------------- |
| MIU records  | CC BY 4.0         | ✅ Yes         | ✅ Yes               |
| Aggregations | CC BY 4.0         | ✅ Yes         | ✅ Yes               |
| Snippets     | Fair Use          | ⚠️ Limited     | ✅ Yes + Source      |
| Screenshots  | Fair Use          | ❌ No          | ✅ Yes + Source      |
| Source PDFs  | Not Redistributed | ❌ N/A         | N/A                  |

---

**This policy balances open science principles with respect for intellectual property. WasteDB is committed to legal compliance and academic integrity.**

---

**Version History:**

- **v1.0** (Nov 12, 2025) - Initial policy published
