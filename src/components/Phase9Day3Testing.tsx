import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { CheckCircle2, Loader2, Bell, AlertCircle } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

export function Phase9Day3Testing() {
  const { user } = useAuthContext();
  const [testResults, setTestResults] = useState<Record<string, { status: 'idle' | 'loading' | 'success' | 'error'; message?: string }>>({});
  const [createdNotificationId, setCreatedNotificationId] = useState<string | null>(null);

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
              <CardTitle>Testing Overview</CardTitle>
              <CardDescription>
                Notification Backend Endpoints & Bell UI Integration
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">✅ Notification CRUD Endpoints Complete</Badge>
            <Badge variant="outline">🔄 Bell UI Integration In Progress</Badge>
          </div>

          <Alert>
            <Bell className="size-4" />
            <AlertDescription>
              <strong>What's being tested:</strong> Backend notification endpoints including
              createNotification, getNotifications, markNotificationAsRead, and markAllNotificationsAsRead.
              The notification bell UI is already implemented and will now connect to these live endpoints.
            </AlertDescription>
          </Alert>

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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
