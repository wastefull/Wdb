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
        <button onClick={onBack} className="card-interactive">
          <ArrowLeft size={16} className="text-black" />
        </button>
        <div className="flex-1">
          <h2 className="normal">Math Tools</h2>
          <p className="muted">Mathematical operations and utilities</p>
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
          <div className="reversed p-6">
            <div className="text-center py-12">
              <div className="text-[48px] mb-4">∫</div>
              <h3 className="text-[18px] normal mb-2">
                Math Tools Coming Soon
              </h3>
              <p className="text-[12px] text-black/60 dark:text-white/60">
                This section will contain mathematical utilities, formula
                editors, and computational tools.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transform-manager">
          <div className="reversed p-6">
            <TransformVersionManager />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
