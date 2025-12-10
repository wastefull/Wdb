import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../ui/collapsible";
import {
  ChevronDown,
  FlaskConical,
  TrendingUp,
  Database,
  Calendar,
  FileText,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { useState } from "react";
import { Material } from "../../types/material";
import { classes, classBank, styles } from "../ui/classBank";
interface ScientificMetadataViewProps {
  material: Material;
  onEditScientific?: () => void;
  isAdminModeActive?: boolean;
}
const badgeClasses = classBank.badges;
const confidenceIconClasses = classBank.icons.confidence;
export function ScientificMetadataView({
  material,
  onEditScientific,
  isAdminModeActive,
}: ScientificMetadataViewProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Check if this material has scientific data
  const hasScientificData =
    material.Y_value !== undefined ||
    material.CR_practical_mean !== undefined ||
    material.whitepaper_version !== undefined;

  // Show component even if no scientific data exists (for admin to add it)
  if (!hasScientificData && !isAdminModeActive) {
    return null;
  }

  // Validate confidence level against sources
  const validateConfidenceLevel = () => {
    const sourceCount = material.sources?.length || 0;
    const level = material.confidence_level;

    if (!level) return null;

    if (level === "High" && sourceCount < 3) {
      return `High confidence requires 3+ sources (currently ${sourceCount})`;
    }
    if (level === "Medium" && sourceCount < 2) {
      return `Medium confidence requires 2+ sources (currently ${sourceCount})`;
    }
    if ((level === "High" || level === "Medium") && sourceCount === 0) {
      return `${level} confidence requires supporting citations (currently 0)`;
    }

    return null;
  };

  const validationWarning = validateConfidenceLevel();

  const getConfidenceIcon = (level?: string) => {
    const cic = confidenceIconClasses;
    switch (level) {
      case "High":
        return <CheckCircle2 className={classes(cic.size, cic.level.high)} />;
      case "Medium":
        return <AlertCircle className={classes(cic.size, cic.level.medium)} />;
      case "Low":
        return <XCircle className={classes(cic.size, cic.level.low)} />;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get sources that contributed to a specific parameter
  const getSourcesForParameter = (parameterName: string) => {
    if (!material.sources) return [];
    return material.sources
      .map((source, idx) => ({ ...source, index: idx }))
      .filter((source) => source.parameters?.includes(parameterName));
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className={styles.wFull}>
        <div className={styles.metaDataViewStyles}>
          <FlaskConical className={styles.w4h4} />
          <span className="text-[13px]">Scientific Data</span>
          {validationWarning && (
            <AlertTriangle
              className={classes(
                styles.w4h4,
                confidenceIconClasses.level.medium,
                confidenceIconClasses.margin
              )}
            />
          )}
          {material.confidence_level && (
            <div className={`${validationWarning ? "" : "ml-auto"}`}>
              {getConfidenceIcon(material.confidence_level)}
            </div>
          )}
          <ChevronDown
            className={`${styles.w4h4} transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <Card className={classes(classBank.cards.flat)}>
          {/* Validation Warning */}
          {validationWarning && (
            <Alert className="mb-4 bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-[11px] text-amber-800 dark:text-amber-200">
                <strong>Data Quality Issue:</strong> {validationWarning}
                {isAdminModeActive &&
                  " Please edit scientific data to add sources or adjust confidence level."}
              </AlertDescription>
            </Alert>
          )}

          {/* Admin Edit Button */}
          {isAdminModeActive && onEditScientific && (
            <div className="mb-4">
              <Button
                onClick={onEditScientific}
                size="sm"
                className="w-full bg-[#e4e3ac] hover:bg-[#d4d39c] text-black"
              >
                <Edit2 className="w-3 h-3 mr-2" />
                {hasScientificData
                  ? "Edit Scientific Data"
                  : "Add Scientific Data"}
              </Button>
            </div>
          )}

          {!hasScientificData && (
            <p className="text-[11px] text-black/60 dark:text-white/60 text-center py-4">
              No scientific data available.{" "}
              {isAdminModeActive && "Click above to add scientific parameters."}
            </p>
          )}

          {hasScientificData && (
            <div className="space-y-4">
              {/* Raw Parameters */}
              {(material.Y_value !== undefined ||
                material.D_value !== undefined) && (
                <div>
                  <div
                    className={classes({
                      style: styles.scientificMetadataLayout,
                    })}
                  >
                    <Database className="w-4 h-4 text-black dark:text-white" />
                    <h4
                      className={classes({
                        colors: styles.BW,
                        sizes: styles.med,
                      })}
                    >
                      Raw Parameters (0-1 normalized)
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-[11px]">
                    {material.Y_value !== undefined && (
                      <div>
                        <div
                          className={classes({
                            style: styles.flexJustifyCenterMB1,
                          })}
                        >
                          <span className={classes({ style: styles.BW60 })}>
                            Yield (Y):
                          </span>
                          <span
                            className={classes({
                              colors: styles.BW,
                              sizes: styles.med,
                            })}
                          >
                            {material.Y_value.toFixed(2)}
                          </span>
                        </div>
                        {getSourcesForParameter("Y_value").length > 0 && (
                          <div className="flex flex-wrap gap-1 pl-2">
                            {getSourcesForParameter("Y_value").map((source) => (
                              <Badge
                                key={source.index}
                                variant="outline"
                                className="text-[8px] bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                              >
                                [{source.index + 1}]{" "}
                                {source.authors
                                  ?.split(",")[0]
                                  ?.split(" et al")[0] || "Source"}{" "}
                                {source.year}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {material.D_value !== undefined && (
                      <div>
                        <div className={styles.flexJustifyCenterMB1}>
                          <span className={styles.BW60}>
                            Degradability (D):
                          </span>
                          <span
                            className={classes({
                              colors: styles.BW,
                              sizes: styles.med,
                            })}
                          >
                            {material.D_value.toFixed(2)}
                          </span>
                        </div>
                        {getSourcesForParameter("D_value").length > 0 && (
                          <div className={styles.flexWrapGap1Pl2}>
                            {getSourcesForParameter("D_value").map((source) => (
                              <Badge
                                key={source.index}
                                variant="outline"
                                className={classes(
                                  badgeClasses.variant.outline
                                )}
                              >
                                [{source.index + 1}]{" "}
                                {source.authors
                                  ?.split(",")[0]
                                  ?.split(" et al")[0] || "Source"}{" "}
                                {source.year}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {material.C_value !== undefined && (
                      <div>
                        <div className={styles.flexJustifyCenterMB1}>
                          <span className={styles.BW60}>
                            Contamination (C):
                          </span>
                          <span
                            className={classes({
                              colors: styles.BW,
                              sizes: styles.med,
                            })}
                          >
                            {material.C_value.toFixed(2)}
                          </span>
                        </div>
                        {getSourcesForParameter("C_value").length > 0 && (
                          <div className={styles.flexWrapGap1Pl2}>
                            {getSourcesForParameter("C_value").map((source) => (
                              <Badge
                                key={source.index}
                                variant="outline"
                                className={classes(
                                  badgeClasses.variant.outline
                                )}
                              >
                                [{source.index + 1}]{" "}
                                {source.authors
                                  ?.split(",")[0]
                                  ?.split(" et al")[0] || "Source"}{" "}
                                {source.year}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {material.M_value !== undefined && (
                      <div>
                        <div className={styles.flexJustifyCenterMB1}>
                          <span className={classes({ style: styles.BW60 })}>
                            Maturity (M):
                          </span>
                          <span
                            className={classes({
                              colors: styles.BW,
                              sizes: styles.med,
                            })}
                          >
                            {material.M_value.toFixed(2)}
                          </span>
                        </div>
                        {getSourcesForParameter("M_value").length > 0 && (
                          <div className="flex flex-wrap gap-1 pl-2">
                            {getSourcesForParameter("M_value").map((source) => (
                              <Badge
                                key={source.index}
                                variant="outline"
                                className={classes(
                                  badgeClasses.variant.outline
                                )}
                              >
                                [{source.index + 1}]{" "}
                                {source.authors
                                  ?.split(",")[0]
                                  ?.split(" et al")[0] || "Source"}{" "}
                                {source.year}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {material.E_value !== undefined && material.E_value > 0 && (
                      <div>
                        <div className={styles.flexJustifyCenterMB1}>
                          <span className={styles.BW60}>Energy (E):</span>
                          <span
                            className={classes({
                              colors: styles.BW,
                              sizes: styles.med,
                            })}
                          >
                            {material.E_value.toFixed(2)}
                          </span>
                        </div>
                        {getSourcesForParameter("E_value").length > 0 && (
                          <div
                            className={classes({
                              layout: styles.flexWrapGap1Pl2,
                              pl: styles.PL2,
                            })}
                          >
                            {getSourcesForParameter("E_value").map((source) => (
                              <Badge
                                key={source.index}
                                variant="outline"
                                className={classes(
                                  badgeClasses.variant.outline
                                )}
                              >
                                [{source.index + 1}]{" "}
                                {source.authors
                                  ?.split(",")[0]
                                  ?.split(" et al")[0] || "Source"}{" "}
                                {source.year}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Composite Scores */}
              {(material.CR_practical_mean !== undefined ||
                material.CR_theoretical_mean !== undefined) && (
                <div>
                  <div
                    className={classes({
                      layout: styles.scientificMetadataLayout,
                    })}
                  >
                    <TrendingUp className="w-4 h-4 text-black dark:text-white" />
                    <h4
                      className={classes({
                        colors: styles.BW,
                        sizes: styles.med,
                      })}
                    >
                      Composite Recyclability Index (CR)
                    </h4>
                  </div>
                  <div className="space-y-3 text-[11px]">
                    {material.CR_practical_mean !== undefined && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className={classes({ style: styles.BW60 })}>
                            Practical:
                          </span>
                          <span
                            className={classes({
                              colors: styles.BW,
                              sizes: styles.med,
                            })}
                          >
                            {(material.CR_practical_mean * 100).toFixed(1)}%
                          </span>
                        </div>
                        {material.CR_practical_CI95 && (
                          <div className="text-[10px] text-black/50 dark:text-white/50 mb-1">
                            95% CI: [
                            {(material.CR_practical_CI95.lower * 100).toFixed(
                              1
                            )}
                            %,{" "}
                            {(material.CR_practical_CI95.upper * 100).toFixed(
                              1
                            )}
                            %]
                          </div>
                        )}
                        {getSourcesForParameter("CR_practical_mean").length >
                          0 && (
                          <div className="flex flex-wrap gap-1 pl-2">
                            {getSourcesForParameter("CR_practical_mean").map(
                              (source) => (
                                <Badge
                                  key={source.index}
                                  variant="outline"
                                  className="text-[8px] bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                                >
                                  [{source.index + 1}]{" "}
                                  {source.authors
                                    ?.split(",")[0]
                                    ?.split(" et al")[0] || "Source"}{" "}
                                  {source.year}
                                </Badge>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {material.CR_theoretical_mean !== undefined && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className={classes({ style: styles.BW60 })}>
                            Theoretical:
                          </span>
                          <span
                            className={classes({
                              colors: styles.BW,
                              sizes: styles.med,
                            })}
                          >
                            {(material.CR_theoretical_mean * 100).toFixed(1)}%
                          </span>
                        </div>
                        {material.CR_theoretical_CI95 && (
                          <div className="text-[10px] text-black/50 dark:text-white/50 mb-1">
                            95% CI: [
                            {(material.CR_theoretical_CI95.lower * 100).toFixed(
                              1
                            )}
                            %,{" "}
                            {(material.CR_theoretical_CI95.upper * 100).toFixed(
                              1
                            )}
                            %]
                          </div>
                        )}
                        {getSourcesForParameter("CR_theoretical_mean").length >
                          0 && (
                          <div className="flex flex-wrap gap-1 pl-2">
                            {getSourcesForParameter("CR_theoretical_mean").map(
                              (source) => (
                                <Badge
                                  key={source.index}
                                  variant="outline"
                                  className="text-[8px] bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                                >
                                  [{source.index + 1}]{" "}
                                  {source.authors
                                    ?.split(",")[0]
                                    ?.split(" et al")[0] || "Source"}{" "}
                                  {source.year}
                                </Badge>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sources */}
              {material.sources && material.sources.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-black dark:text-white" />
                    <h4
                      className={classes({
                        colors: styles.BW,
                        sizes: styles.med,
                      })}
                    >
                      Sources ({material.sources.length})
                    </h4>
                  </div>
                  <div className="space-y-2 text-[10px]">
                    {material.sources.map((source, idx) => (
                      <div
                        key={idx}
                        className="border-l-2 border-blue-300 dark:border-blue-700 pl-2"
                      >
                        <div className="text-black/80 dark:text-white/80">
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            [{idx + 1}]
                          </span>{" "}
                          {source.authors && `${source.authors}. `}
                          {source.title}
                          {source.year && ` (${source.year})`}
                          {source.doi && (
                            <a
                              href={`https://doi.org/${source.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1 text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              DOI
                            </a>
                          )}
                        </div>
                        {source.parameters && source.parameters.length > 0 && (
                          <div className="mt-1 text-[9px] text-black/60 dark:text-white/60">
                            <span className="italic">Used for:</span>{" "}
                            {source.parameters
                              .map((param) => {
                                const paramNames: Record<string, string> = {
                                  Y_value: "Yield",
                                  D_value: "Degradability",
                                  C_value: "Contamination",
                                  M_value: "Maturity",
                                  E_value: "Energy",
                                  CR_practical_mean: "CR Practical",
                                  CR_theoretical_mean: "CR Theoretical",
                                };
                                return paramNames[param] || param;
                              })
                              .join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="pt-2 border-t border-[#211f1c] dark:border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-black dark:text-white" />
                  <h4
                    className={classes({
                      colors: styles.BW,
                      sizes: styles.med,
                    })}
                  >
                    Calculation Metadata
                  </h4>
                </div>
                <div className="space-y-1 text-[10px] text-black/60 dark:text-white/60">
                  {material.method_version && (
                    <div>Method: {material.method_version}</div>
                  )}
                  {material.whitepaper_version && (
                    <div>Whitepaper: v{material.whitepaper_version}</div>
                  )}
                  {material.calculation_timestamp && (
                    <div>
                      Calculated:{" "}
                      {formatTimestamp(material.calculation_timestamp)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
