/**
 * Permissions Hooks
 * Enhanced with matrix and role-specific permission management
 */

import useSWR from "swr";
import { useState } from "react";
import type {
  PermissionMatrix,
  BulkPermissionUpdate,
  PermissionStatistics,
} from "@/lib/types/auth";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ============================================================================
// EXISTING HOOK (Current User Permissions)
// ============================================================================

/**
 * Get current user's permissions
 */
export function usePermissions() {
  const { data, error, mutate } = useSWR("/api/permissions", fetcher);

  return {
    permissions: data?.permissions || [],
    role: data?.role,
    teamId: data?.teamId,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

// ============================================================================
// NEW HOOKS FOR SECURITY SETTINGS PAGE
// ============================================================================

/**
 * Get full permission matrix
 */
export function usePermissionMatrix() {
  const { data, error, mutate } = useSWR<{
    success: boolean;
    data: PermissionMatrix;
    timestamp: string;
  }>("/api/permissions/matrix", fetcher);

  return {
    matrix: data?.data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Update multiple permissions at once
 */
export function useUpdatePermissions() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePermissions = async (update: BulkPermissionUpdate) => {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch("/api/permissions/matrix", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(update),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update permissions");
      }

      return {
        success: true,
        updated: result.updated,
        errors: result.errors,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updatePermissions,
    isUpdating,
    error,
  };
}

/**
 * Get permissions for a specific role
 */
export function useRolePermissions(roleId: number | null) {
  const { data, error, mutate } = useSWR(
    roleId ? `/api/permissions/role/${roleId}` : null,
    fetcher
  );

  return {
    permissions: data?.data || [],
    count: data?.count || 0,
    isLoading: !error && !data && roleId !== null,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Update permissions for a specific role
 */
export function useUpdateRolePermissions() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateRolePermissions = async (
    roleId: number,
    updates: BulkPermissionUpdate["updates"]
  ) => {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/permissions/role/${roleId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update role permissions");
      }

      return {
        success: true,
        updated: result.updated,
        errors: result.errors,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateRolePermissions,
    isUpdating,
    error,
  };
}

/**
 * Get permission statistics
 */
export function usePermissionStatistics() {
  const { data, error, mutate } = useSWR<{
    success: boolean;
    data: PermissionStatistics & {
      roles: Array<{
        id: number;
        name: string;
        displayName: string;
        permissionCount: number;
      }>;
    };
    timestamp: string;
  }>("/api/permissions/statistics", fetcher);

  return {
    statistics: data?.data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Check if user has specific permission
 */
export function useHasPermission(resource: string, action: string) {
  const { permissions, isLoading } = usePermissions();

  const hasPermission = permissions.some(
    (p: any) => p.resource === resource && p.action === action
  );

  return {
    hasPermission,
    isLoading,
  };
}

/**
 * Check multiple permissions at once
 */
export function useHasPermissions(
  checks: Array<{ resource: string; action: string }>
) {
  const { permissions, isLoading } = usePermissions();

  const results: Record<string, boolean> = {};

  checks.forEach((check) => {
    const key = `${check.resource}:${check.action}`;
    results[key] = permissions.some(
      (p: any) => p.resource === check.resource && p.action === check.action
    );
  });

  return {
    permissions: results,
    isLoading,
  };
}
