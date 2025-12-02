import { db } from "../index";
import { weeklySchedules, scheduleHistory, users } from "../schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DaySchedule {
  start: string;
  end: string;
  isWorking: boolean;
}

export interface WeekScheduleData {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface CreateScheduleInput {
  userId: number;
  weekStartDate: string; // 'YYYY-MM-DD'
  weekEndDate: string; // 'YYYY-MM-DD'
  scheduleData: WeekScheduleData;
  createdBy: number;
}

export interface ScheduleWithDetails {
  id: number;
  userId: number;
  weekStartDate: string;
  weekEndDate: string;
  scheduleData: WeekScheduleData;
  createdBy: number;
  status: string;
  approvedBy: number | null;
  approvalDate: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: number;
    fullName: string;
    email: string;
    role: string;
  };
  creator?: {
    id: number;
    fullName: string;
    email: string;
    role: string;
  };
  approver?: {
    id: number;
    fullName: string;
    email: string;
    role: string;
  } | null;
}

// ============================================================================
// CREATE
// ============================================================================

/**
 * Create a new weekly schedule (Team Leader or Admin)
 * Status: pending_approval
 */
export async function createWeeklySchedule(input: CreateScheduleInput) {
  try {
    const [schedule] = await db
      .insert(weeklySchedules)
      .values({
        userId: input.userId,
        weekStartDate: input.weekStartDate,
        weekEndDate: input.weekEndDate,
        scheduleData: input.scheduleData,
        createdBy: input.createdBy,
        status: "pending_approval",
      })
      .returning();

    // Create history record
    await db.insert(scheduleHistory).values({
      scheduleId: schedule.id,
      changedBy: input.createdBy,
      changeType: "created",
      oldData: null,
      newData: input.scheduleData,
      reason: "Initial schedule creation",
    });

    return schedule;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create schedule: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// APPROVE / REJECT (Admin Only)
// ============================================================================

/**
 * Approve a pending schedule (Admin only)
 */
export async function approveSchedule(scheduleId: number, adminId: number) {
  try {
    const [schedule] = await db
      .update(weeklySchedules)
      .set({
        status: "approved",
        approvedBy: adminId,
        approvalDate: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(weeklySchedules.id, scheduleId),
          eq(weeklySchedules.status, "pending_approval")
        )
      )
      .returning();

    if (!schedule) {
      throw new Error("Schedule not found or not pending approval");
    }

    // Create history record
    await db.insert(scheduleHistory).values({
      scheduleId: schedule.id,
      changedBy: adminId,
      changeType: "approved",
      oldData: null,
      newData: null,
      reason: "Schedule approved by admin",
    });

    return schedule;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to approve schedule: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Reject a pending schedule (Admin only)
 */
export async function rejectSchedule(
  scheduleId: number,
  adminId: number,
  reason: string
) {
  try {
    const [schedule] = await db
      .update(weeklySchedules)
      .set({
        status: "rejected",
        approvedBy: adminId,
        approvalDate: new Date(),
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(weeklySchedules.id, scheduleId),
          eq(weeklySchedules.status, "pending_approval")
        )
      )
      .returning();

    if (!schedule) {
      throw new Error("Schedule not found or not pending approval");
    }

    // Create history record
    await db.insert(scheduleHistory).values({
      scheduleId: schedule.id,
      changedBy: adminId,
      changeType: "rejected",
      oldData: null,
      newData: null,
      reason: reason,
    });

    return schedule;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to reject schedule: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// UPDATE (Admin Only for Approved Schedules)
// ============================================================================

/**
 * Modify an approved schedule (Admin only)
 */
export async function modifyApprovedSchedule(
  scheduleId: number,
  adminId: number,
  newScheduleData: WeekScheduleData,
  reason: string
) {
  try {
    // Get current schedule
    const [current] = await db
      .select()
      .from(weeklySchedules)
      .where(eq(weeklySchedules.id, scheduleId))
      .limit(1);

    if (!current) {
      throw new Error("Schedule not found");
    }

    if (current.status !== "approved") {
      throw new Error("Can only modify approved schedules");
    }

    // Update schedule
    const [schedule] = await db
      .update(weeklySchedules)
      .set({
        scheduleData: newScheduleData,
        updatedAt: new Date(),
      })
      .where(eq(weeklySchedules.id, scheduleId))
      .returning();

    // Create history record
    await db.insert(scheduleHistory).values({
      scheduleId: schedule.id,
      changedBy: adminId,
      changeType: "modified",
      oldData: current.scheduleData,
      newData: newScheduleData,
      reason: reason,
    });

    return schedule;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to modify schedule: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// QUERY
// ============================================================================

/**
 * Get schedule by ID with full details
 */
export async function getScheduleById(
  scheduleId: number
): Promise<ScheduleWithDetails | null> {
  try {
    const result = await db
      .select({
        schedule: weeklySchedules,
        user: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          role: users.role,
        },
      })
      .from(weeklySchedules)
      .leftJoin(users, eq(weeklySchedules.userId, users.id))
      .where(eq(weeklySchedules.id, scheduleId))
      .limit(1);

    if (result.length === 0) return null;

    const row = result[0];
    return {
      ...row.schedule,
      weekStartDate: row.schedule.weekStartDate.toString(),
      weekEndDate: row.schedule.weekEndDate.toString(),
      user: row.user || undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get schedule: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get schedules by user
 */
export async function getSchedulesByUser(userId: number) {
  try {
    const result = await db
      .select()
      .from(weeklySchedules)
      .where(eq(weeklySchedules.userId, userId))
      .orderBy(desc(weeklySchedules.weekStartDate));

    return result.map((schedule) => ({
      ...schedule,
      weekStartDate: schedule.weekStartDate.toString(),
      weekEndDate: schedule.weekEndDate.toString(),
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get schedules by user: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get pending schedules (for admin approval)
 */
export async function getPendingSchedules() {
  try {
    const result = await db
      .select({
        schedule: weeklySchedules,
        user: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          role: users.role,
          teamId: users.teamId,
        },
      })
      .from(weeklySchedules)
      .leftJoin(users, eq(weeklySchedules.userId, users.id))
      .where(eq(weeklySchedules.status, "pending_approval"))
      .orderBy(desc(weeklySchedules.createdAt));

    return result.map((row) => ({
      ...row.schedule,
      weekStartDate: row.schedule.weekStartDate.toString(),
      weekEndDate: row.schedule.weekEndDate.toString(),
      user: row.user || undefined,
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get pending schedules: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get approved schedules for a specific week
 */
export async function getApprovedSchedulesForWeek(weekStartDate: string) {
  try {
    const result = await db
      .select({
        schedule: weeklySchedules,
        user: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          role: users.role,
        },
      })
      .from(weeklySchedules)
      .leftJoin(users, eq(weeklySchedules.userId, users.id))
      .where(
        and(
          eq(weeklySchedules.weekStartDate, weekStartDate),
          eq(weeklySchedules.status, "approved")
        )
      );

    return result.map((row) => ({
      ...row.schedule,
      weekStartDate: row.schedule.weekStartDate.toString(),
      weekEndDate: row.schedule.weekEndDate.toString(),
      user: row.user || undefined,
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get schedules for week: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get user's schedule for a specific date
 */
export async function getUserScheduleForDate(userId: number, date: string) {
  try {
    const result = await db
      .select()
      .from(weeklySchedules)
      .where(
        and(
          eq(weeklySchedules.userId, userId),
          eq(weeklySchedules.status, "approved"),
          lte(weeklySchedules.weekStartDate, date),
          gte(weeklySchedules.weekEndDate, date)
        )
      )
      .limit(1);

    if (result.length === 0) return null;

    return {
      ...result[0],
      weekStartDate: result[0].weekStartDate.toString(),
      weekEndDate: result[0].weekEndDate.toString(),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get schedule for date: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// HISTORY
// ============================================================================

/**
 * Get schedule history
 */
export async function getScheduleHistory(scheduleId: number) {
  try {
    const result = await db
      .select({
        history: scheduleHistory,
        changedBy: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
        },
      })
      .from(scheduleHistory)
      .leftJoin(users, eq(scheduleHistory.changedBy, users.id))
      .where(eq(scheduleHistory.scheduleId, scheduleId))
      .orderBy(desc(scheduleHistory.changedAt));

    return result.map((row) => ({
      ...row.history,
      changedBy: row.changedBy || undefined,
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get schedule history: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete a pending schedule (before approval)
 */
export async function deletePendingSchedule(scheduleId: number) {
  try {
    const [deleted] = await db
      .delete(weeklySchedules)
      .where(
        and(
          eq(weeklySchedules.id, scheduleId),
          eq(weeklySchedules.status, "pending_approval")
        )
      )
      .returning();

    if (!deleted) {
      throw new Error("Schedule not found or not pending approval");
    }

    return deleted;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete schedule: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get schedule statistics
 */
export async function getScheduleStatistics() {
  try {
    const result = await db
      .select({
        status: weeklySchedules.status,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(weeklySchedules)
      .groupBy(weeklySchedules.status);

    return result.map((row) => ({
      status: row.status,
      count: Number(row.count),
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get schedule statistics: ${error.message}`);
    }
    throw error;
  }
}
