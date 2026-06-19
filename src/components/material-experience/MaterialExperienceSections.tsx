import {
  AlertTriangle,
  BookOpen,
  Database,
  Download,
  ExternalLink,
  FilePlus2,
  FlaskConical,
  Library,
  Network,
  Pencil,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import type { CategoryType } from "../../types/article";
import type { Material } from "../../types/material";
import type {
  MaterialExperienceModel,
  MaterialGraphSection,
  MaterialInsightStatus,
} from "../../types/materialExperience";
import { MATERIAL_EXPERIENCE_SECTIONS } from "../../config/materialExperience";
import { RasterizedQuantileVisualization } from "../charts/RasterizedQuantileVisualization";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

const CATEGORY_LABELS: Record<CategoryType, string> = {
  recyclability: "Recyclability",
  compostability: "Compostability",
  reusability: "Reusability",
};

const CATEGORY_COLORS: Record<CategoryType, string> = {
  recyclability: "#e4e3ac",
  compostability: "#e6beb5",
  reusability: "#b8c8cb",
};

function formatPercentage(value?: number): string {
  return value === undefined ? "Not recorded" : `${(value * 100).toFixed(1)}%`;
}

function formatConfidenceInterval(interval?: {
  lower: number;
  upper: number;
}): string {
  return interval
    ? `${(interval.lower * 100).toFixed(1)}%–${(interval.upper * 100).toFixed(
        1,
      )}%`
    : "Not recorded";
}

interface MaterialExperienceSectionsProps {
  material: Material;
  model: MaterialExperienceModel;
  articleCounts: Record<CategoryType, number>;
  onViewArticles: (category: CategoryType) => void;
  onReadArticle: (
    articleId: string,
    category: CategoryType,
    materialId?: string,
  ) => void;
  onViewMaterial?: (materialId: string) => void;
  onOpenScienceHub: () => void;
  onOpenExport: () => void;
  onOpenScientificEditor?: () => void;
  onOpenSourceLibrary?: () => void;
  onOpenEvidenceLab?: () => void;
  onSuggestEdit?: () => void;
  canSuggestEdit: boolean;
  isAdminModeActive?: boolean;
  learningLibrary: ReactNode;
}

function SectionHeading({
  id,
  eyebrow,
  title,
  description,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="section-heading">
      <p>{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function MaterialIntelligenceSection({
  material,
  model,
  articleCounts,
  onViewArticles,
}: Pick<
  MaterialExperienceSectionsProps,
  "material" | "model" | "articleCounts" | "onViewArticles"
>) {
  return (
    <section
      id={MATERIAL_EXPERIENCE_SECTIONS[1].id}
      aria-labelledby="material-intelligence-heading"
      tabIndex={-1}
    >
      <SectionHeading
        id="material-intelligence-heading"
        eyebrow="2 · Decide"
        title="Material Intelligence"
        description="Current sustainability scores, practical-versus-theoretical comparisons, and the quality signals behind them."
      />

      <div className="quality" aria-label="Data quality summary">
        <Badge variant="outline">
          <ShieldCheck aria-hidden="true" />
          Confidence: {model.intelligence.confidenceLevel ?? "Not rated"}
        </Badge>
        <Badge variant="outline">
          {model.intelligence.sourceCount} cited source
          {model.intelligence.sourceCount === 1 ? "" : "s"}
        </Badge>
      </div>
      <div
        className={`review-check ${
          model.intelligence.qualityStatus === "review-needed"
            ? "needs-review"
            : "reviewed"
        }`}
      >
        {model.intelligence.qualityStatus === "review-needed" ? (
          <AlertTriangle aria-hidden="true" />
        ) : (
          <ShieldCheck aria-hidden="true" />
        )}
        <p>{model.intelligence.qualityMessage}</p>
      </div>

      <div className="score-cards">
        {model.intelligence.dimensions.map((dimension) => (
          <Card key={dimension.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{dimension.label}</CardTitle>
                  <CardDescription>Current score</CardDescription>
                </div>
                <span aria-label={`${dimension.score} out of 100`}>
                  {Math.round(dimension.score)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <RasterizedQuantileVisualization
                materialId={material.id}
                scoreType={dimension.id}
                data={{
                  practical_mean: dimension.practicalMean,
                  theoretical_mean: dimension.theoreticalMean,
                  practical_CI95: dimension.practicalCI95,
                  theoretical_CI95: dimension.theoreticalCI95,
                  confidence_level: model.intelligence.confidenceLevel,
                  category: material.category,
                }}
                fallbackScore={dimension.score}
                simplified={
                  dimension.practicalMean === undefined ||
                  dimension.theoreticalMean === undefined
                }
                height={56}
                onClick={() => onViewArticles(dimension.id)}
                articleCount={articleCounts[dimension.id]}
                showScores
              />
              <dl>
                <div>
                  <dt>Practical mean</dt>
                  <dd>{formatPercentage(dimension.practicalMean)}</dd>
                </div>
                <div>
                  <dt>Theoretical mean</dt>
                  <dd>{formatPercentage(dimension.theoreticalMean)}</dd>
                </div>
                <div>
                  <dt>Practical 95% CI</dt>
                  <dd>{formatConfidenceInterval(dimension.practicalCI95)}</dd>
                </div>
                <div>
                  <dt>Theoretical 95% CI</dt>
                  <dd>{formatConfidenceInterval(dimension.theoreticalCI95)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function KeyInsightsSection({
  insights,
}: {
  insights: MaterialExperienceModel["keyInsights"];
}) {
  const statusLabels: Record<MaterialInsightStatus, string> = {
    draft: "Draft",
    needs_review: "Needs review",
    approved: "Approved",
    rejected: "Rejected",
    needs_update: "Needs update",
  };

  return (
    <section
      id={MATERIAL_EXPERIENCE_SECTIONS[2].id}
      aria-labelledby="key-insights-heading"
      tabIndex={-1}
    >
      <SectionHeading
        id="key-insights-heading"
        eyebrow="3 · Understand"
        title="Key Insights"
        description="Scoped editorial claims drafted from current scores and provenance. They remain non-authoritative until a human editor approves them."
      />
      <Card className="border-[1.5px] border-[#211f1c]/25 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--waste-recycle)_22%,transparent),color-mix(in_oklch,var(--waste-reuse)_12%,transparent))] shadow-none dark:border-white/20">
        <CardContent className="pt-6">
          <ul className="grid gap-4 md:grid-cols-3">
            {insights.map((insight) => (
              <li
                key={insight.id}
                className="flex items-start gap-3 text-sm leading-6"
              >
                <Sparkles
                  className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300"
                  aria-hidden="true"
                />
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {statusLabels[insight.status]}
                    </Badge>
                    {insight.confidence && (
                      <Badge variant="outline">
                        Confidence: {insight.confidence}
                      </Badge>
                    )}
                  </div>
                  <p>{insight.claim}</p>
                  {insight.scopeNotes && (
                    <p className="text-xs text-muted-foreground">
                      Scope: {insight.scopeNotes}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Supports:{" "}
                    {insight.supportingReferences
                      .map((reference) => reference.label)
                      .join(", ")}
                  </p>
                  {insight.reviewer && insight.reviewedAt && (
                    <p className="text-xs text-muted-foreground">
                      Reviewed by {insight.reviewer} on{" "}
                      {formatTimestamp(insight.reviewedAt)}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}

function RecommendedLearningSection({
  model,
  onReadArticle,
  onViewMaterial,
}: Pick<
  MaterialExperienceSectionsProps,
  "model" | "onReadArticle" | "onViewMaterial"
>) {
  return (
    <section
      id={MATERIAL_EXPERIENCE_SECTIONS[3].id}
      aria-labelledby="recommended-learning-heading"
      tabIndex={-1}
    >
      <SectionHeading
        id="recommended-learning-heading"
        eyebrow="4 · Learn"
        title="Recommended Learning"
        description="Starting points from the current article collection. Direct material articles are prioritized before linked-material content; graph-aware educational ranking is not active yet."
      />

      {model.recommendedLearning.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          {model.recommendedLearning.map(
            ({ article, category, linkedMaterialId, linkedMaterialName }) => (
              <Card
                key={`${category}-${article.id}-${linkedMaterialId ?? "direct"}`}
                className="h-full border-[1.5px] border-[#211f1c]/25 shadow-none dark:border-white/20"
              >
                <CardHeader>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      style={{ backgroundColor: CATEGORY_COLORS[category] }}
                      className="text-black"
                    >
                      {CATEGORY_LABELS[category]}
                    </Badge>
                    <Badge variant="outline">{article.article_type}</Badge>
                  </div>
                  <CardTitle className="mt-3 text-base leading-6">
                    <button
                      type="button"
                      onClick={() =>
                        onReadArticle(article.id, category, linkedMaterialId)
                      }
                      className="text-left hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {article.title}
                    </button>
                  </CardTitle>
                  {linkedMaterialName && linkedMaterialId && onViewMaterial && (
                    <CardDescription>
                      From{" "}
                      <button
                        type="button"
                        onClick={() => onViewMaterial(linkedMaterialId)}
                        className="underline hover:text-foreground"
                      >
                        {linkedMaterialName}
                      </button>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onReadArticle(article.id, category, linkedMaterialId)
                    }
                  >
                    <BookOpen className="size-4" aria-hidden="true" />
                    Start reading
                  </Button>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      ) : (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex items-start gap-3 pt-6">
            <Library className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">
                No learning content is published yet.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Contribution options below remain available for the current
                material.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function GraphEmptyState({
  title,
  description,
  icon,
  section,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  section: MaterialGraphSection<unknown>;
}) {
  const isAwaitingGraph = section.availability === "awaiting-graph-data";

  return (
    <Card className="border-dashed shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full border bg-muted/50">
            {icon}
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <Badge variant="outline" className="mt-2">
              {isAwaitingGraph ? "Awaiting verified graph data" : "Available"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground" role="status">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function GraphDiscoverySection({
  graph,
}: {
  graph: MaterialExperienceModel["graph"];
}) {
  return (
    <section
      id={MATERIAL_EXPERIENCE_SECTIONS[4].id}
      aria-labelledby="connected-discovery-heading"
      tabIndex={-1}
    >
      <SectionHeading
        id="connected-discovery-heading"
        eyebrow="5 · Explore"
        title="Connected Discovery"
        description={`Graph contract ${graph.contractVersion} is active, but these sections stay empty until migrated relationships pass reconciliation and read verification.`}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <GraphEmptyState
          title="Knowledge Feed"
          description="Graph-ranked content is not available yet for this material. Existing articles, metrics, and evidence remain available elsewhere on this page."
          icon={<Library className="size-4" aria-hidden="true" />}
          section={graph.knowledgeFeed}
        />
        <GraphEmptyState
          title="Related Entities"
          description="Related-entity discovery is not available yet for this material. This does not mean that no relationships exist."
          icon={<Network className="size-4" aria-hidden="true" />}
          section={graph.relatedEntities}
        />
        <GraphEmptyState
          title="Discovery Paths"
          description="Discovery paths are not available yet for this material. Existing articles, metrics, and evidence are still shown below."
          icon={<Route className="size-4" aria-hidden="true" />}
          section={graph.discoveryPaths}
        />
      </div>
    </section>
  );
}

function formatTimestamp(timestamp?: string): string | null {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}

function DeepResearchSection({
  model,
  onOpenScienceHub,
  onOpenExport,
  onOpenScientificEditor,
  onOpenSourceLibrary,
  onOpenEvidenceLab,
  isAdminModeActive,
}: Pick<
  MaterialExperienceSectionsProps,
  | "model"
  | "onOpenScienceHub"
  | "onOpenExport"
  | "onOpenScientificEditor"
  | "onOpenSourceLibrary"
  | "onOpenEvidenceLab"
  | "isAdminModeActive"
>) {
  const hasParameters = model.research.parameterGroups.some(
    (group) => group.parameters.length > 0,
  );
  const calculatedOn = formatTimestamp(model.research.calculationTimestamp);
  const attribution = model.research.attribution;

  return (
    <section
      id={MATERIAL_EXPERIENCE_SECTIONS[5].id}
      aria-labelledby="deep-research-heading"
      tabIndex={-1}
    >
      <SectionHeading
        id="deep-research-heading"
        eyebrow="6 · Verify"
        title="Deep Research"
        description="Sources, normalized parameters, methodology metadata, attribution, and export access remain available behind the educational summary."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="size-4" aria-hidden="true" />
              Sources and provenance
            </CardTitle>
            <CardDescription>
              {model.research.sources.length} source
              {model.research.sources.length === 1 ? "" : "s"} attached to this
              record
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {model.research.sources.length > 0 ? (
              <ol className="space-y-3">
                {model.research.sources.map((source, index) => {
                  const sourceUrl = source.doi
                    ? source.doi.startsWith("http://") ||
                      source.doi.startsWith("https://")
                      ? source.doi
                      : `https://doi.org/${source.doi}`
                    : source.url;
                  return (
                    <li
                      key={`${source.title}-${index}`}
                      className="border-l-2 border-blue-300 pl-3 text-sm dark:border-blue-700"
                    >
                      <p className="font-medium">
                        [{index + 1}] {source.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[source.authors, source.year]
                          .filter(Boolean)
                          .join(" · ") || "Citation details not supplied"}
                      </p>
                      {(source.weight !== undefined ||
                        (source.parameters?.length ?? 0) > 0) && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {source.weight !== undefined &&
                            `Weight: ${source.weight.toFixed(2)}`}
                          {source.weight !== undefined &&
                            (source.parameters?.length ?? 0) > 0 &&
                            " · "}
                          {(source.parameters?.length ?? 0) > 0 &&
                            `Used for: ${source.parameters?.join(", ")}`}
                        </p>
                      )}
                      {sourceUrl && (
                        <a
                          href={sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs underline"
                        >
                          Open source
                          <ExternalLink className="size-3" aria-hidden="true" />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground" role="status">
                No source citations are attached to this material yet.
              </p>
            )}

            {(attribution.writerName || attribution.editorName) && (
              <div className="border-t pt-4 text-sm">
                <p className="font-medium">Content attribution</p>
                <p className="mt-1 text-muted-foreground">
                  {attribution.writerName &&
                    `Written by ${attribution.writerName}`}
                  {attribution.writerName && attribution.editorName && " · "}
                  {attribution.editorName &&
                    `Edited by ${attribution.editorName}`}
                </p>
              </div>
            )}

            {attribution.wikiSourceUrl && (
              <div className="border-t pt-4 text-sm">
                <p className="font-medium">Wikimedia attribution</p>
                <a
                  href={attribution.wikiSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-muted-foreground underline hover:text-foreground"
                >
                  Source article
                  {attribution.wikiSourceRevisionId
                    ? ` · revision ${attribution.wikiSourceRevisionId}`
                    : ""}
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
                {attribution.imageAttributionText && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Image: {attribution.imageAttributionText}
                  </p>
                )}
                {attribution.imageLicenseName && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    License:{" "}
                    {attribution.imageLicenseUrl ? (
                      <a
                        href={attribution.imageLicenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-foreground"
                      >
                        {attribution.imageLicenseName}
                      </a>
                    ) : (
                      attribution.imageLicenseName
                    )}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="size-4" aria-hidden="true" />
              Scientific model
            </CardTitle>
            <CardDescription>
              Normalized parameters and calculation metadata currently stored on
              the material
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {hasParameters ? (
              model.research.parameterGroups.map(
                (group) =>
                  group.parameters.length > 0 && (
                    <div key={group.id}>
                      <h3 className="text-sm font-medium">{group.label}</h3>
                      <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {group.parameters.map((parameter) => (
                          <div
                            key={`${group.id}-${parameter.code}`}
                            className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                          >
                            <dt>
                              {parameter.label} ({parameter.code})
                            </dt>
                            <dd>{parameter.value.toFixed(2)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ),
              )
            ) : (
              <p className="text-sm text-muted-foreground" role="status">
                No normalized scientific parameters are stored yet.
              </p>
            )}

            <dl className="grid gap-2 border-t pt-4 text-sm sm:grid-cols-2">
              <div>
                <dt>Method version</dt>
                <dd>{model.research.methodVersion ?? "Not recorded"}</dd>
              </div>
              <div>
                <dt>Whitepaper version</dt>
                <dd>{model.research.whitepaperVersion ?? "Not recorded"}</dd>
              </div>
              <div>
                <dt>Last calculated</dt>
                <dd>{calculatedOn ?? "Not recorded"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onOpenScienceHub}>
          <FlaskConical className="size-4" aria-hidden="true" />
          Methodology
        </Button>
        <Button type="button" variant="outline" onClick={onOpenExport}>
          <Download className="size-4" aria-hidden="true" />
          Public export
        </Button>
        {isAdminModeActive && onOpenScientificEditor && (
          <Button
            type="button"
            variant="outline"
            onClick={onOpenScientificEditor}
          >
            <Pencil className="size-4" aria-hidden="true" />
            Edit scientific data
          </Button>
        )}
        {isAdminModeActive && onOpenSourceLibrary && (
          <Button type="button" variant="outline" onClick={onOpenSourceLibrary}>
            <Database className="size-4" aria-hidden="true" />
            Source library
          </Button>
        )}
        {isAdminModeActive && onOpenEvidenceLab && (
          <Button type="button" variant="outline" onClick={onOpenEvidenceLab}>
            <ShieldCheck className="size-4" aria-hidden="true" />
            Evidence Lab
          </Button>
        )}
      </div>
    </section>
  );
}

function ContributionSection({
  onViewArticles,
  onSuggestEdit,
  canSuggestEdit,
  isAdminModeActive,
}: Pick<
  MaterialExperienceSectionsProps,
  "onViewArticles" | "onSuggestEdit" | "canSuggestEdit" | "isAdminModeActive"
>) {
  return (
    <section
      id={MATERIAL_EXPERIENCE_SECTIONS[6].id}
      aria-labelledby="contribution-heading"
      tabIndex={-1}
    >
      <SectionHeading
        id="contribution-heading"
        eyebrow="7 · Contribute"
        title="Help Improve This Material"
        description="Use the existing contribution workflows to add learning content or correct the current record."
      />
      <Card className="shadow-none">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <div>
            <h3 className="flex items-center gap-2 font-medium">
              <FilePlus2 className="size-4" aria-hidden="true" />
              Add learning content
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Submit an article through one of the current sustainability
              categories.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(Object.keys(CATEGORY_LABELS) as CategoryType[]).map(
                (category) => (
                  <Button
                    key={category}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onViewArticles(category)}
                  >
                    {CATEGORY_LABELS[category]}
                  </Button>
                ),
              )}
            </div>
          </div>
          <div>
            <h3 className="flex items-center gap-2 font-medium">
              <Pencil className="size-4" aria-hidden="true" />
              Correct the record
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {canSuggestEdit
                ? "Suggest corrections to the overview, links, or attribution."
                : "Sign in to suggest corrections. Public reading and export remain available without an account."}
            </p>
            {canSuggestEdit && onSuggestEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={onSuggestEdit}
              >
                <Pencil className="size-4" aria-hidden="true" />
                {isAdminModeActive ? "Edit material" : "Suggest correction"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function MaterialExperienceSections({
  material,
  model,
  articleCounts,
  onViewArticles,
  onReadArticle,
  onViewMaterial,
  onOpenScienceHub,
  onOpenExport,
  onOpenScientificEditor,
  onOpenSourceLibrary,
  onOpenEvidenceLab,
  onSuggestEdit,
  canSuggestEdit,
  isAdminModeActive,
  learningLibrary,
}: MaterialExperienceSectionsProps) {
  return (
    <div className="space-y-12">
      <MaterialIntelligenceSection
        material={material}
        model={model}
        articleCounts={articleCounts}
        onViewArticles={onViewArticles}
      />
      <KeyInsightsSection insights={model.keyInsights} />
      <RecommendedLearningSection
        model={model}
        onReadArticle={onReadArticle}
        onViewMaterial={onViewMaterial}
      />
      {learningLibrary}
      <GraphDiscoverySection graph={model.graph} />
      <DeepResearchSection
        model={model}
        onOpenScienceHub={onOpenScienceHub}
        onOpenExport={onOpenExport}
        onOpenScientificEditor={onOpenScientificEditor}
        onOpenSourceLibrary={onOpenSourceLibrary}
        onOpenEvidenceLab={onOpenEvidenceLab}
        isAdminModeActive={isAdminModeActive}
      />
      <ContributionSection
        onViewArticles={onViewArticles}
        onSuggestEdit={onSuggestEdit}
        canSuggestEdit={canSuggestEdit}
        isAdminModeActive={isAdminModeActive}
      />
    </div>
  );
}
