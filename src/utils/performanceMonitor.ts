import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private marks: Map<string, number> = new Map();
  private enabled: boolean = true;
  private maxMetrics: number = 100; // Keep last 100 metrics

  /**
   * Start a performance measurement
   */
  start(name: string): void {
    if (!this.enabled) return;
    this.marks.set(name, performance.now());
  }

  /**
   * End a performance measurement and log it
   */
  end(name: string, metadata?: Record<string, any>): number | null {
    if (!this.enabled) return null;
    
    const startTime = this.marks.get(name);
    if (!startTime) {
      logger.warn(`Performance mark "${name}" not found`);
      return null;
    }

    const duration = performance.now() - startTime;
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);
    this.marks.delete(name);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log if duration is significant (>100ms)
    if (duration > 100) {
      logger.log(`⚡ Performance: ${name} took ${duration.toFixed(2)}ms`, metadata);
    }

    return duration;
  }

  /**
   * Measure a function execution time
   */
  async measure<T>(
    name: string,
    fn: () => T | Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    if (!this.enabled) return fn();

    this.start(name);
    try {
      const result = await fn();
      this.end(name, metadata);
      return result;
    } catch (error) {
      this.end(name, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Get all metrics for a specific operation
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }

  /**
   * Get average duration for an operation
   */
  getAverage(name: string): number | null {
    const operations = this.getMetrics(name);
    if (operations.length === 0) return null;

    const sum = operations.reduce((acc, m) => acc + m.duration, 0);
    return sum / operations.length;
  }

  /**
   * Get statistics for an operation
   */
  getStats(name: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const operations = this.getMetrics(name);
    if (operations.length === 0) return null;

    const durations = operations.map(m => m.duration).sort((a, b) => a - b);
    const count = durations.length;

    return {
      count,
      average: durations.reduce((a, b) => a + b, 0) / count,
      min: durations[0],
      max: durations[count - 1],
      p50: durations[Math.floor(count * 0.5)],
      p95: durations[Math.floor(count * 0.95)],
      p99: durations[Math.floor(count * 0.99)],
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.marks.clear();
  }

  /**
   * Enable or disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }

  /**
   * Log all performance stats
   */
  logStats(): void {
    const operationNames = [...new Set(this.metrics.map(m => m.name))];
    
    logger.log('📊 Performance Statistics:');
    operationNames.forEach(name => {
      const stats = this.getStats(name);
      if (stats) {
        logger.log(`  ${name}:`, {
          count: stats.count,
          avg: `${stats.average.toFixed(2)}ms`,
          min: `${stats.min.toFixed(2)}ms`,
          max: `${stats.max.toFixed(2)}ms`,
          p50: `${stats.p50.toFixed(2)}ms`,
          p95: `${stats.p95.toFixed(2)}ms`,
        });
      }
    });
  }

  /**
   * Monitor Web Vitals (Core Web Vitals)
   */
  monitorWebVitals(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        const lcp = lastEntry.renderTime || lastEntry.loadTime;
        logger.log(`🎨 LCP: ${lcp.toFixed(2)}ms`);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // Browser doesn't support LCP
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          logger.log(`👆 FID: ${fid.toFixed(2)}ms`);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // Browser doesn't support FID
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        logger.log(`📐 CLS: ${clsValue.toFixed(4)}`);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // Browser doesn't support CLS
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Hook for React components
export function usePerformanceMonitor(operationName: string) {
  return {
    start: () => performanceMonitor.start(operationName),
    end: (metadata?: Record<string, any>) => performanceMonitor.end(operationName, metadata),
    measure: <T,>(fn: () => T | Promise<T>, metadata?: Record<string, any>) =>
      performanceMonitor.measure(operationName, fn, metadata),
  };
}
