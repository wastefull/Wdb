import { projectId } from "../utils/supabase/info";
import { slugifyMaterialName } from "../utils/permalinks";

const MATERIAL_DOODLE_BUCKET = "make-17cae920-assets";
const MATERIAL_DOODLE_PREFIX = "material-doodles";

export interface MaterialDoodle {
  materialId: string;
  imageFile: string;
  alt?: string;
  publicUrl: string;
}

type MaterialDoodleManifestEntry = {
  imageFile: string;
  alt?: string;
};

const encodeStoragePath = (path: string) =>
  path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

export const buildMaterialDoodlePublicUrl = (imageFile: string) => {
  const storagePath = imageFile.startsWith(`${MATERIAL_DOODLE_PREFIX}/`)
    ? imageFile
    : `${MATERIAL_DOODLE_PREFIX}/${imageFile}`;

  return `https://${projectId}.supabase.co/storage/v1/object/public/${MATERIAL_DOODLE_BUCKET}/${encodeStoragePath(
    storagePath,
  )}`;
};

export const MATERIAL_DOODLES: Record<string, MaterialDoodleManifestEntry> = {
  // Add generated Excel/CSV mappings here:
  // "material-id": { imageFile: "material-id.webp", alt: "Doodle of material name" },
  // Prefixed paths copied from admin also work: "material-doodles/material-id.webp"
  "3d-printing-filament": {
    imageFile: "material-doodles/image1-1782251808325.png",
    alt: "Line drawing of a spool of 3D printing filament",
  },
};

export function getMaterialDoodle(
  materialId: string,
  materialName?: string,
): MaterialDoodle | undefined {
  const lookupKey =
    MATERIAL_DOODLES[materialId] || !materialName
      ? materialId
      : slugifyMaterialName(materialName);
  const entry = MATERIAL_DOODLES[lookupKey];
  if (!entry) return undefined;

  return {
    materialId: lookupKey,
    ...entry,
    publicUrl: buildMaterialDoodlePublicUrl(entry.imageFile),
  };
}
