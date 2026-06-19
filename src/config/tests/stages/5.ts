import { MATERIAL_EXPERIENCE_SECTIONS } from "../../materialExperience";
import type { Article } from "../../../types/article";
import type { Material } from "../../../types/material";
import {
  buildMaterialExperienceModel,
  EMPTY_MATERIAL_GRAPH_EXPERIENCE,
} from "../../../utils/materialExperience";
import type { MaterialLearningItem } from "../../../types/materialExperience";
import type { Test } from "../types";

function createArticle(
  id: string,
  status: Article["status"],
  dateAdded: string,
): Article {
  return {
    id,
    title: `Article ${id}`,
    article_type: "DIY",
    sustainability_category: "recyclability",
    content: { type: "doc", content: [] },
    dateAdded,
    slug: `article-${id}`,
    material_id: "material-stage-5",
    author_id: "author-stage-5",
    created_at: dateAdded,
    updated_at: dateAdded,
    version: 1,
    status,
  };
}

function createMaterial(overrides: Partial<Material> = {}): Material {
  return {
    id: "material-stage-5",
    name: "Stage 5 Test Material",
    category: "Metals",
    description: "A material used to verify the Stage 5 experience contract.",
    recyclability: 82,
    compostability: 14,
    reusability: 61,
    CR_practical_mean: 0.82,
    CR_theoretical_mean: 0.93,
    CR_practical_CI95: { lower: 0.78, upper: 0.86 },
    CR_theoretical_CI95: { lower: 0.9, upper: 0.96 },
    CC_practical_mean: 0.14,
    CC_theoretical_mean: 0.2,
    RU_practical_mean: 0.61,
    RU_theoretical_mean: 0.72,
    Y_value: 0.8,
    B_value: 0.2,
    L_value: 0.7,
    M_value: 0.6,
    confidence_level: "High",
    sources: [
      { title: "Source One", year: 2024, parameters: ["Y_value"] },
      { title: "Source Two", year: 2025, parameters: ["B_value"] },
      { title: "Source Three", year: 2026, parameters: ["L_value"] },
    ],
    writer_name: "Stage Five Writer",
    editor_name: "Stage Five Editor",
    method_version: "CR-v1",
    whitepaper_version: "2026.1",
    calculation_timestamp: "2026-06-17T12:00:00.000Z",
    ...overrides,
  };
}

function pass(message: string) {
  return Promise.resolve({ success: true, message });
}

function fail(message: string) {
  return Promise.resolve({ success: false, message });
}

export function getStage5Tests(): Test[] {
  return [
    {
      id: "stage-5-current-data-contract",
      name: "Current material data survives the experience adapter",
      description:
        "Scores, confidence intervals, sources, attribution metadata, scientific parameters, and calculation metadata remain represented.",
      phase: "stage-5",
      stage: 5,
      category: "Material Experience",
      requiresAuth: false,
      testFn: async () => {
        const model = buildMaterialExperienceModel(createMaterial(), []);
        const scores = Object.fromEntries(
          model.intelligence.dimensions.map((dimension) => [
            dimension.id,
            dimension.score,
          ]),
        );
        const parameterCount = model.research.parameterGroups.reduce(
          (total, group) => total + group.parameters.length,
          0,
        );

        if (
          scores.recyclability !== 82 ||
          scores.compostability !== 14 ||
          scores.reusability !== 61
        ) {
          return fail("One or more public sustainability scores were lost.");
        }
        if (
          model.intelligence.dimensions[0].practicalCI95?.lower !== 0.78 ||
          model.research.sources.length !== 3 ||
          parameterCount < 4 ||
          model.research.attribution.writerName !== "Stage Five Writer" ||
          model.research.attribution.editorName !== "Stage Five Editor" ||
          model.research.methodVersion !== "CR-v1" ||
          model.research.whitepaperVersion !== "2026.1"
        ) {
          return fail(
            "Scientific detail, provenance, or calculation metadata was not preserved.",
          );
        }

        return pass(
          "Scores, confidence intervals, sources, attribution, parameters, and calculation metadata are preserved.",
        );
      },
    },
    {
      id: "stage-5-graph-empty-state-contract",
      name: "Graph-dependent sections default to honest empty states",
      description:
        "Knowledge Feed, Related Entities, and Discovery Paths remain unavailable and empty until verified graph data is supplied.",
      phase: "stage-5",
      stage: 5,
      category: "Graph Boundary",
      requiresAuth: false,
      testFn: async () => {
        const model = buildMaterialExperienceModel(createMaterial(), []);
        const sections = [
          model.graph.knowledgeFeed,
          model.graph.relatedEntities,
          model.graph.discoveryPaths,
        ];
        const isHonestEmptyState =
          model.graph.contractVersion === "stage-5-v1" &&
          sections.every(
            (section) =>
              section.availability === "awaiting-graph-data" &&
              section.items.length === 0,
          );

        return isHonestEmptyState
          ? pass("All graph-dependent sections report verified empty states.")
          : fail("A graph-dependent section implied unavailable data exists.");
      },
    },
    {
      id: "stage-5-learning-ranking",
      name: "Recommended learning prioritizes current publishable content",
      description:
        "Direct material content ranks before linked-material content, drafts and archives are excluded, and recommendations remain capped.",
      phase: "stage-5",
      stage: 5,
      category: "Learning",
      requiresAuth: false,
      testFn: async () => {
        const learningItems: MaterialLearningItem[] = [
          {
            article: createArticle(
              "linked-new",
              "published",
              "2026-06-17T00:00:00.000Z",
            ),
            category: "recyclability",
            linkedMaterialId: "linked-material",
            linkedMaterialName: "Linked Material",
          },
          {
            article: createArticle(
              "direct-old",
              "published",
              "2026-06-01T00:00:00.000Z",
            ),
            category: "recyclability",
          },
          {
            article: createArticle(
              "direct-draft",
              "draft",
              "2026-06-18T00:00:00.000Z",
            ),
            category: "recyclability",
          },
          {
            article: createArticle(
              "direct-new",
              "published",
              "2026-06-16T00:00:00.000Z",
            ),
            category: "recyclability",
          },
        ];
        const recommendations = buildMaterialExperienceModel(
          createMaterial(),
          learningItems,
        ).recommendedLearning;
        const ids = recommendations.map(({ article }) => article.id);

        if (
          ids.join(",") !== "direct-new,direct-old,linked-new" ||
          ids.includes("direct-draft") ||
          recommendations.length > 3
        ) {
          return fail(`Unexpected recommendation order: ${ids.join(", ")}`);
        }

        return pass(
          "Direct published content ranks first; drafts are excluded and the cap is enforced.",
        );
      },
    },
    {
      id: "stage-5-missing-data-contract",
      name: "Missing scientific data produces explicit states",
      description:
        "Materials without confidence, sources, parameters, or learning content still produce a complete non-fabricated experience model.",
      phase: "stage-5",
      stage: 5,
      category: "Empty States",
      requiresAuth: false,
      testFn: async () => {
        const model = buildMaterialExperienceModel(
          createMaterial({
            confidence_level: undefined,
            sources: undefined,
            CR_practical_mean: undefined,
            CR_theoretical_mean: undefined,
            CR_practical_CI95: undefined,
            CR_theoretical_CI95: undefined,
            CC_practical_mean: undefined,
            CC_theoretical_mean: undefined,
            RU_practical_mean: undefined,
            RU_theoretical_mean: undefined,
            Y_value: undefined,
            B_value: undefined,
            L_value: undefined,
            M_value: undefined,
            method_version: undefined,
            whitepaper_version: undefined,
            calculation_timestamp: undefined,
          }),
          [],
        );

        const hasParameters = model.research.parameterGroups.some(
          (group) => group.parameters.length > 0,
        );
        if (
          model.intelligence.qualityStatus !== "unrated" ||
          model.intelligence.sourceCount !== 0 ||
          hasParameters ||
          model.recommendedLearning.length !== 0
        ) {
          return fail("Missing data was inferred or represented inaccurately.");
        }

        return pass(
          "Missing confidence, sources, parameters, and learning content remain explicit.",
        );
      },
    },
    {
      id: "stage-5-section-navigation-contract",
      name: "Section navigation has a stable accessible target order",
      description:
        "The material journey exposes unique targets from Overview through Contribution without using application route hashes.",
      phase: "stage-5",
      stage: 5,
      category: "Accessibility",
      requiresAuth: false,
      testFn: async () => {
        const ids = MATERIAL_EXPERIENCE_SECTIONS.map((section) => section.id);
        const expected = [
          "material-overview",
          "material-intelligence",
          "key-insights",
          "recommended-learning",
          "connected-discovery",
          "deep-research",
          "material-contribution",
        ];
        const uniqueIds = new Set(ids);

        if (
          ids.join(",") !== expected.join(",") ||
          uniqueIds.size !== ids.length ||
          ids.some((id) => id.startsWith("#"))
        ) {
          return fail("Section navigation targets are missing, duplicated, or unstable.");
        }

        return pass(
          "Seven unique non-route section targets preserve the educational sequence.",
        );
      },
    },
    {
      id: "stage-5-empty-graph-constant",
      name: "Default graph contract contains no inferred items",
      description:
        "The shared empty adapter exposes no graph items and remains independent of current material data.",
      phase: "stage-5",
      stage: 5,
      category: "Graph Boundary",
      requiresAuth: false,
      testFn: async () => {
        const itemCount =
          EMPTY_MATERIAL_GRAPH_EXPERIENCE.knowledgeFeed.items.length +
          EMPTY_MATERIAL_GRAPH_EXPERIENCE.relatedEntities.items.length +
          EMPTY_MATERIAL_GRAPH_EXPERIENCE.discoveryPaths.items.length;

        return itemCount === 0
          ? pass("The default graph adapter contains zero fabricated items.")
          : fail("The default graph adapter contains graph items.");
      },
    },
  ];
}
