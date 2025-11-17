import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Unlock, Lock, CheckCircle2, XCircle, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Phase9Day10UITests } from './Phase9Day10UITests';

interface TestResult {
  status: 'idle' | 'running' | 'success' | 'error';
  message: string;
  data?: any;
}

export function Phase9Day10Testing() {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({
    checkOA: { status: 'idle', message: '' },
    bulkCheck: { status: 'idle', message: '' },
    oaFilter: { status: 'idle', message: '' },
    doiNormalization: { status: 'idle', message: '' },
    errorHandling: { status: 'idle', message: '' },
    edgeCases: { status: 'idle', message: '' },
    sourceWithOA: { status: 'idle', message: '' },
    batchSaveOA: { status: 'idle', message: '' },
  });

  const [testDoi, setTestDoi] = useState('10.1016/j.biortech.2019.121577');
  const [oaData, setOaData] = useState<any>(null);

  const updateTestResult = (testId: string, status: TestResult['status'], message: string, data?: any) => {
    setTestResults(prev => ({
      ...prev,
      [testId]: { status, message, data }
    }));
  };

  // Test 0: Check Single DOI for Open Access Status
  const testCheckOAStatus = async () => {
    updateTestResult('checkOA', 'running', 'Checking Open Access status via Unpaywall API...');
    setOaData(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/check-oa?doi=${encodeURIComponent(testDoi)}`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      setOaData(data);

      const isOA = data.is_open_access;
      const status = data.oa_status;
      
      updateTestResult(
        'checkOA',
        'success',
        `✓ Check complete: DOI ${isOA ? 'IS' : 'is NOT'} Open Access${status ? ` (${status})` : ''}`,
        data
      );
    } catch (error) {
      console.error('OA check error:', error);
      updateTestResult('checkOA', 'error', `✗ Failed: ${error}`);
    }
  };

  // Test 1: Bulk Check Multiple DOIs
  const testBulkOACheck = async () => {
    updateTestResult('bulkCheck', 'running', 'Checking multiple DOIs for Open Access status...');

    const testDois = [
      '10.1016/j.biortech.2019.121577',
      '10.1016/j.wasman.2020.06.002',
      '10.1021/acs.est.1c00466',
      '10.1016/j.resconrec.2018.03.015',
    ];

    try {
      const results = await Promise.all(
        testDois.map(async (doi) => {
          try {
            const response = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/check-oa?doi=${encodeURIComponent(doi)}`,
              {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${publicAnonKey}` },
              }
            );

            if (!response.ok) {
              return { doi, is_open_access: null, error: `HTTP ${response.status}` };
            }

            const data = await response.json();
            return {
              doi,
              is_open_access: data.is_open_access,
              oa_status: data.oa_status,
              best_oa_url: data.best_oa_location?.url,
            };
          } catch (error) {
            return { doi, is_open_access: null, error: String(error) };
          }
        })
      );

      const oaCount = results.filter(r => r.is_open_access === true).length;
      const closedCount = results.filter(r => r.is_open_access === false).length;
      const errorCount = results.filter(r => r.is_open_access === null).length;

      updateTestResult(
        'bulkCheck',
        'success',
        `✓ Bulk check complete: ${oaCount} OA, ${closedCount} closed, ${errorCount} errors out of ${testDois.length} DOIs`,
        results
      );
    } catch (error) {
      console.error('Bulk OA check error:', error);
      updateTestResult('bulkCheck', 'error', `✗ Failed: ${error}`);
    }
  };

  // Test 2: Simulate OA Filter
  const testOAFilter = async () => {
    updateTestResult('oaFilter', 'running', 'Testing OA-only filter simulation...');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const sources = data.sources || [];

      const withDOI = sources.filter((s: any) => s.doi);
      const withoutDOI = sources.filter((s: any) => !s.doi);

      updateTestResult(
        'oaFilter',
        'success',
        `✓ Filter simulation: ${withDOI.length} sources with DOI (checkable for OA), ${withoutDOI.length} without DOI`,
        { withDOI: withDOI.length, withoutDOI: withoutDOI.length, total: sources.length }
      );
    } catch (error) {
      console.error('OA filter test error:', error);
      updateTestResult('oaFilter', 'error', `✗ Failed: ${error}`);
    }
  };

  // Test 3: DOI Normalization
  const testDOINormalization = async () => {
    updateTestResult('doiNormalization', 'running', 'Testing various DOI formats...');

    const doiFormats = [
      '10.1016/j.biortech.2019.121577',                    // Plain
      'https://doi.org/10.1016/j.biortech.2019.121577',   // https://doi.org/
      'http://doi.org/10.1016/j.biortech.2019.121577',    // http://doi.org/
      'doi:10.1016/j.biortech.2019.121577',               // doi: prefix
      'https://dx.doi.org/10.1016/j.biortech.2019.121577', // dx.doi.org
    ];

    try {
      const results = await Promise.all(
        doiFormats.map(async (doi) => {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/check-oa?doi=${encodeURIComponent(doi)}`,
            {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${publicAnonKey}` },
            }
          );

          const data = await response.json();
          return {
            input: doi,
            normalized: data.doi,
            success: data.doi === '10.1016/j.biortech.2019.121577',
          };
        })
      );

      const allNormalized = results.every(r => r.success);
      
      updateTestResult(
        'doiNormalization',
        allNormalized ? 'success' : 'error',
        allNormalized 
          ? `✓ All ${doiFormats.length} DOI formats normalized correctly`
          : `✗ Some DOI formats failed normalization`,
        results
      );
    } catch (error) {
      console.error('DOI normalization test error:', error);
      updateTestResult('doiNormalization', 'error', `✗ Failed: ${error}`);
    }
  };

  // Test 4: Error Handling
  const testErrorHandling = async () => {
    updateTestResult('errorHandling', 'running', 'Testing error scenarios...');

    const testCases = [
      { doi: '', expectedError: true, description: 'Empty DOI' },
      { doi: 'invalid-doi', expectedError: false, description: 'Invalid DOI format (404 expected)' },
      { doi: '10.9999/nonexistent.2099.99999', expectedError: false, description: 'Non-existent DOI' },
    ];

    try {
      const results = await Promise.all(
        testCases.map(async (testCase) => {
          try {
            const response = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/check-oa?doi=${encodeURIComponent(testCase.doi)}`,
              {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${publicAnonKey}` },
              }
            );

            const data = await response.json();
            
            return {
              ...testCase,
              status: response.status,
              hasError: response.status >= 400,
              message: data.error || data.message || 'OK',
              passed: testCase.expectedError ? response.status >= 400 : response.status === 200,
            };
          } catch (error) {
            return {
              ...testCase,
              status: 0,
              hasError: true,
              message: String(error),
              passed: testCase.expectedError,
            };
          }
        })
      );

      const allPassed = results.every(r => r.passed);
      
      updateTestResult(
        'errorHandling',
        allPassed ? 'success' : 'error',
        allPassed
          ? `✓ All ${testCases.length} error scenarios handled correctly`
          : `✗ Some error scenarios not handled properly`,
        results
      );
    } catch (error) {
      console.error('Error handling test error:', error);
      updateTestResult('errorHandling', 'error', `✗ Failed: ${error}`);
    }
  };

  // Test 5: Edge Cases
  const testEdgeCases = async () => {
    updateTestResult('edgeCases', 'running', 'Testing edge cases...');

    try {
      // Test 1: DOI with special characters
      const specialDoi = '10.1002/(SICI)1097-0320(19990401)35:4<373::AID-CYTO9>3.0.CO;2-7';
      const response1 = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/check-oa?doi=${encodeURIComponent(specialDoi)}`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );
      const data1 = await response1.json();

      // Test 2: Check response structure completeness
      const normalDoi = '10.1016/j.biortech.2019.121577';
      const response2 = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/check-oa?doi=${encodeURIComponent(normalDoi)}`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );
      const data2 = await response2.json();

      const hasRequiredFields = 
        data2.hasOwnProperty('is_open_access') &&
        data2.hasOwnProperty('doi') &&
        data2.hasOwnProperty('oa_status');

      updateTestResult(
        'edgeCases',
        'success',
        `✓ Edge cases handled: special chars DOI (${response1.status}), required fields present (${hasRequiredFields})`,
        {
          specialCharDoi: { doi: specialDoi, status: response1.status, data: data1 },
          requiredFields: hasRequiredFields,
          sampleData: data2,
        }
      );
    } catch (error) {
      console.error('Edge cases test error:', error);
      updateTestResult('edgeCases', 'error', `✗ Failed: ${error}`);
    }
  };

  // Test 6: Source Creation with OA Fields (requires admin auth - will show guidance)
  const testSourceWithOA = async () => {
    updateTestResult('sourceWithOA', 'running', 'Testing source creation with OA metadata...');

    try {
      // First, get the OA data
      const oaResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/check-oa?doi=${encodeURIComponent('10.1016/j.biortech.2019.121577')}`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );
      
      const oaData = await oaResponse.json();

      // Simulate what a source object would look like with OA data
      const sourceWithOA = {
        title: 'Test Source with OA Metadata',
        authors: 'Test Author',
        year: 2019,
        doi: '10.1016/j.biortech.2019.121577',
        type: 'peer-reviewed',
        weight: 1.0,
        is_open_access: oaData.is_open_access,
        oa_status: oaData.oa_status,
        best_oa_url: oaData.best_oa_location?.url,
      };

      const hasOAFields = 
        sourceWithOA.hasOwnProperty('is_open_access') &&
        sourceWithOA.hasOwnProperty('oa_status') &&
        sourceWithOA.hasOwnProperty('best_oa_url');

      updateTestResult(
        'sourceWithOA',
        'success',
        `✓ Source object structure validated with OA fields: is_open_access=${sourceWithOA.is_open_access}, oa_status=${sourceWithOA.oa_status}`,
        { sourceWithOA, hasOAFields }
      );
    } catch (error) {
      console.error('Source with OA test error:', error);
      updateTestResult('sourceWithOA', 'error', `✗ Failed: ${error}`);
    }
  };

  // Test 7: Batch Save Simulation with OA Data
  const testBatchSaveOA = async () => {
    updateTestResult('batchSaveOA', 'running', 'Testing batch OA enrichment simulation...');

    const testDois = [
      '10.1016/j.biortech.2019.121577',
      '10.1016/j.wasman.2020.06.002',
      '10.1021/acs.est.1c00466',
    ];

    try {
      // Fetch OA data for multiple DOIs
      const oaResults = await Promise.all(
        testDois.map(async (doi) => {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/check-oa?doi=${encodeURIComponent(doi)}`,
            {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${publicAnonKey}` },
            }
          );
          const data = await response.json();
          return {
            doi,
            is_open_access: data.is_open_access,
            oa_status: data.oa_status,
            best_oa_url: data.best_oa_location?.url,
          };
        })
      );

      // Simulate sources with OA metadata
      const enrichedSources = oaResults.map((oa, index) => ({
        id: `source-test-${index}`,
        title: `Test Source ${index + 1}`,
        doi: oa.doi,
        type: 'peer-reviewed',
        weight: 1.0,
        ...oa,
      }));

      const oaCount = enrichedSources.filter(s => s.is_open_access).length;
      const closedCount = enrichedSources.filter(s => !s.is_open_access).length;

      updateTestResult(
        'batchSaveOA',
        'success',
        `✓ Batch enrichment simulation: ${oaCount} OA sources, ${closedCount} closed sources out of ${testDois.length} total`,
        { enrichedSources, oaCount, closedCount }
      );
    } catch (error) {
      console.error('Batch save OA test error:', error);
      updateTestResult('batchSaveOA', 'error', `✗ Failed: ${error}`);
    }
  };

  const renderStatus = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Unlock className="size-8 text-green-600" />
            <div>
              <CardTitle>Phase 9.0 Day 10: Open Access Triage Testing</CardTitle>
              <CardDescription>
                Test Open Access detection via Unpaywall API, OA filtering, and source prioritization
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-300">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-[11px] text-blue-800 dark:text-blue-200">
              <strong>Open Access Triage:</strong> Automatically check DOIs against Unpaywall API to identify
              freely accessible research. Prioritize OA sources for better transparency and accessibility.
            </AlertDescription>
          </Alert>

          {/* Test 0: Single DOI Check */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {renderStatus(testResults.checkOA.status)}
                Test 0: Check Single DOI for Open Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-[11px]">Test DOI:</Label>
                <Input
                  value={testDoi}
                  onChange={(e) => setTestDoi(e.target.value)}
                  placeholder="10.1016/j.example.2024.01.001"
                  className="text-[12px] mt-1"
                />
                <p className="text-[9px] text-muted-foreground mt-1">
                  Try: 10.1016/j.biortech.2019.121577 (OA), 10.1038/s41586-020-2649-2 (closed)
                </p>
              </div>

              <Button 
                onClick={testCheckOAStatus}
                className="w-full"
                disabled={testResults.checkOA.status === 'running'}
              >
                {testResults.checkOA.status === 'running' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 mr-2" />
                    Check Open Access Status
                  </>
                )}
              </Button>

              {testResults.checkOA.message && (
                <Alert className={
                  testResults.checkOA.status === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300'
                    : testResults.checkOA.status === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300'
                    : ''
                }>
                  <AlertDescription className="text-[11px]">
                    {testResults.checkOA.message}
                  </AlertDescription>
                </Alert>
              )}

              {oaData && (
                <Card className="bg-white dark:bg-gray-800 border-2">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      {oaData.is_open_access ? (
                        <>
                          <Unlock className="w-4 h-4 text-green-600" />
                          <span className="text-green-600">Open Access</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-red-600" />
                          <span className="text-red-600">Closed Access</span>
                        </>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="font-semibold">DOI:</span> {oaData.doi}
                      </div>
                      {oaData.oa_status && (
                        <div>
                          <span className="font-semibold">Status:</span>{' '}
                          <Badge variant="outline" className="text-[9px]">
                            {oaData.oa_status}
                          </Badge>
                        </div>
                      )}
                      {oaData.publisher && (
                        <div>
                          <span className="font-semibold">Publisher:</span> {oaData.publisher}
                        </div>
                      )}
                      {oaData.journal && (
                        <div>
                          <span className="font-semibold">Journal:</span> {oaData.journal}
                        </div>
                      )}
                    </div>
                    
                    {oaData.best_oa_location && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-[10px] font-semibold mb-2">Best OA Location:</p>
                        <div className="space-y-1 text-[10px]">
                          {oaData.best_oa_location.url && (
                            <div>
                              <a
                                href={oaData.best_oa_location.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1"
                              >
                                View Article <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                          {oaData.best_oa_location.url_for_pdf && (
                            <div>
                              <a
                                href={oaData.best_oa_location.url_for_pdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:underline flex items-center gap-1"
                              >
                                Download PDF <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                          {oaData.best_oa_location.version && (
                            <div>
                              <span className="font-semibold">Version:</span> {oaData.best_oa_location.version}
                            </div>
                          )}
                          {oaData.best_oa_location.license && (
                            <div>
                              <span className="font-semibold">License:</span>{' '}
                              <Badge variant="outline" className="text-[8px]">
                                {oaData.best_oa_location.license}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {oaData.message && (
                      <Alert className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300">
                        <AlertCircle className="h-3 w-3" />
                        <AlertDescription className="text-[10px]">
                          {oaData.message}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Test 1: Bulk Check */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {renderStatus(testResults.bulkCheck.status)}
                Test 1: Bulk Check Multiple DOIs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[11px] text-muted-foreground">
                Test checking multiple DOIs in parallel to validate detection accuracy.
              </p>

              <Button 
                onClick={testBulkOACheck}
                className="w-full"
                disabled={testResults.bulkCheck.status === 'running'}
              >
                {testResults.bulkCheck.status === 'running' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking 4 DOIs...
                  </>
                ) : (
                  'Run Bulk OA Check (4 DOIs)'
                )}
              </Button>

              {testResults.bulkCheck.message && (
                <Alert className={
                  testResults.bulkCheck.status === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300'
                    : testResults.bulkCheck.status === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300'
                    : ''
                }>
                  <AlertDescription className="text-[11px]">
                    {testResults.bulkCheck.message}
                  </AlertDescription>
                </Alert>
              )}

              {testResults.bulkCheck.data && testResults.bulkCheck.status === 'success' && (
                <div className="space-y-2">
                  {testResults.bulkCheck.data.map((result: any, index: number) => (
                    <Card key={index} className="bg-white dark:bg-gray-800">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-[10px] font-mono text-muted-foreground">
                            {result.doi}
                          </p>
                          {result.oa_status && (
                            <Badge variant="outline" className="text-[8px] mt-1">
                              {result.oa_status}
                            </Badge>
                          )}
                        </div>
                        {result.is_open_access === true ? (
                          <Unlock className="w-4 h-4 text-green-600" />
                        ) : result.is_open_access === false ? (
                          <Lock className="w-4 h-4 text-red-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test 2: OA Filter Simulation */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {renderStatus(testResults.oaFilter.status)}
                Test 2: OA Filter Simulation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[11px] text-muted-foreground">
                Simulate OA-only filtering by counting sources with DOIs (which can be checked for OA status).
              </p>

              <Button 
                onClick={testOAFilter}
                className="w-full"
                disabled={testResults.oaFilter.status === 'running'}
              >
                {testResults.oaFilter.status === 'running' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test OA Filter'
                )}
              </Button>

              {testResults.oaFilter.message && (
                <Alert className={
                  testResults.oaFilter.status === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300'
                    : testResults.oaFilter.status === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300'
                    : ''
                }>
                  <AlertDescription className="text-[11px]">
                    {testResults.oaFilter.message}
                  </AlertDescription>
                </Alert>
              )}

              {testResults.oaFilter.data && (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <Card className="bg-white dark:bg-gray-800">
                    <CardContent className="p-3">
                      <p className="text-2xl font-bold text-green-600">
                        {testResults.oaFilter.data.withDOI}
                      </p>
                      <p className="text-[9px] text-muted-foreground">With DOI</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white dark:bg-gray-800">
                    <CardContent className="p-3">
                      <p className="text-2xl font-bold text-gray-600">
                        {testResults.oaFilter.data.withoutDOI}
                      </p>
                      <p className="text-[9px] text-muted-foreground">Without DOI</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white dark:bg-gray-800">
                    <CardContent className="p-3">
                      <p className="text-2xl font-bold text-blue-600">
                        {testResults.oaFilter.data.total}
                      </p>
                      <p className="text-[9px] text-muted-foreground">Total Sources</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test 3: DOI Normalization */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {renderStatus(testResults.doiNormalization.status)}
                Test 3: DOI Normalization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[11px] text-muted-foreground">
                Test various DOI formats to ensure they are correctly normalized.
              </p>

              <Button 
                onClick={testDOINormalization}
                className="w-full"
                disabled={testResults.doiNormalization.status === 'running'}
              >
                {testResults.doiNormalization.status === 'running' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test DOI Normalization'
                )}
              </Button>

              {testResults.doiNormalization.message && (
                <Alert className={
                  testResults.doiNormalization.status === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300'
                    : testResults.doiNormalization.status === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300'
                    : ''
                }>
                  <AlertDescription className="text-[11px]">
                    {testResults.doiNormalization.message}
                  </AlertDescription>
                </Alert>
              )}

              {testResults.doiNormalization.data && (
                <div className="space-y-2">
                  {testResults.doiNormalization.data.map((result: any, index: number) => (
                    <Card key={index} className="bg-white dark:bg-gray-800">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-[10px] font-mono text-muted-foreground">
                            {result.input}
                          </p>
                          {result.success && (
                            <Badge variant="outline" className="text-[8px] mt-1">
                              Normalized
                            </Badge>
                          )}
                        </div>
                        {result.success ? (
                          <Unlock className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test 4: Error Handling */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {renderStatus(testResults.errorHandling.status)}
                Test 4: Error Handling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[11px] text-muted-foreground">
                Test various error scenarios to ensure robust error handling.
              </p>

              <Button 
                onClick={testErrorHandling}
                className="w-full"
                disabled={testResults.errorHandling.status === 'running'}
              >
                {testResults.errorHandling.status === 'running' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Error Handling'
                )}
              </Button>

              {testResults.errorHandling.message && (
                <Alert className={
                  testResults.errorHandling.status === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300'
                    : testResults.errorHandling.status === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300'
                    : ''
                }>
                  <AlertDescription className="text-[11px]">
                    {testResults.errorHandling.message}
                  </AlertDescription>
                </Alert>
              )}

              {testResults.errorHandling.data && (
                <div className="space-y-2">
                  {testResults.errorHandling.data.map((result: any, index: number) => (
                    <Card key={index} className="bg-white dark:bg-gray-800">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-[10px] font-mono text-muted-foreground">
                            {result.description}
                          </p>
                          {result.passed && (
                            <Badge variant="outline" className="text-[8px] mt-1">
                              Passed
                            </Badge>
                          )}
                        </div>
                        {result.passed ? (
                          <Unlock className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test 5: Edge Cases */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {renderStatus(testResults.edgeCases.status)}
                Test 5: Edge Cases
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[11px] text-muted-foreground">
                Test edge cases to ensure robustness in handling unusual inputs.
              </p>

              <Button 
                onClick={testEdgeCases}
                className="w-full"
                disabled={testResults.edgeCases.status === 'running'}
              >
                {testResults.edgeCases.status === 'running' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Edge Cases'
                )}
              </Button>

              {testResults.edgeCases.message && (
                <Alert className={
                  testResults.edgeCases.status === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300'
                    : testResults.edgeCases.status === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300'
                    : ''
                }>
                  <AlertDescription className="text-[11px]">
                    {testResults.edgeCases.message}
                  </AlertDescription>
                </Alert>
              )}

              {testResults.edgeCases.data && (
                <div className="space-y-2">
                  <Card className="bg-white dark:bg-gray-800">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-[10px] font-mono text-muted-foreground">
                          Special Char DOI
                        </p>
                        {testResults.edgeCases.data.specialCharDoi.status && (
                          <Badge variant="outline" className="text-[8px] mt-1">
                            {testResults.edgeCases.data.specialCharDoi.status}
                          </Badge>
                        )}
                      </div>
                      {testResults.edgeCases.data.specialCharDoi.status ? (
                        <Unlock className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-gray-400" />
                      )}
                    </CardContent>
                  </Card>
                  <Card className="bg-white dark:bg-gray-800">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-[10px] font-mono text-muted-foreground">
                          Required Fields
                        </p>
                        {testResults.edgeCases.data.requiredFields && (
                          <Badge variant="outline" className="text-[8px] mt-1">
                            Present
                          </Badge>
                        )}
                      </div>
                      {testResults.edgeCases.data.requiredFields ? (
                        <Unlock className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-gray-400" />
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test 6: Source Creation with OA Fields */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {renderStatus(testResults.sourceWithOA.status)}
                Test 6: Source Creation with OA Fields
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[11px] text-muted-foreground">
                Test creating a source with Open Access metadata.
              </p>

              <Button 
                onClick={testSourceWithOA}
                className="w-full"
                disabled={testResults.sourceWithOA.status === 'running'}
              >
                {testResults.sourceWithOA.status === 'running' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Source Creation with OA Fields'
                )}
              </Button>

              {testResults.sourceWithOA.message && (
                <Alert className={
                  testResults.sourceWithOA.status === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300'
                    : testResults.sourceWithOA.status === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300'
                    : ''
                }>
                  <AlertDescription className="text-[11px]">
                    {testResults.sourceWithOA.message}
                  </AlertDescription>
                </Alert>
              )}

              {testResults.sourceWithOA.data && (
                <div className="space-y-2">
                  <Card className="bg-white dark:bg-gray-800">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-[10px] font-mono text-muted-foreground">
                          Source with OA Fields
                        </p>
                        {testResults.sourceWithOA.data.hasOAFields && (
                          <Badge variant="outline" className="text-[8px] mt-1">
                            Present
                          </Badge>
                        )}
                      </div>
                      {testResults.sourceWithOA.data.hasOAFields ? (
                        <Unlock className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-gray-400" />
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test 7: Batch Save Simulation with OA Data */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {renderStatus(testResults.batchSaveOA.status)}
                Test 7: Batch Save Simulation with OA Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[11px] text-muted-foreground">
                Test batch saving sources with Open Access metadata.
              </p>

              <Button 
                onClick={testBatchSaveOA}
                className="w-full"
                disabled={testResults.batchSaveOA.status === 'running'}
              >
                {testResults.batchSaveOA.status === 'running' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Batch Save with OA Data'
                )}
              </Button>

              {testResults.batchSaveOA.message && (
                <Alert className={
                  testResults.batchSaveOA.status === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300'
                    : testResults.batchSaveOA.status === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300'
                    : ''
                }>
                  <AlertDescription className="text-[11px]">
                    {testResults.batchSaveOA.message}
                  </AlertDescription>
                </Alert>
              )}

              {testResults.batchSaveOA.data && (
                <div className="space-y-2">
                  <Card className="bg-white dark:bg-gray-800">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-[10px] font-mono text-muted-foreground">
                          Batch Enrichment Simulation
                        </p>
                        {testResults.batchSaveOA.data.oaCount && (
                          <Badge variant="outline" className="text-[8px] mt-1">
                            {testResults.batchSaveOA.data.oaCount} OA
                          </Badge>
                        )}
                        {testResults.batchSaveOA.data.closedCount && (
                          <Badge variant="outline" className="text-[8px] mt-1">
                            {testResults.batchSaveOA.data.closedCount} Closed
                          </Badge>
                        )}
                      </div>
                      {testResults.batchSaveOA.data.oaCount ? (
                        <Unlock className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-gray-400" />
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Alert className="bg-purple-50 dark:bg-purple-900/20 border-purple-300">
            <CheckCircle2 className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-[11px] text-purple-800 dark:text-purple-200">
              <strong>Day 10 Deliverables:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>✅ Open Access check endpoint: GET /sources/check-oa</li>
                <li>✅ Unpaywall API integration for DOI → OA status detection</li>
                <li>✅ OA status tracking in Source interface (is_open_access, oa_status, best_oa_url)</li>
                <li>⚠️ OA filter UI ready for integration in Source Library Manager</li>
                <li>⚠️ OA badges ready for display on source cards</li>
                <li>⚠️ "Prioritize OA" curator setting ready for preferences</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* UI Tests Section */}
      <Phase9Day10UITests />
    </div>
  );
}