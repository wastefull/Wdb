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

import { useState, useEffect } from 'react';
import { QuantileVisualization, ScoreType } from './QuantileVisualization';
import { useRasterizedChart } from '../utils/useRasterizedChart';
import { useAccessibility } from './AccessibilityContext';

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
}: RasterizedQuantileVisualizationProps) {
  const { settings, reduceMotion, highContrast } = useAccessibility();
  const [shouldRasterize, setShouldRasterize] = useState(enableRasterization);

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
      console.warn('Chart rasterization failed, falling back to live SVG:', error);
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
      />
    );
  }

  // Render both: hidden SVG for rasterization + visible image or SVG
  return (
    <div className="relative">
      {/* Hidden SVG used for rasterization */}
      <div style={{ position: 'absolute', left: -9999, top: -9999, pointerEvents: 'none' }}>
        <div ref={(el) => {
          if (el && svgRef) {
            const svg = el.querySelector('svg');
            if (svg) {
              (svgRef as any).current = svg;
            }
          }
        }}>
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

      {/* Visible content: rasterized image or loading SVG */}
      {dataUrl && !isLoading ? (
        <RasterizedDisplay
          dataUrl={dataUrl}
          scoreType={scoreType}
          data={data}
          width={width}
          height={height}
          onClick={onClick}
          articleCount={articleCount}
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
        />
      )}
    </div>
  );
}

/**
 * Display component for rasterized chart
 * Maintains accessibility features from original component
 */
function RasterizedDisplay({
  dataUrl,
  scoreType,
  data,
  width,
  height,
  onClick,
  articleCount,
}: {
  dataUrl: string;
  scoreType: ScoreType;
  data: any;
  width: number;
  height: number;
  onClick?: () => void;
  articleCount?: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Calculate display values for labels and ARIA
  const pracMean = data.practical_mean || 0;
  const theoMean = data.theoretical_mean || 0;
  const displayScore = Math.round(pracMean * 100);
  const gap = Math.abs(theoMean - pracMean);
  
  const pracCI = data.practical_CI95;
  const theoCI = data.theoretical_CI95;
  const overlap = pracCI && theoCI ? 
    (pracCI.upper >= theoCI.lower) && (theoCI.upper >= pracCI.lower) : false;
  
  const mode = overlap ? 'overlap' : gap >= 0.10 ? 'gap' : 'near-overlap';
  
  const label = scoreType === 'compostability' ? 'Compostability' :
                scoreType === 'recyclability' ? 'Recyclability' : 'Reusability';

  // Generate ARIA label
  const pracScore = Math.round(pracMean * 100);
  const theoScore = Math.round(theoMean * 100);
  const confidence = data.confidence_level || 'Unknown';
  
  let ariaLabel = '';
  if (mode === 'overlap') {
    ariaLabel = `${label}: Practical and theoretical scores overlap around ${pracScore}%. Confidence: ${confidence}. Click for details.`;
  } else if (mode === 'near-overlap') {
    ariaLabel = `${label}: Practical ${pracScore}%, Theoretical ${theoScore}%. Minor difference. Confidence: ${confidence}. Click for details.`;
  } else {
    ariaLabel = `${label}: Practical ${pracScore}%, Theoretical ${theoScore}%. Gap of ${Math.round(gap * 100)} percentage points - science outpaces infrastructure. Confidence: ${confidence}. Click for details.`;
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      {/* Label, score, and article count on top row */}
      <div className="flex justify-between items-center">
        <button
          onClick={onClick}
          className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black dark:text-white hover:underline cursor-pointer text-left flex items-center gap-1"
          aria-label={`View ${label.toLowerCase()} articles (${articleCount || 0} articles)`}
        >
          <span className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black dark:text-white">{label}</span>
          {articleCount !== undefined && articleCount > 0 && (
            <span className="font-['Sniglet:Regular',_sans-serif] text-[9px] text-black/60 dark:text-white/60">({articleCount})</span>
          )}
        </button>
        <span className="font-['Sniglet:Regular',_sans-serif] text-[11px] text-black dark:text-white">{displayScore}</span>
      </div>
      
      {/* Rasterized image */}
      <div 
        className="relative group w-full cursor-pointer"
        style={{ 
          width: `${width}px`,
          height: `${height}px`,
          overflow: 'hidden'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
        <img
          src={dataUrl}
          alt=""
          aria-hidden="true"
          style={{ 
            display: 'block', 
            width: 'auto',
            height: `${height}px`,
            imageRendering: '-webkit-optimize-contrast',
          }}
          className="transition-opacity group-hover:opacity-90"
        />
        
        {/* Tooltip on hover */}
        {isHovered && pracCI && theoCI && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black dark:bg-white text-white dark:text-black text-xs rounded shadow-lg whitespace-nowrap z-10 pointer-events-none">
            <div className="font-['Sniglet:Regular',_sans-serif]">
              <div>Practical: {pracScore}% (±{Math.round((pracCI.upper - pracCI.lower) * 50)}pp)</div>
              <div>Theoretical: {theoScore}% (±{Math.round((theoCI.upper - theoCI.lower) * 50)}pp)</div>
              {gap >= 0.05 && <div>Gap: {Math.round(gap * 100)}pp</div>}
              <div className="text-[10px] opacity-70 mt-1">Confidence: {confidence}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
