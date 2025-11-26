import { ArrowLeft } from "lucide-react";
import { ChartRasterizationDemo } from "../charts/ChartRasterizationDemo";

interface ChartsPerformanceViewProps {
  onBack: () => void;
}

export function ChartsPerformanceView({ onBack }: ChartsPerformanceViewProps) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="card-interactive"
        >
          <ArrowLeft size={16} className="text-black" />
        </button>
        <div className="flex-1">
          <h2 className="font-['Fredoka_One:Regular',_sans-serif] text-[24px] text-black dark:text-white">
            Charts Performance
          </h2>
          <p className="text-[12px] text-black/60 dark:text-white/60">
            Chart rendering and rasterization testing
          </p>
        </div>
      </div>

      <ChartRasterizationDemo />
    </div>
  );
}
