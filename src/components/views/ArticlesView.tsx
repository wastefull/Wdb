import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { Material } from "../../types/material";
import { Article, CategoryType } from "../../types/article";
import * as api from "../../utils/api";
import {
  getArticlesByCategory,
  addArticleToMaterial,
  updateArticleInMaterial,
  removeArticleFromMaterial,
} from "../../utils/materialArticles";
import { RasterizedQuantileVisualization } from "../charts/RasterizedQuantileVisualization";
import { ArticleCard } from "../cards";
import { ArticleForm } from "../forms";
import { DiscardChangesDialog } from "../shared/DiscardChangesDialog";

interface ArticlesViewProps {
  material: Material;
  category: CategoryType;
  onBack: () => void;
  onUpdateMaterial: (material: Material) => void;
  onViewArticleStandalone: (articleId: string) => void;
  isAdminModeActive?: boolean;
  userRole?: "user" | "staff" | "admin";
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
  userRole,
  user,
  onSignUp,
}: ArticlesViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

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

  const handleAddArticle = (
    articleData: Omit<Article, "id" | "dateAdded">,
    options?: { onBehalfOf?: string },
  ) => {
    const canPublishDirectly = isAdminModeActive || userRole === "admin";

    if (!canPublishDirectly) {
      void (async () => {
        try {
          await api.createSubmission({
            type: "new_article",
            content_data: {
              ...articleData,
              material_id: material.id,
              sustainability_category: category,
              category,
            },
          });
          toast.success("Article submitted for admin review.");
          setShowForm(false);
        } catch {
          toast.error("Failed to submit article for review");
        }
      })();
      return;
    }

    // If admin is posting on behalf of another user, use that user's ID
    const creatorId = options?.onBehalfOf || user?.id;

    const newArticle: Article = {
      ...articleData,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString(),
      status: "published",
      // Set created_by and author_id to the target user (or current user)
      created_by: creatorId || articleData.created_by,
      author_id: creatorId || articleData.author_id,
    };

    const updatedMaterial = addArticleToMaterial(
      material,
      category,
      newArticle,
    );

    onUpdateMaterial(updatedMaterial);
    setShowForm(false);
  };

  const handleUpdateArticle = (
    articleData: Omit<Article, "id" | "dateAdded">,
  ) => {
    if (!editingArticle) return;

    const canPublishDirectly = isAdminModeActive || userRole === "admin";
    if (!canPublishDirectly) {
      const changeReason = prompt(
        "Briefly explain your suggested article changes (required):",
      );
      if (!changeReason?.trim()) {
        toast.error("A reason is required to submit an edit request");
        return;
      }

      void (async () => {
        try {
          await api.createSubmission({
            type: "update_article",
            original_content_id: editingArticle.id,
            content_data: {
              ...articleData,
              article_id: editingArticle.id,
              material_id: material.id,
              sustainability_category: category,
              category,
              change_reason: changeReason.trim(),
            },
          });
          toast.success("Edit suggestion submitted for admin review.");
          setEditingArticle(null);
          setShowForm(false);
        } catch {
          toast.error("Failed to submit edit suggestion");
        }
      })();
      return;
    }

    const updatedMaterial = updateArticleInMaterial(
      material,
      category,
      editingArticle.id,
      (a) => ({
        ...articleData,
        id: a.id,
        dateAdded: a.dateAdded,
        updated_at: new Date().toISOString(),
      }),
    );

    onUpdateMaterial(updatedMaterial);
    setEditingArticle(null);
    setShowForm(false);
  };

  const handleDeleteArticle = (id: string) => {
    const canPublishDirectly = isAdminModeActive || userRole === "admin";

    if (!canPublishDirectly) {
      const existingArticle = articles.find((article) => article.id === id);
      const changeReason = prompt(
        "Briefly explain why this article should be deleted (required):",
      );
      if (!changeReason?.trim()) {
        toast.error("A reason is required to submit a delete request");
        return;
      }

      void (async () => {
        try {
          await api.createSubmission({
            type: "delete_article",
            original_content_id: id,
            content_data: {
              article_id: id,
              material_id: material.id,
              sustainability_category: category,
              category,
              title: existingArticle?.title,
              change_reason: changeReason.trim(),
            },
          });
          toast.success("Delete request submitted for admin review.");
        } catch {
          toast.error("Failed to submit delete request");
        }
      })();
      return;
    }

    if (confirm("Are you sure you want to delete this article?")) {
      const updatedMaterial = removeArticleFromMaterial(material, category, id);

      onUpdateMaterial(updatedMaterial);
    }
  };

  const clearFormState = () => {
    setShowForm(false);
    setEditingArticle(null);
    setIsFormDirty(false);
  };

  const runWithUnsavedGuard = (action: () => void) => {
    if (showForm && isFormDirty) {
      setPendingAction(() => action);
      setShowDiscardConfirm(true);
      return;
    }
    action();
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
        {user && (
          <button
            onClick={() =>
              runWithUnsavedGuard(() => {
                setShowForm(true);
                setEditingArticle(null);
              })
            }
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
          onCancel={clearFormState}
          onDirtyChange={setIsFormDirty}
          isAdminMode={isAdminModeActive}
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
            onEdit={() =>
              runWithUnsavedGuard(() => {
                setEditingArticle(article);
                setShowForm(true);
              })
            }
            onDelete={() => handleDeleteArticle(article.id)}
            onReadMore={() => onViewArticleStandalone(article.id)}
            isAdminModeActive={isAdminModeActive}
          />
        ))}
      </div>

      {showDiscardConfirm && (
        <DiscardChangesDialog
          onKeepEditing={() => {
            setShowDiscardConfirm(false);
            setPendingAction(null);
          }}
          onDiscard={() => {
            const action = pendingAction;
            setShowDiscardConfirm(false);
            setPendingAction(null);
            clearFormState();
            action?.();
          }}
        />
      )}

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
