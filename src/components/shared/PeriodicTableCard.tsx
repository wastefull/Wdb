import { ExternalLink } from "lucide-react";

interface PeriodicTableCardProps {
  isElementHub: boolean;
}

export function PeriodicTableCard({ isElementHub }: PeriodicTableCardProps) {
  return (
    <div className="periodic-table">
      {isElementHub && (
        <div className="element-nav">
          <div>
            <p>Element Navigation</p>
            <a
              href="https://wastefull.org/pt"
              target="_blank"
              rel="noopener noreferrer"
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
