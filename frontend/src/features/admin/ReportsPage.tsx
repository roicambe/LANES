"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getReports, 
  approveReport, 
  rejectReport, 
  FloodReport,
  ReportGeometry
} from "./adminApi";
import { Button } from "@/shared/ui/Button";
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  AlertOctagon,
  RefreshCw
} from "lucide-react";

const LIMIT = 8;

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const [severity, setSeverity] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  /**
   * Returns a human-readable coordinate label for a report geometry.
   * Points show the exact lat/lng; LineStrings show the midpoint prefixed with "~".
   */
  const getGeometryLabel = (geometry: ReportGeometry): string => {
    if (geometry.type === "Point") {
      const [lng, lat] = geometry.coordinates;
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
    // LineString — use the midpoint coordinate as a representative location
    const mid = geometry.coordinates[Math.floor(geometry.coordinates.length / 2)];
    return `~${mid[1].toFixed(5)}, ${mid[0].toFixed(5)}`;
  };

  const { data, isLoading, isPlaceholderData, refetch } = useQuery({
    queryKey: ["adminReports", page, status, severity, search, sortBy],
    queryFn: () => getReports({ page, limit: LIMIT, status, severity, search, sortBy }),
    placeholderData: (prev) => prev,
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => approveReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => rejectReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
    },
  });

  const handleTabChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleSeverityChange = (newSeverity: string) => {
    setSeverity(newSeverity);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setPage(1);
  };

  const reports = data?.reports || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "low":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
            Passable (Low)
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
            Moderate (Medium)
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
            Hazardous (High)
          </span>
        );
      case "extreme":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200 animate-pulse">
            Impassable (Extreme)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
            Unknown
          </span>
        );
    }
  };

  const getStatusBadge = (stat: string) => {
    switch (stat) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Flood Reports Moderation</h1>
          <p className="text-gray-500 text-sm mt-1">
            Moderate, filter, and search all ingested Taglish news feeds and citizen flood alerts.
          </p>
        </div>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Feed
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {["all", "pending", "approved", "rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                status === tab
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab} Reports
            </button>
          ))}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search report feeds..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex w-full sm:w-auto items-center gap-3 justify-end">
          {/* Severity Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 hidden md:block" />
            <select
              value={severity}
              onChange={(e) => handleSeverityChange(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all" className="text-gray-900 bg-white">All Severities</option>
              <option value="low" className="text-gray-900 bg-white">Passable (Low)</option>
              <option value="medium" className="text-gray-900 bg-white">Moderate (Medium)</option>
              <option value="high" className="text-gray-900 bg-white">Hazardous (High)</option>
              <option value="extreme" className="text-gray-900 bg-white">Impassable (Extreme)</option>
            </select>
          </div>

          {/* Sort Toggles */}
          <div className="border-l border-gray-200 pl-3 flex gap-1">
            <button
              onClick={() => handleSortChange("newest")}
              className={`p-2 rounded-lg transition-colors ${
                sortBy === "newest"
                  ? "bg-gray-100 text-gray-800"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
              title="Sort Newest First"
            >
              <TrendingDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSortChange("oldest")}
              className={`p-2 rounded-lg transition-colors ${
                sortBy === "oldest"
                  ? "bg-gray-100 text-gray-800"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
              title="Sort Oldest First"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-xl shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <p className="text-sm text-gray-500">Loading reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
          <AlertOctagon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No reports found</h3>
          <p className="text-gray-500 mt-1 max-w-sm mx-auto text-sm">
            Try adjusting your search query, status tabs, or severity filter levels.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report: FloodReport) => (
            <div 
              key={report.id} 
              className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row transition-opacity duration-150 ${
                isPlaceholderData ? "opacity-60" : "opacity-100"
              }`}
            >
              <div className="p-6 flex-1 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 uppercase tracking-wider">
                        {report.source}
                      </span>
                      {getStatusBadge(report.status)}
                    </div>
                    <span className="text-xs text-gray-400 font-medium">
                      {new Date(report.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-gray-900 font-medium text-sm leading-relaxed">
                    "{report.raw_text}"
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  {getSeverityBadge(report.severity)}
                  {report.geometry ? (
                    <div className="flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      {getGeometryLabel(report.geometry)}
                    </div>
                  ) : (
                    <div className="flex items-center text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
                      No coordinates mapped
                    </div>
                  )}
                </div>
              </div>

              {/* Moderate Actions Pane */}
              {report.status === "pending" && (
                <div className="bg-gray-50/50 border-t md:border-t-0 md:border-l border-gray-200 p-6 flex flex-row md:flex-col items-center justify-center gap-3 md:w-48">
                  <Button 
                    onClick={() => approveMutation.mutate(report.id)}
                    disabled={approveMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold py-2"
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Approve
                  </Button>
                  <Button 
                    onClick={() => rejectMutation.mutate(report.id)}
                    disabled={rejectMutation.isPending}
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 text-sm font-semibold py-2"
                  >
                    {rejectMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              variant="outline"
              className="text-xs"
            >
              Previous
            </Button>
            <Button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              variant="outline"
              className="text-xs"
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-600">
                Showing <span className="font-semibold">{Math.min(total, (page - 1) * LIMIT + 1)}</span> to{" "}
                <span className="font-semibold">{Math.min(total, page * LIMIT)}</span> of{" "}
                <span className="font-semibold">{total}</span> reports
              </p>
            </div>
            <div>
              <nav className="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 ${
                      page === p
                        ? "z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
