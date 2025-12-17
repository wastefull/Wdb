import React from "react";
import { Info, Target, Users, Heart } from "lucide-react";
import { PageTemplate } from "../shared/PageTemplate";

interface AboutViewProps {
  onBack: () => void;
}

export function AboutView({ onBack }: AboutViewProps) {
  return (
    <PageTemplate
      title="About WasteDB"
      description="Learn about our mission to make waste management data accessible to everyone"
      onBack={onBack}
    >
      <div className="space-y-6">
        {/* Mission */}
        <div className="retro-card p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="icon-box arcade-bg-green arcade-btn-green">
              <Target size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-[18px] font-display text-black dark:text-white mb-2">
                Our Mission
              </h3>
              <p className="text-[13px] text-black/70 dark:text-white/70 leading-relaxed">
                WasteDB is dedicated to making waste management data accessible,
                transparent, and actionable. We believe that better data leads
                to better decisions, which ultimately leads to a more
                sustainable future.
              </p>
            </div>
          </div>
        </div>

        {/* What We Do */}
        <div className="retro-card p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="icon-box arcade-bg-cyan arcade-btn-cyan">
              <Info size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-[18px] font-display text-black dark:text-white mb-2">
                What We Do
              </h3>
              <p className="text-[13px] text-black/70 dark:text-white/70 leading-relaxed mb-3">
                We aggregate scientific research, industry data, and community
                knowledge about waste management methods for different
                materials. Our platform helps researchers, policymakers,
                businesses, and individuals find evidence-based information
                about:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[13px] text-black/70 dark:text-white/70">
                <li>Material recyclability and circularity potential</li>
                <li>Composting methods and best practices</li>
                <li>Reuse and upcycling opportunities</li>
                <li>Scientific research on waste reduction</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Community */}
        <div className="retro-card p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="icon-box arcade-bg-amber arcade-btn-amber">
              <Users size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-[18px] font-display text-black dark:text-white mb-2">
                Community-Driven
              </h3>
              <p className="text-[13px] text-black/70 dark:text-white/70 leading-relaxed">
                WasteDB is built by and for the community. We welcome
                contributions from researchers, waste management professionals,
                and anyone passionate about sustainability. All data is
                peer-reviewed and cite-checked to maintain quality and accuracy.
              </p>
            </div>
          </div>
        </div>

        {/* Open Source */}
        <div className="retro-card p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="icon-box arcade-bg-red arcade-btn-red">
              <Heart size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-[18px] font-display text-black dark:text-white mb-2">
                Open Source & Free
              </h3>
              <p className="text-[13px] text-black/70 dark:text-white/70 leading-relaxed">
                WasteDB is completely free and open source. We believe that
                environmental data should be a public good, accessible to
                everyone without barriers. Our code is available on GitHub, and
                we welcome contributions from developers worldwide.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 p-4 border border-[#211f1c]/20 dark:border-white/20 rounded-lg">
          <p className="text-[12px] text-black/60 dark:text-white/60 text-center">
            Have questions or want to get involved? Check out our{" "}
            <button className="underline hover:text-black dark:hover:text-white">
              GitHub repository
            </button>{" "}
            or reach out to the community.
          </p>
        </div>
      </div>
    </PageTemplate>
  );
}
