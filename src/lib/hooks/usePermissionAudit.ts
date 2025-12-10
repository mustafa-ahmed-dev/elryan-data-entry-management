/**
 * Permission Audit Hooks
 * Hooks for viewing and managing permission audit logs
 */

import useSWR from "swr";
import { useState } from "react";
import type { PermissionAuditLog, AuditLogFilters } from "@/lib/types/auth";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ============================================================================
// AUDIT LOG HOOKS
// ============================================================================

/**
 * Get permission audit logs
 */
export function usePermissionAudit(filters?: AuditLogFilters) {
  // Build query string from filters
  const queryParams = new URLSearchParams();
  if (filters?.userId) queryParams.append("userId", filters.userId.toString());
  if (filters?.roleId) queryParams.append("roleId", filters.roleId.toString());
  if (filters?.resourceType)
    queryParams.append("resourceType", filters.resourceType);
  if (filters?.startDate)
    queryParams.append("startDate", filters.startDate.toISOString());
  if (filters?.endDate)
    queryParams.append("endDate", filters.endDate.toISOString());
  if (filters?.limit) queryParams.append("limit", filters.limit.toString());

  const queryString = queryParams.toString();
  const url = `/api/permissions/audit${queryString ? `?${queryString}` : ""}`;

  const { data, error, mutate } = useSWR<{
    success: boolean;
    data: PermissionAuditLog[];
    count: number;
    filters: AuditLogFilters;
    timestamp: string;
    note?: string;
  }>(url, fetcher);

  return {
    logs: data?.data || [],
    count: data?.count || 0,
    filters: data?.filters,
    note: data?.note,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Export audit logs to CSV
 */
export function useExportAuditLog() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportLogs = async (logs: PermissionAuditLog[]) => {
    setIsExporting(true);
    setError(null);

    try {
      // Convert logs to CSV
      const headers = [
        "Timestamp",
        "User",
        "Email",
        "Action",
        "Resource Type",
        "Resource Action",
        "Role",
        "Target User",
        "Old Value",
        "New Value",
        "IP Address",
      ];

      const rows = logs.map((log) => [
        new Date(log.timestamp).toLocaleString(),
        log.userName,
        log.userEmail,
        log.action,
        log.resourceType,
        log.resourceAction,
        log.roleName || "",
        log.targetUserName || "",
        JSON.stringify(log.oldValue || ""),
        JSON.stringify(log.newValue || ""),
        log.ipAddress || "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `permission-audit-${new Date().toISOString()}.csv`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to export logs";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportLogs,
    isExporting,
    error,
  };
}

/**
 * Get recent audit activity (last 24 hours)
 */
export function useRecentAuditActivity() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - 24);

  return usePermissionAudit({
    startDate,
    endDate,
    limit: 50,
  });
}

/**
 * Get audit logs for a specific user
 */
export function useUserAuditLogs(userId: number | null) {
  return usePermissionAudit(
    userId
      ? {
          userId,
          limit: 100,
        }
      : undefined
  );
}

/**
 * Get audit logs for a specific role
 */
export function useRoleAuditLogs(roleId: number | null) {
  return usePermissionAudit(
    roleId
      ? {
          roleId,
          limit: 100,
        }
      : undefined
  );
}
