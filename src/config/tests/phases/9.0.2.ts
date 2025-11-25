/**
 * Phase 9.0.2 Tests - Transform System
 *
 * Tests for parameter transform definitions, versioning, and recompute job management.
 */

import {
  projectId,
  publicAnonKey,
} from "../../../utils/supabase/info";
import { Test } from "../types";

export function getPhase902Tests(user: any): Test[] {
  return [
    {
      id: "phase9-day2-get-all-transforms",
      name: "Get All Transforms",
      description:
        "Verify transforms endpoint returns all 13 parameter definitions",
      phase: "9.0.2",
      category: "Transforms",
      testFn: async () => {
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/transforms`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${publicAnonKey}`,
              },
            },
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message:
                data.error || "Failed to retrieve transforms",
            };
          }

          const data = await response.json();

          if (
            !data.transforms ||
            !Array.isArray(data.transforms)
          ) {
            return {
              success: false,
              message: "Invalid response structure",
            };
          }

          if (data.transforms.length !== 13) {
            return {
              success: false,
              message: `Expected 13 transforms, got ${data.transforms.length}`,
            };
          }

          return {
            success: true,
            message: `All 13 transforms retrieved ✓ (version ${data.version})`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error retrieving transforms: ${
              error instanceof Error
                ? error.message
                : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day2-get-specific-transform",
      name: "Get Specific Transform (Y)",
      description:
        "Verify individual transform retrieval by parameter code",
      phase: "9.0.2",
      category: "Transforms",
      testFn: async () => {
        try {
          const parameter = "Y";
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/transforms/${parameter}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${publicAnonKey}`,
              },
            },
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message:
                data.error || "Failed to retrieve transform",
            };
          }

          const data = await response.json();

          if (data.parameter !== parameter) {
            return {
              success: false,
              message: `Expected parameter ${parameter}, got ${data.parameter}`,
            };
          }

          if (!data.formula || !data.version) {
            return {
              success: false,
              message:
                "Missing required fields (formula, version)",
            };
          }

          return {
            success: true,
            message: `Transform retrieved ✓ (${data.name}, formula: ${data.formula}, v${data.version})`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error retrieving transform: ${
              error instanceof Error
                ? error.message
                : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day2-create-recompute-job",
      name: "Create Recompute Job",
      description:
        "Verify recompute job creation with proper ID generation",
      phase: "9.0.2",
      category: "Transforms",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message:
              "Must be authenticated to create recompute jobs",
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
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/transforms/recompute`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                parameter: "Y",
                newTransformVersion: "1.1",
                reason:
                  "Testing recompute job creation from automated test suite",
              }),
            },
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message:
                data.error || "Failed to create recompute job",
            };
          }

          const data = await response.json();

          if (!data.jobId || !data.jobId.startsWith("RJ-")) {
            return {
              success: false,
              message:
                "Invalid job ID format (should start with RJ-)",
            };
          }

          return {
            success: true,
            message: `Recompute job created ✓ (ID: ${data.jobId})`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error creating recompute job: ${
              error instanceof Error
                ? error.message
                : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day2-list-recompute-jobs",
      name: "List Recompute Jobs",
      description: "Verify job history retrieval from KV store",
      phase: "9.0.2",
      category: "Transforms",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message:
              "Must be authenticated to list recompute jobs",
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
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/transforms/recompute`,
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
                "Failed to retrieve recompute jobs",
            };
          }

          const data = await response.json();

          if (!Array.isArray(data.jobs)) {
            return {
              success: false,
              message: "Expected array of jobs",
            };
          }

          return {
            success: true,
            message: `Retrieved ${data.jobs.length} recompute job(s) ✓`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error retrieving recompute jobs: ${
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