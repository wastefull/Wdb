import React from "react";
import { Info, Target, Users, Heart } from "lucide-react";
import { PageTemplate } from "../shared/PageTemplate";
import { useAccessibility } from "../shared/AccessibilityContext";

interface AboutViewProps {
  onBack: () => void;
}

export function AboutView({ onBack }: AboutViewProps) {
  const { settings } = useAccessibility();

  return (
    <PageTemplate
      title="Wastefull, Inc."
      description="Learn about our mission to make waste management data accessible to everyone"
      onBack={onBack}
    >
      <div className="space-y-6">
        {/* Mission */}
        <div className="retro-card p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-1">
              <h3 className="text-[18px] font-display text-black dark:text-white mb-2">
                Our Mission
              </h3>
              <div className="mb-4 flex justify-center">
                <img
                  src={
                    settings.darkMode
                      ? "https://bdvfwjmaufjeqmxphmtv.supabase.co/storage/v1/object/public/make-17cae920-assets/logo_darkmode-1763068549938.png"
                      : "https://bdvfwjmaufjeqmxphmtv.supabase.co/storage/v1/object/public/make-17cae920-assets/uplogo_transparent-1761169051994.png"
                  }
                  alt="Wastefull Logo"
                  className={
                    settings.darkMode
                      ? "h-44 lg:h-56 w-auto"
                      : "h-32 lg:h-44 w-auto"
                  }
                />
              </div>
              <p className="text-[13px] text-black/70 dark:text-white/70 leading-relaxed">
                Wastefull is about reminding those of us who are bogged down by
                shame and overwhelm that there are tangible, small things we can
                do to fight back against systems that want us to numb out and
                tap out. By making waste management data accessible to everyone,
                we empower individuals and organizations to make informed
                decisions that reduce waste and promote sustainability.
              </p>{" "}
              <p>&nbsp;</p>
              <p className="text-[13px] text-black/70 dark:text-white/70 leading-relaxed mt-2">
                By fostering a culture of responsibility and innovation, we aim
                to inspire individuals and organizations to take meaningful
                actions that contribute to a more sustainable future.
              </p>
            </div>
          </div>
        </div>
        {/* Philosophy */}
        <div className="retro-card p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-1">
              <h3 className="text-[18px] font-display text-black dark:text-white mb-2">
                Waste is Opportunity
              </h3>
              <p className="text-[13px] text-black/70 dark:text-white/70 leading-relaxed">
                A “wastefull” philosophy embraces waste not just as an
                unfortunate side effect of production and survival, but as a
                resource we can leverage to build stronger communities and
                circular economies.
              </p>{" "}
              <p>&nbsp;</p>
              <p className="text-[13px] text-black/70 dark:text-white/70 leading-relaxed mt-2">
                By understanding the true cost of waste and recognizing its
                potential value, we can shift our mindset from one of scarcity
                to one of abundance—where waste becomes a source of innovation,
                creativity, and positive change.
              </p>
            </div>
          </div>
        </div>

        {/* WasteDB */}
        <div className="retro-card p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-1">
              <h3 className="text-[18px] font-display text-black dark:text-white mb-2">
                WasteDB
              </h3>
              <p className="text-[13px] text-black/70 dark:text-white/70 leading-relaxed mb-3">
                WasteDB is a platform that aggregates scientific research,
                industry data, and community knowledge about waste management
                methods for different materials. Our platform helps researchers,
                policymakers, businesses, and individuals find evidence-based
                information about:
              </p>{" "}
              <p>&nbsp;</p>
              <ul className="list-disc list-inside space-y-2 text-[13px] text-black/70 dark:text-white/70">
                <li>Material recyclability and circularity potential</li>
                <li>Composting methods and best practices</li>
                <li>Reuse and upcycling opportunities</li>
                <li>Scientific research on waste reduction</li>
              </ul>{" "}
              <p>&nbsp;</p>
              <p className="text-[13px] text-black/70 dark:text-white/70 leading-relaxed mt-3">
                This project is under active daily development. If you have
                ideas, feedback, or would like to contribute, please visit our
                GitHub repository or contact us at{" "}
                <a href="mailto:ideas@wastefull.org">ideas@wastefull.org</a>.
              </p>
            </div>
          </div>
        </div>
        {/* Our Values */}
        <div className="text-center">
          <h1>Values</h1>
        </div>
        {/* Non-profit */}
        <div className="retro-card p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="icon-box arcade-bg-blue arcade-btn-blue">
              <Info size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-[18px] font-display text-black dark:text-white mb-2">
                Non-Profit Mission
              </h3>
              <p className="text-[13px] text-black/70 dark:text-white/70 leading-relaxed">
                Wastefull, Inc. is a registered 501(c)(3) non-profit
                organization dedicated to promoting sustainable waste management
                practices through open access to data, public education, and
                community engagement. Our mission is to empower individuals and
                organizations with the knowledge they need to make informed
                decisions that reduce waste and protect the environment.
              </p>
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
                Collaborative research fosters innovation by bringing together
                diverse perspectives and tools. This collective intelligence
                enables lateral thinking, where unconventional solutions arise
                from different experiences and expertise. When regular people
                engage in community-driven initiatives and open-source projects,
                they can create impactful changes that challenge the status quo
                without requiring massive investments, because resources and
                effort can be pooled. Empowering individuals through education
                and collaboration not only democratizes knowledge but also
                builds resilient networks capable of addressing environmental
                challenges in novel and effective ways.{" "}
              </p>
              <p>&nbsp;</p>
              <p className="text-[13px] text-black/70 dark:text-white/70 leading-relaxed">
                This is why WasteDB is built by and for the community. We
                welcome contributions from researchers, waste management
                professionals, and anyone passionate about sustainability. All
                data is peer-reviewed and cite-checked to maintain quality and
                accuracy.
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
                everyone without barriers. Our code is available on GitHub, all
                of our data is available on our platform, and we welcome
                contributions from developers worldwide.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 p-4 border border-[#211f1c]/20 dark:border-white/20 rounded-lg">
          <p className="text-[12px] text-black/60 dark:text-white/60 text-center">
            Have questions or want to get involved? Check out our{" "}
            <a
              href="https://github.com/wastefull/Wdb"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-black dark:hover:text-white"
            >
              GitHub repository
            </a>{" "}
            or reach out to the community.
          </p>
        </div>
      </div>
    </PageTemplate>
  );
}
