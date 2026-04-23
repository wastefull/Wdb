import { useState, useMemo } from "react";
import { Edit2 } from "lucide-react";
import { Material } from "../../types/material";
import { Article, CategoryType } from "../../types/article";
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

  const handleDeleteArticle = (articleId: string, category: CategoryType) => {
    if (confirm("Are you sure you want to delete this article?")) {
      const updatedMaterial = removeArticleFromMaterial(
        material,
        category,
        articleId,
      );
      onUpdateMaterial(updatedMaterial);
    }
  };

  const [editingArticle, setEditingArticle] = useState<{
    article: Article;
    category: CategoryType;
  } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleUpdateArticle = (
    articleData: Omit<Article, "id" | "dateAdded">,
  ) => {
    if (!editingArticle) return;

    const updatedMaterial = updateArticleInMaterial(
      material,
      editingArticle.category,
      editingArticle.article.id,
      (a) => ({ ...articleData, id: a.id, dateAdded: a.dateAdded }),
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
        onViewArticles={onViewArticles}
      />
    </div>
  );
}
