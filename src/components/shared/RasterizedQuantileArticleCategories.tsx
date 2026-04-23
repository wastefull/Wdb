import { CategoryType } from "../../types/article";
import { Material } from "../../types/material";
import { useNavigationContext } from "../../contexts/NavigationContext";
import { getArticleCount } from "../../utils/materialArticles";
import { RasterizedQuantileVisualization } from "../charts/RasterizedQuantileVisualization";

interface RasterizedQuantileArticleCategoriesProps {
  material: Material;
}

export function RasterizedQuantileArticleCategories({
  material,
}: RasterizedQuantileArticleCategoriesProps) {
  const { navigateToArticles } = useNavigationContext();

  const handleViewArticles = (category: CategoryType) => {
    navigateToArticles(material.id, category);
  };

  return (
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
          onClick={() => handleViewArticles("compostability")}
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
          onClick={() => handleViewArticles("recyclability")}
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
          onClick={() => handleViewArticles("reusability")}
          articleCount={getArticleCount(material, "reusability")}
          showScores={false}
        />
      </div>
    </div>
  );
}
