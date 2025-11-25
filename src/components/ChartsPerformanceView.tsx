import { ArrowLeft } from 'lucide-react';
import { ChartRasterizationDemo } from './ChartRasterizationDemo';

interface ChartsPerformanceViewProps {
  onBack: () => void;
}

export function ChartsPerformanceView({ onBack }: ChartsPerformanceViewProps) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 bg-[#b8c8cb] rounded-md border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all"
        >
          <ArrowLeft size={16} className="text-black" />
        </button>
        <div className="flex-1">
          <h2 className="font-['Fredoka_One:Regular',_sans-serif] text-[24px] text-black dark:text-white">
            Charts Performance
          </h2>
          <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/60 dark:text-white/60">
            Chart rendering and rasterization testing
          </p>
        </div>
      </div>

      <ChartRasterizationDemo />
    </div>
  );
}
