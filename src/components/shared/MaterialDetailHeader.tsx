import { ArrowLeft } from "lucide-react";
import { Material } from "../../types/material";
import { AliasDisplay } from "./AliasDisplay";
import { MaterialArticleCount } from "./MaterialArticleCount";
import { MaterialCategoryButton } from "./MaterialCategoryButton";
import { MaterialHubButton } from "./MaterialHubButton";
import { MaterialName } from "./MaterialName";

interface MaterialDetailHeaderProps {
  coverImage?: string;
  onBack: () => void;
  materialId: string;
  aliases: string[];
  category: Material["category"];
  isHub: boolean;
  totalArticles: number;
}

export function MaterialDetailHeader({
  coverImage,
  onBack,
  materialId,
  aliases,
  category,
  isHub,
  totalArticles,
}: MaterialDetailHeaderProps) {
  return (
    <>
      {coverImage && (
        <div className="relative -mx-6 -mt-6 mb-6 h-32 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${coverImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-white/70 to-white dark:via-[#1a1917]/70 dark:to-[#1a1917]" />
        </div>
      )}
      <div className="flex items-center gap-2 mb-0">
        <button onClick={onBack} className="card-interactive">
          <ArrowLeft size={16} className="text-black" />
        </button>
        <MaterialName materialId={materialId} mode="hero" />
        <AliasDisplay aliases={aliases} />
        <div className="grid grid-cols-2 gap-2 ml-auto">
          {isHub && <MaterialHubButton category={category} />}
          {!isHub && <div>&nbsp;</div>}
          <MaterialCategoryButton category={category} />
          <div> &nbsp;</div>
          <MaterialArticleCount totalArticles={totalArticles} />
        </div>
      </div>
      <hr className="border-black/10 dark:border-white/10 w-auto pb-4" />
    </>
  );
}
