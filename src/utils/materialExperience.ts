import type { Material } from "../types/material";
import type {
  MaterialExperienceModel,
  MaterialGraphExperience,
  MaterialKeyInsight,
  MaterialLearningItem,
  MaterialResearchParameter,
} from "../types/materialExperience";

export const EMPTY_MATERIAL_GRAPH_EXPERIENCE: MaterialGraphExperience = {
  contractVersion: "stage-5-v1",
  knowledgeFeed: {
    availability: "awaiting-graph-data",
    items: [],
  },
  relatedEntities: {
    availability: "awaiting-graph-data",
    items: [],
  },
  discoveryPaths: {
    availability: "awaiting-graph-data",
    items: [],
  },
};

function scoreLabel(score: number): string {
  if (score >= 75) return "strong";
  if (score >= 50) return "moderate";
  if (score >= 25) return "limited";
  return "low";
}

function createParameter(
  code: string,
  label: string,
  value: number | undefined,
): MaterialResearchParameter | null {
  return value === undefined ? null : { code, label, value };
}

function compactParameters(
  parameters: Array<MaterialResearchParameter | null>,
): MaterialResearchParameter[] {
  return parameters.filter(
    (parameter): parameter is MaterialResearchParameter => parameter !== null,
  );
}

export function buildMaterialExperienceModel(
  material: Material,
  learningItems: MaterialLearningItem[],
  graph: MaterialGraphExperience = EMPTY_MATERIAL_GRAPH_EXPERIENCE,
): MaterialExperienceModel {
  const dimensions = [
    {
      id: "recyclability" as const,
      label: "Recyclability",
      score: material.recyclability,
      practicalMean: material.CR_practical_mean,
      theoreticalMean: material.CR_theoretical_mean,
      practicalCI95: material.CR_practical_CI95,
      theoreticalCI95: material.CR_theoretical_CI95,
    },
    {
      id: "compostability" as const,
      label: "Compostability",
      score: material.compostability,
      practicalMean: material.CC_practical_mean,
      theoreticalMean: material.CC_theoretical_mean,
      practicalCI95: material.CC_practical_CI95,
      theoreticalCI95: material.CC_theoretical_CI95,
    },
    {
      id: "reusability" as const,
      label: "Reusability",
      score: material.reusability,
      practicalMean: material.RU_practical_mean,
      theoreticalMean: material.RU_theoretical_mean,
      practicalCI95: material.RU_practical_CI95,
      theoreticalCI95: material.RU_theoretical_CI95,
    },
  ];

  const strongestDimension = [...dimensions].sort(
    (left, right) => right.score - left.score,
  )[0];
  const insights: MaterialKeyInsight[] = [
    {
      id: `strongest-${strongestDimension.id}`,
      claim: `${strongestDimension.label} is the strongest current WasteDB dimension at ${Math.round(
        strongestDimension.score,
      )}/100 (${scoreLabel(strongestDimension.score)}).`,
      status: "needs_review",
      scopeNotes:
        "Compares the three current WasteDB score fields only; it is not an absolute material judgment.",
      supportingReferences: [
        {
          type: "score-field",
          id: strongestDimension.id,
          label: `${strongestDimension.label} score`,
        },
      ],
    },
  ];

  const dimensionsWithGaps = dimensions
    .filter(
      (dimension) =>
        dimension.practicalMean !== undefined &&
        dimension.theoreticalMean !== undefined,
    )
    .map((dimension) => ({
      ...dimension,
      gap:
        ((dimension.theoreticalMean ?? 0) -
          (dimension.practicalMean ?? 0)) *
        100,
    }))
    .sort((left, right) => Math.abs(right.gap) - Math.abs(left.gap));

  const largestGap = dimensionsWithGaps[0];
  if (largestGap && Math.abs(largestGap.gap) >= 1) {
    const direction =
      largestGap.gap > 0
        ? "below its theoretical score"
        : "above its theoretical score";
    insights.push({
      id: `practical-gap-${largestGap.id}`,
      claim: `${largestGap.label}'s practical score is ${Math.abs(
        largestGap.gap,
      ).toFixed(0)} points ${direction}.`,
      status: "needs_review",
      scopeNotes:
        "The practical and theoretical values depend on the current model version, geography, infrastructure, and material condition.",
      supportingReferences: [
        {
          type: "score-field",
          id: `${largestGap.id}-practical`,
          label: `${largestGap.label} practical mean`,
        },
        {
          type: "score-field",
          id: `${largestGap.id}-theoretical`,
          label: `${largestGap.label} theoretical mean`,
        },
      ],
    });
  } else {
    insights.push({
      id: "practical-gap-unavailable",
      claim:
        "A practical-versus-theoretical comparison is not yet available for this material.",
      status: "needs_review",
      scopeNotes:
        "This is a missing-data statement, not a conclusion about real-world performance.",
      supportingReferences: [
        {
          type: "score-field",
          id: "practical-theoretical-availability",
          label: "Practical and theoretical score fields",
        },
      ],
    });
  }

  const sourceCount = material.sources?.length ?? 0;
  const confidenceLevel = material.confidence_level;
  const qualityStatus =
    !confidenceLevel
      ? ("unrated" as const)
      : (confidenceLevel === "High" && sourceCount < 3) ||
          (confidenceLevel === "Medium" && sourceCount < 2)
        ? ("review-needed" as const)
        : ("reported" as const);
  const qualityMessage =
    qualityStatus === "unrated"
      ? "Confidence has not been rated for this material."
      : qualityStatus === "review-needed"
        ? `${confidenceLevel} confidence is reported with ${sourceCount} citation${
            sourceCount === 1 ? "" : "s"
          }; this record should be reviewed against the current citation threshold.`
        : confidenceLevel === "Low"
          ? "This record is explicitly marked low confidence."
          : `Reported ${confidenceLevel?.toLowerCase() ?? "unrated"} confidence is accompanied by ${sourceCount} citation${
              sourceCount === 1 ? "" : "s"
            }.`;

  insights.push({
    id: "confidence-and-sources",
    claim: confidenceLevel
      ? `This record reports ${confidenceLevel.toLowerCase()} confidence and lists ${sourceCount} cited source${
          sourceCount === 1 ? "" : "s"
        }.`
      : `Confidence has not been rated; ${sourceCount} cited source${
          sourceCount === 1 ? " is" : "s are"
        } currently listed.`,
    status: "needs_review",
    confidence: confidenceLevel,
    scopeNotes:
      "A confidence label and citation count do not by themselves establish evidence quality or applicability.",
    supportingReferences: [
      {
        type: "score-field",
        id: "confidence_level",
        label: "Material confidence level",
      },
      ...((material.sources ?? []).map((source, index) => ({
        type: "source" as const,
        id: source.doi ?? source.url ?? `source-${index + 1}`,
        label: source.title,
      }))),
    ],
  });

  const recommendedLearning = learningItems
    .filter(
      ({ article }) =>
        article.status !== "draft" && article.status !== "archived",
    )
    .sort((left, right) => {
      const leftDirect = left.linkedMaterialId ? 0 : 1;
      const rightDirect = right.linkedMaterialId ? 0 : 1;
      if (leftDirect !== rightDirect) return rightDirect - leftDirect;

      const leftPublished = left.article.status === "published" ? 1 : 0;
      const rightPublished = right.article.status === "published" ? 1 : 0;
      if (leftPublished !== rightPublished) {
        return rightPublished - leftPublished;
      }

      return (
        new Date(right.article.dateAdded).getTime() -
        new Date(left.article.dateAdded).getTime()
      );
    })
    .slice(0, 3);

  const sharedMaturity = createParameter(
    "M",
    "Infrastructure maturity",
    material.M_value,
  );

  return {
    intelligence: {
      confidenceLevel,
      sourceCount,
      qualityStatus,
      qualityMessage,
      dimensions,
    },
    keyInsights: insights,
    recommendedLearning,
    graph,
    research: {
      sources: material.sources ?? [],
      parameterGroups: [
        {
          id: "recyclability",
          label: "Recyclability parameters",
          parameters: compactParameters([
            createParameter("Y", "Recovery yield", material.Y_value),
            createParameter("D", "Quality retention", material.D_value),
            createParameter(
              "C",
              "Contamination tolerance",
              material.C_value,
            ),
            sharedMaturity,
            createParameter("E", "Energy demand", material.E_value),
          ]),
        },
        {
          id: "compostability",
          label: "Compostability parameters",
          parameters: compactParameters([
            createParameter("B", "Biodegradation rate", material.B_value),
            createParameter("N", "Nutrient balance", material.N_value),
            createParameter("T", "Toxicity and residue", material.T_value),
            createParameter("H", "Habitat adaptability", material.H_value),
            sharedMaturity,
          ]),
        },
        {
          id: "reusability",
          label: "Reusability parameters",
          parameters: compactParameters([
            createParameter("L", "Functional lifetime", material.L_value),
            createParameter("R", "Repairability", material.R_value),
            createParameter("U", "Upgradability", material.U_value),
            createParameter(
              "C-RU",
              "Contamination susceptibility",
              material.C_RU_value,
            ),
            sharedMaturity,
          ]),
        },
      ],
      attribution: {
        writerName: material.writer_name,
        editorName: material.editor_name,
        wikiSourceUrl: material.wiki?.sourceUrl,
        wikiSourceRevisionId: material.wiki?.sourceRevisionId,
        imageAttributionText: material.wiki?.imageAttributionText,
        imageLicenseName: material.wiki?.imageLicenseName,
        imageLicenseUrl: material.wiki?.imageLicenseUrl,
      },
      methodVersion: material.method_version,
      whitepaperVersion: material.whitepaper_version,
      calculationTimestamp: material.calculation_timestamp,
    },
  };
}
