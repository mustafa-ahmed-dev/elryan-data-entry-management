/**
 * Protected Route Component
 *
 * Wraps pages that require authentication
 * Redirects to login if not authenticated
 * Optionally checks for specific roles/permissions
 */

"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Spin } from "antd";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import type { UserRole } from "@/lib/constants/roles";
import type {
  ActionName,
  ResourceName,
  PermissionScope,
} from "@/lib/types/auth";

interface ProtectedRouteProps {
  children: ReactNode;

  // Role-based access
  allowedRoles?: UserRole[];

  // Permission-based access
  requiredPermission?: {
    action: ActionName;
    resource: ResourceName;
    scope?: PermissionScope;
  };

  // Redirect path if unauthorized
  redirectTo?: string;

  // Show loading state
  loadingComponent?: ReactNode;

  // Show unauthorized message
  unauthorizedComponent?: ReactNode;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requiredPermission,
  redirectTo = "/login",
  loadingComponent,
  unauthorizedComponent,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { can, isLoading: permissionsLoading } = usePermissions();

  const isLoading = authLoading || permissionsLoading;

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return;

    // Redirect if not authenticated
    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // Check role-based access
    if (allowedRoles && user) {
      const hasAllowedRole = allowedRoles.includes(user.roleName);
      if (!hasAllowedRole) {
        router.push("/unauthorized");
        return;
      }
    }

    // Check permission-based access
    if (requiredPermission && !isLoading) {
      const hasPermission = can(
        requiredPermission.action,
        requiredPermission.resource,
        requiredPermission.scope
      );

      if (!hasPermission) {
        router.push("/unauthorized");
        return;
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    user,
    allowedRoles,
    requiredPermission,
    can,
    router,
    redirectTo,
  ]);

  // Show loading state
  if (isLoading) {
    return (
      loadingComponent || (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
          }}
        >
          <Spin size="large" tip="Loading..." />
        </div>
      )
    );
  }

  // Show unauthorized if not authenticated
  if (!isAuthenticated) {
    return unauthorizedComponent || null;
  }

  // Check role-based access
  if (allowedRoles && user) {
    const hasAllowedRole = allowedRoles.includes(user.roleName);
    if (!hasAllowedRole) {
      return (
        unauthorizedComponent || (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "100vh",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <h2>Access Denied</h2>
            <p>You do not have permission to access this page.</p>
          </div>
        )
      );
    }
  }

  // Check permission-based access
  if (requiredPermission) {
    const hasPermission = can(
      requiredPermission.action,
      requiredPermission.resource,
      requiredPermission.scope
    );

    if (!hasPermission) {
      return (
        unauthorizedComponent || (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "100vh",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <h2>Access Denied</h2>
            <p>You do not have the required permissions to access this page.</p>
          </div>
        )
      );
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
}
