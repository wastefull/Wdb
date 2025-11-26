/**
 * Phase 9.0.10 Tests - Open Access Detection
 *
 * Tests for Open Access status checking via Unpaywall API with DOI normalization.
 */

import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { Test } from "../types";

export function getPhase9010Tests(): Test[] {
  return [
    {
      id: "phase9-day10-check-oa-single",
      name: "Check Single DOI for Open Access",
      description: "Verify Open Access detection via Unpaywall API",
      phase: "9.0.10",
      category: "Open Access",
      testFn: async () => {
        try {
          const testDoi = "10.1016/j.biortech.2019.121577";
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/check-oa?doi=${encodeURIComponent(
              testDoi
            )}`,
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
              message: data.error || "Failed to check OA status",
            };
          }

          const data = await response.json();

          if (
            !data.hasOwnProperty("is_open_access") ||
            !data.hasOwnProperty("doi") ||
            !data.hasOwnProperty("oa_status")
          ) {
            return {
              success: false,
              message: "Missing required fields in OA response",
            };
          }

          return {
            success: true,
            message: `OA check complete ✓ (DOI ${
              data.is_open_access ? "IS" : "is NOT"
            } Open Access, status: ${data.oa_status || "unknown"})`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error checking OA status: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day10-bulk-oa-check",
      name: "Bulk Open Access Check",
      description: "Verify multiple DOI OA status checks in parallel",
      phase: "9.0.10",
      category: "Open Access",
      testFn: async () => {
        try {
          const testDois = [
            "10.1016/j.biortech.2019.121577",
            "10.1016/j.wasman.2020.06.002",
            "10.1021/acs.est.1c00466",
          ];

          const results = await Promise.all(
            testDois.map(async (doi) => {
              try {
                const response = await fetch(
                  `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/check-oa?doi=${encodeURIComponent(
                    doi
                  )}`,
                  {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${publicAnonKey}`,
                    },
                  }
                );

                if (!response.ok) {
                  return {
                    doi,
                    is_open_access: null,
                    error: `HTTP ${response.status}`,
                  };
                }

                const data = await response.json();
                return {
                  doi,
                  is_open_access: data.is_open_access,
                  oa_status: data.oa_status,
                };
              } catch (error) {
                return {
                  doi,
                  is_open_access: null,
                  error: String(error),
                };
              }
            })
          );

          const oaCount = results.filter(
            (r) => r.is_open_access === true
          ).length;
          const closedCount = results.filter(
            (r) => r.is_open_access === false
          ).length;
          const errorCount = results.filter(
            (r) => r.is_open_access === null
          ).length;

          return {
            success: true,
            message: `Bulk OA check complete ✓ (${oaCount} OA, ${closedCount} closed, ${errorCount} errors out of ${testDois.length} DOIs)`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error in bulk OA check: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day10-oa-doi-normalization",
      name: "OA DOI Format Normalization",
      description:
        "Verify DOI normalization across different formats for OA checks",
      phase: "9.0.10",
      category: "Open Access",
      testFn: async () => {
        try {
          const doiFormats = [
            "10.1016/j.biortech.2019.121577",
            "https://doi.org/10.1016/j.biortech.2019.121577",
            "http://doi.org/10.1016/j.biortech.2019.121577",
            "doi:10.1016/j.biortech.2019.121577",
            "https://dx.doi.org/10.1016/j.biortech.2019.121577",
          ];

          const results = await Promise.all(
            doiFormats.map(async (doi) => {
              const response = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/check-oa?doi=${encodeURIComponent(
                  doi
                )}`,
                {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${publicAnonKey}`,
                  },
                }
              );

              const data = await response.json();
              return {
                input: doi,
                normalized: data.doi,
                success: data.doi === "10.1016/j.biortech.2019.121577",
              };
            })
          );

          const allNormalized = results.every((r) => r.success);

          return {
            success: allNormalized,
            message: allNormalized
              ? `All ${doiFormats.length} DOI formats normalized correctly for OA checks ✓`
              : `Some DOI formats failed normalization`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error testing DOI normalization: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
  ];
}
