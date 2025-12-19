import { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  BarChart3,
  Filter,
  Download,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Progress } from "../ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  loadTransforms,
  type TransformsData,
} from "../../utils/transformLoader";
import { Material } from "../../types/material";

interface TransformFormulaTestingProps {
  onBack: () => void;
  materials: Material[];
}

interface TestResult {
  parameter: string;
  materialId: string;
  materialName: string;
  rawValue: number | null;
  computedScore: number | null;
  actualScore: number | null;
  difference: number | null;
  error: string | null;
}

export function TransformFormulaTesting({
  onBack,
  materials,
}: TransformFormulaTestingProps) {
  const [selectedParameter, setSelectedParameter] = useState<string>("all");
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [transformsData, setTransformsData] = useState<TransformsData | null>(
    null
  );

  useEffect(() => {
    loadTransforms().then((data) => setTransformsData(data));
  }, []);

  // Mock raw parameter values for testing (in production, these would come from MIUs)
  const materialsWithMockRawParams: Material[] = useMemo(() => {
    return materials.map((material) => ({
      ...material,
      rawParams: {
        Y:
          material.compostability <= 30
            ? 500
            : material.compostability <= 60
            ? 100
            : 10,
        D: material.compostability,
        C: material.compostability,
        M: 100 - material.compostability,
        E: 100 - material.compostability,
        B: material.compostability,
        N: 50,
        T: 100 - material.compostability,
        H: 100 - material.compostability,
        L: 100 - material.compostability,
        R: material.recyclability,
        U: material.reusability,
        C_RU: (material.recyclability + material.reusability) / 2,
      },
    }));
  }, [materials]);

  // Apply transform formula
  const applyTransform = (
    parameter: string,
    rawValue: number
  ): number | null => {
    const transform = transformsData?.transforms.find(
      (t) => t.parameter === parameter
    );
    if (!transform) return null;

    try {
      // Parse and evaluate the formula
      const formula = transform.formula;

      // Simple formula parser for our transform definitions
      // In production, this would be more robust
      if (formula.includes("log10")) {
        const match = formula.match(
          /100\s*-\s*\(10\s*\*\s*log10\((\w+)\s*\+\s*1\)\)/
        );
        if (match) {
          const result = 100 - 10 * Math.log10(rawValue + 1);
          return Math.max(0, Math.min(100, result));
        }
      } else if (formula.includes("100 - x")) {
        const result = 100 - rawValue;
        return Math.max(0, Math.min(100, result));
      } else if (formula === "x") {
        return Math.max(0, Math.min(100, rawValue));
      } else if (formula.includes("(R + U) / 2")) {
        // This would need both R and U values
        return rawValue; // Simplified for now
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  // Run tests for all materials and parameters
  const testResults: TestResult[] = useMemo(() => {
    const results: TestResult[] = [];

    materialsWithMockRawParams.forEach((material) => {
      transformsData?.transforms.forEach((transform) => {
        const rawValue =
          material.rawParams?.[
            transform.parameter as keyof typeof material.rawParams
          ];

        let actualScore: number | null = null;
        if (transform.parameter === "C") actualScore = material.compostability;
        else if (transform.parameter === "R")
          actualScore = material.recyclability;
        else if (transform.parameter === "U")
          actualScore = material.reusability;
        else if (transform.parameter === "C_RU")
          actualScore = (material.recyclability + material.reusability) / 2;

        const computedScore =
          rawValue != null
            ? applyTransform(transform.parameter, rawValue)
            : null;
        const difference =
          computedScore != null && actualScore != null
            ? Math.abs(computedScore - actualScore)
            : null;

        let error: string | null = null;
        if (rawValue == null) error = "No raw data";
        else if (computedScore == null) error = "Transform failed";
        else if (actualScore == null) error = "No actual score";
        else if (difference != null && difference > 5) error = "High variance";

        results.push({
          parameter: transform.parameter,
          materialId: material.id,
          materialName: material.name,
          rawValue: rawValue ?? null,
          computedScore,
          actualScore,
          difference,
          error,
        });
      });
    });

    return results;
  }, [materialsWithMockRawParams, transformsData]);

  // Filter results
  const filteredResults = useMemo(() => {
    let filtered = testResults;

    if (selectedParameter !== "all") {
      filtered = filtered.filter((r) => r.parameter === selectedParameter);
    }

    if (showOnlyErrors) {
      filtered = filtered.filter((r) => r.error !== null);
    }

    return filtered;
  }, [testResults, selectedParameter, showOnlyErrors]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const paramStats: {
      [key: string]: {
        total: number;
        errors: number;
        avgDiff: number;
        maxDiff: number;
      };
    } = {};

    transformsData?.transforms.forEach((transform) => {
      const paramResults = testResults.filter(
        (r) => r.parameter === transform.parameter
      );
      const errors = paramResults.filter((r) => r.error !== null).length;
      const diffs = paramResults
        .filter((r) => r.difference != null)
        .map((r) => r.difference!);
      const avgDiff =
        diffs.length > 0 ? diffs.reduce((a, b) => a + b, 0) / diffs.length : 0;
      const maxDiff = diffs.length > 0 ? Math.max(...diffs) : 0;

      paramStats[transform.parameter] = {
        total: paramResults.length,
        errors,
        avgDiff,
        maxDiff,
      };
    });

    return paramStats;
  }, [testResults, transformsData]);

  const overallStats = useMemo(() => {
    const total = testResults.length;
    const errors = testResults.filter((r) => r.error !== null).length;
    const success = total - errors;
    const successRate = total > 0 ? (success / total) * 100 : 0;

    return { total, errors, success, successRate };
  }, [testResults]);

  // Get parameter colors
  const getParameterColor = (param: string) => {
    const colors: { [key: string]: string } = {
      Y: "#e6beb5",
      D: "#b8c8cb",
      C: "#a8d5ba",
      M: "#f4d5a6",
      E: "#d4a5a5",
      B: "#c4b5d5",
      N: "#f5e6d3",
      T: "#e5c3c6",
      H: "#d4e4f7",
      L: "#d5e8d4",
      R: "#fff2cc",
      U: "#ffe6cc",
      C_RU: "#e1d5e7",
    };
    return colors[param] || "#e5e4dc";
  };

  return (
    <div className="h-full flex flex-col bg-[#e5e4dc] dark:bg-[#1a1917]">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 border-b border-[#211f1c]/20 dark:border-white/20 bg-white dark:bg-[#2a2825]">
        <button onClick={onBack} className="card-interactive">
          <ArrowLeft size={16} className="text-black" />
        </button>
        <div className="flex-1">
          <h2 className="heading-xl">Transform Formula Testing</h2>
          <p className="label-muted">
            Validate v1.0 transform formulas against material data
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download size={14} className="mr-2" />
          Export Results
        </Button>
      </div>

      {/* Overall Statistics */}
      <div className="p-6 bg-white dark:bg-[#2a2825] border-b border-[#211f1c]/20 dark:border-white/20">
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-[#e5e4dc] dark:bg-[#1a1917] border border-[#211f1c]/20 dark:border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3
                size={16}
                className="text-black/60 dark:text-white/60"
              />
              <span className="label-muted-sm">Total Tests</span>
            </div>
            <div className="heading-xl">{overallStats.total}</div>
          </div>

          <div className="p-4 rounded-lg bg-[#e5e4dc] dark:bg-[#1a1917] border border-[#211f1c]/20 dark:border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle
                size={16}
                className="text-green-600 dark:text-green-400"
              />
              <span className="label-muted-sm">Successful</span>
            </div>
            <div className="font-['Tilt_Warp'] text-[24px] text-green-600 dark:text-green-400">
              {overallStats.success}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#e5e4dc] dark:bg-[#1a1917] border border-[#211f1c]/20 dark:border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <XCircle size={16} className="text-red-600 dark:text-red-400" />
              <span className="label-muted-sm">Errors</span>
            </div>
            <div className="font-['Tilt_Warp'] text-[24px] text-red-600 dark:text-red-400">
              {overallStats.errors}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#e5e4dc] dark:bg-[#1a1917] border border-[#211f1c]/20 dark:border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp
                size={16}
                className="text-black/60 dark:text-white/60"
              />
              <span className="label-muted-sm">Success Rate</span>
            </div>
            <div className="heading-xl">
              {overallStats.successRate.toFixed(1)}%
            </div>
            <Progress value={overallStats.successRate} className="mt-2 h-1" />
          </div>
        </div>
      </div>

      {/* Parameter Statistics */}
      <div className="p-6 bg-white dark:bg-[#2a2825] border-b border-[#211f1c]/20 dark:border-white/20">
        <h3 className="font-['Tilt_Warp'] text-[16px] normal mb-4">
          Parameter Statistics
        </h3>
        <div className="grid grid-cols-7 gap-3">
          {transformsData?.transforms.map((transform) => {
            const stats = statistics[transform.parameter];
            const successRate = stats
              ? ((stats.total - stats.errors) / stats.total) * 100
              : 0;

            return (
              <button
                key={transform.parameter}
                onClick={() => setSelectedParameter(transform.parameter)}
                className={`p-3 rounded-lg border transition-all text-left ${
                  selectedParameter === transform.parameter
                    ? "border-[#211f1c] dark:border-white shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]"
                    : "border-[#211f1c]/20 dark:border-white/20 hover:border-[#211f1c]/40 dark:hover:border-white/40"
                }`}
                style={{
                  backgroundColor: getParameterColor(transform.parameter),
                }}
              >
                <div className="font-['Tilt_Warp'] text-[14px] text-black mb-1">
                  {transform.parameter}
                </div>
                <div className="font-['Sniglet'] text-[10px] text-black/70 mb-2">
                  {transform.name}
                </div>
                <Progress value={successRate} className="h-1 mb-2" />
                <div className="font-['Sniglet'] text-[9px] text-black/60">
                  {stats.errors > 0 ? `${stats.errors} errors` : "All pass"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-white dark:bg-[#2a2825] border-b border-[#211f1c]/20 dark:border-white/20 flex items-center gap-4">
        <Select value={selectedParameter} onValueChange={setSelectedParameter}>
          <SelectTrigger className="w-48 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Parameters</SelectItem>
            {transformsData?.transforms.map((t) => (
              <SelectItem key={t.parameter} value={t.parameter}>
                {t.parameter} - {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={showOnlyErrors ? "default" : "outline"}
          size="sm"
          onClick={() => setShowOnlyErrors(!showOnlyErrors)}
        >
          <Filter size={14} className="mr-2" />
          {showOnlyErrors ? "Showing Errors Only" : "Show All"}
        </Button>

        <div className="flex-1" />

        <span className="label-muted">{filteredResults.length} results</span>
      </div>

      {/* Results Table */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          <div className="bg-white dark:bg-[#2a2825] rounded-lg border border-[#211f1c]/20 dark:border-white/20 overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#e5e4dc] dark:bg-[#1a1917] border-b border-[#211f1c]/20 dark:border-white/20">
                <tr>
                  <th className="px-4 py-3 text-left heading-sm">Parameter</th>
                  <th className="px-4 py-3 text-left heading-sm">Material</th>
                  <th className="px-4 py-3 text-right heading-sm">Raw Value</th>
                  <th className="px-4 py-3 text-right heading-sm">Computed</th>
                  <th className="px-4 py-3 text-right heading-sm">Actual</th>
                  <th className="px-4 py-3 text-right heading-sm">
                    Difference
                  </th>
                  <th className="px-4 py-3 text-left heading-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((result, index) => (
                  <tr
                    key={`${result.parameter}-${result.materialId}-${index}`}
                    className="border-b border-[#211f1c]/10 dark:border-white/10 hover:bg-[#e5e4dc]/50 dark:hover:bg-[#1a1917]/50"
                  >
                    <td className="px-4 py-3">
                      <div
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[#211f1c] dark:border-white/20 font-['Tilt_Warp'] text-[11px]"
                        style={{
                          backgroundColor: getParameterColor(result.parameter),
                        }}
                      >
                        {result.parameter}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="label">{result.materialName}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="label">
                        {result.rawValue != null
                          ? result.rawValue.toFixed(2)
                          : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="label">
                        {result.computedScore != null
                          ? result.computedScore.toFixed(2)
                          : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="label">
                        {result.actualScore != null
                          ? result.actualScore.toFixed(2)
                          : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-['Sniglet'] text-[12px] ${
                          result.difference != null && result.difference > 5
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {result.difference != null
                          ? `±${result.difference.toFixed(2)}`
                          : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {result.error ? (
                        <Badge
                          variant="destructive"
                          className="font-['Sniglet'] text-[10px]"
                        >
                          <AlertCircle size={10} className="mr-1" />
                          {result.error}
                        </Badge>
                      ) : (
                        <Badge
                          variant="default"
                          className="font-['Sniglet'] text-[10px]"
                        >
                          <CheckCircle size={10} className="mr-1" />
                          Pass
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredResults.length === 0 && (
              <div className="p-8 text-center">
                <AlertCircle
                  size={48}
                  className="mx-auto mb-4 text-black/20 dark:text-white/20"
                />
                <p className="label-muted">No results to display</p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
