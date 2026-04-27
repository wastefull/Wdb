import { useState, useMemo } from "react";
import { Edit2 } from "lucide-react";
import { toast } from "sonner";
import { Material } from "../../types/material";
import { Article, CategoryType } from "../../types/article";
import * as api from "../../utils/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { buildMaterialPermalinkPath } from "../../utils/permalinks";
import {
  getAllArticles,
  getFirstCoverImage,
  updateArticleInMaterial,
  removeArticleFromMaterial,
} from "../../utils/materialArticles";
import { ArticleForm } from "../forms";
import {
  MaterialArticlesGrid,
  MaterialDetailHeader,
  MaterialDetailSidebar,
  MaterialDescriptionCard,
  RasterizedQuantileArticleCategories,
} from "../shared";

interface MaterialDetailViewProps {
  material: Material;
  allMaterials: Material[];
  onBack: () => void;
  onViewCategoryMaterials: (category: Material["category"]) => void;
  onUpdateMaterial: (material: Material) => void;
  onViewArticleStandalone: (articleId: string, category: CategoryType) => void;
  isAdminModeActive?: boolean;
  isAuthenticated?: boolean;
  currentUserId?: string;
  onEditMaterial?: (material: Material) => void;
  onSuggestEdit?: (material: Material) => void;
  onViewArticles?: (category: CategoryType) => void;
}

export function MaterialDetailView({
  material,
  allMaterials,
  onBack,
  onViewCategoryMaterials,
  onUpdateMaterial,
  onViewArticleStandalone,
  isAdminModeActive,
  isAuthenticated,
  currentUserId,
  onEditMaterial,
  onSuggestEdit,
  onViewArticles,
}: MaterialDetailViewProps) {
  const isElementHub = material.category === "Elements";
  const isHub = material.isHub || isElementHub;

  const allArticles = getAllArticles(material).sort(
    (a, b) =>
      new Date(b.article.dateAdded).getTime() -
      new Date(a.article.dateAdded).getTime(),
  );

  const totalArticles = allArticles.length;

  const isArticleAuthor = (article: Article) =>
    !!(
      currentUserId &&
      (article.created_by === currentUserId ||
        article.author_id === currentUserId)
    );

  const canManageArticle = (article: Article) =>
    !!(isAdminModeActive || isArticleAuthor(article));

  const handleDeleteArticle = async (
    article: Article,
    category: CategoryType,
  ) => {
    if (!canManageArticle(article)) return;

    setArticleToDelete({ article, category });
  };

  const [editingArticle, setEditingArticle] = useState<{
    article: Article;
    category: CategoryType;
  } | null>(null);
  const [articleToDelete, setArticleToDelete] = useState<{
    article: Article;
    category: CategoryType;
  } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const confirmDeleteArticle = () => {
    if (!articleToDelete) return;

    const updatedMaterial = removeArticleFromMaterial(
      material,
      articleToDelete.category,
      articleToDelete.article.id,
    );
    onUpdateMaterial(updatedMaterial);
    setArticleToDelete(null);
    toast.success("Article deleted");
  };

  const combinedAliases = useMemo(() => {
    const merged = [
      ...(material.aliases || []),
      ...(material.wiki?.aliases || []),
    ]
      .map((alias) => alias.trim())
      .filter((alias) => alias.length > 0);

    const deduped: string[] = [];
    const seen = new Set<string>();
    for (const alias of merged) {
      const key = alias.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(alias);
      }
    }
    return deduped;
  }, [material.aliases, material.wiki?.aliases]);

  const linkedMaterials = useMemo(() => {
    const linkedIds = material.linkedMaterialIds || [];
    if (linkedIds.length === 0) return [];

    const byId = new Map(
      allMaterials.map((candidate) => [candidate.id, candidate]),
    );
    return linkedIds
      .map((id) => byId.get(id))
      .filter((candidate): candidate is Material => !!candidate);
  }, [allMaterials, material.linkedMaterialIds]);

  const materialPermalink = `${window.location.origin}${buildMaterialPermalinkPath(
    material,
  )}`;

  const handleCopyMaterialLink = async () => {
    try {
      await navigator.clipboard.writeText(materialPermalink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleUpdateArticle = async (
    articleData: Omit<Article, "id" | "dateAdded">,
  ) => {
    if (!editingArticle) return;

    if (!canManageArticle(editingArticle.article)) return;

    if (!isAdminModeActive) {
      const changeReason = prompt(
        "Briefly explain your suggested article changes (required):",
      );
      if (!changeReason?.trim()) {
        toast.error("A reason is required to submit an edit request");
        return;
      }

      try {
        await api.createSubmission({
          type: "update_article",
          original_content_id: editingArticle.article.id,
          content_data: {
            ...articleData,
            article_id: editingArticle.article.id,
            material_id: material.id,
            category: editingArticle.category,
            change_reason: changeReason.trim(),
          },
        });

        toast.success("Edit suggestion submitted for admin review.");
        setEditingArticle(null);
        setShowForm(false);
      } catch {
        toast.error("Failed to submit edit suggestion");
      }
      return;
    }

    const updatedMaterial = updateArticleInMaterial(
      material,
      editingArticle.category,
      editingArticle.article.id,
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

  // Memoize cover image lookup
  const coverImage = useMemo(() => getFirstCoverImage(material), [material]);
  const canShowEditAction = !!(
    (isAdminModeActive && onEditMaterial) ||
    (isAuthenticated && onSuggestEdit)
  );

  return (
    <div
      className={`p-6 ${
        isElementHub
          ? "bg-[linear-gradient(180deg,rgba(228,227,172,0.22)_0%,rgba(255,255,255,0)_45%)] dark:bg-[linear-gradient(180deg,rgba(228,227,172,0.08)_0%,rgba(26,25,23,0)_45%)]"
          : ""
      }`}
    >
      <MaterialDetailHeader
        coverImage={coverImage}
        onBack={onBack}
        materialId={material.id}
        aliases={combinedAliases}
        category={material.category}
        isHub={isHub}
        totalArticles={totalArticles}
      />
      {canShowEditAction && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => {
              if (isAdminModeActive && onEditMaterial) {
                onEditMaterial(material);
                return;
              }

              if (isAuthenticated && onSuggestEdit) {
                onSuggestEdit(material);
              }
            }}
            className="retro-btn-primary inline-flex items-center gap-2 p-1 px-2 cursor-pointer  bg-white dark:bg-[#2a2825] hover:bg-black/5 dark:hover:bg-white/10"
            aria-label={
              isAdminModeActive
                ? `Edit ${material.name}`
                : `Suggest edit for ${material.name}`
            }
          >
            <Edit2 size={14} aria-hidden="true" />
            {isAdminModeActive ? "Edit Material" : "Suggest Edit"}
          </button>
        </div>
      )}
      <div className="grid grid-cols-10">
        <MaterialDetailSidebar
          isElementHub={isElementHub}
          hasCoverImage={Boolean(coverImage)}
          isHub={isHub}
          linkedMaterials={linkedMaterials}
          copied={copied}
          onCopyMaterialLink={handleCopyMaterialLink}
        />

        {material.description && (
          <MaterialDescriptionCard description={material.description} />
        )}
      </div>
      {/* Enable once this feature is ready */}
      {false && <RasterizedQuantileArticleCategories material={material} />}

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

      <MaterialArticlesGrid
        articles={allArticles}
        onEditArticle={(article, category) => {
          setEditingArticle({ article, category });
          setShowForm(true);
        }}
        onDeleteArticle={handleDeleteArticle}
        onReadMore={onViewArticleStandalone}
        isAdminModeActive={isAdminModeActive}
        currentUserId={currentUserId}
        onViewArticles={onViewArticles}
      />

      <AlertDialog
        open={!!articleToDelete}
        onOpenChange={(open) => {
          if (!open) setArticleToDelete(null);
        }}
      >
        <AlertDialogContent className="bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black dark:text-white">
              Delete article?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-black/70 dark:text-white/70">
              This will permanently remove
              {articleToDelete
                ? ` \"${articleToDelete.article.title}\"`
                : " this article"}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteArticle}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
