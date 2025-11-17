import { useState } from 'react';
import { PageTemplate } from './PageTemplate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Unlock, FlaskConical, CheckCircle } from 'lucide-react';
import { Phase9Day10BackendTests } from './Phase9Day10BackendTests';
import { Phase9Day10UITests } from './Phase9Day10UITests';
import { useNavigationContext } from '../contexts/NavigationContext';

export function Phase9Day10TestingPage() {
  const { navigateToAdminDashboard, navigateToSourceLibrary } = useNavigationContext();

  return (
    <PageTemplate
      title="Phase 9.0 Day 10 Testing"
      description="Open Access Integration - Full Testing Suite"
      onBack={navigateToAdminDashboard}
    >
      <div className="space-y-6">
        {/* Overview Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Unlock className="w-8 h-8 text-green-600" />
              <div>
                <CardTitle>Open Access Triage Testing</CardTitle>
                <CardDescription>
                  Complete Open Access integration with Unpaywall API - Backend + UI
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                ✅ Backend Complete
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                ✅ UI Complete
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                13 Tests Total
              </Badge>
            </div>

            <Alert>
              <FlaskConical className="w-4 h-4" />
              <AlertDescription>
                <strong>What's being tested:</strong> Complete Open Access integration including
                Unpaywall API integration, DOI normalization, OA status checking, UI filters,
                badges, and curator preferences.
              </AlertDescription>
            </Alert>

            {/* Feature Summary */}
            <div className="space-y-4">
              <h3 className="font-['Sniglet:Regular',_sans-serif] text-[14px]">Implemented Features</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="text-[13px] flex items-center gap-2">
                      <FlaskConical className="w-4 h-4" />
                      Backend (Tests 0-7)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-[11px] space-y-1">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                        Unpaywall API integration endpoint
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                        DOI normalization (10.xxxx format)
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                        Error handling & edge cases
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                        Source creation with OA fields
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                        Batch save with OA data
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="text-[13px] flex items-center gap-2">
                      <Unlock className="w-4 h-4" />
                      UI Features (Tests 8-12)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-[11px] space-y-1">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                        OA filter toggle in Source Library
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                        OA status badges (green/red)
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                        "Check OA" button interaction
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                        Prioritize OA preference setting
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5" />
                        Session-based OA status caching
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Backend Endpoints */}
            <Alert className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
              <FlaskConical className="w-4 h-4 text-purple-600" />
              <AlertDescription>
                <strong>Backend Endpoint:</strong>
                <ul className="list-disc list-inside mt-2 text-[10px] space-y-1">
                  <li>GET /make-server-17cae920/sources/check-oa?doi=10.xxxx</li>
                  <li>Returns: {`{ is_open_access, oa_status, best_oa_location }`}</li>
                  <li>Integrates with Unpaywall API (polite mode with email)</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Test Tabs */}
        <Tabs defaultValue="backend" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="backend">
              Backend Tests (0-7)
            </TabsTrigger>
            <TabsTrigger value="ui">
              UI Tests (8-12)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="backend" className="mt-6">
            <Phase9Day10BackendTests />
          </TabsContent>

          <TabsContent value="ui" className="mt-6">
            <Phase9Day10UITests />
          </TabsContent>
        </Tabs>

        {/* Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Documentation & Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[11px] space-y-3">
              <div>
                <p className="font-['Sniglet:Regular',_sans-serif] mb-1"><strong>API Integration:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Unpaywall API: https://unpaywall.org/products/api</li>
                  <li>Polite pool access with email parameter</li>
                  <li>DOI normalization handled automatically</li>
                </ul>
              </div>
              <div>
                <p className="font-['Sniglet:Regular',_sans-serif] mb-1"><strong>Components:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>SourceLibraryManager.tsx - OA filter, badges, check button</li>
                  <li>AccessibilityContext.tsx - prioritizeOA preference</li>
                  <li>Phase9Day10BackendTests.tsx - Backend test suite</li>
                  <li>Phase9Day10UITests.tsx - UI test suite</li>
                </ul>
              </div>
              <div>
                <p className="font-['Sniglet:Regular',_sans-serif] mb-1"><strong>Backend:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>/supabase/functions/server/index.tsx - OA check endpoint</li>
                  <li>Route ordering fix for proper API dispatch</li>
                  <li>Comprehensive error handling</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTemplate>
  );
}