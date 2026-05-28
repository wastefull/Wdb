import { Edit2, Trash2 } from "lucide-react";
import { Article, CategoryType } from "../../types/article";
import { useNavigationContext } from "../../contexts/NavigationContext";

export interface ArticleCardProps {
  article: Article;
  onEdit: () => void;
  onDelete: () => void;
  hideActions?: boolean;
  sustainabilityCategory?: { label: string; color: string };
  onReadMore?: () => void;
  isAdminModeActive?: boolean;
  canManageArticle?: boolean;
  linkedMaterialName?: string;
  onViewLinkedMaterial?: () => void;
}

function resolveCategoryForFilter(
  article: Article,
  sustainabilityCategory?: { label: string; color: string },
): CategoryType | undefined {
  if (
    article.sustainability_category === "compostability" ||
    article.sustainability_category === "recyclability" ||
    article.sustainability_category === "reusability"
  ) {
    return article.sustainability_category;
  }

  const label = sustainabilityCategory?.label.toLowerCase();
  if (label?.includes("compost")) return "compostability";
  if (label?.includes("recycl")) return "recyclability";
  if (label?.includes("reuse")) return "reusability";
  return undefined;
}

// Helper to extract plain text preview from TiptapContent
function getContentPreview(article: Article, maxLength: number = 150): string {
  if (
    article.content &&
    article.content.type === "doc" &&
    article.content.content
  ) {
    const extractText = (nodes: any[]): string => {
      return nodes
        .map((node) => {
          if (node.type === "text") return node.text || "";
          if (node.content) return extractText(node.content);
          return "";
        })
        .join(" ");
    };
    const text = extractText(article.content.content).trim();
    if (text) {
      return text.length > maxLength
        ? text.substring(0, maxLength) + "..."
        : text;
    }
  }

  return "No content preview available.";
}

export function ArticleCard({
  article,
  onEdit,
  onDelete,
  hideActions = false,
  sustainabilityCategory,
  onReadMore,
  isAdminModeActive,
  canManageArticle,
  linkedMaterialName,
  onViewLinkedMaterial,
}: ArticleCardProps) {
  const { navigateTo } = useNavigationContext();
  const coverImage = article.cover_image_url;
  const preview = getContentPreview(article);
  const categoryForFilter = resolveCategoryForFilter(
    article,
    sustainabilityCategory,
  );

  return (
    <div className="bg-white dark:bg-[#2a2825] relative rounded-(--retro-rounding) p-4 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] border-[1.5px] border-[#211f1c] dark:border-white/20">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          {onReadMore ? (
            <button
              onClick={onReadMore}
              className="text-[14px] text-black dark:text-white hover:underline cursor-pointer text-left block"
            >
              {article.title}
            </button>
          ) : (
            <h4 className="text-[14px] text-black dark:text-white">
              {article.title}
            </h4>
          )}
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() =>
                navigateTo({
                  type: "all-articles",
                  articleType: article.article_type,
                })
              }
              className="inline-block px-2 py-0.5 bg-waste-recycle rounded-md border border-[#211f1c] text-[9px] text-black hover:brightness-95 cursor-pointer"
            >
              {article.article_type}
            </button>
            {sustainabilityCategory && (
              <button
                onClick={() =>
                  categoryForFilter &&
                  navigateTo({
                    type: "all-articles",
                    category: categoryForFilter,
                  })
                }
                className="inline-block px-2 py-0.5 rounded-md border border-[#211f1c] text-[9px] text-black hover:brightness-95 cursor-pointer"
                style={{ backgroundColor: sustainabilityCategory.color }}
              >
                {sustainabilityCategory.label}
              </button>
            )}
          </div>
        </div>
        {!hideActions && (isAdminModeActive || canManageArticle) && (
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="icon-box-sm bg-waste-recycle !dark:border-[#211f1c] !dark:hover:shadow-[2px_2px_0px_0px_#000000]"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={onDelete}
              className="icon-box-sm bg-waste-compost !dark:border-[#211f1c] !dark:hover:shadow-[2px_2px_0px_0px_#000000]"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {/* Cover Image */}
        {coverImage && (
          <div>
            <img
              src={coverImage}
              alt={article.title}
              className="w-full h-32 object-cover rounded-lg border border-[#211f1c] dark:border-white/20"
            />
          </div>
        )}

        {/* Content Preview */}
        <p className="text-sm text-black/70 dark:text-white/70 line-clamp-3">
          {preview}
        </p>

        {/* Read more link */}
        {onReadMore && (
          <button
            onClick={onReadMore}
            className="text-sm text-black dark:text-white hover:underline"
          >
            Read more...
          </button>
        )}

        {/* Linked material attribution */}
        {linkedMaterialName && onViewLinkedMaterial && (
          <p className="text-xs text-black/50 dark:text-white/40 pt-1 text-right dark:border-white/10">
            From{" "}
            <button
              onClick={onViewLinkedMaterial}
              className="underline hover:text-black dark:hover:text-white transition-colors"
            >
              {linkedMaterialName}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
