/**
 * Export Endpoints Module
 * Handles public and research data exports with v2.0 MIU traceability
 */

import type { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";

// Helper function to convert arrays to CSV format
function arrayToCSV(headers: string[], rows: any[][]): string {
  const escapeCsvValue = (value: any): string => {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);
    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const headerRow = headers.map(escapeCsvValue).join(",");
  const dataRows = rows.map((row) => row.map(escapeCsvValue).join(","));
  return [headerRow, ...dataRows].join("\n");
}

// Helper function to convert materials to public format (0-100 scale)
function convertToPublicFormat(material: any) {
  return {
    id: material.id,
    name: material.name,
    category: material.category,
    description: material.description,
    compostability: material.compostability,
    recyclability: material.recyclability,
    reusability: material.reusability,
    isEstimated: material.isEstimated || false,
    confidenceLevel: material.confidence_level || "low",
    lastUpdated: material.updated_at || material.created_at,
    whitepaperVersion: material.whitepaper_version || "2025.1",
  };
}

/**
 * Public Export Handler - Lay-friendly data (0-100 scale)
 */
export async function handlePublicExport(c: Context) {
  try {
    const format = c.req.query("format") || "json"; // 'json' or 'csv'

    // Get all materials
    const materials = await kv.getByPrefix("material:");

    if (!materials || materials.length === 0) {
      if (format === "csv") {
        return c.text("", 200, { "Content-Type": "text/csv" });
      }
      return c.json({ materials: [] });
    }

    // Convert to public format
    const publicData = materials.map(convertToPublicFormat);

    if (format === "csv") {
      const headers = [
        "ID",
        "Name",
        "Category",
        "Description",
        "Compostability",
        "Recyclability",
        "Reusability",
        "Is Estimated",
        "Confidence Level",
        "Last Updated",
        "Whitepaper Version",
      ];

      const rows = publicData.map((m) => [
        m.id,
        m.name,
        m.category,
        m.description,
        m.compostability,
        m.recyclability,
        m.reusability,
        m.isEstimated ? "Yes" : "No",
        m.confidenceLevel,
        m.lastUpdated,
        m.whitepaperVersion,
      ]);

      const csv = arrayToCSV(headers, rows);

      return c.text(csv, 200, {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="wastedb-public-${
          new Date().toISOString().split("T")[0]
        }.csv"`,
      });
    }

    // Return JSON by default
    return c.json({
      exportDate: new Date().toISOString(),
      format: "public",
      scale: "0-100",
      count: publicData.length,
      materials: publicData,
    });
  } catch (error) {
    console.error("Error exporting public data:", error);
    return c.json(
      { error: "Failed to export data", details: String(error) },
      500
    );
  }
}

/**
 * Research Export Handler - Full scientific data with v2.0 MIU evidence
 */
export async function handleResearchExport(c: Context) {
  try {
    const format = c.req.query("format") || "json"; // 'json' or 'csv'
    const compress = c.req.query("compress") === "true"; // gzip compression flag

    // Get all materials
    const materials = await kv.getByPrefix("material:");

    if (!materials || materials.length === 0) {
      if (format === "csv") {
        return c.text("", 200, { "Content-Type": "text/csv" });
      }
      return c.json({ materials: [] });
    }

    // Get all evidence points for MIU traceability (NEW in v2.0)
    const allEvidence = await kv.getByPrefix("evidence:");
    console.log(` Retrieved ${allEvidence.length} evidence points for export`);

    // Organize evidence by material ID
    const evidenceByMaterial = new Map();
    for (const evidence of allEvidence) {
      const materialId = evidence.material_id;
      if (!evidenceByMaterial.has(materialId)) {
        evidenceByMaterial.set(materialId, []);
      }
      evidenceByMaterial.get(materialId).push(evidence);
    }

    if (format === "csv") {
      const headers = [
        "ID",
        "Name",
        "Category",
        "Description",
        // CR parameters
        "Y (Yield)",
        "D (Degradability)",
        "C (Contamination)",
        "M (Maturity)",
        "E (Energy)",
        "CR Practical Mean",
        "CR Practical CI Lower",
        "CR Practical CI Upper",
        "CR Theoretical Mean",
        "CR Theoretical CI Lower",
        "CR Theoretical CI Upper",
        // CC parameters
        "B (Biodegradation)",
        "N (Nutrient Balance)",
        "T (Toxicity)",
        "H (Habitat Adaptability)",
        "CC Practical Mean",
        "CC Practical CI Lower",
        "CC Practical CI Upper",
        "CC Theoretical Mean",
        "CC Theoretical CI Lower",
        "CC Theoretical CI Upper",
        // RU parameters
        "L (Lifetime)",
        "R (Repairability)",
        "U (Upgradability)",
        "C_RU (Contamination)",
        "RU Practical Mean",
        "RU Practical CI Lower",
        "RU Practical CI Upper",
        "RU Theoretical Mean",
        "RU Theoretical CI Lower",
        "RU Theoretical CI Upper",
        // Public scores and metadata
        "Compostability (0-100)",
        "Recyclability (0-100)",
        "Reusability (0-100)",
        "Confidence Level",
        "Source Count",
        "Evidence Count",
        "Whitepaper Version",
        "Method Version",
        "Calculation Timestamp",
      ];

      const rows = materials.map((m) => {
        const evidenceCount = evidenceByMaterial.get(m.id)?.length || 0;

        return [
          m.id,
          m.name,
          m.category,
          m.description || "",
          // CR parameters
          m.Y_value?.toFixed(4) || "",
          m.D_value?.toFixed(4) || "",
          m.C_value?.toFixed(4) || "",
          m.M_value?.toFixed(4) || "",
          m.E_value?.toFixed(4) || "",
          m.CR_practical_mean?.toFixed(4) || "",
          m.CR_practical_CI95?.lower?.toFixed(4) || "",
          m.CR_practical_CI95?.upper?.toFixed(4) || "",
          m.CR_theoretical_mean?.toFixed(4) || "",
          m.CR_theoretical_CI95?.lower?.toFixed(4) || "",
          m.CR_theoretical_CI95?.upper?.toFixed(4) || "",
          // CC parameters
          m.B_value?.toFixed(4) || "",
          m.N_value?.toFixed(4) || "",
          m.T_value?.toFixed(4) || "",
          m.H_value?.toFixed(4) || "",
          m.CC_practical_mean?.toFixed(4) || "",
          m.CC_practical_CI95?.lower?.toFixed(4) || "",
          m.CC_practical_CI95?.upper?.toFixed(4) || "",
          m.CC_theoretical_mean?.toFixed(4) || "",
          m.CC_theoretical_CI95?.lower?.toFixed(4) || "",
          m.CC_theoretical_CI95?.upper?.toFixed(4) || "",
          // RU parameters
          m.L_value?.toFixed(4) || "",
          m.R_value?.toFixed(4) || "",
          m.U_value?.toFixed(4) || "",
          m.C_RU_value?.toFixed(4) || "",
          m.RU_practical_mean?.toFixed(4) || "",
          m.RU_practical_CI95?.lower?.toFixed(4) || "",
          m.RU_practical_CI95?.upper?.toFixed(4) || "",
          m.RU_theoretical_mean?.toFixed(4) || "",
          m.RU_theoretical_CI95?.lower?.toFixed(4) || "",
          m.RU_theoretical_CI95?.upper?.toFixed(4) || "",
          // Public scores and metadata
          m.compostability || "",
          m.recyclability || "",
          m.reusability || "",
          m.confidence_level || "",
          m.sources?.length || "0",
          evidenceCount.toString(),
          m.whitepaper_version || "",
          m.method_version || "",
          m.calculation_timestamp || "",
        ];
      });

      const csv = arrayToCSV(headers, rows);

      if (compress) {
        console.log(
          "💡 Gzip compression requested for CSV. Export size:",
          csv.length,
          "bytes"
        );
      }

      return c.text(csv, 200, {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="wastedb-research-v2-${
          new Date().toISOString().split("T")[0]
        }.csv"`,
      });
    }

    // Return full JSON with all scientific metadata + MIU evidence (v2.0)
    const fullData = materials.map((m) => {
      const materialEvidence = evidenceByMaterial.get(m.id) || [];

      return {
        // Basic info
        id: m.id,
        name: m.name,
        category: m.category,
        description: m.description,

        // Public scores
        compostability: m.compostability,
        recyclability: m.recyclability,
        reusability: m.reusability,

        // Raw parameters (CR)
        Y_value: m.Y_value,
        D_value: m.D_value,
        C_value: m.C_value,
        M_value: m.M_value,
        E_value: m.E_value,

        // Raw parameters (CC)
        B_value: m.B_value,
        N_value: m.N_value,
        T_value: m.T_value,
        H_value: m.H_value,

        // Raw parameters (RU)
        L_value: m.L_value,
        R_value: m.R_value,
        U_value: m.U_value,
        C_RU_value: m.C_RU_value,

        // Composite scores (CR)
        CR_practical_mean: m.CR_practical_mean,
        CR_theoretical_mean: m.CR_theoretical_mean,
        CR_practical_CI95: m.CR_practical_CI95,
        CR_theoretical_CI95: m.CR_theoretical_CI95,

        // Composite scores (CC)
        CC_practical_mean: m.CC_practical_mean,
        CC_theoretical_mean: m.CC_theoretical_mean,
        CC_practical_CI95: m.CC_practical_CI95,
        CC_theoretical_CI95: m.CC_theoretical_CI95,

        // Composite scores (RU)
        RU_practical_mean: m.RU_practical_mean,
        RU_theoretical_mean: m.RU_theoretical_mean,
        RU_practical_CI95: m.RU_practical_CI95,
        RU_theoretical_CI95: m.RU_theoretical_CI95,

        // Metadata
        confidence_level: m.confidence_level,
        sources: m.sources,
        whitepaper_version: m.whitepaper_version,
        method_version: m.method_version,
        calculation_timestamp: m.calculation_timestamp,

        // MIU Evidence Points (NEW in v2.0)
        evidence: materialEvidence.map((e) => ({
          id: e.id,
          parameter_code: e.parameter_code,
          raw_value: e.raw_value,
          raw_unit: e.raw_unit,
          transformed_value: e.transformed_value,
          transform_version: e.transform_version,

          // Provenance & Traceability
          snippet: e.snippet,
          citation: e.citation,
          source_type: e.source_type,
          confidence_level: e.confidence_level,

          // Locators
          page_number: e.page_number,
          figure_number: e.figure_number,
          table_number: e.table_number,

          // Curator & Timestamps
          created_by: e.created_by,
          created_at: e.created_at,
          updated_at: e.updated_at,

          notes: e.notes,
        })),
        evidence_count: materialEvidence.length,
      };
    });

    const exportData = {
      // Export format versioning (NEW in v2.0)
      export_format_version: "2.0",
      export_timestamp: new Date().toISOString(),
      export_type: "research",

      // Data summary
      scale: "0-1 normalized + 0-100 public",
      material_count: fullData.length,
      total_evidence_points: allEvidence.length,

      // Materials with embedded evidence
      materials: fullData,

      // Metadata about the export
      metadata: {
        version_notes:
          "v2.0 includes MIU evidence points with full traceability",
        compression_available: compress,
        note: "All normalized values are 0-1. Public scores (compostability, recyclability, reusability) are 0-100.",
        confidenceLevels: ["high", "medium", "low"],
        parameters: {
          Y: "Yield - Fraction of material successfully recovered",
          D: "Degradability - Quality retention per cycle",
          C: "Contamination Tolerance - Sensitivity to contaminants",
          M: "Infrastructure Maturity - Availability of processing facilities",
          E: "Energy Demand - Energy required per cycle",
          B: "Biodegradation Rate - Speed of biological breakdown",
          N: "Nutrient Balance - Contribution to soil health",
          T: "Toxicity - Inverse measure of harmful substances",
          H: "Habitat Adaptability - Compatibility with composting conditions",
          L: "Lifetime - Expected number of use cycles",
          R: "Repairability - Ease of repair and maintenance",
          U: "Upgradability - Potential for functional improvements",
          C_RU: "Contamination (Reusability) - Resistance to functional degradation",
        },
        evidence_fields: {
          snippet: "Text excerpt from source document",
          citation: "Source citation (title, DOI, or URL)",
          locators:
            "page_number, figure_number, table_number for precise reference",
          provenance:
            "created_by (curator ID), created_at (extraction timestamp)",
          transform_version: "Version of transform formula used",
        },
      },
    };

    const jsonString = JSON.stringify(exportData, null, 2);

    if (compress) {
      console.log(
        "💡 Gzip compression requested. Export size:",
        jsonString.length,
        "bytes"
      );
      console.log(
        "⚠️ Compression available but requires additional library - documented for future implementation"
      );
    }

    return c.json(exportData, 200, {
      "Content-Disposition": `attachment; filename="wastedb-research-v2-${
        new Date().toISOString().split("T")[0]
      }.json"`,
    });
  } catch (error) {
    console.error("Error exporting research data:", error);
    return c.json(
      { error: "Failed to export data", details: String(error) },
      500
    );
  }
}
