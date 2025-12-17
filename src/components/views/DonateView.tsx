import React from "react";
import { Heart, Github, Leaf, Database } from "lucide-react";
import { PageTemplate } from "../shared/PageTemplate";

interface DonateViewProps {
  onBack: () => void;
}

export function DonateView({ onBack }: DonateViewProps) {
  const projects = [
    {
      id: "wastedb",
      title: "WasteDB Platform",
      description:
        "Support the development and maintenance of the WasteDB platform, including server costs, data infrastructure, and new features.",
      icon: Database,
      iconClass: "arcade-bg-cyan arcade-btn-cyan",
      link: "#", // TODO: Add actual donation link
    },
    {
      id: "open-source",
      title: "Open Source Tools",
      description:
        "Help us build and maintain open source tools for waste data analysis, visualization, and research collaboration.",
      icon: Github,
      iconClass: "arcade-bg-amber arcade-btn-amber",
      link: "#", // TODO: Add actual donation link
    },
    {
      id: "sustainability",
      title: "Sustainability Research",
      description:
        "Fund research initiatives focused on waste reduction, circular economy, and sustainable material management.",
      icon: Leaf,
      iconClass: "arcade-bg-green arcade-btn-green",
      link: "#", // TODO: Add actual donation link
    },
  ];

  return (
    <PageTemplate
      title="Support WasteDB"
      description="Help us keep WasteDB free and accessible to everyone"
      onBack={onBack}
    >
      <div className="max-w-4xl mx-auto">
        {/* Intro */}
        <div className="mb-8 text-center">
          <p className="text-[14px] text-black/70 dark:text-white/70 leading-relaxed">
            WasteDB is a community-driven, open source project. Your support
            helps us maintain the platform, develop new features, and keep all
            data freely accessible.
          </p>
        </div>

        {/* Project Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {projects.map((project) => {
            const Icon = project.icon;
            return (
              <div
                key={project.id}
                className="retro-card p-6 flex flex-col items-center text-center"
              >
                <div className={`icon-box mb-4 ${project.iconClass}`}>
                  <Icon size={32} />
                </div>
                <h3 className="text-[16px] font-display text-black dark:text-white mb-3">
                  {project.title}
                </h3>
                <p className="text-[12px] text-black/60 dark:text-white/60 leading-relaxed mb-4 flex-1">
                  {project.description}
                </p>
                <button
                  className="retro-btn-primary w-full px-4 py-2 bg-waste-science hover:bg-waste-science/80 text-black text-[12px]"
                  onClick={() => {
                    // TODO: Integrate with actual donation system
                    console.log("Donate to:", project.id);
                  }}
                >
                  <Heart size={14} className="inline-block mr-2" />
                  Donate
                </button>
              </div>
            );
          })}
        </div>

        {/* Other Ways to Help */}
        <div className="retro-card p-6">
          <h3 className="text-[16px] font-display text-black dark:text-white mb-4 text-center">
            Other Ways to Help
          </h3>
          <div className="space-y-3 text-[13px] text-black/70 dark:text-white/70">
            <div className="flex items-start gap-3">
              <span className="text-[18px]">📚</span>
              <p>
                <strong>Contribute Data:</strong> Share research, articles, or
                case studies about waste management
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[18px]">💻</span>
              <p>
                <strong>Contribute Code:</strong> Help develop new features or
                fix bugs on GitHub
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[18px]">📢</span>
              <p>
                <strong>Spread the Word:</strong> Share WasteDB with
                researchers, educators, and sustainability advocates
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[18px]">✅</span>
              <p>
                <strong>Review Content:</strong> Help verify and improve the
                quality of submitted data
              </p>
            </div>
          </div>
        </div>

        {/* Thank You */}
        <div className="mt-8 p-4 border border-[#211f1c]/20 dark:border-white/20 rounded-lg text-center">
          <p className="text-[13px] text-black/60 dark:text-white/60">
            <Heart size={16} className="inline-block mr-2" />
            Thank you for supporting open, accessible environmental data!
          </p>
        </div>
      </div>
    </PageTemplate>
  );
}
