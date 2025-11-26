/**
 * Phase 9.0.11 Tests - Ontologies & Aggregation Snapshots
 *
 * Tests for units.json and context.json ontology validation, plus aggregation
 * computation with complete policy snapshot tracking.
 */

import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { Test, getAuthHeaders } from "../types";

export function getPhase9011Tests(user: any): Test[] {
  return [
    {
      id: "phase9-day11-units-json",
      name: "Validate units.json Structure",
      description:
        "Verify units.json has all required fields and 13 parameters",
      phase: "9.0.11",
      category: "Ontologies",
      testFn: async () => {
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/ontologies/units`,
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
              message: data.error || "Failed to load units ontology",
            };
          }

          const unitsData = await response.json();

          if (
            !unitsData.version ||
            !unitsData.effective_date ||
            !unitsData.parameters
          ) {
            return {
              success: false,
              message:
                "Missing required top-level fields (version, effective_date, or parameters)",
            };
          }

          const requiredParams = [
            "Y",
            "D",
            "C",
            "M",
            "E",
            "B",
            "N",
            "T",
            "H",
            "L",
            "R",
            "U",
            "C_RU",
          ];
          const missingParams = requiredParams.filter(
            (p) => !unitsData.parameters[p]
          );

          if (missingParams.length > 0) {
            return {
              success: false,
              message: `Missing parameters: ${missingParams.join(", ")}`,
            };
          }

          return {
            success: true,
            message: `units.json valid! Version ${unitsData.version}, ${
              Object.keys(unitsData.parameters).length
            } parameters defined`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error loading units.json: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day11-context-json",
      name: "Validate context.json Structure",
      description:
        "Verify context.json has all required controlled vocabularies",
      phase: "9.0.11",
      category: "Ontologies",
      testFn: async () => {
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/ontologies/context`,
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
              message: data.error || "Failed to load context ontology",
            };
          }

          const contextData = await response.json();

          if (!contextData.version || !contextData.effective_date) {
            return {
              success: false,
              message:
                "Missing required top-level fields (version or effective_date)",
            };
          }

          if (!contextData.vocabularies) {
            return {
              success: false,
              message: "Missing vocabularies object",
            };
          }

          const requiredFields = ["process", "stream", "region", "scale"];
          const missingFields = requiredFields.filter(
            (f) => !contextData.vocabularies[f]
          );

          if (missingFields.length > 0) {
            return {
              success: false,
              message: `Missing controlled vocabularies: ${missingFields.join(
                ", "
              )}`,
            };
          }

          return {
            success: true,
            message: `context.json valid! Version ${contextData.version}, 4 vocabularies defined`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error loading context.json: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day11-aggregation-compute",
      name: "Compute Aggregation with Policy Snapshot",
      description:
        "Verify aggregation computation stores complete version snapshot",
      phase: "9.0.11",
      category: "Aggregation",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message: "Must be authenticated to compute aggregation",
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
          const materialId = "1760747660232dxyk93nx8";
          const parameter = "Y";

          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/aggregations/compute`,
            {
              method: "POST",
              headers: getAuthHeaders(accessToken),
              body: JSON.stringify({
                material_id: materialId,
                parameter_code: parameter,
              }),
            }
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message: data.error || "Failed to compute aggregation",
            };
          }

          const data = await response.json();

          if (!data.aggregation) {
            return {
              success: false,
              message: "No aggregation returned",
            };
          }

          const agg = data.aggregation;
          const requiredFields = [
            "transform_version",
            "ontology_version",
            "weight_policy_version",
            "weights_used",
            "miu_ids",
          ];
          const missingFields = requiredFields.filter((f) => !agg[f]);

          if (missingFields.length > 0) {
            return {
              success: false,
              message: `Missing policy snapshot fields: ${missingFields.join(
                ", "
              )}`,
            };
          }

          return {
            success: true,
            message: `Aggregation computed ✓ (value: ${agg.aggregated_value}, ${agg.miu_ids.length} MIUs, all version fields present)`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error computing aggregation: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day11-aggregation-retrieve",
      name: "Retrieve Aggregation Snapshot",
      description:
        "Verify aggregation retrieval endpoint returns snapshot data",
      phase: "9.0.11",
      category: "Aggregation",
      testFn: async () => {
        try {
          const materialId = "1760747660232dxyk93nx8";
          const parameter = "Y";

          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/aggregations/${materialId}/${parameter}`,
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
              message: data.error || "Failed to retrieve aggregation",
            };
          }

          const data = await response.json();

          if (!data.aggregation) {
            return {
              success: false,
              message: "No aggregation returned",
            };
          }

          const agg = data.aggregation;

          return {
            success: true,
            message: `Aggregation retrieved ✓ (material: ${agg.material_id}, parameter: ${agg.parameter_code}, value: ${agg.aggregated_value})`,
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
  ];
}
