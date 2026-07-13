import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Clock3,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import * as api from "../../utils/api";
import { logger } from "../../utils/logger";
import type { MaterialEvidenceScoringSummary } from "../../types/materialExperience";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

type ReviewStatus = "pending" | "validated" | "flagged" | "duplicate";

interface EvidenceScoringPanelProps {
  onBack?: () => void;
}

export function EvidenceScoringPanel({ onBack }: EvidenceScoringPanelProps) {
  const [loading, setLoading] = useState(true);
  const [savingMethodology, setSavingMethodology] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [methodology, setMethodology] = useState({
    version: "",
    description: "",
    updated_at: "",
  });
  const [reviewItems, setReviewItems] = useState<api.EvidenceReviewItem[]>([]);
  const [reviewStatus, setReviewStatus] = useState<"pending" | "all">(
    "pending",
  );
  const [search, setSearch] = useState("");
  const [previewMaterialId, setPreviewMaterialId] = useState("");
  const [previewSummary, setPreviewSummary] =
    useState<MaterialEvidenceScoringSummary | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    void loadPanel();
  }, [reviewStatus]);

  const loadPanel = async () => {
    try {
      setLoading(true);
      const [methodologyData, reviewData] = await Promise.all([
        api.getEvidenceScoringMethodology(),
        api.listEvidenceForScoringReview({ status: reviewStatus, search }),
      ]);
      setMethodology(methodologyData);
      setReviewItems(reviewData.items ?? []);
    } catch (error) {
      logger.error("Failed to load evidence scoring panel:", error);
      toast.error("Failed to load evidence scoring data");
    } finally {
      setLoading(false);
    }
  };

  const refreshReviewItems = async () => {
    try {
      const reviewData = await api.listEvidenceForScoringReview({
        status: reviewStatus,
        search,
      });
      setReviewItems(reviewData.items ?? []);
    } catch (error) {
      logger.error("Failed to refresh evidence review items:", error);
      toast.error("Failed to refresh review queue");
    }
  };

  const handleSaveMethodology = async () => {
    if (!methodology.version.trim()) {
      toast.error("Methodology version is required");
      return;
    }
    if (!methodology.description.trim()) {
      toast.error("Methodology description is required");
      return;
    }

    try {
      setSavingMethodology(true);
      const updated = await api.updateEvidenceScoringMethodology({
        version: methodology.version.trim(),
        description: methodology.description.trim(),
      });
      setMethodology(updated);
      toast.success("Methodology saved");
    } catch (error) {
      logger.error("Failed to save methodology:", error);
      toast.error("Failed to save methodology");
    } finally {
      setSavingMethodology(false);
    }
  };

  const handleReview = async (
    id: string,
    status: ReviewStatus,
  ): Promise<void> => {
    try {
      setReviewingId(id);
      await api.reviewEvidenceValidation(id, status);
      toast.success(
        status === "validated"
          ? "Evidence approved"
          : status === "flagged"
            ? "Evidence flagged"
            : status === "duplicate"
              ? "Evidence marked duplicate"
              : "Evidence returned to pending",
      );
      await refreshReviewItems();
    } catch (error) {
      logger.error("Failed to review evidence:", error);
      toast.error("Failed to update evidence review");
    } finally {
      setReviewingId(null);
    }
  };

  const handlePreviewSummary = async () => {
    if (!previewMaterialId.trim()) {
      toast.error("Enter a material ID to preview");
      return;
    }

    try {
      setPreviewLoading(true);
      const summary = await api.getMaterialEvidenceScoringSummary(
        previewMaterialId.trim(),
      );
      setPreviewSummary(summary);
      if (!summary) {
        toast.info("No approved evidence summary is available yet");
      }
    } catch (error) {
      logger.error("Failed to load scoring summary:", error);
      toast.error("Failed to load score preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to admin dashboard
        </button>
      )}
      <div className="space-y-2">
        <p className="eyebrow">Stage 8</p>
        <h1 className="font-display text-[28px] normal">
          Evidence-Based Scoring
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Review structured observations, keep methodology versions explicit,
          and promote only approved evidence into public scoring summaries.
        </p>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4" aria-hidden="true" />
            Current methodology
          </CardTitle>
          <CardDescription>
            Staff can update the active methodology version without a migration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                Version
              </label>
              <Input
                value={methodology.version}
                onChange={(event) =>
                  setMethodology((current) => ({
                    ...current,
                    version: event.target.value,
                  }))
                }
                placeholder="stage-8-evidence-scoring-v1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                Last updated
              </label>
              <div className="rounded-md border px-3 py-2 text-sm">
                {methodology.updated_at
                  ? new Date(methodology.updated_at).toLocaleString()
                  : "Not recorded"}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-muted-foreground">
              Description
            </label>
            <Textarea
              value={methodology.description}
              onChange={(event) =>
                setMethodology((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={4}
            />
          </div>
          <Button onClick={handleSaveMethodology} disabled={savingMethodology}>
            {savingMethodology ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 size-4" />
            )}
            Save methodology
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock3 className="size-4" aria-hidden="true" />
            Review queue
          </CardTitle>
          <CardDescription>
            Approve, flag, or reset observations without extra ceremony.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search citation, snippet, or parameter"
              className="max-w-sm"
            />
            <select
              value={reviewStatus}
              onChange={(event) =>
                setReviewStatus(event.target.value as "pending" | "all")
              }
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="pending">Pending review</option>
              <option value="all">All statuses</option>
            </select>
            <Button onClick={loadPanel} variant="outline">
              <RefreshCw className="mr-2 size-4" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading evidence records...
            </div>
          ) : reviewItems.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              No evidence records match the current filter.
            </div>
          ) : (
            <div className="space-y-3">
              {reviewItems.map((item) => (
                <div key={item.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{item.parameter_code}</Badge>
                        <Badge variant="secondary">
                          {item.validation_status ?? "pending"}
                        </Badge>
                        <span className="text-sm font-medium">
                          {item.citation}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Material {item.material_id} · {item.raw_value}{" "}
                        {item.raw_unit}
                        {item.methodology_version
                          ? ` · methodology ${item.methodology_version}`
                          : ""}
                      </p>
                      <p className="text-sm leading-6">{item.snippet}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.page_number ? `Page ${item.page_number} · ` : ""}
                        Confidence {item.confidence_level} · Created{" "}
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReview(item.id, "validated")}
                        disabled={reviewingId === item.id}
                      >
                        <CheckCircle2 className="mr-2 size-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReview(item.id, "flagged")}
                        disabled={reviewingId === item.id}
                      >
                        <AlertTriangle className="mr-2 size-4" />
                        Flag
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReview(item.id, "duplicate")}
                        disabled={reviewingId === item.id}
                      >
                        Mark duplicate
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <RefreshCw className="size-4" aria-hidden="true" />
            Score preview
          </CardTitle>
          <CardDescription>
            Smoke-test a material and confirm only approved evidence contributes
            to the public summary.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input
              value={previewMaterialId}
              onChange={(event) => setPreviewMaterialId(event.target.value)}
              placeholder="Material ID"
              className="max-w-sm"
            />
            <Button onClick={handlePreviewSummary} disabled={previewLoading}>
              {previewLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Load preview
            </Button>
          </div>

          {previewSummary ? (
            <div className="grid gap-3 md:grid-cols-3">
              {previewSummary.dimensions.map((dimension) => (
                <div key={dimension.id} className="rounded-lg border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {dimension.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {Math.round(dimension.score)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dimension.observationCount} approved observation
                    {dimension.observationCount === 1 ? "" : "s"}
                  </p>
                </div>
              ))}
              <div className="rounded-lg border p-4 md:col-span-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Methodology metadata
                </p>
                <p className="mt-2 text-sm">
                  Version {previewSummary.methodologyVersion}
                </p>
                <p className="text-sm text-muted-foreground">
                  {previewSummary.approvedObservationCount} approved observation
                  {previewSummary.approvedObservationCount === 1 ? "" : "s"} ·{" "}
                  {previewSummary.validatedParameterCount} validated parameter
                  {previewSummary.validatedParameterCount === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Load a material ID to check the approved-evidence score summary.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
