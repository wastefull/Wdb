import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { CheckCircle2, Loader2, GitBranch, Database, AlertCircle } from 'lucide-react';
import { useNavigationContext } from '../contexts/NavigationContext';
import { useAuthContext } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

export function Phase9Day2Testing() {
  const { navigateToMathTools } = useNavigationContext();
  const { user } = useAuthContext();
  const [testResults, setTestResults] = useState<Record<string, { status: 'idle' | 'loading' | 'success' | 'error'; message?: string }>>({});

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

  const testGetAllTransforms = async () => {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/transforms`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    if (!data.transforms || !Array.isArray(data.transforms)) {
      return { success: false, message: 'Invalid response structure' };
    }

    if (data.transforms.length !== 13) {
      return { success: false, message: `Expected 13 transforms, got ${data.transforms.length}` };
    }

    return { success: true, message: `✅ Retrieved all 13 transforms (version ${data.version})` };
  };

  const testGetSpecificTransform = async () => {
    const parameter = 'Y'; // Test with Yield parameter
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/transforms/${parameter}`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    if (data.parameter !== parameter) {
      return { success: false, message: `Expected parameter ${parameter}, got ${data.parameter}` };
    }

    if (!data.formula || !data.version) {
      return { success: false, message: 'Missing required fields (formula, version)' };
    }

    return { success: true, message: `✅ Retrieved transform for ${parameter} (${data.name}, v${data.version})` };
  };

  const testCreateRecomputeJob = async () => {
    if (!user) {
      return { success: false, message: 'Must be authenticated to create recompute jobs' };
    }

    const accessToken = sessionStorage.getItem('wastedb_access_token');
    if (!accessToken) {
      return { success: false, message: 'No access token found - please sign in again' };
    }

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/transforms/recompute`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parameter: 'Y',
          newTransformVersion: '1.1',
          reason: 'Testing recompute job creation from Phase 9.0 Day 2 testing suite'
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.jobId || !data.jobId.startsWith('RJ-')) {
      return { success: false, message: 'Invalid job ID format' };
    }

    return { success: true, message: `✅ Created recompute job: ${data.jobId}` };
  };

  const testListRecomputeJobs = async () => {
    if (!user) {
      return { success: false, message: 'Must be authenticated to list recompute jobs' };
    }

    const accessToken = sessionStorage.getItem('wastedb_access_token');
    if (!accessToken) {
      return { success: false, message: 'No access token found - please sign in again' };
    }

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/transforms/recompute`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data.jobs)) {
      return { success: false, message: 'Expected array of jobs' };
    }

    return { success: true, message: `✅ Retrieved ${data.jobs.length} recompute job(s)` };
  };

  const getStatusIcon = (status: 'idle' | 'loading' | 'success' | 'error') => {
    switch (status) {
      case 'loading':
        return <Loader2 className="size-4 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle2 className="size-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="size-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <GitBranch className="size-8 text-purple-600" />
            <div>
              <CardTitle>Testing Overview</CardTitle>
              <CardDescription>
                Transform Governance & Versioning System
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">✅ Transforms API Complete</Badge>
            <Badge variant="outline">✅ Recompute System Complete</Badge>
            <Badge variant="outline">✅ Version Manager UI Complete</Badge>
          </div>

          <Alert>
            <Database className="size-4" />
            <AlertDescription>
              <strong>What's being tested:</strong> The transform governance system including
              versioned transform definitions for all 13 parameters, recompute job creation,
              and API endpoints for transform management.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="font-semibold">🧪 Test Scenarios</h3>

            {/* Test 1: Get All Transforms */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Test 1: Retrieve All Transforms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>What it tests:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>GET /transforms endpoint</li>
                    <li>All 13 parameter definitions exist</li>
                    <li>Proper JSON structure with version info</li>
                  </ul>
                </div>
                <div className="text-sm space-y-2">
                  <p><strong>Expected Result:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>✅ Returns version 1.0</li>
                    <li>✅ Contains all 13 transforms (Y, D, C, M, E, B, N, T, H, L, R, U, C_RU)</li>
                    <li>✅ Each transform has formula, dimension, units</li>
                  </ul>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => runTest('getAllTransforms', testGetAllTransforms)}
                    disabled={testResults.getAllTransforms?.status === 'loading'}
                  >
                    {testResults.getAllTransforms?.status === 'loading' && <Loader2 className="size-4 mr-2 animate-spin" />}
                    Run Test
                  </Button>
                  {testResults.getAllTransforms && (
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.getAllTransforms.status)}
                      {testResults.getAllTransforms.message && (
                        <span className="text-sm">{testResults.getAllTransforms.message}</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Test 2: Get Specific Transform */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Test 2: Retrieve Specific Transform (Y - Yield)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>What it tests:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>GET /transforms/:parameter endpoint</li>
                    <li>Parameter-specific transform retrieval</li>
                    <li>Individual transform structure</li>
                  </ul>
                </div>
                <div className="text-sm space-y-2">
                  <p><strong>Expected Result:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>✅ Returns Yield (Y) transform definition</li>
                    <li>✅ Contains formula: "value / 100"</li>
                    <li>✅ Shows version, dimension (CR), units (% → ratio)</li>
                  </ul>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => runTest('getSpecificTransform', testGetSpecificTransform)}
                    disabled={testResults.getSpecificTransform?.status === 'loading'}
                  >
                    {testResults.getSpecificTransform?.status === 'loading' && <Loader2 className="size-4 mr-2 animate-spin" />}
                    Run Test
                  </Button>
                  {testResults.getSpecificTransform && (
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.getSpecificTransform.status)}
                      {testResults.getSpecificTransform.message && (
                        <span className="text-sm">{testResults.getSpecificTransform.message}</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Test 3: Create Recompute Job */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Test 3: Create Recompute Job</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>What it tests:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>POST /transforms/recompute endpoint</li>
                    <li>Recompute job creation and ID generation</li>
                    <li>Admin authentication check</li>
                  </ul>
                </div>
                <div className="text-sm space-y-2">
                  <p><strong>Expected Result:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>✅ Creates job with ID format: RJ-{'{timestamp}'}-{'{uuid}'}</li>
                    <li>✅ Stores job in KV store</li>
                    <li>✅ Returns estimated duration info</li>
                  </ul>
                </div>
                {!user && (
                  <Alert>
                    <AlertCircle className="size-4" />
                    <AlertDescription>
                      ⚠️ You must be signed in to test this endpoint
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => runTest('createRecomputeJob', testCreateRecomputeJob)}
                    disabled={testResults.createRecomputeJob?.status === 'loading' || !user}
                  >
                    {testResults.createRecomputeJob?.status === 'loading' && <Loader2 className="size-4 mr-2 animate-spin" />}
                    Run Test
                  </Button>
                  {testResults.createRecomputeJob && (
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.createRecomputeJob.status)}
                      {testResults.createRecomputeJob.message && (
                        <span className="text-sm">{testResults.createRecomputeJob.message}</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Test 4: List Recompute Jobs */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Test 4: List All Recompute Jobs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>What it tests:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>GET /transforms/recompute endpoint</li>
                    <li>Job history retrieval</li>
                    <li>KV store prefix query</li>
                  </ul>
                </div>
                <div className="text-sm space-y-2">
                  <p><strong>Expected Result:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>✅ Returns array of all recompute jobs</li>
                    <li>✅ Jobs sorted by creation date (newest first)</li>
                    <li>✅ Each job includes status, timestamps, parameter info</li>
                  </ul>
                </div>
                {!user && (
                  <Alert>
                    <AlertCircle className="size-4" />
                    <AlertDescription>
                      ⚠️ You must be signed in to test this endpoint
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => runTest('listRecomputeJobs', testListRecomputeJobs)}
                    disabled={testResults.listRecomputeJobs?.status === 'loading' || !user}
                  >
                    {testResults.listRecomputeJobs?.status === 'loading' && <Loader2 className="size-4 mr-2 animate-spin" />}
                    Run Test
                  </Button>
                  {testResults.listRecomputeJobs && (
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.listRecomputeJobs.status)}
                      {testResults.listRecomputeJobs.message && (
                        <span className="text-sm">{testResults.listRecomputeJobs.message}</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Test 5: UI Navigation */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Test 5: Transform Version Manager UI</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>What it tests:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Navigation to Transform Manager</li>
                    <li>Transform overview display</li>
                    <li>Recompute dialog functionality</li>
                    <li>Job history viewing</li>
                  </ul>
                </div>
                <div className="text-sm space-y-2">
                  <p><strong>Steps:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Click "Open Transform Manager" button below</li>
                    <li>Verify all 13 transforms are displayed in cards</li>
                    <li>Click on any transform card to open recompute dialog</li>
                    <li>Enter new version number (e.g., "1.1") and reason</li>
                    <li>Submit to create a recompute job</li>
                    <li>Verify job appears in history section below</li>
                  </ol>
                </div>
                <div className="text-sm space-y-2">
                  <p><strong>Expected Result:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>✅ Transforms grouped by dimension (CR, CC, RU)</li>
                    <li>✅ Color-coded badges (blue, green, purple)</li>
                    <li>✅ Recompute dialog with validation</li>
                    <li>✅ Jobs appear in history with status indicators</li>
                  </ul>
                </div>
                <Button onClick={() => navigateToMathTools('transform-manager')}>
                  Open Transform Manager
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}