/**
 * Permission Database Utilities
 * Functions to query and check permissions from the database
 */

import { db } from "../index";
import { permissions, roles, resources, actions, users } from "../schema";
import { eq, and } from "drizzle-orm";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Permission {
  id: number;
  roleId: number;
  resourceId: number;
  actionId: number;
  scope: string;
  conditions?: any;
  isActive: boolean;
}

export interface UserPermissions {
  userId: number;
  roleId: number;
  roleName: string;
  roleHierarchy: number;
  teamId: number | null;
  permissions: Array<{
    resource: string;
    action: string;
    scope: string;
    conditions?: any;
  }>;
}

// ============================================================================
// CORE PERMISSION QUERIES
// ============================================================================

/**
 * Get all permissions for a specific role
 */
export async function getPermissionsByRole(roleId: number) {
  const result = await db
    .select({
      id: permissions.id,
      roleId: permissions.roleId,
      resource: resources.name,
      action: actions.name,
      scope: permissions.scope,
      conditions: permissions.conditions,
      isActive: permissions.isActive,
    })
    .from(permissions)
    .innerJoin(resources, eq(permissions.resourceId, resources.id))
    .innerJoin(actions, eq(permissions.actionId, actions.id))
    .where(and(eq(permissions.roleId, roleId), eq(permissions.isActive, true)));

  return result;
}

/**
 * Get all permissions for a user (includes role data)
 */
export async function getUserPermissions(
  userId: number
): Promise<UserPermissions | null> {
  // Get user with role information
  const [user] = await db
    .select({
      userId: users.id,
      roleId: users.roleId,
      teamId: users.teamId,
      roleName: roles.name,
      roleHierarchy: roles.hierarchy,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(and(eq(users.id, userId), eq(users.isActive, true)))
    .limit(1);

  if (!user) {
    return null;
  }

  // Get all permissions for this role
  const perms = await getPermissionsByRole(user.roleId);

  return {
    userId: user.userId,
    roleId: user.roleId,
    roleName: user.roleName,
    roleHierarchy: user.roleHierarchy,
    teamId: user.teamId,
    permissions: perms.map((p) => ({
      resource: p.resource,
      action: p.action,
      scope: p.scope,
      conditions: p.conditions,
    })),
  };
}

/**
 * Check if a user has a specific permission
 */
export async function checkPermission(
  userId: number,
  resourceName: string,
  actionName: string,
  targetScope?: "own" | "team" | "all"
): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);

  if (!userPerms) {
    return false;
  }

  // Find matching permission
  const permission = userPerms.permissions.find(
    (p) => p.resource === resourceName && p.action === actionName
  );

  if (!permission) {
    return false;
  }

  // If no specific scope required, permission exists
  if (!targetScope) {
    return true;
  }

  // Check scope hierarchy: 'all' > 'team' > 'own'
  const scopeHierarchy: Record<string, number> = {
    own: 1,
    team: 2,
    all: 3,
  };

  const userScopeLevel = scopeHierarchy[permission.scope] || 0;
  const requiredScopeLevel = scopeHierarchy[targetScope] || 0;

  return userScopeLevel >= requiredScopeLevel;
}

/**
 * Check if user can perform action on a specific resource instance
 * Includes context-aware checks (own data, team data, etc.)
 */
export async function checkResourceAccess(
  userId: number,
  resourceName: string,
  actionName: string,
  context?: {
    ownerId?: number; // Who owns this resource
    teamId?: number; // Which team this resource belongs to
  }
): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);

  if (!userPerms) {
    return false;
  }

  // Find matching permission
  const permission = userPerms.permissions.find(
    (p) => p.resource === resourceName && p.action === actionName
  );

  if (!permission) {
    return false;
  }

  // Check scope-based access
  switch (permission.scope) {
    case "all":
      return true;

    case "team":
      // User must be in the same team as the resource
      if (!context?.teamId || !userPerms.teamId) {
        return false;
      }
      return userPerms.teamId === context.teamId;

    case "own":
      // User must be the owner of the resource
      if (!context?.ownerId) {
        return false;
      }
      return userPerms.userId === context.ownerId;

    default:
      return false;
  }
}

/**
 * Get all resources a user can access with a specific action
 */
export async function getUserAccessibleResources(
  userId: number,
  actionName: string
): Promise<string[]> {
  const userPerms = await getUserPermissions(userId);

  if (!userPerms) {
    return [];
  }

  return userPerms.permissions
    .filter((p) => p.action === actionName)
    .map((p) => p.resource);
}

// ============================================================================
// ROLE HIERARCHY CHECKS
// ============================================================================

/**
 * Check if user's role is higher or equal to another role
 */
export async function hasRoleHierarchy(
  userId: number,
  requiredHierarchy: number
): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);

  if (!userPerms) {
    return false;
  }

  return userPerms.roleHierarchy >= requiredHierarchy;
}

/**
 * Check if user is an admin
 */
export async function isAdmin(userId: number): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);
  return userPerms?.roleName === "admin";
}

/**
 * Check if user is a team leader
 */
export async function isTeamLeader(userId: number): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);
  return userPerms?.roleName === "team_leader";
}

/**
 * Check if user is an employee
 */
export async function isEmployee(userId: number): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);
  return userPerms?.roleName === "employee";
}

// ============================================================================
// BATCH PERMISSION CHECKS
// ============================================================================

/**
 * Check multiple permissions at once
 * Returns object with permission results
 */
export async function checkMultiplePermissions(
  userId: number,
  checks: Array<{
    resource: string;
    action: string;
    scope?: "own" | "team" | "all";
  }>
): Promise<Record<string, boolean>> {
  const userPerms = await getUserPermissions(userId);

  if (!userPerms) {
    return Object.fromEntries(
      checks.map((c) => [`${c.resource}:${c.action}`, false])
    );
  }

  const results: Record<string, boolean> = {};

  for (const check of checks) {
    const key = `${check.resource}:${check.action}`;
    const permission = userPerms.permissions.find(
      (p) => p.resource === check.resource && p.action === check.action
    );

    if (!permission) {
      results[key] = false;
      continue;
    }

    if (!check.scope) {
      results[key] = true;
      continue;
    }

    const scopeHierarchy: Record<string, number> = {
      own: 1,
      team: 2,
      all: 3,
    };

    const userScopeLevel = scopeHierarchy[permission.scope] || 0;
    const requiredScopeLevel = scopeHierarchy[check.scope] || 0;

    results[key] = userScopeLevel >= requiredScopeLevel;
  }

  return results;
}

// ============================================================================
// PERMISSION CACHING (Optional - for performance)
// ============================================================================

/**
 * Simple in-memory cache for user permissions
 * Cache expires after 5 minutes
 */
const permissionCache = new Map<
  number,
  { data: UserPermissions; timestamp: number }
>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedUserPermissions(
  userId: number
): Promise<UserPermissions | null> {
  const cached = permissionCache.get(userId);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const permissions = await getUserPermissions(userId);

  if (permissions) {
    permissionCache.set(userId, {
      data: permissions,
      timestamp: Date.now(),
    });
  }

  return permissions;
}

/**
 * Clear permission cache for a user
 * Call this when user roles/permissions change
 */
export function clearPermissionCache(userId?: number): void {
  if (userId) {
    permissionCache.delete(userId);
  } else {
    permissionCache.clear();
  }
}
