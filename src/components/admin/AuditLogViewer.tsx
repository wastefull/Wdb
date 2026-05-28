import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  User,
  Activity,
  X,
} from "lucide-react";
import { projectId, publicAnonKey } from "../../utils/supabase/info";
import { logger as log } from "../../utils/logger";
import { Modal } from "../shared/Modal";
interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  entityType: string;
  entityId: string;
  action: "create" | "update" | "delete";
  before: any;
  after: any;
  changes: string[];
  ipAddress?: string;
  userAgent?: string;
}

interface AuditStats {
  total: number;
  byEntityType: Record<string, number>;
  byAction: Record<string, number>;
  byUser: Record<string, { email: string; count: number }>;
  recentActivity: AuditLogEntry[];
}

interface AuditLogViewerProps {
  onBack: () => void;
}

export function AuditLogViewer({ onBack }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const normalizeLog = (row: any): AuditLogEntry => {
    const action =
      row?.action === "create" ||
      row?.action === "update" ||
      row?.action === "delete"
        ? row.action
        : "update";

    return {
      id: String(row?.id ?? ""),
      timestamp: String(row?.timestamp ?? new Date().toISOString()),
      userId: String(row?.userId ?? ""),
      userEmail: String(row?.userEmail ?? "unknown"),
      entityType: String(row?.entityType ?? "unknown"),
      entityId: String(row?.entityId ?? ""),
      action,
      before: row?.before ?? null,
      after: row?.after ?? null,
      changes: Array.isArray(row?.changes)
        ? row.changes.map((c: any) => String(c))
        : [],
      ipAddress: row?.ipAddress ? String(row.ipAddress) : undefined,
      userAgent: row?.userAgent ? String(row.userAgent) : undefined,
    };
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [page, entityTypeFilter, actionFilter, userFilter, startDate, endDate]);

  async function fetchLogs() {
    try {
      setLoading(true);
      setFetchError(null);
      const accessToken = sessionStorage.getItem("wastedb_access_token");
      const isCustomToken = !!accessToken && accessToken !== publicAnonKey;

      const params = new URLSearchParams({
        offset: String(page * limit),
        limit: String(limit),
      });

      if (entityTypeFilter) params.append("entityType", entityTypeFilter);
      if (actionFilter) params.append("action", actionFilter);
      if (userFilter) params.append("userId", userFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/audit/logs?${params}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            ...(isCustomToken ? { "X-Session-Token": accessToken } : {}),
          },
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Failed to fetch audit logs (${response.status}): ${errorBody}`,
        );
      }

      const data = await response.json();
      const normalizedLogs = Array.isArray(data?.logs)
        ? data.logs.map(normalizeLog)
        : [];
      setLogs(normalizedLogs);
      setTotal(Number(data?.total ?? normalizedLogs.length));
    } catch (error) {
      log.error("Error fetching audit logs:", error);
      setFetchError(
        "Unable to load audit logs. Please confirm admin mode and sign-in state.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const accessToken = sessionStorage.getItem("wastedb_access_token");
      const isCustomToken = !!accessToken && accessToken !== publicAnonKey;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/audit/stats`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            ...(isCustomToken ? { "X-Session-Token": accessToken } : {}),
          },
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Failed to fetch audit stats (${response.status}): ${errorBody}`,
        );
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      log.error("Error fetching audit stats:", error);
    }
  }

  function exportLogs() {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `audit-logs-${new Date().toISOString()}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  }

  function getActionColor(action: string) {
    switch (action) {
      case "create":
        return "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500";
      case "update":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500";
      case "delete":
        return "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500";
    }
  }

  // Filter logs by search query (client-side)
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (log.entityType || "").toLowerCase().includes(query) ||
      (log.entityId || "").toLowerCase().includes(query) ||
      (log.userEmail || "").toLowerCase().includes(query) ||
      (Array.isArray(log.changes) ? log.changes : []).some((change) =>
        (change || "").toLowerCase().includes(query),
      )
    );
  });

  return (
    <div className="min-h-screen bg-linear-to-b from-[#e8f4f8] to-waste-reuse dark:from-[#0a0908] dark:to-[#1a1917] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="mb-4 px-4 py-2 bg-waste-reuse dark:bg-[#2d2b28] rounded-lg border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all font-['Sniglet'] text-[12px]"
          >
            ← Back to Admin
          </button>

          <h1 className="font-['Tilt_Warp'] text-[32px] normal mb-2">
            Audit Log Viewer
          </h1>
          <p className="font-['Sniglet'] text-[14px] text-black/60 dark:text-white/60">
            Complete audit trail of all data changes in WasteDB
          </p>
        </div>

        {/* Statistics Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-[#1a1917] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={20} className="normal" />
                <h3 className="label-muted">Total Events</h3>
              </div>
              <p className="heading-xl">{stats.total}</p>
            </div>

            <div className="bg-white dark:bg-[#1a1917] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] p-4">
              <div className="flex items-center gap-2 mb-2">
                <User size={20} className="normal" />
                <h3 className="label-muted">Active Users</h3>
              </div>
              <p className="heading-xl">{Object.keys(stats.byUser).length}</p>
            </div>

            <div className="bg-white dark:bg-[#1a1917] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={20} className="normal" />
                <h3 className="label-muted">Creates</h3>
              </div>
              <p className="font-['Tilt_Warp'] text-[24px] text-green-600 dark:text-green-400">
                {stats.byAction.create || 0}
              </p>
            </div>

            <div className="bg-white dark:bg-[#1a1917] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={20} className="normal" />
                <h3 className="label-muted">Deletes</h3>
              </div>
              <p className="font-['Tilt_Warp'] text-[24px] text-red-600 dark:text-red-400">
                {stats.byAction.delete || 0}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-[#1a1917] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)] p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={16} />
            <h3 className="font-['Tilt_Warp'] text-[16px]">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block label-muted mb-1">Entity Type</label>
              <select
                value={entityTypeFilter}
                onChange={(e) => {
                  setEntityTypeFilter(e.target.value);
                  setPage(0);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-[#2d2b28] border border-[#211f1c]/20 dark:border-white/20 rounded-md font-['Sniglet'] text-[12px]"
              >
                <option value="">All Types</option>
                <option value="material">Material</option>
                <option value="source">Source</option>
                <option value="evidence">Evidence</option>
                <option value="article">Article</option>
                <option value="whitepaper">Whitepaper</option>
                <option value="user">User</option>
              </select>
            </div>

            <div>
              <label className="block label-muted mb-1">Action</label>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(0);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-[#2d2b28] border border-[#211f1c]/20 dark:border-white/20 rounded-md font-['Sniglet'] text-[12px]"
              >
                <option value="">All Actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
              </select>
            </div>

            <div>
              <label className="block label-muted mb-1">Search</label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search logs..."
                  className="w-full pl-10 pr-3 py-2 bg-white dark:bg-[#2d2b28] border border-[#211f1c]/20 dark:border-white/20 rounded-md font-['Sniglet'] text-[12px]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block label-muted mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(0);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-[#2d2b28] border border-[#211f1c]/20 dark:border-white/20 rounded-md font-['Sniglet'] text-[12px]"
              />
            </div>

            <div>
              <label className="block label-muted mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(0);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-[#2d2b28] border border-[#211f1c]/20 dark:border-white/20 rounded-md font-['Sniglet'] text-[12px]"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={exportLogs}
              className="flex items-center gap-2 px-4 py-2 bg-waste-reuse dark:bg-[#2d2b28] rounded-lg border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all font-['Sniglet'] text-[12px]"
            >
              <Download size={16} />
              Export Logs
            </button>
          </div>
        </div>

        {fetchError && (
          <div className="mb-6 px-4 py-3 rounded-md border border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300 font-['Sniglet'] text-[12px]">
            {fetchError}
          </div>
        )}

        {/* Logs Table */}
        <div className="bg-white dark:bg-[#1a1917] rounded-[11.46px] border-[1.5px] border-[#211f1c] dark:border-white/20 shadow-[3px_4px_0px_-1px_#000000] dark:shadow-[3px_4px_0px_-1px_rgba(255,255,255,0.2)]">
          <div className="panel-bordered">
            <h3 className="font-['Tilt_Warp'] text-[18px]">
              Audit Logs ({total} total)
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <p className="label-muted">Loading audit logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="label-muted">No audit logs found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#e8f4f8] dark:bg-[#2d2b28]">
                    <tr>
                      <th className="px-4 py-3 text-left font-['Sniglet'] text-[12px]">
                        Timestamp
                      </th>
                      <th className="px-4 py-3 text-left font-['Sniglet'] text-[12px]">
                        User
                      </th>
                      <th className="px-4 py-3 text-left font-['Sniglet'] text-[12px]">
                        Action
                      </th>
                      <th className="px-4 py-3 text-left font-['Sniglet'] text-[12px]">
                        Entity Type
                      </th>
                      <th className="px-4 py-3 text-left font-['Sniglet'] text-[12px]">
                        Entity ID
                      </th>
                      <th className="px-4 py-3 text-left font-['Sniglet'] text-[12px]">
                        Changes
                      </th>
                      <th className="px-4 py-3 text-left font-['Sniglet'] text-[12px]">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-t border-[#211f1c]/20 dark:border-white/20 hover:bg-[#e8f4f8] dark:hover:bg-[#2d2b28] transition-colors"
                      >
                        <td className="px-4 py-3 font-['Sniglet'] text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-['Sniglet'] text-sm">
                          {log.userEmail || "unknown"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-1 rounded-md border font-['Sniglet'] text-xs ${getActionColor(
                              log.action,
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-['Sniglet'] text-sm">
                          {log.entityType}
                        </td>
                        <td className="px-4 py-3 font-['Sniglet'] text-sm">
                          {log.entityId
                            ? `${log.entityId.slice(0, 20)}...`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 font-['Sniglet'] text-sm">
                          {log.changes.length} change
                          {log.changes.length !== 1 ? "s" : ""}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1 hover:bg-waste-reuse dark:hover:bg-[#2d2b28] rounded transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-[#211f1c]/20 dark:border-white/20 flex items-center justify-between">
                <p className="label-muted">
                  Showing {page * limit + 1} -{" "}
                  {Math.min((page + 1) * limit, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 bg-waste-reuse dark:bg-[#2d2b28] rounded-lg border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all font-['Sniglet'] text-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={(page + 1) * limit >= total}
                    className="px-4 py-2 bg-waste-reuse dark:bg-[#2d2b28] rounded-lg border border-[#211f1c] dark:border-white/20 hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all font-['Sniglet'] text-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <Modal
          onClose={() => setSelectedLog(null)}
          panelClassName="w-full max-w-3xl flex flex-col max-h-[85vh]"
        >
          {/* Sticky header */}
          <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#211f1c]/10 dark:border-white/10 shrink-0">
            <h2 className="font-['Tilt_Warp'] text-[22px]">
              Audit Log Details
            </h2>
            <button
              onClick={() => setSelectedLog(null)}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto px-6 py-5">
            <div className="space-y-5">
              {/* Metadata row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="label-muted mb-0.5">Timestamp</p>
                  <p className="font-['Sniglet'] text-[13px]">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="label-muted mb-0.5">Action</p>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md border font-['Sniglet'] text-[12px] ${getActionColor(selectedLog.action)}`}
                  >
                    {selectedLog.action}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="label-muted mb-0.5">User</p>
                  <p className="font-['Sniglet'] text-[13px]">
                    {selectedLog.userEmail}
                  </p>
                  <p className="font-['Sniglet'] text-[11px] text-black/40 dark:text-white/40 mt-0.5 break-all">
                    {selectedLog.userId}
                  </p>
                </div>
                <div>
                  <p className="label-muted mb-0.5">Entity</p>
                  <p className="font-['Sniglet'] text-[13px] capitalize">
                    {selectedLog.entityType}
                  </p>
                  <p className="font-['Sniglet'] text-[11px] text-black/40 dark:text-white/40 mt-0.5 break-all">
                    {selectedLog.entityId}
                  </p>
                </div>
              </div>

              {selectedLog.changes.length > 0 && (
                <div>
                  <p className="label-muted mb-1">Changes</p>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {selectedLog.changes.map((change, idx) => (
                      <li key={idx} className="font-['Sniglet'] text-[12px]">
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedLog.before && (
                <div>
                  <p className="label-muted mb-1">Before</p>
                  <pre className="bg-[#f0f0f0] dark:bg-[#1a1917] p-3 rounded-lg font-mono text-[11px] overflow-x-auto max-h-60 border border-[#211f1c]/10 dark:border-white/10">
                    {JSON.stringify(selectedLog.before, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.after && (
                <div>
                  <p className="label-muted mb-1">After</p>
                  <pre className="bg-[#f0f0f0] dark:bg-[#1a1917] p-3 rounded-lg font-mono text-[11px] overflow-x-auto max-h-60 border border-[#211f1c]/10 dark:border-white/10">
                    {JSON.stringify(selectedLog.after, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.ipAddress && (
                <div>
                  <p className="label-muted mb-0.5">IP Address</p>
                  <p className="font-['Sniglet'] text-[12px]">
                    {selectedLog.ipAddress}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
