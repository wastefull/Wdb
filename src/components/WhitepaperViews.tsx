import { useState, useEffect } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';

interface Whitepaper {
  id: string;
  title: string;
  filename: string;
  content: string;
  description: string;
}

// Whitepaper content
const recyclabilityContent = `---

# **WasteDB: Statistical and Accessibility Methodology**

## **Organization Overview**

**Organization:** Wastefull
**Location:** San Jose, California
**Project:** WasteDB
**Focus:** Advancing biological and technological recycling through open data, research, and community collaboration.

**Mission Statement:**
Wastefull develops open scientific infrastructure to measure, understand, and improve material circularity. Our mission is to empower communities, researchers, and industries to make data-driven decisions that reduce waste and expand what is materially possible. Wastefull treats recyclability not as a fixed property but as a moving boundary that science and design can continually push outward.

---

## **1. Purpose and Philosophy**

WasteDB balances *scientific optimism* with *practical realism*.
We assume that, with sufficient progress, any material can ultimately be recycled.
However, the database quantifies **current recyclability** to guide real-world decisions in manufacturing, product design, and consumer behavior.

WasteDB computes **two complementary recyclability indices**:

* **Theoretical Recyclability ($CR_{theo}$):** reflects scientific or technical potential under ideal conditions (clean inputs, mature infrastructure).
* **Practical Recyclability ($CR_{prac}$):** reflects real-world performance under typical consumer and industrial conditions (contamination, existing facilities).

Every data point and score is traceable to at least three independent sources.

---

## **2. Core Parameters**

| Symbol | Parameter               | Definition                                                                      | Empirical Basis                                             |
| :----: | ----------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------- |
|  **Y** | Yield                   | Fraction of material successfully recovered after processing                    | Laboratory recovery data, industrial trials, LCA datasets   |
|  **D** | Degradability           | Quality or functional loss per recycling cycle                                  | Material-science and composting studies, UV/weathering data |
|  **C** | Contamination Tolerance | Sensitivity of the process to contaminants (food residue, mixed polymers, etc.) | Facility process data, waste-stream analyses                |
|  **M** | Maturity                | Availability and readiness of recycling infrastructure                          | Industrial reports, government data, TRL assessments        |
|  **E** | Energy Demand           | Net energy input per kg for recovery or transformation                          | LCA and process energy audits                               |

> **Note:** $E$ is tracked separately as an **energy score**, not folded into $CR$.
> This preserves transparency in trade-offs between feasibility and sustainability.

---

## **3. Data Collection Standards**

Each data point must meet the following requirements:

* **≥ 3 independent sources**, including at least one peer-reviewed or government dataset.
* **Full citation traceability** (DOI, accession, or public dataset link).
* **Standardized units** (MJ kg⁻¹, %, g CO₂e kg⁻¹).
* **Source weighting** recorded in metadata for transparency.

### **3.1 Source Weight Parameters**

| Source Type                       | Weight ($w_i$) | Rationale                     |
| --------------------------------- | :------------: | ----------------------------- |
| Peer-reviewed paper               |       1.0      | Highest verification standard |
| Government / international report |       0.9      | Large-scale, high reliability |
| Industrial white paper or LCA     |       0.7      | Empirical but possible bias   |
| NGO / nonprofit study             |       0.6      | Often regional, smaller scope |
| Internal or unpublished data      |       0.3      | Provisional; to be validated  |

Weighted means and confidence intervals:

$
\\bar{x}_w = \\frac{\\sum_i w_i x_i}{\\sum_i w_i}
$

$
SE_w = \\sqrt{\\frac{\\sum_i w_i (x_i - \\bar{x}_w)^2}{(\\sum_i w_i)(n-1)}}
$

$
CI_{95\\%} = \\bar{x}_w \\pm 1.96 \\cdot SE_w
$

---

## **4. Statistical Handling**

* **Aggregation:** Weighted mean and SD across sources.
* **Confidence Intervals:** Computed with weighted $SE_w$.
* **Covariance Tracking (Stage II):** Future work will map correlations (e.g., $Y$–$D$, $C$–$M$) for improved uncertainty propagation.

---

## **5. Dual Recyclability Scoring**

WasteDB reports two composite indices for each material:

| Field                                            | Meaning                                        | Default Assumptions                                  |
| ------------------------------------------------ | ---------------------------------------------- | ---------------------------------------------------- |
| **CR_theoretical_mean**                          | Recyclability under ideal conditions           | $U_{clean}=1.0$ (clean input); optimistic $M$        |
| **CR_practical_mean**                            | Recyclability under typical conditions         | $U_{clean}=0.6$ (realistic cleanliness); current $M$ |
| **CR_theoretical_CI95**, **CR_practical_CI95**   | 95 % confidence intervals                      | Derived from parameter SEs                           |
| **CR_theoretical_label**, **CR_practical_label** | Public categories ("Easily recyclable," etc.)  | Mapped from Table below                              |
| **E_value**, **E_CI95**                          | Separate energy score (MJ kg⁻¹ and normalized) | Displayed in parallel to $CR$                        |

**Label thresholds**

| $CR$ Range  | Label                       | Guidance                                  |
| ----------- | --------------------------- | ----------------------------------------- |
| 0.80 – 1.00 | Easily recyclable           | Routinely recycled at scale.              |
| 0.60 – 0.79 | Recyclable with care        | Requires clean sorting or mature systems. |
| 0.40 – 0.59 | Limited recyclability       | Recycled in specialized facilities only.  |
| 0.20 – 0.39 | Technically recyclable      | Feasible but rarely done commercially.    |
| 0.00 – 0.19 | Unrecyclable / Experimental | No established pathway today.             |

WasteDB's interface defaults to \`CR_practical_label\` for public display, with optional toggling to view \`CR_theoretical_label\` for researchers.

---

## **6. Accessibility and Visual Design**

All numeric confidence values are accompanied by accessible visual cues.

| Confidence                 | Color   | Pattern        | Icon | Accessibility Notes                  |
| -------------------------- | ------- | -------------- | ---- | ------------------------------------ |
| **High**                   | #003366 | solid          | ▲    | High contrast; readable in grayscale |
| **Medium**                 | #6A7BA2 | diagonal hatch | ■    | Distinct texture and shape           |
| **Low**                    | #D0D0D0 | cross-hatch    | ●    | Legible in monochrome                |
| **Unverified/Conflicting** | #E57E25 | checkerboard   | !    | Flag for user attention              |

> Confidence indicators use redundant color, texture, and shape cues, achieving **WCAG 2.1 AA** compliance.
> Screen readers use descriptive text ("High confidence, blue triangle") rather than color cues.

---

## **7. Transparency and Version Control**

All WasteDB datasets and derived values are:

* **Versioned** with public changelogs.
* **Openly licensed** whenever possible.
* **Traceable** from visualization back to raw data sources.

All statistical methods and weight configurations are stored in \`/methods\`, with timestamps, contributor IDs, and configuration histories for reproducibility.

---

## **8. Future Work**

1. Develop covariance models for $Y$, $D$, $C$, and $E$.
2. Automate source weight calibration via metadata quality scoring.
3. Deploy interactive WasteDB dashboard showing $CR_{theo}$ vs $CR_{prac}$.
4. Integrate probabilistic forecasts for recyclability improvement based on research trends.
5. Publish WasteDB as a public API with FAIR-compliant metadata access.

---

## **Appendix A: Metadata Schema and Representation**

### **A.1 Overview**

Each WasteDB material record contains empirical recyclability data and metadata for traceability, confidence assessment, and accessibility.
The schema is compatible with **JSON-LD**, **CSV**, and **SQL**.

### **A.2 Core Schema (with dual-score support)**

| Field                  | Type                | Description                                 |
| ---------------------- | ------------------- | ------------------------------------------- |
| \`material_id\`          | UUID                | Unique identifier                           |
| \`material_name\`        | String              | Common or trade name                        |
| \`category\`             | Enum                | Public taxonomy (e.g. "Plastics," "Metals") |
| \`Y_value\`              | Float               | Weighted mean yield                         |
| \`Y_CI95\`               | Tuple(Float, Float) | 95 % CI for yield                           |
| \`D_value\`              | Float               | Weighted degradability score                |
| \`C_value\`              | Float               | Weighted contamination tolerance            |
| \`M_value\`              | Float               | Infrastructure maturity score               |
| \`E_value_MJkg\`         | Float               | Absolute energy use                         |
| \`E_norm\`               | Float               | Normalized energy (0–1)                     |
| \`CR_practical_mean\`    | Float               | Practical recyclability index               |
| \`CR_practical_CI95\`    | Tuple(Float, Float) | Confidence interval                         |
| \`CR_practical_label\`   | Enum                | Public label (default display)              |
| \`CR_theoretical_mean\`  | Float               | Theoretical recyclability index             |
| \`CR_theoretical_CI95\`  | Tuple(Float, Float) | Confidence interval                         |
| \`CR_theoretical_label\` | Enum                | R&D label                                   |
| \`recyclability_label\`  | Alias               | Default = \`CR_practical_label\`              |
| \`confidence_level\`     | Enum                | High / Medium / Low / Unverified            |
| \`source_list\`          | Array[Object]       | Source metadata and weights                 |
| \`last_reviewed\`        | ISO Date            | Last update                                 |
| \`version\`              | String              | Repository version                          |
| \`reviewed_by\`          | String              | Contributor(s)                              |
| \`notes\`                | Text                | Contextual notes                            |

*(See Appendix A.3–A.7 for full metadata and accessibility fields.)*

---

## **Appendix B: Composite Recyclability Index (CR)**

Formulas, uncertainty propagation, and worked examples are provided for both $CR_{theo}$ and $CR_{prac}$, including weighting defaults, behavioral cleanliness factors, and energy treatment.
See Appendix B in the technical documentation for implementation details.

---
`;

// Whitepaper registry
const whitepapers: Whitepaper[] = [
  {
    id: 'recyclability',
    title: 'WasteDB: Statistical and Accessibility Methodology',
    filename: 'Recyclability.md',
    content: recyclabilityContent,
    description: 'Technical documentation on how recyclability scores are calculated, including statistical methods, data collection standards, and accessibility guidelines.'
  }
];

export function MethodologyListView({ onBack, onSelectWhitepaper }: { 
  onBack: () => void;
  onSelectWhitepaper: (whitepaperId: string) => void;
}) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 bg-[#b8c8cb] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
        >
          <ArrowLeft size={16} className="text-black" />
        </button>
        <h2 className="font-['Sniglet:Regular',_sans-serif] text-[18px] text-black dark:text-white flex-1">
          Methodology & Whitepapers
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 max-w-4xl">
        {whitepapers.map(whitepaper => (
          <button
            key={whitepaper.id}
            onClick={() => onSelectWhitepaper(whitepaper.id)}
            className="bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 p-6 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] transition-all text-left"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#e4e3ac] rounded-md border border-[#211f1c] dark:border-white/20">
                <FileText size={24} className="text-black" />
              </div>
              <div className="flex-1">
                <h3 className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black dark:text-white mb-2">
                  {whitepaper.title}
                </h3>
                <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/60 dark:text-white/60 mb-2">
                  {whitepaper.description}
                </p>
                <span className="inline-block px-2 py-0.5 bg-[#b8c8cb] rounded-md border border-[#211f1c] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[9px] text-black">
                  Read Whitepaper
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function WhitepaperView({ 
  whitepaperId, 
  onBack 
}: { 
  whitepaperId: string;
  onBack: () => void;
}) {
  const whitepaper = whitepapers.find(wp => wp.id === whitepaperId);

  useEffect(() => {
    // Add KaTeX CSS to document head
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
    link.integrity = 'sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);

    return () => {
      // Cleanup: remove the link when component unmounts
      const existingLink = document.querySelector('link[href*="katex"]');
      if (existingLink) {
        document.head.removeChild(existingLink);
      }
    };
  }, []);

  if (!whitepaper) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 bg-[#b8c8cb] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
          >
            <ArrowLeft size={16} className="text-black" />
          </button>
          <h2 className="font-['Sniglet:Regular',_sans-serif] text-[18px] text-black dark:text-white">
            Whitepaper not found
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 bg-[#b8c8cb] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
        >
          <ArrowLeft size={16} className="text-black" />
        </button>
        <h2 className="font-['Sniglet:Regular',_sans-serif] text-[18px] text-black dark:text-white flex-1">
          {whitepaper.title}
        </h2>
      </div>

      <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 p-6 max-w-3xl mx-auto">
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex]}
            components={{
              h1: ({node, ...props}) => <h1 className="font-['Sniglet:Regular',_sans-serif] text-[20px] text-black dark:text-white mb-4" {...props} />,
              h2: ({node, ...props}) => <h2 className="font-['Sniglet:Regular',_sans-serif] text-[18px] text-black dark:text-white mb-3" {...props} />,
              h3: ({node, ...props}) => <h3 className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black dark:text-white mb-2" {...props} />,
              p: ({node, ...props}) => <p className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black/80 dark:text-white/80 mb-4 leading-relaxed" {...props} />,
              ul: ({node, ...props}) => <ul className="font-['Sniglet:Regular',_sans-serif] text-[13px] text-black/80 dark:text-white/80 mb-4 list-disc pl-6" {...props} />,
              li: ({node, ...props}) => <li className="mb-1" {...props} />,
              blockquote: ({node, ...props}) => (
                <blockquote className="border-l-4 border-[#e4e3ac] pl-4 my-4 italic text-black/70 dark:text-white/70" {...props} />
              ),
              table: ({node, ...props}) => (
                <div className="overflow-x-auto mb-6">
                  <table className="w-full border-[1.5px] border-[#211f1c] dark:border-white/20 rounded-[8px]" {...props} />
                </div>
              ),
              thead: ({node, ...props}) => <thead className="bg-[#e4e3ac] dark:bg-[#e4e3ac]/80 border-b-[1.5px] border-[#211f1c] dark:border-white/20" {...props} />,
              tbody: ({node, ...props}) => <tbody {...props} />,
              tr: ({node, ...props}) => <tr className="border-b border-[#211f1c]/20 dark:border-white/10" {...props} />,
              th: ({node, ...props}) => <th className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black px-3 py-2 text-left border-r border-[#211f1c]/20 dark:border-white/10 last:border-r-0" {...props} />,
              td: ({node, ...props}) => <td className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black/80 dark:text-white/80 px-3 py-2 border-r border-[#211f1c]/20 dark:border-white/10 last:border-r-0" {...props} />,
              code: ({node, inline, ...props}) => 
                inline ? (
                  <code className="bg-[#211f1c]/5 dark:bg-white/5 px-1.5 py-0.5 rounded border border-[#211f1c]/20 dark:border-white/20 text-black dark:text-white" style={{ fontSize: '14px', fontFamily: 'DaddyTimeMono Nerd Font Mono, Press Start 2P, monospace' }} {...props} />
                ) : (
                  <code className="text-black dark:text-white block" style={{ fontSize: '12px', fontFamily: 'DaddyTimeMono Nerd Font Mono, Press Start 2P, monospace' }} {...props} />
                ),
              pre: ({node, ...props}) => (
                <pre className="bg-[#211f1c]/5 dark:bg-white/5 border-[1.5px] border-[#211f1c] dark:border-white/20 rounded-[8px] p-4 mb-4 overflow-x-auto" style={{ fontFamily: 'DaddyTimeMono Nerd Font Mono, Press Start 2P, monospace' }} {...props} />
              ),
            }}
          >
            {whitepaper.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export { whitepapers };