/**
 * useAuth Hook
 *
 * Provides authentication state and helper functions
 * Wraps NextAuth's useSession with additional utilities
 */

"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { ROLES } from "../constants/roles";
import type { AuthContextType } from "../types/auth";

export function useAuth(): AuthContextType {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && !!session?.user;
  const user = session?.user || null;

  // Memoize role check functions
  const isAdmin = useMemo(() => () => user?.roleName === ROLES.ADMIN, [user]);

  const isTeamLeader = useMemo(
    () => () => user?.roleName === ROLES.TEAM_LEADER,
    [user]
  );

  const isEmployee = useMemo(
    () => () => user?.roleName === ROLES.EMPLOYEE,
    [user]
  );

  // These will be enhanced with actual permission checks from the database
  // For now, returning basic implementations
  const can = useMemo(
    () => (action: string, resource: string, scope?: string) => {
      if (!user) return false;

      // Admin can do everything
      if (user.roleName === ROLES.ADMIN) return true;

      // TODO: Implement actual permission checking from database
      // This will be done in usePermissions hook
      return false;
    },
    [user]
  );

  const canViewAll = useMemo(
    () => (resource: string) => {
      if (!user) return false;
      return user.roleName === ROLES.ADMIN;
    },
    [user]
  );

  const canViewTeam = useMemo(
    () => (resource: string) => {
      if (!user) return false;
      return (
        user.roleName === ROLES.ADMIN || user.roleName === ROLES.TEAM_LEADER
      );
    },
    [user]
  );

  const canViewOwn = useMemo(
    () => (resource: string) => {
      return isAuthenticated; // All authenticated users can view their own data
    },
    [isAuthenticated]
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    isTeamLeader,
    isEmployee,
    can,
    canViewAll,
    canViewTeam,
    canViewOwn,
  };
}
