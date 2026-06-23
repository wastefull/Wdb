import { useState } from "react";
import { getMaterialDoodle } from "../../config/materialDoodles";
import { cn } from "../ui/utils";

type MaterialDoodleVariant = "sidebar" | "inline";

interface MaterialDoodleProps {
  materialId: string;
  materialName?: string;
  alt?: string;
  className?: string;
  variant?: MaterialDoodleVariant;
}

const variantClassNames: Record<MaterialDoodleVariant, string> = {
  sidebar: "mb-2 flex justify-center",
  inline: "flex items-center justify-center",
};

export function MaterialDoodle({
  materialId,
  materialName,
  alt,
  className,
  variant = "sidebar",
}: MaterialDoodleProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const doodle = getMaterialDoodle(materialId, materialName);
  if (!doodle || hasImageError) return null;

  const imageAlt = doodle.alt ?? alt ?? "";

  return (
    <figure
      className={cn("material-doodle", variantClassNames[variant], className)}
    >
      <img
        src={doodle.publicUrl}
        alt={imageAlt}
        loading="lazy"
        decoding="async"
        onError={() => setHasImageError(true)}
        className="max-h-40 w-auto max-w-full object-contain"
      />
    </figure>
  );
}
