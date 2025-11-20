/**
 * Phase-Filtered Test View
 * 
 * Generic component that filters and displays tests for a specific phase.
 * Can be reused across all phase tabs in the Roadmap.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle2, XCircle, Loader2, AlertCircle, PlayCircle, FileQuestion, Copy } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useAuthContext } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface TestResult {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

interface Test {
  id: string;
  name: string;
  description: string;
  phase: string;
  category: string;
  testFn: () => Promise<{ success: boolean; message: string }>;
}

interface PhaseFilteredTestsProps {
  phase: string; // e.g., '9.1', '9.2', '10'
  title?: string; // Optional custom title
  description?: string; // Optional custom description
}

export function PhaseFilteredTests({ phase, title, description }: PhaseFilteredTestsProps) {
  const { user } = useAuthContext();
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [runningAll, setRunningAll] = useState(false);

  const runTest = async (testId: string, testFn: () => Promise<{ success: boolean; message: string }>) => {
    setTestResults(prev => ({ ...prev, [testId]: { status: 'loading' } }));
    
    try {
      const result = await testFn();
      setTestResults(prev => ({ 
        ...prev, 
        [testId]: { 
          status: result.success ? 'success' : 'error', 
          message: result.message 
        } 
      }));
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setTestResults(prev => ({ 
        ...prev, 
        [testId]: { status: 'error', message: errorMsg } 
      }));
      toast.error(errorMsg);
    }
  };

  // Define all tests for Phase 9.1
  // In the future, this could be moved to a shared test registry
  const phase91Tests: Test[] = [
    {
      id: 'phase9.1-create-evidence',
      name: 'Create Evidence Point',
      description: 'Verify evidence point creation with MIU data',
      phase: '9.1',
      category: 'Evidence',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated to create evidence' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          const testMaterialId = 'test-material-' + Date.now();
          const testSourceRef = 'test-source-' + Date.now();
          
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              material_id: testMaterialId,
              parameter_code: 'Y',
              raw_value: 85.5,
              raw_unit: '%',
              snippet: 'The yield was measured at 85.5% under standard conditions.',
              source_type: 'whitepaper',
              citation: 'Test Source 2025',
              confidence_level: 'high',
              notes: 'Test evidence point for Phase 9.1',
              page_number: 42,
              source_ref: testSourceRef,
              source_weight: 1.0,
              restricted_content: false,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to create evidence' };
          }

          const data = await response.json();
          
          if (!data.evidence || !data.evidence.id) {
            return { success: false, message: 'No evidence ID returned' };
          }

          // Store for other tests
          sessionStorage.setItem('phase91_test_evidence_id', data.evidence.id);
          sessionStorage.setItem('phase91_test_material_id', testMaterialId);
          sessionStorage.setItem('phase91_test_source_ref', testSourceRef);

          return { 
            success: true, 
            message: `Created evidence point ${data.evidence.id}` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error creating evidence: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9.1-get-evidence-by-id',
      name: 'Get Evidence Point by ID',
      description: 'Verify evidence retrieval by ID',
      phase: '9.1',
      category: 'Evidence',
      testFn: async () => {
        const evidenceId = sessionStorage.getItem('phase91_test_evidence_id');
        if (!evidenceId) {
          return { success: false, message: 'No test evidence ID found - run Create Evidence Point test first' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${evidenceId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to get evidence' };
          }

          const data = await response.json();
          
          if (!data.evidence || data.evidence.id !== evidenceId) {
            return { success: false, message: 'Evidence point not found or ID mismatch' };
          }

          return { 
            success: true, 
            message: 'Successfully retrieved evidence point' 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error retrieving evidence: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9.1-get-evidence-by-material',
      name: 'Get Evidence Points by Material',
      description: 'Verify evidence retrieval for a specific material',
      phase: '9.1',
      category: 'Evidence',
      testFn: async () => {
        const materialId = sessionStorage.getItem('phase91_test_material_id');
        if (!materialId) {
          return { success: false, message: 'No test material ID found - run Create Evidence Point test first' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/material/${materialId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to get evidence' };
          }

          const data = await response.json();
          
          if (!data.evidence || data.count !== 1) {
            return { success: false, message: `Expected 1 evidence point, got ${data.count}` };
          }

          return { 
            success: true, 
            message: `Found ${data.count} evidence point(s)` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error retrieving evidence: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9.1-update-evidence-validation',
      name: 'Update Evidence Validation',
      description: 'Verify updating validation status of evidence',
      phase: '9.1',
      category: 'Evidence',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated to update evidence' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        const evidenceId = sessionStorage.getItem('phase91_test_evidence_id');
        
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }
        
        if (!evidenceId) {
          return { success: false, message: 'No test evidence ID found - run Create Evidence Point test first' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${evidenceId}/validation`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'validated',
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to update validation' };
          }

          const data = await response.json();
          
          if (!data.evidence || data.evidence.validation_status !== 'validated') {
            return { success: false, message: 'Validation status not updated' };
          }

          return { 
            success: true, 
            message: 'Validation status updated to validated' 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error updating validation: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9.1-create-aggregation',
      name: 'Create Aggregation',
      description: 'Verify parameter aggregation creation from MIUs',
      phase: '9.1',
      category: 'Aggregation',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated to create aggregation' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        const materialId = sessionStorage.getItem('phase91_test_material_id');
        const evidenceId = sessionStorage.getItem('phase91_test_evidence_id');
        
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }
        
        if (!materialId || !evidenceId) {
          return { success: false, message: 'No test data found - run Create Evidence Point test first' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/aggregations`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              material_id: materialId,
              parameter: 'Y',
              miu_ids: [evidenceId],
              quality_threshold: 0.0,
              min_sources: 1,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to create aggregation' };
          }

          const data = await response.json();
          
          if (!data.aggregation || !data.aggregation.id) {
            return { success: false, message: 'No aggregation ID returned' };
          }

          // Store for other tests
          sessionStorage.setItem('phase91_test_aggregation_id', data.aggregation.id);

          return { 
            success: true, 
            message: `Created aggregation ${data.aggregation.id}` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error creating aggregation: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9.1-get-aggregation-by-id',
      name: 'Get Aggregation by ID',
      description: 'Verify aggregation retrieval by ID',
      phase: '9.1',
      category: 'Aggregation',
      testFn: async () => {
        const aggregationId = sessionStorage.getItem('phase91_test_aggregation_id');
        if (!aggregationId) {
          return { success: false, message: 'No test aggregation ID found - run Create Aggregation test first' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/aggregations/${aggregationId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to get aggregation' };
          }

          const data = await response.json();
          
          if (!data.aggregation || data.aggregation.id !== aggregationId) {
            return { success: false, message: 'Aggregation not found or ID mismatch' };
          }

          return { 
            success: true, 
            message: 'Successfully retrieved aggregation' 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error retrieving aggregation: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9.1-get-aggregations-by-material',
      name: 'Get Aggregations by Material',
      description: 'Verify aggregation retrieval for a specific material',
      phase: '9.1',
      category: 'Aggregation',
      testFn: async () => {
        const materialId = sessionStorage.getItem('phase91_test_material_id');
        if (!materialId) {
          return { success: false, message: 'No test material ID found - run Create Evidence Point test first' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/aggregations/material/${materialId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to get aggregations' };
          }

          const data = await response.json();
          
          if (!data.aggregations || data.count !== 1) {
            return { success: false, message: `Expected 1 aggregation, got ${data.count}` };
          }

          return { 
            success: true, 
            message: `Found ${data.count} aggregation(s)` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error retrieving aggregations: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9.1-get-aggregation-stats',
      name: 'Get Aggregation Stats',
      description: 'Verify aggregation statistics endpoint',
      phase: '9.1',
      category: 'Aggregation',
      testFn: async () => {
        const materialId = sessionStorage.getItem('phase91_test_material_id');
        if (!materialId) {
          return { success: false, message: 'No test material ID found - run Create Evidence Point test first' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/aggregations/material/${materialId}/stats`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to get stats' };
          }

          const data = await response.json();
          
          if (!data.stats || data.stats.total_parameters !== 1) {
            return { success: false, message: 'Stats not returned correctly' };
          }

          return { 
            success: true, 
            message: `Stats: ${data.stats.total_parameters} parameter(s) aggregated` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error retrieving stats: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9.1-source-can-delete-with-mius',
      name: 'Check Source Can Delete (with MIUs)',
      description: 'Verify source deletion is blocked when MIUs reference it',
      phase: '9.1',
      category: 'Referential Integrity',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated as admin to check source deletion' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        const sourceRef = sessionStorage.getItem('phase91_test_source_ref');
        if (!sourceRef) {
          return { success: false, message: 'No test source ref found - run Create Evidence Point test first' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/${sourceRef}/can-delete`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to check deletion' };
          }

          const data = await response.json();
          
          if (data.canDelete !== false || data.evidenceCount !== 1) {
            return { success: false, message: `Expected canDelete=false and evidenceCount=1, got canDelete=${data.canDelete} and evidenceCount=${data.evidenceCount}` };
          }

          return { 
            success: true, 
            message: `Correctly blocked deletion (${data.evidenceCount} evidence point)` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error checking deletion: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9.1-source-can-delete-without-mius',
      name: 'Check Source Can Delete (without MIUs)',
      description: 'Verify source deletion is allowed when no MIUs reference it',
      phase: '9.1',
      category: 'Referential Integrity',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated as admin to check source deletion' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        const nonExistentSource = 'non-existent-source-' + Date.now();

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/${nonExistentSource}/can-delete`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to check deletion' };
          }

          const data = await response.json();
          
          if (data.canDelete !== true || data.evidenceCount !== 0) {
            return { success: false, message: `Expected canDelete=true and evidenceCount=0, got canDelete=${data.canDelete} and evidenceCount=${data.evidenceCount}` };
          }

          return { 
            success: true, 
            message: 'Correctly allowed deletion (0 evidence points)' 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error checking deletion: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
  ];

  // Test registry - add new phases here
  const testRegistry: Record<string, Test[]> = {
    '9.1': phase91Tests,
    // Future phases will be added here:
    // '9.2': phase92Tests,
    // '9.3': phase93Tests,
    // '10': phase10Tests,
  };

  // Get tests for the requested phase
  const allTests = testRegistry[phase] || [];

  const runAllTests = async () => {
    setRunningAll(true);
    const testIds = allTests.map(t => t.id);
    
    for (const testId of testIds) {
      const test = allTests.find(t => t.id === testId);
      if (test) {
        await runTest(testId, test.testFn);
        // Small delay between tests to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setRunningAll(false);
    toast.success(`All Phase ${phase} tests completed`);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="size-5 text-green-600" />;
      case 'error':
        return <XCircle className="size-5 text-red-600" />;
      case 'loading':
        return <Loader2 className="size-5 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="size-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-600 hover:bg-green-700">Passed</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      case 'loading':
        return <Badge className="bg-blue-600 hover:bg-blue-700">Running...</Badge>;
      default:
        return <Badge variant="outline">Not Run</Badge>;
    }
  };

  const totalTests = allTests.length;
  const passedTests = Object.values(testResults).filter(r => r.status === 'success').length;
  const failedTests = Object.values(testResults).filter(r => r.status === 'error').length;

  const copyFailedTests = async () => {
    const failedTestData = allTests
      .filter(test => testResults[test.id]?.status === 'error')
      .map(test => {
        const result = testResults[test.id];
        return {
          Status: 'Failed',
          Phase: test.phase,
          Category: test.category,
          'Test Name': test.name,
          Description: test.description,
          Result: result.message || 'No error message'
        };
      });

    if (failedTestData.length === 0) {
      toast.error('No failed tests to copy');
      return;
    }

    // Create tab-separated text for easy pasting into spreadsheets
    const headers = ['Status', 'Phase', 'Category', 'Test Name', 'Description', 'Result'];
    const rows = failedTestData.map(test => 
      headers.map(header => test[header as keyof typeof test]).join('\t')
    );
    const text = [headers.join('\t'), ...rows].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${failedTestData.length} failed test(s) to clipboard`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Group tests by category
  const testsByCategory = allTests.reduce((acc, test) => {
    if (!acc[test.category]) {
      acc[test.category] = [];
    }
    acc[test.category].push(test);
    return acc;
  }, {} as Record<string, Test[]>);

  const categories = Object.keys(testsByCategory);

  // Empty state - no tests for this phase yet
  if (allTests.length === 0) {
    return (
      <Card className="border-2 border-dashed border-muted-foreground/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-['Sniglet']">
                {title || `Phase ${phase} Tests`}
              </CardTitle>
              <CardDescription>
                {description || 'Automated API tests for this phase'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileQuestion className="size-16 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-['Sniglet'] text-muted-foreground mb-2">
            No tests created yet
          </p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Tests for Phase {phase} will be added as backend endpoints are implemented.
            Check the unified test suite on the <strong>Tests</strong> tab for all available tests.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-[#bae1ff]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-['Sniglet']">
              {title || `Phase ${phase} Tests`}
            </CardTitle>
            <CardDescription>
              {description || 'Automated API tests for this phase'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right">
              <div className="font-['Sniglet']">
                {passedTests}/{totalTests} passed
              </div>
              {failedTests > 0 && (
                <div className="text-red-600 font-['Sniglet']">
                  {failedTests} failed
                </div>
              )}
            </div>
            <Button
              onClick={runAllTests}
              disabled={runningAll || !user}
              className="bg-[#bae1ff] hover:bg-[#9dd1ff] text-black font-['Sniglet']"
            >
              {runningAll ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <PlayCircle className="size-4 mr-2" />
                  Run All Tests
                </>
              )}
            </Button>
            {failedTests > 0 && (
              <Button
                onClick={copyFailedTests}
                variant="outline"
                size="sm"
                title="Copy failed tests to clipboard"
                className="font-['Sniglet']"
              >
                <Copy className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map(category => (
          <div key={category} className="space-y-2">
            <h3 className="font-['Sniglet'] text-sm text-muted-foreground">{category}</h3>
            <div className="space-y-2">
              {testsByCategory[category].map(test => {
                const result = testResults[test.id] || { status: 'idle' };
                return (
                  <div
                    key={test.id}
                    className="flex items-start justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(result.status)}
                      <div className="flex-1 min-w-0">
                        <div className="font-['Sniglet'] font-semibold">{test.name}</div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {test.description}
                        </div>
                        {result.message && (
                          <div className={`text-sm mt-2 ${
                            result.status === 'error' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {result.message}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(result.status)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runTest(test.id, test.testFn)}
                        disabled={result.status === 'loading' || !user}
                        className="font-['Sniglet']"
                      >
                        {result.status === 'loading' ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          'Run'
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

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
