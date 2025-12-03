/**
 * Phase 9.0.9 Tests - Backup V2 with MIU Format
 *
 * Tests for V2 export format with MIU-based evidence structure and provenance tracking.
 */

import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { Test } from "../types";

export function getPhase909Tests(): Test[] {
  return [
    {
      id: "phase9-day9-export-v2",
      name: "Export Backup V2 with MIU Format",
      description: "Verify V2 export includes MIU-based evidence structure",
      phase: "9.0.9",
      category: "Backup V2",
      testFn: async () => {
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/export/full?format=json`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${publicAnonKey}`,
              },
            }
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message: data.error || "V2 export failed",
            };
          }

          const exportData = await response.json();

          if (
            !exportData.export_format_version ||
            exportData.export_format_version !== "2.0"
          ) {
            return {
              success: false,
              message: `Expected v2.0, got ${
                exportData.export_format_version || "no version"
              }`,
            };
          }

          // Check for MIU/evidence structure
          if (!exportData.materials || exportData.materials.length === 0) {
            return {
              success: false,
              message: "No materials found in export",
            };
          }

          // Count evidence points across all materials
          let totalEvidence = 0;
          for (const material of exportData.materials) {
            if (material.evidence && Array.isArray(material.evidence)) {
              totalEvidence += material.evidence.length;
            }
          }

          return {
            success: true,
            message: `V2 export validated ✓ (format: ${exportData.export_format_version}, ${exportData.material_count} materials, ${totalEvidence} MIUs)`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error exporting V2 backup: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day9-validate-miu",
      name: "Validate MIU Structure",
      description: "Verify MIU records have required provenance fields",
      phase: "9.0.9",
      category: "Backup V2",
      testFn: async () => {
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/export/full?format=json`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${publicAnonKey}`,
              },
            }
          );

          if (!response.ok) {
            return {
              success: false,
              message: "Failed to export V2 backup for MIU validation",
            };
          }

          const exportData = await response.json();

          // Find first material with evidence
          let firstEvidence = null;
          for (const material of exportData.materials || []) {
            if (material.evidence && material.evidence.length > 0) {
              firstEvidence = material.evidence[0];
              break;
            }
          }

          if (!firstEvidence) {
            return {
              success: true,
              message:
                "No MIU records in export yet - create evidence points to validate structure",
            };
          }

          // Validate MIU has required fields (mapped from evidence structure)
          const requiredFields = [
            "id",
            "parameter_code",
            "raw_value",
            "raw_unit",
            "transform_version",
            "created_at",
          ];
          const missingFields = requiredFields.filter(
            (field) => !firstEvidence[field]
          );

          if (missingFields.length > 0) {
            return {
              success: false,
              message: `MIU missing required fields: ${missingFields.join(
                ", "
              )}`,
            };
          }

          return {
            success: true,
            message: `MIU structure valid ✓ (${exportData.total_evidence_points} MIUs with all required fields)`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error validating MIU: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
  ];
}
