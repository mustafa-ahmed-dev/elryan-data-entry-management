import { NextRequest } from "next/server";
import { db } from "@/db";
import { weeklySchedules, users, scheduleHistory } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  requireAuth,
  canManageTeam,
  getUserId,
  getTeamId,
} from "@/lib/middleware/auth";
import {
  handleApiError,
  paginatedResponse,
  createdResponse,
  parseBody,
  getOffset,
  parseQueryParams,
} from "@/lib/api/utils";
import {
  createScheduleSchema,
  scheduleFilterSchema,
} from "@/lib/validations/schemas";

/**
 * GET /api/schedules - Get schedules with filters
 * Requires: authenticated
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const params = parseQueryParams(request.url);

    // Validate and parse query parameters
    const filters = scheduleFilterSchema.parse(params);
    const { page, limit, userId, status, weekStartDate } = filters;

    // Build query conditions
    const conditions = [];

    if (userId) {
      conditions.push(eq(weeklySchedules.userId, userId));
    }

    if (status) {
      conditions.push(eq(weeklySchedules.status, status));
    }

    if (weekStartDate) {
      conditions.push(eq(weeklySchedules.weekStartDate, weekStartDate));
    }

    // Employees can only see their own schedules
    if (session.user.role === "employee") {
      conditions.push(eq(weeklySchedules.userId, getUserId(session)));
    }
    // Team leaders can only see their team's schedules
    else if (session.user.role === "team_leader") {
      const teamId = getTeamId(session);
      if (teamId) {
        // Join with users to filter by team
        conditions.push(eq(users.teamId, teamId));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(weeklySchedules)
      .leftJoin(users, eq(weeklySchedules.userId, users.id))
      .where(whereClause);

    // Get paginated schedules
    const schedulesList = await db
      .select({
        id: weeklySchedules.id,
        userId: weeklySchedules.userId,
        userName: users.fullName,
        weekStartDate: weeklySchedules.weekStartDate,
        weekEndDate: weeklySchedules.weekEndDate,
        scheduleData: weeklySchedules.scheduleData,
        status: weeklySchedules.status,
        createdBy: weeklySchedules.createdBy,
        approvedBy: weeklySchedules.approvedBy,
        approvalDate: weeklySchedules.approvalDate,
        rejectionReason: weeklySchedules.rejectionReason,
        createdAt: weeklySchedules.createdAt,
        updatedAt: weeklySchedules.updatedAt,
      })
      .from(weeklySchedules)
      .leftJoin(users, eq(weeklySchedules.userId, users.id))
      .where(whereClause)
      .orderBy(desc(weeklySchedules.createdAt))
      .limit(limit)
      .offset(getOffset(page, limit));

    return paginatedResponse(schedulesList, page, limit, count);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/schedules - Create new schedule
 * Requires: team_leader or admin
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Check if user can manage team
    if (!canManageTeam(session)) {
      throw new Error(
        "Forbidden - Only team leaders and admins can create schedules"
      );
    }

    const body = await parseBody(request);

    // Validate request body
    const validatedData = createScheduleSchema.parse(body);

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, validatedData.userId))
      .limit(1);

    if (!user) {
      throw new Error("User not found");
    }

    // Team leaders can only create schedules for their team members
    if (session.user.role === "team_leader") {
      const teamId = getTeamId(session);
      if (!teamId || user.teamId !== teamId) {
        throw new Error(
          "Forbidden - Can only create schedules for your team members"
        );
      }
    }

    // Check if schedule already exists for this week
    const [existingSchedule] = await db
      .select()
      .from(weeklySchedules)
      .where(
        and(
          eq(weeklySchedules.userId, validatedData.userId),
          eq(weeklySchedules.weekStartDate, validatedData.weekStartDate)
        )
      )
      .limit(1);

    if (existingSchedule) {
      throw new Error("Schedule already exists for this week");
    }

    // Create schedule
    const [newSchedule] = await db
      .insert(weeklySchedules)
      .values({
        userId: validatedData.userId,
        weekStartDate: validatedData.weekStartDate,
        weekEndDate: validatedData.weekEndDate,
        scheduleData: validatedData.scheduleData,
        createdBy: getUserId(session),
        status: "pending_approval",
      })
      .returning();

    // Create history entry
    await db.insert(scheduleHistory).values({
      scheduleId: newSchedule.id,
      changedBy: getUserId(session),
      changeType: "created",
      newData: validatedData.scheduleData,
      reason: "Schedule created",
    });

    return createdResponse(newSchedule, "Schedule created successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
