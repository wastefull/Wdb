import { Edit2, Trash2 } from "lucide-react";
import { Article } from "../../types/article";

export interface ArticleCardProps {
  article: Article;
  onEdit: () => void;
  onDelete: () => void;
  hideActions?: boolean;
  sustainabilityCategory?: { label: string; color: string };
  onReadMore?: () => void;
  isAdminModeActive?: boolean;
}

// Helper to extract plain text preview from TiptapContent
function getContentPreview(article: Article, maxLength: number = 150): string {
  // Try new TiptapContent first
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

  // Fall back to legacy content
  const legacyText =
    article.introduction?.content || article.supplies?.content || "";
  if (legacyText) {
    return legacyText.length > maxLength
      ? legacyText.substring(0, maxLength) + "..."
      : legacyText;
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
}: ArticleCardProps) {
  const coverImage = article.cover_image_url || article.overview?.image;
  const preview = getContentPreview(article);

  return (
    <div className="bg-white dark:bg-[#2a2825] relative rounded-[11.464px] p-4 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] border-[1.5px] border-[#211f1c] dark:border-white/20">
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
            <span className="inline-block px-2 py-0.5 bg-waste-recycle rounded-md border border-[#211f1c] text-[9px] text-black">
              {article.article_type || article.category}
            </span>
            {sustainabilityCategory && (
              <span
                className="inline-block px-2 py-0.5 rounded-md border border-[#211f1c] text-[9px] text-black"
                style={{ backgroundColor: sustainabilityCategory.color }}
              >
                {sustainabilityCategory.label}
              </span>
            )}
          </div>
        </div>
        {!hideActions && isAdminModeActive && (
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
        <p className="text-[11px] text-black/70 dark:text-white/70 line-clamp-3">
          {preview}
        </p>

        {/* Read more link */}
        {onReadMore && (
          <button
            onClick={onReadMore}
            className="text-[11px] text-black dark:text-white hover:underline"
          >
            Read more...
          </button>
        )}
      </div>
    </div>
  );
}
