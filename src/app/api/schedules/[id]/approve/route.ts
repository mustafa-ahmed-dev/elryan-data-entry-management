import { NextRequest } from "next/server";
import { db } from "@/db";
import { weeklySchedules, scheduleHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireRole, getUserId } from "@/lib/middleware/auth";
import { handleApiError, successResponse, parseBody } from "@/lib/api/utils";
import { approveScheduleSchema } from "@/lib/validations/schemas";

/**
 * PATCH /api/schedules/[id]/approve - Approve schedule
 * Requires: admin only
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
    const validatedData = approveScheduleSchema.parse(body);

    // Get existing schedule
    const [schedule] = await db
      .select()
      .from(weeklySchedules)
      .where(eq(weeklySchedules.id, scheduleId))
      .limit(1);

    if (!schedule) {
      throw new Error("Schedule not found");
    }

    // Check if schedule is pending
    if (schedule.status !== "pending_approval") {
      throw new Error("Only pending schedules can be approved");
    }

    // Update schedule status
    const [approvedSchedule] = await db
      .update(weeklySchedules)
      .set({
        status: "approved",
        approvedBy: getUserId(session),
        approvalDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(weeklySchedules.id, scheduleId))
      .returning();

    // Create history entry
    await db.insert(scheduleHistory).values({
      scheduleId: scheduleId,
      changedBy: getUserId(session),
      changeType: "approved",
      newData: schedule.scheduleData,
      reason: validatedData.reason || "Schedule approved",
    });

    return successResponse(approvedSchedule, "Schedule approved successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
