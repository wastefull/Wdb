/**
 * Source Data Comparison Tool
 *
 * Allows apples-to-apples comparison of parameter values across different sources
 * for a given material. Helps identify consensus, outliers, and methodological differences.
 */

import { useState, useMemo } from "react";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Download,
  ExternalLink,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { toast } from "sonner";
import * as api from "../utils/api";
import { Material } from "../types/material";

interface SourceDataComparisonProps {
  onBack: () => void;
  materials: Material[];
}

// Parameter metadata for display
const PARAMETER_INFO: Record<
  string,
  { name: string; unit: string; dimension: string; description: string }
> = {
  // Recyclability
  Y_value: {
    name: "Yield (Y)",
    unit: "%",
    dimension: "Recyclability",
    description: "Material retention in recycling process",
  },
  D_value: {
    name: "Degradation (D)",
    unit: "%",
    dimension: "Recyclability",
    description: "Quality loss per cycle",
  },
  C_value: {
    name: "Contamination (C)",
    unit: "%",
    dimension: "Recyclability",
    description: "Tolerance to contaminants",
  },
  M_value: {
    name: "Infrastructure (M)",
    unit: "%",
    dimension: "Recyclability",
    description: "Facility access maturity",
  },
  E_value: {
    name: "Energy (E)",
    unit: "%",
    dimension: "Recyclability",
    description: "Energy efficiency vs virgin material",
  },

  // Compostability
  B_value: {
    name: "Biodegradability (B)",
    unit: "%",
    dimension: "Compostability",
    description: "Breakdown completeness",
  },
  N_value: {
    name: "Nutrient (N)",
    unit: "%",
    dimension: "Compostability",
    description: "Compost quality/nutrient value",
  },
  T_value: {
    name: "Time (T)",
    unit: "%",
    dimension: "Compostability",
    description: "Degradation speed",
  },
  H_value: {
    name: "Harm (H)",
    unit: "%",
    dimension: "Compostability",
    description: "Safety (inverse of toxicity)",
  },

  // Reusability
  L_value: {
    name: "Longevity (L)",
    unit: "%",
    dimension: "Reusability",
    description: "Physical durability over time",
  },
  R_value: {
    name: "Repairability (R)",
    unit: "%",
    dimension: "Reusability",
    description: "Ease of repair/refurbishment",
  },
  U_value: {
    name: "Use Cases (U)",
    unit: "%",
    dimension: "Reusability",
    description: "Alternative use possibilities",
  },
  C_RU_value: {
    name: "Consumer (C)",
    unit: "%",
    dimension: "Reusability",
    description: "User adoption/behavior",
  },
};

// Helper function to generate Google Scholar search URL
const getGoogleScholarUrl = (title: string, authors?: string): string => {
  const query = authors ? `${title} ${authors}` : title;
  return `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`;
};

export function SourceDataComparison({
  onBack,
  materials,
}: SourceDataComparisonProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [selectedParameter, setSelectedParameter] = useState<string>("");
  const [selectedDimension, setSelectedDimension] = useState<string>("all");

  // Get selected material data
  const material = useMemo(() => {
    return materials.find((m) => m.id === selectedMaterial);
  }, [selectedMaterial, materials]);

  // Get available parameters for selected material
  const availableParameters = useMemo(() => {
    if (!material) return [];

    const params = Object.keys(PARAMETER_INFO).filter((key) => {
      const hasValue = material[key] !== undefined && material[key] !== null;
      const matchesDimension =
        selectedDimension === "all" ||
        PARAMETER_INFO[key].dimension === selectedDimension;
      return hasValue && matchesDimension;
    });

    return params;
  }, [material, selectedDimension]);

  // Analyze parameter data across sources
  const comparisonData = useMemo(() => {
    if (
      !material ||
      !selectedParameter ||
      !material.sources ||
      material.sources.length === 0
    ) {
      return null;
    }

    const paramValue = material[selectedParameter];
    const sources = material.sources.filter((s) =>
      s.parameters?.includes(selectedParameter)
    );

    if (sources.length === 0) {
      return null;
    }

    // Calculate statistics
    const weights = sources.map((s) => s.weight || 1.0);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const weightedValue = paramValue; // This is the final weighted value

    // Since we don't have individual source values, we'll show which sources
    // contributed to this parameter and their relative weights
    const sourceContributions = sources
      .map((source, idx) => ({
        source,
        weight: weights[idx],
        contribution: (weights[idx] / totalWeight) * 100,
      }))
      .sort((a, b) => b.contribution - a.contribution);

    return {
      paramValue,
      sources: sourceContributions,
      totalWeight,
      sourceCount: sources.length,
    };
  }, [material, selectedParameter]);

  // Export comparison data
  const handleExport = () => {
    if (!comparisonData || !material) return;

    const exportData = {
      material: material.name,
      parameter: PARAMETER_INFO[selectedParameter].name,
      value: comparisonData.paramValue,
      unit: PARAMETER_INFO[selectedParameter].unit,
      dimension: PARAMETER_INFO[selectedParameter].dimension,
      sources: comparisonData.sources.map((sc) => ({
        title: sc.source.title,
        authors: sc.source.authors,
        year: sc.source.year,
        doi: sc.source.doi,
        weight: sc.weight,
        contribution: sc.contribution.toFixed(1) + "%",
      })),
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `source-comparison-${material.name}-${selectedParameter}-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Comparison data exported");
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          onClick={onBack}
          variant="outline"
          className="border-[#211f1c] dark:border-white/20 text-[11px] md:text-sm mb-4"
        >
          <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
          Back
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black dark:text-white">
              Source Data Comparison
            </h1>
            <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/60 dark:text-white/60">
              Compare how different sources contribute to parameter values
            </p>
          </div>
        </div>
      </div>

      {/* Selection Controls */}
      <Card className="p-4 mb-6 bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Material Selection */}
          <div>
            <label className="text-[11px] text-black dark:text-white mb-2 block">
              Material
            </label>
            <Select
              value={selectedMaterial}
              onValueChange={setSelectedMaterial}
            >
              <SelectTrigger className="text-[12px]">
                <SelectValue placeholder="Select material..." />
              </SelectTrigger>
              <SelectContent>
                {materials
                  .filter((m) => m.sources && m.sources.length > 0)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.sources?.length || 0} sources)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dimension Filter */}
          <div>
            <label className="text-[11px] text-black dark:text-white mb-2 block">
              Dimension
            </label>
            <Select
              value={selectedDimension}
              onValueChange={setSelectedDimension}
            >
              <SelectTrigger className="text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dimensions</SelectItem>
                <SelectItem value="Recyclability">Recyclability</SelectItem>
                <SelectItem value="Compostability">Compostability</SelectItem>
                <SelectItem value="Reusability">Reusability</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Parameter Selection */}
          <div>
            <label className="text-[11px] text-black dark:text-white mb-2 block">
              Parameter
            </label>
            <Select
              value={selectedParameter}
              onValueChange={setSelectedParameter}
              disabled={!selectedMaterial}
            >
              <SelectTrigger className="text-[12px]">
                <SelectValue placeholder="Select parameter..." />
              </SelectTrigger>
              <SelectContent>
                {availableParameters.map((param) => (
                  <SelectItem key={param} value={param}>
                    {PARAMETER_INFO[param].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Comparison Results */}
      {!selectedMaterial && (
        <Card className="p-12 text-center bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-black/20 dark:text-white/20" />
          <p className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black/50 dark:text-white/50">
            Select a material to begin comparison
          </p>
        </Card>
      )}

      {selectedMaterial && !selectedParameter && (
        <Card className="p-12 text-center bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-black/20 dark:text-white/20" />
          <p className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black/50 dark:text-white/50">
            Select a parameter to compare
          </p>
        </Card>
      )}

      {selectedMaterial && selectedParameter && !comparisonData && (
        <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-[11px] text-amber-800 dark:text-amber-200">
            No sources are tagged for this parameter. Sources must explicitly
            cite which parameters they support.
          </AlertDescription>
        </Alert>
      )}

      {comparisonData && material && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="p-4 bg-[#faf9f6] dark:bg-[#1a1918] border-[#211f1c] dark:border-white/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white mb-1">
                  {material.name} - {PARAMETER_INFO[selectedParameter].name}
                </h2>
                <p className="text-[11px] text-black/60 dark:text-white/60">
                  {PARAMETER_INFO[selectedParameter].description}
                </p>
              </div>
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                className="border-[#211f1c] dark:border-white/20"
              >
                <Download className="w-3 h-3 mr-2" />
                Export
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-3 bg-white dark:bg-[#2a2825] rounded-lg border border-[#211f1c] dark:border-white/20">
                <p className="text-[9px] text-black/60 dark:text-white/60 mb-1">
                  Weighted Value
                </p>
                <p className="text-[18px] text-black dark:text-white">
                  {comparisonData.paramValue.toFixed(1)}
                  <span className="text-[11px] ml-1">
                    {PARAMETER_INFO[selectedParameter].unit}
                  </span>
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-[#2a2825] rounded-lg border border-[#211f1c] dark:border-white/20">
                <p className="text-[9px] text-black/60 dark:text-white/60 mb-1">
                  Contributing Sources
                </p>
                <p className="text-[18px] text-black dark:text-white">
                  {comparisonData.sourceCount}
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-[#2a2825] rounded-lg border border-[#211f1c] dark:border-white/20">
                <p className="text-[9px] text-black/60 dark:text-white/60 mb-1">
                  Total Weight
                </p>
                <p className="text-[18px] text-black dark:text-white">
                  {comparisonData.totalWeight.toFixed(2)}
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-[#2a2825] rounded-lg border border-[#211f1c] dark:border-white/20">
                <p className="text-[9px] text-black/60 dark:text-white/60 mb-1">
                  Dimension
                </p>
                <Badge className="text-[9px] mt-1">
                  {PARAMETER_INFO[selectedParameter].dimension}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Source Breakdown */}
          <Card className="bg-white dark:bg-[#2a2825] border-[#211f1c] dark:border-white/20">
            <div className="p-4 border-b border-[#211f1c] dark:border-white/20">
              <h3 className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white">
                Source Contributions
              </h3>
              <p className="text-[11px] text-black/60 dark:text-white/60">
                How each source contributes to the final weighted value
              </p>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[11px]">
                      Source
                    </TableHead>
                    <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[11px]">
                      Type
                    </TableHead>
                    <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-right">
                      Weight
                    </TableHead>
                    <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-right">
                      Contribution
                    </TableHead>
                    <TableHead className="font-['Sniglet:Regular',_sans-serif] text-[11px]">
                      Links
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonData.sources.map((sc, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div>
                          <p className="text-[11px] text-black dark:text-white font-medium">
                            {sc.source.title}
                          </p>
                          {sc.source.authors && (
                            <p className="text-[9px] text-black/60 dark:text-white/60">
                              {sc.source.authors}
                            </p>
                          )}
                          {sc.source.year && (
                            <Badge
                              variant="outline"
                              className="text-[8px] mt-1"
                            >
                              {sc.source.year}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[8px] ${
                            sc.weight >= 1.0
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                              : sc.weight >= 0.7
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                          }`}
                        >
                          {sc.weight >= 1.0
                            ? "Peer-Reviewed"
                            : sc.weight >= 0.9
                            ? "Government"
                            : sc.weight >= 0.7
                            ? "Industrial"
                            : sc.weight >= 0.6
                            ? "NGO"
                            : "Internal"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-[11px] text-black dark:text-white">
                          {sc.weight.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full"
                              style={{ width: `${sc.contribution}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-black dark:text-white font-medium w-12 text-right">
                            {sc.contribution.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {sc.source.doi ? (
                            <a
                              href={`https://doi.org/${sc.source.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                              DOI <ExternalLink className="w-2 h-2" />
                            </a>
                          ) : sc.source.pdfFileName ? (
                            <a
                              href={api.getSourcePdfViewUrl(
                                sc.source.pdfFileName
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] text-green-600 dark:text-green-400 hover:underline flex items-center gap-1 cursor-pointer"
                              title="View uploaded PDF"
                            >
                              <BookOpen className="w-2 h-2" /> View PDF
                            </a>
                          ) : (
                            <a
                              href={getGoogleScholarUrl(
                                sc.source.title,
                                sc.source.authors
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                              title="Search on Google Scholar"
                            >
                              <GraduationCap className="w-2 h-2" /> Scholar
                            </a>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Methodology Note */}
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-[11px] text-blue-800 dark:text-blue-200">
              <strong>How weighting works:</strong> Each source is assigned a
              weight based on its type (peer-reviewed = 1.0, government = 0.9,
              industrial = 0.7, etc.). The final parameter value is calculated
              using weighted averages, where higher-quality sources have more
              influence. Contribution percentages show each source's relative
              influence on the final value.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
