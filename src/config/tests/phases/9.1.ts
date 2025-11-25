/**
 * Phase 9.1 Tests - Evidence Points and Parameter Aggregations
 *
 * Tests for evidence point creation, retrieval, validation, parameter aggregations,
 * and referential integrity checks for sources.
 */

import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { Test } from "../types";

export function getPhase91Tests(user: any): Test[] {
  return [
    {
      id: "phase9.1-create-evidence",
      name: "Create Evidence Point",
      description: "Verify evidence point creation with MIU data",
      phase: "9.1",
      category: "Evidence",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message: "Must be authenticated to create evidence",
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
          const testMaterialId = "test-material-" + Date.now();
          const testSourceRef = "test-source-" + Date.now();

          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                material_id: testMaterialId,
                parameter_code: "Y",
                raw_value: 85.5,
                raw_unit: "%",
                snippet:
                  "The yield was measured at 85.5% under standard conditions.",
                source_type: "whitepaper",
                citation: "Test Source 2025",
                confidence_level: "high",
                notes: "Test evidence point for Phase 9.1",
                page_number: 42,
                source_ref: testSourceRef,
                source_weight: 1.0,
                restricted_content: false,
              }),
            }
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message: data.error || "Failed to create evidence",
            };
          }

          const data = await response.json();

          if (!data.evidence || !data.evidence.id) {
            return { success: false, message: "No evidence ID returned" };
          }

          // Store for other tests
          sessionStorage.setItem("phase91_test_evidence_id", data.evidence.id);
          sessionStorage.setItem("phase91_test_material_id", testMaterialId);
          sessionStorage.setItem("phase91_test_source_ref", testSourceRef);

          return {
            success: true,
            message: `Created evidence point ${data.evidence.id}`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error creating evidence: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9.1-get-evidence-by-id",
      name: "Get Evidence Point by ID",
      description: "Verify evidence retrieval by ID",
      phase: "9.1",
      category: "Evidence",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message: "Must be authenticated to retrieve evidence",
          };
        }

        const accessToken = sessionStorage.getItem("wastedb_access_token");
        if (!accessToken) {
          return {
            success: false,
            message: "No access token found - please sign in again",
          };
        }

        const evidenceId = sessionStorage.getItem("phase91_test_evidence_id");
        if (!evidenceId) {
          return {
            success: false,
            message:
              "No test evidence ID found - run Create Evidence Point test first",
          };
        }

        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${evidenceId}`,
            {
              method: "GET",
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message: data.error || "Failed to get evidence",
            };
          }

          const data = await response.json();

          if (!data.evidence || data.evidence.id !== evidenceId) {
            return {
              success: false,
              message: "Evidence point not found or ID mismatch",
            };
          }

          return {
            success: true,
            message: "Successfully retrieved evidence point",
          };
        } catch (error) {
          return {
            success: false,
            message: `Error retrieving evidence: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9.1-get-evidence-by-material",
      name: "Get Evidence Points by Material",
      description: "Verify evidence retrieval for a specific material",
      phase: "9.1",
      category: "Evidence",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message: "Must be authenticated to retrieve evidence",
          };
        }

        const accessToken = sessionStorage.getItem("wastedb_access_token");
        if (!accessToken) {
          return {
            success: false,
            message: "No access token found - please sign in again",
          };
        }

        const materialId = sessionStorage.getItem("phase91_test_material_id");
        if (!materialId) {
          return {
            success: false,
            message:
              "No test material ID found - run Create Evidence Point test first",
          };
        }

        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/material/${materialId}`,
            {
              method: "GET",
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message: data.error || "Failed to get evidence",
            };
          }

          const data = await response.json();

          if (!data.evidence || data.count !== 1) {
            return {
              success: false,
              message: `Expected 1 evidence point, got ${data.count}`,
            };
          }

          return {
            success: true,
            message: `Found ${data.count} evidence point(s)`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error retrieving evidence: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9.1-update-evidence-validation",
      name: "Update Evidence Validation",
      description: "Verify updating validation status of evidence",
      phase: "9.1",
      category: "Evidence",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message: "Must be authenticated to update evidence",
          };
        }

        const accessToken = sessionStorage.getItem("wastedb_access_token");
        const evidenceId = sessionStorage.getItem("phase91_test_evidence_id");

        if (!accessToken) {
          return {
            success: false,
            message: "No access token found - please sign in again",
          };
        }

        if (!evidenceId) {
          return {
            success: false,
            message:
              "No test evidence ID found - run Create Evidence Point test first",
          };
        }

        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${evidenceId}/validation`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                status: "validated",
              }),
            }
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message: data.error || "Failed to update validation",
            };
          }

          const data = await response.json();

          if (
            !data.evidence ||
            data.evidence.validation_status !== "validated"
          ) {
            return { success: false, message: "Validation status not updated" };
          }

          return {
            success: true,
            message: "Validation status updated to validated",
          };
        } catch (error) {
          return {
            success: false,
            message: `Error updating validation: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9.1-create-aggregation",
      name: "Create Aggregation",
      description: "Verify parameter aggregation creation from MIUs",
      phase: "9.1",
      category: "Aggregation",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message: "Must be authenticated to create aggregation",
          };
        }

        const accessToken = sessionStorage.getItem("wastedb_access_token");
        const materialId = sessionStorage.getItem("phase91_test_material_id");
        const evidenceId = sessionStorage.getItem("phase91_test_evidence_id");

        if (!accessToken) {
          return {
            success: false,
            message: "No access token found - please sign in again",
          };
        }

        if (!materialId || !evidenceId) {
          return {
            success: false,
            message:
              "No test data found - run Create Evidence Point test first",
          };
        }

        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/aggregations`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                material_id: materialId,
                parameter: "Y",
                miu_ids: [evidenceId],
                quality_threshold: 0.0,
                min_sources: 1,
              }),
            }
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message: data.error || "Failed to create aggregation",
            };
          }

          const data = await response.json();

          if (!data.aggregation || !data.aggregation.id) {
            return { success: false, message: "No aggregation ID returned" };
          }

          // Store for other tests
          sessionStorage.setItem(
            "phase91_test_aggregation_id",
            data.aggregation.id
          );

          return {
            success: true,
            message: `Created aggregation ${data.aggregation.id}`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error creating aggregation: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9.1-get-aggregation-by-id",
      name: "Get Aggregation by ID",
      description: "Verify aggregation retrieval by ID",
      phase: "9.1",
      category: "Aggregation",
      testFn: async () => {
        const aggregationId = sessionStorage.getItem(
          "phase91_test_aggregation_id"
        );
        if (!aggregationId) {
          return {
            success: false,
            message:
              "No test aggregation ID found - run Create Aggregation test first",
          };
        }

        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/aggregations/${aggregationId}`,
            {
              method: "GET",
              headers: { Authorization: `Bearer ${publicAnonKey}` },
            }
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message: data.error || "Failed to get aggregation",
            };
          }

          const data = await response.json();

          if (!data.aggregation || data.aggregation.id !== aggregationId) {
            return {
              success: false,
              message: "Aggregation not found or ID mismatch",
            };
          }

          return {
            success: true,
            message: "Successfully retrieved aggregation",
          };
        } catch (error) {
          return {
            success: false,
            message: `Error retrieving aggregation: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9.1-get-aggregations-by-material",
      name: "Get Aggregations by Material",
      description: "Verify aggregation retrieval for a specific material",
      phase: "9.1",
      category: "Aggregation",
      testFn: async () => {
        const materialId = sessionStorage.getItem("phase91_test_material_id");
        if (!materialId) {
          return {
            success: false,
            message:
              "No test material ID found - run Create Evidence Point test first",
          };
        }

        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/aggregations/material/${materialId}`,
            {
              method: "GET",
              headers: { Authorization: `Bearer ${publicAnonKey}` },
            }
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message: data.error || "Failed to get aggregations",
            };
          }

          const data = await response.json();

          if (!data.aggregations || data.count !== 1) {
            return {
              success: false,
              message: `Expected 1 aggregation, got ${data.count}`,
            };
          }

          return {
            success: true,
            message: `Found ${data.count} aggregation(s)`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error retrieving aggregations: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9.1-get-aggregation-stats",
      name: "Get Aggregation Stats",
      description: "Verify aggregation statistics endpoint",
      phase: "9.1",
      category: "Aggregation",
      testFn: async () => {
        const materialId = sessionStorage.getItem("phase91_test_material_id");
        if (!materialId) {
          return {
            success: false,
            message:
              "No test material ID found - run Create Evidence Point test first",
          };
        }

        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/aggregations/material/${materialId}/stats`,
            {
              method: "GET",
              headers: { Authorization: `Bearer ${publicAnonKey}` },
            }
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message: data.error || "Failed to get stats",
            };
          }

          const data = await response.json();

          if (!data.stats || data.stats.total_parameters !== 1) {
            return { success: false, message: "Stats not returned correctly" };
          }

          return {
            success: true,
            message: `Stats: ${data.stats.total_parameters} parameter(s) aggregated`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error retrieving stats: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9.1-source-can-delete-with-mius",
      name: "Check Source Can Delete (with MIUs)",
      description: "Verify source deletion is blocked when MIUs reference it",
      phase: "9.1",
      category: "Referential Integrity",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message: "Must be authenticated as admin to check source deletion",
          };
        }

        const accessToken = sessionStorage.getItem("wastedb_access_token");
        if (!accessToken) {
          return {
            success: false,
            message: "No access token found - please sign in again",
          };
        }

        const sourceRef = sessionStorage.getItem("phase91_test_source_ref");
        if (!sourceRef) {
          return {
            success: false,
            message:
              "No test source ref found - run Create Evidence Point test first",
          };
        }

        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/${sourceRef}/can-delete`,
            {
              method: "GET",
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message: data.error || "Failed to check deletion",
            };
          }

          const data = await response.json();

          if (data.canDelete !== false || data.evidenceCount !== 1) {
            return {
              success: false,
              message: `Expected canDelete=false and evidenceCount=1, got canDelete=${data.canDelete} and evidenceCount=${data.evidenceCount}`,
            };
          }

          return {
            success: true,
            message: `Correctly blocked deletion (${data.evidenceCount} evidence point)`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error checking deletion: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9.1-source-can-delete-without-mius",
      name: "Check Source Can Delete (without MIUs)",
      description:
        "Verify source deletion is allowed when no MIUs reference it",
      phase: "9.1",
      category: "Referential Integrity",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message: "Must be authenticated as admin to check source deletion",
          };
        }

        const accessToken = sessionStorage.getItem("wastedb_access_token");
        if (!accessToken) {
          return {
            success: false,
            message: "No access token found - please sign in again",
          };
        }

        const nonExistentSource = "non-existent-source-" + Date.now();

        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/${nonExistentSource}/can-delete`,
            {
              method: "GET",
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message: data.error || "Failed to check deletion",
            };
          }

          const data = await response.json();

          if (data.canDelete !== true || data.evidenceCount !== 0) {
            return {
              success: false,
              message: `Expected canDelete=true and evidenceCount=0, got canDelete=${data.canDelete} and evidenceCount=${data.evidenceCount}`,
            };
          }

          return {
            success: true,
            message: "Correctly allowed deletion (0 evidence points)",
          };
        } catch (error) {
          return {
            success: false,
            message: `Error checking deletion: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
  ];
}
