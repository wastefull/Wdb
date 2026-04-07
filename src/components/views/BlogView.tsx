import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  List,
  Newspaper,
  Save,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "../../contexts/AuthContext";
import { BlogPost, ChangelogEntry } from "../../types/blog";
import {
  deleteChangelogEntry,
  getChangelogEntries,
  getPublishedPosts,
  upsertChangelogEntry,
} from "../../utils/blog";
import { logger } from "../../utils/logger";
import { Textarea } from "../ui/textarea";
import { PageTemplate } from "../shared/PageTemplate";

interface BlogViewProps {
  onBack: () => void;
}

type BlogSubtab = "posts" | "changelog";

function getTodayDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function BlogView({ onBack }: BlogViewProps) {
  const { userRole } = useAuthContext();
  const isAdmin = userRole === "admin";

  const [activeTab, setActiveTab] = useState<BlogSubtab>("changelog");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [changelogEntries, setChangelogEntries] = useState<ChangelogEntry[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChangelogDate, setSelectedChangelogDate] = useState(
    getTodayDateInputValue(),
  );
  const [changelogDraft, setChangelogDraft] = useState("");
  const [isSavingChangelog, setIsSavingChangelog] = useState(false);
  const [isDeletingChangelog, setIsDeletingChangelog] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const selectedEntry = changelogEntries.find(
      (entry) => entry.entry_date === selectedChangelogDate,
    );

    setChangelogDraft(
      selectedEntry
        ? selectedEntry.items.map((item) => `- ${item}`).join("\n")
        : "",
    );
  }, [changelogEntries, isAdmin, selectedChangelogDate]);

  const loadContent = async () => {
    setIsLoading(true);
    try {
      const [publishedPosts, publishedChangelog] = await Promise.all([
        getPublishedPosts(),
        getChangelogEntries(),
      ]);
      setPosts(publishedPosts);
      setChangelogEntries(publishedChangelog);
    } catch (error) {
      logger.error("Failed to load blog content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatChangelogDate = (dateString: string) => {
    return new Date(`${dateString}T12:00:00Z`).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      News: "tag-yellow",
      Tutorial: "tag-blue",
      "Case Study": "tag-green",
      Research: "tag-purple",
      Community: "tag-pink",
      "Product Update": "tag-orange",
    };
    return colors[category] || "tag-gray";
  };

  const getDraftItems = () => {
    return changelogDraft
      .split("\n")
      .map((line) => line.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean);
  };

  const selectedChangelogEntry =
    changelogEntries.find(
      (entry) => entry.entry_date === selectedChangelogDate,
    ) || null;

  const handleSaveChangelog = async () => {
    const items = getDraftItems();

    if (items.length === 0) {
      toast.error("Add at least one bullet before saving");
      return;
    }

    setIsSavingChangelog(true);
    try {
      const savedEntry = await upsertChangelogEntry(selectedChangelogDate, {
        items,
      });

      if (!savedEntry) {
        throw new Error("No changelog entry returned from API");
      }

      setChangelogEntries((currentEntries) =>
        [
          savedEntry,
          ...currentEntries.filter((entry) => entry.id !== savedEntry.id),
        ].sort((left, right) =>
          right.entry_date.localeCompare(left.entry_date),
        ),
      );
      setChangelogDraft(savedEntry.items.map((item) => `- ${item}`).join("\n"));
      toast.success("Changelog updated");
    } catch (error) {
      logger.error("Failed to save changelog entry:", error);
      toast.error("Failed to save changelog entry");
    } finally {
      setIsSavingChangelog(false);
    }
  };

  const handleDeleteChangelog = async () => {
    if (!selectedChangelogEntry) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete changelog for ${formatChangelogDate(selectedChangelogDate)}?`,
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeletingChangelog(true);
    try {
      const didDelete = await deleteChangelogEntry(selectedChangelogDate);
      if (!didDelete) {
        throw new Error("Delete request returned false");
      }

      setChangelogEntries((currentEntries) =>
        currentEntries.filter(
          (entry) => entry.id !== selectedChangelogEntry.id,
        ),
      );
      setChangelogDraft("");
      toast.success("Changelog day removed");
    } catch (error) {
      logger.error("Failed to delete changelog entry:", error);
      toast.error("Failed to delete changelog entry");
    } finally {
      setIsDeletingChangelog(false);
    }
  };

  const renderPosts = () => {
    if (posts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Newspaper
            size={48}
            className="mb-4 text-black/20 dark:text-white/20"
          />
          <h3 className="text-[16px] font-display mb-2 text-black dark:text-white">
            No blog posts yet
          </h3>
          <p className="text-[13px] text-black/60 dark:text-white/60 max-w-md">
            Blog posts will appear here once published by the WasteDB team.
            Check back soon for updates and insights.
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-4">
          {posts.map((post) => (
            <button
              key={post.id}
              className="retro-card-button w-full p-6 text-left"
              onClick={() => {
                logger.log("Navigate to blog post:", post.slug);
              }}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-[11px] text-black/60 dark:text-white/60">
                  <Calendar size={14} />
                  <span>
                    {formatDate(post.published_at || post.created_at)}
                  </span>
                  <span className="mx-2">•</span>
                  <User size={14} />
                  <span>{post.author_name || "WasteDB Team"}</span>
                  {post.reading_time_minutes && (
                    <>
                      <span className="mx-2">•</span>
                      <Clock size={14} />
                      <span>{post.reading_time_minutes} min read</span>
                    </>
                  )}
                </div>

                <h3 className="text-[18px] font-display text-black dark:text-white">
                  {post.title}
                </h3>

                <p className="text-[13px] text-black/70 dark:text-white/70">
                  {post.excerpt}
                </p>

                <div className="flex gap-2 flex-wrap">
                  <span className={getCategoryColor(post.category)}>
                    {post.category}
                  </span>
                  {post.tags?.slice(0, 3).map((tag) => (
                    <span key={tag} className="tag-gray">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 p-4 border border-[#211f1c]/20 dark:border-white/20 rounded-lg">
          <p className="text-[12px] text-black/60 dark:text-white/60">
            <Newspaper size={16} className="inline-block mr-2" />
            Blog posts are published by the WasteDB admin team and cover news,
            updates, and longer-form insights about the platform and waste
            management in general.
          </p>
        </div>
      </>
    );
  };

  const renderChangelog = () => {
    return (
      <>
        {isAdmin && (
          <div className="mb-4 rounded-lg border border-[#211f1c]/20 bg-white/70 p-4 dark:border-white/20 dark:bg-white/5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <label className="block md:w-48">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-black/50 dark:text-white/50">
                  Entry Date
                </span>
                <input
                  type="date"
                  value={selectedChangelogDate}
                  onChange={(event) =>
                    setSelectedChangelogDate(event.target.value)
                  }
                  className="w-full rounded-md border border-[#211f1c]/20 bg-white px-3 py-2 text-[13px] text-black outline-none transition focus:border-[#211f1c] dark:border-white/20 dark:bg-[#1f1d1b] dark:text-white dark:focus:border-white"
                  disabled={isSavingChangelog || isDeletingChangelog}
                />
              </label>

              <div className="flex-1">
                <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-black/50 dark:text-white/50">
                  Public Bullets
                </div>
                <Textarea
                  value={changelogDraft}
                  onChange={(event) => setChangelogDraft(event.target.value)}
                  placeholder={
                    "- Added changelog tab\n- Tightened mobile spacing\n- Fixed API auth edge case"
                  }
                  className="min-h-28 bg-white text-[13px] leading-5 dark:bg-[#1f1d1b]"
                  disabled={isSavingChangelog || isDeletingChangelog}
                />
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-[11px] text-black/55 dark:text-white/55">
                One bullet per line. This entry is visible to everyone as soon
                as you save it.
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSaveChangelog}
                  disabled={isSavingChangelog || isDeletingChangelog}
                  className="retro-button h-9 px-4 text-[12px] flex items-center gap-2 disabled:opacity-60"
                >
                  <Save size={14} />
                  <span>{isSavingChangelog ? "Saving..." : "Save Day"}</span>
                </button>

                {selectedChangelogEntry && (
                  <button
                    onClick={handleDeleteChangelog}
                    disabled={isSavingChangelog || isDeletingChangelog}
                    className="retro-button arcade-bg-red arcade-btn-red h-9 px-4 text-[12px] flex items-center gap-2 disabled:opacity-60"
                  >
                    <Trash2 size={14} />
                    <span>
                      {isDeletingChangelog ? "Deleting..." : "Delete Day"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {changelogEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <List size={48} className="mb-4 text-black/20 dark:text-white/20" />
            <h3 className="text-[16px] font-display mb-2 text-black dark:text-white">
              No changelog entries yet
            </h3>
            <p className="text-[13px] text-black/60 dark:text-white/60 max-w-md">
              Daily changelog notes will appear here as the WasteDB admin team
              publishes them.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {changelogEntries.map((entry) => (
              <section
                key={entry.id}
                className="rounded-lg border border-[#211f1c]/20 bg-white/70 px-4 py-3 dark:border-white/20 dark:bg-white/5"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-black dark:text-white">
                    <List size={14} />
                    <h3 className="text-[13px] font-display">
                      {formatChangelogDate(entry.entry_date)}
                    </h3>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-black/45 dark:text-white/45">
                    {entry.items.length} change
                    {entry.items.length === 1 ? "" : "s"}
                  </span>
                </div>

                <ul className="space-y-1 pl-4 text-[12px] leading-5 text-black/75 dark:text-white/75">
                  {entry.items.map((item, index) => (
                    <li key={`${entry.id}-${index}`} className="list-disc">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </>
    );
  };

  if (isLoading) {
    return (
      <PageTemplate
        title="Blog"
        description="Published posts and a compact public changelog from the WasteDB team"
        onBack={onBack}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-2 border-black/20 dark:border-white/20 border-t-black dark:border-t-white rounded-full animate-spin mb-4" />
            <p className="text-[13px] text-black/60 dark:text-white/60">
              Loading blog content...
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Blog"
      description="Published posts and a compact public changelog from the WasteDB team"
      onBack={onBack}
    >
      <div className="mb-6">
        <div className="flex gap-1 md:gap-2 border-b border-[#211f1c]/20 dark:border-white/20 flex-wrap overflow-x-auto">
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-2 md:px-4 py-2 text-[10px] md:text-[12px] transition-colors whitespace-nowrap ${
              activeTab === "posts"
                ? "normal border-b-2 border-[#211f1c] dark:border-white"
                : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab("changelog")}
            className={`px-2 md:px-4 py-2 text-[10px] md:text-[12px] transition-colors whitespace-nowrap ${
              activeTab === "changelog"
                ? "normal border-b-2 border-[#211f1c] dark:border-white"
                : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
            }`}
          >
            Changelog
          </button>
        </div>
      </div>

      {activeTab === "posts" ? renderPosts() : renderChangelog()}
    </PageTemplate>
  );
}
