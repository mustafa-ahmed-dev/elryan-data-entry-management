/**
 * Users Database Utilities
 * CRUD operations for users
 */

import { db } from "../index";
import { users, roles, teams } from "../schema";
import { eq, and, or, like, desc, sql } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

export interface CreateUserInput {
  fullName: string;
  email: string;
  passwordHash: string;
  roleId: number;
  teamId?: number | null;
  isActive?: boolean;
}

export interface UpdateUserInput {
  fullName?: string;
  email?: string;
  passwordHash?: string;
  roleId?: number;
  teamId?: number | null;
  isActive?: boolean;
}

export interface UserFilters {
  search?: string;
  roleId?: number;
  teamId?: number;
  isActive?: boolean;
  userId?: number;
  page?: number;
  pageSize?: number;
}

// ============================================================================
// CREATE
// ============================================================================

/**
 * Create a new user
 */
export async function createUser(input: CreateUserInput) {
  const [user] = await db
    .insert(users)
    .values({
      fullName: input.fullName,
      email: input.email,
      passwordHash: input.passwordHash,
      roleId: input.roleId,
      teamId: input.teamId || null,
      isActive: input.isActive !== undefined ? input.isActive : true,
    })
    .returning();

  return user;
}

// ============================================================================
// READ
// ============================================================================

/**
 * Get user by ID
 */
export async function getUserById(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return user || null;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user || null;
}

/**
 * Get users with filters and pagination
 * FIXED: Now includes roleName and teamName in the results
 */
export async function getUsers(filters: UserFilters = {}) {
  const {
    search,
    roleId,
    teamId,
    isActive,
    userId,
    page = 1,
    pageSize = 20,
  } = filters;

  // Build where conditions
  const conditions = [];

  if (search) {
    conditions.push(
      or(like(users.fullName, `%${search}%`), like(users.email, `%${search}%`))
    );
  }

  if (roleId !== undefined) {
    conditions.push(eq(users.roleId, roleId));
  }

  if (teamId !== undefined) {
    conditions.push(eq(users.teamId, teamId));
  }

  if (isActive !== undefined) {
    conditions.push(eq(users.isActive, isActive));
  }

  if (userId !== undefined) {
    conditions.push(eq(users.id, userId));
  }

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const total = Number(count);

  // Get users with role and team names using LEFT JOIN
  const usersData = await db
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
    .leftJoin(roles, eq(users.roleId, roles.id))
    .leftJoin(teams, eq(users.teamId, teams.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    users: usersData,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update user
 */
export async function updateUser(id: number, input: UpdateUserInput) {
  const updateData: any = { updatedAt: new Date() };

  if (input.fullName !== undefined) updateData.fullName = input.fullName;
  if (input.email !== undefined) updateData.email = input.email;
  if (input.passwordHash !== undefined)
    updateData.passwordHash = input.passwordHash;
  if (input.roleId !== undefined) updateData.roleId = input.roleId;
  if (input.teamId !== undefined) updateData.teamId = input.teamId;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning();

  return updated || null;
}

// ============================================================================
// DELETE (Soft delete - set isActive to false)
// ============================================================================

/**
 * Deactivate user (soft delete)
 */
export async function deactivateUser(id: number) {
  const [updated] = await db
    .update(users)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  return updated || null;
}

/**
 * Activate user
 */
export async function activateUser(id: number) {
  const [updated] = await db
    .update(users)
    .set({
      isActive: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  return updated || null;
}
