/**
 * useRasterizedChart Hook
 * 
 * React hook for managing rasterized chart visualization with caching.
 * Handles SVG-to-canvas conversion, caching, and cache invalidation.
 * 
 * Phase 8: Performance & Scalability
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { ScoreType } from '../components/QuantileVisualization';
import {
  getCachedChart,
  setCachedChart,
  generateDataHash,
  CacheKey,
} from './chartCache';

interface UseRasterizedChartOptions {
  materialId: string;
  scoreType: ScoreType;
  data: any;
  width: number;
  height: number;
  darkMode: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  enabled?: boolean; // Whether to use rasterization (default: true)
}

interface RasterizedChartResult {
  dataUrl: string | null;
  isLoading: boolean;
  error: Error | null;
  svgRef: React.RefObject<SVGSVGElement>;
  rasterize: () => Promise<void>;
}

/**
 * Hook for managing rasterized charts with caching
 */
export function useRasterizedChart({
  materialId,
  scoreType,
  data,
  width,
  height,
  darkMode,
  highContrast,
  reduceMotion,
  enabled = true,
}: UseRasterizedChartOptions): RasterizedChartResult {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const rasterizationInProgress = useRef(false);

  // Generate cache key
  const cacheKey: CacheKey = {
    materialId,
    scoreType,
    width,
    height,
    darkMode,
    highContrast,
    reduceMotion,
    dataHash: generateDataHash(data),
  };

  /**
   * Convert SVG to data URL using canvas with high resolution
   */
  const svgToDataUrl = useCallback(
    async (svgElement: SVGSVGElement): Promise<string> => {
      return new Promise(async (resolve, reject) => {
        try {
          // Wait for fonts to load (especially Sniglet)
          try {
            await document.fonts.ready;
            // Extra time for font rendering
            await new Promise(r => setTimeout(r, 50));
          } catch (fontErr) {
            console.warn('Font loading check failed, continuing anyway:', fontErr);
          }

          // Clone the SVG to avoid modifying the original
          const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

          // Get the actual bounding box to ensure we capture everything
          const bbox = svgElement.getBBox();
          const padding = 5; // Add some padding to prevent cropping
          
          // Calculate dimensions that include all content
          const actualWidth = Math.max(width, bbox.x + bbox.width + padding);
          const actualHeight = Math.max(height, bbox.y + bbox.height + padding);

          // Set explicit dimensions on cloned SVG
          clonedSvg.setAttribute('width', actualWidth.toString());
          clonedSvg.setAttribute('height', actualHeight.toString());
          clonedSvg.setAttribute('viewBox', `0 0 ${actualWidth} ${actualHeight}`);

          // Ensure font families are embedded in the SVG
          const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
          styleElement.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Sniglet&display=swap');
            text {
              font-family: 'Sniglet', cursive;
            }
          `;
          clonedSvg.insertBefore(styleElement, clonedSvg.firstChild);

          // Serialize SVG to string
          const serializer = new XMLSerializer();
          let svgString = serializer.serializeToString(clonedSvg);

          // Add XML declaration and namespace if not present
          if (!svgString.includes('xmlns')) {
            svgString = svgString.replace(
              '<svg',
              '<svg xmlns="http://www.w3.org/2000/svg"'
            );
          }

          // Create a blob from the SVG string
          const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(blob);

          // Create an image to load the SVG
          const img = new Image();
          img.onload = () => {
            try {
              // Use device pixel ratio for high-DPI displays (minimum 2x for quality)
              const pixelRatio = Math.max(window.devicePixelRatio || 1, 2);
              
              // Create canvas with high resolution
              const canvas = document.createElement('canvas');
              canvas.width = actualWidth * pixelRatio;
              canvas.height = actualHeight * pixelRatio;

              const ctx = canvas.getContext('2d', {
                alpha: true,
                desynchronized: false,
              });
              
              if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
              }

              // Scale context to match pixel ratio
              ctx.scale(pixelRatio, pixelRatio);

              // Enable image smoothing for better quality
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';

              // Fill background (transparent by default)
              ctx.clearRect(0, 0, actualWidth, actualHeight);

              // Draw the image onto the canvas
              ctx.drawImage(img, 0, 0, actualWidth, actualHeight);

              // Convert canvas to data URL with high quality
              const dataUrl = canvas.toDataURL('image/png', 1.0);

              // Clean up
              URL.revokeObjectURL(url);

              resolve(dataUrl);
            } catch (err) {
              URL.revokeObjectURL(url);
              reject(err);
            }
          };

          img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load SVG image'));
          };

          img.src = url;
        } catch (err) {
          reject(err);
        }
      });
    },
    [width, height]
  );

  /**
   * Rasterize the SVG and cache it
   */
  const rasterize = useCallback(async () => {
    if (!enabled) return;
    if (rasterizationInProgress.current) return;
    if (!svgRef.current) return;

    try {
      rasterizationInProgress.current = true;
      setIsLoading(true);
      setError(null);

      // Convert SVG to data URL
      const url = await svgToDataUrl(svgRef.current);

      // Cache the result
      await setCachedChart(cacheKey, url);

      // Update state
      setDataUrl(url);
    } catch (err) {
      console.error('Error rasterizing chart:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
      rasterizationInProgress.current = false;
    }
  }, [enabled, svgToDataUrl, cacheKey]);

  /**
   * Load from cache or rasterize on mount and when dependencies change
   */
  useEffect(() => {
    if (!enabled) {
      setDataUrl(null);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const loadChart = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to get from cache first
        const cached = await getCachedChart(cacheKey);

        if (cached && mounted) {
          setDataUrl(cached);
          setIsLoading(false);
          return;
        }

        // If not in cache, wait for SVG to render and fonts to load, then rasterize
        // We use a longer delay to ensure the SVG and fonts are fully rendered
        if (mounted) {
          setTimeout(() => {
            if (mounted) {
              rasterize();
            }
          }, 200);
        }
      } catch (err) {
        if (mounted) {
          console.error('Error loading chart:', err);
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setIsLoading(false);
        }
      }
    };

    loadChart();

    return () => {
      mounted = false;
    };
  }, [
    enabled,
    materialId,
    scoreType,
    cacheKey.dataHash,
    width,
    height,
    darkMode,
    highContrast,
    reduceMotion,
  ]);

  return {
    dataUrl,
    isLoading,
    error,
    svgRef,
    rasterize,
  };
}
