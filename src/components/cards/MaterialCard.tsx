import { Edit2, Trash2 } from "lucide-react";
import { Material } from "../../types/material";
import { CategoryType } from "../../types/article";
import { RasterizedQuantileVisualization } from "../charts/RasterizedQuantileVisualization";
import { ScientificMetadataView } from "../views/ScientificMetadataView";

export interface MaterialCardProps {
  material: Material;
  onEdit: () => void;
  onDelete: () => void;
  onViewArticles: (category: CategoryType) => void;
  onViewMaterial: () => void;
  onEditScientific?: () => void;
  onSuggestEdit?: () => void;
  isAdminModeActive?: boolean;
  isAuthenticated?: boolean;
  showScores?: boolean; // If false, hides score bars and numbers (BETA feature)
}

export function MaterialCard({
  material,
  onEdit,
  onDelete,
  onViewArticles,
  onViewMaterial,
  onEditScientific,
  onSuggestEdit,
  isAdminModeActive,
  isAuthenticated,
  showScores = true,
}: MaterialCardProps) {
  return (
    <div className="retro-card relative p-4 md:overflow-hidden 2xl:overflow-visible">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <button
            onClick={onViewMaterial}
            className="text-[18px] text-black dark:text-white mb-1 hover:underline cursor-pointer text-left block"
            aria-label={`View details for ${material.name}`}
          >
            {material.name}
          </button>

          {/* Writer/Editor Attribution */}
          {(material.writer_name || material.editor_name) && (
            <div className="mt-1 flex items-center gap-1 flex-wrap text-[8px] text-black/40 dark:text-white/40">
              {material.writer_name && material.editor_name ? (
                <>
                  <span>by {material.writer_name}</span>
                  <span>•</span>
                  <span>ed. {material.editor_name}</span>
                </>
              ) : material.writer_name ? (
                <span>by {material.writer_name}</span>
              ) : material.editor_name ? (
                <span>ed. {material.editor_name}</span>
              ) : null}
            </div>
          )}
          <span className="tag-cyan">{material.category}</span>
        </div>
        {isAdminModeActive ? (
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="icon-box-sm bg-waste-recycle"
              aria-label={`Edit ${material.name}`}
            >
              <Edit2 size={14} className="text-black" aria-hidden="true" />
            </button>
            <button
              onClick={onDelete}
              className="icon-box-sm bg-waste-compost"
              aria-label={`Delete ${material.name}`}
            >
              <Trash2 size={14} className="text-black" aria-hidden="true" />
            </button>
          </div>
        ) : isAuthenticated && onSuggestEdit ? (
          <button
            onClick={onSuggestEdit}
            className="icon-box-sm bg-waste-reuse"
            aria-label={`Suggest edit for ${material.name}`}
            title="Suggest an edit"
          >
            <Edit2 size={14} className="text-black" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {material.description && (
        <p className="text-[14px] text-black/70 dark:text-white/70 mb-3 line-clamp-2">
          {material.description}
        </p>
      )}

      <div className="flex flex-col gap-2 mb-3">
        <hr />
        Articles by Category:
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
          articleCount={material.articles?.compostability.length}
          showScores={showScores}
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
          articleCount={material.articles?.recyclability.length}
          showScores={showScores}
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
          articleCount={material.articles?.reusability.length}
          showScores={showScores}
        />
      </div>

      <ScientificMetadataView
        material={material}
        onEditScientific={onEditScientific}
        isAdminModeActive={isAdminModeActive}
      />
    </div>
  );
}
