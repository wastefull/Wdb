/**
 * Phase 9.0.4 Tests - Evidence Management System
 *
 * Tests for evidence point CRUD operations for material parameter validation.
 */

import { projectId } from "../../../utils/supabase/info";
import { Test } from "../types";

export function getPhase904Tests(user: any): Test[] {
  return [
    {
      id: "phase9-day4-create-evidence",
      name: "Create Evidence Point",
      description:
        "Verify evidence point creation for material parameters",
      phase: "9.0.4",
      category: "Evidence",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message:
              "Must be authenticated to create evidence points",
          };
        }

        const accessToken = sessionStorage.getItem(
          "wastedb_access_token",
        );
        if (!accessToken) {
          return {
            success: false,
            message:
              "No access token found - please sign in again",
          };
        }

        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                material_id: "test-material-automated",
                parameter_code: "Y",
                raw_value: 85,
                raw_unit: "%",
                snippet:
                  "Test snippet from automated test suite",
                source_type: "manual",
                citation: "Automated Test Citation",
                confidence_level: "high",
                notes:
                  "Test evidence from automated test suite",
              }),
            },
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message:
                data.error || "Failed to create evidence",
            };
          }

          const data = await response.json();

          if (!data.success || !data.evidenceId) {
            return {
              success: false,
              message: "Invalid response - missing evidence ID",
            };
          }

          return {
            success: true,
            message: `Evidence created ✓ (ID: ${data.evidenceId})`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error creating evidence: ${
              error instanceof Error
                ? error.message
                : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day4-get-evidence-by-material",
      name: "Get Evidence by Material",
      description:
        "Verify evidence retrieval for specific material",
      phase: "9.0.4",
      category: "Evidence",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message:
              "Must be authenticated to retrieve evidence",
          };
        }

        const accessToken = sessionStorage.getItem(
          "wastedb_access_token",
        );
        if (!accessToken) {
          return {
            success: false,
            message:
              "No access token found - please sign in again",
          };
        }

        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/material/1760747660232dxyk93nx8`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message:
                data.error ||
                "Failed to retrieve evidence by material",
            };
          }

          const data = await response.json();

          if (!data.evidence || !Array.isArray(data.evidence)) {
            return {
              success: false,
              message: "Invalid response structure",
            };
          }

          return {
            success: true,
            message: `Found ${data.evidence.length} evidence point(s) for material ✓`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error retrieving evidence: ${
              error instanceof Error
                ? error.message
                : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day4-get-single-evidence",
      name: "Get Single Evidence Point",
      description:
        "Verify retrieving a specific evidence point by ID",
      phase: "9.0.4",
      category: "Evidence",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message:
              "Must be authenticated to get evidence points",
          };
        }

        const accessToken = sessionStorage.getItem(
          "wastedb_access_token",
        );
        if (!accessToken) {
          return {
            success: false,
            message:
              "No access token found - please sign in again",
          };
        }

        try {
          // First, get all evidence to find an ID
          const listResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          );

          if (!listResponse.ok) {
            return {
              success: false,
              message: "Failed to list evidence points",
            };
          }

          const listData = await listResponse.json();

          if (
            !listData.evidence ||
            listData.evidence.length === 0
          ) {
            return {
              success: false,
              message:
                "No evidence points found. Create one first (Test: Create Evidence Point)",
            };
          }

          const testId = listData.evidence[0].id;

          // Now get the specific evidence point
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${testId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message:
                data.error ||
                "Failed to retrieve evidence point",
            };
          }

          const data = await response.json();

          if (!data.evidence || data.evidence.id !== testId) {
            return {
              success: false,
              message:
                "Retrieved evidence does not match requested ID",
            };
          }

          return {
            success: true,
            message: `Retrieved evidence point ✓ (ID: ${testId})`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error retrieving evidence point: ${
              error instanceof Error
                ? error.message
                : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day4-update-evidence",
      name: "Update Evidence Point",
      description: "Verify updating an existing evidence point",
      phase: "9.0.4",
      category: "Evidence",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message:
              "Must be authenticated as admin to update evidence",
          };
        }

        const accessToken = sessionStorage.getItem(
          "wastedb_access_token",
        );
        if (!accessToken) {
          return {
            success: false,
            message:
              "No access token found - please sign in again",
          };
        }

        try {
          // First, create a test evidence point to update
          const createResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                material_id: "test-material-for-update",
                parameter_code: "Y",
                raw_value: 50,
                raw_unit: "%",
                source_type: "manual",
                citation: "Test source for update",
                snippet: "Test snippet for update",
                confidence_level: "high",
                notes: "Original note for update test",
              }),
            },
          );

          if (!createResponse.ok) {
            const createError = await createResponse.json();
            return {
              success: false,
              message: `Failed to create test evidence: ${
                createError.error || "Unknown error"
              }`,
            };
          }

          const createData = await createResponse.json();
          const testEvidence = createData.evidence;
          const updatedNote = `Updated note at ${new Date().toISOString()}`;

          // Now update it
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${testEvidence.id}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                material_id: testEvidence.material_id,
                parameter_code: testEvidence.parameter_code,
                raw_value: testEvidence.raw_value,
                raw_unit: testEvidence.raw_unit,
                source_type: testEvidence.source_type,
                citation: testEvidence.citation,
                snippet: testEvidence.snippet,
                confidence_level: testEvidence.confidence_level,
                notes: updatedNote,
              }),
            },
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message:
                data.error || "Failed to update evidence point",
            };
          }

          const data = await response.json();

          if (
            !data.evidence ||
            data.evidence.notes !== updatedNote
          ) {
            return {
              success: false,
              message: "Evidence was not updated correctly",
            };
          }

          return {
            success: true,
            message: `Evidence point updated ✓ (ID: ${testEvidence.id})`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error updating evidence point: ${
              error instanceof Error
                ? error.message
                : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day4-delete-evidence",
      name: "Delete Evidence Point",
      description: "Verify deleting an evidence point",
      phase: "9.0.4",
      category: "Evidence",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message:
              "Must be authenticated as admin to delete evidence",
          };
        }

        const accessToken = sessionStorage.getItem(
          "wastedb_access_token",
        );
        if (!accessToken) {
          return {
            success: false,
            message:
              "No access token found - please sign in again",
          };
        }

        try {
          // First, create a test evidence point to delete
          const createResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                material_id: "test-material-for-delete",
                parameter_code: "Y",
                raw_value: 50,
                raw_unit: "%",
                source_type: "manual",
                citation: "Test source for deletion",
                snippet: "Test snippet for deletion",
                confidence_level: "high",
                notes: "Test evidence for deletion",
              }),
            },
          );

          if (!createResponse.ok) {
            return {
              success: false,
              message:
                "Failed to create test evidence for deletion",
            };
          }

          const createData = await createResponse.json();
          const testId = createData.evidence.id;

          // Now delete it
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${testId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message:
                data.error || "Failed to delete evidence point",
            };
          }

          const data = await response.json();

          if (!data.success) {
            return {
              success: false,
              message: "Delete operation did not succeed",
            };
          }

          // Verify it's deleted by trying to get it
          const verifyResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${testId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          );

          if (verifyResponse.ok) {
            return {
              success: false,
              message:
                "Evidence point still exists after deletion",
            };
          }

          return {
            success: true,
            message: `Evidence point deleted ✓ (ID: ${testId})`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error deleting evidence point: ${
              error instanceof Error
                ? error.message
                : "Unknown error"
            }`,
          };
        }
      },
    },
  ];
}