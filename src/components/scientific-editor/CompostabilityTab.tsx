/**
 * Compostability Tab - CC parameters and composite scores
 */

import { useState } from "react";
import { Calculator } from "lucide-react";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import {
  calculateCompostability,
  type CompostabilityParams,
} from "../../utils/api";
import type { DimensionTabProps } from "./types";

export function CompostabilityTab({
  formData,
  onParameterChange,
}: DimensionTabProps) {
  const [calculating, setCalculating] = useState(false);

  const handleCalculateCC = async (mode: "theoretical" | "practical") => {
    setCalculating(true);
    try {
      const params: CompostabilityParams = {
        B: formData.B_value,
        N: formData.N_value,
        T: formData.T_value,
        H: formData.H_value,
        M: formData.M_value,
        mode,
      };

      const result = await calculateCompostability(params);

      // Calculate 10% confidence intervals
      const margin = result.mean * 0.1;

      if (mode === "practical") {
        onParameterChange("CC_practical_mean", result.mean);
        onParameterChange("CC_practical_CI95", {
          lower: Math.max(0, result.mean - margin),
          upper: Math.min(1, result.mean + margin),
        });
        onParameterChange("compostability", result.public);
        toast.success(`CC Practical calculated: ${result.public}/100`);
      } else {
        onParameterChange("CC_theoretical_mean", result.mean);
        onParameterChange("CC_theoretical_CI95", {
          lower: Math.max(0, result.mean - margin),
          upper: Math.min(1, result.mean + margin),
        });
        toast.success(`CC Theoretical calculated: ${result.public}/100`);
      }
    } catch (error) {
      console.error("Error calculating compostability:", error);
      toast.error(
        "Failed to calculate compostability: " + (error as Error).message
      );
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Parameters Card */}
      <Card className="p-4 bg-[#faf9f6] dark:bg-[#1a1918] border-[#211f1c] dark:border-white/20">
        <h3 className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white mb-3">
          Compostability Parameters (CC-v1)
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-[11px]">Biodegradation (B)</Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={formData.B_value || ""}
              onChange={(e) =>
                onParameterChange("B_value", parseFloat(e.target.value) || 0)
              }
              className="text-[12px]"
            />
            <p className="text-[9px] text-black/60 dark:text-white/60 mt-1">
              Biodegradation rate constant
            </p>
          </div>

          <div>
            <Label className="text-[11px]">Nutrient Balance (N)</Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={formData.N_value || ""}
              onChange={(e) =>
                onParameterChange("N_value", parseFloat(e.target.value) || 0)
              }
              className="text-[12px]"
            />
            <p className="text-[9px] text-black/60 dark:text-white/60 mt-1">
              C:N:P ratio suitability
            </p>
          </div>

          <div>
            <Label className="text-[11px]">Toxicity (T)</Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={formData.T_value || ""}
              onChange={(e) =>
                onParameterChange("T_value", parseFloat(e.target.value) || 0)
              }
              className="text-[12px]"
            />
            <p className="text-[9px] text-black/60 dark:text-white/60 mt-1">
              Toxicity / residue index
            </p>
          </div>

          <div>
            <Label className="text-[11px]">Habitat Adaptability (H)</Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={formData.H_value || ""}
              onChange={(e) =>
                onParameterChange("H_value", parseFloat(e.target.value) || 0)
              }
              className="text-[12px]"
            />
            <p className="text-[9px] text-black/60 dark:text-white/60 mt-1">
              Fraction of composting systems
            </p>
          </div>

          <div>
            <Label className="text-[11px]">
              Infrastructure Maturity (M) - Shared
            </Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={formData.M_value || ""}
              onChange={(e) =>
                onParameterChange("M_value", parseFloat(e.target.value) || 0)
              }
              className="text-[12px]"
            />
            <p className="text-[9px] text-black/60 dark:text-white/60 mt-1">
              Composting facility availability
            </p>
          </div>
        </div>

        {/* Calculate Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Button
            onClick={() => handleCalculateCC("practical")}
            disabled={calculating}
            className="bg-[#e6beb5] hover:bg-[#d6aea5] text-black"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calculate Practical CC
          </Button>
          <Button
            onClick={() => handleCalculateCC("theoretical")}
            disabled={calculating}
            className="bg-[#c74444] hover:bg-[#b73434] text-white"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calculate Theoretical CC
          </Button>
        </div>
      </Card>

      {/* Composite Scores Card */}
      <Card className="p-4 bg-[#faf9f6] dark:bg-[#1a1918] border-[#211f1c] dark:border-white/20">
        <h3 className="font-['Sniglet:Regular',_sans-serif] text-[14px] text-black dark:text-white mb-3">
          Composite Compostability Index (CC)
        </h3>

        {/* Practical Score */}
        <div className="mb-4 pb-4 border-b border-[#211f1c] dark:border-white/20">
          <h4 className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white mb-2">
            Practical (Regional Facilities)
          </h4>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-[10px]">Mean (0-1)</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.CC_practical_mean || ""}
                onChange={(e) =>
                  onParameterChange(
                    "CC_practical_mean",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="text-[12px]"
              />
            </div>

            <div>
              <Label className="text-[10px]">CI Lower</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.CC_practical_CI95?.lower || ""}
                onChange={(e) =>
                  onParameterChange("CC_practical_CI95", {
                    ...formData.CC_practical_CI95,
                    lower: parseFloat(e.target.value) || 0,
                    upper: formData.CC_practical_CI95?.upper || 0,
                  })
                }
                className="text-[12px]"
              />
            </div>

            <div>
              <Label className="text-[10px]">CI Upper</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.CC_practical_CI95?.upper || ""}
                onChange={(e) =>
                  onParameterChange("CC_practical_CI95", {
                    ...formData.CC_practical_CI95,
                    lower: formData.CC_practical_CI95?.lower || 0,
                    upper: parseFloat(e.target.value) || 0,
                  })
                }
                className="text-[12px]"
              />
            </div>
          </div>

          {formData.CC_practical_mean !== undefined && (
            <div className="mt-2 text-[11px] text-black/60 dark:text-white/60">
              Public Score:{" "}
              <strong>
                {Math.round(formData.CC_practical_mean * 100)}/100
              </strong>
            </div>
          )}
        </div>

        {/* Theoretical Score */}
        <div>
          <h4 className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black dark:text-white mb-2">
            Theoretical (Ideal Conditions)
          </h4>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-[10px]">Mean (0-1)</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.CC_theoretical_mean || ""}
                onChange={(e) =>
                  onParameterChange(
                    "CC_theoretical_mean",
                    parseFloat(e.target.value) || 0
                  )
                }
                className="text-[12px]"
              />
            </div>

            <div>
              <Label className="text-[10px]">CI Lower</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.CC_theoretical_CI95?.lower || ""}
                onChange={(e) =>
                  onParameterChange("CC_theoretical_CI95", {
                    ...formData.CC_theoretical_CI95,
                    lower: parseFloat(e.target.value) || 0,
                    upper: formData.CC_theoretical_CI95?.upper || 0,
                  })
                }
                className="text-[12px]"
              />
            </div>

            <div>
              <Label className="text-[10px]">CI Upper</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.CC_theoretical_CI95?.upper || ""}
                onChange={(e) =>
                  onParameterChange("CC_theoretical_CI95", {
                    ...formData.CC_theoretical_CI95,
                    lower: formData.CC_theoretical_CI95?.lower || 0,
                    upper: parseFloat(e.target.value) || 0,
                  })
                }
                className="text-[12px]"
              />
            </div>
          </div>

          {formData.CC_theoretical_mean !== undefined && (
            <div className="mt-2 text-[11px] text-black/60 dark:text-white/60">
              Public Score:{" "}
              <strong>
                {Math.round(formData.CC_theoretical_mean * 100)}/100
              </strong>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
