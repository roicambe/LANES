"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getZones, deactivateZone, deactivateZonesBulk, AvoidanceZone } from "./adminApi";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { TableActionGroup, TableActionButton, Pagination, DataTable, Column } from "@/shared/ui";
import { 
  Loader2, 
  Map, 
  Trash2, 
  Activity, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Info
} from "lucide-react";

const LIMIT = 10;

export default function ActiveZonesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [activeOnly, setActiveOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Single deactivation modal state
  const [confirmId, setConfirmId] = useState<number | null>(null);
  // Bulk deactivation modal state
  const [confirmBulk, setConfirmBulk] = useState(false);

  const { data, isLoading, refetch, isPlaceholderData } = useQuery({
    queryKey: ["adminZones", page, activeOnly],
    queryFn: () => getZones(page, LIMIT, activeOnly),
    placeholderData: (prev) => prev,
    refetchInterval: 15000, // 15s background polling fallback
  });

  const deactivateSingleMutation = useMutation({
    mutationFn: (id: number) => deactivateZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminZones"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
      setConfirmId(null);
    },
  });

  const deactivateBulkMutation = useMutation({
    mutationFn: (ids: number[]) => deactivateZonesBulk(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminZones"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
      setSelectedIds([]);
      setConfirmBulk(false);
    },
  });

  const zones = data?.zones || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const activeIdsInPage = zones
        .filter((z) => z.is_active)
        .map((z) => z.id);
      setSelectedIds(activeIdsInPage);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const getPolygonCenter = (coords: [number, number][][]): string => {
    if (!coords || coords.length === 0 || coords[0].length === 0) return "N/A";
    const rings = coords[0];
    let sumLng = 0;
    let sumLat = 0;
    const len = rings.length - 1 || 1;
    for (let i = 0; i < len; i++) {
      sumLng += rings[i][0];
      sumLat += rings[i][1];
    }
    return `${(sumLat / len).toFixed(5)}, ${(sumLng / len).toFixed(5)}`;
  };

  const zoneColumns: Column<AvoidanceZone>[] = [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          onChange={handleSelectAll}
          checked={
            zones.length > 0 &&
            zones.some((z) => z.is_active) &&
            zones.filter((z) => z.is_active).every((z) => selectedIds.includes(z.id))
          }
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
        />
      ),
      sortable: false,
      render: (zone) => (
        <input
          type="checkbox"
          checked={zone.is_active ? selectedIds.includes(zone.id) : false}
          onChange={(e) => zone.is_active && handleSelectRow(zone.id, e.target.checked)}
          disabled={!zone.is_active}
          className={
            zone.is_active 
              ? "rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              : "rounded border-gray-200 bg-gray-100 w-4 h-4 cursor-not-allowed opacity-50"
          }
        />
      )
    },
    {
      key: 'id',
      title: 'Zone ID',
      sortable: true,
      render: (zone) => <span className="font-mono text-xs font-semibold">#{zone.id}</span>
    },
    {
      key: 'report_id',
      title: 'Report ID',
      sortable: true,
      render: (zone) => <span className="font-semibold text-gray-700">Report #{zone.report_id}</span>
    },
    {
      key: 'center',
      title: 'Detour Center',
      sortable: false,
      render: (zone) => <span className="font-medium text-gray-600 text-xs">{getPolygonCenter(zone.geometry.coordinates)}</span>
    },
    {
      key: 'created_at',
      title: 'Created At',
      sortable: true,
      render: (zone) => <span className="text-xs">{new Date(zone.created_at).toLocaleString()}</span>
    },
    {
      key: 'expires_at',
      title: 'Expires At',
      sortable: true,
      render: (zone) => <span className="text-xs text-gray-500">{zone.expires_at ? new Date(zone.expires_at).toLocaleString() : "Never (Infinite)"}</span>
    },
    {
      key: 'is_active',
      title: 'Status',
      sortable: true,
      render: (zone) => (
        zone.is_active ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            Active Detour
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
            Deactivated
          </span>
        )
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      sortable: false,
      render: (zone) => (
        <div className="flex justify-end">
          {zone.is_active ? (
            <TableActionGroup>
              <TableActionButton
                actionVariant="disable"
                onClick={() => setConfirmId(zone.id)}
              >
                Deactivate
              </TableActionButton>
            </TableActionGroup>
          ) : (
            <span className="text-xs text-gray-400 select-none">Archived</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-gray-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Active Detours & Zones</h1>
          <p className="text-gray-500 text-sm mt-1">
            Audit bypass routing boundaries and deactivate detour zones.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <label className="flex items-center gap-2 cursor-pointer font-medium text-sm text-gray-700">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => {
              setActiveOnly(e.target.checked);
              setPage(1);
              setSelectedIds([]);
            }}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
          />
          Show Active Detours Only
        </label>

        <div className="text-xs font-semibold text-gray-400">
          Total detours: <span className="text-gray-900">{total}</span>
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-xl shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <p className="text-sm text-gray-500">Loading detours...</p>
        </div>
      ) : zones.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
          <Map className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No detour zones found</h3>
          <p className="text-gray-500 mt-1 max-w-sm mx-auto text-sm">
            Active detours are automatically generated when flood reports are approved.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm relative">
          <div className={`transition-opacity duration-150 ${isPlaceholderData ? "opacity-60" : "opacity-100"}`}>
            <DataTable
              columns={zoneColumns}
              data={zones}
              keyExtractor={(zone) => zone.id}
              pagination={{ page, totalPages, onPageChange: setPage }}
            />
          </div>

          {/* Bulk Action Float Bar */}
          {selectedIds.length > 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white py-3 px-6 rounded-2xl flex items-center gap-6 shadow-xl border border-slate-800 backdrop-blur-sm z-30 animate-fade-in pointer-events-auto">
              <span className="text-xs md:text-sm font-semibold">
                Selected <span className="text-blue-400 font-extrabold">{selectedIds.length}</span> zones
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={() => setConfirmBulk(true)}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-1.5 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Deactivate Selected
                </Button>
                <Button
                  onClick={() => setSelectedIds([])}
                  variant="outline"
                  className="text-slate-300 border-slate-700 hover:bg-slate-800 text-xs font-semibold px-3 py-1.5"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modals */}
      <Modal
        isOpen={confirmId !== null}
        onClose={() => setConfirmId(null)}
        title="Confirm Deactivation"
      >
        <div className="space-y-4 text-sm text-gray-600">
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-800">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              Deactivating this detour zone will remove the routing block. All route calculations will pass through this coordinate area.
            </p>
          </div>
          <p>Are you sure you want to deactivate detour zone <strong>#{confirmId}</strong>?</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmId(null)}
              className="text-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={() => confirmId && deactivateSingleMutation.mutate(confirmId)}
              disabled={deactivateSingleMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deactivateSingleMutation.isPending ? "Deactivating..." : "Deactivate Zone"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={confirmBulk}
        onClose={() => setConfirmBulk(false)}
        title="Confirm Bulk Deactivation"
      >
        <div className="space-y-4 text-sm text-gray-600">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100 text-red-800">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 animate-pulse" />
            <p>
              Warning: You are about to deactivate <strong>{selectedIds.length}</strong> detour zones concurrently. Safe detours bypassing these coordinates will no longer be applied.
            </p>
          </div>
          <p>Are you sure you want to proceed with bulk deactivating these zones?</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmBulk(false)}
              className="text-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deactivateBulkMutation.mutate(selectedIds)}
              disabled={deactivateBulkMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deactivateBulkMutation.isPending ? "Deactivating..." : "Deactivate All Selected"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
