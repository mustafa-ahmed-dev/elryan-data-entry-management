import { NextRequest } from "next/server";
import { db } from "@/db";
import { weeklySchedules, users, scheduleHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  requireAuth,
  requireRole,
  isAdmin,
  getUserId,
} from "@/lib/middleware/auth";
import { handleApiError, successResponse, parseBody } from "@/lib/api/utils";
import { updateScheduleSchema } from "@/lib/validations/schemas";

/**
 * GET /api/schedules/[id] - Get schedule details
 * Requires: authenticated
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const scheduleId = parseInt(params.id);

    // Get schedule with user and creator info
    const [schedule] = await db
      .select({
        id: weeklySchedules.id,
        userId: weeklySchedules.userId,
        userName: users.fullName,
        userEmail: users.email,
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
      .where(eq(weeklySchedules.id, scheduleId))
      .limit(1);

    if (!schedule) {
      throw new Error("Schedule not found");
    }

    // Check permissions
    const canView =
      session.user.role === "admin" ||
      schedule.userId.toString() === session.user.id ||
      schedule.createdBy.toString() === session.user.id;

    if (!canView) {
      throw new Error("Forbidden - Cannot view this schedule");
    }

    return successResponse(schedule);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/schedules/[id] - Modify approved schedule
 * Requires: admin only (once approved)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole("admin");
    const scheduleId = parseInt(params.id);
    const body = await parseBody(request);

    // Validate request body
    const validatedData = updateScheduleSchema.parse(body);

    // Get existing schedule
    const [schedule] = await db
      .select()
      .from(weeklySchedules)
      .where(eq(weeklySchedules.id, scheduleId))
      .limit(1);

    if (!schedule) {
      throw new Error("Schedule not found");
    }

    // Only admins can modify approved schedules
    if (schedule.status !== "approved") {
      throw new Error("Can only modify approved schedules");
    }

    // Store old data for history
    const oldData = schedule.scheduleData;

    // Update schedule
    const [updatedSchedule] = await db
      .update(weeklySchedules)
      .set({
        scheduleData: validatedData.scheduleData,
        updatedAt: new Date(),
      })
      .where(eq(weeklySchedules.id, scheduleId))
      .returning();

    // Create history entry
    await db.insert(scheduleHistory).values({
      scheduleId: scheduleId,
      changedBy: getUserId(session),
      changeType: "modified",
      oldData: oldData,
      newData: validatedData.scheduleData,
      reason: validatedData.reason,
    });

    return successResponse(updatedSchedule, "Schedule updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
