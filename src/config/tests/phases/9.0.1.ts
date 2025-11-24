/**
 * Phase 9.0.1 Tests - Legal/DMCA Takedown System
 * 
 * Tests for DMCA takedown request submission, tracking, and admin management.
 */

import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { Test } from '../types';

export function getPhase901Tests(user: any): Test[] {
  return [
    {
      id: 'phase9-day1-takedown-submit',
      name: 'Submit DMCA Takedown Request',
      description: 'Verify takedown form submission creates request with Request ID',
      phase: '9.0.1',
      category: 'Legal/DMCA',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated as admin to bypass rate limit' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          const testData = {
            fullName: 'Test User',
            email: 'test@example.com',
            workTitle: 'Test Copyrighted Work',
            relationship: 'copyright_owner',
            wastedbURL: 'https://wastedb.example.com/materials/test-material',
            contentDescription: 'This is a test description of the allegedly infringing content that appears on the WasteDB platform.',
            signature: 'Test User',
            honeypot: '', // Anti-bot field
            goodFaithBelief: true,
            accuracyStatement: true,
            misrepresentationWarning: true,
          };

          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/legal/takedown`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData),
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to submit takedown request' };
          }

          const data = await response.json();

          if (!data.requestID || !data.requestID.startsWith('TR-')) {
            return { 
              success: false, 
              message: 'Invalid Request ID format (should start with TR-)' 
            };
          }

          return { 
            success: true, 
            message: `Takedown request submitted ✓ (Request ID: ${data.requestID})` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error submitting takedown request: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day1-takedown-status',
      name: 'Track Takedown Request Status',
      description: 'Verify takedown status endpoint returns request details',
      phase: '9.0.1',
      category: 'Legal/DMCA',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated as admin to bypass rate limit' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          // First create a test request
          const testData = {
            fullName: 'Status Test User',
            email: 'statustest@example.com',
            workTitle: 'Status Test Copyrighted Work',
            relationship: 'copyright_owner',
            wastedbURL: 'https://wastedb.example.com/materials/status-test',
            contentDescription: 'This is a status test description of the allegedly infringing content.',
            signature: 'Status Test User',
            honeypot: '',
            goodFaithBelief: true,
            accuracyStatement: true,
            misrepresentationWarning: true,
          };

          const submitResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/legal/takedown`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData),
          });

          if (!submitResponse.ok) {
            const errorData = await submitResponse.json();
            return { success: false, message: errorData.error || 'Failed to create test request' };
          }

          const submitData = await submitResponse.json();
          const requestID = submitData.requestID;

          // Now check status
          const statusResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/legal/takedown/status/${requestID}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          });

          if (!statusResponse.ok) {
            const data = await statusResponse.json();
            return { success: false, message: data.error || 'Failed to retrieve status' };
          }

          const statusData = await statusResponse.json();

          if (!statusData.status || statusData.status !== 'pending') {
            return { 
              success: false, 
              message: 'Status not set to pending for new request' 
            };
          }

          if (!statusData.submittedAt) {
            return { 
              success: false, 
              message: 'Missing submission timestamp' 
            };
          }

          return { 
            success: true, 
            message: `Status tracking works ✓ (ID: ${requestID}, Status: ${statusData.status})` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error tracking status: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day1-takedown-admin-list',
      name: 'Admin: List All Takedown Requests',
      description: 'Verify admin can retrieve all takedown requests',
      phase: '9.0.1',
      category: 'Legal/DMCA',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated as admin to access admin endpoints' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/admin/takedown`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to retrieve admin takedown list' };
          }

          const data = await response.json();

          if (!Array.isArray(data.requests)) {
            return { 
              success: false, 
              message: 'Response does not contain requests array' 
            };
          }

          return { 
            success: true, 
            message: `Admin list retrieved ✓ (${data.requests.length} requests found)` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error retrieving admin list: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day1-takedown-admin-update',
      name: 'Admin: Update Takedown Request',
      description: 'Verify admin can update request status and resolution',
      phase: '9.0.1',
      category: 'Legal/DMCA',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated as admin to update requests' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          // First create a test request
          const testData = {
            fullName: 'Admin Update Test',
            email: 'admintest@example.com',
            workTitle: 'Admin Test Copyrighted Work',
            relationship: 'copyright_owner',
            wastedbURL: 'https://wastedb.example.com/materials/admin-test',
            contentDescription: 'This is an admin test description of the allegedly infringing content.',
            signature: 'Admin Update Test',
            honeypot: '',
            goodFaithBelief: true,
            accuracyStatement: true,
            misrepresentationWarning: true,
          };

          const submitResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/legal/takedown`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData),
          });

          const submitData = await submitResponse.json();
          const requestID = submitData.requestID;

          // Now update the request
          const updateData = {
            status: 'UNDER_REVIEW',
            resolution: 'CONTENT_REMOVED',
            reviewNotes: 'Test review notes from automated test',
          };

          const updateResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/admin/takedown/${requestID}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
          });

          if (!updateResponse.ok) {
            const data = await updateResponse.json();
            return { success: false, message: data.error || 'Failed to update request' };
          }

          const updateResult = await updateResponse.json();

          if (!updateResult.success) {
            return { 
              success: false, 
              message: 'Update did not return success=true' 
            };
          }

          return { 
            success: true, 
            message: `Admin update successful ✓ (ID: ${requestID}, new status: UNDER_REVIEW)` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error updating request: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
  ];
}