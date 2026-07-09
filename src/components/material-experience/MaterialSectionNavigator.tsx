import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  getVisibleMaterialExperienceSections,
  type MaterialExperienceSectionId,
} from "../../config/materialExperience";
import { isDevelopment } from "../../utils/environment";
import { useAccessibility } from "../shared/AccessibilityContext";

export function MaterialSectionNavigator() {
  const { settings } = useAccessibility();
  const showDisabledSections = isDevelopment();
  const [activeSection, setActiveSection] =
    useState<MaterialExperienceSectionId>("material-overview");
  const [isPinned, setIsPinned] = useState(false);
  const [navMetrics, setNavMetrics] = useState({
    height: 0,
    left: 0,
    width: 0,
  });
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const navWrapperRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const navTopRef = useRef(0);
  const visibleSections = useRef(
    new Map<MaterialExperienceSectionId, IntersectionObserverEntry>(),
  );

  const syncNavMeasurements = () => {
    const wrapper = navWrapperRef.current;
    const nav = navRef.current;
    if (!wrapper || !nav) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    navTopRef.current = wrapper.offsetTop;

    setNavMetrics((current) => {
      const next = {
        height: nav.getBoundingClientRect().height,
        left: wrapperRect.left,
        width: wrapperRect.width,
      };

      return current.height === next.height &&
        current.left === next.left &&
        current.width === next.width
        ? current
        : next;
    });
  };

  useLayoutEffect(() => {
    syncNavMeasurements();
  }, [isPinned, showDisabledSections, settings.fontSize]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const host = document.createElement("div");
    host.setAttribute("data-material-section-navigator-portal", "true");
    document.documentElement.appendChild(host);
    setPortalHost(host);

    return () => {
      host.remove();
      setPortalHost(null);
    };
  }, []);

  useEffect(() => {
    const updatePinnedState = () => {
      setIsPinned(window.scrollY >= navTopRef.current);
    };

    syncNavMeasurements();
    updatePinnedState();

    window.addEventListener("scroll", updatePinnedState, { passive: true });
    window.addEventListener("resize", syncNavMeasurements);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            syncNavMeasurements();
            updatePinnedState();
          });

    if (resizeObserver && navWrapperRef.current) {
      resizeObserver.observe(navWrapperRef.current);
    }

    if (resizeObserver && navRef.current) {
      resizeObserver.observe(navRef.current);
    }

    return () => {
      window.removeEventListener("scroll", updatePinnedState);
      window.removeEventListener("resize", syncNavMeasurements);
      resizeObserver?.disconnect();
    };
  }, [showDisabledSections, settings.fontSize]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const sections = getVisibleMaterialExperienceSections({
      includeDisabled: showDisabledSections,
    })
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

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
  }, [showDisabledSections]);

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
    <>
      <div
        ref={navWrapperRef}
        className="mx-auto mb-8 max-w-7xl"
        style={isPinned ? { height: `${navMetrics.height}px` } : undefined}
      >
        {!isPinned && (
          <nav
            ref={navRef}
            aria-label="Material page sections"
            className="sticky top-0 z-20 rounded-(--retro-rounding) border-[1.5px] border-[#211f1c]/20 bg-white/90 p-2 shadow-sm backdrop-blur dark:border-white/20 dark:bg-[#1a1917]/90"
          >
            <div className="flex gap-1 overflow-x-auto">
              {getVisibleMaterialExperienceSections({
                includeDisabled: showDisabledSections,
              }).map((section, index) => {
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
        )}
      </div>
      {isPinned &&
        portalHost &&
        createPortal(
          <nav
            ref={navRef}
            aria-label="Material page sections"
            className="fixed top-0 z-30 rounded-(--retro-rounding) border-[1.5px] border-[#211f1c]/20 bg-white/90 p-2 shadow-sm backdrop-blur dark:border-white/20 dark:bg-[#1a1917]/90"
            style={{
              left: `${navMetrics.left}px`,
              width: `${navMetrics.width}px`,
            }}
          >
            <div className="flex gap-1 overflow-x-auto">
              {getVisibleMaterialExperienceSections({
                includeDisabled: showDisabledSections,
              }).map((section, index) => {
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
          </nav>,
          portalHost,
        )}
    </>
  );
}
