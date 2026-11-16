import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import type { Test } from "../types";

const REST_URL = `https://${projectId}.supabase.co/rest/v1`;
const EDGE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-17cae920`;

async function publicRest(table: string, query: string): Promise<Response> {
  return fetch(`${REST_URL}/${table}?${query}`, {
    headers: {
      Authorization: `Bearer ${publicAnonKey}`,
      apikey: publicAnonKey,
      Accept: "application/json",
    },
  });
}

function getAdminSession() {
  const accessToken = sessionStorage.getItem("wastedb_access_token");
  const userInfoStr = sessionStorage.getItem("wastedb_user");
  const userId = userInfoStr ? JSON.parse(userInfoStr).id ?? null : null;
  return { accessToken, userId };
}

function adminHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${publicAnonKey}`,
    "X-Session-Token": accessToken,
    "Content-Type": "application/json",
  };
}

async function findPublishedMaterial() {
  const response = await publicRest(
    "materials",
    "select=id,name,slug,legacy_kv_id&status=eq.published&limit=10",
  );
  if (!response.ok) {
    return {
      success: false as const,
      message: `Material lookup failed with HTTP ${response.status}.`,
    };
  }
  const materials = (await response.json()) as Array<{ id: string; name?: string }>;
  const material = materials[0];
  if (!material) {
    return {
      success: false as const,
      message: "No published material was available to smoke-test.",
    };
  }
  return {
    success: true as const,
    material,
  };
}

async function createEvidence(params: {
  materialId: string;
  parameterCode: string;
  rawValue: number;
  rawUnit: string;
  citation: string;
  snippet: string;
  methodologyVersion?: string;
}) {
  const { accessToken } = getAdminSession();
  if (!accessToken) {
    return {
      success: false as const,
      message: "Must be authenticated as admin to create evidence.",
    };
  }

  const response = await fetch(`${EDGE_URL}/evidence`, {
    method: "POST",
    headers: adminHeaders(accessToken),
    body: JSON.stringify({
      material_id: params.materialId,
      parameter_code: params.parameterCode,
      raw_value: params.rawValue,
      raw_unit: params.rawUnit,
      snippet: params.snippet,
      source_type: "manual",
      citation: params.citation,
      confidence_level: "medium",
      methodology_version: params.methodologyVersion,
      notes: "Stage 8 smoke test evidence",
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false as const,
      message: `Evidence create returned HTTP ${response.status}: ${JSON.stringify(payload)}`,
    };
  }
  return {
    success: true as const,
    payload,
  };
}

async function validateEvidence(evidenceId: string, status: "validated" | "pending" | "flagged" | "duplicate") {
  const { accessToken } = getAdminSession();
  if (!accessToken) {
    return {
      success: false as const,
      message: "Must be authenticated as admin to validate evidence.",
    };
  }

  const response = await fetch(`${EDGE_URL}/evidence/${evidenceId}/validation`, {
    method: "PATCH",
    headers: adminHeaders(accessToken),
    body: JSON.stringify({ status }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false as const,
      message: `Evidence validation returned HTTP ${response.status}: ${JSON.stringify(payload)}`,
    };
  }
  return {
    success: true as const,
    payload,
  };
}

async function getScoringSummary(materialId: string) {
  const response = await fetch(
    `${EDGE_URL}/graph/materials/${encodeURIComponent(materialId)}/scoring`,
    {
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
      },
    },
  );
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

export function getStage8Tests(): Test[] {
  return [
    {
      id: "stage-8-evidence-provenance",
      name: "Evidence observations retain provenance",
      description:
        "Creates a draft evidence row with source and location context and verifies the stored record keeps methodology metadata.",
      phase: "stage-8",
      stage: 8,
      category: "Evidence Scoring",
      requiresAuth: true,
      testFn: async () => {
        const materialResult = await findPublishedMaterial();
        if (!materialResult.success) {
          return { success: false, message: materialResult.message };
        }
        const citation = `Stage 8 provenance ${Date.now()}`;
        const createResult = await createEvidence({
          materialId: materialResult.material.id,
          parameterCode: "Y",
          rawValue: 0.81,
          rawUnit: "%",
          citation,
          snippet: "Stage 8 provenance smoke test snippet.",
          methodologyVersion: "stage-8-evidence-scoring-v1",
        });
        if (!createResult.success) {
          return { success: false, message: createResult.message };
        }
        const evidence = createResult.payload?.evidence ?? createResult.payload;
        const valid =
          evidence?.citation === citation &&
          evidence?.material_id === materialResult.material.id &&
          evidence?.methodology_version === "stage-8-evidence-scoring-v1" &&
          evidence?.validation_status === "pending" &&
          evidence?.page_number === null;
        return {
          success: valid,
          message: valid
            ? "Evidence rows keep provenance and methodology metadata on create."
            : `Evidence provenance payload was incomplete: ${JSON.stringify(evidence)}`,
        };
      },
    },
    {
      id: "stage-8-methodology-versioning",
      name: "Methodology versions are explicit and reproducible",
      description:
        "Updates the active methodology record and confirms newly created evidence and score summaries report that version.",
      phase: "stage-8",
      stage: 8,
      category: "Evidence Scoring",
      requiresAuth: true,
      testFn: async () => {
        const materialResult = await findPublishedMaterial();
        if (!materialResult.success) {
          return { success: false, message: materialResult.message };
        }

        const version = `stage-8-test-${Date.now()}`;
        const { accessToken } = getAdminSession();
        if (!accessToken) {
          return {
            success: false,
            message: "Must be authenticated as admin to update methodology.",
          };
        }

        const updateResponse = await fetch(`${EDGE_URL}/admin/evidence/scoring/methodology`, {
          method: "PUT",
          headers: adminHeaders(accessToken),
          body: JSON.stringify({
            version,
            description: `Stage 8 smoke-test methodology ${version}`,
          }),
        });
        if (!updateResponse.ok) {
          return {
            success: false,
            message: `Methodology update failed with HTTP ${updateResponse.status}.`,
          };
        }

        const createResult = await createEvidence({
          materialId: materialResult.material.id,
          parameterCode: "Y",
          rawValue: 0.66,
          rawUnit: "%",
          citation: `Stage 8 methodology ${version}`,
          snippet: "Methodology version smoke test snippet.",
        });
        if (!createResult.success) {
          return { success: false, message: createResult.message };
        }

        const summaryResult = await getScoringSummary(materialResult.material.id);
        const valid =
          summaryResult.response.ok &&
          summaryResult.payload?.summary?.methodologyVersion === version &&
          summaryResult.payload?.summary?.materialId === materialResult.material.id;

        return {
          success: valid,
          message: valid
            ? "The active methodology version is reflected in new evidence and public summaries."
            : `Methodology summary was incomplete: ${JSON.stringify(summaryResult.payload)}`,
        };
      },
    },
    {
      id: "stage-8-publication-boundary",
      name: "Draft observations stay out of public scores",
      description:
        "Shows that a draft observation does not affect the public score summary until the admin explicitly publishes it.",
      phase: "stage-8",
      stage: 8,
      category: "Evidence Scoring",
      requiresAuth: true,
      testFn: async () => {
        const materialResult = await findPublishedMaterial();
        if (!materialResult.success) {
          return { success: false, message: materialResult.message };
        }

        const before = await getScoringSummary(materialResult.material.id);
        const beforeCount = before.payload?.summary?.approvedObservationCount ?? 0;

        const createResult = await createEvidence({
          materialId: materialResult.material.id,
          parameterCode: "Y",
          rawValue: 0.54,
          rawUnit: "%",
          citation: `Stage 8 boundary ${Date.now()}`,
          snippet: "Pending evidence should stay out of the public summary.",
        });
        if (!createResult.success) {
          return { success: false, message: createResult.message };
        }
        const pendingSummary = await getScoringSummary(materialResult.material.id);
        const pendingCount = pendingSummary.payload?.summary?.approvedObservationCount ?? 0;
        if (pendingCount !== beforeCount) {
          return {
            success: false,
            message: `Draft evidence leaked into public scores: ${beforeCount} -> ${pendingCount}`,
          };
        }

        const evidence = createResult.payload?.evidence ?? createResult.payload;
        const validateResult = await validateEvidence(evidence.id, "validated");
        if (!validateResult.success) {
          return { success: false, message: validateResult.message };
        }

        const after = await getScoringSummary(materialResult.material.id);
        const afterCount = after.payload?.summary?.approvedObservationCount ?? 0;
        const valid = afterCount === beforeCount + 1;
        return {
          success: valid,
          message: valid
            ? "Draft observations stay hidden until the admin publishes them."
            : `Publication boundary failed: ${beforeCount} -> ${afterCount}`,
        };
      },
    },
    {
      id: "stage-8-score-calculation",
      name: "Published evidence drives public score summaries",
      description:
        "Validates that the score summary reflects only published observations and reports explainable dimension counts.",
      phase: "stage-8",
      stage: 8,
      category: "Evidence Scoring",
      requiresAuth: true,
      testFn: async () => {
        const materialResult = await findPublishedMaterial();
        if (!materialResult.success) {
          return { success: false, message: materialResult.message };
        }

        const before = await getScoringSummary(materialResult.material.id);
        const beforeCount = before.payload?.summary?.approvedObservationCount ?? 0;

        for (const suffix of ["a", "b"]) {
          const createResult = await createEvidence({
            materialId: materialResult.material.id,
            parameterCode: "Y",
            rawValue: suffix === "a" ? 0.72 : 0.78,
            rawUnit: "%",
            citation: `Stage 8 score calc ${suffix} ${Date.now()}`,
            snippet: `Published score calculation evidence ${suffix}.`,
          });
          if (!createResult.success) {
            return { success: false, message: createResult.message };
          }
          const evidence = createResult.payload?.evidence ?? createResult.payload;
          const validateResult = await validateEvidence(evidence.id, "validated");
          if (!validateResult.success) {
            return { success: false, message: validateResult.message };
          }
        }

        const after = await getScoringSummary(materialResult.material.id);
        const summary = after.payload?.summary;
        const recyclability = summary?.dimensions?.find(
          (dimension: { id: string }) => dimension.id === "recyclability",
        );
        const valid =
          after.response.ok &&
          summary?.approvedObservationCount === beforeCount + 2 &&
          recyclability &&
          recyclability.observationCount >= 2 &&
          typeof recyclability.score === "number" &&
          recyclability.score > 0;

        return {
          success: valid,
          message: valid
            ? "Published observations are reflected in the public score summary."
            : `Score calculation summary was incomplete: ${JSON.stringify(summary)}`,
        };
      },
    },
    {
      id: "stage-8-admin-publication-workflow",
      name: "Admin publication view keeps provenance visible",
      description:
        "Creates a draft observation and confirms the publication view exposes its material, parameter, snippet, and methodology metadata.",
      phase: "stage-8",
      stage: 8,
      category: "Evidence Scoring",
      requiresAuth: true,
      testFn: async () => {
        const materialResult = await findPublishedMaterial();
        if (!materialResult.success) {
          return { success: false, message: materialResult.message };
        }

        const citation = `Stage 8 admin publication ${Date.now()}`;
        const createResult = await createEvidence({
          materialId: materialResult.material.id,
          parameterCode: "Y",
          rawValue: 0.61,
          rawUnit: "%",
          citation,
          snippet: "Admin publication view item.",
        });
        if (!createResult.success) {
          return { success: false, message: createResult.message };
        }

        const { accessToken } = getAdminSession();
        if (!accessToken) {
          return {
            success: false,
            message: "Must be authenticated as admin to inspect evidence publication.",
          };
        }

        const queueResponse = await fetch(
          `${EDGE_URL}/admin/evidence/scoring/review?status=pending&search=${encodeURIComponent(citation)}`,
          {
            headers: adminHeaders(accessToken),
          },
        );
        const queuePayload = await queueResponse.json().catch(() => ({}));
        const item = (queuePayload.items ?? []).find(
          (entry: { citation?: string }) => entry.citation === citation,
        );
        const valid =
          queueResponse.ok &&
          Boolean(item) &&
          item.material_id === materialResult.material.id &&
          item.parameter_code === "Y" &&
          item.snippet === "Admin publication view item." &&
          item.methodology_version;

        return {
          success: valid,
          message: valid
            ? "The publication view exposes complete evidence provenance for the admin."
            : `Publication view payload was incomplete: ${JSON.stringify(queuePayload)}`,
        };
      },
    },
  ];
}
