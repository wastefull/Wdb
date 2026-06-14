export function Loading({ what }: { what?: string }) {
  return (
    <>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#211f1c] dark:border-white/60 border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-[#211f1c]/60 dark:text-white/50">
            Loading {what}…
          </p>
        </div>
      </div>
    </>
  );
}
