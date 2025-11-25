/**
 * Phase 9.0.8 Tests - Backup & Export System
 *
 * Tests for database backup export and validation.
 */

import { projectId } from "../../../utils/supabase/info";
import { Test } from "../types";

export function getPhase908Tests(user: any): Test[] {
  return [
    {
      id: "phase9-day8-export-backup",
      name: "Export Database Backup",
      description: "Verify backup export with all collections",
      phase: "9.0.8",
      category: "Backup",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message: "Must be authenticated as admin to export backup",
          };
        }

        const accessToken = sessionStorage.getItem("wastedb_access_token");
        if (!accessToken) {
          return {
            success: false,
            message: "No access token found - please sign in again",
          };
        }

        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/backup/export`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || "Export failed" };
          }

          const backup = await response.json();

          if (!backup.metadata || !backup.data) {
            return { success: false, message: "Invalid backup structure" };
          }

          const recordCount = backup.metadata.total_records;
          const exportDuration = backup.metadata.export_duration_ms;

          return {
            success: true,
            message: `Backup exported ✓ (${recordCount} records in ${exportDuration}ms)`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error exporting backup: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day8-validate-backup",
      name: "Validate Backup Structure",
      description: "Verify backup validation endpoint",
      phase: "9.0.8",
      category: "Backup",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message: "Must be authenticated as admin to validate backup",
          };
        }

        const accessToken = sessionStorage.getItem("wastedb_access_token");
        if (!accessToken) {
          return {
            success: false,
            message: "No access token found - please sign in again",
          };
        }

        try {
          // First export a backup to validate
          const exportResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/backup/export`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!exportResponse.ok) {
            return {
              success: false,
              message: "Failed to export backup for validation",
            };
          }

          const backup = await exportResponse.json();

          // Now validate it
          const validateResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/backup/validate`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ backup }),
            }
          );

          if (!validateResponse.ok) {
            const data = await validateResponse.json();
            return {
              success: false,
              message: data.error || "Validation failed",
            };
          }

          const validation = await validateResponse.json();

          if (validation.valid) {
            const warningText =
              validation.warnings.length > 0
                ? ` (${validation.warnings.length} warnings)`
                : "";
            return {
              success: true,
              message: `Backup is valid ✓${warningText} - ${validation.stats.total_records} records`,
            };
          } else {
            return {
              success: false,
              message: `Validation failed: ${validation.issues.join(", ")}`,
            };
          }
        } catch (error) {
          return {
            success: false,
            message: `Error validating backup: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
  ];
}
