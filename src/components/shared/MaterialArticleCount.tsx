interface MaterialArticleCountProps {
  totalArticles: number;
}

export function MaterialArticleCount({
  totalArticles,
}: MaterialArticleCountProps) {
  return (
    <p className="text-sm text-black/60 ">
      {totalArticles} article{totalArticles !== 1 ? "s" : ""}
    </p>
  );
}
