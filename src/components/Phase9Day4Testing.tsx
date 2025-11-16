import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { CheckCircle2, Loader2, Database, FileText, Shield, Activity } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

export function Phase9Day4Testing() {
  const { user } = useAuthContext();
  const [testResults, setTestResults] = useState<Record<string, { status: 'idle' | 'loading' | 'success' | 'error'; message?: string }>>({});
  const [createdEvidenceId, setCreatedEvidenceId] = useState<string | null>(null);

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

  // Test 1: Create Evidence Point
  const testCreateEvidence = async () => {
    if (!user) {
      return { success: false, message: 'Must be authenticated to create evidence points' };
    }

    const accessToken = sessionStorage.getItem('wastedb_access_token');
    if (!accessToken) {
      return { success: false, message: 'No access token found - please sign in again' };
    }

    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        material_id: 'test-material-1',
        parameter_code: 'Y',
        raw_value: 85,
        raw_unit: '%',
        snippet: 'Test snippet for evidence collection system validation',
        source_type: 'manual',
        citation: 'Test Citation for Phase 9.1 Day 4',
        confidence_level: 'high',
        notes: 'Test evidence created from Phase9Day4Testing component',
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      setCreatedEvidenceId(data.evidenceId);
      return { 
        success: true, 
        message: `Evidence created successfully! ID: ${data.evidenceId}` 
      };
    } else {
      return { 
        success: false, 
        message: data.error || 'Failed to create evidence' 
      };
    }
  };

  // Test 2: Get Evidence by Material
  const testGetEvidenceByMaterial = async () => {
    if (!createdEvidenceId) {
      return {
        success: false,
        message: 'Please create evidence first (Test 1)',
      };
    }

    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/material/test-material-1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    const data = await response.json();
    
    if (response.ok && data.evidence && data.evidence.length > 0) {
      return { 
        success: true, 
        message: `Found ${data.evidence.length} evidence point(s) for material` 
      };
    } else {
      return { 
        success: false, 
        message: 'Failed to retrieve evidence by material' 
      };
    }
  };

  // Test 3: Get Single Evidence Point
  const testGetSingleEvidence = async () => {
    if (!createdEvidenceId) {
      return {
        success: false,
        message: 'Please create evidence first (Test 1)',
      };
    }

    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${createdEvidenceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    const data = await response.json();
    
    if (response.ok && data.evidence) {
      return { 
        success: true, 
        message: `Retrieved evidence: ${data.evidence.parameter_code} = ${data.evidence.raw_value}${data.evidence.raw_unit}` 
      };
    } else {
      return { 
        success: false, 
        message: 'Failed to retrieve single evidence point' 
      };
    }
  };

  // Test 4: Update Evidence Point
  const testUpdateEvidence = async () => {
    if (!createdEvidenceId) {
      return {
        success: false,
        message: 'Please create evidence first (Test 1)',
      };
    }

    if (!user) {
      return { success: false, message: 'Must be authenticated to update evidence points' };
    }

    const accessToken = sessionStorage.getItem('wastedb_access_token');
    if (!accessToken) {
      return { success: false, message: 'No access token found - please sign in again' };
    }

    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${createdEvidenceId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw_value: 90,
        notes: 'Updated by Phase9Day4Testing - value changed from 85 to 90',
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      return { 
        success: true, 
        message: 'Evidence updated successfully! Value changed to 90' 
      };
    } else {
      return { 
        success: false, 
        message: data.error || 'Failed to update evidence' 
      };
    }
  };

  // Test 5: Delete Evidence Point
  const testDeleteEvidence = async () => {
    if (!createdEvidenceId) {
      return {
        success: false,
        message: 'Please create evidence first (Test 1)',
      };
    }

    if (!user) {
      return { success: false, message: 'Must be authenticated to delete evidence points' };
    }

    const accessToken = sessionStorage.getItem('wastedb_access_token');
    if (!accessToken) {
      return { success: false, message: 'No access token found - please sign in again' };
    }

    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${createdEvidenceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      setCreatedEvidenceId(null); // Reset for future tests
      return { 
        success: true, 
        message: 'Evidence deleted successfully!' 
      };
    } else {
      return { 
        success: false, 
        message: data.error || 'Failed to delete evidence' 
      };
    }
  };

  const getStatusIcon = (status: 'idle' | 'loading' | 'success' | 'error') => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'error':
        return <Badge variant="destructive" className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          <strong>Phase 9.1 Day 4 Testing Suite</strong> - Test the Evidence Point Collection System with 5 CRUD endpoints
        </AlertDescription>
      </Alert>

      {!user && (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to test evidence endpoints (admin role required for write operations)
          </AlertDescription>
        </Alert>
      )}

      {/* Test 1: Create Evidence */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle className="font-['Sniglet'] text-[14px]">Test 1: Create Evidence Point</CardTitle>
            </div>
            {getStatusIcon(testResults['create']?.status || 'idle')}
          </div>
          <CardDescription className="font-['Sniglet'] text-[12px]">
            POST /evidence - Creates a new evidence point with validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => runTest('create', testCreateEvidence)}
            disabled={testResults['create']?.status === 'loading' || !user}
            className="font-['Sniglet'] text-[12px]"
          >
            {testResults['create']?.status === 'loading' ? 'Testing...' : 'Run Test'}
          </Button>
          {testResults['create']?.message && (
            <p className="mt-2 font-['Sniglet'] text-[11px] text-black/60 dark:text-white/60">
              {testResults['create'].message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Test 2: Get Evidence by Material */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle className="font-['Sniglet'] text-[14px]">Test 2: Get Evidence by Material</CardTitle>
            </div>
            {getStatusIcon(testResults['getMaterial']?.status || 'idle')}
          </div>
          <CardDescription className="font-['Sniglet'] text-[12px]">
            GET /evidence/material/:materialId - Retrieves all evidence for a material
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => runTest('getMaterial', testGetEvidenceByMaterial)}
            disabled={testResults['getMaterial']?.status === 'loading' || !createdEvidenceId || !user}
            className="font-['Sniglet'] text-[12px]"
          >
            {testResults['getMaterial']?.status === 'loading' ? 'Testing...' : 'Run Test'}
          </Button>
          {testResults['getMaterial']?.message && (
            <p className="mt-2 font-['Sniglet'] text-[11px] text-black/60 dark:text-white/60">
              {testResults['getMaterial'].message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Test 3: Get Single Evidence */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle className="font-['Sniglet'] text-[14px]">Test 3: Get Single Evidence Point</CardTitle>
            </div>
            {getStatusIcon(testResults['getSingle']?.status || 'idle')}
          </div>
          <CardDescription className="font-['Sniglet'] text-[12px]">
            GET /evidence/:evidenceId - Retrieves a specific evidence point by ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => runTest('getSingle', testGetSingleEvidence)}
            disabled={testResults['getSingle']?.status === 'loading' || !createdEvidenceId || !user}
            className="font-['Sniglet'] text-[12px]"
          >
            {testResults['getSingle']?.status === 'loading' ? 'Testing...' : 'Run Test'}
          </Button>
          {testResults['getSingle']?.message && (
            <p className="mt-2 font-['Sniglet'] text-[11px] text-black/60 dark:text-white/60">
              {testResults['getSingle'].message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Test 4: Update Evidence */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle className="font-['Sniglet'] text-[14px]">Test 4: Update Evidence Point</CardTitle>
            </div>
            {getStatusIcon(testResults['update']?.status || 'idle')}
          </div>
          <CardDescription className="font-['Sniglet'] text-[12px]">
            PUT /evidence/:evidenceId - Updates an existing evidence point (admin only)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => runTest('update', testUpdateEvidence)}
            disabled={testResults['update']?.status === 'loading' || !createdEvidenceId || !user}
            className="font-['Sniglet'] text-[12px]"
          >
            {testResults['update']?.status === 'loading' ? 'Testing...' : 'Run Test'}
          </Button>
          {testResults['update']?.message && (
            <p className="mt-2 font-['Sniglet'] text-[11px] text-black/60 dark:text-white/60">
              {testResults['update'].message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Test 5: Delete Evidence */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle className="font-['Sniglet'] text-[14px]">Test 5: Delete Evidence Point</CardTitle>
            </div>
            {getStatusIcon(testResults['delete']?.status || 'idle')}
          </div>
          <CardDescription className="font-['Sniglet'] text-[12px]">
            DELETE /evidence/:evidenceId - Deletes an evidence point (admin only)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => runTest('delete', testDeleteEvidence)}
            disabled={testResults['delete']?.status === 'loading' || !createdEvidenceId || !user}
            variant="destructive"
            className="font-['Sniglet'] text-[12px]"
          >
            {testResults['delete']?.status === 'loading' ? 'Testing...' : 'Run Test'}
          </Button>
          {testResults['delete']?.message && (
            <p className="mt-2 font-['Sniglet'] text-[11px] text-black/60 dark:text-white/60">
              {testResults['delete'].message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-[#e4e3ac]/10 dark:bg-[#e4e3ac]/5">
        <CardHeader>
          <CardTitle className="font-['Sniglet'] text-[14px]">Test Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-['Sniglet'] text-[11px]">
            <p><strong>Created Evidence ID:</strong> {createdEvidenceId || 'None'}</p>
            <p><strong>Tests Passed:</strong> {Object.values(testResults).filter(r => r.status === 'success').length} / 5</p>
            <p className="text-black/60 dark:text-white/60">
              Run tests in order (1→2→3→4→5) for full CRUD workflow validation
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}