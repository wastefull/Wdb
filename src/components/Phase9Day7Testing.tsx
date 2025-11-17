import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, CheckCircle2, XCircle, Clock, Play, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useAuthContext } from '../contexts/AuthContext';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  duration?: number;
}

export function Phase9Day7Testing() {
  const { accessToken } = useAuthContext();
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Test 1: Fetch retention statistics', status: 'pending' },
    { name: 'Test 2: Check source referential integrity (can delete)', status: 'pending' },
    { name: 'Test 3: Check source referential integrity (cannot delete)', status: 'pending' },
    { name: 'Test 4: Delete source without evidence (should succeed)', status: 'pending' },
    { name: 'Test 5: Try to delete source with evidence (should fail)', status: 'pending' },
    { name: 'Test 6: Clean up expired screenshots', status: 'pending' },
  ]);
  const [running, setRunning] = useState(false);
  const [testSourceId, setTestSourceId] = useState<string | null>(null);
  const [testSourceWithEvidenceId, setTestSourceWithEvidenceId] = useState<string | null>(null);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => {
      const newTests = [...prev];
      newTests[index] = { ...newTests[index], ...updates };
      return newTests;
    });
  };

  const runAllTests = async () => {
    setRunning(true);
    
    // Reset all tests
    setTests(prev => prev.map(test => ({ ...test, status: 'pending', message: undefined, duration: undefined })));
    
    // Run each test sequentially, passing IDs between tests
    await runTest1();
    const sourceId = await runTest2();
    const sourceWithEvidenceId = await runTest3();
    await runTest4(sourceId);
    await runTest5(sourceWithEvidenceId);
    await runTest6();
    
    setRunning(false);
  };

  // Test 1: Fetch retention statistics
  const runTest1 = async () => {
    const index = 0;
    updateTest(index, { status: 'running' });
    const startTime = Date.now();

    try {
      const token = sessionStorage.getItem('wastedb_access_token') || accessToken;
      if (!token) {
        throw new Error('Not authenticated - please sign in as admin');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/admin/retention/stats`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch stats');
      }

      const data = await response.json();
      const duration = Date.now() - startTime;

      if (data.stats && typeof data.stats.screenshots === 'object' && typeof data.stats.auditLogs === 'object') {
        updateTest(index, {
          status: 'passed',
          message: `✅ Retrieved stats: ${data.stats.screenshots.total} screenshots, ${data.stats.auditLogs.total} audit logs`,
          duration,
        });
      } else {
        throw new Error('Invalid stats structure');
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTest(index, {
        status: 'failed',
        message: `❌ ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration,
      });
    }
  };

  // Test 2: Check source referential integrity (can delete - no evidence)
  const runTest2 = async () => {
    const index = 1;
    updateTest(index, { status: 'running' });
    const startTime = Date.now();

    try {
      const token = sessionStorage.getItem('wastedb_access_token') || accessToken;
      if (!token) {
        throw new Error('Not authenticated - please sign in as admin');
      }

      // First, create a test source without evidence
      const createResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Source for Deletion (No Evidence)',
            type: 'internal',
            authors: 'Test Author',
          }),
        }
      );

      if (!createResponse.ok) {
        throw new Error('Failed to create test source');
      }

      const createData = await createResponse.json();
      const sourceId = createData.source.id;
      setTestSourceId(sourceId);

      // Now check referential integrity
      const checkResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/admin/retention/check-source/${sourceId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!checkResponse.ok) {
        const error = await checkResponse.json();
        throw new Error(error.error || 'Failed to check integrity');
      }

      const checkData = await checkResponse.json();
      const duration = Date.now() - startTime;

      if (checkData.canDelete === true && checkData.dependentCount === 0) {
        updateTest(index, {
          status: 'passed',
          message: `✅ Source can be deleted (0 dependent evidence)`,
          duration,
        });
      } else {
        throw new Error(`Expected canDelete=true with 0 evidence, got canDelete=${checkData.canDelete} with ${checkData.dependentCount} evidence`);
      }

      return sourceId;
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTest(index, {
        status: 'failed',
        message: `❌ ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration,
      });
    }
  };

  // Test 3: Check source referential integrity (cannot delete - has evidence)
  const runTest3 = async () => {
    const index = 2;
    updateTest(index, { status: 'running' });
    const startTime = Date.now();

    try {
      const token = sessionStorage.getItem('wastedb_access_token') || accessToken;
      if (!token) {
        throw new Error('Not authenticated - please sign in as admin');
      }

      // First, create a test source
      const createSourceResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Source with Evidence (Cannot Delete)',
            type: 'internal',
            authors: 'Test Author',
          }),
        }
      );

      if (!createSourceResponse.ok) {
        throw new Error('Failed to create test source');
      }

      const sourceData = await createSourceResponse.json();
      const sourceId = sourceData.source.id;
      setTestSourceWithEvidenceId(sourceId);

      // Create a test evidence point directly via KV store (since POST /evidence doesn't support source_id yet)
      // We'll create a minimal evidence record with source_id to test referential integrity
      const evidenceId = `evidence_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const testEvidence = {
        id: evidenceId,
        material_id: 'test-material-retention',
        parameter_code: 'Y',
        source_id: sourceId, // This is the key field for referential integrity
        snippet: 'Test snippet for referential integrity check',
        citation: `Source: ${sourceId}`,
        confidence_level: 'high',
        created_at: new Date().toISOString(),
      };

      // Store directly in KV via a custom endpoint (we need to create this)
      // For now, let's try using the server to store it
      const storeEvidenceResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/admin/retention/test-evidence`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            evidenceId,
            sourceId,
            materialId: 'test-material-retention',
          }),
        }
      );

      if (!storeEvidenceResponse.ok) {
        const errorText = await storeEvidenceResponse.text();
        throw new Error(`Failed to create test evidence: ${errorText}`);
      }

      // Now check referential integrity
      const checkResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/admin/retention/check-source/${sourceId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!checkResponse.ok) {
        const error = await checkResponse.json();
        throw new Error(error.error || 'Failed to check integrity');
      }

      const checkData = await checkResponse.json();
      const duration = Date.now() - startTime;

      if (checkData.canDelete === false && checkData.dependentCount >= 1) {
        updateTest(index, {
          status: 'passed',
          message: `✅ Source cannot be deleted (${checkData.dependentCount} dependent evidence)`,
          duration,
        });
      } else {
        throw new Error(`Expected canDelete=false with >=1 evidence, got canDelete=${checkData.canDelete} with ${checkData.dependentCount} evidence`);
      }

      return sourceId;
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTest(index, {
        status: 'failed',
        message: `❌ ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration,
      });
    }
  };

  // Test 4: Delete source without evidence (should succeed)
  const runTest4 = async (sourceId: string | null) => {
    const index = 3;
    updateTest(index, { status: 'running' });
    const startTime = Date.now();

    if (!sourceId) {
      updateTest(index, {
        status: 'failed',
        message: '❌ No test source ID available (Test 2 may have failed)',
      });
      return;
    }

    try {
      const token = sessionStorage.getItem('wastedb_access_token') || accessToken;
      if (!token) {
        throw new Error('Not authenticated - please sign in as admin');
      }

      const deleteResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/${sourceId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const duration = Date.now() - startTime;

      if (deleteResponse.ok) {
        const data = await deleteResponse.json();
        if (data.success === true) {
          updateTest(index, {
            status: 'passed',
            message: `✅ Source deleted successfully (no evidence blocked deletion)`,
            duration,
          });
        } else {
          throw new Error('Delete succeeded but response did not contain success:true');
        }
      } else {
        const error = await deleteResponse.json();
        throw new Error(error.error || 'Delete failed unexpectedly');
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTest(index, {
        status: 'failed',
        message: `❌ ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration,
      });
    }
  };

  // Test 5: Try to delete source with evidence (should fail)
  const runTest5 = async (sourceId: string | null) => {
    const index = 4;
    updateTest(index, { status: 'running' });
    const startTime = Date.now();

    if (!sourceId) {
      updateTest(index, {
        status: 'failed',
        message: '❌ No test source ID available (Test 3 may have failed)',
      });
      return;
    }

    try {
      const token = sessionStorage.getItem('wastedb_access_token') || accessToken;
      if (!token) {
        throw new Error('Not authenticated - please sign in as admin');
      }

      const deleteResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/${sourceId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const duration = Date.now() - startTime;

      if (!deleteResponse.ok) {
        const error = await deleteResponse.json();
        if (error.error === 'Cannot delete source with dependent evidence' && error.dependentCount >= 1) {
          updateTest(index, {
            status: 'passed',
            message: `✅ Delete correctly blocked (${error.dependentCount} dependent evidence)`,
            duration,
          });
        } else {
          throw new Error(`Expected referential integrity error, got: ${error.error}`);
        }
      } else {
        throw new Error('Delete succeeded when it should have been blocked by referential integrity');
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTest(index, {
        status: 'failed',
        message: `❌ ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration,
      });
    }
  };

  // Test 6: Clean up expired screenshots
  const runTest6 = async () => {
    const index = 5;
    updateTest(index, { status: 'running' });
    const startTime = Date.now();

    try {
      const token = sessionStorage.getItem('wastedb_access_token') || accessToken;
      if (!token) {
        throw new Error('Not authenticated - please sign in as admin');
      }

      const cleanupResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/admin/retention/cleanup-screenshots`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!cleanupResponse.ok) {
        const error = await cleanupResponse.json();
        throw new Error(error.error || 'Failed to clean up screenshots');
      }

      const data = await cleanupResponse.json();
      const duration = Date.now() - startTime;

      if (data.success === true && typeof data.cleanedCount === 'number') {
        updateTest(index, {
          status: 'passed',
          message: `✅ Cleanup successful: ${data.cleanedCount} screenshot(s) removed`,
          duration,
        });
      } else {
        throw new Error('Invalid cleanup response structure');
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTest(index, {
        status: 'failed',
        message: `❌ ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration,
      });
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="size-4 text-gray-400" />;
      case 'running':
        return <Loader2 className="size-4 animate-spin text-blue-500" />;
      case 'passed':
        return <CheckCircle2 className="size-4 text-green-500" />;
      case 'failed':
        return <XCircle className="size-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-gray-500 border-gray-300">Pending</Badge>;
      case 'running':
        return <Badge variant="outline" className="text-blue-600 border-blue-300">Running</Badge>;
      case 'passed':
        return <Badge variant="outline" className="text-green-600 border-green-300">Passed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="text-red-600 border-red-300">Failed</Badge>;
    }
  };

  const allTestsPassed = tests.every(t => t.status === 'passed');
  const anyTestsFailed = tests.some(t => t.status === 'failed');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="font-['Fredoka_One'] text-[24px] text-black dark:text-white mb-2">
          Day 7: Data Retention & Deletion Tests
        </h2>
        <p className="font-['Sniglet'] text-[12px] text-black/60 dark:text-white/60">
          Testing referential integrity, retention statistics, and cleanup functionality
        </p>
      </div>

      {/* Run All Tests Button */}
      <div className="mb-6">
        <Button
          onClick={runAllTests}
          disabled={running}
          className="gap-2"
          size="lg"
        >
          {running ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Play className="size-4" />
              Run All Tests
            </>
          )}
        </Button>
      </div>

      {/* Overall Status */}
      {!running && (allTestsPassed || anyTestsFailed) && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            {allTestsPassed ? (
              <div className="flex items-center gap-3 text-green-600">
                <CheckCircle2 className="size-6" />
                <div>
                  <p className="font-['Fredoka_One'] text-[16px]">All Tests Passed! ✅</p>
                  <p className="font-['Sniglet'] text-[11px] text-black/60">
                    Data retention and deletion system is working correctly
                  </p>
                </div>
              </div>
            ) : anyTestsFailed ? (
              <div className="flex items-center gap-3 text-red-600">
                <XCircle className="size-6" />
                <div>
                  <p className="font-['Fredoka_One'] text-[16px]">Some Tests Failed</p>
                  <p className="font-['Sniglet'] text-[11px] text-black/60">
                    Check the test results below for details
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      <div className="space-y-3">
        {tests.map((test, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <span className="font-['Sniglet'] text-[13px]">{test.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {test.duration && (
                    <span className="font-['Sniglet'] text-[10px] text-black/50">
                      {test.duration}ms
                    </span>
                  )}
                  {getStatusBadge(test.status)}
                </div>
              </CardTitle>
            </CardHeader>
            {test.message && (
              <CardContent className="pt-0">
                <p className="font-['Sniglet'] text-[11px] text-black/70 dark:text-white/70">
                  {test.message}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="size-5" />
            <span className="font-['Sniglet'] text-[14px]">What's Being Tested</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <p className="font-['Sniglet'] text-[12px]">
              <strong>Referential Integrity:</strong> Sources with evidence points cannot be deleted
            </p>
            <p className="font-['Sniglet'] text-[12px]">
              <strong>Retention Statistics:</strong> System tracks screenshots and audit logs exceeding 7-year retention
            </p>
            <p className="font-['Sniglet'] text-[12px]">
              <strong>Cleanup Functionality:</strong> Expired screenshots can be removed via admin UI
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}