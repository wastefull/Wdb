# Knowledge Graph and Educational Discovery

This document defines the product direction for Stages 5, 7, and 8. The
admin roadmap is the source of truth for status and acceptance tests.

Companion document:
[Knowledge Graph Migration](./KNOWLEDGE_GRAPH_MIGRATION.md)

## Knowledge Graph Principles

WasteDB should evolve from isolated material records into connected knowledge
about materials, processes, products, policies, organizations, environmental
impacts, remediation strategies, research, and educational content.

The graph remains an underlying data structure. The primary interface should
surface meaningful Knowledge Feeds, Related Entities, and curated Discovery
Paths rather than a large force-directed graph.

Relationships should remain broad and stable, with nuance stored in metadata
and governed tags. Videos are first-class knowledge objects, not attachments.

## Stage Boundaries

- **Stage 5:** Ship the redesigned material-page hierarchy using current data,
  stable contracts, and explicit empty states for graph-dependent sections.
- **Stage 7:** Add graph-aware content and curation workflows.
- **Stage 8:** Wire verified graph reads into discovery and learning paths.

Existing material metrics, evidence, attribution, exports, and contribution
workflows must remain available throughout the redesign.

## Stage 5 UI Contract

The material experience reads from the existing `Material` and article models.
It must not query or infer graph relationships before the migration and
reconciliation gates pass.

The `stage-5-v1` graph-facing contract contains three independently available
sections:

- Knowledge Feed
- Related Entities
- Discovery Paths

Each section exposes an availability state and a typed item collection. During
Stage 5, the default adapter returns `awaiting-graph-data` with an empty
collection. The interface must explain that state explicitly rather than
showing fabricated recommendations or treating legacy links as verified graph
relationships.

Current articles may populate Recommended Learning, with direct material
articles ranked before linked-material articles. This current-data ranking is
separate from the future graph-ranked Knowledge Feed.

## Purpose

The Knowledge Graph & Educational Discovery Roadmap defines how WasteDB organizes knowledge.

This document defines how that knowledge should be presented to users.

The goal is to transform WasteDB from a traditional database into a discovery-oriented educational platform while preserving scientific rigor and contributor workflows.

⸻

Core Design Philosophy

WasteDB should not present information as isolated records.

Instead, every page should function simultaneously as:

- A destination

- A learning resource

- A discovery tool

- A gateway into related knowledge

Users should leave each page with a clear understanding of:

1. What this entity is

2. Why it matters

3. How it relates to broader systems

4. Where they can explore next

5. How they can contribute

⸻

Educational Progression

Material pages should follow a progression supported by educational psychology and information architecture research:

1. What is it?

2. How sustainable is it?

3. Show me the best information.

4. Let me go deeper.

5. Let me contribute.

This progression should guide page structure and visual hierarchy.

⸻

Material Page Structure

1. Material Overview

Purpose:

Provide immediate orientation.

Contents:

- Material name

- Aliases

- Tags

- Brief description

- Material category

- Periodic table reference (when applicable)

- Key material relationships

Questions answered:

- What is this?

- What family does it belong to?

⸻

1. Material Intelligence

Purpose:

Provide actionable sustainability information.

Contents:

- Recyclability indicators

- Compostability indicators

- Reusability indicators

- Confidence scores

- Data quality indicators

- Sustainability visualizations

Questions answered:

- How sustainable is this material?

- How reliable is this assessment?

This section should become the primary destination for practical decision-making.

⸻

1. Key Insights

Purpose:

Reduce cognitive load.

Provide a short editorial summary generated from the underlying evidence base.

Example:

- Highly recyclable when clean and properly sorted.

- Collection infrastructure is often the primary bottleneck.

- Reusability opportunities frequently outperform recycling.

Questions answered:

- What should I know first?

⸻

1. Recommended Learning

Purpose:

Provide the highest-value educational content.

This section should highlight:

- Articles

- Videos

- Guides

- Research summaries

- Case studies

Content should be ranked by relevance and educational value rather than publication date.

Recommended metadata:

- Beginner

- Intermediate

- Advanced

- Policy

- Evidence

- Historical

- Industry

- Community

Questions answered:

- Where should I start learning?

⸻

1. Discovery Paths

Purpose:

Transform the knowledge graph into meaningful learning journeys.

Users should not be shown raw graph structures.

Instead, the interface should surface curated pathways.

Example:

Tailings
→ Heavy Metals
→ Soil Remediation
→ Biochar

Tailings
→ Rare Earth Recovery
→ Circular Manufacturing

Aluminum
→ Bauxite
→ Mining Waste
→ Remediation

Questions answered:

- Where can I go next?

- How does this connect to larger systems?

This section should become one of the primary differentiators of WasteDB.

⸻

1. Related Entities

Purpose:

Provide direct graph exploration.

Display related:

- Materials

- Processes

- Products

- Policies

- Environmental impacts

- Organizations

- Technologies

Relationships should be grouped by meaning rather than displayed as a single undifferentiated network.

Example:

Feedstocks

- Bauxite

Products

- Aluminum Can

- Aluminum Foil

Processes

- Smelting

- Remelting

Policies

- Deposit Systems

Questions answered:

- What is directly connected?

⸻

1. Deep Research

Purpose:

Support advanced users and researchers.

Contents:

- Evidence libraries

- Source documents

- Methodology

- Technical analyses

- Data provenance

Questions answered:

- Why does WasteDB believe this?

- How was this score calculated?

This section should remain available but visually secondary to educational content.

⸻

1. Contribution Layer

Purpose:

Enable community participation.

Available actions:

- Add source

- Add article

- Add video

- Add evidence

- Add relationship

- Suggest corrections

Questions answered:

- How can I help improve this information?

⸻

Video Integration

Videos should not be treated as attachments.

Videos should be first-class knowledge objects.

Examples:

Video
→ discusses → Aluminum

Video
→ demonstrates → Remelting

Video
→ explains → Deposit Systems

Benefits:

- Appears on multiple pages

- Supports educational pathways

- Enables richer recommendations

- Improves graph connectivity

Video cards should include:

- Duration

- Difficulty

- Topic tags

- Key takeaways

Users should be able to understand the value of a video before watching it.

⸻

Relationship Presentation

Relationship trees should be minimized.

Simple parent-child hierarchies do not accurately represent material reality.

Instead of:

Aluminum
└─ Aluminum Foil

Prefer:

Feedstocks
Bauxite

Products
Aluminum Foil
Aluminum Can

Processes
Remelting

Environmental Impacts
Red Mud

Policies
Deposit Systems

This structure aligns more naturally with graph-based discovery.

⸻

Knowledge Feed Principles

Content types should not be siloed.

Users generally care about learning, not media formats.

Instead of:

Articles
Videos
Research

Use:

Knowledge Feed

Filters:

- All

- Beginner

- Advanced

- Recycling

- Composting

- Policy

- Industry

- Community

The system should prioritize relevance over format.

⸻

Long-Term Experience Goal

WasteDB should gradually evolve from:

“Find information about a material.”

to:

“Explore interconnected systems of materials, processes, products, impacts, and solutions.”

Success occurs when users arrive seeking one answer and leave with a broader understanding of how materials interact within environmental, industrial, and social systems.
