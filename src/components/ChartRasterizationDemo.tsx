/**
 * ChartRasterizationDemo Component
 * 
 * Testing and demonstration interface for chart rasterization system.
 * Shows side-by-side comparison, cache statistics, and performance metrics.
 * 
 * Phase 8: Performance & Scalability - Testing Tool
 */

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { RefreshCw, Zap, Image as ImageIcon, Activity } from 'lucide-react';
import { QuantileVisualization } from './QuantileVisualization';
import { RasterizedQuantileVisualization } from './RasterizedQuantileVisualization';
import { ChartCacheManager } from './ChartCacheManager';
import { toast } from 'sonner@2.0.3';

// Sample test data for different visualization modes
const TEST_DATA = {
  overlap: {
    id: 'test-overlap',
    name: 'Overlap Mode Test',
    data: {
      practical_mean: 0.65,
      theoretical_mean: 0.68,
      practical_CI95: { lower: 0.60, upper: 0.70 },
      theoretical_CI95: { lower: 0.63, upper: 0.73 },
      confidence_level: 'High' as const,
    },
  },
  nearOverlap: {
    id: 'test-near-overlap',
    name: 'Near-Overlap Mode Test',
    data: {
      practical_mean: 0.55,
      theoretical_mean: 0.62,
      practical_CI95: { lower: 0.50, upper: 0.60 },
      theoretical_CI95: { lower: 0.57, upper: 0.67 },
      confidence_level: 'Medium' as const,
    },
  },
  gap: {
    id: 'test-gap',
    name: 'Gap Mode Test',
    data: {
      practical_mean: 0.40,
      theoretical_mean: 0.75,
      practical_CI95: { lower: 0.35, upper: 0.45 },
      theoretical_CI95: { lower: 0.70, upper: 0.80 },
      confidence_level: 'High' as const,
    },
  },
  simplified: {
    id: 'test-simplified',
    name: 'Simplified Bar Test',
    data: {},
    fallbackScore: 72,
  },
};

export function ChartRasterizationDemo() {
  const [renderCount, setRenderCount] = useState(0);
  const [svgRenderTime, setSvgRenderTime] = useState<number | null>(null);
  const [rasterRenderTime, setRasterRenderTime] = useState<number | null>(null);

  const handleRefresh = () => {
    setRenderCount(prev => prev + 1);
    toast.success('Charts refreshed');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-['Fredoka_One',_cursive]">Chart Rasterization Demo</h2>
          <p className="text-sm text-black/60 dark:text-white/60 mt-1">
            Test and compare rasterized vs. live SVG chart performance
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All
        </Button>
      </div>

      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="comparison">Side-by-Side</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="cache">Cache Manager</TabsTrigger>
          <TabsTrigger value="stress">Stress Test</TabsTrigger>
        </TabsList>

        {/* Side-by-Side Comparison */}
        <TabsContent value="comparison" className="space-y-6">
          <Card className="p-6">
            <h3 className="font-['Sniglet:Regular',_sans-serif] text-lg mb-4">
              Visual Comparison
            </h3>
            <p className="text-sm text-black/60 dark:text-white/60 mb-6">
              Compare live SVG rendering (left) with rasterized cached version (right). 
              On first load, both should look identical. On refresh, the rasterized version 
              loads from cache instantly.
            </p>

            {Object.entries(TEST_DATA).map(([key, test]) => (
              <div key={key} className="mb-8 last:mb-0">
                <h4 className="font-['Sniglet:Regular',_sans-serif] mb-4 text-sm text-black/70 dark:text-white/70">
                  {test.name}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Live SVG */}
                  <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-['Sniglet:Regular',_sans-serif] text-sm">
                        Live SVG
                      </span>
                    </div>
                    <QuantileVisualization
                      key={`svg-${key}-${renderCount}`}
                      scoreType="recyclability"
                      data={test.data}
                      simplified={key === 'simplified'}
                      fallbackScore={(test as any).fallbackScore}
                      width={300}
                      height={60}
                      articleCount={5}
                    />
                  </Card>

                  {/* Rasterized */}
                  <Card className="p-4 bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center gap-2 mb-3">
                      <ImageIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="font-['Sniglet:Regular',_sans-serif] text-sm">
                        Rasterized (Cached)
                      </span>
                    </div>
                    <RasterizedQuantileVisualization
                      key={`raster-${key}-${renderCount}`}
                      materialId={test.id}
                      scoreType="recyclability"
                      data={test.data}
                      simplified={key === 'simplified'}
                      fallbackScore={(test as any).fallbackScore}
                      width={300}
                      height={60}
                      articleCount={5}
                      enableRasterization={true}
                    />
                  </Card>
                </div>
              </div>
            ))}
          </Card>

          <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/20">
            <h4 className="font-['Sniglet:Regular',_sans-serif] mb-2">Testing Instructions</h4>
            <ol className="text-sm space-y-2 list-decimal list-inside text-black/70 dark:text-white/70">
              <li><strong>First Load:</strong> Both columns render fresh. Rasterized charts convert SVG to PNG and cache.</li>
              <li><strong>Click "Refresh All":</strong> Live SVG re-renders from scratch. Rasterized loads instantly from cache.</li>
              <li><strong>Open DevTools → Network:</strong> See no network requests for cached images.</li>
              <li><strong>Open DevTools → Application → IndexedDB → wastedb-chart-cache:</strong> View cached PNGs.</li>
              <li><strong>Check Performance Tab:</strong> Rasterized should show significantly fewer DOM nodes.</li>
            </ol>
          </Card>
        </TabsContent>

        {/* Performance Testing */}
        <TabsContent value="performance" className="space-y-6">
          <PerformanceTest />
        </TabsContent>

        {/* Cache Manager */}
        <TabsContent value="cache">
          <ChartCacheManager />
        </TabsContent>

        {/* Stress Test */}
        <TabsContent value="stress">
          <StressTest />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Performance testing component
 */
function PerformanceTest() {
  const [testCount, setTestCount] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
    svg: number;
    rasterized: number;
    improvement: number;
  } | null>(null);

  const runTest = async () => {
    setIsRunning(true);
    setResults(null);

    try {
      // Simulate rendering performance test
      const svgStart = performance.now();
      for (let i = 0; i < testCount; i++) {
        // Simulate SVG render cost
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      const svgEnd = performance.now();
      const svgTime = svgEnd - svgStart;

      const rasterStart = performance.now();
      for (let i = 0; i < testCount; i++) {
        // Simulate cached image render (much faster)
        await new Promise(resolve => setTimeout(resolve, 0.1));
      }
      const rasterEnd = performance.now();
      const rasterTime = rasterEnd - rasterStart;

      const improvement = ((svgTime - rasterTime) / svgTime) * 100;

      setResults({
        svg: svgTime,
        rasterized: rasterTime,
        improvement,
      });

      toast.success('Performance test complete');
    } catch (error) {
      toast.error('Performance test failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-['Sniglet:Regular',_sans-serif] text-lg mb-4">
          Render Performance Test
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Number of charts to render:</label>
            <input
              type="number"
              value={testCount}
              onChange={(e) => setTestCount(parseInt(e.target.value) || 10)}
              className="w-32 px-3 py-2 border border-black/20 dark:border-white/20 rounded-md"
              min="1"
              max="100"
            />
          </div>

          <Button 
            onClick={runTest} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running Test...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Run Performance Test
              </>
            )}
          </Button>
        </div>
      </Card>

      {results && (
        <Card className="p-6 bg-green-50 dark:bg-green-900/20">
          <h4 className="font-['Sniglet:Regular',_sans-serif] mb-4">Test Results</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-black/60 dark:text-white/60 mb-1">Live SVG</p>
              <p className="text-2xl font-bold">{results.svg.toFixed(2)}ms</p>
            </div>
            <div>
              <p className="text-sm text-black/60 dark:text-white/60 mb-1">Rasterized</p>
              <p className="text-2xl font-bold">{results.rasterized.toFixed(2)}ms</p>
            </div>
            <div>
              <p className="text-sm text-black/60 dark:text-white/60 mb-1">Improvement</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {results.improvement.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20">
        <h4 className="font-['Sniglet:Regular',_sans-serif] mb-2">About This Test</h4>
        <p className="text-sm text-black/70 dark:text-white/70">
          This simulated test demonstrates the performance difference between rendering
          live SVG charts and displaying cached rasterized images. In real-world usage
          with complex visualizations, the improvement can be even more significant,
          especially when scrolling through lists of 50+ materials.
        </p>
      </Card>
    </div>
  );
}

/**
 * Stress test component - render many charts at once
 */
function StressTest() {
  const [chartCount, setChartCount] = useState(20);
  const [useRasterization, setUseRasterization] = useState(true);
  const [rendering, setRendering] = useState(false);

  const startStressTest = () => {
    setRendering(true);
    toast.success(`Rendering ${chartCount} charts...`);
    // Rendering happens automatically
  };

  const charts = Array.from({ length: rendering ? chartCount : 0 }, (_, i) => ({
    id: `stress-test-${i}`,
    scoreType: (['recyclability', 'compostability', 'reusability'] as const)[i % 3],
    data: {
      practical_mean: 0.3 + (Math.random() * 0.5),
      theoretical_mean: 0.4 + (Math.random() * 0.5),
      practical_CI95: { lower: 0.3, upper: 0.6 },
      theoretical_CI95: { lower: 0.4, upper: 0.7 },
      confidence_level: 'Medium' as const,
    },
  }));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-['Sniglet:Regular',_sans-serif] text-lg mb-4">
          Stress Test
        </h3>
        <p className="text-sm text-black/60 dark:text-white/60 mb-4">
          Render many charts simultaneously to test performance under load.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Number of charts:</label>
            <input
              type="number"
              value={chartCount}
              onChange={(e) => setChartCount(parseInt(e.target.value) || 20)}
              className="w-32 px-3 py-2 border border-black/20 dark:border-white/20 rounded-md"
              min="1"
              max="100"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="use-raster"
              checked={useRasterization}
              onChange={(e) => setUseRasterization(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="use-raster" className="text-sm">
              Use rasterization (uncheck to test live SVG)
            </label>
          </div>

          <Button onClick={startStressTest} className="w-full">
            <Activity className="h-4 w-4 mr-2" />
            Start Stress Test
          </Button>

          {rendering && (
            <Button 
              onClick={() => setRendering(false)} 
              variant="outline" 
              className="w-full"
            >
              Clear Charts
            </Button>
          )}
        </div>
      </Card>

      {rendering && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-['Sniglet:Regular',_sans-serif]">
              Rendering {chartCount} Charts ({useRasterization ? 'Rasterized' : 'Live SVG'})
            </h4>
            <span className="text-sm text-black/60 dark:text-white/60">
              Watch performance in DevTools
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
            {charts.map((chart, i) => (
              <div key={i} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-black/10 dark:border-white/10">
                {useRasterization ? (
                  <RasterizedQuantileVisualization
                    materialId={chart.id}
                    scoreType={chart.scoreType}
                    data={chart.data}
                    width={250}
                    height={50}
                    enableRasterization={true}
                  />
                ) : (
                  <QuantileVisualization
                    scoreType={chart.scoreType}
                    data={chart.data}
                    width={250}
                    height={50}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/20">
        <h4 className="font-['Sniglet:Regular',_sans-serif] mb-2">Performance Tips</h4>
        <ul className="text-sm space-y-1 list-disc list-inside text-black/70 dark:text-white/70">
          <li>Open DevTools → Performance to see frame rate</li>
          <li>Open DevTools → Rendering → Paint flashing to see repaints</li>
          <li>Check DevTools → Memory to monitor usage</li>
          <li>Compare rasterized vs. live SVG performance</li>
          <li>First render will be slower (building cache)</li>
          <li>Refresh page to see instant load from cache</li>
        </ul>
      </Card>
    </div>
  );
}
