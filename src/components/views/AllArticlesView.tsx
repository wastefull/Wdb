import { ArrowLeft } from "lucide-react";
import { Material } from "../../types/material";
import { CategoryType } from "../../types/article";
import { ArticleCard } from "../cards";

interface AllArticlesViewProps {
  category: CategoryType;
  materials: Material[];
  onBack: () => void;
  onViewArticleStandalone: (articleId: string, materialId: string) => void;
}

export function AllArticlesView({
  category,
  materials,
  onBack,
  onViewArticleStandalone,
}: AllArticlesViewProps) {
  const categoryLabels = {
    compostability: "Compost",
    recyclability: "Recycling",
    reusability: "Reuse",
  };

  // Collect all articles for this category across all materials
  const articlesWithMaterial = materials.flatMap((material) => {
    const categoryArticles = material.articles?.[category];
    if (!categoryArticles || !Array.isArray(categoryArticles)) return [];
    return categoryArticles.map((article) => ({
      article,
      material,
    }));
  });

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="icon-box-sm bg-[#b8c8cb] p-2 !dark:border-[#211f1c] !dark:hover:shadow-[2px_2px_0px_0px_#000000]"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h2 className="text-[18px] text-black">
            All {categoryLabels[category]} Articles
          </h2>
          <p className="text-[12px] text-black/60">
            {articlesWithMaterial.length} article
            {articlesWithMaterial.length !== 1 ? "s" : ""} across all materials
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articlesWithMaterial.map(({ article, material }) => (
          <div key={`${material.id}-${article.id}`} className="relative">
            <div className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded-md border border-[#211f1c] z-10">
              <p className="text-[10px] text-black">{material.name}</p>
            </div>
            <ArticleCard
              article={article}
              onEdit={() => {}}
              onDelete={() => {}}
              hideActions
              onReadMore={() =>
                onViewArticleStandalone(article.id, material.id)
              }
            />
          </div>
        ))}
      </div>

      {articlesWithMaterial.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[16px] text-black/50">
            No {categoryLabels[category].toLowerCase()} articles yet.
          </p>
        </div>
      )}
    </div>
  );
}
