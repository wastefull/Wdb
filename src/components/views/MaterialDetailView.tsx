import { useState, useMemo } from "react";
import { ArrowLeft, Copy, Check, ExternalLink } from "lucide-react";
import { Material } from "../../types/material";
import { Article, CategoryType } from "../../types/article";
import { buildMaterialPermalinkPath } from "../../utils/permalinks";
import {
  getAllArticles,
  getArticleCount,
  getFirstCoverImage,
  updateArticleInMaterial,
  removeArticleFromMaterial,
} from "../../utils/materialArticles";
import { RasterizedQuantileVisualization } from "../charts/RasterizedQuantileVisualization";
import { ArticleCard } from "../cards";
import { ArticleForm } from "../forms";

interface MaterialDetailViewProps {
  material: Material;
  allMaterials: Material[];
  onBack: () => void;
  onViewMaterial: (materialId: string) => void;
  onViewCategoryMaterials: (category: Material["category"]) => void;
  onViewArticles: (category: CategoryType) => void;
  onUpdateMaterial: (material: Material) => void;
  onViewArticleStandalone: (articleId: string, category: CategoryType) => void;
  isAdminModeActive?: boolean;
}

export function MaterialDetailView({
  material,
  allMaterials,
  onBack,
  onViewMaterial,
  onViewCategoryMaterials,
  onViewArticles,
  onUpdateMaterial,
  onViewArticleStandalone,
  isAdminModeActive,
}: MaterialDetailViewProps) {
  const isElementHub = material.category === "Elements";
  const isHub = material.isHub || isElementHub;

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

  return (
    <div
      className={`p-6 ${
        isElementHub
          ? "bg-[linear-gradient(180deg,rgba(228,227,172,0.22)_0%,rgba(255,255,255,0)_45%)] dark:bg-[linear-gradient(180deg,rgba(228,227,172,0.08)_0%,rgba(26,25,23,0)_45%)]"
          : ""
      }`}
    >
      {/* Hero backdrop with cover image */}
      {coverImage && (
        <div className="relative -mx-6 -mt-6 mb-6 h-32 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${coverImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-white/70 to-white dark:via-[#1a1917]/70 dark:to-[#1a1917]" />
        </div>
      )}
      <div
        className={`flex items-center gap-4 mb-6 ${
          coverImage ? "-mt-16 relative" : ""
        }`}
      >
        <button onClick={onBack} className="card-interactive">
          <ArrowLeft size={16} className="text-black" />
        </button>
        <div className="flex-1">
          {combinedAliases.length > 0 && (
            <p className="text-[12px] text-black/60 dark:text-white/60 mt-1">
              also called: {combinedAliases.join(", ")}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <button
              type="button"
              onClick={() => onViewCategoryMaterials(material.category)}
              className="tag-cyan cursor-pointer"
              aria-label={`View all ${material.category} materials`}
            >
              {material.category}
            </button>
            {isHub ? (
              <button
                type="button"
                onClick={() => onViewCategoryMaterials(material.category)}
                className="tag-green cursor-pointer"
                aria-label="Hub material"
              >
                Parent material
              </button>
            ) : (
              ""
            )}
            <h2 className="text-[32px] normal">{material.name}</h2>

            <p className="text-[12px] text-black/60 dark:text-white/60">
              {totalArticles} article{totalArticles !== 1 ? "s" : ""}
            </p>
            <button
              onClick={handleCopyMaterialLink}
              className="px-2 py-1 rounded-md border border-[#211f1c] dark:border-white/20 text-[11px] text-black/80 dark:text-white/80 bg-white dark:bg-[#2a2825] hover:bg-black/5 dark:hover:bg-white/10 transition-colors inline-flex items-center gap-1"
              title="Copy material link"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy material link"}
            </button>
          </div>
        </div>
      </div>

      {isElementHub && (
        <div className="bg-[#f6f5de] dark:bg-[#2d2a1f] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 p-4 mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] uppercase tracking-[0.08em] text-black/60 dark:text-white/60">
                Element Navigation
              </p>
              <p className="text-[14px] text-black/80 dark:text-white/80">
                Browse neighboring elements in the interactive periodic table.
              </p>
            </div>
            <a
              href="https://wastefull.org/pt"
              target="_blank"
              rel="noopener noreferrer"
              className="retro-btn-primary inline-flex items-center gap-2 whitespace-nowrap px-4 py-2"
            >
              Open periodic table
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      )}

      {isHub && linkedMaterials.length > 0 && (
        <div className="bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 p-4 mb-6">
          <p className="text-[13px] uppercase tracking-[0.08em] text-black/60 dark:text-white/60 mb-2">
            Linked Materials
          </p>
          <div className="flex flex-wrap gap-2">
            {linkedMaterials.map((linkedMaterial) => (
              <button
                key={linkedMaterial.id}
                type="button"
                onClick={() => onViewMaterial(linkedMaterial.id)}
                className="px-2 py-1 rounded-md border border-[#211f1c] dark:border-white/20 text-[11px] text-black/80 dark:text-white/80 bg-white dark:bg-[#2a2825] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                {linkedMaterial.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {material.description && (
        <div className="bg-white rounded-[11.464px] border-[1.5px] border-[#211f1c] p-4 mb-6">
          <p className="text-[13px] text-black/80">{material.description}</p>
        </div>
      )}

      <div className="retro-card-flat p-4 mb-6 max-w-sm mx-auto">
        <h3 className="text-[16px] normal mb-4 text-center">
          Articles by Category
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
            showScores={false}
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
            showScores={false}
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
            showScores={false}
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
          <h3 className="text-[16px] text-black mb-4">All Articles</h3>
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
          <p className="text-[16px] text-black/50 dark:text-white/50">
            No articles yet. Click on a category above to add one!
          </p>
        </div>
      )}
    </div>
  );
}
