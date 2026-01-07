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
import { RasterizedQuantileVisualization } from "../charts/RasterizedQuantileVisualization";
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
      // Set created_by and author_id to current user
      created_by: user?.id || articleData.created_by,
      author_id: user?.id || articleData.author_id,
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
        <button onClick={onBack} className="card-interactive">
          <ArrowLeft size={16} className="text-black" />
        </button>
        <div className="flex-1">
          <h2 className="text-[18px] normal">
            {material.name} - {categoryLabels[category]}
          </h2>
          <p className="text-[12px] text-black/60 dark:text-white/60">
            {articles.length} article{articles.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isAdminModeActive && (
          <button
            onClick={() => {
              setShowForm(true);
              setEditingArticle(null);
            }}
            className="retro-card-button h-10 px-6 text-[14px] text-black flex items-center gap-2"
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
          <div className="retro-card mb-6 p-6">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-[16px] normal mb-4">
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
          <p className="text-[16px] text-black/50">
            {user ? (
              "No articles yet. Add your first one!"
            ) : (
              <>
                No articles yet.{" "}
                <button
                  onClick={onSignUp}
                  className="normal underline hover:no-underline transition-all"
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
