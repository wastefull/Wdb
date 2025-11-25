import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Material } from "../../types/material";
import { Article, CategoryType } from "../../types/article";
import {
  getArticlesByCategory,
  addArticleToMaterial,
  updateArticleInMaterial,
  removeArticleFromMaterial,
} from "../../utils/materialArticles";
import { RasterizedQuantileVisualization } from "../RasterizedQuantileVisualization";
import { ArticleCard } from "../cards";
import { ArticleForm } from "../forms";

interface ArticlesViewProps {
  material: Material;
  category: CategoryType;
  onBack: () => void;
  onUpdateMaterial: (material: Material) => void;
  onViewArticleStandalone: (articleId: string) => void;
  isAdminModeActive?: boolean;
  user: { id: string; email: string; name?: string } | null;
  onSignUp: () => void;
}

export function ArticlesView({
  material,
  category,
  onBack,
  onUpdateMaterial,
  onViewArticleStandalone,
  isAdminModeActive,
  user,
  onSignUp,
}: ArticlesViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const categoryColors = {
    compostability: "#e6beb5",
    recyclability: "#e4e3ac",
    reusability: "#b8c8cb",
  };

  const categoryLabels = {
    compostability: "Compostability",
    recyclability: "Recyclability",
    reusability: "Reusability",
  };

  const articles = getArticlesByCategory(material, category);

  const handleAddArticle = (articleData: Omit<Article, "id" | "dateAdded">) => {
    const newArticle: Article = {
      ...articleData,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString(),
    };

    const updatedMaterial = addArticleToMaterial(
      material,
      category,
      newArticle
    );

    onUpdateMaterial(updatedMaterial);
    setShowForm(false);
  };

  const handleUpdateArticle = (
    articleData: Omit<Article, "id" | "dateAdded">
  ) => {
    if (!editingArticle) return;

    const updatedMaterial = updateArticleInMaterial(
      material,
      category,
      editingArticle.id,
      (a) => ({ ...articleData, id: a.id, dateAdded: a.dateAdded })
    );

    onUpdateMaterial(updatedMaterial);
    setEditingArticle(null);
    setShowForm(false);
  };

  const handleDeleteArticle = (id: string) => {
    if (confirm("Are you sure you want to delete this article?")) {
      const updatedMaterial = removeArticleFromMaterial(material, category, id);

      onUpdateMaterial(updatedMaterial);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 bg-[#b8c8cb] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
        >
          <ArrowLeft size={16} className="text-black" />
        </button>
        <div className="flex-1">
          <h2 className="font-['Sniglet:Regular',_sans-serif] text-[18px] text-black dark:text-white">
            {material.name} - {categoryLabels[category]}
          </h2>
          <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/60 dark:text-white/60">
            {articles.length} article{articles.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isAdminModeActive && (
          <button
            onClick={() => {
              setShowForm(true);
              setEditingArticle(null);
            }}
            className="bg-[#b8c8cb] h-[40px] px-6 rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] font-['Sniglet:Regular',_sans-serif] text-[14px] text-black hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] transition-all flex items-center gap-2"
            style={{ backgroundColor: categoryColors[category] }}
          >
            <Plus size={16} className="text-black" />
            Add Article
          </button>
        )}
      </div>

      {showForm && (
        <ArticleForm
          article={editingArticle || undefined}
          onSave={editingArticle ? handleUpdateArticle : handleAddArticle}
          onCancel={() => {
            setShowForm(false);
            setEditingArticle(null);
          }}
        />
      )}

      {/* Recyclability Visualization - only for recyclability category */}
      {category === "recyclability" &&
        material.CR_practical_mean &&
        material.CR_theoretical_mean && (
          <div className="mb-6 bg-white dark:bg-[#2a2825] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 p-6 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]">
            <div className="max-w-2xl mx-auto">
              <h3 className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black dark:text-white mb-4">
                Recyclability Score Overview
              </h3>
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
                width={600}
                height={80}
                articleCount={articles.length}
              />
            </div>
          </div>
        )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            onEdit={() => {
              setEditingArticle(article);
              setShowForm(true);
            }}
            onDelete={() => handleDeleteArticle(article.id)}
            onReadMore={() => onViewArticleStandalone(article.id)}
            isAdminModeActive={isAdminModeActive}
          />
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-12">
          <p className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black/50">
            {user ? (
              "No articles yet. Add your first one!"
            ) : (
              <>
                No articles yet.{" "}
                <button
                  onClick={onSignUp}
                  className="text-black dark:text-white underline hover:no-underline transition-all"
                >
                  Sign up
                </button>{" "}
                to become a contributor!
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
