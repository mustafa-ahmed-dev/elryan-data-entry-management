"use client";

import { ReactNode } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import type { UserRole } from "@/lib/constants/roles";
import type {
  ActionName,
  ResourceName,
  PermissionScope,
} from "@/lib/types/auth";

interface PermissionGateProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  permission?: {
    action: ActionName;
    resource: ResourceName;
    scope?: PermissionScope;
  };
  fallback?: ReactNode;
  customCheck?: () => boolean;
}

export function PermissionGate({
  children,
  allowedRoles,
  permission,
  fallback = null,
  customCheck,
}: PermissionGateProps) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { can, isLoading: permissionsLoading } = usePermissions();

  const isLoading = authLoading || permissionsLoading;

  if (isLoading || !isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  if (customCheck && !customCheck()) {
    return <>{fallback}</>;
  }

  if (allowedRoles && !allowedRoles.includes(user.roleName)) {
    return <>{fallback}</>;
  }

  if (permission) {
    const hasPermission = can(
      permission.action,
      permission.resource,
      permission.scope
    );
    if (!hasPermission) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

export function RoleGate({
  children,
  roles,
  fallback,
}: {
  children: ReactNode;
  roles: UserRole[];
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate allowedRoles={roles} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function AdminOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate allowedRoles={["admin"]} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function TeamLeaderOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGate allowedRoles={["admin", "team_leader"]} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}
