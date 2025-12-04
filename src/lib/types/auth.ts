/**
 * Authentication Type Definitions
 */

import { UserRole } from "../constants/roles";

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: number;
  fullName: string;
  email: string;
  roleId: number;
  roleName: UserRole;
  roleHierarchy: number;
  teamId: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PERMISSION TYPES
// ============================================================================

export type PermissionScope = "own" | "team" | "all";

export type ResourceName =
  | "users"
  | "teams"
  | "schedules"
  | "entries"
  | "evaluations"
  | "reports";

export type ActionName =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "approve"
  | "reject";

export interface Permission {
  resource: ResourceName;
  action: ActionName;
  scope: PermissionScope;
  conditions?: Record<string, any>;
}

export interface UserWithPermissions extends User {
  permissions: Permission[];
}

// ============================================================================
// SESSION TYPES
// ============================================================================

export interface SessionUser {
  id: number;
  email: string;
  fullName: string;
  roleId: number;
  roleName: UserRole;
  roleHierarchy: number;
  teamId: number | null;
}

// ============================================================================
// AUTH CONTEXT TYPES
// ============================================================================

export interface AuthContextType {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Role checks
  isAdmin: () => boolean;
  isTeamLeader: () => boolean;
  isEmployee: () => boolean;

  // Permission checks
  can: (
    action: ActionName,
    resource: ResourceName,
    scope?: PermissionScope
  ) => boolean;
  canViewAll: (resource: ResourceName) => boolean;
  canViewTeam: (resource: ResourceName) => boolean;
  canViewOwn: (resource: ResourceName) => boolean;
}

// ============================================================================
// LOGIN TYPES
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: SessionUser;
  error?: string;
}
