# Finding Good Data Sources

When looking for data sources to parameterize the Sustainability Score model, consider the following criteria:

## Overview of sources

- **LCA / life-cycle inventory databases:** ecoinvent, Sphera, etc. They sometimes have “end-of‐life” process models.
- **The UN E-Waste Monitor** data (collection / recycling rates for electronics).
- **OECD’s “Global Plastics Outlook”** report includes projections and some technical constraints.
- **Academic papers** about specific materials: plastics (mechanical vs chemical recycling), metals/alloys, glass, paper.
- **Material Flow Analysis (MFA)** work (flow of materials in products, waste, recycling, losses).

## Recommended sources & what to extract

### Ecoinvent (or similar LCI)

_process energy, yields, end-of-life flows_

- **What to extract:** energy per kg for recycling processes (mechanical recycling, smelting, remelting, anaerobic digestion), mass balances (input → output yields), common assumptions about contamination losses.
- **How to use it:** populate E (relative energy intensity) and Y (processing yield). If ecoinvent expresses energy in MJ/kg, normalize by dividing by virgin production MJ/kg to get E in 0–1.
- **Examples:** [Ecoinvent](https://ecoinvent.org/database/), [Ecoinvent](https://support.ecoinvent.org/waste-management-and-recycling)

### EPA Recycling Infrastructure & Market Opportunities Map (U.S.)

_facility counts & practical acceptance_

- **What to extract:** counts and types of recycling facilities by material (collection, MRFs, smelters, glass furnaces), “accepted locally” flags, and estimated recycling potential by ZIP.
- **How to use it:** derive M (process maturity/infrastructure availability) as a normalized score (e.g., facility density per capita or fraction of jurisdiction that has an appropriate end-of-life facility).
- **Examples:** [Environmental Protection Agency](https://www.epa.gov/circulareconomy/recycling-infrastructure-and-market-opportunities-map), [User Guide](https://www.epa.gov/circulareconomy/user-guide-recycling-infrastructure-and-market-opportunities-map)

### OECD Global Plastics Outlook / UN / national reports

_global plastics flows and realistic recycling fractions_

- **What to extract:** national & regional recycling rates for major resin types; mechanical vs chemical recycling shares; projections about possible increases.
- **How to use it:** set priors for Y and M for plastics (and for “market share” when aggregating categories). Also useful for confidence metadata.
- **Source:** OECD Global Plastics Outlook.
- **Examples:** [OECD](https://www.oecd.org/content/dam/oecd/en/publications/reports/2022/02/global-plastics-outlook_a653d1c9/de747aef-en.pdf)

### Industry associations & technical reports (Aluminum Association; Glass Packaging Institute; Paper trade groups)

- **What to extract:** energy savings and real-world recycling yields (aluminum), glass recovery percentages and color effects, paper recycling rates and fiber-cycle limits.
- **How to use it:** aluminum → very high Y, high M, low D, low E; glass → moderate/high Y, D low, C depends on color; paper → high collection M/Y but higher D due to fiber shortening.
- **Examples:** [Aluminum Association](https://www.aluminum.org/Recycling), [Glass Packaging Institute](https://www.gpi.org/sites/default/files/content-files/Lists%20and%20Resources/BCG%20Report_A%20Circular%20Future%20For%20Glass.pdf), [EPA](https://www.epa.gov/facts-and-figures-about-materials-waste-and-recycling/paper-and-paperboard-material-specific-data)

### Global E-Waste Monitor & targeted battery/Li-ion studies

- **What to extract:** formal recycling rates, typical recovery fractions for materials (Co, Ni, Li, Cu), chemical vs mechanical recovery efficiencies, energy intensity for hydrometallurgical vs pyrometallurgical routes.
- **How to use it:** populate Y, E, C for electronics & batteries; set low M where formal infrastructure is sparse.
- **Examples:** [E-Waste Monitor](https://ewastemonitor.info/wp-content/uploads/2024/03/GEM_2024_18-03_web_page_per_page_web.pdf), [Unitar](https://unitar.org/about/news-stories/press/global-e-waste-monitor-2024-electronic-waste-rising-five-times-faster-documented-e-waste-recycling)

### Textile / cotton recycling studies & LCA papers

- **What to extract:** mechanical and chemical recycling yields (% mass recovered), fiber length loss / tensile property decline, contamination sensitivity caused by blends and dyes.
- **How to use it:** populate Y, D, C, and M (textile recycling infrastructure maturity). Example: cotton mechanical recovery yields reported >75% under optimized lab setups; industrial yields will be lower.
- **Examples:** [ScienceDirect](https://doi.org/10.1016/j.cscee.2024.100849), [ACS](https://pubs.acs.org/doi/10.1021/acs.est.5c01854)

### Construction & C&D datasets / industry reports (concrete crushing, reclaimed aggregate)

- **What to extract:** percent mass recoverable as aggregate, quality loss (downcycling), facility prevalence, energy per reuse vs virgin aggregate production.
- **How to use it:** derive Y, high D (downcycling severity), moderate M. (See construction material flow studies and EU/US C&D reports.)
- **Examples:** [gpi.org](https://www.gpi.org/sites/default/files/content-files/Lists%20and%20Resources/BCG%20Report_A%20Circular%20Future%20For%20Glass.pdf)

### Peer-reviewed studies on contamination impacts and degradation

- **What to extract:** thresholds at which recyclate is unsuitable for high-value applications (food contact, structural uses), measured impacts of contaminants on yield or product quality.
- **How to use it:** parameterize C (contamination tolerance) and adjust Y downward for typical contamination levels. See plastics/paper contamination studies.
- **Examples:** [Recycle Track Systems](https://www.rts.com/blog/the-complete-paper-card-recycling-process), [ACS](https://pubs.acs.org/doi/10.1021/acs.est.5c01854)
