/**
 * RasterizedQuantileVisualization Component
 *
 * Wrapper around QuantileVisualization that provides chart rasterization
 * with caching for improved performance.
 *
 * Features:
 * - Renders charts to canvas and caches as images
 * - Falls back to live SVG during loading or on error
 * - Maintains full accessibility (ARIA labels, keyboard nav)
 * - Automatic cache invalidation when data changes
 *
 * Phase 8: Performance & Scalability
 */

import { useState, useEffect } from "react";
import { QuantileVisualization, ScoreType } from "./QuantileVisualization";
import { useRasterizedChart } from "../../utils/useRasterizedChart";
import { useAccessibility } from "../shared/AccessibilityContext";
import { logger as log } from "../../utils/logger";
interface RasterizedQuantileVisualizationProps {
  materialId: string;
  scoreType: ScoreType;
  data: any;
  simplified?: boolean;
  fallbackScore?: number;
  width?: number;
  height?: number;
  onClick?: () => void;
  articleCount?: number;
  enableRasterization?: boolean; // Allow disabling rasterization per-component
  showScores?: boolean; // If false, hides score bars and numbers (BETA feature)
}

export function RasterizedQuantileVisualization({
  materialId,
  scoreType,
  data,
  simplified = false,
  fallbackScore = 0,
  width = 300,
  height = 60,
  onClick,
  articleCount,
  enableRasterization = true,
  showScores = true,
}: RasterizedQuantileVisualizationProps) {
  const { settings, reduceMotion, highContrast } = useAccessibility();
  const [shouldRasterize, setShouldRasterize] = useState(enableRasterization);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Detect mobile vs desktop
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Use rasterization hook
  const { dataUrl, isLoading, error, svgRef } = useRasterizedChart({
    materialId,
    scoreType,
    data,
    width,
    height,
    darkMode: settings.darkMode,
    highContrast,
    reduceMotion,
    enabled: shouldRasterize && !simplified && enableRasterization,
  });

  // Disable rasterization on error
  useEffect(() => {
    if (error) {
      log.warn("Chart rasterization failed, falling back to live SVG:", error);
      setShouldRasterize(false);
    }
  }, [error]);

  // For simplified mode or when rasterization is disabled, render normal component
  if (simplified || !shouldRasterize || !enableRasterization) {
    return (
      <QuantileVisualization
        scoreType={scoreType}
        data={data}
        simplified={simplified}
        fallbackScore={fallbackScore}
        width={width}
        height={height}
        onClick={onClick}
        articleCount={articleCount}
        showScores={showScores}
      />
    );
  }

  // Render both: hidden SVG for rasterization + visible image or SVG
  return (
    <div className="relative">
      {/* Hidden SVG used for rasterization */}
      <div
        style={{
          position: "absolute",
          left: -9999,
          top: -9999,
          pointerEvents: "none",
        }}
      >
        <div
          ref={(el) => {
            if (el && svgRef) {
              const svg = el.querySelector("svg");
              if (svg) {
                (svgRef as any).current = svg;
              }
            }
          }}
        >
          <QuantileVisualization
            scoreType={scoreType}
            data={data}
            simplified={simplified}
            fallbackScore={fallbackScore}
            width={width}
            height={height}
            onClick={onClick}
            articleCount={articleCount}
          />
        </div>
      </div>

      {/* Visible content: smart switching based on device and hover state */}
      {dataUrl && !isLoading ? (
        <RasterizedDisplay
          dataUrl={dataUrl}
          scoreType={scoreType}
          data={data}
          width={width}
          height={height}
          onClick={onClick}
          articleCount={articleCount}
          isMobile={isMobile}
          isHovered={isHovered}
          onHoverChange={setIsHovered}
          showScores={showScores}
        />
      ) : (
        // Show live SVG while loading
        <QuantileVisualization
          scoreType={scoreType}
          data={data}
          simplified={simplified}
          fallbackScore={fallbackScore}
          width={width}
          height={height}
          onClick={onClick}
          articleCount={articleCount}
          showScores={showScores}
        />
      )}
    </div>
  );
}

/**
 * Display component for rasterized chart
 * Implements smart rendering strategy:
 * - Mobile: Always show rasterized PNG (performance)
 * - Desktop: Show rasterized by default, switch to live SVG on hover (quality on demand)
 */
function RasterizedDisplay({
  dataUrl,
  scoreType,
  data,
  width,
  height,
  onClick,
  articleCount,
  isMobile,
  isHovered,
  onHoverChange,
  showScores = true,
}: {
  dataUrl: string;
  scoreType: ScoreType;
  data: any;
  width: number;
  height: number;
  onClick?: () => void;
  articleCount?: number;
  isMobile: boolean;
  isHovered: boolean;
  onHoverChange: (hovered: boolean) => void;
  showScores?: boolean;
}) {
  // Calculate display values for labels and ARIA
  const pracMean = data.practical_mean || 0;
  const theoMean = data.theoretical_mean || 0;
  const displayScore = Math.round(pracMean * 100);
  const gap = Math.abs(theoMean - pracMean);

  const pracCI = data.practical_CI95;
  const theoCI = data.theoretical_CI95;
  const overlap =
    pracCI && theoCI
      ? pracCI.upper >= theoCI.lower && theoCI.upper >= pracCI.lower
      : false;

  const mode = overlap ? "overlap" : gap >= 0.1 ? "gap" : "near-overlap";

  const label =
    scoreType === "compostability"
      ? "Compostability"
      : scoreType === "recyclability"
      ? "Recyclability"
      : "Reusability";

  // Generate ARIA label
  const pracScore = Math.round(pracMean * 100);
  const theoScore = Math.round(theoMean * 100);
  const confidence = data.confidence_level || "Unknown";

  let ariaLabel = "";
  if (mode === "overlap") {
    ariaLabel = `${label}: Practical and theoretical scores overlap around ${pracScore}%. Confidence: ${confidence}. Click for details.`;
  } else if (mode === "near-overlap") {
    ariaLabel = `${label}: Practical ${pracScore}%, Theoretical ${theoScore}%. Minor difference. Confidence: ${confidence}. Click for details.`;
  } else {
    ariaLabel = `${label}: Practical ${pracScore}%, Theoretical ${theoScore}%. Gap of ${Math.round(
      gap * 100
    )} percentage points - science outpaces infrastructure. Confidence: ${confidence}. Click for details.`;
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      {/* Label, score, and article count on top row */}
      <div className="flex justify-between items-center">
        <button
          onClick={onClick}
          className="text-[11px] normal hover:underline cursor-pointer text-left flex items-center gap-1"
          aria-label={`View ${label.toLowerCase()} articles (${
            articleCount || 0
          } articles)`}
        >
          <span className="text-[11px] normal">{label}</span>
          {articleCount !== undefined && articleCount > 0 && (
            <span className="text-[9px] text-black/60 dark:text-white/60">
              ({articleCount})
            </span>
          )}
        </button>
        {showScores && (
          <span className="text-[11px] normal">{displayScore}</span>
        )}
      </div>

      {/* Chart display: Rasterized PNG or Live SVG based on device/hover */}
      {showScores && (
        <div
          className="relative group w-full cursor-pointer"
          style={{
            // Mobile: Responsive width, Desktop: Fixed width
            width: isMobile ? "100%" : `${width}px`,
            height: `${height}px`,
            // Only clip overflow when showing PNG (to handle buffer)
            // Allow overflow when showing SVG (for tooltips)
            overflow: isMobile || !isHovered ? "hidden" : "visible",
          }}
          onMouseEnter={() => onHoverChange(true)}
          onMouseLeave={() => onHoverChange(false)}
          onClick={onClick}
          role="button"
          tabIndex={0}
          aria-label={ariaLabel}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick?.();
            }
          }}
        >
          {/* 
            Smart rendering:
            - Mobile: Always PNG scaled to fit (performance)
            - Desktop not hovered: PNG at natural size (performance)  
            - Desktop hovered: Live SVG (quality)
          */}
          {isMobile || !isHovered ? (
            <img
              src={dataUrl}
              alt=""
              aria-hidden="true"
              style={{
                display: "block",
                // Mobile: Scale to fit container, Desktop: Natural size
                width: isMobile ? "100%" : "auto",
                height: isMobile ? "auto" : `${height}px`,
                marginLeft: isMobile ? "0" : "-2px", // Only offset on desktop
                imageRendering: "-webkit-optimize-contrast",
              }}
              className="transition-opacity"
            />
          ) : (
            <QuantileVisualization
              scoreType={scoreType}
              data={data}
              width={width}
              height={height}
              onClick={onClick}
              articleCount={articleCount}
              hideHeader={true}
            />
          )}

          {/* No custom tooltips needed:
              - Mobile: Tap to navigate, no hover state
              - Desktop + PNG: No tooltip (performance)
              - Desktop + SVG: Built-in tooltips from live SVG
          */}
        </div>
      )}
    </div>
  );
}
