import { useState } from "react";
import { CheckCircle, Loader2, RefreshCw, Tags } from "lucide-react";
import type { ReviewedVideoTopicReport } from "../../types/manualContentMapping";
import * as api from "../../utils/api";

export function VideoTopicClassificationPanel() {
  const [report, setReport] = useState<ReviewedVideoTopicReport | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = async () => {
    setIsPreviewing(true);
    setError(null);
    try {
      setReport(await api.previewReviewedVideoTopics());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsPreviewing(false);
    }
  };

  const apply = async () => {
    if (!report || report.creatable_count === 0) return;
    if (!window.confirm(
      `Apply ${report.creatable_count} topic tag(s) explicitly reviewed during video triage?\n\nThese become active governed tags; automated suggestions and unresolved slugs are excluded.`,
    )) return;
    setIsApplying(true);
    setError(null);
    try {
      setReport(await api.applyReviewedVideoTopics());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <section
      id="video-topic-classification"
      className="retro-card space-y-4 p-6"
      aria-labelledby="video-topic-classification-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Tags className="mt-0.5 size-5 shrink-0" />
          <div>
            <h3 id="video-topic-classification-title" className="font-sniglet text-[16px] normal">
              Reviewed Video Topics
            </h3>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-black/70 dark:text-white/70">
              Reuse only topic tags you explicitly approved during triage.
              Suggestions are never applied automatically, and topic tags stay
              independent from material mappings.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void preview()}
          disabled={isPreviewing || isApplying}
          className="flex items-center gap-2 rounded-lg border border-black/15 px-3 py-2 text-[12px] disabled:opacity-50 dark:border-white/15"
        >
          {isPreviewing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          Preview reviewed topics
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-500/25 bg-red-500/5 p-3 text-[12px] text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      {report && (
        <div className="space-y-3 rounded-xl border border-black/10 p-4 dark:border-white/10">
          <p className="text-[13px]">
            {report.candidate_count} reviewed assignments across {report.governed_topic_count} topics - {report.existing_count} already
            tagged - {report.creatable_count} ready
          </p>
          <p className="text-[11px] text-black/60 dark:text-white/60">
            {report.existing_vocabulary_count} existing governed topic(s); {report.new_topic_count} reviewed topic(s) will be added to the governed vocabulary.
          </p>
          {report.created_count > 0 && (
            <p className="flex items-center gap-2 text-[12px] text-green-700 dark:text-green-300">
              <CheckCircle className="size-4" /> {report.created_count} active topic tag(s) created.
            </p>
          )}
          <button
            type="button"
            onClick={() => void apply()}
            disabled={report.creatable_count === 0 || isApplying}
            className="flex items-center gap-2 rounded-lg bg-waste-science px-4 py-2 text-[12px] text-white disabled:opacity-40"
          >
            {isApplying && <Loader2 className="size-3.5 animate-spin" />}
            Apply reviewed topics ({report.creatable_count})
          </button>
        </div>
      )}
    </section>
  );
}
