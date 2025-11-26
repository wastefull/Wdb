import { useState } from "react";
import { ArrowLeft, Edit2, Trash2, Copy, Check } from "lucide-react";
import { Article } from "../../types/article";

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

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="card-interactive">
          <ArrowLeft size={16} className="text-black" />
        </button>
        <div className="flex-1">
          <h2 className="text-[18px] text-black dark:text-white">
            {article.title}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="tag-yellow">{article.category}</span>
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
            <button onClick={onEdit} className="icon-box-sm bg-[#e4e3ac] p-2">
              <Edit2 size={14} className="text-black" />
            </button>
            <button onClick={onDelete} className="icon-box-sm bg-[#e6beb5] p-2">
              <Trash2 size={14} className="text-black" />
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[11.464px] border-[1.5px] border-[#211f1c] p-6 max-w-3xl mx-auto">
        <div className="space-y-6">
          {/* Overview Section */}
          {article.overview.image && (
            <div>
              <h3 className="text-[15px] text-black mb-3">Overview</h3>
              <img
                src={article.overview.image}
                alt="Overview"
                className="w-full h-auto rounded-[4px] border border-[#211f1c]"
              />
            </div>
          )}

          {/* Introduction Section */}
          <div>
            <h3 className="text-[15px] text-black mb-3">Introduction</h3>
            {article.introduction.image && (
              <img
                src={article.introduction.image}
                alt="Introduction"
                className="w-full h-auto rounded-[4px] border border-[#211f1c] mb-3"
              />
            )}
            <p className="text-[13px] text-black/80 whitespace-pre-wrap leading-relaxed">
              {article.introduction.content}
            </p>
          </div>

          {/* Supplies Section */}
          <div>
            <h3 className="text-[15px] text-black mb-3">Supplies</h3>
            {article.supplies.image && (
              <img
                src={article.supplies.image}
                alt="Supplies"
                className="w-full h-auto rounded-[4px] border border-[#211f1c] mb-3"
              />
            )}
            <p className="text-[13px] text-black/80 whitespace-pre-wrap leading-relaxed">
              {article.supplies.content}
            </p>
          </div>

          {/* Step 1 Section */}
          <div>
            <h3 className="text-[15px] text-black mb-3">Step 1</h3>
            {article.step1.image && (
              <img
                src={article.step1.image}
                alt="Step 1"
                className="w-full h-auto rounded-[4px] border border-[#211f1c] mb-3"
              />
            )}
            <p className="text-[13px] text-black/80 whitespace-pre-wrap leading-relaxed">
              {article.step1.content}
            </p>
          </div>

          <div className="pt-4 border-t border-[#211f1c]/20 space-y-2">
            <p className="text-[11px] text-black/50">
              Added: {new Date(article.dateAdded).toLocaleDateString()}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-[11px] text-black/50 truncate flex-1">
                Permalink: {permalink}
              </p>
              <button
                onClick={copyPermalink}
                className="icon-box-sm bg-[#e4e3ac] shrink-0"
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
