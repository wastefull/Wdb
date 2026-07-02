import { ArrowLeft, GitMerge, ListChecks, ListVideo } from "lucide-react";
import { ContentMappingPreviewPanel } from "./ContentMappingPreviewPanel";
import { VideoPlaylistPreviewPanel } from "./VideoPlaylistPreviewPanel";
import { VideoTriageReviewPanel } from "./VideoTriageReviewPanel";

interface ContentManagementPageProps {
  onBack: () => void;
}

const SECTIONS = [
  {
    id: "video-playlist-preview",
    label: "YouTube Playlist Preview",
    icon: ListVideo,
  },
  {
    id: "content-mapping-preview",
    label: "Content Mapping Preview",
    icon: GitMerge,
  },
  {
    id: "video-triage-review",
    label: "Private Video Triage",
    icon: ListChecks,
  },
] as const;

export function ContentManagementPage({ onBack }: ContentManagementPageProps) {
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
          <VideoPlaylistPreviewPanel />
          <ContentMappingPreviewPanel />
          <VideoTriageReviewPanel />
        </div>
      </main>
    </div>
  );
}
