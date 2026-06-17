import type { Article, CategoryType } from "./article";
import type { ConfidenceInterval, Source } from "./material";

export type MaterialGraphAvailability = "available" | "awaiting-graph-data";

export interface MaterialGraphSection<T> {
  availability: MaterialGraphAvailability;
  items: T[];
}

export interface KnowledgeFeedEntry {
  id: string;
  title: string;
  contentType:
    | "article"
    | "guide"
    | "video"
    | "research"
    | "case-study";
  difficulty?: "beginner" | "intermediate" | "advanced";
  summary?: string;
}

export interface RelatedEntityEntry {
  entityId: string;
  entityType: string;
  name: string;
  relationshipGroup: string;
  relationshipType: string;
}

export interface DiscoveryPathEntry {
  id: string;
  title: string;
  entityIds: string[];
  summary?: string;
}

export interface MaterialGraphExperience {
  contractVersion: "stage-5-v1";
  knowledgeFeed: MaterialGraphSection<KnowledgeFeedEntry>;
  relatedEntities: MaterialGraphSection<RelatedEntityEntry>;
  discoveryPaths: MaterialGraphSection<DiscoveryPathEntry>;
}

export interface MaterialLearningItem {
  article: Article;
  category: CategoryType;
  linkedMaterialName?: string;
  linkedMaterialId?: string;
}

export interface MaterialIntelligenceDimension {
  id: CategoryType;
  label: string;
  score: number;
  practicalMean?: number;
  theoreticalMean?: number;
  practicalCI95?: ConfidenceInterval;
  theoreticalCI95?: ConfidenceInterval;
}

export interface MaterialResearchParameter {
  code: string;
  label: string;
  value: number;
}

export interface MaterialResearchParameterGroup {
  id: CategoryType;
  label: string;
  parameters: MaterialResearchParameter[];
}

export interface MaterialExperienceModel {
  intelligence: {
    confidenceLevel?: "High" | "Medium" | "Low";
    sourceCount: number;
    qualityStatus: "reported" | "review-needed" | "unrated";
    qualityMessage: string;
    dimensions: MaterialIntelligenceDimension[];
  };
  keyInsights: string[];
  recommendedLearning: MaterialLearningItem[];
  graph: MaterialGraphExperience;
  research: {
    sources: Source[];
    parameterGroups: MaterialResearchParameterGroup[];
    methodVersion?: string;
    whitepaperVersion?: string;
    calculationTimestamp?: string;
  };
}
