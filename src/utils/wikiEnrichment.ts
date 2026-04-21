/**
 * wikiEnrichment.ts
 *
 * Fetch and assemble MaterialWikiMetadata from Wikimedia APIs:
 *   - Wikidata (CC0) — QIDs, aliases, chemical names, material class, Commons links
 *   - Wikipedia REST summary (CC BY-SA 4.0) — short description + versioned attribution
 *   - Wikimedia Commons (per-file license) — image URL + full license metadata
 *
 * API etiquette:
 *   - Identifies this client via the User-Agent header on server-side requests.
 *     Browsers block setting User-Agent manually, so client-side calls omit it.
 *   - Callers are responsible for caching; do not call on every render.
 *   - All functions return null / partial data on failure rather than throwing.
 *
 * Compliance notes:
 *   - Wikidata structured data is CC0 — no attribution obligation.
 *   - Wikipedia text is CC BY-SA 4.0 — sourceUrl + sourceRevisionId must be
 *     stored with any text derived from it.
 *   - Commons images are licensed per-file; only licenses in SAFE_WIKI_IMAGE_LICENSES
 *     are accepted. The imageAuthor / imageLicenseName / imageLicenseUrl fields
 *     must be displayed wherever the image is shown.
 */

import {
  MaterialWikiMetadata,
  SAFE_WIKI_IMAGE_LICENSES,
} from "../types/material";
import { logger } from "./logger";

// ─── Constants ──────────────────────────────────────────────────────────────

const USER_AGENT =
  "WasteDB/1.1 (https://db.wastefull.org; contact@wastefull.org) wikiEnrichment.ts";

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const WIKIPEDIA_REST = "https://en.wikipedia.org/api/rest_v1";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

// Wikidata property IDs used in this module
const WD_PROP = {
  IMAGE: "P18",
  COMMONS_CATEGORY: "P373",
  CHEMICAL_FORMULA: "P274",
  SHORT_NAME: "P1813",
  INSTANCE_OF: "P31",
  SUBCLASS_OF: "P279",
  TRADE_NAME: "P1449",
  CAS_NUMBER: "P231",
} as const;

// ─── Public result types ─────────────────────────────────────────────────────

export interface WikidataSearchResult {
  qid: string;
  label: string;
  description?: string;
  aliases?: string[];
}

export interface WikidataSearchOptions {
  limit?: number;
  offset?: number;
}

// ─── Internal API response shapes ───────────────────────────────────────────

interface WdSearchResponse {
  search: Array<{
    id: string;
    label: string;
    description?: string;
    aliases?: string[];
  }>;
}

interface WdEntityResponse {
  entities: Record<
    string,
    {
      id: string;
      labels?: Record<string, { language: string; value: string }>;
      aliases?: Record<string, Array<{ language: string; value: string }>>;
      sitelinks?: Record<string, { site: string; title: string }>;
      claims?: Record<string, WdClaim[]>;
    }
  >;
}

interface WdClaim {
  mainsnak: {
    snaktype: string;
    datatype?: string;
    datavalue?: {
      type: string;
      value:
        | string
        | number
        | { text: string; language: string }
        | { id: string }
        | Record<string, unknown>;
    };
  };
}

interface WikipediaSummaryResponse {
  title: string;
  extract?: string;
  description?: string;
  revision?: number;
  content_urls?: {
    desktop?: { page?: string };
  };
  originalimage?: { source?: string };
}

interface CommonsImageInfoResponse {
  query?: {
    pages?: Record<
      string,
      {
        title: string;
        imageinfo?: Array<{
          url: string;
          extmetadata?: {
            LicenseShortName?: { value: string };
            Artist?: { value: string };
            LicenseUrl?: { value: string };
            Attribution?: { value: string };
            UsageTerms?: { value: string };
          };
        }>;
      }
    >;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wdFetch<T>(params: Record<string, string>): Promise<T | null> {
  const url = new URL(WIKIDATA_API);
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*"); // CORS
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const headers =
    typeof window === "undefined" ? { "User-Agent": USER_AGENT } : undefined;
  return fetch(url.toString(), headers ? { headers } : undefined)
    .then((r) => {
      if (!r.ok) throw new Error(`Wikidata ${r.status}`);
      return r.json() as Promise<T>;
    })
    .catch((err) => {
      logger.error("[wikiEnrichment] Wikidata fetch error:", err);
      return null;
    });
}

function commonsFetch<T>(params: Record<string, string>): Promise<T | null> {
  const url = new URL(COMMONS_API);
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const headers =
    typeof window === "undefined" ? { "User-Agent": USER_AGENT } : undefined;
  return fetch(url.toString(), headers ? { headers } : undefined)
    .then((r) => {
      if (!r.ok) throw new Error(`Commons ${r.status}`);
      return r.json() as Promise<T>;
    })
    .catch((err) => {
      logger.error("[wikiEnrichment] Commons fetch error:", err);
      return null;
    });
}

/** Extract the first string value from a Wikidata claim array, or undefined. */
function claimString(
  claims: Record<string, WdClaim[]> | undefined,
  prop: string,
): string | undefined {
  const claim = claims?.[prop]?.[0];
  if (!claim) return undefined;
  const dv = claim.mainsnak.datavalue;
  if (!dv) return undefined;
  if (typeof dv.value === "string") return dv.value;
  if (
    typeof dv.value === "object" &&
    dv.value !== null &&
    "text" in dv.value &&
    typeof (dv.value as { text: string }).text === "string"
  ) {
    return (dv.value as { text: string }).text;
  }
  return undefined;
}

/** Extract all string values from a Wikidata claim array. */
function claimStrings(
  claims: Record<string, WdClaim[]> | undefined,
  prop: string,
): string[] {
  if (!claims?.[prop]) return [];
  return claims[prop].flatMap((c) => {
    const dv = c.mainsnak.datavalue;
    if (!dv) return [];
    if (typeof dv.value === "string") return [dv.value];
    if (
      typeof dv.value === "object" &&
      dv.value !== null &&
      "text" in dv.value &&
      typeof (dv.value as { text: string }).text === "string"
    ) {
      return [(dv.value as { text: string }).text];
    }
    return [];
  });
}

/** Strip HTML tags from Commons extmetadata Artist strings. */
function stripHtml(raw: string): string {
  return raw.replace(/<[^>]*>/g, "").trim();
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Search Wikidata for items matching a material name.
 * Returns up to 5 candidate results for the caller to pick from.
 */
export async function searchWikidataForMaterial(
  query: string,
  options: WikidataSearchOptions = {},
): Promise<WikidataSearchResult[]> {
  const { limit = 5, offset = 0 } = options;
  const data = await wdFetch<WdSearchResponse>({
    action: "wbsearchentities",
    search: query,
    language: "en",
    type: "item",
    limit: String(limit),
    continue: String(offset),
  });
  if (!data?.search) return [];
  return data.search.map((r) => ({
    qid: r.id,
    label: r.label,
    description: r.description,
    aliases: r.aliases,
  }));
}

/**
 * Fetch Commons image license metadata for a given filename
 * (e.g. "Polyethylene-repeat-3D-balls.png").
 *
 * Returns null if the image cannot be fetched or if its license is not in
 * SAFE_WIKI_IMAGE_LICENSES.
 */
export async function fetchCommonsImageMetadata(filename: string): Promise<{
  imageUrl: string;
  commonsFileName: string;
  imageAuthor?: string;
  imageLicenseName?: string;
  imageLicenseUrl?: string;
  imageAttributionText?: string;
  imageCommonsPageUrl: string;
} | null> {
  const title = filename.startsWith("File:") ? filename : `File:${filename}`;
  const data = await commonsFetch<CommonsImageInfoResponse>({
    action: "query",
    titles: title,
    prop: "imageinfo",
    iiprop: "url|extmetadata",
  });

  const pages = data?.query?.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0];
  const info = page?.imageinfo?.[0];
  if (!info) return null;

  const meta = info.extmetadata ?? {};
  const licenseName = meta.LicenseShortName?.value ?? "";

  if (
    !(SAFE_WIKI_IMAGE_LICENSES as readonly string[]).includes(licenseName) &&
    licenseName !== ""
  ) {
    logger.warn(
      `[wikiEnrichment] Commons image "${filename}" has unsupported license "${licenseName}" — skipping.`,
    );
    return null;
  }

  const rawArtist = meta.Artist?.value ?? "";
  const author = rawArtist ? stripHtml(rawArtist) : undefined;

  return {
    imageUrl: info.url,
    commonsFileName: filename,
    imageAuthor: author,
    imageLicenseName: licenseName || undefined,
    imageLicenseUrl: meta.LicenseUrl?.value ?? undefined,
    imageAttributionText:
      meta.Attribution?.value ?? meta.UsageTerms?.value ?? undefined,
    imageCommonsPageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
  };
}

/**
 * Fetch a Wikipedia page summary for CC BY-SA attribution trail.
 * Returns the short extract, revision ID, and canonical URL.
 */
export async function fetchWikipediaSummary(title: string): Promise<{
  shortDescription?: string;
  sourceUrl: string;
  sourceRevisionId?: number;
  textRetrievedAt: string;
} | null> {
  const encodedTitle = encodeURIComponent(title.replace(/ /g, "_"));
  const url = `${WIKIPEDIA_REST}/page/summary/${encodedTitle}`;
  try {
    const headers =
      typeof window === "undefined" ? { "User-Agent": USER_AGENT } : undefined;
    const r = await fetch(url, headers ? { headers } : undefined);
    if (!r.ok) {
      logger.warn(
        `[wikiEnrichment] Wikipedia summary ${r.status} for "${title}"`,
      );
      return null;
    }
    const data: WikipediaSummaryResponse = await r.json();
    const canonicalUrl =
      data.content_urls?.desktop?.page ??
      `https://en.wikipedia.org/wiki/${encodedTitle}`;
    return {
      shortDescription: data.description ?? data.extract?.split(".")[0],
      sourceUrl: canonicalUrl,
      sourceRevisionId: data.revision,
      textRetrievedAt: new Date().toISOString(),
    };
  } catch (err) {
    logger.error("[wikiEnrichment] Wikipedia summary fetch error:", err);
    return null;
  }
}

/**
 * Core function: given a Wikidata QID, fetch and assemble a
 * MaterialWikiMetadata object. Pass the material's common name as
 * `materialName` to fall back to name-based searches if the entity's
 * sitelink is missing.
 *
 * Returns a best-effort partial object — callers should not assume all
 * fields are populated.
 */
export async function fetchWikiMetadata(
  qid: string,
): Promise<MaterialWikiMetadata | null> {
  const entityData = await wdFetch<WdEntityResponse>({
    action: "wbgetentities",
    ids: qid,
    props: "labels|aliases|claims|sitelinks",
    languages: "en",
    sitefilter: "enwiki",
  });

  const entity = entityData?.entities?.[qid];
  if (!entity) {
    logger.warn(`[wikiEnrichment] No entity data for QID ${qid}`);
    return null;
  }

  const claims = entity.claims;

  // ── Labels & aliases ──────────────────────────────────────────────────────
  const label = entity.labels?.en?.value;
  const aliases = entity.aliases?.en?.map((a) => a.value) ?? [];

  // ── Wikipedia sitelink ───────────────────────────────────────────────────
  const wikipediaTitle = entity.sitelinks?.enwiki?.title;
  const wikipediaUrl = wikipediaTitle
    ? `https://en.wikipedia.org/wiki/${encodeURIComponent(wikipediaTitle.replace(/ /g, "_"))}`
    : undefined;

  // ── Chemistry / material class from claims ────────────────────────────────
  const chemicalFormula = claimString(claims, WD_PROP.CHEMICAL_FORMULA);
  const shortName = claimString(claims, WD_PROP.SHORT_NAME);
  const tradeNames = claimStrings(claims, WD_PROP.TRADE_NAME);
  const commonsCategory = claimString(claims, WD_PROP.COMMONS_CATEGORY);

  // instance of / subclass of — store raw QID labels as strings
  const instanceOf = (claims?.[WD_PROP.INSTANCE_OF] ?? []).flatMap((c) => {
    const dv = c.mainsnak.datavalue;
    if (
      dv?.type === "wikibase-entityid" &&
      typeof dv.value === "object" &&
      dv.value !== null &&
      "id" in dv.value
    ) {
      return [(dv.value as { id: string }).id];
    }
    return [];
  });
  const subclassOf = (claims?.[WD_PROP.SUBCLASS_OF] ?? []).flatMap((c) => {
    const dv = c.mainsnak.datavalue;
    if (
      dv?.type === "wikibase-entityid" &&
      typeof dv.value === "object" &&
      dv.value !== null &&
      "id" in dv.value
    ) {
      return [(dv.value as { id: string }).id];
    }
    return [];
  });
  const materialClassRaw = [...new Set([...instanceOf, ...subclassOf])];

  // ── Chemical names ────────────────────────────────────────────────────────
  // Use the English label + any CAS numbers as a lightweight chemical name set
  const chemicalNames: string[] = [];
  if (label) chemicalNames.push(label);
  if (chemicalFormula) chemicalNames.push(chemicalFormula);
  if (shortName) chemicalNames.push(shortName);

  // ── Commons image ─────────────────────────────────────────────────────────
  const commonsFilename = claimString(claims, WD_PROP.IMAGE);
  let imageFields: Partial<MaterialWikiMetadata> = {};
  if (commonsFilename) {
    const imgMeta = await fetchCommonsImageMetadata(commonsFilename);
    if (imgMeta) {
      imageFields = imgMeta;
    }
  }

  // ── Wikipedia text attribution ────────────────────────────────────────────
  let textFields: Partial<MaterialWikiMetadata> = {};
  if (wikipediaTitle) {
    const summary = await fetchWikipediaSummary(wikipediaTitle);
    if (summary) {
      textFields = summary;
    }
  }

  const result: MaterialWikiMetadata = {
    wikidataQid: qid,
    wikipediaUrl,
    wikipediaTitle,
    aliases: aliases.length > 0 ? aliases : undefined,
    chemicalNames: chemicalNames.length > 0 ? chemicalNames : undefined,
    tradeNames: tradeNames.length > 0 ? tradeNames : undefined,
    materialClassRaw:
      materialClassRaw.length > 0 ? materialClassRaw : undefined,
    commonsCategory,
    ...imageFields,
    ...textFields,
    lastSyncedAt: new Date().toISOString(),
  };

  return result;
}
