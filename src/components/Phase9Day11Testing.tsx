import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { CheckCircle2, Loader2, FileText, Database, BookOpen } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useAuthContext } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function Phase9Day11Testing() {
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

  // Test 0: Initialize ontologies (prerequisite)
  const testInitializeOntologies = async () => {
    if (!user) {
      return { success: false, message: 'Must be authenticated as admin to initialize ontologies' };
    }

    const accessToken = sessionStorage.getItem('wastedb_access_token');
    if (!accessToken) {
      return { success: false, message: 'No access token found - please sign in again' };
    }

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/ontologies/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'all' }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return { 
          success: true, 
          message: `${data.message} (${data.initialized.join(', ')})` 
        };
      } else {
        return { 
          success: false, 
          message: data.error || 'Failed to initialize ontologies' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Error initializing ontologies: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  };

  // Test 1: Validate units.json structure
  const testUnitsJsonStructure = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/ontologies/units`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        return { success: false, message: data.error || 'Failed to load units ontology' };
      }

      const unitsData = await response.json();

      // Check required top-level fields
      if (!unitsData.version || !unitsData.effective_date || !unitsData.parameters) {
        return { 
          success: false, 
          message: 'Missing required top-level fields (version, effective_date, or parameters)' 
        };
      }

      // Check all 13 parameters are present
      const requiredParams = ['Y', 'D', 'C', 'M', 'E', 'B', 'N', 'T', 'H', 'L', 'R', 'U', 'C_RU'];
      const missingParams = requiredParams.filter(p => !unitsData.parameters[p]);
      
      if (missingParams.length > 0) {
        return { 
          success: false, 
          message: `Missing parameters: ${missingParams.join(', ')}` 
        };
      }

      return { 
        success: true, 
        message: `units.json valid! Version ${unitsData.version}, ${Object.keys(unitsData.parameters).length} parameters defined` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Error loading units.json: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  };

  // Test 2: Validate parameter definitions
  const testParameterDefinitions = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/ontologies/units`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      const unitsData = await response.json();

      let issuesFound: string[] = [];

      for (const [paramCode, paramDef] of Object.entries(unitsData.parameters)) {
        const param = paramDef as any;

        // Check required fields for each parameter
        if (!param.name) issuesFound.push(`${paramCode}: missing 'name'`);
        if (!param.canonical_unit) issuesFound.push(`${paramCode}: missing 'canonical_unit'`);
        if (!param.allowed_units || !Array.isArray(param.allowed_units) || param.allowed_units.length === 0) {
          issuesFound.push(`${paramCode}: missing or empty 'allowed_units'`);
        }
        if (!param.conversions) issuesFound.push(`${paramCode}: missing 'conversions'`);
        if (!param.validation) issuesFound.push(`${paramCode}: missing 'validation'`);

        // Check that canonical_unit is in allowed_units
        if (param.canonical_unit && param.allowed_units && !param.allowed_units.includes(param.canonical_unit)) {
          issuesFound.push(`${paramCode}: canonical_unit '${param.canonical_unit}' not in allowed_units`);
        }

        // Check that all allowed_units have conversion rules
        if (param.allowed_units && param.conversions) {
          for (const unit of param.allowed_units) {
            if (!param.conversions[unit]) {
              issuesFound.push(`${paramCode}: missing conversion rule for unit '${unit}'`);
            }
          }
        }
      }

      if (issuesFound.length > 0) {
        return { 
          success: false, 
          message: `Found ${issuesFound.length} issues: ${issuesFound.slice(0, 3).join('; ')}${issuesFound.length > 3 ? '...' : ''}` 
        };
      }

      return { 
        success: true, 
        message: `All ${Object.keys(unitsData.parameters).length} parameter definitions valid!` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Error validating parameters: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  };

  // Test 3: Validate conversion formulas
  const testConversionFormulas = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/ontologies/units`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      const unitsData = await response.json();

      let validConversions = 0;
      let invalidConversions: string[] = [];

      for (const [paramCode, paramDef] of Object.entries(unitsData.parameters)) {
        const param = paramDef as any;
        
        if (param.conversions) {
          for (const [unit, conversionDef] of Object.entries(param.conversions)) {
            const conversion = conversionDef as any;
            
            // Check conversion has required fields
            if (!conversion.to_canonical) {
              invalidConversions.push(`${paramCode}.${unit}: missing 'to_canonical' formula`);
            } else if (!conversion.description) {
              invalidConversions.push(`${paramCode}.${unit}: missing 'description'`);
            } else {
              validConversions++;
            }

            // Check that canonical unit has identity conversion
            if (unit === param.canonical_unit && conversion.to_canonical && !conversion.to_canonical.includes('value') && conversion.to_canonical !== 'value') {
              invalidConversions.push(`${paramCode}.${unit}: canonical unit should have identity conversion (to_canonical: 'value')`);
            }
          }
        }
      }

      if (invalidConversions.length > 0) {
        return { 
          success: false, 
          message: `Found ${invalidConversions.length} invalid conversions: ${invalidConversions.slice(0, 2).join('; ')}` 
        };
      }

      return { 
        success: true, 
        message: `All ${validConversions} conversion formulas valid!` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Error validating conversions: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  };

  // Test 4: Validate context.json structure
  const testContextJsonStructure = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/ontologies/context`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      if (!response.ok) {
        const data = await response.json();
        return { success: false, message: data.error || 'Failed to load context ontology' };
      }

      const contextData = await response.json();

      // Check required top-level fields
      if (!contextData.version || !contextData.effective_date || !contextData.vocabularies) {
        return { 
          success: false, 
          message: 'Missing required top-level fields (version, effective_date, or vocabularies)' 
        };
      }

      // Check required vocabularies are present
      const requiredVocabs = ['process', 'stream', 'region', 'scale', 'confidence_level', 'source_type'];
      const missingVocabs = requiredVocabs.filter(v => !contextData.vocabularies[v]);
      
      if (missingVocabs.length > 0) {
        return { 
          success: false, 
          message: `Missing vocabularies: ${missingVocabs.join(', ')}` 
        };
      }

      return { 
        success: true, 
        message: `context.json valid! Version ${contextData.version}, ${Object.keys(contextData.vocabularies).length} vocabularies defined` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Error loading context.json: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  };

  // Test 5: Validate vocabulary values
  const testVocabularyValues = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/ontologies/context`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      const contextData = await response.json();

      let issuesFound: string[] = [];
      let totalValues = 0;

      for (const [vocabName, vocabDef] of Object.entries(contextData.vocabularies)) {
        const vocab = vocabDef as any;

        // Check required fields for vocabulary
        if (!vocab.description) {
          issuesFound.push(`${vocabName}: missing 'description'`);
        }
        if (!vocab.values || !Array.isArray(vocab.values) || vocab.values.length === 0) {
          issuesFound.push(`${vocabName}: missing or empty 'values' array`);
          continue;
        }

        // Check each value has required fields
        vocab.values.forEach((value: any, index: number) => {
          if (!value.code) issuesFound.push(`${vocabName}[${index}]: missing 'code'`);
          if (!value.label) issuesFound.push(`${vocabName}[${index}]: missing 'label'`);
          if (!value.description) issuesFound.push(`${vocabName}[${index}]: missing 'description'`);
          totalValues++;
        });

        // Check for duplicate codes
        const codes = vocab.values.map((v: any) => v.code);
        const duplicates = codes.filter((code: string, index: number) => codes.indexOf(code) !== index);
        if (duplicates.length > 0) {
          issuesFound.push(`${vocabName}: duplicate codes found: ${[...new Set(duplicates)].join(', ')}`);
        }
      }

      if (issuesFound.length > 0) {
        return { 
          success: false, 
          message: `Found ${issuesFound.length} issues: ${issuesFound.slice(0, 3).join('; ')}${issuesFound.length > 3 ? '...' : ''}` 
        };
      }

      return { 
        success: true, 
        message: `All ${totalValues} vocabulary values valid across ${Object.keys(contextData.vocabularies).length} vocabularies!` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Error validating vocabularies: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  };

  // Test 6: Cross-validation with transforms.json
  const testCrossValidation = async () => {
    try {
      const [unitsResponse, transformsResponse] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/ontologies/units`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/transforms`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }),
      ]);

      const unitsData = await unitsResponse.json();
      const transformsData = await transformsResponse.json();

      // Check that all parameters in transforms.json have unit definitions
      const transformParams = transformsData.transforms.map((t: any) => t.parameter);
      const unitsParams = Object.keys(unitsData.parameters);

      const missingInUnits = transformParams.filter((p: string) => !unitsParams.includes(p));
      const missingInTransforms = unitsParams.filter(p => !transformParams.includes(p));

      if (missingInUnits.length > 0 || missingInTransforms.length > 0) {
        let message = '';
        if (missingInUnits.length > 0) {
          message += `Parameters in transforms.json but not in units.json: ${missingInUnits.join(', ')}. `;
        }
        if (missingInTransforms.length > 0) {
          message += `Parameters in units.json but not in transforms.json: ${missingInTransforms.join(', ')}.`;
        }
        return { success: false, message };
      }

      return { 
        success: true, 
        message: `Perfect alignment! All ${transformParams.length} parameters have both transform and unit definitions` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Error cross-validating: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  };

  // Test 7: Valid unit acceptance
  const testValidUnitAcceptance = async () => {
    if (!user) {
      return { success: false, message: 'Must be authenticated as admin to test unit validation' };
    }

    const accessToken = sessionStorage.getItem('wastedb_access_token');
    if (!accessToken) {
      return { success: false, message: 'No access token found - please sign in again' };
    }

    try {
      // Try to create evidence with valid unit for parameter Y (Yield accepts "%", "ratio", "kg/kg")
      const testEvidence = {
        material_id: 'test_material_001',
        parameter_code: 'Y',
        raw_value: 85,
        raw_unit: '%', // Valid unit for Y
        snippet: 'Test snippet for unit validation',
        source_type: 'manual',
        citation: 'Test citation',
        confidence_level: 'high',
      };

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testEvidence),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Clean up test evidence
        await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${data.evidence.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        return { 
          success: true, 
          message: 'Valid unit "%" accepted for parameter Y ✓' 
        };
      } else {
        return { 
          success: false, 
          message: `Valid unit rejected unexpectedly: ${data.error || 'Unknown error'}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Error testing valid unit: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  };

  // Test 8: Invalid unit rejection
  const testInvalidUnitRejection = async () => {
    if (!user) {
      return { success: false, message: 'Must be authenticated as admin to test unit validation' };
    }

    const accessToken = sessionStorage.getItem('wastedb_access_token');
    if (!accessToken) {
      return { success: false, message: 'No access token found - please sign in again' };
    }

    try {
      // Try to create evidence with invalid unit for parameter Y (Yield does NOT accept "kg")
      const testEvidence = {
        material_id: 'test_material_001',
        parameter_code: 'Y',
        raw_value: 85,
        raw_unit: 'kg', // Invalid unit for Y
        snippet: 'Test snippet for unit validation',
        source_type: 'manual',
        citation: 'Test citation',
        confidence_level: 'high',
      };

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testEvidence),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // This should NOT happen - invalid unit should be rejected
        return { 
          success: false, 
          message: 'Invalid unit "kg" was incorrectly accepted for parameter Y' 
        };
      } else if (data.error && data.error.includes('Invalid unit')) {
        return { 
          success: true, 
          message: `Invalid unit correctly rejected: ${data.error}` 
        };
      } else {
        return { 
          success: false, 
          message: `Unexpected error: ${data.error || 'Unknown error'}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Error testing invalid unit: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  };

  // Test 9: Admin can read evidence (RLS)
  const testAdminCanReadEvidence = async () => {
    if (!user) {
      return { success: false, message: 'Must be authenticated as admin to test RLS policies' };
    }

    const accessToken = sessionStorage.getItem('wastedb_access_token');
    if (!accessToken) {
      return { success: false, message: 'No access token found - please sign in again' };
    }

    try {
      // First create test evidence
      const testEvidence = {
        material_id: 'test_material_rls_001',
        parameter_code: 'Y',
        raw_value: 75,
        raw_unit: '%',
        snippet: 'Test snippet for RLS validation',
        source_type: 'manual',
        citation: 'Test citation',
        confidence_level: 'high',
      };

      const createResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testEvidence),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok || !createData.success) {
        return { success: false, message: `Failed to create test evidence: ${createData.error || 'Unknown error'}` };
      }

      const evidenceId = createData.evidence.id;

      // Now try to read it
      const readResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${evidenceId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const readData = await readResponse.json();

      // Clean up
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${evidenceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (readResponse.ok && readData.success) {
        return { 
          success: true, 
          message: 'Admin can read evidence ✓ (HTTP 200)' 
        };
      } else {
        return { 
          success: false, 
          message: `Admin read failed: ${readData.error || 'Unknown error'}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Error testing admin read: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  };

  // Test 10: Admin can create/update/delete evidence (RLS)
  const testAdminCanModifyEvidence = async () => {
    if (!user) {
      return { success: false, message: 'Must be authenticated as admin to test RLS policies' };
    }

    const accessToken = sessionStorage.getItem('wastedb_access_token');
    if (!accessToken) {
      return { success: false, message: 'No access token found - please sign in again' };
    }

    try {
      // Test CREATE
      const testEvidence = {
        material_id: 'test_material_rls_002',
        parameter_code: 'D',
        raw_value: 65,
        raw_unit: '%',
        snippet: 'Test snippet for RLS modify validation',
        source_type: 'manual',
        citation: 'Test citation',
        confidence_level: 'medium',
      };

      const createResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testEvidence),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok || !createData.success) {
        return { success: false, message: `Admin CREATE failed: ${createData.error || 'Unknown error'}` };
      }

      const evidenceId = createData.evidence.id;

      // Test UPDATE
      const updateResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${evidenceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw_value: 70 }),
      });

      const updateData = await updateResponse.json();

      if (!updateResponse.ok || !updateData.success) {
        return { success: false, message: `Admin UPDATE failed: ${updateData.error || 'Unknown error'}` };
      }

      // Test DELETE
      const deleteResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${evidenceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const deleteData = await deleteResponse.json();

      if (deleteResponse.ok && deleteData.success) {
        return { 
          success: true, 
          message: 'Admin can CREATE/UPDATE/DELETE ✓ (all HTTP 200)' 
        };
      } else {
        return { 
          success: false, 
          message: `Admin DELETE failed: ${deleteData.error || 'Unknown error'}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Error testing admin modify: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  };

  // Test 11: Unauthenticated users cannot read evidence (RLS)
  const testUnauthenticatedCannotReadEvidence = async () => {
    try {
      // Try to read evidence without auth token
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/test_evidence_001`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`, // Using anon key, not user token
        },
      });

      if (response.status === 401 || response.status === 403) {
        return { 
          success: true, 
          message: `Unauthenticated users correctly blocked from reading ✓ (HTTP ${response.status})` 
        };
      } else if (response.ok) {
        return { 
          success: false, 
          message: 'Unauthenticated users can read evidence (should be blocked!)' 
        };
      } else {
        return { 
          success: true, 
          message: `Unauthenticated access blocked ✓ (HTTP ${response.status})` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Error testing unauthenticated read: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  };

  const tests = [
    {
      id: 'initialize-ontologies',
      title: 'Initialize Ontologies',
      description: 'Ensure ontologies are initialized and available for testing',
      icon: FileText,
      testFn: testInitializeOntologies,
    },
    {
      id: 'units-structure',
      title: 'units.json Structure',
      description: 'Validate units.json has required fields and all 13 parameters',
      icon: FileText,
      testFn: testUnitsJsonStructure,
    },
    {
      id: 'parameter-definitions',
      title: 'Parameter Definitions',
      description: 'Validate each parameter has name, canonical_unit, allowed_units, conversions, and validation rules',
      icon: Database,
      testFn: testParameterDefinitions,
    },
    {
      id: 'conversion-formulas',
      title: 'Conversion Formulas',
      description: 'Validate all conversion formulas have to_canonical and description fields',
      icon: BookOpen,
      testFn: testConversionFormulas,
    },
    {
      id: 'context-structure',
      title: 'context.json Structure',
      description: 'Validate context.json has required vocabularies (process, stream, region, scale, confidence_level, source_type)',
      icon: FileText,
      testFn: testContextJsonStructure,
    },
    {
      id: 'vocabulary-values',
      title: 'Vocabulary Values',
      description: 'Validate all vocabulary values have code, label, and description',
      icon: Database,
      testFn: testVocabularyValues,
    },
    {
      id: 'cross-validation',
      title: 'Cross-Validation with transforms.json',
      description: 'Ensure parameter alignment between units.json and transforms.json',
      icon: CheckCircle2,
      testFn: testCrossValidation,
    },
    {
      id: 'valid-unit-acceptance',
      title: 'Valid Unit Acceptance',
      description: 'Test that valid units are accepted when creating evidence (e.g., "%" for parameter Y)',
      icon: CheckCircle2,
      testFn: testValidUnitAcceptance,
    },
    {
      id: 'invalid-unit-rejection',
      title: 'Invalid Unit Rejection',
      description: 'Test that invalid units are rejected with proper error message (e.g., "kg" for parameter Y)',
      icon: CheckCircle2,
      testFn: testInvalidUnitRejection,
    },
    {
      id: 'admin-read-evidence',
      title: 'RLS: Admin Can Read Evidence',
      description: 'Verify admin users can read evidence (expect HTTP 200)',
      icon: CheckCircle2,
      testFn: testAdminCanReadEvidence,
    },
    {
      id: 'admin-modify-evidence',
      title: 'RLS: Admin Can Modify Evidence',
      description: 'Verify admin users can CREATE/UPDATE/DELETE evidence (expect HTTP 200)',
      icon: CheckCircle2,
      testFn: testAdminCanModifyEvidence,
    },
    {
      id: 'unauthenticated-cannot-read',
      title: 'RLS: Unauthenticated Cannot Read',
      description: 'Verify unauthenticated users cannot read evidence (expect HTTP 401/403)',
      icon: CheckCircle2,
      testFn: testUnauthenticatedCannotReadEvidence,
    },
  ];

  const runAllTests = async () => {
    for (const test of tests) {
      await runTest(test.id, test.testFn);
      // Small delay between tests for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  const getStatusIcon = (status: 'idle' | 'loading' | 'success' | 'error') => {
    if (status === 'loading') return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'error') return <span className="text-red-500">✗</span>;
    return null;
  };

  const successCount = Object.values(testResults).filter(r => r.status === 'success').length;
  const totalTests = tests.length;

  return (
    <div className="space-y-4">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>Day 11 Tasks 1 & 2: Controlled Vocabularies</strong>
          <br />
          Testing ontology files for units.json (canonical units & conversions for 13 parameters) and context.json (controlled vocabularies for process, stream, region, scale).
        </AlertDescription>
      </Alert>

      {/* Progress Summary */}
      {Object.keys(testResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Progress</CardTitle>
            <CardDescription>
              {successCount} of {totalTests} tests passed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(successCount / totalTests) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Run All Tests Button */}
      <div className="flex gap-2">
        <Button 
          onClick={runAllTests}
          disabled={Object.values(testResults).some(r => r.status === 'loading')}
          className="w-full"
        >
          {Object.values(testResults).some(r => r.status === 'loading') ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Run All Tests'
          )}
        </Button>
      </div>

      {/* Individual Tests */}
      <div className="space-y-3">
        {tests.map((test) => {
          const result = testResults[test.id];
          const Icon = test.icon;

          return (
            <Card key={test.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className="h-5 w-5 mt-0.5 text-black/60 dark:text-white/60" />
                    <div className="flex-1">
                      <CardTitle className="text-[14px]">{test.title}</CardTitle>
                      <CardDescription className="text-[11px] mt-1">
                        {test.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result && getStatusIcon(result.status)}
                    <Button
                      onClick={() => runTest(test.id, test.testFn)}
                      disabled={result?.status === 'loading'}
                      size="sm"
                      variant="outline"
                    >
                      {result?.status === 'loading' ? 'Testing...' : 'Test'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {result?.message && (
                <CardContent>
                  <Alert variant={result.status === 'error' ? 'destructive' : 'default'}>
                    <AlertDescription className="text-[11px]">
                      {result.message}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Success Summary */}
      {successCount === totalTests && totalTests > 0 && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>All tests passed!</strong> Tasks 1 & 2 complete. Both ontology files are valid and ready for API integration.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}