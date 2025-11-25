/**
 * Phase-Filtered Test View
 *
 * Generic component that filters and displays tests for a specific phase.
 * Can be reused across all phase tabs in the Roadmap.
 */

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  PlayCircle,
  FileQuestion,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "../../contexts/AuthContext";
import {
  getTestDefinitionsByPhase,
  Test,
} from "../../config/tests/testDefinitions";

interface TestResult {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
}

interface PhaseFilteredTestsProps {
  phase: string; // e.g., '9.1', '9.2', '10'
  title?: string; // Optional custom title
  description?: string; // Optional custom description
}

export function PhaseFilteredTests({
  phase,
  title,
  description,
}: PhaseFilteredTestsProps) {
  const { user } = useAuthContext();
  const [testResults, setTestResults] = useState<Record<string, TestResult>>(
    {}
  );
  const [runningAll, setRunningAll] = useState(false);

  const runTest = async (
    testId: string,
    testFn: () => Promise<{ success: boolean; message: string }>
  ) => {
    setTestResults((prev) => ({ ...prev, [testId]: { status: "loading" } }));

    try {
      const result = await testFn();
      setTestResults((prev) => ({
        ...prev,
        [testId]: {
          status: result.success ? "success" : "error",
          message: result.message,
        },
      }));

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setTestResults((prev) => ({
        ...prev,
        [testId]: { status: "error", message: errorMsg },
      }));
      toast.error(errorMsg);
    }
  };

  // Get tests for the requested phase
  const allTests: Test[] = getTestDefinitionsByPhase(phase, user) || [];

  const runAllTests = async () => {
    setRunningAll(true);
    const testIds = allTests.map((t) => t.id);

    for (const testId of testIds) {
      const test = allTests.find((t) => t.id === testId);
      if (test) {
        await runTest(testId, test.testFn);
        // Small delay between tests to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    setRunningAll(false);
    toast.success(`All Phase ${phase} tests completed`);
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="size-5 text-green-600" />;
      case "error":
        return <XCircle className="size-5 text-red-600" />;
      case "loading":
        return <Loader2 className="size-5 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="size-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-600 hover:bg-green-700">Passed</Badge>
        );
      case "error":
        return <Badge variant="destructive">Failed</Badge>;
      case "loading":
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700">Running...</Badge>
        );
      default:
        return <Badge variant="outline">Not Run</Badge>;
    }
  };

  const totalTests = allTests.length;
  const passedTests = Object.values(testResults).filter(
    (r) => r.status === "success"
  ).length;
  const failedTests = Object.values(testResults).filter(
    (r) => r.status === "error"
  ).length;

  const copyFailedTests = async () => {
    const failedTestData = allTests
      .filter((test) => testResults[test.id]?.status === "error")
      .map((test) => {
        const result = testResults[test.id];
        return {
          Status: "Failed",
          Phase: test.phase,
          Category: test.category,
          "Test Name": test.name,
          Description: test.description,
          Result: result.message || "No error message",
        };
      });

    if (failedTestData.length === 0) {
      toast.error("No failed tests to copy");
      return;
    }

    // Create tab-separated text for easy pasting into spreadsheets
    const headers = [
      "Status",
      "Phase",
      "Category",
      "Test Name",
      "Description",
      "Result",
    ];
    const rows = failedTestData.map((test) =>
      headers.map((header) => test[header as keyof typeof test]).join("\t")
    );
    const text = [headers.join("\t"), ...rows].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      toast.success(
        `Copied ${failedTestData.length} failed test(s) to clipboard`
      );
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Group tests by category
  const testsByCategory = allTests.reduce((acc, test) => {
    if (!acc[test.category]) {
      acc[test.category] = [];
    }
    acc[test.category].push(test);
    return acc;
  }, {} as Record<string, Test[]>);

  const categories = Object.keys(testsByCategory);

  // Empty state - no tests for this phase yet
  if (allTests.length === 0) {
    return (
      <Card className="border-2 border-dashed border-muted-foreground/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-['Sniglet']">
                {title || `Phase ${phase} Tests`}
              </CardTitle>
              <CardDescription>
                {description || "Automated API tests for this phase"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileQuestion className="size-16 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-['Sniglet'] text-muted-foreground mb-2">
            No tests created yet
          </p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Tests for Phase {phase} will be added as backend endpoints are
            implemented. Check the unified test suite on the{" "}
            <strong>Tests</strong> tab for all available tests.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-[#bae1ff]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-['Sniglet']">
              {title || `Phase ${phase} Tests`}
            </CardTitle>
            <CardDescription>
              {description || "Automated API tests for this phase"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right">
              <div className="font-['Sniglet']">
                {passedTests}/{totalTests} passed
              </div>
              {failedTests > 0 && (
                <div className="text-red-600 font-['Sniglet']">
                  {failedTests} failed
                </div>
              )}
            </div>
            <Button
              onClick={runAllTests}
              disabled={runningAll || !user}
              className="bg-[#bae1ff] hover:bg-[#9dd1ff] text-black font-['Sniglet']"
            >
              {runningAll ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <PlayCircle className="size-4 mr-2" />
                  Run All Tests
                </>
              )}
            </Button>
            {failedTests > 0 && (
              <Button
                onClick={copyFailedTests}
                variant="outline"
                size="sm"
                title="Copy failed tests to clipboard"
                className="font-['Sniglet']"
              >
                <Copy className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map((category) => (
          <div key={category} className="space-y-2">
            <h3 className="font-['Sniglet'] text-sm text-muted-foreground">
              {category}
            </h3>
            <div className="space-y-2">
              {testsByCategory[category].map((test) => {
                const result = testResults[test.id] || { status: "idle" };
                return (
                  <div
                    key={test.id}
                    className="flex items-start justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(result.status)}
                      <div className="flex-1 min-w-0">
                        <div className="font-['Sniglet'] font-semibold">
                          {test.name}
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {test.description}
                        </div>
                        {result.message && (
                          <div
                            className={`text-sm mt-2 ${
                              result.status === "error"
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {result.message}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(result.status)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runTest(test.id, test.testFn)}
                        disabled={result.status === "loading" || !user}
                        className="font-['Sniglet']"
                      >
                        {result.status === "loading" ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          "Run"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {!user && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-['Sniglet']">
              ⚠️ Please sign in as admin to run tests
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
