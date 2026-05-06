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
  materialName: string;
  aliases: string[];
  category: Material["category"];
  isHub: boolean;
  totalArticles: number;
}

export function MaterialDetailHeader({
  coverImage,
  onBack,
  materialId,
  materialName,
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
      <div className="grid grid-cols-12 items-center gap-4 mb-4 pr- overflow-x-clip">
        <button
          onClick={onBack}
          className="card-interactive w-10 col-span-5 md:col-span-3"
        >
          <ArrowLeft size={16} className="text-black" />
        </button>
        <div className="hidden md:block col-span-2">&nbsp;</div>
        <div className="col-span-3 md:col-span-4 inline-flex gap-1 items-center">
          <MaterialName materialId={materialId} mode="hero" />
          <AliasDisplay aliases={aliases} />
        </div>
        <div className="hidden md:block col-span-1">&nbsp;</div>
        <div className="col-span-4 md:col-span-2 md:min-w-45 justify-self-end md:justify-self-center">
          <div className="grid grid-cols-1 grid-rows-4 md:grid-cols-[max-content_max-content] md:grid-rows-2 md:w-fit md:justify-start gap-1">
            {isHub && <MaterialHubButton materialName={materialName} />}
            {!isHub && <div>&nbsp;</div>}
            <MaterialCategoryButton category={category} />
            <div> &nbsp;</div>
            <MaterialArticleCount totalArticles={totalArticles} />
          </div>
        </div>
      </div>
    </>
  );
}
