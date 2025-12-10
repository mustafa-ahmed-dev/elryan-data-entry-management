/**
 * Protected Route Component - Fixed for Direct Link Access
 *
 * Wraps pages that require authentication
 * Redirects to login if not authenticated
 * Optionally checks for specific roles/permissions
 */

"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Spin, Result, Button } from "antd";
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

  // Wait for BOTH auth and permissions to load
  const isLoading = authLoading || permissionsLoading;

  useEffect(() => {
    // CRITICAL: Don't do anything while still loading
    if (isLoading) return;

    // Redirect if not authenticated
    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  // Show loading state - this prevents the flash of unauthorized
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
          <Spin size="large" />
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
            }}
          >
            <Result
              status="403"
              title="Access Denied"
              subTitle="You do not have permission to access this page."
              extra={
                <Button
                  type="primary"
                  onClick={() => router.push("/dashboard")}
                >
                  Go to Dashboard
                </Button>
              }
            />
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
            }}
          >
            <Result
              status="403"
              title="Access Denied"
              subTitle="You do not have the required permissions to access this page."
              extra={
                <Button
                  type="primary"
                  onClick={() => router.push("/dashboard")}
                >
                  Go to Dashboard
                </Button>
              }
            />
          </div>
        )
      );
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
}
