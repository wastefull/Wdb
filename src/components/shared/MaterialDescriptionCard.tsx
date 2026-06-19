interface MaterialDescriptionCardProps {
  description: string;
  category?: string;
  aliases?: string[];
  onViewCategory?: () => void;
}

export function MaterialDescriptionCard({
  description,
  category,
  aliases = [],
  onViewCategory,
}: MaterialDescriptionCardProps) {
  return (
    <div className="material-description-card">
      <p>Description</p>
      <p>{description}</p>
      {(category || aliases.length > 0) && (
        <dl>
          {category && (
            <div>
              <dt>Category</dt>
              <dd>
                {onViewCategory ? (
                  <button
                    type="button"
                    onClick={onViewCategory}
                    className="underline hover:no-underline"
                  >
                    {category}
                  </button>
                ) : (
                  category
                )}
              </dd>
            </div>
          )}
          {aliases.length > 0 && (
            <div>
              <dt>Also called</dt>
              <dd>{aliases.join(", ")}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
