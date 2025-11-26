import React from "react";
import { FileUp, Download, Code } from "lucide-react";
import { PageTemplate } from "../shared/PageTemplate";

interface ScienceHubViewProps {
  onBack: () => void;
  onNavigateToWhitePapers: () => void;
  onNavigateToOpenAccess: () => void;
  onNavigateToAPI: () => void;
}

export function ScienceHubView({
  onBack,
  onNavigateToWhitePapers,
  onNavigateToOpenAccess,
  onNavigateToAPI,
}: ScienceHubViewProps) {
  const scienceResources = [
    {
      id: "whitepapers",
      title: "White Papers",
      description: "Browse peer-reviewed research and methodology documents",
      icon: FileUp,
      iconClass: "arcade-bg-amber arcade-btn-amber",
      onClick: onNavigateToWhitePapers,
      label: "Browse Papers",
    },
    {
      id: "openaccess",
      title: "Open Access",
      description: "Export and download WasteDB materials data for research",
      icon: Download,
      iconClass: "arcade-bg-cyan arcade-btn-cyan",
      onClick: onNavigateToOpenAccess,
      label: "Export Data",
    },
    {
      id: "api",
      title: "API Documentation",
      description: "Programmatic access to WasteDB data and services",
      icon: Code,
      iconClass: "arcade-bg-red arcade-btn-red",
      onClick: onNavigateToAPI,
      label: "View Docs",
    },
  ];

  return (
    <PageTemplate
      title="Science"
      description="Research tools and data access for scientific collaboration"
      onBack={onBack}
    >
      <div className="grid grid-cols-1 gap-4">
        {scienceResources.map((resource) => {
          const Icon = resource.icon;
          return (
            <button
              key={resource.id}
              onClick={resource.onClick}
              className="bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 p-6 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] transition-all text-left"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-md border border-[#211f1c] dark:border-white/20 ${resource.iconClass}`}
                >
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-[16px] text-black dark:text-white mb-2">
                    {resource.title}
                  </h3>
                  <p className="text-[12px] text-black/60 dark:text-white/60 mb-2">
                    {resource.description}
                  </p>
                  <span className="tag-yellow">{resource.label}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </PageTemplate>
  );
}
