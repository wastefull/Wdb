import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  duration?: number;
}

export function Phase9Day6Testing() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Test 1: Create audit log via API', status: 'pending' },
    { name: 'Test 2: Fetch audit logs with filters', status: 'pending' },
    { name: 'Test 3: Get specific audit log by ID', status: 'pending' },
    { name: 'Test 4: Get audit statistics', status: 'pending' },
    { name: 'Test 5: Test pagination', status: 'pending' },
    { name: 'Test 6: CRUD instrumentation - Create material', status: 'pending' },
    { name: 'Test 7: CRUD instrumentation - Update material', status: 'pending' },
    { name: 'Test 8: CRUD instrumentation - Delete material', status: 'pending' },
    { name: 'Test 9: Verify audit log created for material operations', status: 'pending' },
  ]);
  
  const [isRunning, setIsRunning] = useState(false);

  async function runTests() {
    setIsRunning(true);
    const results: TestResult[] = [...tests];

    // Test 1: Create audit log via API
    results[0].status = 'running';
    setTests([...results]);
    try {
      const startTime = Date.now();
      const accessToken = sessionStorage.getItem('wastedb_access_token');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/audit/log`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
          body: JSON.stringify({
            entityType: 'test',
            entityId: 'test-' + Date.now(),
            action: 'create',
            before: null,
            after: { test: true, timestamp: new Date().toISOString() },
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      if (!data.success || !data.auditId) {
        throw new Error('Invalid response structure');
      }
      
      results[0].status = 'passed';
      results[0].message = `Created audit log: ${data.auditId.slice(0, 30)}...`;
      results[0].duration = Date.now() - startTime;
    } catch (error) {
      results[0].status = 'failed';
      results[0].message = String(error);
    }
    setTests([...results]);

    // Test 2: Fetch audit logs with filters
    results[1].status = 'running';
    setTests([...results]);
    try {
      const startTime = Date.now();
      const accessToken = sessionStorage.getItem('wastedb_access_token');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/audit/logs?entityType=test&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      if (!data.logs || !Array.isArray(data.logs)) {
        throw new Error('Invalid response structure');
      }
      
      results[1].status = 'passed';
      results[1].message = `Fetched ${data.logs.length} audit logs (total: ${data.total})`;
      results[1].duration = Date.now() - startTime;
    } catch (error) {
      results[1].status = 'failed';
      results[1].message = String(error);
    }
    setTests([...results]);

    // Test 3: Get specific audit log by ID
    results[2].status = 'running';
    setTests([...results]);
    try {
      const startTime = Date.now();
      const accessToken = sessionStorage.getItem('wastedb_access_token');
      
      // First get a log ID
      const listResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/audit/logs?limit=1`,
        {
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
        }
      );
      
      const listData = await listResponse.json();
      if (!listData.logs || listData.logs.length === 0) {
        throw new Error('No audit logs available to test');
      }
      
      const logId = listData.logs[0].id;
      
      // Now get specific log
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/audit/logs/${logId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      if (!data.log || !data.log.id) {
        throw new Error('Invalid response structure');
      }
      
      results[2].status = 'passed';
      results[2].message = `Retrieved log ${logId.slice(0, 30)}...`;
      results[2].duration = Date.now() - startTime;
    } catch (error) {
      results[2].status = 'failed';
      results[2].message = String(error);
    }
    setTests([...results]);

    // Test 4: Get audit statistics
    results[3].status = 'running';
    setTests([...results]);
    try {
      const startTime = Date.now();
      const accessToken = sessionStorage.getItem('wastedb_access_token');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/audit/stats`,
        {
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      if (!data.stats || typeof data.stats.total !== 'number') {
        throw new Error('Invalid response structure');
      }
      
      results[3].status = 'passed';
      results[3].message = `Stats: ${data.stats.total} total events, ${Object.keys(data.stats.byUser).length} users`;
      results[3].duration = Date.now() - startTime;
    } catch (error) {
      results[3].status = 'failed';
      results[3].message = String(error);
    }
    setTests([...results]);

    // Test 5: Test pagination
    results[4].status = 'running';
    setTests([...results]);
    try {
      const startTime = Date.now();
      const accessToken = sessionStorage.getItem('wastedb_access_token');
      
      const page1 = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/audit/logs?limit=2&offset=0`,
        {
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
        }
      );
      
      const page2 = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/audit/logs?limit=2&offset=2`,
        {
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
        }
      );
      
      const data1 = await page1.json();
      const data2 = await page2.json();
      
      if (!data1.logs || !data2.logs) {
        throw new Error('Invalid response structure');
      }
      
      // Check that page 1 and page 2 have different logs
      const page1Ids = data1.logs.map((log: any) => log.id);
      const page2Ids = data2.logs.map((log: any) => log.id);
      const hasOverlap = page1Ids.some((id: string) => page2Ids.includes(id));
      
      if (hasOverlap && page1Ids.length > 0 && page2Ids.length > 0) {
        throw new Error('Pagination returned overlapping results');
      }
      
      results[4].status = 'passed';
      results[4].message = `Page 1: ${data1.logs.length} logs, Page 2: ${data2.logs.length} logs (no overlap)`;
      results[4].duration = Date.now() - startTime;
    } catch (error) {
      results[4].status = 'failed';
      results[4].message = String(error);
    }
    setTests([...results]);

    // Test 6: CRUD instrumentation - Create material
    results[5].status = 'running';
    setTests([...results]);
    let testMaterialId = '';
    try {
      const startTime = Date.now();
      const accessToken = sessionStorage.getItem('wastedb_access_token');
      
      // Generate a unique ID for the test material
      testMaterialId = `test-material-${Date.now()}`;
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/materials`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
          body: JSON.stringify({
            id: testMaterialId,
            name: 'Test Material for Audit',
            description: 'This is a test material for audit logging',
            category: 'Plastics',
            compostability: 0,
            recyclability: 50,
            reusability: 75,
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      if (!data.material) {
        throw new Error('Invalid response structure');
      }
      
      results[5].status = 'passed';
      results[5].message = `Created material: ${data.material.name}`;
      results[5].duration = Date.now() - startTime;
    } catch (error) {
      results[5].status = 'failed';
      results[5].message = String(error);
    }
    setTests([...results]);

    // Test 7: CRUD instrumentation - Update material
    results[6].status = 'running';
    setTests([...results]);
    try {
      const startTime = Date.now();
      const accessToken = sessionStorage.getItem('wastedb_access_token');
      
      // Use the test material created in Test 6
      if (!testMaterialId) {
        throw new Error('Test material ID not available from Test 6');
      }
      
      // Now update the material
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/materials/${testMaterialId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
          body: JSON.stringify({
            id: testMaterialId,
            name: 'Updated Test Material for Audit',
            description: 'This is an updated test material for audit logging',
            category: 'Plastics',
            compostability: 10,
            recyclability: 60,
            reusability: 80,
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      if (!data.material) {
        throw new Error('Invalid response structure');
      }
      
      results[6].status = 'passed';
      results[6].message = `Updated material: ${data.material.name}`;
      results[6].duration = Date.now() - startTime;
    } catch (error) {
      results[6].status = 'failed';
      results[6].message = String(error);
    }
    setTests([...results]);

    // Test 8: CRUD instrumentation - Delete material
    results[7].status = 'running';
    setTests([...results]);
    try {
      const startTime = Date.now();
      const accessToken = sessionStorage.getItem('wastedb_access_token');
      
      // Use the test material created in Test 6
      if (!testMaterialId) {
        throw new Error('Test material ID not available from Test 6');
      }
      
      // Now delete the material
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/materials/${testMaterialId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error('Invalid response structure');
      }
      
      results[7].status = 'passed';
      results[7].message = `Deleted material: ${testMaterialId}`;
      results[7].duration = Date.now() - startTime;
    } catch (error) {
      results[7].status = 'failed';
      results[7].message = String(error);
    }
    setTests([...results]);

    // Test 9: Verify audit log created for material operations
    results[8].status = 'running';
    setTests([...results]);
    try {
      const startTime = Date.now();
      const accessToken = sessionStorage.getItem('wastedb_access_token');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/audit/logs?entityType=material&limit=3`,
        {
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      if (!data.logs || !Array.isArray(data.logs)) {
        throw new Error('Invalid response structure');
      }
      
      // Check for the expected actions
      const actions = data.logs.map((log: any) => log.action);
      if (!actions.includes('create') || !actions.includes('update') || !actions.includes('delete')) {
        throw new Error('Audit logs do not contain expected actions');
      }
      
      results[8].status = 'passed';
      results[8].message = `Verified audit logs for material operations`;
      results[8].duration = Date.now() - startTime;
    } catch (error) {
      results[8].status = 'failed';
      results[8].message = String(error);
    }
    setTests([...results]);

    setIsRunning(false);
  }

  function resetTests() {
    setTests([
      { name: 'Test 1: Create audit log via API', status: 'pending' },
      { name: 'Test 2: Fetch audit logs with filters', status: 'pending' },
      { name: 'Test 3: Get specific audit log by ID', status: 'pending' },
      { name: 'Test 4: Get audit statistics', status: 'pending' },
      { name: 'Test 5: Test pagination', status: 'pending' },
      { name: 'Test 6: CRUD instrumentation - Create material', status: 'pending' },
      { name: 'Test 7: CRUD instrumentation - Update material', status: 'pending' },
      { name: 'Test 8: CRUD instrumentation - Delete material', status: 'pending' },
      { name: 'Test 9: Verify audit log created for material operations', status: 'pending' },
    ]);
  }

  const passedCount = tests.filter(t => t.status === 'passed').length;
  const failedCount = tests.filter(t => t.status === 'failed').length;
  const totalCount = tests.length;

  function getStatusIcon(status: TestResult['status']) {
    switch (status) {
      case 'pending':
        return <div className="w-5 h-5 rounded-full border-2 border-black/20 dark:border-white/20" />;
      case 'running':
        return <Loader2 size={20} className="animate-spin text-blue-500" />;
      case 'passed':
        return <CheckCircle2 size={20} className="text-green-500" />;
      case 'failed':
        return <XCircle size={20} className="text-red-500" />;
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="font-['Fredoka_One'] text-[24px] text-black dark:text-white mb-2">
          Day 6: Audit Logging Tests
        </h2>
        <p className="font-['Sniglet'] text-[12px] text-black/60 dark:text-white/60">
          Testing audit log infrastructure and API endpoints
        </p>
      </div>

      {/* Summary */}
      <div className="bg-white dark:bg-[#1a1917] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <span className="font-['Sniglet'] text-[12px] text-black/60 dark:text-white/60">Passed:</span>
              <span className="ml-2 font-['Fredoka_One'] text-[18px] text-green-600 dark:text-green-400">{passedCount}</span>
            </div>
            <div>
              <span className="font-['Sniglet'] text-[12px] text-black/60 dark:text-white/60">Failed:</span>
              <span className="ml-2 font-['Fredoka_One'] text-[18px] text-red-600 dark:text-red-400">{failedCount}</span>
            </div>
            <div>
              <span className="font-['Sniglet'] text-[12px] text-black/60 dark:text-white/60">Total:</span>
              <span className="ml-2 font-['Fredoka_One'] text-[18px]">{totalCount}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetTests}
              disabled={isRunning}
              className="px-4 py-2 bg-[#b8c8cb] dark:bg-[#2d2b28] rounded-lg border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all font-['Sniglet'] text-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
            <button
              onClick={runTests}
              disabled={isRunning}
              className="px-4 py-2 bg-green-500 text-white rounded-lg border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all font-['Sniglet'] text-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Running...' : 'Run All Tests'}
            </button>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="space-y-3">
        {tests.map((test, index) => (
          <div
            key={index}
            className="bg-white dark:bg-[#1a1917] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] p-4"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getStatusIcon(test.status)}</div>
              <div className="flex-1">
                <h3 className="font-['Sniglet'] text-[14px] text-black dark:text-white mb-1">
                  {test.name}
                </h3>
                {test.message && (
                  <p className="font-['Sniglet'] text-[12px] text-black/60 dark:text-white/60">
                    {test.message}
                  </p>
                )}
                {test.duration && (
                  <p className="font-['Sniglet'] text-[11px] text-black/40 dark:text-white/40 mt-1">
                    Duration: {test.duration}ms
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-['Sniglet'] text-[12px] text-blue-900 dark:text-blue-100 mb-1">
              Day 6 Deliverables Status
            </h4>
            <ul className="font-['Sniglet'] text-[11px] text-blue-800 dark:text-blue-200 space-y-1">
              <li>✅ Audit log backend endpoints (POST /audit/log, GET /audit/logs, GET /audit/stats)</li>
              <li>✅ Audit log viewer component with search/filter UI</li>
              <li>✅ Statistics dashboard</li>
              <li>✅ Export functionality</li>
              <li>✅ Email notifications for critical events (via Resend API)</li>
              <li>✅ CRUD instrumentation (materials, users, sources, evidence, whitepapers)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}