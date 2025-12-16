import React from "react";
import { AlertCircle, Scale, FileText } from "lucide-react";
import { PageTemplate } from "../shared/PageTemplate";

interface LegalHubViewProps {
  onBack: () => void;
  onNavigateToTakedownForm: () => void;
  onNavigateToLicenses: () => void;
}

export function LegalHubView({
  onBack,
  onNavigateToTakedownForm,
  onNavigateToLicenses,
}: LegalHubViewProps) {
  const legalResources = [
    {
      id: "takedown",
      title: "Content Takedown Request",
      description: "Submit a request to remove or correct content in WasteDB",
      icon: AlertCircle,
      iconClass: "arcade-bg-red arcade-btn-red",
      onClick: onNavigateToTakedownForm,
      label: "Submit Request",
    },
    {
      id: "licenses",
      title: "Open Source Licenses",
      description: "View all open source software licenses used in WasteDB",
      icon: FileText,
      iconClass: "arcade-bg-cyan arcade-btn-cyan",
      onClick: onNavigateToLicenses,
      label: "View Licenses",
    },
  ];

  return (
    <PageTemplate
      title="Legal & Compliance"
      description="Legal resources and compliance information for WasteDB"
      onBack={onBack}
    >
      <div className="grid grid-cols-1 gap-4">
        {legalResources.map((resource) => {
          const Icon = resource.icon;
          return (
            <button
              key={resource.id}
              onClick={resource.onClick}
              className="retro-card-button p-6 text-left"
            >
              <div className="flex items-start gap-4">
                <div className={`icon-box ${resource.iconClass}`}>
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-[16px] normal mb-2">{resource.title}</h3>
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
