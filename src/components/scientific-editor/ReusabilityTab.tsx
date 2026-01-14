/**
 * Reusability Tab - RU parameters and composite scores
 */

import { useState } from "react";
import { Calculator } from "lucide-react";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { calculateReusability, type ReusabilityParams } from "../../utils/api";
import type { DimensionTabProps } from "./types";
import { logger } from "../../utils/logger";

export function ReusabilityTab({
  formData,
  onParameterChange,
}: DimensionTabProps) {
  const [calculating, setCalculating] = useState(false);

  const handleCalculateRU = async (mode: "theoretical" | "practical") => {
    setCalculating(true);
    try {
      const params: ReusabilityParams = {
        L: formData.L_value,
        R: formData.R_value,
        U: formData.U_value,
        C: formData.C_RU_value,
        M: formData.M_value,
        mode,
      };

      const result = await calculateReusability(params);

      // Calculate 10% confidence intervals
      const margin = result.mean * 0.1;

      if (mode === "practical") {
        onParameterChange("RU_practical_mean", result.mean);
        onParameterChange("RU_practical_CI95", {
          lower: Math.max(0, result.mean - margin),
          upper: Math.min(1, result.mean + margin),
        });
        onParameterChange("reusability", result.public);
        toast.success(`RU Practical calculated: ${result.public}/100`);
      } else {
        onParameterChange("RU_theoretical_mean", result.mean);
        onParameterChange("RU_theoretical_CI95", {
          lower: Math.max(0, result.mean - margin),
          upper: Math.min(1, result.mean + margin),
        });
        toast.success(`RU Theoretical calculated: ${result.public}/100`);
      }
    } catch (error) {
      logger.error("Error calculating reusability:", error);
      toast.error(
        "Failed to calculate reusability: " + (error as Error).message
      );
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Parameters Card */}
      <Card className="panel">
        <h3 className="text-[14px] normal mb-3">
          Reusability Parameters (RU-v1)
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-[11px]">Lifetime (L)</Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={formData.L_value || ""}
              onChange={(e) =>
                onParameterChange("L_value", parseFloat(e.target.value) || 0)
              }
              className="text-[12px]"
            />
            <p className="caption">Average functional cycles</p>
          </div>

          <div>
            <Label className="text-[11px]">Repairability (R)</Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={formData.R_value || ""}
              onChange={(e) =>
                onParameterChange("R_value", parseFloat(e.target.value) || 0)
              }
              className="text-[12px]"
            />
            <p className="caption">Ease of disassembly / repair</p>
          </div>

          <div>
            <Label className="text-[11px]">Upgradability (U)</Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={formData.U_value || ""}
              onChange={(e) =>
                onParameterChange("U_value", parseFloat(e.target.value) || 0)
              }
              className="text-[12px]"
            />
            <p className="caption">Ease of adaptation / repurposing</p>
          </div>

          <div>
            <Label className="text-[11px]">
              Contamination Susceptibility (C)
            </Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={formData.C_RU_value || ""}
              onChange={(e) =>
                onParameterChange("C_RU_value", parseFloat(e.target.value) || 0)
              }
              className="text-[12px]"
            />
            <p className="caption">Probability of functional loss</p>
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
            <p className="caption">Market reuse infrastructure</p>
          </div>
        </div>

        {/* Calculate Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Button
            onClick={() => handleCalculateRU("practical")}
            disabled={calculating}
            className="bg-[#b5bec6] hover:bg-[#a5aeb6] text-black"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calculate Practical RU
          </Button>
          <Button
            onClick={() => handleCalculateRU("theoretical")}
            disabled={calculating}
            className="bg-[#5a7a8f] hover:bg-[#4a6a7f] text-white"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calculate Theoretical RU
          </Button>
        </div>
      </Card>

      {/* Composite Scores Card */}
      <Card className="panel">
        <h3 className="text-[14px] normal mb-3">
          Composite Reusability Index (RU)
        </h3>

        {/* Practical Score */}
        <div className="mb-4 pb-4 border-b border-[#211f1c] dark:border-white/20">
          <h4 className="text-[12px] normal mb-2">
            Practical (Market Reality)
          </h4>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-[10px]">Mean (0-1)</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.RU_practical_mean || ""}
                onChange={(e) =>
                  onParameterChange(
                    "RU_practical_mean",
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
                value={formData.RU_practical_CI95?.lower || ""}
                onChange={(e) =>
                  onParameterChange("RU_practical_CI95", {
                    ...formData.RU_practical_CI95,
                    lower: parseFloat(e.target.value) || 0,
                    upper: formData.RU_practical_CI95?.upper || 0,
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
                value={formData.RU_practical_CI95?.upper || ""}
                onChange={(e) =>
                  onParameterChange("RU_practical_CI95", {
                    ...formData.RU_practical_CI95,
                    lower: formData.RU_practical_CI95?.lower || 0,
                    upper: parseFloat(e.target.value) || 0,
                  })
                }
                className="text-[12px]"
              />
            </div>
          </div>

          {formData.RU_practical_mean !== undefined && (
            <div className="mt-2 text-[11px] text-black/60 dark:text-white/60">
              Public Score:{" "}
              <strong>
                {Math.round(formData.RU_practical_mean * 100)}/100
              </strong>
            </div>
          )}
        </div>

        {/* Theoretical Score */}
        <div>
          <h4 className="text-[12px] normal mb-2">
            Theoretical (Design Intent)
          </h4>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-[10px]">Mean (0-1)</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.RU_theoretical_mean || ""}
                onChange={(e) =>
                  onParameterChange(
                    "RU_theoretical_mean",
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
                value={formData.RU_theoretical_CI95?.lower || ""}
                onChange={(e) =>
                  onParameterChange("RU_theoretical_CI95", {
                    ...formData.RU_theoretical_CI95,
                    lower: parseFloat(e.target.value) || 0,
                    upper: formData.RU_theoretical_CI95?.upper || 0,
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
                value={formData.RU_theoretical_CI95?.upper || ""}
                onChange={(e) =>
                  onParameterChange("RU_theoretical_CI95", {
                    ...formData.RU_theoretical_CI95,
                    lower: formData.RU_theoretical_CI95?.lower || 0,
                    upper: parseFloat(e.target.value) || 0,
                  })
                }
                className="text-[12px]"
              />
            </div>
          </div>

          {formData.RU_theoretical_mean !== undefined && (
            <div className="mt-2 text-[11px] text-black/60 dark:text-white/60">
              Public Score:{" "}
              <strong>
                {Math.round(formData.RU_theoretical_mean * 100)}/100
              </strong>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
