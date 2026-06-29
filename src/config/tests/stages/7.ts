import { EMPTY_MATERIAL_GRAPH_EXPERIENCE } from "../../../utils/materialExperience";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import type { Test } from "../types";

const REST_URL = `https://${projectId}.supabase.co/rest/v1`;

async function publicRest(table: string, query: string): Promise<Response> {
  return fetch(`${REST_URL}/${table}?${query}`, {
    headers: {
      Authorization: `Bearer ${publicAnonKey}`,
      apikey: publicAnonKey,
      Accept: "application/json",
    },
  });
}

export function getStage7Tests(): Test[] {
  return [
    {
      id: "stage-7-canonical-entry-baseline",
      name: "Stage 7 starts from canonical graph entities",
      description:
        "Confirms production exposes canonical entities and bindings before relationship, tag, content, and video curation begins.",
      phase: "stage-7",
      stage: 7,
      category: "Graph Curation",
      requiresAuth: false,
      testFn: async () => {
        const [entitiesResponse, bindingsResponse] = await Promise.all([
          publicRest("entities", "select=id&limit=1"),
          publicRest("entity_canonical_bindings", "select=entity_id&limit=1"),
        ]);
        if (!entitiesResponse.ok || !bindingsResponse.ok) {
          return {
            success: false,
            message: `Canonical baseline unavailable: entities HTTP ${entitiesResponse.status}, bindings HTTP ${bindingsResponse.status}.`,
          };
        }
        const entities = await entitiesResponse.json();
        const bindings = await bindingsResponse.json();
        const valid =
          Array.isArray(entities) &&
          entities.length > 0 &&
          Array.isArray(bindings) &&
          bindings.length > 0;
        return {
          success: valid,
          message: valid
            ? "Canonical entities and bindings are available as the Stage 7 baseline."
            : "Canonical entities or bindings are unexpectedly empty.",
        };
      },
    },
    {
      id: "stage-7-discusses-semantics",
      name: "Discovery relationships remain evidence-neutral",
      description:
        "Verifies the governed discusses vocabulary explicitly avoids implying evidentiary support.",
      phase: "stage-7",
      stage: 7,
      category: "Knowledge Governance",
      requiresAuth: false,
      testFn: async () => {
        const response = await publicRest(
          "relationship_types",
          "select=slug,description,active&slug=eq.discusses",
        );
        if (!response.ok) {
          return {
            success: false,
            message: `Discusses vocabulary query failed with HTTP ${response.status}.`,
          };
        }
        const rows = (await response.json()) as Array<{
          slug?: string;
          description?: string;
          active?: boolean;
        }>;
        const discusses = rows[0];
        const valid =
          discusses?.slug === "discusses" &&
          discusses.active === true &&
          discusses.description
            ?.toLowerCase()
            .includes("without implying evidentiary support") === true;
        return {
          success: valid,
          message: valid
            ? "The discusses relationship remains broad and evidence-neutral."
            : "The discusses vocabulary no longer preserves its evidence-neutral contract.",
        };
      },
    },
    {
      id: "stage-7-read-cutover-disabled",
      name: "Graph-powered material reads remain disabled",
      description:
        "Confirms Stage 7 curation work does not prematurely expose graph recommendations in the Stage 5 material adapter.",
      phase: "stage-7",
      stage: 7,
      category: "Compatibility",
      requiresAuth: false,
      testFn: async () => {
        const sections = [
          EMPTY_MATERIAL_GRAPH_EXPERIENCE.knowledgeFeed,
          EMPTY_MATERIAL_GRAPH_EXPERIENCE.relatedEntities,
          EMPTY_MATERIAL_GRAPH_EXPERIENCE.discoveryPaths,
        ];
        const valid = sections.every(
          (section) =>
            section.availability === "awaiting-graph-data" &&
            section.items.length === 0,
        );
        return {
          success: valid,
          message: valid
            ? "Material graph reads remain in the honest pre-cutover state."
            : "A graph-powered material section was enabled before Stage 8.",
        };
      },
    },
  ];
}
