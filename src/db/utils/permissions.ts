/**
 * Permission Database Utilities
 * Functions to query and check permissions from the database
 */

import { db } from "../index";
import { permissions, roles, resources, actions, users } from "../schema";
import { eq, and, desc, sql } from "drizzle-orm";

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

export interface PermissionMatrix {
  roles: Array<{
    id: number;
    name: string;
    displayName: string;
    hierarchy: number;
  }>;
  resources: Array<{
    id: number;
    name: string;
    displayName: string;
  }>;
  actions: Array<{
    id: number;
    name: string;
    displayName: string;
  }>;
  permissions: Array<{
    roleId: number;
    resourceId: number;
    actionId: number;
    granted: boolean;
    scope: string;
    permissionId: number | null;
  }>;
}

export interface PermissionAuditLog {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceAction: string;
  roleId?: number;
  roleName?: string;
  targetUserId?: number;
  targetUserName?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// ============================================================================
// CORE PERMISSION QUERIES (EXISTING)
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

  const permission = userPerms.permissions.find(
    (p) => p.resource === resourceName && p.action === actionName
  );

  if (!permission) {
    return false;
  }

  if (!targetScope) {
    return true;
  }

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
 * Check resource access with ownership context
 */
export async function checkResourceAccess(
  userId: number,
  resourceName: string,
  actionName: string,
  context?: {
    ownerId?: number;
    teamId?: number;
  }
): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);

  if (!userPerms) {
    return false;
  }

  const permission = userPerms.permissions.find(
    (p) => p.resource === resourceName && p.action === actionName
  );

  if (!permission) {
    return false;
  }

  switch (permission.scope) {
    case "all":
      return true;

    case "team":
      if (!context?.teamId || !userPerms.teamId) {
        return false;
      }
      return userPerms.teamId === context.teamId;

    case "own":
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
// ROLE HIERARCHY CHECKS (EXISTING)
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
// BATCH PERMISSION CHECKS (EXISTING)
// ============================================================================

/**
 * Check multiple permissions at once
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
// PERMISSION CACHING (EXISTING)
// ============================================================================

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

export function clearPermissionCache(userId?: number): void {
  if (userId) {
    permissionCache.delete(userId);
  } else {
    permissionCache.clear();
  }
}

// ============================================================================
// NEW FUNCTIONS FOR SECURITY SETTINGS PAGE
// ============================================================================

/**
 * Get all roles with their permission counts
 */
export async function getAllRoles() {
  const rolesData = await db
    .select({
      id: roles.id,
      name: roles.name,
      displayName: roles.displayName,
      description: roles.description,
      hierarchy: roles.hierarchy,
      isActive: roles.isActive,
      createdAt: roles.createdAt,
    })
    .from(roles)
    .where(eq(roles.isActive, true))
    .orderBy(desc(roles.hierarchy));

  // Get permission counts for each role
  const rolesWithCounts = await Promise.all(
    rolesData.map(async (role) => {
      const [count] = await db
        .select({ count: sql<number>`count(*)` })
        .from(permissions)
        .where(
          and(eq(permissions.roleId, role.id), eq(permissions.isActive, true))
        );

      return {
        ...role,
        permissionCount: Number(count?.count || 0),
      };
    })
  );

  return rolesWithCounts;
}

/**
 * Get the full permission matrix (roles × resources × actions)
 */
export async function getPermissionMatrix(): Promise<PermissionMatrix> {
  // Get all roles
  const rolesData = await db
    .select({
      id: roles.id,
      name: roles.name,
      displayName: roles.displayName,
      hierarchy: roles.hierarchy,
    })
    .from(roles)
    .where(eq(roles.isActive, true))
    .orderBy(desc(roles.hierarchy));

  // Get all resources
  const resourcesData = await db
    .select({
      id: resources.id,
      name: resources.name,
      displayName: resources.displayName,
    })
    .from(resources)
    .orderBy(resources.displayName);

  // Get all actions
  const actionsData = await db
    .select({
      id: actions.id,
      name: actions.name,
      displayName: actions.displayName,
    })
    .from(actions)
    .orderBy(actions.displayName);

  // Get all existing permissions
  const existingPermissions = await db
    .select({
      id: permissions.id,
      roleId: permissions.roleId,
      resourceId: permissions.resourceId,
      actionId: permissions.actionId,
      scope: permissions.scope,
      isActive: permissions.isActive,
    })
    .from(permissions);

  // Build complete matrix (include missing combinations as false)
  const permissionsMatrix: PermissionMatrix["permissions"] = [];

  for (const role of rolesData) {
    for (const resource of resourcesData) {
      for (const action of actionsData) {
        const existing = existingPermissions.find(
          (p) =>
            p.roleId === role.id &&
            p.resourceId === resource.id &&
            p.actionId === action.id &&
            p.isActive
        );

        permissionsMatrix.push({
          roleId: role.id,
          resourceId: resource.id,
          actionId: action.id,
          granted: !!existing,
          scope: existing?.scope || "own",
          permissionId: existing?.id || null,
        });
      }
    }
  }

  return {
    roles: rolesData,
    resources: resourcesData,
    actions: actionsData,
    permissions: permissionsMatrix,
  };
}

/**
 * Update multiple permissions at once (bulk update)
 */
export async function updateRolePermissions(
  roleId: number,
  updates: Array<{
    resourceId: number;
    actionId: number;
    granted: boolean;
    scope: "own" | "team" | "all";
  }>
): Promise<{ success: boolean; updated: number; errors: string[] }> {
  const errors: string[] = [];
  let updated = 0;

  try {
    for (const update of updates) {
      // Check if permission already exists
      const [existing] = await db
        .select()
        .from(permissions)
        .where(
          and(
            eq(permissions.roleId, roleId),
            eq(permissions.resourceId, update.resourceId),
            eq(permissions.actionId, update.actionId)
          )
        )
        .limit(1);

      if (update.granted) {
        if (existing) {
          // Update existing permission
          await db
            .update(permissions)
            .set({
              scope: update.scope,
              isActive: true,
              updatedAt: new Date(),
            })
            .where(eq(permissions.id, existing.id));
        } else {
          // Create new permission
          await db.insert(permissions).values({
            roleId,
            resourceId: update.resourceId,
            actionId: update.actionId,
            scope: update.scope,
            isActive: true,
          });
        }
        updated++;
      } else {
        // Revoke permission (set inactive or delete)
        if (existing) {
          await db
            .update(permissions)
            .set({
              isActive: false,
              updatedAt: new Date(),
            })
            .where(eq(permissions.id, existing.id));
          updated++;
        }
      }
    }

    // Clear permission cache for all users with this role
    clearPermissionCache();

    return { success: true, updated, errors };
  } catch (error) {
    errors.push(
      error instanceof Error ? error.message : "Unknown error occurred"
    );
    return { success: false, updated, errors };
  }
}

/**
 * Get permission audit log
 * Note: This requires an audit_logs table which we'll create in security-settings.ts
 */
export async function getPermissionAuditLog(filters?: {
  userId?: number;
  roleId?: number;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<PermissionAuditLog[]> {
  // This will be implemented after audit_logs table is created
  // For now, return empty array
  // TODO: Implement after adding audit_logs table to schema
  return [];
}

/**
 * Get role hierarchy tree for visualization
 */
export async function getRoleHierarchyTree() {
  const rolesData = await db
    .select({
      id: roles.id,
      name: roles.name,
      displayName: roles.displayName,
      hierarchy: roles.hierarchy,
    })
    .from(roles)
    .where(eq(roles.isActive, true))
    .orderBy(desc(roles.hierarchy));

  // Get user counts for each role
  const rolesWithCounts = await Promise.all(
    rolesData.map(async (role) => {
      const [count] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.roleId, role.id), eq(users.isActive, true)));

      return {
        ...role,
        userCount: Number(count?.count || 0),
      };
    })
  );

  return rolesWithCounts;
}

/**
 * Get all permissions for a specific resource
 */
export async function getPermissionsByResource(resourceName: string) {
  const result = await db
    .select({
      id: permissions.id,
      roleId: permissions.roleId,
      roleName: roles.name,
      roleDisplayName: roles.displayName,
      resource: resources.name,
      action: actions.name,
      actionDisplayName: actions.displayName,
      scope: permissions.scope,
      isActive: permissions.isActive,
    })
    .from(permissions)
    .innerJoin(roles, eq(permissions.roleId, roles.id))
    .innerJoin(resources, eq(permissions.resourceId, resources.id))
    .innerJoin(actions, eq(permissions.actionId, actions.id))
    .where(
      and(eq(resources.name, resourceName), eq(permissions.isActive, true))
    )
    .orderBy(desc(roles.hierarchy), actions.name);

  return result;
}

/**
 * Create a single permission
 */
export async function createPermission(data: {
  roleId: number;
  resourceId: number;
  actionId: number;
  scope: "own" | "team" | "all";
  conditions?: any;
}) {
  // Check if permission already exists
  const [existing] = await db
    .select()
    .from(permissions)
    .where(
      and(
        eq(permissions.roleId, data.roleId),
        eq(permissions.resourceId, data.resourceId),
        eq(permissions.actionId, data.actionId)
      )
    )
    .limit(1);

  if (existing) {
    // Update existing permission
    const [updated] = await db
      .update(permissions)
      .set({
        scope: data.scope,
        conditions: data.conditions,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(permissions.id, existing.id))
      .returning();

    clearPermissionCache();
    return updated;
  }

  // Create new permission
  const [newPermission] = await db
    .insert(permissions)
    .values({
      roleId: data.roleId,
      resourceId: data.resourceId,
      actionId: data.actionId,
      scope: data.scope,
      conditions: data.conditions,
      isActive: true,
    })
    .returning();

  clearPermissionCache();
  return newPermission;
}

/**
 * Delete a permission (set inactive)
 */
export async function deletePermission(permissionId: number) {
  const [deleted] = await db
    .update(permissions)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(permissions.id, permissionId))
    .returning();

  clearPermissionCache();
  return deleted;
}

/**
 * Get permission statistics
 */
export async function getPermissionStatistics() {
  const [totalPermissions] = await db
    .select({ count: sql<number>`count(*)` })
    .from(permissions)
    .where(eq(permissions.isActive, true));

  const [totalRoles] = await db
    .select({ count: sql<number>`count(*)` })
    .from(roles)
    .where(eq(roles.isActive, true));

  const [totalResources] = await db
    .select({ count: sql<number>`count(*)` })
    .from(resources);

  const [totalActions] = await db
    .select({ count: sql<number>`count(*)` })
    .from(actions);

  return {
    totalPermissions: Number(totalPermissions?.count || 0),
    totalRoles: Number(totalRoles?.count || 0),
    totalResources: Number(totalResources?.count || 0),
    totalActions: Number(totalActions?.count || 0),
  };
}
