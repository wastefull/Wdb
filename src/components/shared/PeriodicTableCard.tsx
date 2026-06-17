import { ExternalLink } from "lucide-react";

interface PeriodicTableCardProps {
  isElementHub: boolean;
}

export function PeriodicTableCard({
  isElementHub,
}: PeriodicTableCardProps) {
  return (
    <div className="mb-6 flex items-center gap-4">
      {isElementHub && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] uppercase tracking-[0.08em] text-black/60 dark:text-white/60">
              Element Navigation
            </p>
            <a
              href="https://wastefull.org/pt"
              target="_blank"
              rel="noopener noreferrer"
              className="retro-btn-primary inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 bg-white"
            >
              Find in periodic table
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
