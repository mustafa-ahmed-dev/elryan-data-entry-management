import { db } from "../index";
import { users, teams } from "../schema";
import { eq, and, or, like, desc, sql } from "drizzle-orm";
import argon2 from "argon2";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CreateUserInput {
  fullName: string;
  email: string;
  password: string;
  role: "admin" | "team_leader" | "employee";
  teamId?: number;
  isActive?: boolean;
}

export interface UpdateUserInput {
  fullName?: string;
  email?: string;
  password?: string;
  role?: "admin" | "team_leader" | "employee";
  teamId?: number;
  isActive?: boolean;
}

export interface UserWithTeam {
  id: number;
  fullName: string;
  email: string;
  role: string;
  teamId: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  team?: {
    id: number;
    name: string;
    description: string | null;
  } | null;
}

// ============================================================================
// CREATE & AUTHENTICATION
// ============================================================================

/**
 * Create a new user with hashed password
 */
export async function createUser(input: CreateUserInput) {
  try {
    const passwordHash = await argon2.hash(input.password);

    const [user] = await db
      .insert(users)
      .values({
        fullName: input.fullName,
        email: input.email,
        passwordHash,
        role: input.role,
        teamId: input.teamId || null,
        isActive: input.isActive ?? true,
      })
      .returning();

    return user;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string) {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Find user by ID with team information
 */
export async function findUserById(
  userId: number
): Promise<UserWithTeam | null> {
  try {
    const result = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        teamId: users.teamId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        team: teams,
      })
      .from(users)
      .leftJoin(teams, eq(users.teamId, teams.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (result.length === 0) return null;

    const row = result[0];
    return {
      ...row,
      team: row.team || null,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to find user: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Verify user password
 */
export async function verifyPassword(
  userId: number,
  password: string
): Promise<boolean> {
  try {
    const user = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) return false;

    return await argon2.verify(user[0].passwordHash, password);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to verify password: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<UserWithTeam | null> {
  try {
    const user = await findUserByEmail(email);

    if (!user || !user.isActive) {
      return null;
    }

    const isValidPassword = await argon2.verify(user.passwordHash, password);

    if (!isValidPassword) {
      return null;
    }

    // Return user with team info
    return await findUserById(user.id);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// UPDATE & DELETE
// ============================================================================

/**
 * Update user information
 */
export async function updateUser(userId: number, input: UpdateUserInput) {
  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (input.fullName !== undefined) updateData.fullName = input.fullName;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.role !== undefined) updateData.role = input.role;
    if (input.teamId !== undefined) updateData.teamId = input.teamId;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    if (input.password) {
      updateData.passwordHash = await argon2.hash(input.password);
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Deactivate user (soft delete)
 */
export async function deactivateUser(userId: number) {
  try {
    const [user] = await db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return user;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to deactivate user: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Activate user
 */
export async function activateUser(userId: number) {
  try {
    const [user] = await db
      .update(users)
      .set({
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return user;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to activate user: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// QUERY & FILTERS
// ============================================================================

/**
 * Get all users with optional filters
 */
export async function getUsers(filters?: {
  teamId?: number;
  role?: string;
  isActive?: boolean;
  search?: string;
}) {
  try {
    let query = db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        teamId: users.teamId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        team: teams,
      })
      .from(users)
      .leftJoin(teams, eq(users.teamId, teams.id))
      .$dynamic();

    const conditions = [];

    if (filters?.teamId) {
      conditions.push(eq(users.teamId, filters.teamId));
    }

    if (filters?.role) {
      conditions.push(eq(users.role, filters.role));
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(users.isActive, filters.isActive));
    }

    if (filters?.search) {
      conditions.push(
        or(
          like(users.fullName, `%${filters.search}%`),
          like(users.email, `%${filters.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query.orderBy(desc(users.createdAt));

    return result.map((row) => ({
      ...row,
      team: row.team || null,
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get users by team ID
 */
export async function getUsersByTeam(teamId: number) {
  try {
    return await getUsers({ teamId, isActive: true });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get users by team: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get team leaders
 */
export async function getTeamLeaders() {
  try {
    return await getUsers({ role: "team_leader", isActive: true });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get team leaders: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get employees (non-leaders)
 */
export async function getEmployees(teamId?: number) {
  try {
    return await getUsers({
      role: "employee",
      isActive: true,
      teamId,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get employees: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get admins
 */
export async function getAdmins() {
  try {
    return await getUsers({ role: "admin", isActive: true });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get admins: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// VALIDATION & CHECKS
// ============================================================================

/**
 * Check if user exists by email
 */
export async function userExistsByEmail(email: string): Promise<boolean> {
  try {
    const result = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result.length > 0;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to check if user exists: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Check if user is team leader
 */
export async function isTeamLeader(userId: number): Promise<boolean> {
  try {
    const user = await findUserById(userId);
    return user?.role === "team_leader";
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to check if user is team leader: ${error.message}`
      );
    }
    throw error;
  }
}

/**
 * Check if user is admin
 */
export async function isAdmin(userId: number): Promise<boolean> {
  try {
    const user = await findUserById(userId);
    return user?.role === "admin";
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to check if user is admin: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get user count by role
 */
export async function getUserCountByRole() {
  try {
    const result = await db
      .select({
        role: users.role,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(users)
      .where(eq(users.isActive, true))
      .groupBy(users.role);

    return result.map((row) => ({
      role: row.role,
      count: Number(row.count),
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get user count by role: ${error.message}`);
    }
    throw error;
  }
}
