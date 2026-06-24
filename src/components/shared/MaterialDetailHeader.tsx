import { ArrowLeft } from "lucide-react";
import { Material } from "../../types/material";
import { AliasDisplay } from "./AliasDisplay";
import { MaterialArticleCount } from "./MaterialArticleCount";
import { MaterialCategoryButton } from "./MaterialCategoryButton";
import { MaterialHubButton } from "./MaterialHubButton";

interface MaterialDetailHeaderProps {
  coverImage?: string;
  onBack: () => void;
  materialName: string;
  aliases: string[];
  category: Material["category"];
  isHub: boolean;
  totalArticles: number;
}

export function MaterialDetailHeader({
  coverImage,
  onBack,
  materialName,
  aliases,
  category,
  isHub,
  totalArticles,
}: MaterialDetailHeaderProps) {
  return (
    <>
      {coverImage && (
        <div
          className="relative -mx-6 -mt-6 mb-6 h-40 overflow-hidden"
          aria-hidden="true"
        >
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
      <div className="mx-auto mb-10 max-w-7xl">
        <button
          type="button"
          onClick={onBack}
          className="card-interactive mb-6 flex size-10 items-center justify-center"
          aria-label="Back to previous page"
        >
          <ArrowLeft
            size={16}
            className="text-black dark:text-white"
            aria-hidden="true"
          />
        </button>

        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="text-4xl leading-tight text-black text-shadow-lg dark:text-white md:text-[42px]">
              {materialName}
            </h1>
            {/* <AliasDisplay aliases={aliases} /> */}
          </div>
          <div className="flex flex-wrap items-center gap-2 md:max-w-sm md:justify-end">
            {isHub && <MaterialHubButton materialName={materialName} />}
            <MaterialCategoryButton category={category} />
            <MaterialArticleCount totalArticles={totalArticles} />
          </div>
        </div>
      </div>
    </>
  );
}
