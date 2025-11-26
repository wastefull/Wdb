import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Material } from "../../types/material";
import { Article, CategoryType } from "../../types/article";
import {
  getAllArticles,
  getArticleCount,
  updateArticleInMaterial,
  removeArticleFromMaterial,
} from "../../utils/materialArticles";
import { RasterizedQuantileVisualization } from "../charts/RasterizedQuantileVisualization";
import { ArticleCard } from "../cards";
import { ArticleForm } from "../forms";

interface MaterialDetailViewProps {
  material: Material;
  onBack: () => void;
  onViewArticles: (category: CategoryType) => void;
  onUpdateMaterial: (material: Material) => void;
  onViewArticleStandalone: (articleId: string, category: CategoryType) => void;
  isAdminModeActive?: boolean;
}

export function MaterialDetailView({
  material,
  onBack,
  onViewArticles,
  onUpdateMaterial,
  onViewArticleStandalone,
  isAdminModeActive,
}: MaterialDetailViewProps) {
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

  const allArticles = getAllArticles(material).sort(
    (a, b) =>
      new Date(b.article.dateAdded).getTime() -
      new Date(a.article.dateAdded).getTime()
  );

  const totalArticles = allArticles.length;

  const handleDeleteArticle = (articleId: string, category: CategoryType) => {
    if (confirm("Are you sure you want to delete this article?")) {
      const updatedMaterial = removeArticleFromMaterial(
        material,
        category,
        articleId
      );
      onUpdateMaterial(updatedMaterial);
    }
  };

  const [editingArticle, setEditingArticle] = useState<{
    article: Article;
    category: CategoryType;
  } | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleUpdateArticle = (
    articleData: Omit<Article, "id" | "dateAdded">
  ) => {
    if (!editingArticle) return;

    const updatedMaterial = updateArticleInMaterial(
      material,
      editingArticle.category,
      editingArticle.article.id,
      (a) => ({ ...articleData, id: a.id, dateAdded: a.dateAdded })
    );

    onUpdateMaterial(updatedMaterial);
    setEditingArticle(null);
    setShowForm(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="card-interactive"
        >
          <ArrowLeft size={16} className="text-black" />
        </button>
        <div className="flex-1">
          <h2 className="text-[20px] text-black dark:text-white">
            {material.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="tag-cyan">
              {material.category}
            </span>
            <p className="text-[12px] text-black/60 dark:text-white/60">
              {totalArticles} article{totalArticles !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {material.description && (
        <div className="bg-white rounded-[11.464px] border-[1.5px] border-[#211f1c] p-4 mb-6">
          <p className="text-[13px] text-black/80">
            {material.description}
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 p-4 mb-6">
        <h3 className="text-[15px] text-black dark:text-white mb-4">
          Sustainability Scores
        </h3>
        <div className="flex flex-col gap-3">
          <RasterizedQuantileVisualization
            materialId={material.id}
            scoreType="compostability"
            data={{
              practical_mean: material.CC_practical_mean,
              theoretical_mean: material.CC_theoretical_mean,
              practical_CI95: material.CC_practical_CI95,
              theoretical_CI95: material.CC_theoretical_CI95,
              confidence_level: material.confidence_level,
              category: material.category,
            }}
            fallbackScore={material.compostability}
            simplified={
              !material.CC_practical_mean || !material.CC_theoretical_mean
            }
            height={50}
            onClick={() => onViewArticles("compostability")}
            articleCount={getArticleCount(material, "compostability")}
          />
          <RasterizedQuantileVisualization
            materialId={material.id}
            scoreType="recyclability"
            data={{
              practical_mean: material.CR_practical_mean,
              theoretical_mean: material.CR_theoretical_mean,
              practical_CI95: material.CR_practical_CI95,
              theoretical_CI95: material.CR_theoretical_CI95,
              confidence_level: material.confidence_level,
              category: material.category,
            }}
            fallbackScore={material.recyclability}
            simplified={
              !material.CR_practical_mean || !material.CR_theoretical_mean
            }
            height={50}
            onClick={() => onViewArticles("recyclability")}
            articleCount={getArticleCount(material, "recyclability")}
          />
          <RasterizedQuantileVisualization
            materialId={material.id}
            scoreType="reusability"
            data={{
              practical_mean: material.RU_practical_mean,
              theoretical_mean: material.RU_theoretical_mean,
              practical_CI95: material.RU_practical_CI95,
              theoretical_CI95: material.RU_theoretical_CI95,
              confidence_level: material.confidence_level,
              category: material.category,
            }}
            fallbackScore={material.reusability}
            simplified={
              !material.RU_practical_mean || !material.RU_theoretical_mean
            }
            height={50}
            onClick={() => onViewArticles("reusability")}
            articleCount={getArticleCount(material, "reusability")}
          />
        </div>
      </div>

      {showForm && editingArticle && (
        <ArticleForm
          article={editingArticle.article}
          onSave={handleUpdateArticle}
          onCancel={() => {
            setShowForm(false);
            setEditingArticle(null);
          }}
        />
      )}

      {totalArticles > 0 ? (
        <div>
          <h3 className="text-[16px] text-black mb-4">
            All Articles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allArticles.map(({ article, category }) => (
              <ArticleCard
                key={`${category}-${article.id}`}
                article={article}
                onEdit={() => {
                  setEditingArticle({ article, category });
                  setShowForm(true);
                }}
                onDelete={() => handleDeleteArticle(article.id, category)}
                sustainabilityCategory={{
                  label: categoryLabels[category],
                  color: categoryColors[category],
                }}
                onReadMore={() => onViewArticleStandalone(article.id, category)}
                isAdminModeActive={isAdminModeActive}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-[16px] text-black/50">
            No articles yet. Click on a category score above to add one!
          </p>
        </div>
      )}
    </div>
  );
}
