import { NextRequest } from "next/server";
import { db } from "@/db";
import { weeklySchedules, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireRole } from "@/lib/middleware/auth";
import { handleApiError, successResponse } from "@/lib/api/utils";

/**
 * GET /api/schedules/pending - Get all pending schedules
 * Requires: admin only
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole("admin");

    // Get all pending schedules with user info
    const pendingSchedules = await db
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
        createdAt: weeklySchedules.createdAt,
      })
      .from(weeklySchedules)
      .leftJoin(users, eq(weeklySchedules.userId, users.id))
      .where(eq(weeklySchedules.status, "pending_approval"))
      .orderBy(desc(weeklySchedules.createdAt));

    return successResponse({
      schedules: pendingSchedules,
      count: pendingSchedules.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
