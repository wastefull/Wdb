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
  inline: "inline-flex align-middle",
};

export function MaterialDoodle({
  materialId,
  materialName,
  alt,
  className,
  variant = "sidebar",
}: MaterialDoodleProps) {
  const doodle = getMaterialDoodle(materialId, materialName);
  if (!doodle) return null;

  const imageAlt = alt ?? doodle.alt ?? "";

  return (
    <figure
      className={cn("material-doodle", variantClassNames[variant], className)}
    >
      <img
        src={doodle.publicUrl}
        alt={imageAlt}
        loading="lazy"
        decoding="async"
        className="max-h-40 w-auto max-w-full object-contain"
      />
    </figure>
  );
}
