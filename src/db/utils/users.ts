/**
 * User Database Utilities
 * CRUD operations for users
 */

import { db } from "../index";
import { users, roles, teams } from "../schema";
import { eq, and, ilike, or, desc, asc, sql } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/argon2";

// ============================================================================
// TYPES
// ============================================================================

export interface CreateUserInput {
  fullName: string;
  email: string;
  password: string;
  roleId: number;
  teamId?: number | null;
  isActive?: boolean;
}

export interface UpdateUserInput {
  fullName?: string;
  email?: string;
  password?: string;
  roleId?: number;
  teamId?: number | null;
  isActive?: boolean;
}

export interface UserFilters {
  search?: string; // Search in name or email
  roleId?: number;
  teamId?: number;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "email" | "createdAt";
  sortOrder?: "asc" | "desc";
}

// ============================================================================
// CREATE
// ============================================================================

/**
 * Create a new user
 */
export async function createUser(input: CreateUserInput) {
  // Hash password
  const passwordHash = await hashPassword(input.password);

  const [user] = await db
    .insert(users)
    .values({
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      passwordHash,
      roleId: input.roleId,
      teamId: input.teamId || null,
      isActive: input.isActive ?? true,
    })
    .returning();

  return user;
}

// ============================================================================
// READ
// ============================================================================

/**
 * Get user by ID with role and team information
 */
export async function getUserById(id: number) {
  const [user] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      roleId: users.roleId,
      roleName: roles.name,
      roleDisplayName: roles.displayName,
      teamId: users.teamId,
      teamName: teams.name,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .leftJoin(teams, eq(users.teamId, teams.id))
    .where(eq(users.id, id))
    .limit(1);

  return user || null;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  const [user] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      roleId: users.roleId,
      roleName: roles.name,
      teamId: users.teamId,
      isActive: users.isActive,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  return user || null;
}

/**
 * Get all users with filters and pagination
 */
export async function getUsers(filters: UserFilters = {}) {
  const {
    search,
    roleId,
    teamId,
    isActive,
    page = 1,
    pageSize = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filters;

  // Build where conditions
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(users.fullName, `%${search}%`),
        ilike(users.email, `%${search}%`)
      )
    );
  }

  if (roleId !== undefined) {
    conditions.push(eq(users.roleId, roleId));
  }

  if (teamId !== undefined) {
    if (teamId === null) {
      conditions.push(sql`${users.teamId} IS NULL`);
    } else {
      conditions.push(eq(users.teamId, teamId));
    }
  }

  if (isActive !== undefined) {
    conditions.push(eq(users.isActive, isActive));
  }

  // Build sort
  const sortColumn = {
    name: users.fullName,
    email: users.email,
    createdAt: users.createdAt,
  }[sortBy];

  const orderFn = sortOrder === "asc" ? asc : desc;

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Get paginated users
  const usersList = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      roleId: users.roleId,
      roleName: roles.name,
      roleDisplayName: roles.displayName,
      teamId: users.teamId,
      teamName: teams.name,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .leftJoin(teams, eq(users.teamId, teams.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderFn(sortColumn))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    data: usersList,
    pagination: {
      page,
      pageSize,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / pageSize),
    },
  };
}

/**
 * Get users by team ID
 */
export async function getUsersByTeam(teamId: number) {
  return await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      roleId: users.roleId,
      roleName: roles.name,
      isActive: users.isActive,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(and(eq(users.teamId, teamId), eq(users.isActive, true)))
    .orderBy(asc(users.fullName));
}

/**
 * Get users by role
 */
export async function getUsersByRole(roleId: number) {
  return await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      teamId: users.teamId,
      teamName: teams.name,
      isActive: users.isActive,
    })
    .from(users)
    .leftJoin(teams, eq(users.teamId, teams.id))
    .where(and(eq(users.roleId, roleId), eq(users.isActive, true)))
    .orderBy(asc(users.fullName));
}

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update user by ID
 */
export async function updateUser(id: number, input: UpdateUserInput) {
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (input.fullName !== undefined) {
    updateData.fullName = input.fullName;
  }

  if (input.email !== undefined) {
    updateData.email = input.email.toLowerCase();
  }

  if (input.password !== undefined) {
    updateData.passwordHash = await hashPassword(input.password);
  }

  if (input.roleId !== undefined) {
    updateData.roleId = input.roleId;
  }

  if (input.teamId !== undefined) {
    updateData.teamId = input.teamId;
  }

  if (input.isActive !== undefined) {
    updateData.isActive = input.isActive;
  }

  const [user] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning();

  return user;
}

/**
 * Deactivate user (soft delete)
 */
export async function deactivateUser(id: number) {
  return await updateUser(id, { isActive: false });
}

/**
 * Activate user
 */
export async function activateUser(id: number) {
  return await updateUser(id, { isActive: true });
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete user permanently (use with caution)
 */
export async function deleteUser(id: number) {
  await db.delete(users).where(eq(users.id, id));
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get user statistics
 */
export async function getUserStats() {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where ${users.isActive} = true)`,
      inactive: sql<number>`count(*) filter (where ${users.isActive} = false)`,
    })
    .from(users);

  return stats;
}

/**
 * Get user count by role
 */
export async function getUserCountByRole() {
  return await db
    .select({
      roleId: users.roleId,
      roleName: roles.name,
      roleDisplayName: roles.displayName,
      count: sql<number>`count(*)`,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.isActive, true))
    .groupBy(users.roleId, roles.name, roles.displayName);
}
