"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, updateUserStatus, deleteUser, UserRecord } from "./adminApi";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui";
import {
  Loader2,
  Users,
  Search,
  Trash2,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Shield,
  RefreshCw,
  Info,
  AlertTriangle
} from "lucide-react";

const LIMIT = 10;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  
  // Status toggle modals
  const [statusUser, setStatusUser] = useState<UserRecord | null>(null);
  // Delete modals
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, isLoading, refetch, isPlaceholderData } = useQuery({
    queryKey: ["adminUsers", page, search, role],
    queryFn: () => getUsers(page, LIMIT, search, role),
    placeholderData: (prev) => prev,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => 
      updateUserStatus(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
      setStatusUser(null);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || "Failed to update user status");
    }
  });

  const removeUserMutation = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
      setDeleteId(null);
      setErrorMessage(null);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || "Failed to delete user account");
    }
  });

  const users = data?.users || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value);
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-gray-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Registry</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage user accounts, roles, access statuses, and permissions.
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200 text-red-800 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold">Operation Refused</h5>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
          <button 
            onClick={() => setErrorMessage(null)} 
            className="ml-auto font-bold hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-1 gap-3 w-full sm:w-auto">
          <Input
            containerClassName="flex-1 max-w-sm"
            leftIcon={<Search className="w-4 h-4 text-gray-400" />}
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={handleSearchChange}
            className="text-gray-900 bg-white"
          />

          <Select
            value={role}
            onChange={handleRoleChange}
            className="w-40 font-medium"
            options={[
              { label: "All Roles", value: "all" },
              { label: "Administrators", value: "admin" },
              { label: "Commuters", value: "commuter" }
            ]}
          />
        </div>

        <div className="text-xs font-semibold text-gray-400">
          Matched accounts: <span className="text-gray-900">{total}</span>
        </div>
      </div>

      {/* User Records Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-xl shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <p className="text-sm text-gray-500">Loading user accounts...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No accounts matched</h3>
          <p className="text-gray-500 mt-1 max-w-sm mx-auto text-sm">
            Try adjusting your search filters or check your spelling.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">User ID</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Created At</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-gray-200 transition-opacity duration-150 ${isPlaceholderData ? "opacity-60" : "opacity-100"}`}>
                {users.map((user: UserRecord) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold">
                      #{user.id}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      {user.role?.name !== "Commuter" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          <Shield className="w-3 h-3" />
                          {user.role?.name || "Admin"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Commuter
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {new Date(user.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setStatusUser(user)}
                        className={`text-xs px-2.5 py-1 flex items-center gap-1 font-semibold ${
                          user.is_active 
                            ? "text-amber-600 border-amber-100 hover:bg-amber-50" 
                            : "text-emerald-600 border-emerald-100 hover:bg-emerald-50"
                        }`}
                      >
                        {user.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        {user.is_active ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setDeleteId(user.id)}
                        className="text-xs text-red-600 border-red-100 hover:bg-red-50 hover:border-red-300 px-2.5 py-1 font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                <span className="font-semibold">{total}</span> user accounts
              </p>
            </div>
            <div>
              <nav className="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
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
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <Modal
        isOpen={statusUser !== null}
        onClose={() => setStatusUser(null)}
        title="Toggle User Status"
      >
        <div className="space-y-4 text-sm text-gray-600">
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-800">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              {statusUser?.is_active 
                ? "Disabling this user will prevent them from logging in, accessing private navigation layers, or reporting flood hazards."
                : "Enabling this user will restore their full privileges to access their profile and submit hazards."}
            </p>
          </div>
          <p>
            Are you sure you want to {statusUser?.is_active ? "disable" : "enable"} user{" "}
            <strong>{statusUser?.username}</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setStatusUser(null)}
              className="text-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (statusUser) {
                  toggleStatusMutation.mutate({ 
                    id: statusUser.id, 
                    is_active: !statusUser.is_active 
                  });
                }
              }}
              disabled={toggleStatusMutation.isPending}
              className={`text-white ${
                statusUser?.is_active ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {toggleStatusMutation.isPending ? "Updating..." : statusUser?.is_active ? "Disable Account" : "Enable Account"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Delete User Account"
      >
        <div className="space-y-4 text-sm text-gray-600">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100 text-red-800">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 animate-pulse" />
            <p>
              Warning: Deleting this user is permanent. All profile details and access authorization records will be completely removed from the database.
            </p>
          </div>
          <p>Are you sure you want to permanently delete user <strong>#{deleteId}</strong>?</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              className="text-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteId && removeUserMutation.mutate(deleteId)}
              disabled={removeUserMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {removeUserMutation.isPending ? "Deleting..." : "Permanently Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
