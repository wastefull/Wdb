import { useEffect, useRef, useState } from 'react';

interface LazyVisualizationProps {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  onLoad?: () => void;
  className?: string;
}

/**
 * LazyVisualization - Lazy loads visualizations using Intersection Observer
 * Only renders the visualization when it's near the viewport
 */
export function LazyVisualization({
  children,
  placeholder,
  rootMargin = '200px', // Load 200px before entering viewport
  threshold = 0.01,
  onLoad,
  className = ''
}: LazyVisualizationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
          onLoad?.();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, hasLoaded, onLoad]);

  return (
    <div ref={containerRef} className={className}>
      {isVisible ? children : (placeholder || <div className="h-64 bg-[#e5e4dc] dark:bg-[#3a3835] animate-pulse rounded-[11.464px]" />)}
    </div>
  );
}

// Placeholder component for visualizations
export function VisualizationPlaceholder({ height = 256 }: { height?: number }) {
  return (
    <div 
      className="bg-[#e5e4dc] dark:bg-[#3a3835] rounded-[11.464px] border-[1.5px] border-[#211f1c]/20 dark:border-white/20 flex items-center justify-center"
      style={{ height: `${height}px` }}
    >
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#211f1c]/20 dark:border-white/20 border-t-[#211f1c] dark:border-t-white rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[13px] text-black/50 dark:text-white/50">
          Loading visualization...
        </p>
      </div>
    </div>
  );
}
