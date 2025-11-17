import React, { useState } from 'react';
import { Download, Upload, CheckCircle, AlertCircle, FileCheck } from 'lucide-react';
import { Button } from './ui/button';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function Phase9Day8Testing() {
  const [testResults, setTestResults] = useState<Record<string, { status: 'pending' | 'running' | 'success' | 'error', message?: string }>>({
    exportBackup: { status: 'pending' },
    validateBackup: { status: 'pending' },
    importBackup: { status: 'pending' },
    fullCycle: { status: 'pending' }
  });

  const [backupData, setBackupData] = useState<any>(null);
  const [validationResults, setValidationResults] = useState<any>(null);

  const updateTestResult = (testId: string, status: 'running' | 'success' | 'error', message?: string) => {
    setTestResults(prev => ({
      ...prev,
      [testId]: { status, message }
    }));
  };

  const getAccessToken = () => {
    const token = sessionStorage.getItem('wastedb_access_token');
    if (!token) {
      throw new Error('Not authenticated. Please log in as admin.');
    }
    return token;
  };

  // Test 1: Export Backup
  const testExportBackup = async () => {
    updateTestResult('exportBackup', 'running');
    try {
      const accessToken = getAccessToken();
      const startTime = Date.now();

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/backup/export`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      const backup = await response.json();
      const duration = Date.now() - startTime;

      setBackupData(backup);

      // Verify backup structure
      if (!backup.metadata || !backup.data) {
        throw new Error('Invalid backup structure');
      }

      const recordCount = backup.metadata.total_records;
      const exportDuration = backup.metadata.export_duration_ms;

      updateTestResult(
        'exportBackup',
        'success',
        `✓ Exported ${recordCount} records in ${exportDuration}ms (request took ${duration}ms total)`
      );
    } catch (error: any) {
      updateTestResult('exportBackup', 'error', `✗ ${error.message}`);
    }
  };

  // Test 2: Validate Backup
  const testValidateBackup = async () => {
    if (!backupData) {
      updateTestResult('validateBackup', 'error', '✗ No backup data. Run Export test first.');
      return;
    }

    updateTestResult('validateBackup', 'running');
    try {
      const accessToken = getAccessToken();

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/backup/validate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ backup: backupData })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Validation failed');
      }

      const validation = await response.json();
      setValidationResults(validation);

      if (validation.valid) {
        const warningText = validation.warnings.length > 0
          ? ` (${validation.warnings.length} warnings)`
          : '';
        updateTestResult(
          'validateBackup',
          'success',
          `✓ Backup is valid${warningText} - ${validation.stats.total_records} records`
        );
      } else {
        throw new Error(`Validation failed: ${validation.issues.join(', ')}`);
      }
    } catch (error: any) {
      updateTestResult('validateBackup', 'error', `✗ ${error.message}`);
    }
  };

  // Test 3: Import Backup (Merge Mode)
  const testImportBackup = async () => {
    if (!backupData) {
      updateTestResult('importBackup', 'error', '✗ No backup data. Run Export test first.');
      return;
    }

    updateTestResult('importBackup', 'running');
    try {
      const accessToken = getAccessToken();
      const startTime = Date.now();

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/backup/import`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            backup: backupData,
            mode: 'merge'
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }

      const result = await response.json();
      const duration = Date.now() - startTime;

      if (!result.success) {
        throw new Error('Import did not succeed');
      }

      updateTestResult(
        'importBackup',
        'success',
        `✓ Imported ${result.imported} records (${result.skipped} skipped, ${result.errors} errors) in ${result.duration_ms}ms`
      );
    } catch (error: any) {
      updateTestResult('importBackup', 'error', `✗ ${error.message}`);
    }
  };

  // Test 4: Full Backup/Restore Cycle
  const testFullCycle = async () => {
    updateTestResult('fullCycle', 'running', 'Running export → validate → import cycle...');

    try {
      // Step 1: Export
      await testExportBackup();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Validate
      await testValidateBackup();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Import
      await testImportBackup();

      updateTestResult('fullCycle', 'success', '✓ Full backup/restore cycle completed successfully');
    } catch (error: any) {
      updateTestResult('fullCycle', 'error', `✗ ${error.message}`);
    }
  };

  const downloadBackup = () => {
    if (!backupData) return;

    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wastedb-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const runAllTests = async () => {
    await testFullCycle();
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-['Sniglet'] text-[14px] text-blue-900 dark:text-blue-100 mb-2">
          Phase 9.0 Day 8: Backup & Recovery Testing
        </h3>
        <p className="font-['Sniglet'] text-[12px] text-blue-700 dark:text-blue-300">
          Test backup export, validation, and import/restore functionality.
        </p>
      </div>

      {/* Run All Tests Button */}
      <div className="flex justify-end">
        <Button
          onClick={runAllTests}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Run All Tests
        </Button>
      </div>

      {/* Test 1: Export Backup */}
      <div className="bg-white dark:bg-[#1a1917] border border-[#211f1c]/20 dark:border-white/20 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-['Sniglet'] text-[13px] text-black dark:text-white mb-1">
              Test 1: Export Backup
            </h4>
            <p className="font-['Sniglet'] text-[11px] text-black/60 dark:text-white/60">
              Export all KV store data as JSON backup
            </p>
          </div>
          <Button
            onClick={testExportBackup}
            disabled={testResults.exportBackup.status === 'running'}
            className="ml-4"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        <TestStatusIndicator result={testResults.exportBackup} />

        {backupData && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
            <div className="font-['Sniglet'] text-[11px] text-gray-700 dark:text-gray-300 space-y-1">
              <div>Version: {backupData.metadata?.version}</div>
              <div>Timestamp: {backupData.metadata?.timestamp}</div>
              <div>Total Records: {backupData.metadata?.total_records}</div>
              <div>Export Duration: {backupData.metadata?.export_duration_ms}ms</div>
            </div>
            <Button
              onClick={downloadBackup}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              <Download className="w-3 h-3 mr-2" />
              Download Backup File
            </Button>
          </div>
        )}
      </div>

      {/* Test 2: Validate Backup */}
      <div className="bg-white dark:bg-[#1a1917] border border-[#211f1c]/20 dark:border-white/20 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-['Sniglet'] text-[13px] text-black dark:text-white mb-1">
              Test 2: Validate Backup
            </h4>
            <p className="font-['Sniglet'] text-[11px] text-black/60 dark:text-white/60">
              Check backup file integrity and structure
            </p>
          </div>
          <Button
            onClick={testValidateBackup}
            disabled={testResults.validateBackup.status === 'running' || !backupData}
            className="ml-4"
            size="sm"
          >
            <FileCheck className="w-4 h-4 mr-2" />
            Validate
          </Button>
        </div>

        <TestStatusIndicator result={testResults.validateBackup} />

        {validationResults && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
            <div className="font-['Sniglet'] text-[11px] text-gray-700 dark:text-gray-300 space-y-2">
              <div className="flex items-center gap-2">
                {validationResults.valid ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={validationResults.valid ? 'text-green-600' : 'text-red-600'}>
                  {validationResults.valid ? 'Valid Backup' : 'Invalid Backup'}
                </span>
              </div>

              {validationResults.issues && validationResults.issues.length > 0 && (
                <div>
                  <div className="font-semibold text-red-600 mb-1">Issues:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {validationResults.issues.map((issue: string, i: number) => (
                      <li key={i} className="text-red-600">{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResults.warnings && validationResults.warnings.length > 0 && (
                <div>
                  <div className="font-semibold text-yellow-600 mb-1">Warnings:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {validationResults.warnings.map((warning: string, i: number) => (
                      <li key={i} className="text-yellow-600">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResults.stats && (
                <div>
                  <div className="font-semibold mb-1">Statistics:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(validationResults.stats.categories || {}).map(([category, count]) => (
                      <div key={category}>
                        {category}: {count as number}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Test 3: Import Backup */}
      <div className="bg-white dark:bg-[#1a1917] border border-[#211f1c]/20 dark:border-white/20 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-['Sniglet'] text-[13px] text-black dark:text-white mb-1">
              Test 3: Import Backup (Merge Mode)
            </h4>
            <p className="font-['Sniglet'] text-[11px] text-black/60 dark:text-white/60">
              Restore data from backup (safe merge, no deletions)
            </p>
          </div>
          <Button
            onClick={testImportBackup}
            disabled={testResults.importBackup.status === 'running' || !backupData}
            className="ml-4"
            size="sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
        </div>

        <TestStatusIndicator result={testResults.importBackup} />
      </div>

      {/* Test 4: Full Cycle */}
      <div className="bg-white dark:bg-[#1a1917] border border-[#211f1c]/20 dark:border-white/20 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-['Sniglet'] text-[13px] text-black dark:text-white mb-1">
              Test 4: Full Backup/Restore Cycle
            </h4>
            <p className="font-['Sniglet'] text-[11px] text-black/60 dark:text-white/60">
              Complete workflow: Export → Validate → Import
            </p>
          </div>
        </div>

        <TestStatusIndicator result={testResults.fullCycle} />
      </div>

      {/* Documentation Link */}
      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h4 className="font-['Sniglet'] text-[13px] text-green-900 dark:text-green-100 mb-2">
          📖 Recovery Procedures Documentation
        </h4>
        <p className="font-['Sniglet'] text-[11px] text-green-700 dark:text-green-300 mb-2">
          Complete backup and recovery procedures are documented in:
        </p>
        <code className="font-['Sniglet'] text-[11px] bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
          /docs/BACKUP_RECOVERY_PROCEDURES.md
        </code>
      </div>
    </div>
  );
}

// Helper component for test status
function TestStatusIndicator({ result }: { result: { status: string; message?: string } }) {
  const getStatusColor = () => {
    switch (result.status) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'running':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (result.status) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'running':
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className={`flex items-center gap-2 font-['Sniglet'] text-[12px] ${getStatusColor()}`}>
      {getStatusIcon()}
      <span>
        {result.status === 'pending' && 'Ready to test'}
        {result.status === 'running' && 'Running...'}
        {result.message || ''}
      </span>
    </div>
  );
}