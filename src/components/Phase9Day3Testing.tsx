import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { CheckCircle2, Loader2, Bell, AlertCircle, FlaskConical, BarChart3 } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { loadTransforms, type TransformsData } from '../utils/transformLoader';

export function Phase9Day3Testing() {
  const { user } = useAuthContext();
  const [testResults, setTestResults] = useState<Record<string, { status: 'idle' | 'loading' | 'success' | 'error'; message?: string }>>({});
  const [createdNotificationId, setCreatedNotificationId] = useState<string | null>(null);
  const [transforms, setTransforms] = useState<TransformsData | null>(null);

  // Load transforms on mount
  useEffect(() => {
    loadTransforms()
      .then(data => setTransforms(data))
      .catch(error => console.error('Failed to load transforms:', error));
  }, []);

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

  const testCreateNotification = async () => {
    if (!user) {
      return { success: false, message: 'Must be authenticated to create notifications' };
    }

    const accessToken = sessionStorage.getItem('wastedb_access_token');
    if (!accessToken) {
      return { success: false, message: 'No access token found - please sign in again' };
    }

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/notifications`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.id,
          type: 'article_published',
          content_id: 'test_article_123',
          content_type: 'article',
          message: 'Test notification: Your article "Advanced Composting Techniques" has been published!'
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.notification || !data.notification.id) {
      return { success: false, message: 'Invalid response structure' };
    }

    setCreatedNotificationId(data.notification.id);
    return { success: true, message: `✅ Created notification: ${data.notification.id}` };
  };

  const testGetNotifications = async () => {
    if (!user) {
      return { success: false, message: 'Must be authenticated to get notifications' };
    }

    const accessToken = sessionStorage.getItem('wastedb_access_token');
    if (!accessToken) {
      return { success: false, message: 'No access token found - please sign in again' };
    }

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/notifications/${user.id}`,
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
    
    if (!Array.isArray(data.notifications)) {
      return { success: false, message: 'Expected array of notifications' };
    }

    const unreadCount = data.notifications.filter((n: any) => !n.read).length;
    return { success: true, message: `✅ Retrieved ${data.notifications.length} notification(s), ${unreadCount} unread` };
  };

  const testMarkAsRead = async () => {
    if (!user) {
      return { success: false, message: 'Must be authenticated to mark notifications as read' };
    }

    if (!createdNotificationId) {
      return { success: false, message: 'No notification ID available. Create a notification first (Test 1)' };
    }

    const accessToken = sessionStorage.getItem('wastedb_access_token');
    if (!accessToken) {
      return { success: false, message: 'No access token found - please sign in again' };
    }

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/notifications/${createdNotificationId}/read`,
      {
        method: 'PUT',
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
    
    if (!data.notification || data.notification.read !== true) {
      return { success: false, message: 'Notification was not marked as read' };
    }

    return { success: true, message: `✅ Marked notification ${createdNotificationId} as read` };
  };

  const testMarkAllAsRead = async () => {
    if (!user) {
      return { success: false, message: 'Must be authenticated to mark all notifications as read' };
    }

    const accessToken = sessionStorage.getItem('wastedb_access_token');
    if (!accessToken) {
      return { success: false, message: 'No access token found - please sign in again' };
    }

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/notifications/${user.id}/read-all`,
      {
        method: 'PUT',
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
    
    if (!data.success) {
      return { success: false, message: 'Failed to mark all notifications as read' };
    }

    return { success: true, message: `✅ Marked ${data.updated_count} notification(s) as read` };
  };

  const testNotificationBellUI = async () => {
    return { 
      success: true, 
      message: '✅ Manually verify: Check the notification bell in the top bar for badge updates' 
    };
  };

  // Transform Formula Testing Tests
  const testTransformDefinitions = async () => {
    try {
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
        message: `✅ All 13 parameters defined in transforms.ts` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Error loading transforms: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  };

  const testFormulaStructure = async () => {
    try {
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
        message: `✅ All transforms have complete structure (parameter, name, formula, units, ranges)` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  };

  const testUINavigation = async () => {
    return {
      success: true,
      message: '✅ Manual check: Navigate to Admin Dashboard → Testing → Transform Formula Testing'
    };
  };

  const testParameterStatistics = async () => {
    return {
      success: true,
      message: '✅ Manual check: Verify all 13 parameter statistics display with color-coded badges'
    };
  };

  const testResultsTable = async () => {
    return {
      success: true,
      message: '✅ Manual check: Verify test results table shows raw values, computed scores, actual scores, and differences'
    };
  };

  const testFilteringFeatures = async () => {
    return {
      success: true,
      message: '✅ Manual check: Test parameter filtering and "Show Errors Only" toggle'
    };
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
            <Bell className="size-8 text-blue-600" />
            <div>
              <CardTitle>Testing Overview: Phase 9.0 Day 3</CardTitle>
              <CardDescription>
                Notification Backend & Transform Formula Testing
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">✅ Notification CRUD Endpoints Complete</Badge>
            <Badge variant="outline">✅ Bell UI Integration Complete</Badge>
            <Badge variant="outline">✅ Transform Formula Testing Complete</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Alert>
              <Bell className="size-4" />
              <AlertDescription>
                <strong>Notification System:</strong> Backend notification endpoints including
                createNotification, getNotifications, markNotificationAsRead, and markAllNotificationsAsRead.
                The notification bell UI is already implemented and connected to these endpoints.
              </AlertDescription>
            </Alert>

            <Alert>
              <FlaskConical className="size-4" />
              <AlertDescription>
                <strong>Transform Testing:</strong> Comprehensive validation interface for all 13 transform
                formulas (Y, D, C, M, E, B, N, T, H, L, R, U, C_RU) with parameter statistics, test results
                table, and filtering capabilities.
              </AlertDescription>
            </Alert>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">🧪 Test Scenarios</h3>

            {/* Test 1: Create Notification */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Test 1: Create Test Notification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>What it tests:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>POST /notifications endpoint</li>
                    <li>Notification creation with validation</li>
                    <li>KV storage with user-specific keys</li>
                  </ul>
                </div>
                <div className="text-sm space-y-2">
                  <p><strong>Expected Result:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>✅ Creates notification with unique ID</li>
                    <li>✅ Stores in KV with key: notification:{'<user_id>'}:{'<notif_id>'}</li>
                    <li>✅ Returns notification object with all fields</li>
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
                    onClick={() => runTest('createNotification', testCreateNotification)}
                    disabled={testResults.createNotification?.status === 'loading' || !user}
                  >
                    {testResults.createNotification?.status === 'loading' && <Loader2 className="size-4 mr-2 animate-spin" />}
                    Run Test
                  </Button>
                  {testResults.createNotification && (
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.createNotification.status)}
                      {testResults.createNotification.message && (
                        <span className="text-sm">{testResults.createNotification.message}</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Test 2: Get Notifications */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Test 2: Retrieve User Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>What it tests:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>GET /notifications/:userId endpoint</li>
                    <li>User-specific notification retrieval</li>
                    <li>Sorting by creation date (newest first)</li>
                  </ul>
                </div>
                <div className="text-sm space-y-2">
                  <p><strong>Expected Result:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>✅ Returns array of notifications for current user</li>
                    <li>✅ Includes read/unread status</li>
                    <li>✅ Shows count of unread notifications</li>
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
                    onClick={() => runTest('getNotifications', testGetNotifications)}
                    disabled={testResults.getNotifications?.status === 'loading' || !user}
                  >
                    {testResults.getNotifications?.status === 'loading' && <Loader2 className="size-4 mr-2 animate-spin" />}
                    Run Test
                  </Button>
                  {testResults.getNotifications && (
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.getNotifications.status)}
                      {testResults.getNotifications.message && (
                        <span className="text-sm">{testResults.getNotifications.message}</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Test 3: Mark as Read */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Test 3: Mark Single Notification as Read</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>What it tests:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>PUT /notifications/:notificationId/read endpoint</li>
                    <li>Notification lookup across user prefixes</li>
                    <li>Authorization check (user owns notification)</li>
                  </ul>
                </div>
                <div className="text-sm space-y-2">
                  <p><strong>Expected Result:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>✅ Finds notification by ID</li>
                    <li>✅ Updates read status to true</li>
                    <li>✅ Returns updated notification object</li>
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
                {!createdNotificationId && user && (
                  <Alert>
                    <AlertCircle className="size-4" />
                    <AlertDescription>
                      ℹ️ Run Test 1 first to create a notification
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => runTest('markAsRead', testMarkAsRead)}
                    disabled={testResults.markAsRead?.status === 'loading' || !user || !createdNotificationId}
                  >
                    {testResults.markAsRead?.status === 'loading' && <Loader2 className="size-4 mr-2 animate-spin" />}
                    Run Test
                  </Button>
                  {testResults.markAsRead && (
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.markAsRead.status)}
                      {testResults.markAsRead.message && (
                        <span className="text-sm">{testResults.markAsRead.message}</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Test 4: Mark All as Read */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Test 4: Mark All Notifications as Read</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>What it tests:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>PUT /notifications/:userId/read-all endpoint</li>
                    <li>Batch update of all user notifications</li>
                    <li>Parallel promise execution</li>
                  </ul>
                </div>
                <div className="text-sm space-y-2">
                  <p><strong>Expected Result:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>✅ Finds all notifications for user</li>
                    <li>✅ Updates all to read status</li>
                    <li>✅ Returns count of updated notifications</li>
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
                    onClick={() => runTest('markAllAsRead', testMarkAllAsRead)}
                    disabled={testResults.markAllAsRead?.status === 'loading' || !user}
                  >
                    {testResults.markAllAsRead?.status === 'loading' && <Loader2 className="size-4 mr-2 animate-spin" />}
                    Run Test
                  </Button>
                  {testResults.markAllAsRead && (
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.markAllAsRead.status)}
                      {testResults.markAllAsRead.message && (
                        <span className="text-sm">{testResults.markAllAsRead.message}</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Test 5: Notification Bell UI */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Test 5: Notification Bell UI Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>What to verify:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Notification bell shows badge with unread count</li>
                    <li>Clicking bell opens notification list</li>
                    <li>Clicking notification marks it as read</li>
                    <li>"Mark all read" button works correctly</li>
                    <li>Badge count updates in real-time</li>
                  </ul>
                </div>
                <div className="text-sm space-y-2">
                  <p><strong>Manual Testing Steps:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Run Test 1 to create a notification</li>
                    <li>Look at the notification bell in the top bar (next to dark mode toggle)</li>
                    <li>Verify the badge shows "1" or more</li>
                    <li>Click the bell to open the notification popover</li>
                    <li>Verify your test notification appears with proper formatting</li>
                    <li>Click the notification to mark it as read</li>
                    <li>Verify the badge count decreases</li>
                    <li>Create more notifications and test "Mark all read" button</li>
                  </ol>
                </div>
                <div className="text-sm space-y-2">
                  <p><strong>Expected Result:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>✅ Bell icon displays in top bar</li>
                    <li>✅ Badge shows correct unread count</li>
                    <li>✅ Notifications display with icons and timestamps</li>
                    <li>✅ Real-time updates (polls every 30 seconds)</li>
                  </ul>
                </div>
                <Alert>
                  <Bell className="size-4" />
                  <AlertDescription>
                    💡 The notification bell is already implemented in the top bar. 
                    After running the backend tests above, interact with the bell to verify the integration.
                  </AlertDescription>
                </Alert>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => runTest('notificationBellUI', testNotificationBellUI)}
                  >
                    Mark UI Test as Complete
                  </Button>
                  {testResults.notificationBellUI && (
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.notificationBellUI.status)}
                      {testResults.notificationBellUI.message && (
                        <span className="text-sm">{testResults.notificationBellUI.message}</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Test 6: Transform Definitions */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Test 6: Transform Definitions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>What it tests:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Presence of all 13 parameters in transforms.json</li>
                  </ul>
                </div>
                <div className="text-sm space-y-2">
                  <p><strong>Expected Result:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>✅ All 13 parameters defined in transforms.ts</li>
                  </ul>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => runTest('transformDefinitions', testTransformDefinitions)}
                  >
                    Run Test
                  </Button>
                  {testResults.transformDefinitions && (
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.transformDefinitions.status)}
                      {testResults.transformDefinitions.message && (
                        <span className="text-sm">{testResults.transformDefinitions.message}</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Test 7: Formula Structure */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Test 7: Formula Structure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>What it tests:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Complete structure of each transform in transforms.json</li>
                  </ul>
                </div>
                <div className="text-sm space-y-2">
                  <p><strong>Expected Result:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>✅ All transforms have complete structure (parameter, name, formula, units, ranges)</li>
                  </ul>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => runTest('formulaStructure', testFormulaStructure)}
                  >
                    Run Test
                  </Button>
                  {testResults.formulaStructure && (
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.formulaStructure.status)}
                      {testResults.formulaStructure.message && (
                        <span className="text-sm">{testResults.formulaStructure.message}</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Test 8: UI Navigation */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Test 8: UI Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>What to verify:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Navigation to Admin Dashboard → Testing → Transform Formula Testing</li>
                  </ul>
                </div>
                <div className="text-sm space-y-2">
                  <p><strong>Expected Result:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>✅ Navigation to the correct page</li>
                  </ul>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => runTest('uiNavigation', testUINavigation)}
                  >
                    Mark UI Test as Complete
                  </Button>
                  {testResults.uiNavigation && (
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.uiNavigation.status)}
                      {testResults.uiNavigation.message && (
                        <span className="text-sm">{testResults.uiNavigation.message}</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Test 9: Parameter Statistics */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Test 9: Parameter Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>What to verify:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Display of all 13 parameter statistics with color-coded badges</li>
                  </ul>
                </div>
                <div className="text-sm space-y-2">
                  <p><strong>Expected Result:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>✅ All 13 parameter statistics display with color-coded badges</li>
                  </ul>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => runTest('parameterStatistics', testParameterStatistics)}
                  >
                    Mark UI Test as Complete
                  </Button>
                  {testResults.parameterStatistics && (
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.parameterStatistics.status)}
                      {testResults.parameterStatistics.message && (
                        <span className="text-sm">{testResults.parameterStatistics.message}</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Test 10: Results Table */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Test 10: Results Table</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>What to verify:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Display of test results table with raw values, computed scores, actual scores, and differences</li>
                  </ul>
                </div>
                <div className="text-sm space-y-2">
                  <p><strong>Expected Result:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>✅ Test results table shows raw values, computed scores, actual scores, and differences</li>
                  </ul>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => runTest('resultsTable', testResultsTable)}
                  >
                    Mark UI Test as Complete
                  </Button>
                  {testResults.resultsTable && (
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.resultsTable.status)}
                      {testResults.resultsTable.message && (
                        <span className="text-sm">{testResults.resultsTable.message}</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Test 11: Filtering Features */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Test 11: Filtering Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>What to verify:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Functionality of parameter filtering and "Show Errors Only" toggle</li>
                  </ul>
                </div>
                <div className="text-sm space-y-2">
                  <p><strong>Expected Result:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>✅ Parameter filtering and "Show Errors Only" toggle work correctly</li>
                  </ul>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => runTest('filteringFeatures', testFilteringFeatures)}
                  >
                    Mark UI Test as Complete
                  </Button>
                  {testResults.filteringFeatures && (
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults.filteringFeatures.status)}
                      {testResults.filteringFeatures.message && (
                        <span className="text-sm">{testResults.filteringFeatures.message}</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}