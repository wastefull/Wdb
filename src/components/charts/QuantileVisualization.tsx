import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useAccessibility } from "../shared/AccessibilityContext";

export type ScoreType = "compostability" | "recyclability" | "reusability";

interface QuantileData {
  practical_mean?: number;
  theoretical_mean?: number;
  practical_CI95?: { lower: number; upper: number };
  theoretical_CI95?: { lower: number; upper: number };
  confidence_level?: "High" | "Medium" | "Low";
  category?: string;
}

interface QuantileVisualizationProps {
  scoreType: ScoreType;
  data: QuantileData;
  simplified?: boolean; // If true, shows just the simple bar (for backwards compatibility)
  fallbackScore?: number; // Fallback score (0-100) to use when scientific data is missing
  width?: number;
  height?: number;
  onClick?: () => void;
  articleCount?: number;
  hideHeader?: boolean; // If true, hides the label/score header (useful when embedded)
}

type VisualizationMode = "overlap" | "near-overlap" | "gap";

// Color mapping for different score types
const SCORE_COLORS = {
  compostability: {
    pastel: "#e6beb5",
    highContrast: "#c74444",
  },
  recyclability: {
    pastel: "#e4e3ac",
    highContrast: "#d4b400",
  },
  reusability: {
    pastel: "#b8c8cb",
    highContrast: "#4a90a4",
  },
};

const SCORE_LABELS = {
  compostability: "Compostability",
  recyclability: "Recyclability",
  reusability: "Reusability",
};

export function QuantileVisualization({
  scoreType,
  data,
  simplified = false,
  fallbackScore = 0,
  width = 300,
  height = 60,
  onClick,
  articleCount,
  hideHeader = false,
}: QuantileVisualizationProps) {
  const { reduceMotion, highContrast, settings } = useAccessibility();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const color = highContrast
    ? SCORE_COLORS[scoreType].highContrast
    : SCORE_COLORS[scoreType].pastel;
  const label = SCORE_LABELS[scoreType];

  // If simplified or missing scientific data, show simple bar
  if (
    simplified ||
    !data.practical_mean ||
    !data.theoretical_mean ||
    !data.practical_CI95 ||
    !data.theoretical_CI95
  ) {
    // Use fallbackScore if provided, otherwise use practical_mean * 100
    const displayScore =
      fallbackScore > 0 ? fallbackScore : (data.practical_mean || 0) * 100;
    return (
      <SimpleBar
        score={displayScore}
        label={label}
        color={color}
        onClick={onClick}
        articleCount={articleCount}
      />
    );
  }

  // Calculate visualization mode
  const pracMean = data.practical_mean;
  const theoMean = data.theoretical_mean;
  const pracCI = data.practical_CI95;
  const theoCI = data.theoretical_CI95;

  const gap = Math.abs(theoMean - pracMean);
  const overlap = pracCI.upper >= theoCI.lower && theoCI.upper >= pracCI.lower;

  const mode: VisualizationMode = overlap
    ? "overlap"
    : gap >= 0.1
    ? "gap"
    : "near-overlap";

  // Responsive dot count - increased for better visibility
  const dotCount = isMobile ? 50 : width < 250 ? 80 : 150;

  // Calculate the displayed score (practical mean as 0-100)
  const displayScore = Math.round(pracMean * 100);

  return (
    <div className="flex flex-col gap-1 w-full">
      {/* Label, score, and article count on top row */}
      {!hideHeader && (
        <div className="flex justify-between items-center">
          <button
            onClick={onClick}
            className="text-[11px] text-black dark:text-white hover:underline cursor-pointer text-left flex items-center gap-1"
            aria-label={`View ${label.toLowerCase()} articles (${
              articleCount || 0
            } articles)`}
          >
            <span className="text-[11px] text-black dark:text-white">
              {label}
            </span>
            {articleCount !== undefined && articleCount > 0 && (
              <span className="text-[9px] text-black/60 dark:text-white/60">
                ({articleCount})
              </span>
            )}
          </button>
          <span className="text-[11px] text-black dark:text-white">
            {displayScore}
          </span>
        </div>
      )}

      {/* Visualization */}
      <div
        className="relative group w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={getAriaLabel(label, data, mode, gap)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
        <svg
          width="100%"
          height={height}
          className="cursor-pointer"
          aria-hidden="true"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {mode === "overlap" && (
            <OverlapMode
              scoreType={scoreType}
              pracMean={pracMean}
              theoMean={theoMean}
              pracCI={pracCI}
              theoCI={theoCI}
              dotCount={dotCount}
              width={width}
              height={height}
              isHovered={isHovered}
              reduceMotion={reduceMotion}
              highContrast={highContrast}
              darkMode={settings.darkMode}
              confidence={data.confidence_level}
            />
          )}

          {mode === "near-overlap" && (
            <NearOverlapMode
              scoreType={scoreType}
              pracMean={pracMean}
              theoMean={theoMean}
              pracCI={pracCI}
              theoCI={theoCI}
              dotCount={dotCount}
              width={width}
              height={height}
              isHovered={isHovered}
              reduceMotion={reduceMotion}
              highContrast={highContrast}
              darkMode={settings.darkMode}
              confidence={data.confidence_level}
            />
          )}

          {mode === "gap" && (
            <GapMode
              scoreType={scoreType}
              pracMean={pracMean}
              theoMean={theoMean}
              pracCI={pracCI}
              theoCI={theoCI}
              gap={gap}
              dotCount={dotCount}
              width={width}
              height={height}
              isHovered={isHovered}
              reduceMotion={reduceMotion}
              highContrast={highContrast}
              darkMode={settings.darkMode}
              confidence={data.confidence_level}
            />
          )}

          {/* Axis */}
          <Axis width={width} height={height} highContrast={highContrast} />
        </svg>

        {/* Tooltip */}
        {isHovered && (
          <TooltipContent
            pracMean={pracMean}
            theoMean={theoMean}
            pracCI={pracCI}
            theoCI={theoCI}
            gap={gap}
            mode={mode}
            confidence={data.confidence_level}
          />
        )}
      </div>
    </div>
  );
}

// Simple bar for backwards compatibility
function SimpleBar({
  score,
  label,
  color,
  onClick,
  articleCount,
}: {
  score: number;
  label: string;
  color: string;
  onClick?: () => void;
  articleCount?: number;
}) {
  return (
    <div
      className="group cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${label}: ${score} out of 100${
        articleCount
          ? `, ${articleCount} article${articleCount !== 1 ? "s" : ""}`
          : ""
      }`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-black/70 dark:text-white/70">
          {label}
        </span>
        <div className="flex items-center gap-2">
          {articleCount !== undefined && articleCount > 0 && (
            <span className="text-[9px] text-black/50 dark:text-white/50 bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded border border-black/10 dark:border-white/10">
              {articleCount} article{articleCount !== 1 ? "s" : ""}
            </span>
          )}
          <span className="text-[10px] text-black/70 dark:text-white/70">
            {score}
          </span>
        </div>
      </div>
      <div className="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden border border-[#211f1c] dark:border-white/20">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full transition-all group-hover:brightness-110"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// Overlap Mode: Dense dots in shared range
function OverlapMode({
  scoreType,
  pracMean,
  theoMean,
  pracCI,
  theoCI,
  dotCount,
  width,
  height,
  isHovered,
  reduceMotion,
  highContrast,
  darkMode,
  confidence,
}: any) {
  const overlapLower = Math.max(pracCI.lower, theoCI.lower);
  const overlapUpper = Math.min(pracCI.upper, theoCI.upper);
  const centerY = height / 2;

  const dots = Array.from({ length: dotCount }, (_, i) => {
    const value =
      overlapLower + (overlapUpper - overlapLower) * (i / (dotCount - 1));
    const x = value * width;
    return { x, value };
  });

  const dotColor = highContrast ? "#000000" : "#2D5A87";
  const dotStroke = highContrast ? "#666666" : "#1A3A5A";
  const haloColor = highContrast
    ? "rgba(102, 102, 102, 0.7)"
    : "rgba(160, 160, 160, 0.4)";
  const barStroke = darkMode ? "rgba(255, 255, 255, 0.2)" : "#211f1c";
  const barFill = highContrast
    ? SCORE_COLORS[scoreType].highContrast
    : SCORE_COLORS[scoreType].pastel;

  return (
    <g>
      {/* Score bar from 0 to practical lower bound */}
      <rect
        x={0}
        y={centerY - 4}
        width={pracCI.lower * width}
        height={8}
        fill={barFill}
        stroke={barStroke}
        strokeWidth={1}
        opacity={0.9}
        rx={2}
      />

      {/* Subtle halos */}
      <ellipse
        cx={pracMean * width}
        cy={centerY}
        rx={((pracCI.upper - pracCI.lower) * width) / 2}
        ry={8}
        fill={haloColor}
        opacity={isHovered && !reduceMotion ? 0.6 : 0.3}
        className={reduceMotion ? "" : "transition-opacity duration-500"}
      />
      <ellipse
        cx={theoMean * width}
        cy={centerY}
        rx={((theoCI.upper - theoCI.lower) * width) / 2}
        ry={8}
        fill={
          highContrast ? "rgba(51, 51, 102, 0.6)" : "rgba(0, 102, 204, 0.3)"
        }
        opacity={isHovered && !reduceMotion ? 0.5 : 0.25}
        className={reduceMotion ? "" : "transition-opacity duration-500"}
      />

      {/* Quantile dots */}
      {dots.map((dot, i) => (
        <motion.circle
          key={i}
          cx={dot.x}
          cy={centerY}
          r={2}
          fill={dotColor}
          stroke={dotStroke}
          strokeWidth={0.5}
          opacity={0.85}
          initial={reduceMotion ? { opacity: 0.85 } : { opacity: 0, scale: 0 }}
          animate={{ opacity: 0.85, scale: 1 }}
          transition={{
            delay: reduceMotion ? 0 : i * (0.3 / dotCount),
            duration: reduceMotion ? 0 : 0.2,
          }}
        />
      ))}

      {/* Time labels - hide "today" when halos overlap */}
      <text
        x={theoMean * width}
        y={centerY + 18}
        textAnchor="middle"
        className="text-[8px] fill-black/50 dark:fill-white/50"
      >
        future
      </text>
    </g>
  );
}

// Near-Overlap Mode: Dots bridging with soft merged halos
function NearOverlapMode({
  scoreType,
  pracMean,
  theoMean,
  pracCI,
  theoCI,
  dotCount,
  width,
  height,
  isHovered,
  reduceMotion,
  highContrast,
  darkMode,
  confidence,
}: any) {
  const centerY = height / 2;
  const rangeStart = Math.min(pracCI.lower, theoCI.lower);
  const rangeEnd = Math.max(pracCI.upper, theoCI.upper);

  const dots = Array.from({ length: dotCount }, (_, i) => {
    const value = rangeStart + (rangeEnd - rangeStart) * (i / (dotCount - 1));
    const x = value * width;
    return { x, value };
  });

  const dotColor = highContrast ? "#000000" : "#2D5A87";
  const dotStroke = highContrast ? "#666666" : "#1A3A5A";
  const barStroke = darkMode ? "rgba(255, 255, 255, 0.2)" : "#211f1c";
  const barFill = highContrast
    ? SCORE_COLORS[scoreType].highContrast
    : SCORE_COLORS[scoreType].pastel;

  // Check if text labels would overlap (accounting for text width ~25-30px each)
  const labelDistance = Math.abs((theoMean - pracMean) * width);
  const showTodayLabel = labelDistance > 35; // Hide if labels are too close

  return (
    <g>
      {/* Score bar from 0 to practical lower bound */}
      <rect
        x={0}
        y={centerY - 4}
        width={pracCI.lower * width}
        height={8}
        fill={barFill}
        stroke={barStroke}
        strokeWidth={1}
        opacity={0.9}
        rx={2}
      />

      {/* Practical halo (gray) */}
      <ellipse
        cx={pracMean * width}
        cy={centerY}
        rx={((pracCI.upper - pracCI.lower) * width) / 2}
        ry={10}
        fill={
          highContrast ? "rgba(102, 102, 102, 0.7)" : "rgba(160, 160, 160, 0.4)"
        }
        opacity={isHovered && !reduceMotion ? 0.7 : 0.4}
        className={reduceMotion ? "" : "transition-opacity duration-500"}
      />

      {/* Theoretical halo (blue) */}
      <ellipse
        cx={theoMean * width}
        cy={centerY}
        rx={((theoCI.upper - theoCI.lower) * width) / 2}
        ry={10}
        fill={
          highContrast ? "rgba(51, 51, 102, 0.6)" : "rgba(0, 102, 204, 0.3)"
        }
        opacity={isHovered && !reduceMotion ? 0.6 : 0.3}
        className={reduceMotion ? "" : "transition-opacity duration-500"}
      />

      {/* Quantile dots */}
      {dots.map((dot, i) => (
        <motion.circle
          key={i}
          cx={dot.x}
          cy={centerY}
          r={2}
          fill={dotColor}
          stroke={dotStroke}
          strokeWidth={0.5}
          opacity={0.85}
          initial={reduceMotion ? { opacity: 0.85 } : { opacity: 0, scale: 0 }}
          animate={{ opacity: 0.85, scale: 1 }}
          transition={{
            delay: reduceMotion ? 0 : i * (0.3 / dotCount),
            duration: reduceMotion ? 0 : 0.2,
          }}
        />
      ))}

      {/* Time labels - conditionally hide "today" if too close to "future" */}
      {showTodayLabel && (
        <text
          x={pracMean * width}
          y={centerY + 18}
          textAnchor="middle"
          className="text-[8px] fill-black/50 dark:fill-white/50"
        >
          today
        </text>
      )}
      <text
        x={theoMean * width}
        y={centerY + 18}
        textAnchor="middle"
        className="text-[8px] fill-black/50 dark:fill-white/50"
      >
        future
      </text>
    </g>
  );
}

// Gap Mode: Two halos with gap zone
function GapMode({
  scoreType,
  pracMean,
  theoMean,
  pracCI,
  theoCI,
  gap,
  dotCount,
  width,
  height,
  isHovered,
  reduceMotion,
  highContrast,
  darkMode,
  confidence,
}: any) {
  const centerY = height / 2;
  const midpoint = (pracMean + theoMean) / 2;

  // Dots anchored at midpoint
  const dotSpread = 0.05; // Spread dots ±5% around midpoint
  const dots = Array.from({ length: dotCount }, (_, i) => {
    const value = midpoint - dotSpread + 2 * dotSpread * (i / (dotCount - 1));
    const x = Math.max(0, Math.min(width, value * width));
    return { x, value };
  });

  const dotColor = highContrast ? "#000000" : "#2D5A87";
  const dotStroke = highContrast ? "#666666" : "#1A3A5A";
  const barStroke = darkMode ? "rgba(255, 255, 255, 0.2)" : "#211f1c";
  const barFill = highContrast
    ? SCORE_COLORS[scoreType].highContrast
    : SCORE_COLORS[scoreType].pastel;

  // Gap zone coordinates
  const gapStart = pracCI.upper * width;
  const gapEnd = theoCI.lower * width;

  // Check if text labels would overlap (accounting for text width ~25-30px each)
  const labelDistance = Math.abs((theoMean - pracMean) * width);
  const showTodayLabel = labelDistance > 35; // Hide if labels are too close

  return (
    <g>
      {/* Score bar from 0 to practical lower bound */}
      <rect
        x={0}
        y={centerY - 4}
        width={pracCI.lower * width}
        height={8}
        fill={barFill}
        stroke={barStroke}
        strokeWidth={1}
        opacity={0.9}
        rx={2}
      />

      {/* Practical halo (gray, left) */}
      <ellipse
        cx={pracMean * width}
        cy={centerY}
        rx={((pracCI.upper - pracCI.lower) * width) / 2}
        ry={12}
        fill={
          highContrast ? "rgba(102, 102, 102, 0.7)" : "rgba(160, 160, 160, 0.4)"
        }
        opacity={isHovered && !reduceMotion ? 0.8 : 0.5}
        className={reduceMotion ? "" : "transition-opacity duration-500"}
      />

      {/* Gap zone */}
      <rect
        x={gapStart}
        y={centerY - 8}
        width={gapEnd - gapStart}
        height={16}
        fill={highContrast ? "url(#gapPattern)" : "url(#gapGradient)"}
        opacity={0.3}
      />

      {/* Theoretical halo (blue, right) */}
      <ellipse
        cx={theoMean * width}
        cy={centerY}
        rx={((theoCI.upper - theoCI.lower) * width) / 2}
        ry={12}
        fill={
          highContrast ? "rgba(51, 51, 102, 0.6)" : "rgba(0, 102, 204, 0.3)"
        }
        opacity={isHovered && !reduceMotion ? 0.7 : 0.4}
        className={reduceMotion ? "" : "transition-opacity duration-500"}
      />

      {/* Connector line */}
      <line
        x1={pracMean * width}
        y1={centerY}
        x2={theoMean * width}
        y2={centerY}
        stroke={highContrast ? "#000" : "#666"}
        strokeWidth="1"
        strokeDasharray="2,2"
        opacity={0.5}
      />

      {/* Gap label */}
      <text
        x={((pracMean + theoMean) * width) / 2}
        y={centerY - 15}
        textAnchor="middle"
        className="text-[8px] fill-black/70 dark:fill-white/70"
      >
        Gap: {Math.round(gap * 100)}%
      </text>

      {/* Time labels - conditionally hide "today" if too close to "future" */}
      {showTodayLabel && (
        <text
          x={pracMean * width}
          y={centerY + 18}
          textAnchor="middle"
          className="text-[8px] fill-black/50 dark:fill-white/50"
        >
          today
        </text>
      )}
      <text
        x={theoMean * width}
        y={centerY + 18}
        textAnchor="middle"
        className="text-[8px] fill-black/50 dark:fill-white/50"
      >
        future
      </text>

      {/* Quantile dots */}
      {dots.map((dot, i) => (
        <motion.circle
          key={i}
          cx={dot.x}
          cy={centerY}
          r={2}
          fill={dotColor}
          stroke={dotStroke}
          strokeWidth={0.5}
          opacity={0.85}
          initial={reduceMotion ? { opacity: 0.85 } : { opacity: 0, scale: 0 }}
          animate={{ opacity: 0.85, scale: 1 }}
          transition={{
            delay: reduceMotion ? 0 : i * (0.3 / dotCount),
            duration: reduceMotion ? 0 : 0.2,
          }}
        />
      ))}

      {/* Gradients and patterns */}
      <defs>
        <linearGradient id="gapGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#A0A0A0" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0066CC" stopOpacity="0.2" />
        </linearGradient>
        <pattern
          id="gapPattern"
          x="0"
          y="0"
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
        >
          <rect width="2" height="2" fill="#666" opacity="0.5" />
          <rect x="2" y="2" width="2" height="2" fill="#666" opacity="0.5" />
        </pattern>
      </defs>
    </g>
  );
}

// Axis component
function Axis({
  width,
  height,
  highContrast,
}: {
  width: number;
  height: number;
  highContrast: boolean;
}) {
  const axisY = height - 5;
  const ticks = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <g>
      <line
        x1={0}
        y1={axisY}
        x2={width}
        y2={axisY}
        stroke={highContrast ? "#000" : "#222"}
        strokeWidth="1"
        opacity={0.3}
      />
      {ticks.map((tick) => (
        <line
          key={tick}
          x1={tick * width}
          y1={axisY - 2}
          x2={tick * width}
          y2={axisY + 2}
          stroke={highContrast ? "#000" : "#222"}
          strokeWidth="1"
          opacity={0.4}
        />
      ))}
    </g>
  );
}

// Tooltip component
function TooltipContent({
  pracMean,
  theoMean,
  pracCI,
  theoCI,
  gap,
  mode,
  confidence,
}: any) {
  return (
    <div className="absolute left-0 right-0 -top-2 transform -translate-y-full z-10 pointer-events-none">
      <div className="bg-white dark:bg-[#2a2825] border-[1.5px] border-[#211f1c] dark:border-white/20 rounded-md p-2 shadow-lg">
        <div className="text-[9px] text-black dark:text-white space-y-0.5">
          <div className="flex justify-between gap-3">
            <span className="text-black/60 dark:text-white/60">Practical:</span>
            <span>
              {Math.round(pracMean * 100)} ±{" "}
              {Math.round((pracCI.upper - pracCI.lower) * 50)}%
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-black/60 dark:text-white/60">
              Theoretical:
            </span>
            <span>
              {Math.round(theoMean * 100)} ±{" "}
              {Math.round((theoCI.upper - theoCI.lower) * 50)}%
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-black/60 dark:text-white/60">Gap:</span>
            <span>{Math.round(gap * 100)} pts</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-black/60 dark:text-white/60">
              Confidence:
            </span>
            <span>{confidence || "Unknown"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function for accessibility
function getAriaLabel(
  label: string,
  data: QuantileData,
  mode: VisualizationMode,
  gap: number
): string {
  const pracScore = Math.round((data.practical_mean || 0) * 100);
  const theoScore = Math.round((data.theoretical_mean || 0) * 100);
  const confidence = data.confidence_level || "Unknown";

  if (mode === "overlap") {
    return `${label}: Practical and theoretical scores overlap around ${pracScore}%. Confidence: ${confidence}. Click for details.`;
  } else if (mode === "near-overlap") {
    return `${label}: Practical ${pracScore}%, Theoretical ${theoScore}%. Minor difference. Confidence: ${confidence}. Click for details.`;
  } else {
    return `${label}: Practical ${pracScore}%, Theoretical ${theoScore}%. Gap of ${Math.round(
      gap * 100
    )} percentage points - science outpaces infrastructure. Confidence: ${confidence}. Click for details.`;
  }
}
