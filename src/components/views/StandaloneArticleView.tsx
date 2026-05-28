import { useState, useEffect } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { Article } from "../../types/article";
import GuideRenderer from "../editor/GuideRenderer";
import { BackArrow, CopyPermalinkButton, LastUpdated } from "../shared";
import { useNavigationContext } from "../../contexts/NavigationContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { ArticleForm } from "../forms";
import * as api from "../../utils/api";

interface StandaloneArticleViewProps {
  article: Article;
  sustainabilityCategory?: { label: string; color: string };
  materialName?: string;
  materialId?: string;
  onBack: () => void;
  onSaveEdit?: (updated: Omit<Article, "id" | "dateAdded">) => void;
  onDelete?: () => void;
  isAdminModeActive?: boolean;
  canManageArticle?: boolean;
}

const categoryKeyFromLabel: Record<
  string,
  "compostability" | "recyclability" | "reusability"
> = {
  Compostability: "compostability",
  Recyclability: "recyclability",
  Reusability: "reusability",
};

export function StandaloneArticleView({
  article,
  sustainabilityCategory,
  materialName,
  materialId,
  onBack,
  onSaveEdit,
  onDelete,
  isAdminModeActive,
  canManageArticle,
}: StandaloneArticleViewProps) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [enriched, setEnriched] = useState<Partial<Article>>({});
  const { navigateTo } = useNavigationContext();

  // Material-embedded articles don't have a standalone KV record, so we
  // resolve the author display name directly from the stored user ID.
  useEffect(() => {
    const authorId = article.created_by || article.author_id;
    if (!authorId) return;

    api
      .getUserProfile(authorId)
      .then((profile) => {
        const name =
          profile?.name || profile?.email?.split("@")[0] || undefined;
        if (name) setEnriched((prev) => ({ ...prev, writer_name: name }));
      })
      .catch(() => {
        /* silent */
      });
  }, [article.created_by, article.author_id]);

  const writerName = enriched.writer_name ?? article.writer_name;
  const editorName = enriched.editor_name ?? article.editor_name;

  const permalink = `${window.location.origin}${window.location.pathname}`;

  const copyPermalink = () => {
    navigator.clipboard.writeText(permalink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTypeClick = () => {
    navigateTo({
      type: "all-articles",
      articleType: article.article_type,
    });
  };

  const handleCategoryClick = () => {
    if (sustainabilityCategory) {
      const cat =
        categoryKeyFromLabel[sustainabilityCategory.label] ??
        article.sustainability_category;
      if (cat) {
        navigateTo({ type: "all-articles", category: cat });
      }
    } else if (article.sustainability_category) {
      navigateTo({
        type: "all-articles",
        category: article.sustainability_category,
      });
    }
  };

  const hasRichContent = article.content && article.content.type === "doc";
  const hasCoverImage = !!article.cover_image_url;
  const canShowArticleActions = !!(
    canManageArticle &&
    (onSaveEdit || onDelete)
  );

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <BackArrow onBack={onBack} className="mt-0.5" />

        <div className="flex-1 min-w-0">
          <h2 className="text-[20px] leading-snug text-black dark:text-white">
            {article.title}
          </h2>
          {writerName && (
            <p className="text-[13px] text-black/60 dark:text-white/60 mt-0.5">
              by{" "}
              {article.created_by || article.author_id ? (
                <button
                  onClick={() =>
                    navigateTo({
                      type: "user-profile",
                      userId: (article.created_by || article.author_id)!,
                    })
                  }
                  className="hover:underline cursor-pointer"
                >
                  {writerName}
                </button>
              ) : (
                writerName
              )}
              {materialName && materialId && (
                <>
                  {" "}
                  in{" "}
                  <button
                    onClick={() =>
                      navigateTo({ type: "material-detail", materialId })
                    }
                    className="hover:underline cursor-pointer"
                  >
                    {materialName}
                  </button>
                </>
              )}{" "}
              {article.updated_at && (
                <LastUpdated
                  date={article.updated_at}
                  className="mt-1"
                  relative
                />
              )}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <button
              onClick={handleTypeClick}
              className="tag-yellow cursor-pointer hover:opacity-80 transition-opacity"
              title={`View all ${article.article_type} articles`}
            >
              {article.article_type}
            </button>
            {sustainabilityCategory && (
              <button
                onClick={handleCategoryClick}
                className="inline-block px-2 py-0.5 rounded-md border border-[#211f1c] dark:border-white/20 text-[9px] text-black cursor-pointer hover:opacity-80 transition-opacity"
                style={{ backgroundColor: sustainabilityCategory.color }}
                title={`View all ${sustainabilityCategory.label} articles`}
              >
                {sustainabilityCategory.label}
              </button>
            )}
            {!sustainabilityCategory && article.sustainability_category && (
              <button
                onClick={handleCategoryClick}
                className="tag-yellow cursor-pointer hover:opacity-80 transition-opacity"
                title={`View all ${article.sustainability_category} articles`}
              >
                {article.sustainability_category}
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0 mt-0.5">
          {canShowArticleActions && (
            <div className="flex gap-2">
              {onSaveEdit && (
                <button
                  onClick={() => setEditing(true)}
                  className="icon-box-sm arcade-bg-amber arcade-btn-amber p-2"
                >
                  <Edit2 size={14} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="icon-box-sm arcade-bg-red arcade-btn-red p-2"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
          <CopyPermalinkButton
            copied={copied}
            onClick={copyPermalink}
            linkType="article"
            compact
          />
        </div>
      </div>

      {/* Inline edit form */}
      {editing && onSaveEdit && (
        <ArticleForm
          article={article}
          onSave={(data) => {
            onSaveEdit(data);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
          isAdminMode={isAdminModeActive}
        />
      )}

      {/* Content card — full width up to 5xl */}
      {!editing && (
        <div className="space-y-6 md:space-y-0 md:flex md:items-stretch md:justify-center md:gap-4">
          {/* Cover Image */}
          {hasCoverImage && (
            <div className="w-full max-w-3xl mx-auto md:mx-0 md:max-w-none md:w-2/5 md:relative md:overflow-hidden md:rounded-lg md:border md:border-[#211f1c] md:dark:border-white/20">
              <img
                src={article.cover_image_url}
                alt={article.title}
                className="w-full h-auto rounded-lg border border-[#211f1c] dark:border-white/20 md:absolute md:inset-0 md:h-full md:w-full md:rounded-none md:border-0 md:object-cover"
              />
            </div>
          )}
          <div
            className={`w-full max-w-3xl mx-auto md:mx-0 md:max-w-none ${
              hasCoverImage ? "md:w-3/5" : "md:w-full"
            }`}
          >
            <div className="retro-card h-full">
              {/* Rich Content (TiptapContent) */}
              {hasRichContent && (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <GuideRenderer content={article.content} />
                </div>
              )}

              {/* No content message */}
              {!hasRichContent && (
                <p className="text-[13px] text-black/60 dark:text-white/60 italic">
                  No content available for this article.
                </p>
              )}

              {/* Footer: date, editor credit, permalink */}
              <div className="pt-4 border-t border-[#211f1c]/20 dark:border-white/20 space-y-1">
                <p className="text-sm text-black/50 dark:text-white/50">
                  Added: {new Date(article.dateAdded).toLocaleDateString()}
                </p>
                {editorName && (
                  <p className="text-sm text-black/40 dark:text-white/40 italic">
                    Edited by {editorName}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black dark:text-white">
              Delete article?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-black/70 dark:text-white/70">
              This will permanently remove "{article.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.();
                setShowDeleteConfirm(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
