import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { CheckCircle2, AlertCircle, FileText, ShieldAlert } from 'lucide-react';
import { useNavigationContext } from '../contexts/NavigationContext';
import { useAuthContext } from '../contexts/AuthContext';
import { PageTemplate } from './PageTemplate';

export function Phase9TestingPage() {
  const { navigateToTakedownForm, navigateToAdminTakedownList } = useNavigationContext();
  const { userRole } = useAuthContext();

  return (
    <PageTemplate
      title="Phase 9.0 Day 1 Testing"
      description="Legal & Licensing Infrastructure - DMCA Takedown System"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ShieldAlert className="size-8 text-blue-600" />
            <div>
              <CardTitle>Testing Overview</CardTitle>
              <CardDescription>
                Complete DMCA takedown request system
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">✅ Backend Complete</Badge>
            <Badge variant="outline">✅ Form Complete</Badge>
            <Badge variant="outline">✅ Admin Panel Complete</Badge>
          </div>

          <Alert>
            <FileText className="size-4" />
            <AlertDescription>
              <strong>What's being tested:</strong> The complete DMCA takedown request
              system including form submission, status tracking, and admin review.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="font-semibold">🧪 Test Scenarios</h3>

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Test 1: Submit Takedown Request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>Steps:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Click "Test Takedown Form" button below</li>
                    <li>Fill out all required fields with test data</li>
                    <li>Check all legal statement checkboxes</li>
                    <li>Type your full name in signature field</li>
                    <li>Submit form</li>
                  </ol>
                </div>
                <div className="text-sm space-y-2">
                  <p><strong>Expected Result:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>✅ Form validates all required fields</li>
                    <li>✅ Signature must match name exactly</li>
                    <li>✅ Success page with Request ID (e.g., TR-1731456789-abc123)</li>
                    <li>✅ Link to track status</li>
                  </ul>
                </div>
                <Button onClick={navigateToTakedownForm}>
                  Test Takedown Form
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Test 2: Track Request Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>Steps:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>After submitting a request, copy the Request ID</li>
                    <li>Click "Track Request Status" on success page</li>
                    <li>Verify status is "PENDING"</li>
                    <li>Check submission timestamp</li>
                  </ol>
                </div>
                <div className="text-sm space-y-2">
                  <p><strong>Expected Result:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>✅ Status page loads with request details</li>
                    <li>✅ Timeline shows "Submitted" step complete</li>
                    <li>✅ "Under Review" shows as pending (72h notice)</li>
                    <li>✅ No resolution shown yet</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {userRole === 'admin' && (
              <Card className="bg-muted/50 border-blue-500">
                <CardHeader>
                  <CardTitle className="text-base">Test 3: Admin Review (Admin Only)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-2">
                    <p><strong>Steps:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Click "🚨 Takedown Requests" button in admin panel</li>
                      <li>View list of all takedown requests</li>
                      <li>Click "Review" on your test request</li>
                      <li>Change status to "Under Review"</li>
                      <li>Select a resolution type</li>
                      <li>Add internal review notes</li>
                      <li>Click "Update Request"</li>
                    </ol>
                  </div>
                  <div className="text-sm space-y-2">
                    <p><strong>Expected Result:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>✅ Admin panel shows all requests</li>
                      <li>✅ Review dialog shows full request details</li>
                      <li>✅ Status and resolution update successfully</li>
                      <li>✅ Review timestamp recorded</li>
                      <li>✅ List refreshes with updated status</li>
                    </ul>
                  </div>
                  <Button onClick={navigateToAdminTakedownList}>
                    View Takedown Requests (Admin)
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Test 4: Validation Testing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>Test Cases:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Try submitting with empty required fields → Should show validation errors</li>
                    <li>Enter invalid email format → Should reject</li>
                    <li>Signature doesn't match name → Should show error</li>
                    <li>Uncheck legal statements → Should prevent submission</li>
                    <li>All valid data → Should succeed</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">📋 Manual Testing Checklist</h3>
            <div className="text-sm space-y-2">
              <div className="flex items-start gap-2">
                <input type="checkbox" id="test1" className="mt-1" />
                <label htmlFor="test1">Form loads without errors</label>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" id="test2" className="mt-1" />
                <label htmlFor="test2">All required fields validate properly</label>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" id="test3" className="mt-1" />
                <label htmlFor="test3">Form submission succeeds with valid data</label>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" id="test4" className="mt-1" />
                <label htmlFor="test4">Request ID generated and displayed</label>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" id="test5" className="mt-1" />
                <label htmlFor="test5">Status tracking page works</label>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" id="test6" className="mt-1" />
                <label htmlFor="test6">Admin panel shows all requests (admin only)</label>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" id="test7" className="mt-1" />
                <label htmlFor="test7">Admin can update status and resolution (admin only)</label>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" id="test8" className="mt-1" />
                <label htmlFor="test8">Data persists in KV store (check server logs)</label>
              </div>
            </div>
          </div>

          <Alert>
            <CheckCircle2 className="size-4" />
            <AlertDescription>
              <strong>Backend Endpoints Ready:</strong>
              <ul className="list-disc list-inside mt-2 text-xs space-y-1">
                <li>POST /make-server-17cae920/legal/takedown</li>
                <li>GET /make-server-17cae920/legal/takedown/status/:id</li>
                <li>GET /make-server-17cae920/admin/takedown</li>
                <li>PATCH /make-server-17cae920/admin/takedown/:id</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">📄 Documentation Created</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p><strong>Legal Framework:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>/legal/MIU_LICENSING_POLICY.md</li>
              <li>/legal/TAKEDOWN_PROCESS.md</li>
            </ul>
            <p className="mt-4"><strong>Components:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>TakedownRequestForm.tsx</li>
              <li>TakedownStatusView.tsx</li>
              <li>AdminTakedownList.tsx</li>
            </ul>
            <p className="mt-4"><strong>Backend:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>4 API endpoints in index.tsx</li>
              <li>KV store integration</li>
              <li>Rate limiting applied</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </PageTemplate>
  );
}