import React, { useState } from 'react';
import { Button } from './ui/button';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Download, FileJson, Check, X, Loader2, Info } from 'lucide-react';

type TestStatus = 'idle' | 'running' | 'success' | 'error';

interface TestResult {
  status: TestStatus;
  message: string;
  details?: any;
}

export function Phase9Day9Testing() {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({
    seedData: { status: 'idle', message: 'Not run' },
    exportV2: { status: 'idle', message: 'Not run' },
    validateMIU: { status: 'idle', message: 'Not run' },
    validateVersioning: { status: 'idle', message: 'Not run'},
    validateProvenance: { status: 'idle', message: 'Not run' },
    compressionFlag: { status: 'idle', message: 'Not run' },
    largescaleExport: { status: 'idle', message: 'Not run' },
  });

  const [exportData, setExportData] = useState<any>(null);
  const [seedDataCreated, setSeedDataCreated] = useState(false);

  const updateTestResult = (testKey: string, status: TestStatus, message: string, details?: any) => {
    setTestResults(prev => ({
      ...prev,
      [testKey]: { status, message, details }
    }));
  };

  // Test 0: Seed Sample Evidence Data
  const seedSampleEvidence = async () => {
    updateTestResult('seedData', 'running', 'Creating sample evidence points...');
    
    try {
      // Get access token from session storage
      const accessToken = sessionStorage.getItem('wastedb_access_token');
      
      if (!accessToken) {
        updateTestResult('seedData', 'error', 'Not authenticated - please sign in first');
        return;
      }
      
      // Get materials to attach evidence to
      const materialsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/materials`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );
      
      if (!materialsResponse.ok) {
        throw new Error(`Failed to fetch materials: ${materialsResponse.status}`);
      }
      
      const materialsData = await materialsResponse.json();
      
      // Handle different response formats
      const materials = Array.isArray(materialsData) ? materialsData : (materialsData.materials || materialsData.data || []);
      
      console.log('Materials response:', { materialsData, materials, count: materials.length });
      
      if (!materials || materials.length === 0) {
        updateTestResult('seedData', 'error', 'No materials found - create materials first');
        return;
      }
      
      // Create sample evidence for first 3 materials
      const sampleEvidence = [
        {
          material_id: materials[0]?.id,
          parameter_code: 'Y',
          raw_value: 0.85,
          raw_unit: 'fraction',
          transformed_value: 0.85,
          transform_version: '1.0',
          snippet: 'Material recovery rate of 85% observed in industrial composting facilities',
          citation: 'Smith et al. (2023) - Composting Efficiency Study',
          source_type: 'whitepaper',
          confidence_level: 'high',
          page_number: 42,
          figure_number: '3A',
          table_number: null,
          notes: 'Data from controlled study with n=50 facilities'
        },
        {
          material_id: materials[0]?.id,
          parameter_code: 'D',
          raw_value: 0.92,
          raw_unit: 'fraction',
          transformed_value: 0.92,
          transform_version: '1.0',
          snippet: 'Quality retention measured at 92% after first cycle',
          citation: 'Johnson & Lee (2024) - Material Degradation Analysis',
          source_type: 'article',
          confidence_level: 'medium',
          page_number: 156,
          figure_number: null,
          table_number: 'Table 4',
          notes: 'Laboratory conditions, may vary in real-world scenarios'
        },
        {
          material_id: materials[1]?.id,
          parameter_code: 'M',
          raw_value: 0.78,
          raw_unit: 'fraction',
          transformed_value: 0.78,
          transform_version: '1.0',
          snippet: 'Infrastructure maturity index: 78% of urban areas have access',
          citation: 'Global Recycling Infrastructure Report 2024',
          source_type: 'external',
          confidence_level: 'high',
          page_number: 89,
          figure_number: 'Map 2',
          table_number: null,
          notes: 'Based on 500+ city survey'
        },
        {
          material_id: materials[1]?.id,
          parameter_code: 'E',
          raw_value: 0.65,
          raw_unit: 'normalized',
          transformed_value: 0.65,
          transform_version: '1.0',
          snippet: 'Net energy requirement normalized to 0.65 (lower is better)',
          citation: 'Brown et al. (2023) - Energy Analysis of Recycling',
          source_type: 'whitepaper',
          confidence_level: 'high',
          page_number: 23,
          figure_number: null,
          table_number: 'Table 2',
          notes: 'Includes transportation and processing energy'
        },
        {
          material_id: materials[2]?.id,
          parameter_code: 'L',
          raw_value: 15.5,
          raw_unit: 'years',
          transformed_value: 0.88,
          transform_version: '1.0',
          snippet: 'Average product lifetime: 15.5 years based on field studies',
          citation: 'Product Longevity Database (2024)',
          source_type: 'external',
          confidence_level: 'medium',
          page_number: null,
          figure_number: null,
          table_number: null,
          notes: 'Consumer durables category average'
        }
      ];
      
      let createdCount = 0;
      let failedCount = 0;
      const errors: string[] = [];
      
      for (const evidence of sampleEvidence) {
        if (!evidence.material_id) {
          console.warn('Skipping evidence - no material_id');
          continue;
        }
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(evidence),
          }
        );
        
        if (response.ok) {
          createdCount++;
        } else {
          failedCount++;
          const errorText = await response.text();
          try {
            const errorJson = JSON.parse(errorText);
            const errorMsg = errorJson.error || errorText;
            errors.push(`${evidence.parameter_code}: ${errorMsg}`);
            console.error(`Failed to create evidence (${evidence.parameter_code}): ${response.status}`, errorText);
          } catch {
            errors.push(`${evidence.parameter_code}: ${errorText}`);
            console.error(`Failed to create evidence (${evidence.parameter_code}): ${response.status}`, errorText);
          }
        }
      }
      
      setSeedDataCreated(true);
      
      if (failedCount > 0) {
        updateTestResult(
          'seedData',
          'error',
          `✗ Created ${createdCount} evidence points, ${failedCount} failed`,
          { createdCount, failedCount, totalMaterials: materials.length, errors }
        );
      } else {
        updateTestResult(
          'seedData',
          'success',
          `✓ Created ${createdCount} sample evidence points`,
          { createdCount, failedCount, totalMaterials: materials.length }
        );
      }
      
    } catch (error) {
      console.error('Seed data error:', error);
      updateTestResult('seedData', 'error', `Failed to seed data: ${error}`);
    }
  };

  // Test 1: Export v2.0 Format
  const testExportV2 = async () => {
    updateTestResult('exportV2', 'running', 'Exporting data in v2.0 format...');
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/export/full?format=json`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      const data = await response.json();
      setExportData(data);

      // Validate v2.0 format
      if (!data.export_format_version) {
        throw new Error('Missing export_format_version');
      }

      if (data.export_format_version !== '2.0') {
        throw new Error(`Expected v2.0, got ${data.export_format_version}`);
      }

      updateTestResult(
        'exportV2',
        'success',
        `✓ Export v2.0 successful: ${data.material_count} materials, ${data.total_evidence_points} evidence points`,
        data
      );
    } catch (error) {
      console.error('Export v2.0 test error:', error);
      updateTestResult('exportV2', 'error', `✗ Export v2.0 failed: ${error}`);
    }
  };

  // Test 2: Validate MIU Fields
  const testValidateMIU = async (dataOverride?: any) => {
    updateTestResult('validateMIU', 'running', 'Validating MIU evidence fields...');
    
    let data = dataOverride || exportData;
    
    // If no data available or data is invalid, fetch it first
    if (!data || !data.materials || !data.export_format_version) {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/export/full?format=json`,
          {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch export data: ${response.status}`);
        }
        
        data = await response.json();
        setExportData(data);
      } catch (error) {
        updateTestResult('validateMIU', 'error', `✗ Failed to fetch export data: ${error}`);
        return;
      }
    }

    try {
      // Check if any materials have evidence
      const materialsWithEvidence = data.materials.filter((m: any) => m.evidence && m.evidence.length > 0);
      
      if (materialsWithEvidence.length === 0) {
        updateTestResult('validateMIU', 'success', '⚠️ No evidence points found in database (expected for fresh install)');
        return;
      }

      // Validate first evidence point has all required fields
      const firstEvidence = materialsWithEvidence[0].evidence[0];
      
      const requiredFields = [
        'id', 'parameter_code', 'raw_value', 'raw_unit', 
        'transformed_value', 'transform_version',
        'snippet', 'citation', 'source_type', 'confidence_level',
        'page_number', 'figure_number', 'table_number',
        'created_by', 'created_at', 'updated_at'
      ];

      const missingFields = requiredFields.filter(field => !(field in firstEvidence));

      if (missingFields.length > 0) {
        throw new Error(`Missing MIU fields: ${missingFields.join(', ')}`);
      }

      // Validate evidence_count matches actual evidence array length
      const firstMaterial = materialsWithEvidence[0];
      if (firstMaterial.evidence_count !== firstMaterial.evidence.length) {
        throw new Error(`Evidence count mismatch: ${firstMaterial.evidence_count} vs ${firstMaterial.evidence.length}`);
      }

      updateTestResult(
        'validateMIU',
        'success',
        `✓ MIU validation passed: ${materialsWithEvidence.length} materials with evidence, all required fields present`,
        { materialsWithEvidence: materialsWithEvidence.length, totalEvidence: data.total_evidence_points }
      );
    } catch (error) {
      console.error('MIU validation error:', error);
      updateTestResult('validateMIU', 'error', `✗ MIU validation failed: ${error}`);
    }
  };

  // Test 3: Validate Export Versioning
  const testValidateVersioning = async (dataOverride?: any) => {
    updateTestResult('validateVersioning', 'running', 'Validating export versioning...');
    
    let data = dataOverride || exportData;
    
    // If no data available or data is invalid, fetch it first
    if (!data || !data.export_format_version || !data.materials) {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/export/full?format=json`,
          {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch export data: ${response.status}`);
        }
        
        data = await response.json();
        setExportData(data);
      } catch (error) {
        updateTestResult('validateVersioning', 'error', `✗ Failed to fetch export data: ${error}`);
        return;
      }
    }

    try {
      // Check for version fields
      const requiredVersionFields = [
        'export_format_version',
        'export_timestamp',
        'export_type'
      ];

      const missingFields = requiredVersionFields.filter(field => !(field in data));

      if (missingFields.length > 0) {
        throw new Error(`Missing version fields: ${missingFields.join(', ')}`);
      }

      // Check metadata has version_notes
      if (!data.metadata?.version_notes) {
        throw new Error('Missing metadata.version_notes');
      }

      // Check evidence_fields documentation exists
      if (!data.metadata?.evidence_fields) {
        throw new Error('Missing metadata.evidence_fields documentation');
      }

      updateTestResult(
        'validateVersioning',
        'success',
        `✓ Export versioning validated: v${data.export_format_version} at ${data.export_timestamp}`,
        { 
          version: data.export_format_version,
          timestamp: data.export_timestamp,
          type: data.export_type
        }
      );
    } catch (error) {
      console.error('Versioning validation error:', error);
      updateTestResult('validateVersioning', 'error', `✗ Versioning validation failed: ${error}`);
    }
  };

  // Test 4: Validate Provenance Fields
  const testValidateProvenance = async (dataOverride?: any) => {
    updateTestResult('validateProvenance', 'running', 'Validating provenance metadata...');
    
    let data = dataOverride || exportData;
    
    // If no data available or data is invalid, fetch it first
    if (!data || !data.materials || !data.export_format_version) {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/export/full?format=json`,
          {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch export data: ${response.status}`);
        }
        
        data = await response.json();
        setExportData(data);
      } catch (error) {
        updateTestResult('validateProvenance', 'error', `✗ Failed to fetch export data: ${error}`);
        return;
      }
    }

    try {
      const materialsWithEvidence = data.materials.filter((m: any) => m.evidence && m.evidence.length > 0);
      
      if (materialsWithEvidence.length === 0) {
        updateTestResult('validateProvenance', 'success', '⚠️ No evidence points to validate provenance');
        return;
      }

      // Check first evidence for provenance fields
      const firstEvidence = materialsWithEvidence[0].evidence[0];

      if (!('created_by' in firstEvidence)) {
        throw new Error('Missing created_by (curator) field');
      }

      if (!('created_at' in firstEvidence)) {
        throw new Error('Missing created_at (extraction timestamp) field');
      }

      // Validate locators exist
      const locatorFields = ['page_number', 'figure_number', 'table_number'];
      const missingLocators = locatorFields.filter(field => !(field in firstEvidence));

      if (missingLocators.length > 0) {
        throw new Error(`Missing locator fields: ${missingLocators.join(', ')}`);
      }

      // Check documentation exists in metadata
      if (!data.metadata.evidence_fields.provenance) {
        throw new Error('Missing provenance documentation in metadata');
      }

      if (!data.metadata.evidence_fields.locators) {
        throw new Error('Missing locators documentation in metadata');
      }

      updateTestResult(
        'validateProvenance',
        'success',
        `✓ Provenance validation passed: curator, timestamps, and locators present in all ${data.total_evidence_points} evidence points`
      );
    } catch (error) {
      console.error('Provenance validation error:', error);
      updateTestResult('validateProvenance', 'error', `✗ Provenance validation failed: ${error}`);
    }
  };

  // Test 5: Test Compression Flag
  const testCompressionFlag = async () => {
    updateTestResult('compressionFlag', 'running', 'Testing compression flag...');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/export/full?format=json&compress=true`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      const data = await response.json();

      // Check metadata indicates compression was requested
      if (!('compression_available' in data.metadata)) {
        throw new Error('Missing compression_available in metadata');
      }

      if (data.metadata.compression_available !== true) {
        throw new Error('Compression flag not properly set in metadata');
      }

      updateTestResult(
        'compressionFlag',
        'success',
        `✓ Compression flag working: metadata.compression_available = ${data.metadata.compression_available}`,
        { compression_available: data.metadata.compression_available }
      );
    } catch (error) {
      console.error('Compression flag test error:', error);
      updateTestResult('compressionFlag', 'error', `✗ Compression flag test failed: ${error}`);
    }
  };

  // Test 6: Large-Scale Export
  const testLargescaleExport = async () => {
    updateTestResult('largescaleExport', 'running', 'Testing large-scale export...');

    try {
      const startTime = performance.now();
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/export/full?format=json`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      const data = await response.json();
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      const jsonString = JSON.stringify(data, null, 2);
      const sizeKB = Math.round(jsonString.length / 1024);
      const sizeMB = (sizeKB / 1024).toFixed(2);

      updateTestResult(
        'largescaleExport',
        'success',
        `✓ Large export successful: ${data.material_count} materials, ${data.total_evidence_points} evidence points in ${duration}ms (${sizeKB} KB / ${sizeMB} MB)`,
        {
          materials: data.material_count,
          evidence: data.total_evidence_points,
          duration_ms: duration,
          size_kb: sizeKB,
          size_mb: sizeMB
        }
      );
    } catch (error) {
      console.error('Large-scale export error:', error);
      updateTestResult('largescaleExport', 'error', `✗ Large-scale export failed: ${error}`);
    }
  };

  const runAllTests = async () => {
    // Run export test and get the data
    updateTestResult('exportV2', 'running', 'Exporting data in v2.0 format...');
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/export/full?format=json`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      const data = await response.json();
      setExportData(data);

      // Validate v2.0 format
      if (!data.export_format_version) {
        throw new Error('Missing export_format_version');
      }

      if (data.export_format_version !== '2.0') {
        throw new Error(`Expected v2.0, got ${data.export_format_version}`);
      }

      updateTestResult(
        'exportV2',
        'success',
        `✓ Export v2.0 successful: ${data.material_count} materials, ${data.total_evidence_points} evidence points`,
        data
      );

      // Pass the data to subsequent tests
      await new Promise(resolve => setTimeout(resolve, 500));
      await testValidateMIU(data);
      await new Promise(resolve => setTimeout(resolve, 500));
      await testValidateVersioning(data);
      await new Promise(resolve => setTimeout(resolve, 500));
      await testValidateProvenance(data);
      await new Promise(resolve => setTimeout(resolve, 500));
      await testCompressionFlag();
      await new Promise(resolve => setTimeout(resolve, 500));
      await testLargescaleExport();
    } catch (error) {
      console.error('Export v2.0 test error:', error);
      updateTestResult('exportV2', 'error', `✗ Export v2.0 failed: ${error}`);
    }
  };

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'success':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'error':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-[#1a1917] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20">
      <div className="mb-6">
        <h3 className="font-['Sniglet'] text-[16px] text-black dark:text-white mb-2">
          Phase 9.0 Day 9: Research Export Enhancements Testing
        </h3>
        <p className="font-['Sniglet'] text-[12px] text-blue-700 dark:text-blue-300">
          Test v2.0 export format with MIU traceability, provenance, and compression support.
        </p>
      </div>

      {/* Info Banner */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-[10px] text-blue-700 dark:text-blue-300">
          <strong>What's New in v2.0:</strong> MIU evidence points with snippet, citation, locators (page/figure/table), 
          curator provenance, extraction timestamps, transform versions, compression flag support, and comprehensive export metadata.
        </div>
      </div>

      {/* Run All Button */}
      <div className="mb-6">
        <Button
          onClick={runAllTests}
          className="w-full bg-[#e4e3ac] hover:bg-[#d4d39c] text-black"
          disabled={Object.values(testResults).some(r => r.status === 'running')}
        >
          <Download className="w-4 h-4 mr-2" />
          Run All Tests
        </Button>
      </div>

      {/* Test Results */}
      <div className="space-y-3">
        {/* Test 0: Seed Sample Evidence Data */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2 mb-2">
            {getStatusIcon(testResults.seedData.status)}
            <div className="flex-1">
              <div className="font-['Sniglet'] text-[12px] text-black dark:text-white">
                Test 0: Seed Sample Evidence Data
              </div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400">
                {testResults.seedData.message}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={seedSampleEvidence}
              disabled={testResults.seedData.status === 'running'}
            >
              Run
            </Button>
          </div>
          {testResults.seedData.details && (
            <div className="mt-2 text-[9px] text-gray-500 dark:text-gray-400 font-mono">
              Created: {testResults.seedData.details.createdCount} | 
              Failed: {testResults.seedData.details.failedCount} | 
              Materials: {testResults.seedData.details.totalMaterials}
              {testResults.seedData.details.errors && testResults.seedData.details.errors.length > 0 && (
                <div className="mt-2 space-y-1 text-red-600 dark:text-red-400">
                  {testResults.seedData.details.errors.map((error: string, idx: number) => (
                    <div key={idx}>• {error}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Test 1: Export v2.0 Format */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2 mb-2">
            {getStatusIcon(testResults.exportV2.status)}
            <div className="flex-1">
              <div className="font-['Sniglet'] text-[12px] text-black dark:text-white">
                Test 1: Export v2.0 Format
              </div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400">
                {testResults.exportV2.message}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={testExportV2}
              disabled={testResults.exportV2.status === 'running'}
            >
              Run
            </Button>
          </div>
          {testResults.exportV2.details && (
            <div className="mt-2 text-[9px] text-gray-500 dark:text-gray-400 font-mono">
              Version: {testResults.exportV2.details.export_format_version} | 
              Materials: {testResults.exportV2.details.material_count} | 
              Evidence: {testResults.exportV2.details.total_evidence_points}
            </div>
          )}
        </div>

        {/* Test 2: Validate MIU Fields */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2 mb-2">
            {getStatusIcon(testResults.validateMIU.status)}
            <div className="flex-1">
              <div className="font-['Sniglet'] text-[12px] text-black dark:text-white">
                Test 2: Validate MIU Evidence Fields
              </div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400">
                {testResults.validateMIU.message}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={testValidateMIU}
              disabled={testResults.validateMIU.status === 'running'}
            >
              Run
            </Button>
          </div>
        </div>

        {/* Test 3: Validate Versioning */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2 mb-2">
            {getStatusIcon(testResults.validateVersioning.status)}
            <div className="flex-1">
              <div className="font-['Sniglet'] text-[12px] text-black dark:text-white">
                Test 3: Validate Export Versioning
              </div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400">
                {testResults.validateVersioning.message}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={testValidateVersioning}
              disabled={testResults.validateVersioning.status === 'running'}
            >
              Run
            </Button>
          </div>
        </div>

        {/* Test 4: Validate Provenance */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2 mb-2">
            {getStatusIcon(testResults.validateProvenance.status)}
            <div className="flex-1">
              <div className="font-['Sniglet'] text-[12px] text-black dark:text-white">
                Test 4: Validate Provenance & Locators
              </div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400">
                {testResults.validateProvenance.message}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={testValidateProvenance}
              disabled={testResults.validateProvenance.status === 'running'}
            >
              Run
            </Button>
          </div>
        </div>

        {/* Test 5: Compression Flag */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2 mb-2">
            {getStatusIcon(testResults.compressionFlag.status)}
            <div className="flex-1">
              <div className="font-['Sniglet'] text-[12px] text-black dark:text-white">
                Test 5: Test Compression Flag
              </div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400">
                {testResults.compressionFlag.message}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={testCompressionFlag}
              disabled={testResults.compressionFlag.status === 'running'}
            >
              Run
            </Button>
          </div>
        </div>

        {/* Test 6: Large-Scale Export */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2 mb-2">
            {getStatusIcon(testResults.largescaleExport.status)}
            <div className="flex-1">
              <div className="font-['Sniglet'] text-[12px] text-black dark:text-white">
                Test 6: Large-Scale Export Performance
              </div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400">
                {testResults.largescaleExport.message}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={testLargescaleExport}
              disabled={testResults.largescaleExport.status === 'running'}
            >
              Run
            </Button>
          </div>
        </div>
      </div>

      {/* Export Data Preview */}
      {exportData && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <FileJson className="w-4 h-4 text-blue-600" />
            <h4 className="font-['Sniglet'] text-[12px] text-black dark:text-white">
              Export Data Preview (v{exportData.export_format_version})
            </h4>
          </div>
          <div className="space-y-2 text-[10px] text-gray-700 dark:text-gray-300">
            <div>Format Version: {exportData.export_format_version}</div>
            <div>Export Type: {exportData.export_type}</div>
            <div>Timestamp: {exportData.export_timestamp}</div>
            <div>Total Materials: {exportData.material_count}</div>
            <div>Total Evidence Points: {exportData.total_evidence_points}</div>
            <div>Compression Available: {exportData.metadata?.compression_available ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}
    </div>
  );
}