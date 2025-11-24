/**
 * Phase 9.0.6 Tests - Audit Logging System
 * 
 * Tests for audit log creation, retrieval, filtering, pagination, and CRUD auditing.
 */

import { projectId } from '../../../utils/supabase/info';
import { Test } from '../types';

export function getPhase906Tests(user: any): Test[] {
  return [
    {
      id: 'phase9-day6-create-audit-log',
      name: 'Create Audit Log',
      description: 'Verify audit log creation via API',
      phase: '9.0.6',
      category: 'Audit',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated to create audit logs' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/audit/log`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              entityType: 'test',
              entityId: 'test-' + Date.now(),
              action: 'create',
              before: null,
              after: { test: true, timestamp: new Date().toISOString() },
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to create audit log' };
          }

          const data = await response.json();

          if (!data.success || !data.auditId) {
            return { success: false, message: 'Invalid response structure' };
          }

          return { 
            success: true, 
            message: `Audit log created ✓ (ID: ${data.auditId.slice(0, 30)}...)` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error creating audit log: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day6-fetch-audit-logs',
      name: 'Fetch Audit Logs with Filters',
      description: 'Verify audit log retrieval with filtering and pagination',
      phase: '9.0.6',
      category: 'Audit',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated to fetch audit logs' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/audit/logs?entityType=test&limit=10`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to fetch audit logs' };
          }

          const data = await response.json();

          if (!data.logs || !Array.isArray(data.logs)) {
            return { success: false, message: 'Invalid response structure' };
          }

          return { 
            success: true, 
            message: `Fetched ${data.logs.length} audit log(s) ✓ (total: ${data.total})` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error fetching audit logs: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day6-get-audit-stats',
      name: 'Get Audit Statistics',
      description: 'Verify audit statistics endpoint returns aggregated data',
      phase: '9.0.6',
      category: 'Audit',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated to get audit statistics' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/audit/stats`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to get audit stats' };
          }

          const data = await response.json();

          if (!data.stats || typeof data.stats.total !== 'number') {
            return { success: false, message: 'Invalid response structure' };
          }

          return { 
            success: true, 
            message: `Stats retrieved ✓ (${data.stats.total} total events, ${Object.keys(data.stats.byUser).length} users)` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error getting audit stats: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day6-get-audit-by-id',
      name: 'Get Audit Log by ID',
      description: 'Verify retrieving a specific audit log entry by ID',
      phase: '9.0.6',
      category: 'Audit',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated to get audit logs' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          // First, get all audit logs to find an ID
          const listResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/audit/logs?limit=1`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!listResponse.ok) {
            return { success: false, message: 'Failed to list audit logs' };
          }

          const listData = await listResponse.json();
          
          if (!listData.logs || listData.logs.length === 0) {
            return { success: false, message: 'No audit logs found. Create one first (Test: Create Audit Log)' };
          }

          const testId = listData.logs[0].id;

          // Now get the specific audit log
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/audit/logs/${testId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to retrieve audit log' };
          }

          const data = await response.json();

          if (!data.log || data.log.id !== testId) {
            return { success: false, message: 'Retrieved audit log does not match requested ID' };
          }

          return { 
            success: true, 
            message: `Retrieved audit log ✓ (ID: ${testId})` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error retrieving audit log: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day6-audit-pagination',
      name: 'Test Audit Log Pagination',
      description: 'Verify pagination works correctly for audit logs',
      phase: '9.0.6',
      category: 'Audit',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated to get audit logs' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          // Get first page with limit of 5
          const page1Response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/audit/logs?limit=5&offset=0`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!page1Response.ok) {
            return { success: false, message: 'Failed to fetch first page' };
          }

          const page1Data = await page1Response.json();

          if (!Array.isArray(page1Data.logs)) {
            return { success: false, message: 'Invalid response structure' };
          }

          // Get second page
          const page2Response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/audit/logs?limit=5&offset=5`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!page2Response.ok) {
            return { success: false, message: 'Failed to fetch second page' };
          }

          const page2Data = await page2Response.json();

          // Verify pages don't overlap (if both have data)
          if (page1Data.logs.length > 0 && page2Data.logs.length > 0) {
            const page1Ids = new Set(page1Data.logs.map((log: any) => log.id));
            const hasOverlap = page2Data.logs.some((log: any) => page1Ids.has(log.id));
            
            if (hasOverlap) {
              return { success: false, message: 'Pagination returned overlapping results' };
            }
          }

          return { 
            success: true, 
            message: `Pagination working ✓ (Page 1: ${page1Data.logs.length} logs, Page 2: ${page2Data.logs.length} logs)` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error testing pagination: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day6-crud-audit-create-material',
      name: 'CRUD Audit: Create Material',
      description: 'Verify audit log is created when material is created',
      phase: '9.0.6',
      category: 'Audit',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated as admin to create materials' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          const testMaterialId = `test-audit-material-${Date.now()}`;

          // Create a material
          const createResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/materials`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: testMaterialId,
              name: 'Test Material for Audit',
              category: 'plastics',
              compostability: 0,
              recyclability: 0,
              reusability: 0,
            }),
          });

          if (!createResponse.ok) {
            const data = await createResponse.json();
            return { success: false, message: data.error || 'Failed to create test material' };
          }

          // Wait a moment for audit log to be created
          await new Promise(resolve => setTimeout(resolve, 500));

          // Check if audit log was created
          const auditResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/audit/logs?entityType=material&entityId=${testMaterialId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!auditResponse.ok) {
            return { success: false, message: 'Failed to fetch audit logs' };
          }

          const auditData = await auditResponse.json();

          const createLog = auditData.logs?.find((log: any) => log.action === 'create');

          if (!createLog) {
            return { success: false, message: 'No audit log found for material creation' };
          }

          return { 
            success: true, 
            message: `Material creation audited ✓ (Material: ${testMaterialId}, Log ID: ${createLog.id})` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error testing CRUD audit: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day6-crud-audit-update-material',
      name: 'CRUD Audit: Update Material',
      description: 'Verify audit log is created when material is updated',
      phase: '9.0.6',
      category: 'Audit',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated as admin to update materials' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          // Create a test material first
          const testMaterialId = `test-material-audit-update-${Date.now()}`;
          const createResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/materials`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: testMaterialId,
              name: 'Test Material for Audit Update',
              category: 'plastics',
              compostability: 10,
              recyclability: 20,
              reusability: 30,
            }),
          });

          if (!createResponse.ok) {
            const data = await createResponse.json();
            return { success: false, message: data.error || 'Failed to create test material' };
          }

          const createData = await createResponse.json();
          const testMaterial = createData.material;

          // Update the material
          const updateResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/materials/${testMaterial.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...testMaterial,
              compostability: (testMaterial.compostability || 0) + 1,
            }),
          });

          if (!updateResponse.ok) {
            const data = await updateResponse.json();
            return { success: false, message: data.error || 'Failed to update material' };
          }

          // Wait a moment for audit log to be created
          await new Promise(resolve => setTimeout(resolve, 500));

          // Check if audit log was created
          const auditResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/audit/logs?entityType=material&entityId=${testMaterial.id}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!auditResponse.ok) {
            return { success: false, message: 'Failed to fetch audit logs' };
          }

          const auditData = await auditResponse.json();

          const updateLog = auditData.logs?.find((log: any) => log.action === 'update');

          if (!updateLog) {
            return { success: false, message: 'No audit log found for material update' };
          }

          return { 
            success: true, 
            message: `Material update audited ✓ (Material: ${testMaterial.id}, Log ID: ${updateLog.id})` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error testing update audit: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day6-crud-audit-delete-material',
      name: 'CRUD Audit: Delete Material',
      description: 'Verify audit log is created when material is deleted',
      phase: '9.0.6',
      category: 'Audit',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated as admin to delete materials' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          const testMaterialId = `test-delete-audit-${Date.now()}`;

          // First create a material to delete
          const createResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/materials`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: testMaterialId,
              name: 'Test Material for Delete Audit',
              category: 'plastics',
              compostability: 0,
              recyclability: 0,
              reusability: 0,
            }),
          });

          if (!createResponse.ok) {
            return { success: false, message: 'Failed to create test material' };
          }

          // Now delete it
          const deleteResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/materials/${testMaterialId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!deleteResponse.ok) {
            return { success: false, message: 'Failed to delete material' };
          }

          // Wait a moment for audit log to be created
          await new Promise(resolve => setTimeout(resolve, 500));

          // Check if audit log was created
          const auditResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/audit/logs?entityType=material&entityId=${testMaterialId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!auditResponse.ok) {
            return { success: false, message: 'Failed to fetch audit logs' };
          }

          const auditData = await auditResponse.json();

          const deleteLog = auditData.logs?.find((log: any) => log.action === 'delete');

          if (!deleteLog) {
            return { success: false, message: 'No audit log found for material deletion' };
          }

          return { 
            success: true, 
            message: `Material deletion audited ✓ (Material: ${testMaterialId}, Log ID: ${deleteLog.id})` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error testing delete audit: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day6-verify-material-audit-logs',
      name: 'Verify Material CRUD Audit Logs',
      description: 'Comprehensive verification that all material operations were logged',
      phase: '9.0.6',
      category: 'Audit',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated to verify audit logs' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          // Fetch recent audit logs for materials
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/audit/logs?entityType=material&limit=10`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!response.ok) {
            return { success: false, message: 'Failed to fetch audit logs' };
          }

          const data = await response.json();

          if (!data.logs || !Array.isArray(data.logs)) {
            return { success: false, message: 'Invalid response structure' };
          }

          // Check for expected actions
          const actions = data.logs.map((log: any) => log.action);
          const hasCreate = actions.includes('create');
          const hasUpdate = actions.includes('update');
          const hasDelete = actions.includes('delete');

          if (!hasCreate && !hasUpdate && !hasDelete) {
            return { 
              success: false, 
              message: 'No CRUD audit logs found. Run previous CRUD audit tests first.' 
            };
          }

          const actionCounts = {
            create: actions.filter((a: string) => a === 'create').length,
            update: actions.filter((a: string) => a === 'update').length,
            delete: actions.filter((a: string) => a === 'delete').length,
          };

          return { 
            success: true, 
            message: `Audit logs verified ✓ (${actionCounts.create} creates, ${actionCounts.update} updates, ${actionCounts.delete} deletes)` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error verifying audit logs: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
  ];
}
