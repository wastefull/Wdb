import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Material } from "../../types/material";
import { CategoryType, ArticleType } from "../../types/article";
import { ArticleCard } from "../cards";
import { useNavigationContext } from "../../contexts/NavigationContext";

function getAllArticlesColumnCount(windowWidth: number): number {
  if (windowWidth >= 2200) return 6;
  if (windowWidth >= 1800) return 5;
  if (windowWidth >= 1400) return 4;
  if (windowWidth >= 1024) return 3;
  if (windowWidth >= 768) return 2;
  return 1;
}

const ALL_CATEGORIES: CategoryType[] = [
  "compostability",
  "recyclability",
  "reusability",
];

const categoryLabels: Record<CategoryType, string> = {
  compostability: "Compost",
  recyclability: "Recycling",
  reusability: "Reuse",
};

interface AllArticlesViewProps {
  category?: CategoryType;
  articleType?: ArticleType;
  materials: Material[];
  onBack: () => void;
  onViewArticleStandalone: (
    articleId: string,
    materialId: string,
    category: CategoryType,
  ) => void;
}

export function AllArticlesView({
  category,
  articleType,
  materials,
  onBack,
  onViewArticleStandalone,
}: AllArticlesViewProps) {
  const { navigateToMaterialDetail } = useNavigationContext();
  const [columnCount, setColumnCount] = useState(2);

  useEffect(() => {
    const updateColumnCount = () => {
      setColumnCount(getAllArticlesColumnCount(window.innerWidth));
    };

    updateColumnCount();
    window.addEventListener("resize", updateColumnCount);
    return () => {
      window.removeEventListener("resize", updateColumnCount);
    };
  }, []);

  const categoriesToShow = category ? [category] : ALL_CATEGORIES;

  const articlesWithMaterial = materials.flatMap((material) =>
    categoriesToShow.flatMap((cat) => {
      const list = material.articles?.[cat];
      if (!list || !Array.isArray(list)) return [];
      return list
        .filter(
          (article) => !articleType || article.article_type === articleType,
        )
        .map((article) => ({ article, material, cat }));
    }),
  );

  const title = articleType
    ? `All ${articleType} Articles`
    : category
      ? `All ${categoryLabels[category]} Articles`
      : "All Articles";

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="icon-box-sm bg-waste-reuse p-2 !dark:border-[#211f1c] !dark:hover:shadow-[2px_2px_0px_0px_#000000]"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h2 className="text-[18px] text-black">{title}</h2>
          <p className="text-[12px] text-black/60">
            {articlesWithMaterial.length} article
            {articlesWithMaterial.length !== 1 ? "s" : ""} across all materials
          </p>
        </div>
      </div>

      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
        }}
      >
        {articlesWithMaterial.map(({ article, material, cat }) => (
          <div key={`${material.id}-${article.id}-${cat}`} className="relative">
            <div className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded-md border border-[#211f1c] z-10">
              <button
                onClick={() => navigateToMaterialDetail(material.id)}
                className="text-xs text-black hover:underline cursor-pointer"
              >
                {material.name}
              </button>
            </div>
            <ArticleCard
              article={article}
              onEdit={() => {}}
              onDelete={() => {}}
              hideActions
              onReadMore={() =>
                onViewArticleStandalone(article.id, material.id, cat)
              }
            />
          </div>
        ))}
      </div>

      {articlesWithMaterial.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[16px] text-black/50">
            {category
              ? `No ${categoryLabels[category].toLowerCase()} articles yet.`
              : "No articles yet."}
          </p>
        </div>
      )}
    </div>
  );
}
