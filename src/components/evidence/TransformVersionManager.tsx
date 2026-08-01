import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Info,
  GitBranch,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { apiCall } from "../../utils/api";
import { logger } from "../../utils/logger";
interface Transform {
  id: string;
  parameter: string;
  dimension: string;
  name: string;
  formula: string;
  description: string;
  version: string;
  effective_date: string;
  unit_input: string;
  unit_output: string;
  changelog: string;
}

interface TransformsData {
  version: string;
  last_updated: string;
  description: string;
  transforms: Transform[];
}

interface RecomputeJob {
  id: string;
  parameter: string;
  oldTransformId: string;
  oldTransformVersion: string;
  newTransformVersion: string;
  reason: string;
  status: "pending" | "running" | "completed" | "failed";
  createdAt: string;
  createdBy: string;
  completedAt: string | null;
  affectedMiusCount: number;
  errorMessage: string | null;
}

interface TransformVersionManagerProps {
  className?: string;
}

export function TransformVersionManager({
  className,
}: TransformVersionManagerProps = {}) {
  const [transforms, setTransforms] = useState<TransformsData | null>(null);
  const [jobs, setJobs] = useState<RecomputeJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingJobs, setRefreshingJobs] = useState(false);
  const [selectedTransform, setSelectedTransform] = useState<Transform | null>(
    null,
  );
  const [showRecomputeDialog, setShowRecomputeDialog] = useState(false);
  const [newVersion, setNewVersion] = useState("");
  const [reason, setReason] = useState("");
  const [recomputeLoading, setRecomputeLoading] = useState(false);

  useEffect(() => {
    loadTransforms();
    loadJobs();
  }, []);

  const loadTransforms = async () => {
    try {
      const data = await apiCall("/transforms", { method: "GET" });
      setTransforms(data);
    } catch (error) {
      logger.error("Failed to load transforms:", error);
      toast.error("Failed to load transform definitions");
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      const data = await apiCall("/transforms/recompute", { method: "GET" });
      setJobs(data.jobs || []);

      // Show toast only when manually refreshing
      if (refreshingJobs) {
        toast.success(
          `Refreshed job list - ${data.jobs?.length || 0} job(s) found`,
        );
      }
    } catch (error) {
      logger.error("Failed to load recompute jobs:", error);
      if (refreshingJobs) {
        toast.error("Failed to refresh job list");
      }
    } finally {
      setRefreshingJobs(false);
    }
  };

  const handleRecompute = async () => {
    if (!selectedTransform || !newVersion.trim()) {
      toast.error("Please provide a new version number");
      return;
    }

    setRecomputeLoading(true);

    try {
      const result = await apiCall("/transforms/recompute", {
        method: "POST",
        body: JSON.stringify({
          parameter: selectedTransform.parameter,
          newTransformVersion: newVersion.trim(),
          reason: reason.trim() || "Manual recompute triggered",
        }),
      });

      toast.success(`Recompute job created: ${result.jobId}`);
      setShowRecomputeDialog(false);
      setSelectedTransform(null);
      setNewVersion("");
      setReason("");
      loadJobs();
    } catch (error) {
      logger.error("Failed to create recompute job:", error);
      toast.error("Failed to create recompute job");
    } finally {
      setRecomputeLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "running":
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "running":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "failed":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
    }
  };

  const getDimensionColor = (dimension: string) => {
    switch (dimension) {
      case "CR":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "CC":
        return "bg-green-100 text-green-800 border-green-300";
      case "RU":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center py-12 ${className || ""}`}
      >
        <RefreshCw className="w-6 h-6 animate-spin normal" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className || ""}`}>
      {/* Header */}
      <div>
        <h1 className="font-['Tilt_Warp',sans-serif] text-[24px] normal mb-2">
          Transform Version Manager
        </h1>
        <p className="text-[14px] text-black/70">
          Manage versioned transforms and trigger recomputation for all 13
          parameters
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="bg-blue-50 border-blue-300">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-[12px] text-blue-900">
          <strong>Transform Governance:</strong> When you update a transform
          formula, all MIUs using the old version must be recomputed to maintain
          data consistency. Recompute jobs will run automatically once MIUs are
          created in Phase 9.2.
        </AlertDescription>
      </Alert>

      {/* Transform Overview */}
      {transforms && (
        <Card className="bg-white border-[#211f1c]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[18px] normal">
                  Transform Definitions
                </CardTitle>
                <CardDescription className="text-[12px] text-black/60">
                  Version {transforms.version} • Updated{" "}
                  {new Date(transforms.last_updated).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-300">
                {transforms.transforms.length} Parameters
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Group by dimension */}
              {["CR", "CC", "RU"].map((dimension) => {
                const dimensionTransforms = transforms.transforms.filter(
                  (t) => t.dimension === dimension,
                );

                return (
                  <div key={dimension}>
                    <h3 className="text-[14px] normal mb-2 flex items-center gap-2">
                      <Badge className={getDimensionColor(dimension)}>
                        {dimension}
                      </Badge>
                      <span>
                        {dimension === "CR" && "Recyclability"}
                        {dimension === "CC" && "Compostability"}
                        {dimension === "RU" && "Reusability"}
                      </span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {dimensionTransforms.map((transform) => (
                        <Card
                          key={transform.id}
                          className="bg-[#f5f3f0] border-[#211f1c] hover:border-[#211f1c]/50 transition-all cursor-pointer"
                          onClick={() => {
                            setSelectedTransform(transform);
                            setShowRecomputeDialog(true);
                            setNewVersion(transform.version);
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="text-[16px] normal">
                                  {transform.parameter}
                                </div>
                                <div className="text-sm text-black/60">
                                  {transform.name}
                                </div>
                              </div>
                              <Badge variant="outline" className="text-[9px]">
                                v{transform.version}
                              </Badge>
                            </div>

                            <div className="bg-white rounded p-2 mb-2 border border-[#211f1c]/20">
                              <code className="font-mono text-xs normal">
                                {transform.formula}
                              </code>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-black/60">
                              <span>
                                {transform.unit_input} → {transform.unit_output}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recompute Dialog */}
      {showRecomputeDialog && selectedTransform && (
        <Card className="bg-yellow-50 border-yellow-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[18px] normal flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  Trigger Recompute for {selectedTransform.parameter}
                </CardTitle>
                <CardDescription className="text-[12px] text-black/60">
                  {selectedTransform.name} ({selectedTransform.dimension})
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowRecomputeDialog(false);
                  setSelectedTransform(null);
                  setNewVersion("");
                  setReason("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-orange-50 border-orange-300">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-sm text-orange-900">
                <strong>Warning:</strong> Changing a transform formula will
                trigger recomputation of all MIUs using this parameter. This
                operation may take several minutes and will update material
                values.
              </AlertDescription>
            </Alert>

            <div className="bg-white rounded-lg p-4 border border-[#211f1c]/20">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <Label className="text-sm text-black/70">
                    Current Version
                  </Label>
                  <div className="font-mono text-[12px] normal">
                    {selectedTransform.version}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-black/70">
                    Current Formula
                  </Label>
                  <div className="font-mono text-[12px] normal">
                    {selectedTransform.formula}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="newVersion" className="text-[12px] normal">
                    New Version Number
                  </Label>
                  <Input
                    id="newVersion"
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    placeholder="e.g., 1.1"
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="reason" className="text-[12px] normal">
                    Reason for Change
                  </Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Updated formula to account for new research findings..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleRecompute}
              disabled={!newVersion.trim() || recomputeLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {recomputeLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating Job...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Create Recompute Job
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recompute Jobs History */}
      <Card className="bg-white border-[#211f1c]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[18px] normal flex items-center gap-2">
                <History className="w-5 h-5" />
                Recompute Jobs
              </CardTitle>
              <CardDescription className="text-[12px] text-black/60">
                History of transform recomputation jobs
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRefreshingJobs(true);
                loadJobs();
              }}
              disabled={refreshingJobs}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${
                  refreshingJobs ? "animate-spin" : ""
                }`}
              />
              {refreshingJobs ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {jobs.length > 0 && (
            <Alert className="mb-4 bg-yellow-50 border-yellow-300">
              <Clock className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm text-yellow-900">
                <strong>Note:</strong> Job processing is not yet implemented.
                All jobs will remain in "pending" status until Phase 9.2 when
                MIU (Material Impact Units) are added. At that point, jobs will
                automatically process and update material scores.
              </AlertDescription>
            </Alert>
          )}
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-black/50">
              <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-[12px]">No recompute jobs yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-[#f5f3f0] rounded-lg p-4 border border-[#211f1c]/20"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <div>
                        <div className="text-[14px] normal">
                          {job.parameter} Transform Update
                        </div>
                        <div className="text-sm text-black/60">
                          {job.oldTransformVersion} → {job.newTransformVersion}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                  </div>

                  <div className="text-sm text-black/70 mb-2">
                    <strong>Reason:</strong> {job.reason}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-black/60">
                    <span>Job ID: {job.id}</span>
                    <span>
                      Created: {new Date(job.createdAt).toLocaleString()}
                    </span>
                    {job.completedAt && (
                      <span>
                        Completed: {new Date(job.completedAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {job.errorMessage && (
                    <Alert className="mt-2 bg-red-50 border-red-300">
                      <AlertDescription className="text-sm text-red-900">
                        {job.errorMessage}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
