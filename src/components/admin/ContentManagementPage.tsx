import {
  ArrowLeft,
  GitMerge,
  Link2,
  ListChecks,
  ListVideo,
  ShieldCheck,
  Tags,
} from "lucide-react";
import { useState } from "react";
import { ContentMappingReviewPanel } from "./ContentMappingReviewPanel";
import { ContentMappingPreviewPanel } from "./ContentMappingPreviewPanel";
import { ManualContentMappingPanel } from "./ManualContentMappingPanel";
import { MaterialRelationshipPanel } from "./MaterialRelationshipPanel";
import { VideoMaterialLinkPanel } from "./VideoMaterialLinkPanel";
import { VideoPlaylistPreviewPanel } from "./VideoPlaylistPreviewPanel";
import { VideoTriageReviewPanel } from "./VideoTriageReviewPanel";
import { VideoTopicClassificationPanel } from "./VideoTopicClassificationPanel";

interface ContentManagementPageProps {
  onBack: () => void;
}

const SECTIONS = [
  {
    id: "video-link-management",
    label: "Video Links",
    icon: Link2,
  },
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
    id: "material-relationship-management",
    label: "Material Relationships",
    icon: GitMerge,
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

type ContentManagementSectionId = (typeof SECTIONS)[number]["id"] | "advanced";

export function ContentManagementPage({ onBack }: ContentManagementPageProps) {
  const [activeSection, setActiveSection] = useState<ContentManagementSectionId>(
    "video-link-management",
  );

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
              onClick={() => setActiveSection(id)}
              aria-pressed={activeSection === id}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
                activeSection === id
                  ? "bg-black/5 font-medium dark:bg-white/10"
                  : "hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Icon size={13} className="shrink-0" />
              <span>{label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setActiveSection("advanced")}
            aria-pressed={activeSection === "advanced"}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
              activeSection === "advanced"
                ? "bg-black/5 font-medium dark:bg-white/10"
                : "hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <GitMerge size={13} className="shrink-0" />
            <span>Advanced tools</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="space-y-6">
            {activeSection === "video-link-management" && <VideoMaterialLinkPanel />}
            {activeSection === "manual-content-mapping" && <ManualContentMappingPanel />}
            {activeSection === "content-mapping-review" && <ContentMappingReviewPanel />}
            {activeSection === "material-relationship-management" && (
              <MaterialRelationshipPanel />
            )}
            {activeSection === "video-topic-classification" && (
              <VideoTopicClassificationPanel />
            )}
            {activeSection === "video-playlist-preview" && (
              <VideoPlaylistPreviewPanel />
            )}
            {activeSection === "video-triage-review" && <VideoTriageReviewPanel />}
            {activeSection === "advanced" && (
              <section className="rounded-xl border border-black/10 p-4 dark:border-white/10">
                <p className="mb-4 text-[11px] text-black/50 dark:text-white/50">
                  Bulk preview, quarantine, and checksum-bound apply tools. These
                  are not required for normal manual content mapping.
                </p>
                <ContentMappingPreviewPanel />
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
