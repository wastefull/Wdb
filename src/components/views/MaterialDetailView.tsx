import { useEffect, useState, useMemo } from "react";
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
  getDisplayArticles,
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
  MaterialDoodle,
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
import type {
  MaterialEvidenceScoringSummary,
  MaterialContentResource,
  MaterialVideoResource,
} from "../../types/materialExperience";
import type { PublicMaterialRelationshipResource } from "../../types/manualMaterialRelationship";

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
  onViewGuide?: (guideId: string) => void;
  isAdminModeActive?: boolean;
  isAuthenticated?: boolean;
  currentUserId?: string;
  userRole?: string;
  onEditMaterial?: (materialId: string) => void;
  onSuggestEdit?: (materialId: string) => void;
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
  onViewGuide,
  onViewMaterial,
}: MaterialDetailViewProps) {
  const {
    navigateToEvidenceLab,
    navigateToExport,
    navigateToBlog,
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
  const [videoResources, setVideoResources] = useState<MaterialVideoResource[]>(
    [],
  );
  const [materialRelationships, setMaterialRelationships] = useState<
    PublicMaterialRelationshipResource[]
  >([]);
  const [contentResources, setContentResources] = useState<
    MaterialContentResource[]
  >([]);
  const [sourceLibraryDOIs, setSourceLibraryDOIs] = useState<Set<string>>(
    new Set(),
  );
  const [evidenceSummary, setEvidenceSummary] =
    useState<MaterialEvidenceScoringSummary | null>(null);
  const [areVideoResourcesLoading, setAreVideoResourcesLoading] =
    useState(true);

  useEffect(() => {
    let active = true;
    setAreVideoResourcesLoading(true);
    void api
      .getMaterialVideoResources(material.id)
      .then((videos) => {
        if (active) setVideoResources(videos);
      })
      .catch(() => {
        if (active) setVideoResources([]);
      })
      .finally(() => {
        if (active) setAreVideoResourcesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [material.id]);

  useEffect(() => {
    let active = true;
    void api
      .getMaterialRelationshipResources(material.id)
      .then((relationships) => {
        if (active) setMaterialRelationships(relationships);
      })
      .catch(() => {
        if (active) setMaterialRelationships([]);
      });
    return () => {
      active = false;
    };
  }, [material.id]);

  useEffect(() => {
    let active = true;
    void api
      .getMaterialContentResources(material.id)
      .then((content) => {
        if (active) setContentResources(content);
      })
      .catch(() => {
        if (active) setContentResources([]);
      });
    return () => {
      active = false;
    };
  }, [material.id]);

  useEffect(() => {
    let active = true;
    void api
      .getAllSources()
      .then((sources) => {
        if (!active) return;
        setSourceLibraryDOIs(
          new Set(
            sources
              .filter((source) => source.doi)
              .map((source) => source.doi!.toLowerCase()),
          ),
        );
      })
      .catch(() => {
        if (active) setSourceLibraryDOIs(new Set());
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void api
      .getMaterialEvidenceScoringSummary(material.id)
      .then((summary) => {
        if (active) setEvidenceSummary(summary);
      })
      .catch(() => {
        if (active) setEvidenceSummary(null);
      });
    return () => {
      active = false;
    };
  }, [material.id]);

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

  const displayArticles = useMemo(
    () => getDisplayArticles(material, allMaterials),
    [allMaterials, material],
  );

  const experienceModel = useMemo(
    () =>
      buildMaterialExperienceModel(
        material,
        displayArticles,
        undefined,
        evidenceSummary,
      ),
    [displayArticles, evidenceSummary, material],
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
              <div className="sidebar doodle-container">
                <MaterialDoodle
                  materialId={material.id}
                  materialName={material.name}
                  alt={`${material.name} doodle`}
                  variant="sidebar"
                />
              </div>
              {canShowEditAction && (
                <button
                  type="button"
                  onClick={() => {
                    if (isAdminModeActive && onEditMaterial) {
                      onEditMaterial(material.id);
                      return;
                    }

                    if (isAuthenticated && onSuggestEdit) {
                      onSuggestEdit(material.id);
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
            <div>
              <MaterialDescriptionCard
                description={
                  material.description ||
                  "No plain-language description has been added yet, but you could suggest one!"
                }
                category={material.category}
                aliases={combinedAliases}
                onViewCategory={() =>
                  onViewCategoryMaterials(material.category)
                }
              />
            </div>
            <div>
              <MaterialDetailSidebar
                materialId={material.id}
                isElementHub={isElementHub}
                isHub={isHub}
                linkedRelationships={materialRelationships}
                parentHubs={parentHubs}
                materialName={material.name}
                copied={copied}
                onCopyMaterialLink={handleCopyMaterialLink}
              />
            </div>
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
          videoResources={videoResources}
          areVideoResourcesLoading={areVideoResourcesLoading}
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
          sourceLibraryDOIs={sourceLibraryDOIs}
          onOpenEvidenceLab={
            isAdminModeActive ? navigateToEvidenceLab : undefined
          }
          onSuggestEdit={() => {
            if (isAdminModeActive && onEditMaterial) {
              onEditMaterial(material.id);
              return;
            }
            onSuggestEdit?.(material.id);
          }}
          canSuggestEdit={Boolean(
            (isAdminModeActive && onEditMaterial) ||
            (isAuthenticated && onSuggestEdit),
          )}
          isAdminModeActive={isAdminModeActive}
          onViewGuide={onViewGuide}
          onViewBlog={navigateToBlog}
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
                  Articles are contributed by volunteers like you and reviewed
                  for accuracy. If you feel that the featured article is
                  inaccurate or biased, please suggest corrections or upload
                  your own, superior article on the topic.
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
          contentResources={contentResources}
          materialId={material.id}
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
