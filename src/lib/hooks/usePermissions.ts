/**
 * usePermissions Hook
 *
 * Provides permission checking with database-driven RBAC
 * Fetches and caches user permissions
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import type { ActionName, ResourceName, PermissionScope } from "../types/auth";

interface Permission {
  resource: string;
  action: string;
  scope: string;
}

interface UsePermissionsReturn {
  permissions: Permission[];
  isLoading: boolean;
  can: (
    action: ActionName,
    resource: ResourceName,
    scope?: PermissionScope
  ) => boolean;
  canViewAll: (resource: ResourceName) => boolean;
  canViewTeam: (resource: ResourceName) => boolean;
  canViewOwn: (resource: ResourceName) => boolean;
  refetch: () => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user permissions from API
  const fetchPermissions = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/permissions");

      if (!response.ok) {
        throw new Error("Failed to fetch permissions");
      }

      const data = await response.json();
      setPermissions(data.permissions || []);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Fetch permissions on mount and when user changes
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Check if user has a specific permission
  const can = useCallback(
    (
      action: ActionName,
      resource: ResourceName,
      targetScope?: PermissionScope
    ): boolean => {
      if (!isAuthenticated) return false;

      // Find matching permission
      const permission = permissions.find(
        (p) => p.resource === resource && p.action === action
      );

      if (!permission) return false;

      // If no specific scope required, permission exists
      if (!targetScope) return true;

      // Check scope hierarchy: 'all' > 'team' > 'own'
      const scopeHierarchy: Record<string, number> = {
        own: 1,
        team: 2,
        all: 3,
      };

      const userScopeLevel = scopeHierarchy[permission.scope] || 0;
      const requiredScopeLevel = scopeHierarchy[targetScope] || 0;

      return userScopeLevel >= requiredScopeLevel;
    },
    [isAuthenticated, permissions]
  );

  // Check if user can view all records of a resource
  const canViewAll = useCallback(
    (resource: ResourceName): boolean => {
      return can("read", resource, "all");
    },
    [can]
  );

  // Check if user can view team records of a resource
  const canViewTeam = useCallback(
    (resource: ResourceName): boolean => {
      return can("read", resource, "team") || can("read", resource, "all");
    },
    [can]
  );

  // Check if user can view their own records of a resource
  const canViewOwn = useCallback(
    (resource: ResourceName): boolean => {
      return (
        can("read", resource, "own") ||
        can("read", resource, "team") ||
        can("read", resource, "all")
      );
    },
    [can]
  );

  return {
    permissions,
    isLoading,
    can,
    canViewAll,
    canViewTeam,
    canViewOwn,
    refetch: fetchPermissions,
  };
}
