import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Leaf, Recycle, Repeat } from "lucide-react";
import { useNavigationContext } from "../../contexts/NavigationContext";
import { useMaterialsContext } from "../../contexts/MaterialsContext";
import { articlesLogger } from "../../utils/loggerFactories";
import * as api from "../../utils/api";

const pathwayConfig = {
  compostability: {
    tag: "Compost",
    icon: Leaf,
    tint: "bg-green-50 text-green-700",
  },
  recyclability: {
    tag: "Recycle",
    icon: Recycle,
    tint: "bg-sky-50 text-sky-700",
  },
  reusability: {
    tag: "Reuse",
    icon: Repeat,
    tint: "bg-violet-50 text-violet-700",
  },
} as const;

type PopularArticle = {
  articleId: string;
  materialId: string;
  materialName: string;
  title: string;
  category: "compostability" | "recyclability" | "reusability";
  articleType: string;
  tag: string;
  icon: typeof Leaf;
  tint: string;
};

const VALID_CATEGORIES = new Set([
  "compostability",
  "recyclability",
  "reusability",
]);

export function PopularArticles() {
  const { navigateTo } = useNavigationContext();
  const { materials } = useMaterialsContext();

  const materialNameById = useMemo(
    () => new Map(materials.map((m) => [m.id, m.name])),
    [materials],
  );

  const [popularArticles, setPopularArticles] = useState<PopularArticle[]>([]);

  useEffect(() => {
    api
      .getArticles()
      .then((articles) => {
        articlesLogger.log("raw articles from API:", articles);

        const valid = (articles ?? []).filter((a: any) => {
          const cat = a.sustainability_category || a.category;
          return a.id && a.title && VALID_CATEGORIES.has(cat);
        });

        articlesLogger.log("valid articles:", valid);

        const sorted = [...valid].sort((a: any, b: any) => {
          const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return tb - ta;
        });

        setPopularArticles(
          sorted.slice(0, 3).map((a: any) => {
            const category = (a.sustainability_category || a.category) as
              | "compostability"
              | "recyclability"
              | "reusability";
            return {
              articleId: a.id,
              materialId: a.material_id,
              materialName: materialNameById.get(a.material_id) ?? "",
              title: a.title,
              category,
              articleType: a.article_type ?? a.category ?? "",
              ...pathwayConfig[category],
            };
          }),
        );
      })
      .catch((err) => {
        articlesLogger.error("failed to load popular articles:", err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialNameById]);

  if (popularArticles.length === 0) return null;

  return (
    <section className="mt-14 p-6">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2>Popular this week</h2>
          <p className="text-xs text-[#6b6b6b] mt-1">
            Recently updated entries across all three pathways.
          </p>
        </div>
        <button
          className="text-sm text-[#6b8e3d] flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
          onClick={() => navigateTo({ type: "all-articles" })}
        >
          Browse all <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {popularArticles.map(
          ({
            articleId,
            materialId,
            category,
            title,
            materialName,
            articleType,
            tag,
            icon: Icon,
            tint,
          }) => (
            <article
              key={articleId}
              className="p-4 rounded-xl bg-white border border-accent-foreground hover:border-[#6b8e3d] cursor-pointer transition-colors"
              onClick={() =>
                navigateTo({
                  type: "article-standalone",
                  articleId,
                  materialId,
                  category,
                })
              }
            >
              <div
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${tint}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tag}
              </div>
              <h3 className="mt-3 leading-snug">{title}</h3>
              <p className="mt-2 text-xs text-[#6b6b6b]">
                {materialName} · {articleType}
              </p>
            </article>
          ),
        )}
      </div>
    </section>
  );
}
