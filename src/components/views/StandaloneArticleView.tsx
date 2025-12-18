import { useState } from "react";
import { ArrowLeft, Edit2, Trash2, Copy, Check } from "lucide-react";
import { Article } from "../../types/article";
import GuideRenderer from "../editor/GuideRenderer";

interface StandaloneArticleViewProps {
  article: Article;
  sustainabilityCategory?: { label: string; color: string };
  materialName?: string;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isAdminModeActive?: boolean;
}

export function StandaloneArticleView({
  article,
  sustainabilityCategory,
  materialName,
  onBack,
  onEdit,
  onDelete,
  isAdminModeActive,
}: StandaloneArticleViewProps) {
  const [copied, setCopied] = useState(false);

  const permalink = `${window.location.origin}${window.location.pathname}?article=${article.id}`;

  const copyPermalink = () => {
    navigator.clipboard.writeText(permalink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if article has new TiptapContent or legacy sections
  const hasRichContent = article.content && article.content.type === "doc";
  const hasLegacyContent =
    article.introduction?.content ||
    article.supplies?.content ||
    article.step1?.content;

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="card-interactive">
          <ArrowLeft size={16} className="text-black dark:text-white" />
        </button>
        <div className="flex-1">
          <h2 className="text-[18px] normal text-black dark:text-white">
            {article.title}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="tag-yellow">
              {article.article_type || article.category}
            </span>
            {sustainabilityCategory && (
              <span
                className="inline-block px-2 py-0.5 rounded-md border border-[#211f1c] dark:border-white/20 text-[9px] text-black"
                style={{ backgroundColor: sustainabilityCategory.color }}
              >
                {sustainabilityCategory.label}
              </span>
            )}
            {materialName && (
              <span className="text-[11px] text-black/60 dark:text-white/60">
                from {materialName}
              </span>
            )}
          </div>
        </div>
        {onEdit && onDelete && isAdminModeActive && (
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="icon-box-sm arcade-bg-amber arcade-btn-amber p-2"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={onDelete}
              className="icon-box-sm arcade-bg-red arcade-btn-red p-2"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 p-6 max-w-3xl mx-auto">
        <div className="space-y-6">
          {/* Cover Image */}
          {(article.cover_image_url || article.overview?.image) && (
            <div>
              <img
                src={article.cover_image_url || article.overview?.image}
                alt={article.title}
                className="w-full h-auto rounded-lg border border-[#211f1c] dark:border-white/20"
              />
            </div>
          )}

          {/* Rich Content (TiptapContent) */}
          {hasRichContent && (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <GuideRenderer content={article.content} />
            </div>
          )}

          {/* Legacy Content (backward compatibility) */}
          {!hasRichContent && hasLegacyContent && (
            <>
              {/* Introduction Section */}
              {article.introduction?.content && (
                <div>
                  <h3 className="text-[15px] text-black dark:text-white mb-3">
                    Introduction
                  </h3>
                  {article.introduction.image && (
                    <img
                      src={article.introduction.image}
                      alt="Introduction"
                      className="w-full h-auto rounded-lg border border-[#211f1c] dark:border-white/20 mb-3"
                    />
                  )}
                  <p className="text-[13px] text-black/80 dark:text-white/80 whitespace-pre-wrap leading-relaxed">
                    {article.introduction.content}
                  </p>
                </div>
              )}

              {/* Supplies Section */}
              {article.supplies?.content && (
                <div>
                  <h3 className="text-[15px] text-black dark:text-white mb-3">
                    Supplies
                  </h3>
                  {article.supplies.image && (
                    <img
                      src={article.supplies.image}
                      alt="Supplies"
                      className="w-full h-auto rounded-lg border border-[#211f1c] dark:border-white/20 mb-3"
                    />
                  )}
                  <p className="text-[13px] text-black/80 dark:text-white/80 whitespace-pre-wrap leading-relaxed">
                    {article.supplies.content}
                  </p>
                </div>
              )}

              {/* Step 1 Section */}
              {article.step1?.content && (
                <div>
                  <h3 className="text-[15px] text-black dark:text-white mb-3">
                    Step 1
                  </h3>
                  {article.step1.image && (
                    <img
                      src={article.step1.image}
                      alt="Step 1"
                      className="w-full h-auto rounded-lg border border-[#211f1c] dark:border-white/20 mb-3"
                    />
                  )}
                  <p className="text-[13px] text-black/80 dark:text-white/80 whitespace-pre-wrap leading-relaxed">
                    {article.step1.content}
                  </p>
                </div>
              )}
            </>
          )}

          {/* No content message */}
          {!hasRichContent && !hasLegacyContent && (
            <p className="text-[13px] text-black/60 dark:text-white/60 italic">
              No content available for this article.
            </p>
          )}

          <div className="pt-4 border-t border-[#211f1c]/20 dark:border-white/20 space-y-2">
            <p className="text-[11px] text-black/50 dark:text-white/50">
              Added: {new Date(article.dateAdded).toLocaleDateString()}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-[11px] text-black/50 dark:text-white/50 truncate flex-1">
                Permalink: {permalink}
              </p>
              <button
                onClick={copyPermalink}
                className="icon-box-sm bg-waste-recycle shrink-0"
                title="Copy permalink"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
