import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { CheckCircle2, Loader2, Copy, AlertTriangle, FileSearch } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

export function Phase9Day5Testing() {
  const { user } = useAuthContext();
  const [testResults, setTestResults] = useState<Record<string, { status: 'idle' | 'loading' | 'success' | 'error'; message?: string; data?: any }>>({});

  const runTest = async (testId: string, testFn: () => Promise<{ success: boolean; message: string; data?: any }>) => {
    setTestResults(prev => ({ ...prev, [testId]: { status: 'loading' } }));
    
    try {
      const result = await testFn();
      setTestResults(prev => ({ 
        ...prev, 
        [testId]: { 
          status: result.success ? 'success' : 'error', 
          message: result.message,
          data: result.data
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

  // Test 1: DOI Normalization
  const testDOINormalization = async () => {
    const testDOIs = [
      'https://doi.org/10.1234/example',
      'http://dx.doi.org/10.1234/example',
      'doi:10.1234/example',
      '10.1234/example',
      'DOI: 10.1234/example',
    ];

    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/normalize-doi`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dois: testDOIs }),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        message: `DOI normalization failed: ${error}`,
      };
    }

    const result = await response.json();
    const allMatch = result.normalized.every((norm: string) => norm === '10.1234/example');

    return {
      success: allMatch,
      message: allMatch 
        ? `✅ All ${testDOIs.length} DOI formats normalized correctly to: 10.1234/example`
        : `❌ DOI normalization inconsistent: ${JSON.stringify(result.normalized)}`,
      data: result,
    };
  };

  // Test 2: Check for Duplicate (DOI Match)
  const testDOIDuplicateCheck = async () => {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/check-duplicate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doi: '10.1126/science.1234567',
        title: 'Sample Paper Title',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        message: `Duplicate check failed: ${error}`,
      };
    }

    const result = await response.json();

    return {
      success: true,
      message: result.isDuplicate 
        ? `⚠️ Duplicate detected! Match type: ${result.matchType} (confidence: ${result.confidence}%)`
        : `✅ No duplicates found for DOI: 10.1126/science.1234567`,
      data: result,
    };
  };

  // Test 3: Fuzzy Title Match
  const testFuzzyTitleMatch = async () => {
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/check-duplicate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Life Cycle Assessment of Plastic Materials',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        message: `Fuzzy match failed: ${error}`,
      };
    }

    const result = await response.json();

    return {
      success: true,
      message: result.isDuplicate 
        ? `⚠️ Similar title found! Match: "${result.existingSource?.title}" (${result.similarity}% similar)`
        : `✅ No similar titles found. Safe to add.`,
      data: result,
    };
  };

  // Test 4: Create Test Source (for merge testing)
  const testCreateSource = async () => {
    if (!user) {
      return { success: false, message: 'Must be authenticated to create sources' };
    }

    const accessToken = sessionStorage.getItem('wastedb_access_token');
    if (!accessToken) {
      return { success: false, message: 'No access token found - please sign in again' };
    }

    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Source for Deduplication',
        authors: 'Test Author',
        year: 2024,
        type: 'peer-reviewed',
        doi: '10.9999/test.dedup',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        message: `Source creation failed: ${error}`,
      };
    }

    const result = await response.json();

    return {
      success: true,
      message: `✅ Test source created with ID: ${result.source?.id || result.id}`,
      data: result,
    };
  };

  // Test 5: Merge Duplicate Sources
  const testMergeSources = async () => {
    if (!user) {
      return { success: false, message: 'Must be authenticated to merge sources' };
    }

    const accessToken = sessionStorage.getItem('wastedb_access_token');
    if (!accessToken) {
      return { success: false, message: 'No access token found - please sign in again' };
    }

    // Step 1: Create primary source
    const primaryResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Primary Source for Merge Test',
        authors: 'Smith, J.',
        year: 2024,
        type: 'peer-reviewed',
        doi: '10.9999/merge.primary',
      }),
    });

    if (!primaryResponse.ok) {
      const error = await primaryResponse.text();
      return { success: false, message: `Failed to create primary source: ${error}` };
    }

    const primaryResult = await primaryResponse.json();
    const primarySourceId = primaryResult.source?.id;

    // Step 2: Create duplicate source
    const duplicateResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Duplicate Source for Merge Test',
        authors: 'Smith, J.',
        year: 2024,
        type: 'peer-reviewed',
        doi: '10.9999/merge.duplicate',
      }),
    });

    if (!duplicateResponse.ok) {
      const error = await duplicateResponse.text();
      return { success: false, message: `Failed to create duplicate source: ${error}` };
    }

    const duplicateResult = await duplicateResponse.json();
    const duplicateSourceId = duplicateResult.source?.id;

    // Step 3: Create a test evidence point that references the duplicate
    const evidenceResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        material_id: 'test-material-123',
        parameter_code: 'Y',
        source_id: duplicateSourceId,
        source_type: 'external',
        raw_value: 75,
        confidence_level: 'high',
        notes: 'Test evidence for merge',
      }),
    });

    let evidenceCreated = evidenceResponse.ok;

    // Step 4: Merge the sources
    const mergeResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/merge`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        primarySourceId,
        duplicateSourceId,
      }),
    });

    if (!mergeResponse.ok) {
      const error = await mergeResponse.text();
      return {
        success: false,
        message: `Merge failed: ${error}`,
      };
    }

    const result = await mergeResponse.json();

    return {
      success: true,
      message: `✅ Sources merged successfully! Primary: ${primarySourceId}, Duplicate: ${duplicateSourceId}. ${result.miusMigrated || 0} evidence point(s) migrated.`,
      data: result,
    };
  };

  const getStatusIcon = (status: 'idle' | 'loading' | 'success' | 'error') => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <FileSearch className="h-4 w-4 text-gray-400" />;
    }
  };

  const tests = [
    {
      id: 'test1',
      title: 'Test 1: DOI Normalization',
      description: 'Normalize various DOI formats to canonical form',
      action: testDOINormalization,
      icon: <Copy className="h-5 w-5" />,
    },
    {
      id: 'test2',
      title: 'Test 2: DOI Duplicate Check',
      description: 'Check if a DOI already exists in the source library',
      action: testDOIDuplicateCheck,
      icon: <FileSearch className="h-5 w-5" />,
    },
    {
      id: 'test3',
      title: 'Test 3: Fuzzy Title Matching',
      description: 'Detect similar titles using Levenshtein distance',
      action: testFuzzyTitleMatch,
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    {
      id: 'test4',
      title: 'Test 4: Create Test Source',
      description: 'Create a test source for merge testing',
      action: testCreateSource,
      icon: <CheckCircle2 className="h-5 w-5" />,
      requiresAuth: true,
    },
    {
      id: 'test5',
      title: 'Test 5: Merge Duplicate Sources',
      description: 'Merge two duplicate sources and migrate MIU references',
      action: testMergeSources,
      icon: <CheckCircle2 className="h-5 w-5" />,
      requiresAuth: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-['Sniglet'] text-[14px] text-blue-900 dark:text-blue-100 mb-2">
          Phase 9.0 Day 5: Source Deduplication Testing
        </h3>
        <p className="font-['Sniglet'] text-[12px] text-blue-700 dark:text-blue-300">
          Test DOI normalization, duplicate detection, fuzzy title matching, and source merging workflows.
        </p>
      </div>

      {!user && (
        <Alert>
          <AlertDescription className="font-['Sniglet'] text-[12px]">
            ⚠️ Some tests require authentication. Please sign in as an admin to run all tests.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {tests.map((test) => {
          const result = testResults[test.id];
          const isDisabled = test.requiresAuth && !user;

          return (
            <Card key={test.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{test.icon}</div>
                    <div>
                      <CardTitle className="font-['Sniglet'] text-[14px]">
                        {test.title}
                      </CardTitle>
                      <CardDescription className="font-['Sniglet'] text-[12px] mt-1">
                        {test.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result?.status || 'idle')}
                    <Button
                      size="sm"
                      onClick={() => runTest(test.id, test.action)}
                      disabled={result?.status === 'loading' || isDisabled}
                      className="font-['Sniglet'] text-[12px]"
                    >
                      {result?.status === 'loading' ? 'Running...' : 'Run Test'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {result?.message && (
                <CardContent>
                  <Alert className={result.status === 'success' ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : 'border-red-200 bg-red-50 dark:bg-red-950/20'}>
                    <AlertDescription className="font-['Sniglet'] text-[12px]">
                      {result.message}
                    </AlertDescription>
                  </Alert>
                  {result.data && (
                    <details className="mt-2">
                      <summary className="font-['Sniglet'] text-[12px] cursor-pointer text-blue-600 dark:text-blue-400">
                        View Response Data
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-[10px] overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
        <CardHeader>
          <CardTitle className="font-['Sniglet'] text-[14px] text-yellow-900 dark:text-yellow-100">
            📋 Test Sequence Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="font-['Sniglet'] text-[12px] text-yellow-800 dark:text-yellow-200">
            <strong>1.</strong> Run Test 1 to verify DOI normalization works correctly
          </p>
          <p className="font-['Sniglet'] text-[12px] text-yellow-800 dark:text-yellow-200">
            <strong>2.</strong> Run Test 2 to check DOI duplicate detection
          </p>
          <p className="font-['Sniglet'] text-[12px] text-yellow-800 dark:text-yellow-200">
            <strong>3.</strong> Run Test 3 to verify fuzzy title matching
          </p>
          <p className="font-['Sniglet'] text-[12px] text-yellow-800 dark:text-yellow-200">
            <strong>4.</strong> Run Test 4 to create a test source (requires admin)
          </p>
          <p className="font-['Sniglet'] text-[12px] text-yellow-800 dark:text-yellow-200">
            <strong>5.</strong> Run Test 5 to test source merging (requires admin)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}