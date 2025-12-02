import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, teams } from "@/db/schema";
import { eq, and, like, or, desc, sql } from "drizzle-orm";
import argon2 from "argon2";
import { requireRole, getUserId } from "@/lib/middleware/auth";
import {
  handleApiError,
  paginatedResponse,
  createdResponse,
  parseBody,
  getOffset,
  parseQueryParams,
} from "@/lib/api/utils";
import { createUserSchema, userFilterSchema } from "@/lib/validations/schemas";

/**
 * GET /api/users - List users with filters
 * Requires: admin or team_leader
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(["admin", "team_leader"]);
    const params = parseQueryParams(request.url);

    // Validate and parse query parameters
    const filters = userFilterSchema.parse(params);
    const { page, limit, role, teamId, isActive, search } = filters;

    // Build query conditions
    const conditions = [];

    if (role) {
      conditions.push(eq(users.role, role));
    }

    if (teamId) {
      conditions.push(eq(users.teamId, teamId));
    }

    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive));
    }

    if (search) {
      conditions.push(
        or(
          like(users.fullName, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      );
    }

    // Team leaders can only see their team members
    if (session.user.role === "team_leader" && session.user.teamId) {
      conditions.push(eq(users.teamId, parseInt(session.user.teamId)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(whereClause);

    // Get paginated users with team info
    const usersList = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        teamId: users.teamId,
        teamName: teams.name,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .leftJoin(teams, eq(users.teamId, teams.id))
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(getOffset(page, limit));

    return paginatedResponse(usersList, page, limit, count);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/users - Create new user
 * Requires: admin
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole("admin");
    const body = await parseBody(request);

    // Validate request body
    const validatedData = createUserSchema.parse(body);

    // Check if email already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const passwordHash = await argon2.hash(validatedData.password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        fullName: validatedData.fullName,
        email: validatedData.email,
        passwordHash,
        role: validatedData.role,
        teamId: validatedData.teamId || null,
        isActive: true,
      })
      .returning({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        teamId: users.teamId,
        isActive: users.isActive,
        createdAt: users.createdAt,
      });

    return createdResponse(newUser, "User created successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
