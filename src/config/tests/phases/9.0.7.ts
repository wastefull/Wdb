/**
 * Phase 9.0.7 Tests - Data Retention & Source Integrity
 *
 * Tests for retention statistics, source referential integrity, and cleanup operations.
 */

import { projectId } from "../../../utils/supabase/info";
import { Test, getAuthHeaders } from "../types";

export function getPhase907Tests(user: any): Test[] {
  return [
    {
      id: "phase9-day7-retention-stats",
      name: "Fetch Retention Statistics",
      description: "Verify retention statistics for screenshots and audit logs",
      phase: "9.0.7",
      category: "Retention",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message: "Must be authenticated as admin to fetch retention stats",
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
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/admin/retention/stats`,
            {
              method: "GET",
              headers: getAuthHeaders(accessToken),
            }
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message: data.error || "Failed to fetch retention stats",
            };
          }

          const data = await response.json();

          if (
            !data.stats ||
            typeof data.stats.screenshots !== "object" ||
            typeof data.stats.auditLogs !== "object"
          ) {
            return {
              success: false,
              message: "Invalid stats structure",
            };
          }

          return {
            success: true,
            message: `Stats retrieved ✓ (${data.stats.screenshots.total} screenshots, ${data.stats.auditLogs.total} audit logs)`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error fetching retention stats: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day7-source-integrity-check",
      name: "Check Source Referential Integrity",
      description: "Verify source dependency checking before deletion",
      phase: "9.0.7",
      category: "Retention",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message: "Must be authenticated as admin to check source integrity",
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
          // First create a test source
          const createResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources`,
            {
              method: "POST",
              headers: getAuthHeaders(accessToken),
              body: JSON.stringify({
                title: "Test Source for Integrity Check",
                type: "internal",
                authors: "Test Author",
              }),
            }
          );

          if (!createResponse.ok) {
            return {
              success: false,
              message: "Failed to create test source",
            };
          }

          const createData = await createResponse.json();
          const sourceId = createData.source.id;

          // Now check referential integrity
          const checkResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/admin/retention/check-source/${sourceId}`,
            {
              method: "GET",
              headers: getAuthHeaders(accessToken),
            }
          );

          if (!checkResponse.ok) {
            const data = await checkResponse.json();
            return {
              success: false,
              message: data.error || "Failed to check integrity",
            };
          }

          const checkData = await checkResponse.json();

          if (checkData.canDelete === true && checkData.dependentCount === 0) {
            return {
              success: true,
              message: `Integrity check passed ✓ (source can be deleted, 0 dependent evidence)`,
            };
          } else {
            return {
              success: false,
              message: `Unexpected result: canDelete=${checkData.canDelete}, dependentCount=${checkData.dependentCount}`,
            };
          }
        } catch (error) {
          return {
            success: false,
            message: `Error checking source integrity: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day7-source-integrity-check-cannot-delete",
      name: "Check Source Integrity (Cannot Delete)",
      description:
        "Verify check endpoint correctly identifies sources with evidence",
      phase: "9.0.7",
      category: "Retention",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message: "Must be authenticated as admin",
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
          // Create a test source
          const createSourceResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources`,
            {
              method: "POST",
              headers: getAuthHeaders(accessToken),
              body: JSON.stringify({
                title: "Test Source with Evidence (Cannot Delete)",
                type: "internal",
                authors: "Test Author",
              }),
            }
          );

          if (!createSourceResponse.ok) {
            return {
              success: false,
              message: "Failed to create test source",
            };
          }

          const sourceData = await createSourceResponse.json();
          const sourceId = sourceData.source.id;

          // Create evidence pointing to this source
          const evidenceResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`,
            {
              method: "POST",
              headers: getAuthHeaders(accessToken),
              body: JSON.stringify({
                material_id: "test-material",
                parameter_code: "Y",
                raw_value: 50,
                raw_unit: "%",
                source_type: "manual",
                citation: `Test source: ${sourceId}`,
                snippet: "Test snippet for integrity check",
                confidence_level: "high",
                source_id: sourceId,
                notes: "Test evidence for integrity check",
              }),
            }
          );

          if (!evidenceResponse.ok) {
            return {
              success: false,
              message: "Failed to create test evidence",
            };
          }

          // Now check referential integrity - should return canDelete=false
          const checkResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/admin/retention/check-source/${sourceId}`,
            {
              headers: getAuthHeaders(accessToken),
            }
          );

          if (!checkResponse.ok) {
            const data = await checkResponse.json();
            return {
              success: false,
              message: data.error || "Failed to check integrity",
            };
          }

          const checkData = await checkResponse.json();

          if (checkData.canDelete === false && checkData.dependentCount > 0) {
            return {
              success: true,
              message: `Integrity check passed ✓ (source cannot be deleted, ${checkData.dependentCount} dependent evidence)`,
            };
          } else {
            return {
              success: false,
              message: `Unexpected result: canDelete=${checkData.canDelete}, dependentCount=${checkData.dependentCount}`,
            };
          }
        } catch (error) {
          return {
            success: false,
            message: `Error checking source integrity: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day7-source-integrity-prevent-delete",
      name: "Prevent Delete Source with Evidence",
      description: "Verify sources with evidence cannot be deleted",
      phase: "9.0.7",
      category: "Retention",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message: "Must be authenticated as admin",
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
          // First create a source and evidence
          const sourceId = `test-protected-source-${Date.now()}`;

          const sourceResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources`,
            {
              method: "POST",
              headers: getAuthHeaders(accessToken),
              body: JSON.stringify({
                id: sourceId,
                title: "Test Source with Evidence",
                authors: "Test Author",
                year: 2024,
                type: "peer-reviewed",
                weight: 1.0,
              }),
            }
          );

          if (!sourceResponse.ok) {
            return {
              success: false,
              message: "Failed to create test source",
            };
          }

          // Create evidence pointing to this source
          const evidenceResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`,
            {
              method: "POST",
              headers: getAuthHeaders(accessToken),
              body: JSON.stringify({
                material_id: "test-material",
                parameter_code: "Y",
                raw_value: 50,
                raw_unit: "%",
                source_type: "manual",
                citation: `Test source: ${sourceId}`,
                snippet: "Test snippet for delete prevention",
                confidence_level: "high",
                source_id: sourceId,
                notes: "Test evidence",
              }),
            }
          );

          if (!evidenceResponse.ok) {
            return {
              success: false,
              message: "Failed to create test evidence",
            };
          }

          // Now try to delete the source - should fail
          const deleteResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/${sourceId}`,
            {
              method: "DELETE",
              headers: getAuthHeaders(accessToken),
            }
          );

          // Should fail (403 or 400)
          if (deleteResponse.ok) {
            return {
              success: false,
              message:
                "Source was deleted despite having evidence (should have been prevented)",
            };
          }

          const errorData = await deleteResponse.json();

          if (deleteResponse.status === 403 || deleteResponse.status === 400) {
            return {
              success: true,
              message: `Delete prevented correctly ✓ (Status: ${deleteResponse.status}, Message: ${errorData.error})`,
            };
          }

          return {
            success: false,
            message: `Unexpected status code: ${deleteResponse.status}`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error testing delete prevention: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day7-delete-source-without-evidence",
      name: "Delete Source Without Evidence",
      description: "Verify sources without evidence can be deleted",
      phase: "9.0.7",
      category: "Retention",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message: "Must be authenticated as admin",
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
          // Create a source without any evidence
          const sourceId = `test-deletable-source-${Date.now()}`;

          const sourceResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources`,
            {
              method: "POST",
              headers: getAuthHeaders(accessToken),
              body: JSON.stringify({
                id: sourceId,
                title: "Test Source Without Evidence",
                authors: "Test Author",
                year: 2024,
                type: "peer-reviewed",
                weight: 1.0,
              }),
            }
          );

          if (!sourceResponse.ok) {
            return {
              success: false,
              message: "Failed to create test source",
            };
          }

          // Try to delete it - should succeed
          const deleteResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/${sourceId}`,
            {
              method: "DELETE",
              headers: getAuthHeaders(accessToken),
            }
          );

          if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json();
            return {
              success: false,
              message: `Delete failed: ${errorData.error}`,
            };
          }

          const data = await deleteResponse.json();

          if (!data.success) {
            return {
              success: false,
              message: "Delete operation did not succeed",
            };
          }

          return {
            success: true,
            message: `Source without evidence deleted successfully ✓ (ID: ${sourceId})`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error testing source deletion: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day7-cleanup-expired-screenshots",
      name: "Cleanup Expired Screenshots",
      description: "Verify expired screenshot cleanup endpoint",
      phase: "9.0.7",
      category: "Retention",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message: "Must be authenticated as admin",
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
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/admin/retention/cleanup-screenshots`,
            {
              method: "POST",
              headers: getAuthHeaders(accessToken),
            }
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message: data.error || "Failed to cleanup screenshots",
            };
          }

          const data = await response.json();

          if (!data.success) {
            return {
              success: false,
              message: "Cleanup operation did not succeed",
            };
          }

          return {
            success: true,
            message: `Screenshot cleanup completed ✓ (${
              data.deleted || 0
            } expired screenshots removed)`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error testing screenshot cleanup: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
  ];
}
