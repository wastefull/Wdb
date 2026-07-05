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
    enabled: true, // must stay true
    heading: {
      id: "material-overview-heading",
      title: "Material Overview",
      description:
        "A plain-language introduction to this material, how WasteDB groups it, and the related material links available today.",
    },
  },
  {
    id: "material-intelligence",
    title: "Material Intelligence",
    label: "Intelligence",
    verb: "Decide",
    enabled: false,
    heading: {
      id: "material-intelligence-heading",
      title: "Material Intelligence",
      description:
        "A snapshot of current sustainability scores, how real-world and ideal conditions compare, and how strong the underlying evidence is.",
    },
  },
  {
    id: "key-insights",
    title: "Key Insights",
    label: "Insights",
    verb: "Learn",
    enabled: false,

    heading: {
      id: "key-insights-heading",
      title: "Key Insights",
      description:
        "A short set of takeaways drawn from the current data and sources to help readers quickly understand the most important patterns.",
    },
  },
  {
    id: "recommended-learning",
    title: "Recommended Learning",
    label: "Learning",
    verb: "Apply",
    enabled: true,

    heading: {
      id: "recommended-learning-heading",
      title: "Recommended Learning",
      description:
        "A curated place to start learning more about this material.",
    },
  },
  {
    id: "connected-discovery",
    title: "Connected Discovery",
    label: "Discovery",
    verb: "Explore",
    enabled: false,
    heading: {
      id: "connected-discovery-heading",
      title: "Connected Discovery",
      description: `More ways to explore related materials and ideas are on the way. As this section grows, it will help you discover useful connections across the WasteDB library.`,
      hasVariables: true,
    },
  },
  {
    id: "deep-research",
    title: "Deep Research",
    label: "Research",
    verb: "Investigate",
    enabled: false,
    heading: {
      id: "deep-research-heading",
      title: "Deep Research",
      description:
        "A deeper look at the evidence behind our conclusions about this material, including sources, methodology details, normalized parameters, attribution, and export access.",
    },
  },
  {
    id: "material-contribution",
    title: "Material Contribution",
    label: "Contribute",
    verb: "Contribute",
    enabled: true,
    heading: {
      id: "material-contribution-heading",
      title: "Material Contribution",
      description:
        "Help us improve this page by adding learning content, suggesting corrections, and contributing clearer, more useful information.",
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
