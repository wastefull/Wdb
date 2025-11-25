import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { TransformVersionManager } from "../evidence/TransformVersionManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface MathViewProps {
  onBack: () => void;
  defaultTab?: "overview" | "transform-manager";
}

export function MathView({ onBack, defaultTab = "overview" }: MathViewProps) {
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
            Math Tools
          </h2>
          <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/60 dark:text-white/60">
            Mathematical operations and utilities
          </p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transform-manager">
            Transform Version Manager
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="bg-white dark:bg-[#1a1917] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] p-6">
            <div className="text-center py-12">
              <div className="text-[48px] mb-4">∫</div>
              <h3 className="font-['Fredoka_One:Regular',_sans-serif] text-[18px] text-black dark:text-white mb-2">
                Math Tools Coming Soon
              </h3>
              <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/60 dark:text-white/60">
                This section will contain mathematical utilities, formula
                editors, and computational tools.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transform-manager">
          <div className="bg-white dark:bg-[#1a1917] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] p-6">
            <TransformVersionManager />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
