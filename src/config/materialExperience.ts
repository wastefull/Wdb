export const MATERIAL_EXPERIENCE_SECTIONS: readonly {
  id: string;
  title: string;
  label: string;
  verb: string;
  enabled?: boolean;
  heading: {
    id: string;
    title: string;
    description: string;
    hasVariables?: boolean;
  };
}[] = [
  {
    id: "material-overview",
    title: "Material Overview",
    label: "Overview",
    verb: "Orient",
    heading: {
      id: "material-overview-heading",
      title: "Material Overview",
      description:
        "What this material is, how WasteDB classifies it, and the current material links that remain available while connected discovery is being prepared.",
    },
  },
  {
    id: "material-intelligence",
    title: "Material Intelligence",
    label: "Intelligence",
    verb: "Decide",
    heading: {
      id: "material-intelligence-heading",
      title: "Material Intelligence",
      description:
        "Current sustainability scores, practical-versus-theoretical comparisons, and the quality signals behind them.",
    },
  },
  {
    id: "key-insights",
    title: "Key Insights",
    label: "Insights",
    verb: "Learn",
    heading: {
      id: "key-insights-heading",
      title: "Key Insights",
      description:
        "Key insights derived from the material, highlighting important findings and trends. Scoped editorial claims drafted from current scores and provenance. They remain non-authoritative until a human editor approves them.",
    },
  },
  {
    id: "recommended-learning",
    title: "Recommended Learning",
    label: "Learning",
    verb: "Apply",
    heading: {
      id: "recommended-learning-heading",
      title: "Recommended Learning",
      description:
        "Starting points from the current article collection. Direct material articles are prioritized before linked-material content; graph-aware educational ranking is not active yet.",
    },
  },
  {
    id: "connected-discovery",
    title: "Connected Discovery",
    label: "Discovery",
    verb: "Explore",
    heading: {
      id: "connected-discovery-heading",
      title: "Connected Discovery",
      description: `Graph contract {} is active, but these sections stay empty until migrated relationships pass reconciliation and read verification.`,
      hasVariables: true,
    },
  },
  {
    id: "deep-research",
    title: "Deep Research",
    label: "Research",
    verb: "Investigate",
    heading: {
      id: "deep-research-heading",
      title: "Deep Research",
      description:
        "Sources, normalized parameters, methodology metadata, attribution, and export access remain available behind the educational summary.",
    },
  },
  {
    id: "material-contribution",
    title: "Material Contribution",
    label: "Contribute",
    verb: "Contribute",
    heading: {
      id: "material-contribution-heading",
      title: "Material Contribution",
      description:
        "Opportunities to contribute to the material, including adding new content, editing existing information, and participating in discussions.",
    },
  },
] as const;

export type ActiveId = (typeof MATERIAL_EXPERIENCE_SECTIONS)[number]["id"];
export function hasMaterialSectionId(id: string): id is ActiveId {
  return MATERIAL_EXPERIENCE_SECTIONS.some((section) => section.id === id);
}

export type MaterialExperienceSectionId =
  (typeof MATERIAL_EXPERIENCE_SECTIONS)[number]["id"];

export function getVisibleMaterialExperienceSections({
  includeDisabled = false,
}: { includeDisabled?: boolean } = {}) {
  return MATERIAL_EXPERIENCE_SECTIONS.filter(
    (section) => includeDisabled || section.enabled !== false,
  );
}

export function getMaterialSectionCardinality(
  id: ActiveId,
  options?: { includeDisabled?: boolean },
): number {
  const index = getVisibleMaterialExperienceSections(options).findIndex(
    (section) => section.id === id,
  );
  return index !== -1 ? index + 1 : 1;
}
