import { Material } from "../types/material";

const MATERIAL_PERMALINK_PREFIX = "/m/";

export interface ParsedMaterialPermalink {
  slug: string;
  articleId?: string;
}

export function slugifyMaterialName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function buildMaterialPermalinkPath(
  material: Pick<Material, "id" | "name">,
): string {
  const slug = slugifyMaterialName(material.name) || "material";
  return `${MATERIAL_PERMALINK_PREFIX}${slug}`;
}

export function buildMaterialArticlePermalinkPath(
  material: Pick<Material, "id" | "name">,
  articleId: string,
): string {
  const base = buildMaterialPermalinkPath(material);
  return `${base}/${encodeURIComponent(articleId)}`;
}

export function parseMaterialPermalinkPath(
  pathname: string,
): ParsedMaterialPermalink | null {
  if (!pathname.startsWith(MATERIAL_PERMALINK_PREFIX)) {
    return null;
  }

  const segments = pathname
    .slice(MATERIAL_PERMALINK_PREFIX.length)
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean)
    .map((s) => decodeURIComponent(s).trim());

  const slug = segments[0];

  if (!slug) {
    return null;
  }

  const articleSegment = segments[1];

  let articleId: string | undefined;
  if (articleSegment) {
    // Support either plain IDs ("123") or human-readable forms
    // like "some-article-title--123".
    const compact = articleSegment.trim();
    const readableMatch = compact.match(/--([^/]+)$/);
    articleId = readableMatch?.[1] || compact;
  }

  return {
    slug,
    articleId,
  };
}

export function findMaterialByPermalink(
  materials: Material[],
  permalink: ParsedMaterialPermalink,
): Material | null {
  // Prefer exact current-name slug match.
  const directMatches = materials.filter(
    (material) => slugifyMaterialName(material.name) === permalink.slug,
  );

  if (directMatches.length === 1) {
    return directMatches[0];
  }

  // If multiple materials share the same canonical slug, do not guess.
  if (directMatches.length > 1) {
    return null;
  }

  // Backward-compat: fall back to curator/wiki aliases so renamed materials
  // can still be resolved and then redirected to their canonical permalink.
  const aliasMatches = materials.filter((material) => {
    const aliases = [
      ...(material.aliases || []),
      ...(material.wiki?.aliases || []),
    ];
    return aliases.some(
      (alias) => slugifyMaterialName(alias) === permalink.slug,
    );
  });

  // Collision-safe behavior: only resolve aliases when the match is unique.
  if (aliasMatches.length === 1) {
    return aliasMatches[0];
  }

  return null;
}

/**
 * Returns every material whose current name slug OR alias slug matches.
 * Used to present a disambiguation picker when the slug is ambiguous.
 */
export function findMaterialCandidatesByPermalink(
  materials: Material[],
  permalink: ParsedMaterialPermalink,
): Material[] {
  return materials.filter((material) => {
    if (slugifyMaterialName(material.name) === permalink.slug) return true;
    const aliases = [
      ...(material.aliases || []),
      ...(material.wiki?.aliases || []),
    ];
    return aliases.some(
      (alias) => slugifyMaterialName(alias) === permalink.slug,
    );
  });
}
