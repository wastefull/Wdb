import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CheckCircle2, XCircle, Loader2, PlayCircle } from 'lucide-react';
import { Button } from './ui/button';
import { PHASE_CONFIG } from '../config/phaseConfig';
import { useAuth } from '../contexts/AuthContext';

/**
 * Generic Phase Test Console
 * 
 * This component provides a generic testing interface that can be configured
 * for any development phase via the phaseConfig.ts file.
 * 
 * Features:
 * - Configurable phase name and description from config
 * - Test execution with real-time status updates
 * - Categorized test results
 * - Run all tests or individual tests
 * - Visual status indicators
 */

interface TestResult {
  id: string;
  name: string;
  description: string;
  phase: string;
  category: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  message?: string;
  error?: string;
  duration?: number;
}

interface GenericPhaseTestConsoleProps {
  /** The phase number to display tests for (e.g., '9.1', '9.2') */
  phase: string;
  
  /** Optional custom tests to run. If not provided, uses the unified TestSuite */
  tests?: Array<{
    id: string;
    name: string;
    description: string;
    phase: string;
    category: string;
    testFn: () => Promise<{ success: boolean; message: string }>;
  }>;
}

export function GenericPhaseTestConsole({ phase, tests }: GenericPhaseTestConsoleProps) {
  const { user } = useAuth();
  const [testResults, setTestResults] = React.useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  // Initialize test results from tests prop or empty array
  React.useEffect(() => {
    if (tests) {
      const initialResults: TestResult[] = tests
        .filter(test => test.phase === phase)
        .map(test => ({
          id: test.id,
          name: test.name,
          description: test.description,
          phase: test.phase,
          category: test.category,
          status: 'idle' as const,
        }));
      setTestResults(initialResults);
    }
  }, [tests, phase]);

  // Get unique categories from test results
  const categories = React.useMemo(() => {
    const cats = new Set(testResults.map(r => r.category));
    return ['all', ...Array.from(cats)];
  }, [testResults]);

  // Filter tests by selected category
  const filteredResults = React.useMemo(() => {
    if (selectedCategory === 'all') return testResults;
    return testResults.filter(r => r.category === selectedCategory);
  }, [testResults, selectedCategory]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = testResults.length;
    const passed = testResults.filter(r => r.status === 'passed').length;
    const failed = testResults.filter(r => r.status === 'failed').length;
    const running = testResults.filter(r => r.status === 'running').length;
    const idle = testResults.filter(r => r.status === 'idle').length;
    return { total, passed, failed, running, idle };
  }, [testResults]);

  // Run a single test
  const runTest = async (testId: string) => {
    if (!tests) return;
    
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    // Update status to running
    setTestResults(prev =>
      prev.map(r =>
        r.id === testId
          ? { ...r, status: 'running', message: undefined, error: undefined }
          : r
      )
    );

    const startTime = Date.now();

    try {
      const result = await test.testFn();
      const duration = Date.now() - startTime;

      setTestResults(prev =>
        prev.map(r =>
          r.id === testId
            ? {
                ...r,
                status: result.success ? 'passed' : 'failed',
                message: result.message,
                error: result.success ? undefined : result.message,
                duration,
              }
            : r
        )
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      setTestResults(prev =>
        prev.map(r =>
          r.id === testId
            ? {
                ...r,
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                duration,
              }
            : r
        )
      );
    }
  };

  // Run all tests
  const runAllTests = async () => {
    if (!tests || isRunning) return;
    
    setIsRunning(true);
    
    const phaseTests = tests.filter(t => t.phase === phase);
    
    for (const test of phaseTests) {
      await runTest(test.id);
    }
    
    setIsRunning(false);
  };

  // Get status icon
  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  if (!tests || tests.length === 0) {
    return (
      <Card className="border-2 border-dashed border-gray-300">
        <CardHeader>
          <CardTitle className="font-['Sniglet']">
            {PHASE_CONFIG.displayName}
          </CardTitle>
          <CardDescription>{PHASE_CONFIG.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p className="font-['Sniglet']">No tests configured for Phase {phase}</p>
            <p className="text-sm mt-2">
              Add tests to the GenericPhaseTestConsole component to begin testing.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-[#bae1ff]">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-['Sniglet'] text-2xl">
              {PHASE_CONFIG.displayName} - Testing Console
            </CardTitle>
            <CardDescription className="mt-1">
              {PHASE_CONFIG.description}
            </CardDescription>
          </div>
          <Button
            onClick={runAllTests}
            disabled={isRunning || !user}
            className="bg-[#bae1ff] hover:bg-[#9dd1ff] text-black font-['Sniglet']"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 mr-2" />
                Run All Tests
              </>
            )}
          </Button>
        </div>

        {/* Statistics */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <span className="text-sm font-['Sniglet']">
              Idle: {stats.idle}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600" />
            <span className="text-sm font-['Sniglet']">
              Running: {stats.running}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600" />
            <span className="text-sm font-['Sniglet']">
              Passed: {stats.passed}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600" />
            <span className="text-sm font-['Sniglet']">
              Failed: {stats.failed}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-['Sniglet'] font-bold">
              Total: {stats.total}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Category Filter */}
        <div className="mb-4">
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                className={
                  selectedCategory === category
                    ? "bg-[#bae1ff] hover:bg-[#9dd1ff] text-black font-['Sniglet']"
                    : "font-['Sniglet']"
                }
              >
                {category === 'all' ? 'All Tests' : category}
              </Button>
            ))}
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-2">
          {filteredResults.map(result => (
            <div
              key={result.id}
              className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <h4 className="font-['Sniglet'] font-semibold">
                      {result.name}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {result.category}
                    </Badge>
                    {result.duration && (
                      <span className="text-xs text-gray-500">
                        {result.duration}ms
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {result.description}
                  </p>
                  {result.message && (
                    <p className={`text-sm mt-2 ${result.status === 'failed' ? 'text-red-600' : 'text-green-600'}`}>
                      {result.message}
                    </p>
                  )}
                  {result.error && (
                    <p className="text-sm text-red-600 mt-2">
                      Error: {result.error}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => runTest(result.id)}
                  disabled={result.status === 'running' || !user}
                  size="sm"
                  variant="outline"
                  className="font-['Sniglet']"
                >
                  {result.status === 'running' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    'Run'
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {!user && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-['Sniglet']">
              ⚠️ Please sign in as admin to run tests
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
