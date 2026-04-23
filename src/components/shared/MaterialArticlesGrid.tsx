import { ArticleCard } from "../cards";
import { Article, CategoryType } from "../../types/article";

interface MaterialArticlesGridProps {
  articles: Array<{ article: Article; category: CategoryType }>;
  onEditArticle: (article: Article, category: CategoryType) => void;
  onDeleteArticle: (articleId: string, category: CategoryType) => void;
  onReadMore: (articleId: string, category: CategoryType) => void;
  isAdminModeActive?: boolean;
}

const categoryLabels = {
  compostability: "Compostability",
  recyclability: "Recyclability",
  reusability: "Reusability",
};

const categoryColors = {
  compostability: "#e6beb5",
  recyclability: "#e4e3ac",
  reusability: "#b8c8cb",
};

export function MaterialArticlesGrid({
  articles,
  onEditArticle,
  onDeleteArticle,
  onReadMore,
  isAdminModeActive,
}: MaterialArticlesGridProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[16px] text-black/50 dark:text-white/50">
          You can write the first article for this material!
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-[16px] text-black mb-4">All Articles</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map(({ article, category }) => (
          <ArticleCard
            key={`${category}-${article.id}`}
            article={article}
            onEdit={() => onEditArticle(article, category)}
            onDelete={() => onDeleteArticle(article.id, category)}
            sustainabilityCategory={{
              label: categoryLabels[category],
              color: categoryColors[category],
            }}
            onReadMore={() => onReadMore(article.id, category)}
            isAdminModeActive={isAdminModeActive}
          />
        ))}
      </div>
    </div>
  );
}
