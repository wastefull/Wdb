import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import {
  Trash2,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Database,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { projectId, publicAnonKey } from "../../utils/supabase/info";
import { useAuthContext } from "../../contexts/AuthContext";

interface RetentionStats {
  screenshots: {
    total: number;
    expired: number;
    expiredSources: Array<{
      id: string;
      title: string;
      created_at: string;
      screenshot_url: string;
    }>;
  };
  auditLogs: {
    total: number;
    expired: number;
    oldestLog: any;
  };
  evidence: {
    total: number;
  };
  lastChecked: string;
}

interface SourceIntegrityCheck {
  source: any;
  canDelete: boolean;
  dependentCount: number;
  dependentEvidence: Array<{
    id: string;
    material_id: string;
    parameter_code: string;
    created_at: string;
    created_by: string;
  }>;
}

interface DataRetentionManagerProps {
  className?: string;
}

export function DataRetentionManager({
  className,
}: DataRetentionManagerProps = {}) {
  const { accessToken } = useAuthContext();
  const [stats, setStats] = useState<RetentionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState<string | null>(null);
  const [sourceId, setSourceId] = useState("");
  const [integrityCheck, setIntegrityCheck] =
    useState<SourceIntegrityCheck | null>(null);
  const [checkingIntegrity, setCheckingIntegrity] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/admin/retention/stats`,
        {
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to fetch retention stats:", error);
        return;
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching retention stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupScreenshots = async () => {
    if (!stats || stats.screenshots.expired === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove ${stats.screenshots.expired} expired screenshot(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setCleanupLoading("screenshots");
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/admin/retention/cleanup-screenshots`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to cleanup screenshots:", error);
        alert("Failed to cleanup screenshots. See console for details.");
        return;
      }

      const data = await response.json();
      alert(`Successfully removed ${data.cleanedCount} expired screenshot(s)`);
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error("Error cleaning up screenshots:", error);
      alert("Error cleaning up screenshots. See console for details.");
    } finally {
      setCleanupLoading(null);
    }
  };

  const handleCleanupAuditLogs = async () => {
    if (!stats || stats.auditLogs.expired === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${stats.auditLogs.expired} expired audit log(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setCleanupLoading("audit-logs");
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/admin/retention/cleanup-audit-logs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to cleanup audit logs:", error);
        alert("Failed to cleanup audit logs. See console for details.");
        return;
      }

      const data = await response.json();
      alert(`Successfully deleted ${data.deletedCount} expired audit log(s)`);
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error("Error cleaning up audit logs:", error);
      alert("Error cleaning up audit logs. See console for details.");
    } finally {
      setCleanupLoading(null);
    }
  };

  const handleCheckIntegrity = async () => {
    if (!sourceId.trim()) {
      alert("Please enter a source ID");
      return;
    }

    try {
      setCheckingIntegrity(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/admin/retention/check-source/${sourceId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken || publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to check source integrity:", error);
        alert("Failed to check source. See console for details.");
        return;
      }

      const data = await response.json();
      setIntegrityCheck(data);
    } catch (error) {
      console.error("Error checking source integrity:", error);
      alert("Error checking source. See console for details.");
    } finally {
      setCheckingIntegrity(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center p-12 ${className || ""}`}
      >
        <Loader2 className="size-8 animate-spin text-black/50" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className || ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading-xl">Data Retention Manager</h2>
          <p className="label-muted">
            Manage data lifecycle and retention policies
          </p>
        </div>
        <Button
          onClick={fetchStats}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      {/* Retention Policy Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Retention Policies
          </CardTitle>
          <CardDescription>
            WasteDB data retention periods per /legal/DATA_RETENTION_POLICY.md
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Database className="size-4 text-blue-600" />
                <span className="font-['Sniglet'] text-[12px] font-semibold">
                  Screenshots
                </span>
              </div>
              <p className="label-muted-xs">7 years from capture</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Database className="size-4 text-green-600" />
                <span className="font-['Sniglet'] text-[12px] font-semibold">
                  Audit Logs
                </span>
              </div>
              <p className="label-muted-xs">7 years from creation</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Database className="size-4 text-purple-600" />
                <span className="font-['Sniglet'] text-[12px] font-semibold">
                  Sources/Evidence
                </span>
              </div>
              <p className="label-muted-xs">
                Indefinite (manual deletion only)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Screenshot Retention */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5" />
            Screenshot Retention
          </CardTitle>
          <CardDescription>
            Screenshots older than 7 years are automatically expired
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="text-[32px] font-['Fredoka_One'] text-blue-600">
                {stats?.screenshots.total || 0}
              </div>
              <p className="label-muted">Total screenshots</p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <div className="text-[32px] font-['Fredoka_One'] text-orange-600">
                {stats?.screenshots.expired || 0}
              </div>
              <p className="label-muted">Expired (7+ years)</p>
            </div>
          </div>

          {stats && stats.screenshots.expired > 0 && (
            <>
              <Alert>
                <AlertTriangle className="size-4" />
                <AlertDescription>
                  <strong>{stats.screenshots.expired} screenshot(s)</strong>{" "}
                  have exceeded the 7-year retention period. You can remove
                  these to reclaim storage space.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="font-['Sniglet'] text-[12px] font-semibold">
                  Expired Screenshots:
                </h4>
                <div className="max-h-[200px] overflow-y-auto space-y-2">
                  {stats.screenshots.expiredSources.map((source) => (
                    <div
                      key={source.id}
                      className="p-3 bg-muted/50 rounded-lg border border-orange-200 dark:border-orange-800"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-['Sniglet'] text-[11px] font-semibold truncate">
                            {source.title}
                          </p>
                          <p className="font-['Sniglet'] text-[10px] text-black/50 dark:text-white/50">
                            Created:{" "}
                            {new Date(source.created_at).toLocaleDateString()}
                          </p>
                          <p className="font-['Sniglet'] text-[9px] text-black/40 dark:text-white/40 truncate">
                            ID: {source.id}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-orange-600 border-orange-600 shrink-0"
                        >
                          Expired
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleCleanupScreenshots}
                disabled={cleanupLoading === "screenshots"}
                className="w-full gap-2 bg-orange-600 hover:bg-orange-700"
              >
                {cleanupLoading === "screenshots" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Cleaning up...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" />
                    Remove {stats.screenshots.expired} Expired Screenshot(s)
                  </>
                )}
              </Button>
            </>
          )}

          {stats && stats.screenshots.expired === 0 && (
            <Alert>
              <CheckCircle2 className="size-4" />
              <AlertDescription>
                ✅ All screenshots are within the 7-year retention period. No
                cleanup needed.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Audit Log Retention */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-5" />
            Audit Log Retention
          </CardTitle>
          <CardDescription>
            Audit logs older than 7 years can be deleted
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="text-[32px] font-['Fredoka_One'] text-green-600">
                {stats?.auditLogs.total || 0}
              </div>
              <p className="label-muted">Total audit logs</p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <div className="text-[32px] font-['Fredoka_One'] text-red-600">
                {stats?.auditLogs.expired || 0}
              </div>
              <p className="label-muted">Expired (7+ years)</p>
            </div>
          </div>

          {stats && stats.auditLogs.expired > 0 && (
            <>
              <Alert>
                <AlertTriangle className="size-4" />
                <AlertDescription>
                  <strong>{stats.auditLogs.expired} audit log(s)</strong> have
                  exceeded the 7-year retention period. These can be safely
                  deleted.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleCleanupAuditLogs}
                disabled={cleanupLoading === "audit-logs"}
                className="w-full gap-2 bg-red-600 hover:bg-red-700"
              >
                {cleanupLoading === "audit-logs" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" />
                    Delete {stats.auditLogs.expired} Expired Log(s)
                  </>
                )}
              </Button>
            </>
          )}

          {stats && stats.auditLogs.expired === 0 && (
            <Alert>
              <CheckCircle2 className="size-4" />
              <AlertDescription>
                ✅ All audit logs are within the 7-year retention period. No
                cleanup needed.
              </AlertDescription>
            </Alert>
          )}

          {stats?.auditLogs.oldestLog && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="font-['Sniglet'] text-[11px] font-semibold mb-1">
                Oldest Audit Log:
              </p>
              <p className="label-muted-xs">
                {new Date(stats.auditLogs.oldestLog.timestamp).toLocaleString()}{" "}
                - {stats.auditLogs.oldestLog.action} on{" "}
                {stats.auditLogs.oldestLog.entityType}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Source Referential Integrity Checker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5" />
            Source Deletion Check
          </CardTitle>
          <CardDescription>
            Check if a source can be safely deleted (no evidence references)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              placeholder="Enter source ID (e.g., source-1731456789-abc123)"
              className="flex-1 px-3 py-2 border border-[#211f1c]/20 dark:border-white/20 rounded-lg font-['Sniglet'] text-[12px] focus:outline-none focus:ring-2 focus:ring-[#211f1c] dark:focus:ring-white"
            />
            <Button
              onClick={handleCheckIntegrity}
              disabled={checkingIntegrity || !sourceId.trim()}
              className="gap-2"
            >
              {checkingIntegrity ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Database className="size-4" />
                  Check
                </>
              )}
            </Button>
          </div>

          {integrityCheck && (
            <div className="space-y-3">
              <div className="p-4 bg-muted/50 rounded-lg border-2 border-[#211f1c]/20 dark:border-white/20">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-['Sniglet'] text-[13px] font-semibold mb-1">
                      {integrityCheck.source.title}
                    </h4>
                    <p className="label-muted-xs">
                      Type: {integrityCheck.source.type}
                    </p>
                    {integrityCheck.source.doi && (
                      <p className="label-muted-xs">
                        DOI: {integrityCheck.source.doi}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      integrityCheck.canDelete ? "default" : "destructive"
                    }
                  >
                    {integrityCheck.canDelete ? "Can Delete" : "Cannot Delete"}
                  </Badge>
                </div>

                {integrityCheck.canDelete ? (
                  <Alert>
                    <CheckCircle2 className="size-4" />
                    <AlertDescription>
                      ✅ This source has no dependent evidence points. It can be
                      safely deleted.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Alert>
                      <AlertTriangle className="size-4" />
                      <AlertDescription>
                        ⛔ This source is referenced by{" "}
                        <strong>
                          {integrityCheck.dependentCount} evidence point(s)
                        </strong>
                        . Delete the evidence first, or mark the source as
                        deprecated.
                      </AlertDescription>
                    </Alert>

                    <div className="mt-3 space-y-2">
                      <h5 className="font-['Sniglet'] text-[11px] font-semibold">
                        Dependent Evidence:
                      </h5>
                      <div className="max-h-[150px] overflow-y-auto space-y-2">
                        {integrityCheck.dependentEvidence.map((evidence) => (
                          <div
                            key={evidence.id}
                            className="p-2 bg-white dark:bg-black/20 rounded border border-red-200 dark:border-red-800"
                          >
                            <p className="font-['Sniglet'] text-[10px]">
                              <strong>Material:</strong> {evidence.material_id}
                            </p>
                            <p className="font-['Sniglet'] text-[10px]">
                              <strong>Parameter:</strong>{" "}
                              {evidence.parameter_code}
                            </p>
                            <p className="font-['Sniglet'] text-[9px] text-black/50 dark:text-white/50">
                              Created:{" "}
                              {new Date(
                                evidence.created_at
                              ).toLocaleDateString()}{" "}
                              by {evidence.created_by}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-5" />
            Database Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="label-muted-xs mb-1">Total Evidence Points</p>
              <div className="text-[24px] font-['Fredoka_One'] text-purple-600">
                {stats?.evidence.total || 0}
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="label-muted-xs mb-1">Last Checked</p>
              <div className="font-['Sniglet'] text-[11px]">
                {stats ? new Date(stats.lastChecked).toLocaleTimeString() : "-"}
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="label-muted-xs mb-1">Policy Version</p>
              <div className="font-['Sniglet'] text-[11px]">
                v1.0 (Nov 2025)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
