import { Material } from "../types/material";

const MATERIAL_PERMALINK_PREFIX = "/m/";

export interface ParsedMaterialPermalink {
  slug: string;
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

export function parseMaterialPermalinkPath(
  pathname: string,
): ParsedMaterialPermalink | null {
  if (!pathname.startsWith(MATERIAL_PERMALINK_PREFIX)) {
    return null;
  }

  const slug = pathname
    .slice(MATERIAL_PERMALINK_PREFIX.length)
    .replace(/^\/+|\/+$/g, "")
    .trim();

  if (!slug) {
    return null;
  }

  return {
    slug: decodeURIComponent(slug),
  };
}

export function findMaterialByPermalink(
  materials: Material[],
  permalink: ParsedMaterialPermalink,
): Material | null {
  return (
    materials.find(
      (material) => slugifyMaterialName(material.name) === permalink.slug,
    ) || null
  );
}
