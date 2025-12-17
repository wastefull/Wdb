import React from "react";
import { Heart, Megaphone, FlaskConical, Server } from "lucide-react";
import { PageTemplate } from "../shared/PageTemplate";

interface DonateViewProps {
  onBack: () => void;
}

export function DonateView({ onBack }: DonateViewProps) {
  const projects = [
    {
      id: "visibility",
      title: "Visibility & Integrity Drive",
      description:
        "Help us advertise! Our research and educational resources are only as useful as the public's awareness of them.",
      icon: Megaphone,
      iconClass: "arcade-bg-amber arcade-btn-amber",
      link: "https://www.zeffy.com/donation-form/visibility-and-integrity-drive",
    },
    {
      id: "research",
      title: "Research Fund",
      description:
        "Contribute directly to our compost and recycling research. The biggest bill here is testing consumer products for things like microplastics, which has do be done at specialty labs.",
      icon: FlaskConical,
      iconClass: "arcade-bg-green arcade-btn-green",
      link: "https://www.zeffy.com/donation-form/research-fund",
    },
    {
      id: "digital",
      title: "Digital Foundations Fund",
      description:
        "Developing tools like the WasteDB and educational materials for the public is a critical part of our mission, and while our staff are volunteers, hosting and tooling are not free.",
      icon: Server,
      iconClass: "arcade-bg-cyan arcade-btn-cyan",
      link: "https://www.zeffy.com/donation-form/donate-to-make-a-difference-11641",
    },
  ];

  return (
    <PageTemplate
      title="Support our Mission"
      description="Your money. Your choice."
      onBack={onBack}
    >
      <div className="max-w-4xl mx-auto">
        {/* Intro */}
        <div className="mb-8 text-center">
          <p className="text-[14px] text-black/70 dark:text-white/70 leading-relaxed mb-4">
            Wastefull is a nonprofit, nonpolitical organization dedicated to
            open research and free educational resources.
          </p>
          <p className="text-[14px] text-black/70 dark:text-white/70 leading-relaxed">
            We're your organization, and you have a say in where every penny you
            contribute actually goes.
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
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="retro-btn-primary w-full px-4 py-2 bg-waste-science hover:bg-waste-science/80 text-black text-[12px] text-center"
                >
                  <Heart size={14} className="inline-block mr-2" />
                  Donate
                </a>
              </div>
            );
          })}
        </div>

        {/* Thank You Message */}
        <div className="retro-card p-6 text-center mb-8">
          <p className="text-[15px] text-black/70 dark:text-white/70 leading-relaxed">
            Every dollar means so much to us. Thank you for considering
            supporting our mission. <br />
            While we hope to do this full-time in the distant future, no one is
            getting paid to work here, but research and development require
            money.
          </p>
        </div>

        {/* Footer Note */}
        <div className="p-4 border border-[#211f1c]/20 dark:border-white/20 rounded-lg text-center">
          <p className="text-[12px] text-black/60 dark:text-white/60">
            Wastefull, Inc. is a registered California 501(c)(3) nonprofit
            organization. Donations to the organization may be tax deductible.
          </p>
        </div>
      </div>
    </PageTemplate>
  );
}
