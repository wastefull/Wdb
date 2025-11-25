import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Deliverable {
  title: string;
  description: string;
  completed: boolean;
}

interface RoadmapPhaseTabProps {
  phase: string;
  dayNumber: string;
  deliverables: Deliverable[];
  testingView?: ReactNode;
  showTestingToggle?: boolean;
}

export function RoadmapPhaseTab({
  phase,
  dayNumber,
  deliverables,
  testingView,
  showTestingToggle = false,
}: RoadmapPhaseTabProps) {
  const [showTesting, setShowTesting] = useState(false);

  return (
    <div>
      {/* Deliverables Section */}
      <h3 className="font-['Sniglet'] text-[18px] text-black dark:text-white mb-4">
        {phase} - {dayNumber}
      </h3>
      <div className="space-y-4 font-['Sniglet'] text-[12px] text-black/70 dark:text-white/70">
        {deliverables.map((deliverable, index) => (
          <div key={index} className="flex items-start gap-3">
            <div
              className={`w-5 h-5 rounded-full ${
                deliverable.completed
                  ? 'bg-[#c8e5c8] dark:bg-[#c8e5c8]/30'
                  : 'bg-[#e4e3ac] dark:bg-[#e4e3ac]/30'
              } flex items-center justify-center mt-0.5`}
            >
              <span className="text-[10px]">{deliverable.completed ? '✓' : '○'}</span>
            </div>
            <div>
              <div className="font-['Sniglet'] text-[12px] text-black dark:text-white">
                {deliverable.title}
              </div>
              <div className="text-[11px] text-black/60 dark:text-white/60">
                {deliverable.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Testing View Toggle */}
      {showTestingToggle && testingView && (
        <div className="mt-6 border-t border-[#211f1c]/10 dark:border-white/10 pt-6">
          <button
            onClick={() => setShowTesting(!showTesting)}
            className="w-full flex items-center justify-between p-4 bg-[#bae1ff]/20 dark:bg-[#bae1ff]/10 rounded-lg border border-[#211f1c]/10 dark:border-white/10 hover:bg-[#bae1ff]/30 dark:hover:bg-[#bae1ff]/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-[18px]">🧪</span>
              <div className="text-left">
                <div className="font-['Sniglet'] text-[14px] text-black dark:text-white">
                  Testing View
                </div>
                <div className="font-['Sniglet'] text-[11px] text-black/60 dark:text-white/60">
                  {showTesting ? 'Hide' : 'Show'} test scenarios and verification checklist
                </div>
              </div>
            </div>
            {showTesting ? (
              <ChevronUp size={20} className="text-black dark:text-white" />
            ) : (
              <ChevronDown size={20} className="text-black dark:text-white" />
            )}
          </button>

          {/* Testing View Content */}
          {showTesting && (
            <div className="mt-4 p-4 bg-white dark:bg-[#1a1917] rounded-lg border border-[#211f1c]/10 dark:border-white/10">
              {testingView}
            </div>
          )}
        </div>
      )}
    </div>
  );
}