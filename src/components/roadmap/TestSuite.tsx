import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  PlayCircle,
  AlertCircle,
  Copy,
  CheckSquare,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "../../contexts/AuthContext";
import {
  getAllTestDefinitions,
  Test,
} from "../../config/tests/testDefinitions";

interface TestResult {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
}

export function TestSuite() {
  const { user } = useAuthContext();
  const [testResults, setTestResults] = useState<Record<string, TestResult>>(
    {},
  );
  const [runningAll, setRunningAll] = useState(false);
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());

  // Get all tests from centralized test definitions
  const tests: Test[] = getAllTestDefinitions(user);
  const getStageLabel = (test: Test) =>
    test.stage ? `Stage ${test.stage}` : `Legacy ${test.phase}`;

  const toggleStage = (stage: string) => {
    setSelectedStages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stage)) {
        newSet.delete(stage);
      } else {
        newSet.add(stage);
      }
      return newSet;
    });
  };

  const selectAllStages = () => {
    const stages = Array.from(new Set(tests.map(getStageLabel)));
    setSelectedStages(new Set(stages));
  };

  const selectNoStages = () => {
    setSelectedStages(new Set());
  };

  const runTest = async (
    testId: string,
    testFn: () => Promise<{
      success: boolean;
      message: string;
    }>,
  ) => {
    setTestResults((prev) => ({
      ...prev,
      [testId]: { status: "loading" },
    }));

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

  const runAllTests = async () => {
    setRunningAll(true);
    const testIds = filteredTests.map((t) => t.id);

    for (const testId of testIds) {
      const test = tests.find((t) => t.id === testId);
      if (test) {
        await runTest(testId, test.testFn);
        // Small delay between tests to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    setRunningAll(false);
    const stageText =
      selectedStages.size === 0
        ? ""
        : selectedStages.size === uniqueStages.length
          ? ""
          : ` (${selectedStages.size} stage${
              selectedStages.size > 1 ? "s" : ""
            })`;
    toast.success(`All tests completed${stageText}`);
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

  // Get unique current stages for filter.
  const uniqueStages = Array.from(new Set(tests.map(getStageLabel))).sort();

  // Filter tests by selected stages (if none selected, show all).
  const filteredTests =
    selectedStages.size === 0
      ? tests
      : tests.filter((test) => selectedStages.has(getStageLabel(test)));

  const totalTests = filteredTests.length;
  const passedTests = filteredTests.filter(
    (t) => testResults[t.id]?.status === "success",
  ).length;
  const failedTests = filteredTests.filter(
    (t) => testResults[t.id]?.status === "error",
  ).length;

  const copyFailedTests = async () => {
    const failedTestData = filteredTests
      .filter((test) => testResults[test.id]?.status === "error")
      .map((test) => {
        const result = testResults[test.id];
        return {
          Status: "Failed",
          Stage: getStageLabel(test),
          "Legacy Phase": test.legacyPhase ?? "—",
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
      "Stage",
      "Legacy Phase",
      "Category",
      "Test Name",
      "Description",
      "Result",
    ];
    const rows = failedTestData.map((test) =>
      headers.map((header) => test[header as keyof typeof test]).join("\t"),
    );
    const text = [headers.join("\t"), ...rows].join("\n");

    try {
      // Use fallback method directly since Clipboard API is blocked in this environment
      const input = document.createElement("textarea");
      input.value = text;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      input.setSelectionRange(0, 99999); // For mobile devices

      const successful = document.execCommand("copy");
      document.body.removeChild(input);

      if (successful) {
        toast.success(
          `Copied ${failedTestData.length} failed test(s) to clipboard`,
        );
      } else {
        toast.error("Failed to copy to clipboard");
      }
    } catch (error) {
      toast.error("Failed to copy to clipboard");
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
                Regression testing mapped to the current roadmap stages
              </p>

              {/* Stage Filter Tabs */}
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <span className="text-sm text-muted-foreground font-['Sniglet']">
                  Stages{" "}
                  {selectedStages.size > 0 &&
                    `(${selectedStages.size}/${uniqueStages.length})`}
                  :
                </span>

                {/* Select All/None buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={selectAllStages}
                    className="p-1.5 hover:bg-muted rounded transition-colors"
                    title="Select all stages"
                  >
                    <CheckSquare className="size-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={selectNoStages}
                    className="p-1.5 hover:bg-muted rounded transition-colors"
                    title="Select no stages"
                  >
                    <Square className="size-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Stage toggle buttons */}
                {uniqueStages.map((stage) => (
                  <button
                    key={stage}
                    onClick={() => toggleStage(stage)}
                    className={`px-3 py-1.5 text-sm font-['Sniglet'] rounded-md border-2 transition-all ${
                      selectedStages.has(stage)
                        ? "bg-[#bae1ff] border-[#9dd1ff] text-black shadow-sm translate-y-0"
                        : "bg-background border-border text-muted-foreground hover:border-[#bae1ff] hover:text-foreground translate-y-0 hover:-translate-y-0.5"
                    }`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={runAllTests} disabled={runningAll} size="lg">
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
                  <th className="text-left p-4 font-['Sniglet'] text-[12px]">
                    Status
                  </th>
                  <th className="text-left p-4 font-['Sniglet'] text-[12px]">
                    Stage
                  </th>
                  <th className="text-left p-4 font-['Sniglet'] text-[12px]">
                    Category
                  </th>
                  <th className="text-left p-4 font-['Sniglet'] text-[12px]">
                    Test Name
                  </th>
                  <th className="text-left p-4 font-['Sniglet'] text-[12px]">
                    Description
                  </th>
                  <th className="text-left p-4 font-['Sniglet'] text-[12px]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map((test, index) => {
                  const result = testResults[test.id] || {
                    status: "idle",
                  };

                  return (
                    <tr
                      key={test.id}
                      className={`border-t ${
                        index % 2 === 0
                          ? "bg-white dark:bg-[#1a1917]"
                          : "bg-muted/20"
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          {getStatusBadge(result.status)}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-['Sniglet'] text-sm text-muted-foreground">
                          {getStageLabel(test)}
                          {test.legacyPhase && (
                            <span className="block text-xs mt-1">
                              Legacy phase {test.legacyPhase}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          className="font-['Sniglet'] text-xs"
                        >
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
                          <div
                            className={`text-xs mt-1 ${
                              result.status === "success"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {result.message}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runTest(test.id, test.testFn)}
                          disabled={result.status === "loading"}
                        >
                          {result.status === "loading" ? (
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
