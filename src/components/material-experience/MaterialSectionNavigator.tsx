import { useEffect, useRef, useState } from "react";
import {
  MATERIAL_EXPERIENCE_SECTIONS,
  type MaterialExperienceSectionId,
} from "../../config/materialExperience";
import { useAccessibility } from "../shared/AccessibilityContext";

export function MaterialSectionNavigator() {
  const { settings } = useAccessibility();
  const [activeSection, setActiveSection] =
    useState<MaterialExperienceSectionId>("material-overview");
  const visibleSections = useRef(
    new Map<MaterialExperienceSectionId, IntersectionObserverEntry>(),
  );

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const sections = MATERIAL_EXPERIENCE_SECTIONS.map(({ id }) =>
      document.getElementById(id),
    ).filter((section): section is HTMLElement => section !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionId = entry.target.id as MaterialExperienceSectionId;
          if (entry.isIntersecting) {
            visibleSections.current.set(sectionId, entry);
          } else {
            visibleSections.current.delete(sectionId);
          }
        });

        const visibleEntry = Array.from(visibleSections.current.values())
          .sort(
            (left, right) =>
              Math.abs(left.boundingClientRect.top) -
              Math.abs(right.boundingClientRect.top),
          )[0];

        if (visibleEntry) {
          setActiveSection(
            visibleEntry.target.id as MaterialExperienceSectionId,
          );
        }
      },
      {
        rootMargin: "-18% 0px -68% 0px",
        threshold: [0, 0.1, 0.5],
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => {
      observer.disconnect();
      visibleSections.current.clear();
    };
  }, []);

  const navigateToSection = (sectionId: MaterialExperienceSectionId) => {
    const section = document.getElementById(sectionId);
    if (!section) return;

    setActiveSection(sectionId);
    section.scrollIntoView({
      behavior: settings.reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    section.focus({ preventScroll: true });
  };

  return (
    <nav
      aria-label="Material page sections"
      className="sticky top-2 z-20 mx-auto mb-8 max-w-7xl rounded-(--retro-rounding) border-[1.5px] border-[#211f1c]/20 bg-white/90 p-2 shadow-sm backdrop-blur dark:border-white/20 dark:bg-[#1a1917]/90"
    >
      <div className="flex gap-1 overflow-x-auto">
        {MATERIAL_EXPERIENCE_SECTIONS.map((section, index) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              aria-controls={section.id}
              aria-current={isActive ? "step" : undefined}
              onClick={() => navigateToSection(section.id)}
              className={`shrink-0 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isActive
                  ? "bg-[#bae1ff] text-black"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span aria-hidden="true">{index + 1}. </span>
              {section.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
