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
} from "../shared";
import {
  MaterialExperienceSections,
  SectionHeading,
} from "../material-experience/MaterialExperienceSections";
import { MaterialSectionNavigator } from "../material-experience/MaterialSectionNavigator";
import { buildMaterialExperienceModel } from "../../utils/materialExperience";
import { getArticleCount } from "../../utils/materialArticles";
import { useNavigationContext } from "../../contexts/NavigationContext";
import { MATERIAL_EXPERIENCE_SECTIONS } from "../../config/materialExperience";
import { isDevelopment } from "../../utils/environment";

interface MaterialDetailViewProps {
  material: Material;
  allMaterials: Material[];
  onBack: () => void;
  onViewCategoryMaterials: (category: Material["category"]) => void;
  onUpdateMaterial: (material: Material) => void;
  onViewArticleStandalone: (
    articleId: string,
    category: CategoryType,
    materialId?: string,
  ) => void;
  isAdminModeActive?: boolean;
  isAuthenticated?: boolean;
  currentUserId?: string;
  userRole?: string;
  onEditMaterial?: (material: Material) => void;
  onSuggestEdit?: (material: Material) => void;
  onViewArticles?: (category: CategoryType) => void;
  onViewMaterial?: (materialId: string) => void;
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
  userRole,
  onEditMaterial,
  onSuggestEdit,
  onViewArticles,
  onViewMaterial,
}: MaterialDetailViewProps) {
  const {
    navigateToEvidenceLab,
    navigateToExport,
    navigateToScienceHub,
    navigateToScientificEditor,
    navigateToSourceLibrary,
  } = useNavigationContext();
  const isElementHub = material.category === "Elements";
  const isHub = material.isHub || isElementHub;

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

  const displayArticles = useMemo(() => {
    const ownArticles = getAllArticles(material).map((entry) => ({
      ...entry,
      linkedMaterialName: undefined as string | undefined,
      linkedMaterialId: undefined as string | undefined,
    }));
    const linkedArticles = isHub
      ? linkedMaterials.flatMap((linked) =>
          getAllArticles(linked).map((entry) => ({
            ...entry,
            linkedMaterialName: linked.name,
            linkedMaterialId: linked.id,
          })),
        )
      : [];
    const byDate = (
      a: { article: { dateAdded: string } },
      b: { article: { dateAdded: string } },
    ) =>
      new Date(b.article.dateAdded).getTime() -
      new Date(a.article.dateAdded).getTime();
    return [...ownArticles.sort(byDate), ...linkedArticles.sort(byDate)];
  }, [material, isHub, linkedMaterials]);

  const experienceModel = useMemo(
    () => buildMaterialExperienceModel(material, displayArticles),
    [displayArticles, material],
  );

  const articleCounts = useMemo(
    () => ({
      compostability:
        displayArticles.filter((entry) => entry.category === "compostability")
          .length || getArticleCount(material, "compostability"),
      recyclability:
        displayArticles.filter((entry) => entry.category === "recyclability")
          .length || getArticleCount(material, "recyclability"),
      reusability:
        displayArticles.filter((entry) => entry.category === "reusability")
          .length || getArticleCount(material, "reusability"),
    }),
    [displayArticles, material],
  );

  const parentHubs = useMemo(
    () =>
      allMaterials.filter(
        (m) =>
          (m.isHub || m.category === "Elements") &&
          m.linkedMaterialIds?.includes(material.id),
      ),
    [allMaterials, material.id],
  );

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

    if (!isAdminModeActive && userRole !== "admin") {
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
    <main
      className={`material-detail-view ${isElementHub ? "element-gradient" : ""}`}
    >
      <MaterialDetailHeader
        coverImage={coverImage}
        onBack={onBack}
        materialName={material.name}
        aliases={combinedAliases}
        category={material.category}
        isHub={isHub}
        totalArticles={displayArticles.length}
      />
      <MaterialSectionNavigator />
      <div className="section-container">
        <section
          id={MATERIAL_EXPERIENCE_SECTIONS[0].id}
          aria-labelledby="material-overview-heading"
          tabIndex={-1}
        >
          <div className="overview-container">
            <div className="overview">
              <SectionHeading
                section={MATERIAL_EXPERIENCE_SECTIONS[0]}
                showDisabledSections={isDevelopment()}
              />
              {canShowEditAction && (
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
                  aria-label={
                    isAdminModeActive
                      ? `Edit ${material.name}`
                      : `Suggest edit for ${material.name}`
                  }
                >
                  <Edit2 size={14} aria-hidden="true" />
                  {isAdminModeActive ? "Edit Material" : "Suggest Edit"}
                </button>
              )}
            </div>
          </div>

          <div className="material-description">
            <MaterialDescriptionCard
              description={
                material.description ||
                "No plain-language description has been added yet."
              }
              category={material.category}
              aliases={combinedAliases}
              onViewCategory={() => onViewCategoryMaterials(material.category)}
            />
            <MaterialDetailSidebar
              isElementHub={isElementHub}
              isHub={isHub}
              linkedMaterials={linkedMaterials}
              parentHubs={parentHubs}
              materialName={material.name}
              copied={copied}
              onCopyMaterialLink={handleCopyMaterialLink}
            />
          </div>
        </section>

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

        <MaterialExperienceSections
          material={material}
          model={experienceModel}
          articleCounts={articleCounts}
          onViewArticles={(category) => onViewArticles?.(category)}
          onReadArticle={(articleId, category, materialId) =>
            onViewArticleStandalone(articleId, category, materialId)
          }
          onViewMaterial={onViewMaterial}
          onOpenScienceHub={navigateToScienceHub}
          onOpenExport={navigateToExport}
          onOpenScientificEditor={
            isAdminModeActive
              ? () => navigateToScientificEditor(material.id)
              : undefined
          }
          onOpenSourceLibrary={
            isAdminModeActive ? navigateToSourceLibrary : undefined
          }
          onOpenEvidenceLab={
            isAdminModeActive ? navigateToEvidenceLab : undefined
          }
          onSuggestEdit={() => {
            if (isAdminModeActive && onEditMaterial) {
              onEditMaterial(material);
              return;
            }
            onSuggestEdit?.(material);
          }}
          canSuggestEdit={Boolean(
            (isAdminModeActive && onEditMaterial) ||
            (isAuthenticated && onSuggestEdit),
          )}
          isAdminModeActive={isAdminModeActive}
          learningLibrary={
            <section
              aria-labelledby="learning-library-heading"
              className="space-y-5"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Current collection
                </p>
                <h2 id="learning-library-heading" className="mt-2 text-xl">
                  Learning Library
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  All current articles remain available, including edit and
                  delete controls for authorized contributors.
                </p>
              </div>
              <MaterialArticlesGrid
                articles={displayArticles}
                onEditArticle={(article, category) => {
                  setEditingArticle({ article, category });
                  setShowForm(true);
                }}
                onDeleteArticle={handleDeleteArticle}
                onReadMore={(articleId, category, materialId) =>
                  onViewArticleStandalone(articleId, category, materialId)
                }
                isAdminModeActive={isAdminModeActive}
                currentUserId={currentUserId}
                onViewArticles={onViewArticles}
                onViewMaterial={onViewMaterial}
                showHeading={false}
              />
            </section>
          }
        />
      </div>

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
    </main>
  );
}
