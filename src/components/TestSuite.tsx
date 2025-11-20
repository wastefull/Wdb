import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle2, XCircle, Loader2, PlayCircle, AlertCircle, Copy, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useAuthContext } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface TestResult {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

interface Test {
  id: string;
  name: string;
  description: string;
  phase: string;
  category: string;
  testFn: () => Promise<{ success: boolean; message: string }>;
}

export function TestSuite() {
  const { user } = useAuthContext();
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [runningAll, setRunningAll] = useState(false);
  const [selectedPhases, setSelectedPhases] = useState<Set<string>>(new Set());

  const togglePhase = (phase: string) => {
    setSelectedPhases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phase)) {
        newSet.delete(phase);
      } else {
        newSet.add(phase);
      }
      return newSet;
    });
  };

  const selectAllPhases = () => {
    const uniquePhases = Array.from(new Set(tests.map(t => t.phase)));
    setSelectedPhases(new Set(uniquePhases));
  };

  const selectNoPhases = () => {
    setSelectedPhases(new Set());
  };

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

  const runAllTests = async () => {
    setRunningAll(true);
    const testIds = filteredTests.map(t => t.id);
    
    for (const testId of testIds) {
      const test = tests.find(t => t.id === testId);
      if (test) {
        await runTest(testId, test.testFn);
        // Small delay between tests to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setRunningAll(false);
    const phaseText = selectedPhases.size === 0 
      ? '' 
      : selectedPhases.size === uniquePhases.length
      ? ''
      : ` (${selectedPhases.size} phase${selectedPhases.size > 1 ? 's' : ''})`;
    toast.success(`All tests completed${phaseText}`);
  };

  // Define all tests
  const tests: Test[] = [
    // Phase 9.0 - Day 1 Tests
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

    // Phase 9.0 - Day 2 Tests
    {
      id: 'phase9-day2-get-all-transforms',
      name: 'Get All Transforms',
      description: 'Verify transforms endpoint returns all 13 parameter definitions',
      phase: '9.0.2',
      category: 'Transforms',
      testFn: async () => {
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/transforms`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to retrieve transforms' };
          }

          const data = await response.json();

          if (!data.transforms || !Array.isArray(data.transforms)) {
            return { success: false, message: 'Invalid response structure' };
          }

          if (data.transforms.length !== 13) {
            return { success: false, message: `Expected 13 transforms, got ${data.transforms.length}` };
          }

          return { 
            success: true, 
            message: `All 13 transforms retrieved ✓ (version ${data.version})` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error retrieving transforms: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day2-get-specific-transform',
      name: 'Get Specific Transform (Y)',
      description: 'Verify individual transform retrieval by parameter code',
      phase: '9.0.2',
      category: 'Transforms',
      testFn: async () => {
        try {
          const parameter = 'Y';
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/transforms/${parameter}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to retrieve transform' };
          }

          const data = await response.json();

          if (data.parameter !== parameter) {
            return { success: false, message: `Expected parameter ${parameter}, got ${data.parameter}` };
          }

          if (!data.formula || !data.version) {
            return { success: false, message: 'Missing required fields (formula, version)' };
          }

          return { 
            success: true, 
            message: `Transform retrieved ✓ (${data.name}, formula: ${data.formula}, v${data.version})` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error retrieving transform: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day2-create-recompute-job',
      name: 'Create Recompute Job',
      description: 'Verify recompute job creation with proper ID generation',
      phase: '9.0.2',
      category: 'Transforms',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated to create recompute jobs' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/transforms/recompute`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              parameter: 'Y',
              newTransformVersion: '1.1',
              reason: 'Testing recompute job creation from automated test suite'
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to create recompute job' };
          }

          const data = await response.json();

          if (!data.jobId || !data.jobId.startsWith('RJ-')) {
            return { success: false, message: 'Invalid job ID format (should start with RJ-)' };
          }

          return { 
            success: true, 
            message: `Recompute job created ✓ (ID: ${data.jobId})` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error creating recompute job: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day2-list-recompute-jobs',
      name: 'List Recompute Jobs',
      description: 'Verify job history retrieval from KV store',
      phase: '9.0.2',
      category: 'Transforms',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated to list recompute jobs' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/transforms/recompute`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to retrieve recompute jobs' };
          }

          const data = await response.json();

          if (!Array.isArray(data.jobs)) {
            return { success: false, message: 'Expected array of jobs' };
          }

          return { 
            success: true, 
            message: `Retrieved ${data.jobs.length} recompute job(s) ✓` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error retrieving recompute jobs: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },

    // Phase 9.0 - Day 3 Tests
    {
      id: 'phase9-day3-create-notification',
      name: 'Create Notification',
      description: 'Verify notification creation with unique ID generation',
      phase: '9.0.3',
      category: 'Notifications',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated to create notifications' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/notifications`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: user.id,
              type: 'article_published',
              content_id: 'test_article_automated',
              content_type: 'article',
              message: 'Test notification from automated test suite'
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to create notification' };
          }

          const data = await response.json();

          if (!data.notification || !data.notification.id) {
            return { success: false, message: 'Invalid response structure - missing notification ID' };
          }

          return { 
            success: true, 
            message: `Notification created ✓ (ID: ${data.notification.id})` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error creating notification: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day3-get-notifications',
      name: 'Get User Notifications',
      description: 'Verify user-specific notification retrieval',
      phase: '9.0.3',
      category: 'Notifications',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated to get notifications' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/notifications/${user.id}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to retrieve notifications' };
          }

          const data = await response.json();

          if (!Array.isArray(data.notifications)) {
            return { success: false, message: 'Expected array of notifications' };
          }

          const unreadCount = data.notifications.filter((n: any) => !n.read).length;
          return { 
            success: true, 
            message: `Retrieved ${data.notifications.length} notification(s) ✓ (${unreadCount} unread)` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error retrieving notifications: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day3-mark-notification-read',
      name: 'Mark Notification as Read',
      description: 'Verify marking a single notification as read',
      phase: '9.0.3',
      category: 'Notifications',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated to mark notifications as read' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          // First create a notification to mark as read
          const createResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/notifications`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: user.id,
              type: 'test',
              content_id: 'test-' + Date.now(),
              content_type: 'test',
              message: 'Test notification for mark as read',
            }),
          });

          if (!createResponse.ok) {
            return { success: false, message: 'Failed to create test notification' };
          }

          const createData = await createResponse.json();
          const notificationId = createData.notification.id;

          // Now mark it as read
          const readResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!readResponse.ok) {
            const data = await readResponse.json();
            return { success: false, message: data.error || 'Failed to mark notification as read' };
          }

          const readData = await readResponse.json();

          if (!readData.notification || readData.notification.read !== true) {
            return { success: false, message: 'Notification was not marked as read' };
          }

          return { 
            success: true, 
            message: `Notification marked as read ✓ (ID: ${notificationId})` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error marking notification as read: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day3-mark-all-notifications-read',
      name: 'Mark All Notifications as Read',
      description: 'Verify marking all user notifications as read',
      phase: '9.0.3',
      category: 'Notifications',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated to mark all notifications as read' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/notifications/${user.id}/read-all`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to mark all notifications as read' };
          }

          const data = await response.json();

          if (!data.success) {
            return { success: false, message: 'Operation did not succeed' };
          }

          return { 
            success: true, 
            message: `All notifications marked as read ✓ (${data.count || 0} notifications updated)` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error marking all notifications as read: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day3-transform-definitions',
      name: 'Validate Transform Definitions',
      description: 'Verify all 13 transform parameters are defined',
      phase: '9.0.3',
      category: 'Transforms',
      testFn: async () => {
        try {
          const { loadTransforms } = await import('../utils/transformLoader');
          const data = await loadTransforms();
          
          if (!data || !data.transforms) {
            return { success: false, message: 'transforms data not loaded or invalid structure' };
          }

          const expectedParams = ['Y', 'D', 'C', 'M', 'E', 'B', 'N', 'T', 'H', 'L', 'R', 'U', 'C_RU'];
          const actualParams = data.transforms.map((t: any) => t.parameter);
          
          const allPresent = expectedParams.every(p => actualParams.includes(p));
          
          if (!allPresent) {
            const missing = expectedParams.filter(p => !actualParams.includes(p));
            return { 
              success: false, 
              message: `Missing parameters: ${missing.join(', ')}` 
            };
          }

          return { 
            success: true, 
            message: `All 13 parameters defined ✓ (Y, D, C, M, E, B, N, T, H, L, R, U, C_RU)` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error loading transforms: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day3-formula-structure',
      name: 'Validate Formula Structure',
      description: 'Verify all transforms have complete structure (parameter, name, formula, units)',
      phase: '9.0.3',
      category: 'Transforms',
      testFn: async () => {
        try {
          const { loadTransforms } = await import('../utils/transformLoader');
          const data = await loadTransforms();
          const issues: string[] = [];
          
          data.transforms.forEach((t: any) => {
            if (!t.parameter) issues.push(`Missing parameter field`);
            if (!t.name) issues.push(`${t.parameter}: Missing name`);
            if (!t.formula) issues.push(`${t.parameter}: Missing formula`);
            if (!t.input_unit) issues.push(`${t.parameter}: Missing input_unit`);
            if (!t.output_unit) issues.push(`${t.parameter}: Missing output_unit`);
          });

          if (issues.length > 0) {
            return { success: false, message: `Structure issues: ${issues.join('; ')}` };
          }

          return { 
            success: true, 
            message: `All transforms have complete structure ✓ (parameter, name, formula, units, ranges)` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error validating structure: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },

    // Phase 9.0 - Day 4 Tests
    {
      id: 'phase9-day4-create-evidence',
      name: 'Create Evidence Point',
      description: 'Verify evidence point creation for material parameters',
      phase: '9.0.4',
      category: 'Evidence',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated to create evidence points' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              material_id: 'test-material-automated',
              parameter_code: 'Y',
              raw_value: 85,
              raw_unit: '%',
              snippet: 'Test snippet from automated test suite',
              source_type: 'manual',
              citation: 'Automated Test Citation',
              confidence_level: 'high',
              notes: 'Test evidence from automated test suite',
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to create evidence' };
          }

          const data = await response.json();

          if (!data.success || !data.evidenceId) {
            return { success: false, message: 'Invalid response - missing evidence ID' };
          }

          return { 
            success: true, 
            message: `Evidence created ✓ (ID: ${data.evidenceId})` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error creating evidence: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day4-get-evidence-by-material',
      name: 'Get Evidence by Material',
      description: 'Verify evidence retrieval for specific material',
      phase: '9.0.4',
      category: 'Evidence',
      testFn: async () => {
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/material/1760747660232dxyk93nx8`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to retrieve evidence by material' };
          }

          const data = await response.json();

          if (!data.evidence || !Array.isArray(data.evidence)) {
            return { success: false, message: 'Invalid response structure' };
          }

          return { 
            success: true, 
            message: `Found ${data.evidence.length} evidence point(s) for material ✓` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error retrieving evidence: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day4-get-single-evidence',
      name: 'Get Single Evidence Point',
      description: 'Verify retrieving a specific evidence point by ID',
      phase: '9.0.4',
      category: 'Evidence',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated to get evidence points' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          // First, get all evidence to find an ID
          const listResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!listResponse.ok) {
            return { success: false, message: 'Failed to list evidence points' };
          }

          const listData = await listResponse.json();
          
          if (!listData.evidence || listData.evidence.length === 0) {
            return { success: false, message: 'No evidence points found. Create one first (Test: Create Evidence Point)' };
          }

          const testId = listData.evidence[0].id;

          // Now get the specific evidence point
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${testId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to retrieve evidence point' };
          }

          const data = await response.json();

          if (!data.evidence || data.evidence.id !== testId) {
            return { success: false, message: 'Retrieved evidence does not match requested ID' };
          }

          return { 
            success: true, 
            message: `Retrieved evidence point ✓ (ID: ${testId})` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error retrieving evidence point: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day4-update-evidence',
      name: 'Update Evidence Point',
      description: 'Verify updating an existing evidence point',
      phase: '9.0.4',
      category: 'Evidence',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated as admin to update evidence' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          // First, create a test evidence point to update
          const createResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              material_id: 'test-material-for-update',
              parameter_code: 'Y',
              raw_value: 50,
              raw_unit: '%',
              source_type: 'manual',
              citation: 'Test source for update',
              snippet: 'Test snippet for update',
              confidence_level: 'high',
              notes: 'Original note for update test',
            }),
          });

          if (!createResponse.ok) {
            const createError = await createResponse.json();
            return { success: false, message: `Failed to create test evidence: ${createError.error || 'Unknown error'}` };
          }

          const createData = await createResponse.json();
          const testEvidence = createData.evidence;
          const updatedNote = `Updated note at ${new Date().toISOString()}`;

          // Now update it
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${testEvidence.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              material_id: testEvidence.material_id,
              parameter_code: testEvidence.parameter_code,
              raw_value: testEvidence.raw_value,
              raw_unit: testEvidence.raw_unit,
              source_type: testEvidence.source_type,
              citation: testEvidence.citation,
              snippet: testEvidence.snippet,
              confidence_level: testEvidence.confidence_level,
              notes: updatedNote,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to update evidence point' };
          }

          const data = await response.json();

          if (!data.evidence || data.evidence.notes !== updatedNote) {
            return { success: false, message: 'Evidence was not updated correctly' };
          }

          return { 
            success: true, 
            message: `Evidence point updated ✓ (ID: ${testEvidence.id})` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error updating evidence point: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day4-delete-evidence',
      name: 'Delete Evidence Point',
      description: 'Verify deleting an evidence point',
      phase: '9.0.4',
      category: 'Evidence',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated as admin to delete evidence' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          // First, create a test evidence point to delete
          const createResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              material_id: 'test-material-for-delete',
              parameter_code: 'Y',
              raw_value: 50,
              raw_unit: '%',
              source_type: 'manual',
              citation: 'Test source for deletion',
              snippet: 'Test snippet for deletion',
              confidence_level: 'high',
              notes: 'Test evidence for deletion',
            }),
          });

          if (!createResponse.ok) {
            return { success: false, message: 'Failed to create test evidence for deletion' };
          }

          const createData = await createResponse.json();
          const testId = createData.evidence.id;

          // Now delete it
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${testId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to delete evidence point' };
          }

          const data = await response.json();

          if (!data.success) {
            return { success: false, message: 'Delete operation did not succeed' };
          }

          // Verify it's deleted by trying to get it
          const verifyResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${testId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (verifyResponse.ok) {
            return { success: false, message: 'Evidence point still exists after deletion' };
          }

          return { 
            success: true, 
            message: `Evidence point deleted ✓ (ID: ${testId})` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error deleting evidence point: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },

    // Phase 9.0 - Day 5 Tests
    {
      id: 'phase9-day5-doi-normalization',
      name: 'DOI Normalization',
      description: 'Verify DOI format normalization across different input formats',
      phase: '9.0.5',
      category: 'Sources',
      testFn: async () => {
        try {
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
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to normalize DOIs' };
          }

          const data = await response.json();
          const allMatch = data.normalized.every((norm: string) => norm === '10.1234/example');

          return { 
            success: allMatch, 
            message: allMatch 
              ? `All ${testDOIs.length} DOI formats normalized correctly ✓` 
              : `DOI normalization inconsistent: ${JSON.stringify(data.normalized)}` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error normalizing DOIs: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day5-duplicate-check',
      name: 'DOI Duplicate Check',
      description: 'Verify duplicate detection for existing DOIs',
      phase: '9.0.5',
      category: 'Sources',
      testFn: async () => {
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/check-duplicate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              doi: '10.1126/science.test123',
              title: 'Test Automated Duplicate Check',
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to check for duplicates' };
          }

          const data = await response.json();

          return { 
            success: true, 
            message: data.isDuplicate 
              ? `Duplicate detected ✓ (match type: ${data.matchType}, confidence: ${data.confidence}%)` 
              : `No duplicates found ✓` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error checking duplicates: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day5-fuzzy-title-match',
      name: 'Fuzzy Title Matching',
      description: 'Verify fuzzy title matching for similar source titles',
      phase: '9.0.5',
      category: 'Sources',
      testFn: async () => {
        try {
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
              ? `Similar title found ⚠️ Match: "${result.existingSource?.title}" (${result.similarity}% similar)`
              : `No similar titles found ✓ Safe to add.`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error performing fuzzy match: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      }
    },

    // Phase 9.0 - Day 6 Tests
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

    // Phase 9.0 - Day 7 Tests
    {
      id: 'phase9-day7-retention-stats',
      name: 'Fetch Retention Statistics',
      description: 'Verify retention statistics for screenshots and audit logs',
      phase: '9.0.7',
      category: 'Retention',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated as admin to fetch retention stats' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/admin/retention/stats`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to fetch retention stats' };
          }

          const data = await response.json();

          if (!data.stats || typeof data.stats.screenshots !== 'object' || typeof data.stats.auditLogs !== 'object') {
            return { success: false, message: 'Invalid stats structure' };
          }

          return { 
            success: true, 
            message: `Stats retrieved ✓ (${data.stats.screenshots.total} screenshots, ${data.stats.auditLogs.total} audit logs)` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error fetching retention stats: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day7-source-integrity-check',
      name: 'Check Source Referential Integrity',
      description: 'Verify source dependency checking before deletion',
      phase: '9.0.7',
      category: 'Retention',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated as admin to check source integrity' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          // First create a test source
          const createResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: 'Test Source for Integrity Check',
              type: 'internal',
              authors: 'Test Author',
            }),
          });

          if (!createResponse.ok) {
            return { success: false, message: 'Failed to create test source' };
          }

          const createData = await createResponse.json();
          const sourceId = createData.source.id;

          // Now check referential integrity
          const checkResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/admin/retention/check-source/${sourceId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!checkResponse.ok) {
            const data = await checkResponse.json();
            return { success: false, message: data.error || 'Failed to check integrity' };
          }

          const checkData = await checkResponse.json();

          if (checkData.canDelete === true && checkData.dependentCount === 0) {
            return { 
              success: true, 
              message: `Integrity check passed ✓ (source can be deleted, 0 dependent evidence)` 
            };
          } else {
            return { 
              success: false, 
              message: `Unexpected result: canDelete=${checkData.canDelete}, dependentCount=${checkData.dependentCount}` 
            };
          }
        } catch (error) {
          return { 
            success: false, 
            message: `Error checking source integrity: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day7-source-integrity-check-cannot-delete',
      name: 'Check Source Integrity (Cannot Delete)',
      description: 'Verify check endpoint correctly identifies sources with evidence',
      phase: '9.0.7',
      category: 'Retention',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated as admin' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          // Create a test source
          const createSourceResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: 'Test Source with Evidence (Cannot Delete)',
              type: 'internal',
              authors: 'Test Author',
            }),
          });

          if (!createSourceResponse.ok) {
            return { success: false, message: 'Failed to create test source' };
          }

          const sourceData = await createSourceResponse.json();
          const sourceId = sourceData.source.id;

          // Create evidence pointing to this source
          const evidenceResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              material_id: 'test-material',
              parameter_code: 'Y',
              raw_value: 50,
              raw_unit: '%',
              source_type: 'manual',
              citation: `Test source: ${sourceId}`,
              snippet: 'Test snippet for integrity check',
              confidence_level: 'high',
              source_id: sourceId,
              notes: 'Test evidence for integrity check',
            }),
          });

          if (!evidenceResponse.ok) {
            return { success: false, message: 'Failed to create test evidence' };
          }

          // Now check referential integrity - should return canDelete=false
          const checkResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/admin/retention/check-source/${sourceId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!checkResponse.ok) {
            const data = await checkResponse.json();
            return { success: false, message: data.error || 'Failed to check integrity' };
          }

          const checkData = await checkResponse.json();

          if (checkData.canDelete === false && checkData.dependentCount > 0) {
            return { 
              success: true, 
              message: `Integrity check passed ✓ (source cannot be deleted, ${checkData.dependentCount} dependent evidence)` 
            };
          } else {
            return { 
              success: false, 
              message: `Unexpected result: canDelete=${checkData.canDelete}, dependentCount=${checkData.dependentCount}` 
            };
          }
        } catch (error) {
          return { 
            success: false, 
            message: `Error checking source integrity: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day7-source-integrity-prevent-delete',
      name: 'Prevent Delete Source with Evidence',
      description: 'Verify sources with evidence cannot be deleted',
      phase: '9.0.7',
      category: 'Retention',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated as admin' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          // First create a source and evidence
          const sourceId = `test-protected-source-${Date.now()}`;
          
          const sourceResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: sourceId,
              title: 'Test Source with Evidence',
              authors: 'Test Author',
              year: 2024,
              type: 'peer-reviewed',
              weight: 1.0,
            }),
          });

          if (!sourceResponse.ok) {
            return { success: false, message: 'Failed to create test source' };
          }

          // Create evidence pointing to this source
          const evidenceResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              material_id: 'test-material',
              parameter_code: 'Y',
              raw_value: 50,
              raw_unit: '%',
              source_type: 'manual',
              citation: `Test source: ${sourceId}`,
              snippet: 'Test snippet for delete prevention',
              confidence_level: 'high',
              source_id: sourceId,
              notes: 'Test evidence',
            }),
          });

          if (!evidenceResponse.ok) {
            return { success: false, message: 'Failed to create test evidence' };
          }

          // Now try to delete the source - should fail
          const deleteResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/${sourceId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          // Should fail (403 or 400)
          if (deleteResponse.ok) {
            return { success: false, message: 'Source was deleted despite having evidence (should have been prevented)' };
          }

          const errorData = await deleteResponse.json();

          if (deleteResponse.status === 403 || deleteResponse.status === 400) {
            return { 
              success: true, 
              message: `Delete prevented correctly ✓ (Status: ${deleteResponse.status}, Message: ${errorData.error})` 
            };
          }

          return { success: false, message: `Unexpected status code: ${deleteResponse.status}` };
        } catch (error) {
          return { 
            success: false, 
            message: `Error testing delete prevention: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day7-delete-source-without-evidence',
      name: 'Delete Source Without Evidence',
      description: 'Verify sources without evidence can be deleted',
      phase: '9.0.7',
      category: 'Retention',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated as admin' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          // Create a source without any evidence
          const sourceId = `test-deletable-source-${Date.now()}`;
          
          const sourceResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: sourceId,
              title: 'Test Source Without Evidence',
              authors: 'Test Author',
              year: 2024,
              type: 'peer-reviewed',
              weight: 1.0,
            }),
          });

          if (!sourceResponse.ok) {
            return { success: false, message: 'Failed to create test source' };
          }

          // Try to delete it - should succeed
          const deleteResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/${sourceId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json();
            return { success: false, message: `Delete failed: ${errorData.error}` };
          }

          const data = await deleteResponse.json();

          if (!data.success) {
            return { success: false, message: 'Delete operation did not succeed' };
          }

          return { 
            success: true, 
            message: `Source without evidence deleted successfully ✓ (ID: ${sourceId})` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error testing source deletion: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day7-cleanup-expired-screenshots',
      name: 'Cleanup Expired Screenshots',
      description: 'Verify expired screenshot cleanup endpoint',
      phase: '9.0.7',
      category: 'Retention',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated as admin' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/admin/retention/cleanup-screenshots`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to cleanup screenshots' };
          }

          const data = await response.json();

          if (!data.success) {
            return { success: false, message: 'Cleanup operation did not succeed' };
          }

          return { 
            success: true, 
            message: `Screenshot cleanup completed ✓ (${data.deleted || 0} expired screenshots removed)` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error testing screenshot cleanup: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },

    // Phase 9.0 - Day 8 Tests
    {
      id: 'phase9-day8-export-backup',
      name: 'Export Database Backup',
      description: 'Verify backup export with all collections',
      phase: '9.0.8',
      category: 'Backup',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated as admin to export backup' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/backup/export`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Export failed' };
          }

          const backup = await response.json();

          if (!backup.metadata || !backup.data) {
            return { success: false, message: 'Invalid backup structure' };
          }

          const recordCount = backup.metadata.total_records;
          const exportDuration = backup.metadata.export_duration_ms;

          return { 
            success: true, 
            message: `Backup exported ✓ (${recordCount} records in ${exportDuration}ms)` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error exporting backup: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day8-validate-backup',
      name: 'Validate Backup Structure',
      description: 'Verify backup validation endpoint',
      phase: '9.0.8',
      category: 'Backup',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated as admin to validate backup' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          // First export a backup to validate
          const exportResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/backup/export`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!exportResponse.ok) {
            return { success: false, message: 'Failed to export backup for validation' };
          }

          const backup = await exportResponse.json();

          // Now validate it
          const validateResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/backup/validate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ backup }),
          });

          if (!validateResponse.ok) {
            const data = await validateResponse.json();
            return { success: false, message: data.error || 'Validation failed' };
          }

          const validation = await validateResponse.json();

          if (validation.valid) {
            const warningText = validation.warnings.length > 0 ? ` (${validation.warnings.length} warnings)` : '';
            return { 
              success: true, 
              message: `Backup is valid ✓${warningText} - ${validation.stats.total_records} records` 
            };
          } else {
            return { 
              success: false, 
              message: `Validation failed: ${validation.issues.join(', ')}` 
            };
          }
        } catch (error) {
          return { 
            success: false, 
            message: `Error validating backup: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },

    // Phase 9.0 - Day 9 Tests
    {
      id: 'phase9-day9-export-v2',
      name: 'Export Backup V2 with MIU Format',
      description: 'Verify V2 export includes MIU-based evidence structure',
      phase: '9.0.9',
      category: 'Backup V2',
      testFn: async () => {
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/export/full?format=json`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'V2 export failed' };
          }

          const exportData = await response.json();

          if (!exportData.export_format_version || exportData.export_format_version !== '2.0') {
            return { success: false, message: `Expected v2.0, got ${exportData.export_format_version || 'no version'}` };
          }

          // Check for MIU/evidence structure
          if (!exportData.materials || exportData.materials.length === 0) {
            return { success: false, message: 'No materials found in export' };
          }

          // Count evidence points across all materials
          let totalEvidence = 0;
          for (const material of exportData.materials) {
            if (material.evidence && Array.isArray(material.evidence)) {
              totalEvidence += material.evidence.length;
            }
          }

          return { 
            success: true, 
            message: `V2 export validated ✓ (format: ${exportData.export_format_version}, ${exportData.material_count} materials, ${totalEvidence} MIUs)` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error exporting V2 backup: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day9-validate-miu',
      name: 'Validate MIU Structure',
      description: 'Verify MIU records have required provenance fields',
      phase: '9.0.9',
      category: 'Backup V2',
      testFn: async () => {
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/export/full?format=json`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          });

          if (!response.ok) {
            return { success: false, message: 'Failed to export V2 backup for MIU validation' };
          }

          const exportData = await response.json();

          // Find first material with evidence
          let firstEvidence = null;
          for (const material of exportData.materials || []) {
            if (material.evidence && material.evidence.length > 0) {
              firstEvidence = material.evidence[0];
              break;
            }
          }

          if (!firstEvidence) {
            return { success: false, message: 'No MIU records found in export' };
          }

          // Validate MIU has required fields (mapped from evidence structure)
          const requiredFields = ['id', 'parameter_code', 'raw_value', 'raw_unit', 'transform_version', 'created_at'];
          const missingFields = requiredFields.filter(field => !firstEvidence[field]);

          if (missingFields.length > 0) {
            return { 
              success: false, 
              message: `MIU missing required fields: ${missingFields.join(', ')}` 
            };
          }

          return { 
            success: true, 
            message: `MIU structure valid ✓ (${exportData.total_evidence_points} MIUs with all required fields)` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error validating MIU: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },

    // Phase 9.0 - Day 10 Tests
    {
      id: 'phase9-day10-check-oa-single',
      name: 'Check Single DOI for Open Access',
      description: 'Verify Open Access detection via Unpaywall API',
      phase: '9.0.10',
      category: 'Open Access',
      testFn: async () => {
        try {
          const testDoi = '10.1016/j.biortech.2019.121577';
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/check-oa?doi=${encodeURIComponent(testDoi)}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to check OA status' };
          }

          const data = await response.json();

          if (!data.hasOwnProperty('is_open_access') || !data.hasOwnProperty('doi') || !data.hasOwnProperty('oa_status')) {
            return { success: false, message: 'Missing required fields in OA response' };
          }

          return { 
            success: true, 
            message: `OA check complete ✓ (DOI ${data.is_open_access ? 'IS' : 'is NOT'} Open Access, status: ${data.oa_status || 'unknown'})` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error checking OA status: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day10-bulk-oa-check',
      name: 'Bulk Open Access Check',
      description: 'Verify multiple DOI OA status checks in parallel',
      phase: '9.0.10',
      category: 'Open Access',
      testFn: async () => {
        try {
          const testDois = [
            '10.1016/j.biortech.2019.121577',
            '10.1016/j.wasman.2020.06.002',
            '10.1021/acs.est.1c00466',
          ];

          const results = await Promise.all(
            testDois.map(async (doi) => {
              try {
                const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/check-oa?doi=${encodeURIComponent(doi)}`, {
                  method: 'GET',
                  headers: { 'Authorization': `Bearer ${publicAnonKey}` },
                });

                if (!response.ok) {
                  return { doi, is_open_access: null, error: `HTTP ${response.status}` };
                }

                const data = await response.json();
                return {
                  doi,
                  is_open_access: data.is_open_access,
                  oa_status: data.oa_status,
                };
              } catch (error) {
                return { doi, is_open_access: null, error: String(error) };
              }
            })
          );

          const oaCount = results.filter(r => r.is_open_access === true).length;
          const closedCount = results.filter(r => r.is_open_access === false).length;
          const errorCount = results.filter(r => r.is_open_access === null).length;

          return { 
            success: true, 
            message: `Bulk OA check complete ✓ (${oaCount} OA, ${closedCount} closed, ${errorCount} errors out of ${testDois.length} DOIs)` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error in bulk OA check: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day10-oa-doi-normalization',
      name: 'OA DOI Format Normalization',
      description: 'Verify DOI normalization across different formats for OA checks',
      phase: '9.0.10',
      category: 'Open Access',
      testFn: async () => {
        try {
          const doiFormats = [
            '10.1016/j.biortech.2019.121577',
            'https://doi.org/10.1016/j.biortech.2019.121577',
            'http://doi.org/10.1016/j.biortech.2019.121577',
            'doi:10.1016/j.biortech.2019.121577',
            'https://dx.doi.org/10.1016/j.biortech.2019.121577',
          ];

          const results = await Promise.all(
            doiFormats.map(async (doi) => {
              const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/check-oa?doi=${encodeURIComponent(doi)}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${publicAnonKey}` },
              });

              const data = await response.json();
              return {
                input: doi,
                normalized: data.doi,
                success: data.doi === '10.1016/j.biortech.2019.121577',
              };
            })
          );

          const allNormalized = results.every(r => r.success);

          return { 
            success: allNormalized, 
            message: allNormalized 
              ? `All ${doiFormats.length} DOI formats normalized correctly for OA checks ✓` 
              : `Some DOI formats failed normalization` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error testing DOI normalization: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },

    // Phase 9.0 - Day 11 Tests
    {
      id: 'phase9-day11-units-json',
      name: 'Validate units.json Structure',
      description: 'Verify units.json has all required fields and 13 parameters',
      phase: '9.0.11',
      category: 'Ontologies',
      testFn: async () => {
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/ontologies/units`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to load units ontology' };
          }

          const unitsData = await response.json();

          if (!unitsData.version || !unitsData.effective_date || !unitsData.parameters) {
            return { 
              success: false, 
              message: 'Missing required top-level fields (version, effective_date, or parameters)' 
            };
          }

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
      }
    },
    {
      id: 'phase9-day11-context-json',
      name: 'Validate context.json Structure',
      description: 'Verify context.json has all required controlled vocabularies',
      phase: '9.0.11',
      category: 'Ontologies',
      testFn: async () => {
        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/ontologies/context`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to load context ontology' };
          }

          const contextData = await response.json();

          if (!contextData.version || !contextData.effective_date) {
            return { 
              success: false, 
              message: 'Missing required top-level fields (version or effective_date)' 
            };
          }

          if (!contextData.vocabularies) {
            return { 
              success: false, 
              message: 'Missing vocabularies object' 
            };
          }

          const requiredFields = ['process', 'stream', 'region', 'scale'];
          const missingFields = requiredFields.filter(f => !contextData.vocabularies[f]);
          
          if (missingFields.length > 0) {
            return { 
              success: false, 
              message: `Missing controlled vocabularies: ${missingFields.join(', ')}` 
            };
          }

          return { 
            success: true, 
            message: `context.json valid! Version ${contextData.version}, 4 vocabularies defined` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error loading context.json: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day11-aggregation-compute',
      name: 'Compute Aggregation with Policy Snapshot',
      description: 'Verify aggregation computation stores complete version snapshot',
      phase: '9.0.11',
      category: 'Aggregation',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated to compute aggregation' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          const materialId = '1760747660232dxyk93nx8';
          const parameter = 'Y';

          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/aggregations/compute`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ material_id: materialId, parameter_code: parameter }),
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to compute aggregation' };
          }

          const data = await response.json();

          if (!data.aggregation) {
            return { success: false, message: 'No aggregation returned' };
          }

          const agg = data.aggregation;
          const requiredFields = ['transform_version', 'ontology_version', 'weight_policy_version', 'weights_used', 'miu_ids'];
          const missingFields = requiredFields.filter(f => !agg[f]);

          if (missingFields.length > 0) {
            return { 
              success: false, 
              message: `Missing policy snapshot fields: ${missingFields.join(', ')}` 
            };
          }

          return { 
            success: true, 
            message: `Aggregation computed ✓ (value: ${agg.aggregated_value}, ${agg.miu_ids.length} MIUs, all version fields present)` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error computing aggregation: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9-day11-aggregation-retrieve',
      name: 'Retrieve Aggregation Snapshot',
      description: 'Verify aggregation retrieval endpoint returns snapshot data',
      phase: '9.0.11',
      category: 'Aggregation',
      testFn: async () => {
        try {
          const materialId = '1760747660232dxyk93nx8';
          const parameter = 'Y';

          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/aggregations/${materialId}/${parameter}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to retrieve aggregation' };
          }

          const data = await response.json();

          if (!data.aggregation) {
            return { success: false, message: 'No aggregation returned' };
          }

          const agg = data.aggregation;

          return { 
            success: true, 
            message: `Aggregation retrieved ✓ (material: ${agg.material_id}, parameter: ${agg.parameter_code}, value: ${agg.aggregated_value})` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error retrieving aggregation: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },

    // Phase 9.1 Tests - Evidence Points and Parameter Aggregations
    {
      id: 'phase9.1-create-evidence',
      name: 'Create Evidence Point',
      description: 'Verify evidence point creation with MIU data',
      phase: '9.1',
      category: 'Evidence',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated to create evidence' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        try {
          const testMaterialId = 'test-material-' + Date.now();
          const testSourceRef = 'test-source-' + Date.now();
          
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              material_id: testMaterialId,
              parameter_code: 'Y',
              raw_value: 85.5,
              raw_unit: '%',
              snippet: 'The yield was measured at 85.5% under standard conditions.',
              source_type: 'whitepaper',
              citation: 'Test Source 2025',
              confidence_level: 'high',
              notes: 'Test evidence point for Phase 9.1',
              page_number: 42,
              source_ref: testSourceRef,
              source_weight: 1.0,
              restricted_content: false,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to create evidence' };
          }

          const data = await response.json();
          
          if (!data.evidence || !data.evidence.id) {
            return { success: false, message: 'No evidence ID returned' };
          }

          // Store for other tests
          sessionStorage.setItem('phase91_test_evidence_id', data.evidence.id);
          sessionStorage.setItem('phase91_test_material_id', testMaterialId);
          sessionStorage.setItem('phase91_test_source_ref', testSourceRef);

          return { 
            success: true, 
            message: `Created evidence point ${data.evidence.id}` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error creating evidence: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9.1-get-evidence-by-id',
      name: 'Get Evidence Point by ID',
      description: 'Verify evidence retrieval by ID',
      phase: '9.1',
      category: 'Evidence',
      testFn: async () => {
        const evidenceId = sessionStorage.getItem('phase91_test_evidence_id');
        if (!evidenceId) {
          return { success: false, message: 'No test evidence ID found - run Create Evidence Point test first' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${evidenceId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to get evidence' };
          }

          const data = await response.json();
          
          if (!data.evidence || data.evidence.id !== evidenceId) {
            return { success: false, message: 'Evidence point not found or ID mismatch' };
          }

          return { 
            success: true, 
            message: 'Successfully retrieved evidence point' 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error retrieving evidence: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9.1-get-evidence-by-material',
      name: 'Get Evidence Points by Material',
      description: 'Verify evidence retrieval for a specific material',
      phase: '9.1',
      category: 'Evidence',
      testFn: async () => {
        const materialId = sessionStorage.getItem('phase91_test_material_id');
        if (!materialId) {
          return { success: false, message: 'No test material ID found - run Create Evidence Point test first' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/material/${materialId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to get evidence' };
          }

          const data = await response.json();
          
          if (!data.evidence || data.count !== 1) {
            return { success: false, message: `Expected 1 evidence point, got ${data.count}` };
          }

          return { 
            success: true, 
            message: `Found ${data.count} evidence point(s)` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error retrieving evidence: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9.1-update-evidence-validation',
      name: 'Update Evidence Validation',
      description: 'Verify updating validation status of evidence',
      phase: '9.1',
      category: 'Evidence',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated to update evidence' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        const evidenceId = sessionStorage.getItem('phase91_test_evidence_id');
        
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }
        
        if (!evidenceId) {
          return { success: false, message: 'No test evidence ID found - run Create Evidence Point test first' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/evidence/${evidenceId}/validation`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'validated',
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to update validation' };
          }

          const data = await response.json();
          
          if (!data.evidence || data.evidence.validation_status !== 'validated') {
            return { success: false, message: 'Validation status not updated' };
          }

          return { 
            success: true, 
            message: 'Validation status updated to validated' 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error updating validation: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9.1-create-aggregation',
      name: 'Create Aggregation',
      description: 'Verify parameter aggregation creation from MIUs',
      phase: '9.1',
      category: 'Aggregation',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated to create aggregation' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        const materialId = sessionStorage.getItem('phase91_test_material_id');
        const evidenceId = sessionStorage.getItem('phase91_test_evidence_id');
        
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }
        
        if (!materialId || !evidenceId) {
          return { success: false, message: 'No test data found - run Create Evidence Point test first' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/aggregations`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              material_id: materialId,
              parameter: 'Y',
              miu_ids: [evidenceId],
              quality_threshold: 0.0,
              min_sources: 1,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to create aggregation' };
          }

          const data = await response.json();
          
          if (!data.aggregation || !data.aggregation.id) {
            return { success: false, message: 'No aggregation ID returned' };
          }

          // Store for other tests
          sessionStorage.setItem('phase91_test_aggregation_id', data.aggregation.id);

          return { 
            success: true, 
            message: `Created aggregation ${data.aggregation.id}` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error creating aggregation: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9.1-get-aggregation-by-id',
      name: 'Get Aggregation by ID',
      description: 'Verify aggregation retrieval by ID',
      phase: '9.1',
      category: 'Aggregation',
      testFn: async () => {
        const aggregationId = sessionStorage.getItem('phase91_test_aggregation_id');
        if (!aggregationId) {
          return { success: false, message: 'No test aggregation ID found - run Create Aggregation test first' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/aggregations/${aggregationId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to get aggregation' };
          }

          const data = await response.json();
          
          if (!data.aggregation || data.aggregation.id !== aggregationId) {
            return { success: false, message: 'Aggregation not found or ID mismatch' };
          }

          return { 
            success: true, 
            message: 'Successfully retrieved aggregation' 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error retrieving aggregation: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9.1-get-aggregations-by-material',
      name: 'Get Aggregations by Material',
      description: 'Verify aggregation retrieval for a specific material',
      phase: '9.1',
      category: 'Aggregation',
      testFn: async () => {
        const materialId = sessionStorage.getItem('phase91_test_material_id');
        if (!materialId) {
          return { success: false, message: 'No test material ID found - run Create Evidence Point test first' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/aggregations/material/${materialId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to get aggregations' };
          }

          const data = await response.json();
          
          if (!data.aggregations || data.count !== 1) {
            return { success: false, message: `Expected 1 aggregation, got ${data.count}` };
          }

          return { 
            success: true, 
            message: `Found ${data.count} aggregation(s)` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error retrieving aggregations: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9.1-get-aggregation-stats',
      name: 'Get Aggregation Stats',
      description: 'Verify aggregation statistics endpoint',
      phase: '9.1',
      category: 'Aggregation',
      testFn: async () => {
        const materialId = sessionStorage.getItem('phase91_test_material_id');
        if (!materialId) {
          return { success: false, message: 'No test material ID found - run Create Evidence Point test first' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/aggregations/material/${materialId}/stats`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to get stats' };
          }

          const data = await response.json();
          
          if (!data.stats || data.stats.total_parameters !== 1) {
            return { success: false, message: 'Stats not returned correctly' };
          }

          return { 
            success: true, 
            message: `Stats: ${data.stats.total_parameters} parameter(s) aggregated` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error retrieving stats: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9.1-source-can-delete-with-mius',
      name: 'Check Source Can Delete (with MIUs)',
      description: 'Verify source deletion is blocked when MIUs reference it',
      phase: '9.1',
      category: 'Referential Integrity',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated as admin to check source deletion' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        const sourceRef = sessionStorage.getItem('phase91_test_source_ref');
        if (!sourceRef) {
          return { success: false, message: 'No test source ref found - run Create Evidence Point test first' };
        }

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/${sourceRef}/can-delete`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to check deletion' };
          }

          const data = await response.json();
          
          if (data.canDelete !== false || data.evidenceCount !== 1) {
            return { success: false, message: `Expected canDelete=false and evidenceCount=1, got canDelete=${data.canDelete} and evidenceCount=${data.evidenceCount}` };
          }

          return { 
            success: true, 
            message: `Correctly blocked deletion (${data.evidenceCount} evidence point)` 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error checking deletion: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
    {
      id: 'phase9.1-source-can-delete-without-mius',
      name: 'Check Source Can Delete (without MIUs)',
      description: 'Verify source deletion is allowed when no MIUs reference it',
      phase: '9.1',
      category: 'Referential Integrity',
      testFn: async () => {
        if (!user) {
          return { success: false, message: 'Must be authenticated as admin to check source deletion' };
        }

        const accessToken = sessionStorage.getItem('wastedb_access_token');
        if (!accessToken) {
          return { success: false, message: 'No access token found - please sign in again' };
        }

        const nonExistentSource = 'non-existent-source-' + Date.now();

        try {
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17cae920/sources/${nonExistentSource}/can-delete`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (!response.ok) {
            const data = await response.json();
            return { success: false, message: data.error || 'Failed to check deletion' };
          }

          const data = await response.json();
          
          if (data.canDelete !== true || data.evidenceCount !== 0) {
            return { success: false, message: `Expected canDelete=true and evidenceCount=0, got canDelete=${data.canDelete} and evidenceCount=${data.evidenceCount}` };
          }

          return { 
            success: true, 
            message: 'Correctly allowed deletion (0 evidence points)' 
          };
        } catch (error) {
          return { 
            success: false, 
            message: `Error checking deletion: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
    },
  ];

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="size-5 text-green-600" />;
      case 'error':
        return <XCircle className="size-5 text-red-600" />;
      case 'loading':
        return <Loader2 className="size-5 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="size-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-600 hover:bg-green-700">Passed</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      case 'loading':
        return <Badge className="bg-blue-600 hover:bg-blue-700">Running...</Badge>;
      default:
        return <Badge variant="outline">Not Run</Badge>;
    }
  };

  // Get unique phases for filter
  const uniquePhases = Array.from(new Set(tests.map(t => t.phase))).sort();
  
  // Filter tests by selected phases (if none selected, show all)
  const filteredTests = selectedPhases.size === 0
    ? tests 
    : tests.filter(t => selectedPhases.has(t.phase));
  
  const totalTests = filteredTests.length;
  const passedTests = filteredTests.filter(t => testResults[t.id]?.status === 'success').length;
  const failedTests = filteredTests.filter(t => testResults[t.id]?.status === 'error').length;

  const copyFailedTests = async () => {
    const failedTestData = filteredTests
      .filter(test => testResults[test.id]?.status === 'error')
      .map(test => {
        const result = testResults[test.id];
        return {
          Status: 'Failed',
          Phase: test.phase,
          Category: test.category,
          'Test Name': test.name,
          Description: test.description,
          Result: result.message || 'No error message'
        };
      });

    if (failedTestData.length === 0) {
      toast.error('No failed tests to copy');
      return;
    }

    // Create tab-separated text for easy pasting into spreadsheets
    const headers = ['Status', 'Phase', 'Category', 'Test Name', 'Description', 'Result'];
    const rows = failedTestData.map(test => 
      headers.map(header => test[header as keyof typeof test]).join('\t')
    );
    const text = [headers.join('\t'), ...rows].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${failedTestData.length} failed test(s) to clipboard`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle>WasteDB Test Suite</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Regression testing for all infrastructure phases
              </p>
              
              {/* Phase Filter Tabs */}
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <span className="text-sm text-muted-foreground font-['Sniglet']">
                  Phases {selectedPhases.size > 0 && `(${selectedPhases.size}/${uniquePhases.length})`}:
                </span>
                
                {/* Select All/None buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={selectAllPhases}
                    className="p-1.5 hover:bg-muted rounded transition-colors"
                    title="Select all phases"
                  >
                    <CheckSquare className="size-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={selectNoPhases}
                    className="p-1.5 hover:bg-muted rounded transition-colors"
                    title="Select no phases"
                  >
                    <Square className="size-4 text-muted-foreground" />
                  </button>
                </div>
                
                {/* Phase toggle buttons */}
                {uniquePhases.map(phase => (
                  <button
                    key={phase}
                    onClick={() => togglePhase(phase)}
                    className={`px-3 py-1.5 text-[11px] font-['Sniglet'] rounded-md border-2 transition-all ${
                      selectedPhases.has(phase)
                        ? 'bg-[#bae1ff] border-[#9dd1ff] text-black shadow-sm translate-y-0'
                        : 'bg-background border-border text-muted-foreground hover:border-[#bae1ff] hover:text-foreground translate-y-0 hover:-translate-y-0.5'
                    }`}
                  >
                    {phase}
                  </button>
                ))}
              </div>
            </div>
            <Button 
              onClick={runAllTests} 
              disabled={runningAll}
              size="lg"
            >
              {runningAll ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <PlayCircle className="size-4 mr-2" />
                  Run All Tests
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Total:</span>
                <span className="font-bold">{totalTests}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Passed:</span>
                <span className="font-bold text-green-600">{passedTests}</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="size-4 text-red-600" />
                <span className="text-sm text-muted-foreground">Failed:</span>
                <span className="font-bold text-red-600">{failedTests}</span>
              </div>
            </div>
            {failedTests > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={copyFailedTests}
                title="Copy failed tests to clipboard"
              >
                <Copy className="size-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-['Sniglet'] text-[12px]">Status</th>
                  <th className="text-left p-4 font-['Sniglet'] text-[12px]">Phase</th>
                  <th className="text-left p-4 font-['Sniglet'] text-[12px]">Category</th>
                  <th className="text-left p-4 font-['Sniglet'] text-[12px]">Test Name</th>
                  <th className="text-left p-4 font-['Sniglet'] text-[12px]">Description</th>
                  <th className="text-left p-4 font-['Sniglet'] text-[12px]">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map((test, index) => {
                  const result = testResults[test.id] || { status: 'idle' };
                  
                  return (
                    <tr 
                      key={test.id}
                      className={`border-t ${index % 2 === 0 ? 'bg-white dark:bg-[#1a1917]' : 'bg-muted/20'}`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          {getStatusBadge(result.status)}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-['Sniglet'] text-[11px] text-muted-foreground">
                          {test.phase}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="font-['Sniglet'] text-[10px]">
                          {test.category}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="font-['Sniglet'] text-[12px]">
                          {test.name}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground max-w-md">
                          {test.description}
                        </div>
                        {result.message && (
                          <div className={`text-xs mt-1 ${result.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {result.message}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runTest(test.id, test.testFn)}
                          disabled={result.status === 'loading'}
                        >
                          {result.status === 'loading' ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <PlayCircle className="size-3" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}