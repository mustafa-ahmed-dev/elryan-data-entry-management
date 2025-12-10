/**
 * Teams Database Utilities
 * CRUD operations for teams
 */

import { db } from "../index";
import { teams, users, roles } from "../schema";
import { eq, and, ilike, desc, asc, sql } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

export interface CreateTeamInput {
  name: string;
  description?: string | null;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string | null;
}

export interface TeamFilters {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface TeamWithStats {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  memberCount: number;
  teamLeaderCount: number;
  employeeCount: number;
}

// ============================================================================
// CREATE
// ============================================================================

/**
 * Create a new team
 */
export async function createTeam(input: CreateTeamInput) {
  const [team] = await db
    .insert(teams)
    .values({
      name: input.name,
      description: input.description || null,
    })
    .returning();

  return team;
}

// ============================================================================
// READ
// ============================================================================

/**
 * Get team by ID
 */
export async function getTeamById(id: number) {
  const [team] = await db.select().from(teams).where(eq(teams.id, id)).limit(1);

  return team || null;
}

/**
 * Get team by ID with member count
 */
export async function getTeamByIdWithStats(id: number) {
  const [team] = await db
    .select({
      id: teams.id,
      name: teams.name,
      description: teams.description,
      createdAt: teams.createdAt,
      memberCount: sql<number>`count(${users.id})`,
    })
    .from(teams)
    .leftJoin(users, and(eq(teams.id, users.teamId), eq(users.isActive, true)))
    .where(eq(teams.id, id))
    .groupBy(teams.id)
    .limit(1);

  return team || null;
}

/**
 * Get all teams with filters and pagination
 */
export async function getTeams(filters: TeamFilters = {}) {
  const {
    search,
    page = 1,
    pageSize = 10,
    sortBy = "name",
    sortOrder = "asc",
  } = filters;

  // Build where conditions
  const conditions = [];

  if (search) {
    conditions.push(ilike(teams.name, `%${search}%`));
  }

  // Build sort
  const sortColumn = {
    name: teams.name,
    createdAt: teams.createdAt,
  }[sortBy];

  const orderFn = sortOrder === "asc" ? asc : desc;

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(teams)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Get paginated teams with member counts
  const teamsList = await db
    .select({
      id: teams.id,
      name: teams.name,
      description: teams.description,
      createdAt: teams.createdAt,
      memberCount: sql<number>`count(${users.id})`,
    })
    .from(teams)
    .leftJoin(users, and(eq(teams.id, users.teamId), eq(users.isActive, true)))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(teams.id)
    .orderBy(orderFn(sortColumn))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    data: teamsList,
    pagination: {
      page,
      pageSize,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / pageSize),
    },
  };
}

/**
 * Get all teams with detailed statistics
 */
export async function getTeamsWithStats(): Promise<TeamWithStats[]> {
  const teamsList = await db
    .select({
      id: teams.id,
      name: teams.name,
      description: teams.description,
      createdAt: teams.createdAt,
      userId: users.id,
      roleId: users.roleId,
      roleName: roles.name,
    })
    .from(teams)
    .leftJoin(users, and(eq(teams.id, users.teamId), eq(users.isActive, true)))
    .leftJoin(roles, eq(users.roleId, roles.id))
    .orderBy(asc(teams.name));

  // Group by team and calculate stats
  const teamsMap = new Map<number, TeamWithStats>();

  for (const row of teamsList) {
    if (!teamsMap.has(row.id)) {
      teamsMap.set(row.id, {
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.createdAt,
        memberCount: 0,
        teamLeaderCount: 0,
        employeeCount: 0,
      });
    }

    const team = teamsMap.get(row.id)!;

    if (row.userId) {
      team.memberCount++;
      if (row.roleName === "team_leader") {
        team.teamLeaderCount++;
      } else if (row.roleName === "employee") {
        team.employeeCount++;
      }
    }
  }

  return Array.from(teamsMap.values());
}

/**
 * Get team members with their roles
 */
export async function getTeamMembers(teamId: number) {
  return await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      roleId: users.roleId,
      roleName: roles.name,
      roleDisplayName: roles.displayName,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(and(eq(users.teamId, teamId), eq(users.isActive, true)))
    .orderBy(asc(users.fullName));
}

/**
 * Get team leader for a team
 */
export async function getTeamLeader(teamId: number) {
  // Find team_leader role
  const [teamLeaderRole] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, "team_leader"))
    .limit(1);

  if (!teamLeaderRole) {
    return null;
  }

  const [leader] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
    })
    .from(users)
    .where(
      and(
        eq(users.teamId, teamId),
        eq(users.roleId, teamLeaderRole.id),
        eq(users.isActive, true)
      )
    )
    .limit(1);

  return leader || null;
}

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update team by ID
 */
export async function updateTeam(id: number, input: UpdateTeamInput) {
  const updateData: any = {};

  if (input.name !== undefined) {
    updateData.name = input.name;
  }

  if (input.description !== undefined) {
    updateData.description = input.description;
  }

  const [team] = await db
    .update(teams)
    .set(updateData)
    .where(eq(teams.id, id))
    .returning();

  return team;
}

/**
 * Assign users to team
 */
export async function assignUsersToTeam(teamId: number, userIds: number[]) {
  // Verify team exists
  const team = await getTeamById(teamId);
  if (!team) {
    throw new Error("Team not found");
  }

  // Update users
  for (const userId of userIds) {
    await db
      .update(users)
      .set({ teamId, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  return true;
}

/**
 * Remove users from team
 */
export async function removeUsersFromTeam(userIds: number[]) {
  for (const userId of userIds) {
    await db
      .update(users)
      .set({ teamId: null, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  return true;
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete team permanently
 * Note: This will set teamId to null for all team members
 */
export async function deleteTeam(id: number) {
  // First, remove team assignment from all users
  await db
    .update(users)
    .set({ teamId: null, updatedAt: new Date() })
    .where(eq(users.teamId, id));

  // Then delete the team
  await db.delete(teams).where(eq(teams.id, id));
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get team statistics
 */
export async function getTeamStats() {
  const [stats] = await db
    .select({
      totalTeams: sql<number>`count(distinct ${teams.id})`,
      totalMembers: sql<number>`count(${users.id})`,
      avgMembersPerTeam: sql<number>`avg(member_count)`,
    })
    .from(teams)
    .leftJoin(users, and(eq(teams.id, users.teamId), eq(users.isActive, true)))
    .crossJoin(
      db
        .select({
          teamId: users.teamId,
          memberCount: sql<number>`count(*)`.as("member_count"),
        })
        .from(users)
        .where(eq(users.isActive, true))
        .groupBy(users.teamId)
        .as("team_counts")
    );

  return {
    totalTeams: Number(stats?.totalTeams || 0),
    totalMembers: Number(stats?.totalMembers || 0),
    avgMembersPerTeam: Math.round(Number(stats?.avgMembersPerTeam || 0)),
  };
}

/**
 * Get teams with no team leader
 */
export async function getTeamsWithoutLeader() {
  // Get team_leader role ID
  const [teamLeaderRole] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, "team_leader"))
    .limit(1);

  if (!teamLeaderRole) {
    return [];
  }

  // Get all teams
  const allTeams = await db.select().from(teams);

  // Get teams with leaders
  const teamsWithLeaders = await db
    .select({ teamId: users.teamId })
    .from(users)
    .where(
      and(
        eq(users.roleId, teamLeaderRole.id),
        eq(users.isActive, true),
        sql`${users.teamId} IS NOT NULL`
      )
    )
    .groupBy(users.teamId);

  const teamIdsWithLeaders = new Set(
    teamsWithLeaders
      .map((t) => t.teamId)
      .filter((id): id is number => id !== null)
  );

  return allTeams.filter((team) => !teamIdsWithLeaders.has(team.id));
}
