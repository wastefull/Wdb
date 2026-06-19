export const MATERIAL_EXPERIENCE_SECTIONS = [
  { id: "material-overview", label: "Overview" },
  { id: "material-intelligence", label: "Intelligence" },
  { id: "key-insights", label: "Insights" },
  { id: "recommended-learning", label: "Learning" },
  { id: "connected-discovery", label: "Discovery" },
  { id: "deep-research", label: "Research" },
  { id: "material-contribution", label: "Contribute" },
] as const;

export type MaterialExperienceSectionId =
  (typeof MATERIAL_EXPERIENCE_SECTIONS)[number]["id"];
