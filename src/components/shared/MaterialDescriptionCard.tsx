interface MaterialDescriptionCardProps {
  description: string;
}

export function MaterialDescriptionCard({
  description,
}: MaterialDescriptionCardProps) {
  return (
    <div className="rounded-[11.464px] border-[1.5px] border-accent leading-tight p-2 pl-4 pt-4 xl:pr-10 mb-6">
      <p className="text-normal text-black/80">{description}</p>
    </div>
  );
}
