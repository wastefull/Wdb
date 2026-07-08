import {
  ArrowLeft,
  GitMerge,
  Link2,
  ListChecks,
  ListVideo,
  ShieldCheck,
  Tags,
} from "lucide-react";
import { ROADMAP_STAGES } from "../../config/roadmap";
import { ContentMappingReviewPanel } from "./ContentMappingReviewPanel";
import { ContentMappingPreviewPanel } from "./ContentMappingPreviewPanel";
import { ManualContentMappingPanel } from "./ManualContentMappingPanel";
import { VideoPlaylistPreviewPanel } from "./VideoPlaylistPreviewPanel";
import { VideoTriageReviewPanel } from "./VideoTriageReviewPanel";
import { VideoTopicClassificationPanel } from "./VideoTopicClassificationPanel";

interface ContentManagementPageProps {
  onBack: () => void;
}

const SECTIONS = [
  {
    id: "manual-content-mapping",
    label: "Create Content Mapping",
    icon: Link2,
  },
  {
    id: "content-mapping-review",
    label: "Review Content Mappings",
    icon: ShieldCheck,
  },
  {
    id: "video-topic-classification",
    label: "Reviewed Video Topics",
    icon: Tags,
  },
  {
    id: "video-playlist-preview",
    label: "YouTube Playlist Preview",
    icon: ListVideo,
  },
  {
    id: "video-triage-review",
    label: "Private Video Triage",
    icon: ListChecks,
  },
] as const;

export function ContentManagementPage({ onBack }: ContentManagementPageProps) {
  const stage7 = ROADMAP_STAGES.find((stage) => stage.number === 7);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex h-full">
      <aside className="w-72 shrink-0 overflow-y-auto border-r border-[#211f1c]/10 p-6 dark:border-white/10">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 flex items-center gap-2 normal transition-opacity hover:opacity-70"
        >
          <ArrowLeft size={16} />
          <span className="font-sniglet text-[14px]">Admin Dashboard</span>
        </button>

        <div className="mb-6 flex items-center gap-2">
          <ListChecks size={20} />
          <h2 className="font-display text-[22px] normal">
            Content Management
          </h2>
        </div>

        <p className="text-[12px] leading-relaxed text-black/60 dark:text-white/60">
          Preview incoming content, review private video candidates, and manage
          graph content mappings.
        </p>

        <nav className="mt-6 space-y-1" aria-label="Content management tools">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              onClick={() => scrollToSection(id)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            >
              <Icon size={13} className="shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {stage7 && (
            <section className="rounded-xl border border-waste-science/25 bg-waste-science/5 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-sniglet text-[13px]">Active roadmap stage</p>
                  <h3 className="mt-1 font-display text-[22px] normal">
                    Stage 7: {stage7.title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-black/70 dark:text-white/70">
                    {stage7.summary}
                  </p>
                </div>
                <div className="flex flex-col gap-2 text-[12px] text-black/60 dark:text-white/60">
                  <span>Reviewed material-to-material relationships</span>
                  <span>Reviewed content-to-material mappings</span>
                  <span>Focused transactional audit coverage</span>
                </div>
              </div>
            </section>
          )}

          <ManualContentMappingPanel />
          <ContentMappingReviewPanel />
          <VideoTopicClassificationPanel />
          <VideoPlaylistPreviewPanel />
          <VideoTriageReviewPanel />
          <details className="rounded-xl border border-black/10 p-4 dark:border-white/10">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-sniglet text-[13px] text-black/65 dark:text-white/65">
              <GitMerge size={15} />
              Advanced: legacy content-mapping migration tools
            </summary>
            <p className="mb-4 mt-2 text-[11px] text-black/50 dark:text-white/50">
              Bulk preview, quarantine, and checksum-bound apply tools. These
              are not required for normal manual content mapping.
            </p>
            <ContentMappingPreviewPanel />
          </details>
        </div>
      </main>
    </div>
  );
}
