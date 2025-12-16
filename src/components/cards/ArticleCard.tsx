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

export function ArticleCard({
  article,
  onEdit,
  onDelete,
  hideActions = false,
  sustainabilityCategory,
  onReadMore,
  isAdminModeActive,
}: ArticleCardProps) {
  return (
    <div className="bg-white relative rounded-[11.464px] p-4 shadow-[3px_4px_0px_-1px_#000000] border-[1.5px] border-[#211f1c]">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          {onReadMore ? (
            <button
              onClick={onReadMore}
              className="text-[14px] text-black hover:underline cursor-pointer text-left block"
            >
              {article.title}
            </button>
          ) : (
            <h4 className="text-[14px] text-black">{article.title}</h4>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-block px-2 py-0.5 bg-waste-recycle rounded-md border border-[#211f1c] text-[9px] text-black">
              {article.category}
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
        {/* Overview Section */}
        {article.overview.image && (
          <div>
            <h5 className="text-[12px] text-black mb-1">Overview</h5>
            <img
              src={article.overview.image}
              alt="Overview"
              className="w-full h-auto rounded-lg border border-[#211f1c]"
            />
          </div>
        )}

        {/* Introduction Section */}
        <div>
          <h5 className="text-[12px] text-black mb-1">Introduction</h5>
          {article.introduction.image && (
            <img
              src={article.introduction.image}
              alt="Introduction"
              className="w-full h-auto rounded-lg border border-[#211f1c] mb-2"
            />
          )}
          <p className="text-[11px] text-black/70 whitespace-pre-wrap">
            {article.introduction.content}
          </p>
        </div>

        {/* Supplies Section */}
        <div>
          <h5 className="text-[12px] text-black mb-1">Supplies</h5>
          {article.supplies.image && (
            <img
              src={article.supplies.image}
              alt="Supplies"
              className="w-full h-auto rounded-lg border border-[#211f1c] mb-2"
            />
          )}
          <p className="text-[11px] text-black/70 whitespace-pre-wrap">
            {article.supplies.content}
          </p>
        </div>

        {/* Read more link */}
        {onReadMore && (
          <button
            onClick={onReadMore}
            className="text-[11px] text-black hover:underline"
          >
            Read more...
          </button>
        )}
      </div>
    </div>
  );
}
