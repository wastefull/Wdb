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
      iconBg: "#e6beb5",
      onClick: onNavigateToTakedownForm,
      label: "Submit Request",
    },
    {
      id: "licenses",
      title: "Open Source Licenses",
      description: "View all open source software licenses used in WasteDB",
      icon: FileText,
      iconBg: "#b8c8cb",
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
              className="bg-white dark:bg-[#2a2825] rounded-[11.464px] border-[1.5px] border-[#211f1c] dark:border-white/20 p-6 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] hover:translate-y-[1px] hover:shadow-[2px_3px_0px_-1px_#000000] dark:hover:shadow-[2px_3px_0px_-1px_rgba(255,255,255,0.2)] transition-all text-left"
            >
              <div className="flex items-start gap-4">
                <div
                  className="p-3 rounded-md border border-[#211f1c] dark:border-white/20"
                  style={{ backgroundColor: resource.iconBg }}
                >
                  <Icon size={24} className="text-black" />
                </div>
                <div className="flex-1">
                  <h3 className="font-['Sniglet:Regular',_sans-serif] text-[16px] text-black dark:text-white mb-2">
                    {resource.title}
                  </h3>
                  <p className="font-['Sniglet:Regular',_sans-serif] text-[12px] text-black/60 dark:text-white/60 mb-2">
                    {resource.description}
                  </p>
                  <span className="inline-block px-2 py-0.5 bg-[#e4e3ac] rounded-md border border-[#211f1c] dark:border-white/20 font-['Sniglet:Regular',_sans-serif] text-[9px] text-black">
                    {resource.label}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </PageTemplate>
  );
}
