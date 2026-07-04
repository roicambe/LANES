"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuditLogs, AuditLogRecord } from "./adminApi";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { Select } from "@/shared/ui";
import {
  Loader2,
  FileCode,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  RefreshCw,
  Eye,
  Calendar,
  Globe,
  Activity,
  Download
} from "lucide-react";

const LIMIT = 10;

const ACTION_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  LOGIN_SUCCESS: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "Login Success" },
  LOGIN_FAILURE: { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", label: "Login Failure" },
  LOGOUT: { bg: "bg-slate-50 border-slate-200", text: "text-slate-700", label: "Logout" },
  APPROVE_REPORT: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", label: "Approve Report" },
  REJECT_REPORT: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", label: "Reject Report" },
  DEACTIVATE_ZONE: { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", label: "Deactivate Zone" },
  DEACTIVATE_ZONES_BULK: { bg: "bg-violet-50 border-violet-200", text: "text-violet-700", label: "Bulk Deactivate" },
  UPDATE_USER_STATUS: { bg: "bg-sky-50 border-sky-200", text: "text-sky-700", label: "Update User" },
  DELETE_USER: { bg: "bg-red-50 border-red-200", text: "text-red-700", label: "Delete User" },
};

export default function AuditTrailPage() {
  const [page, setPage] = useState(1);
  const [actionType, setActionType] = useState("all");
  const [inspectLog, setInspectLog] = useState<AuditLogRecord | null>(null);

  const { data, isLoading, refetch, isPlaceholderData } = useQuery({
    queryKey: ["adminAuditLogs", page, actionType],
    queryFn: () => getAuditLogs(page, LIMIT, actionType === "all" ? undefined : actionType),
    placeholderData: (prev) => prev,
    refetchInterval: 30000, // Auto-refresh logs every 30 seconds (AJAX Polling)
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActionType(e.target.value);
    setPage(1);
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Timestamp", "Operator", "Email", "Action Type", "Target Table", "Target ID", "IP Address", "Metadata"];
    const rows = logs.map((log) => [
      new Date(log.created_at).toISOString(),
      log.admin ? log.admin.username : "System",
      log.admin ? log.admin.email : "",
      log.action_type,
      log.target_table || "",
      log.target_id || "",
      log.ip_address || "",
      JSON.stringify(log.metadata_json || {})
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `lanes_audit_log_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-gray-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Audit Trail</h1>
          <p className="text-gray-500 text-sm mt-1">
            Access logs, moderation reviews, and configuration edits logged chronologically.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </Button>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Logs
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Activity className="w-5 h-5 text-gray-400 shrink-0" />
          <span className="text-sm font-semibold text-gray-700">Filter Activity:</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Select
            value={actionType}
            onChange={handleActionChange}
            className="w-full sm:w-56 font-medium"
            options={[
              { label: "All Actions", value: "all" },
              { label: "Login Success", value: "LOGIN_SUCCESS" },
              { label: "Login Failure", value: "LOGIN_FAILURE" },
              { label: "Approve Report", value: "APPROVE_REPORT" },
              { label: "Reject Report", value: "REJECT_REPORT" },
              { label: "Deactivate Zone", value: "DEACTIVATE_ZONE" },
              { label: "Bulk Deactivate", value: "DEACTIVATE_ZONES_BULK" },
              { label: "Update User Status", value: "UPDATE_USER_STATUS" },
              { label: "Delete User", value: "DELETE_USER" }
            ]}
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-500 font-medium">Fetching audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
            <div className="p-3 bg-gray-50 rounded-full">
              <Shield className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-gray-800 font-bold">No Audit Records Found</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              We couldn't find any system audit trail events matching your current filter settings.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Operator</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Target</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {logs.map((log) => {
                  const badge = ACTION_BADGES[log.action_type] || {
                    bg: "bg-gray-50 border-gray-200",
                    text: "text-gray-700",
                    label: log.action_type,
                  };
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Timestamp */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                      </td>

                      {/* Operator username */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.admin ? (
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{log.admin.username}</p>
                            <p className="text-xs text-gray-500 font-medium">{log.admin.email}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">System / Anonymous</span>
                        )}
                      </td>

                      {/* Action Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Target resource */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.target_id ? (
                          <div className="text-sm">
                            <span className="font-semibold text-gray-700">{log.target_table}</span>
                            <span className="text-gray-400 ml-1">#{log.target_id}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 font-medium">-</span>
                        )}
                      </td>

                      {/* IP address */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.ip_address ? (
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                            <Globe className="w-3.5 h-3.5 text-gray-400" />
                            {log.ip_address}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 font-medium">-</span>
                        )}
                      </td>

                      {/* Details inspect button */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Button
                          onClick={() => setInspectLog(log)}
                          variant="outline"
                          size="sm"
                          className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {!isLoading && totalPages > 1 && (
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Showing {(page - 1) * LIMIT + 1} - {Math.min(page * LIMIT, total)} of {total} events
            </span>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                variant="outline"
                className="p-1 px-2 flex items-center gap-1 text-xs hover:bg-gray-100"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </Button>
              <Button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages || isPlaceholderData}
                variant="outline"
                className="p-1 px-2 flex items-center gap-1 text-xs hover:bg-gray-100"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Inspection Modal */}
      <Modal
        isOpen={inspectLog !== null}
        onClose={() => setInspectLog(null)}
        title="Audit Event Inspector"
      >
        {inspectLog && (
          <div className="space-y-4 text-gray-900">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Timestamp</p>
                <p className="font-semibold text-gray-800 mt-0.5">
                  {new Date(inspectLog.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Action Type</p>
                <p className="font-semibold text-gray-800 mt-0.5">{inspectLog.action_type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Operator</p>
                <p className="font-semibold text-gray-800 mt-0.5">
                  {inspectLog.admin ? inspectLog.admin.username : "System / Scraper"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Origin IP</p>
                <p className="font-semibold text-gray-800 mt-0.5">
                  {inspectLog.ip_address || "Unavailable"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-gray-400" />
                Metadata Payload (JSONB)
              </p>
              <pre className="bg-neutral-900 text-neutral-100 p-4 rounded-xl text-xs overflow-x-auto border border-neutral-800 font-mono shadow-inner leading-relaxed">
                {JSON.stringify(inspectLog.metadata_json, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setInspectLog(null)} className="px-5 text-sm">
                Close Inspector
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
