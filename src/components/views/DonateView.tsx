import { Heart } from "lucide-react";
import { PageTemplate } from "../shared/PageTemplate";
import { projects } from "./viewdata/donationPageProjects";
interface DonateViewProps {
  onBack: () => void;
}

export function DonateView({ onBack }: DonateViewProps) {
  return (
    <PageTemplate
      title="Support our Mission"
      description="Your money. Your choice."
      onBack={onBack}
    >
      <div className="donation-page">
        {/* Intro */}
        <div className="donation-intro">
          <p className="mb-4">
            Wastefull is a nonprofit, nonpolitical organization dedicated to
            open research and free educational resources.
          </p>
          <p>
            We're your organization, and you have a say in where every penny you
            contribute actually goes.
          </p>
        </div>

        {/* Project Cards */}
        <div className="project-grid">
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
        <div className="retro-card donation-thank-you text-center mb-8">
          <strong>
            Every dollar means so much to us. Thank you for considering
            supporting our mission.
          </strong>
          <br />
          While we hope to do this full-time in the distant future, no one is
          getting paid to work here, but research and development require money.
        </div>

        {/* Footer Note */}
        <div className="donation-footer text-center">
          Wastefull, Inc. is a registered California 501(c)(3) nonprofit
          organization. Donations to the organization may be tax deductible.
        </div>
      </div>
    </PageTemplate>
  );
}
