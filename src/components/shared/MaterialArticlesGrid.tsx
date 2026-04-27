import { ArticleCard } from "../cards";
import { Plus } from "lucide-react";
import { Article, CategoryType } from "../../types/article";

interface MaterialArticlesGridProps {
  articles: Array<{ article: Article; category: CategoryType }>;
  onEditArticle: (article: Article, category: CategoryType) => void;
  onDeleteArticle: (article: Article, category: CategoryType) => void;
  onReadMore: (articleId: string, category: CategoryType) => void;
  isAdminModeActive?: boolean;
  currentUserId?: string;
  onViewArticles?: (category: CategoryType) => void;
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

const ALL_CATEGORIES = Object.keys(categoryLabels) as CategoryType[];

export function MaterialArticlesGrid({
  articles,
  onEditArticle,
  onDeleteArticle,
  onReadMore,
  isAdminModeActive,
  currentUserId,
  onViewArticles,
}: MaterialArticlesGridProps) {
  const categoriesWithArticles = new Set(articles.map((a) => a.category));
  const emptyCategories = ALL_CATEGORIES.filter(
    (c) => !categoriesWithArticles.has(c),
  );

  return (
    <div>
      {articles.length > 0 && (
        <>
          <h3 className="text-[16px] text-black dark:text-white mb-4">
            All Articles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {articles.map(({ article, category }) => (
              <ArticleCard
                key={`${category}-${article.id}`}
                article={article}
                onEdit={() => onEditArticle(article, category)}
                onDelete={() => onDeleteArticle(article, category)}
                sustainabilityCategory={{
                  label: categoryLabels[category],
                  color: categoryColors[category],
                }}
                onReadMore={() => onReadMore(article.id, category)}
                isAdminModeActive={isAdminModeActive}
                canManageArticle={
                  !!(
                    currentUserId &&
                    (article.created_by === currentUserId ||
                      article.author_id === currentUserId)
                  )
                }
              />
            ))}
          </div>
        </>
      )}

      {emptyCategories.length > 0 && (
        <div className="pt-6">
          {articles.length > 0 && (
            <p className="text-[12px] text-black/50 dark:text-white/50 mb-3">
              No articles yet for:
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {emptyCategories.map((category) => (
              <button
                key={category}
                onClick={() => onViewArticles?.(category)}
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-[11.464px] border-[1.5px] border-dashed border-[#211f1c]/40 dark:border-white/20 hover:border-[#211f1c] dark:hover:border-white/50 transition-colors group cursor-pointer"
                style={{ backgroundColor: `${categoryColors[category]}33` }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center border border-[#211f1c]/30 dark:border-white/20 group-hover:border-[#211f1c] dark:group-hover:border-white/50 transition-colors"
                  style={{ backgroundColor: categoryColors[category] }}
                >
                  <Plus
                    size={14}
                    className={`text-black dark:text-black dark:rounded-full dark:shadow-2xl`}
                  />
                </div>
                <span className="text-[12px] text-black/60 dark:text-white/60 dark:shadow-2xl group-hover:text-black dark:group-hover:text-white transition-colors text-center">
                  Submit a {categoryLabels[category]} article
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
