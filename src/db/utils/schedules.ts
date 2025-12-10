/**
 * Schedules Database Utilities
 * CRUD operations for weekly schedules
 */

import { db } from "../index";
import { weeklySchedules, users, scheduleHistory } from "../schema";
import { eq, and, or, gte, lte, desc, asc, sql } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

export type ScheduleStatus = "pending_approval" | "approved" | "rejected";

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
  weekStartDate: string; // YYYY-MM-DD format
  weekEndDate: string;
  scheduleData: WeekScheduleData;
  createdBy: number;
}

export interface UpdateScheduleInput {
  scheduleData?: WeekScheduleData;
  status?: ScheduleStatus;
}

export interface ScheduleFilters {
  userId?: number;
  teamId?: number;
  status?: ScheduleStatus;
  weekStartDate?: string;
  weekEndDate?: string;
  createdBy?: number;
  page?: number;
  pageSize?: number;
}

// ============================================================================
// CREATE
// ============================================================================

/**
 * Create a new schedule
 */
export async function createSchedule(input: CreateScheduleInput) {
  // Check for overlapping schedules
  const existing = await db
    .select()
    .from(weeklySchedules)
    .where(
      and(
        eq(weeklySchedules.userId, input.userId),
        or(
          and(
            lte(weeklySchedules.weekStartDate, input.weekStartDate),
            gte(weeklySchedules.weekEndDate, input.weekStartDate)
          ),
          and(
            lte(weeklySchedules.weekStartDate, input.weekEndDate),
            gte(weeklySchedules.weekEndDate, input.weekEndDate)
          )
        )
      )
    );

  if (existing.length > 0) {
    throw new Error("Schedule already exists for this week");
  }

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

  // Create history entry
  await createScheduleHistory({
    scheduleId: schedule.id,
    changeType: "created",
    newData: input.scheduleData,
    changedBy: input.createdBy,
  });

  return schedule;
}

// ============================================================================
// READ
// ============================================================================

/**
 * Get schedule by ID
 */
export async function getScheduleById(id: number) {
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
    .innerJoin(users, eq(weeklySchedules.userId, users.id))
    .where(eq(weeklySchedules.id, id))
    .limit(1);

  return schedule || null;
}

/**
 * Get schedules with filters and pagination
 */
export async function getSchedules(filters: ScheduleFilters = {}) {
  const {
    userId,
    teamId,
    status,
    weekStartDate,
    weekEndDate,
    createdBy,
    page = 1,
    pageSize = 10,
  } = filters;

  // Build where conditions
  const conditions = [];

  if (userId !== undefined) {
    conditions.push(eq(weeklySchedules.userId, userId));
  }

  if (teamId !== undefined) {
    conditions.push(eq(users.teamId, teamId));
  }

  if (status !== undefined) {
    conditions.push(eq(weeklySchedules.status, status));
  }

  if (weekStartDate !== undefined) {
    conditions.push(gte(weeklySchedules.weekStartDate, weekStartDate));
  }

  if (weekEndDate !== undefined) {
    conditions.push(lte(weeklySchedules.weekEndDate, weekEndDate));
  }

  if (createdBy !== undefined) {
    conditions.push(eq(weeklySchedules.createdBy, createdBy));
  }

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(weeklySchedules)
    .innerJoin(users, eq(weeklySchedules.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Get paginated schedules
  const schedulesList = await db
    .select({
      id: weeklySchedules.id,
      userId: weeklySchedules.userId,
      userName: users.fullName,
      userEmail: users.email,
      teamId: users.teamId,
      weekStartDate: weeklySchedules.weekStartDate,
      weekEndDate: weeklySchedules.weekEndDate,
      status: weeklySchedules.status,
      createdBy: weeklySchedules.createdBy,
      approvedBy: weeklySchedules.approvedBy,
      createdAt: weeklySchedules.createdAt,
    })
    .from(weeklySchedules)
    .innerJoin(users, eq(weeklySchedules.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(weeklySchedules.weekStartDate))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    data: schedulesList,
    pagination: {
      page,
      pageSize,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / pageSize),
    },
  };
}

/**
 * Get pending schedules (for approval)
 */
export async function getPendingSchedules() {
  return await db
    .select({
      id: weeklySchedules.id,
      userId: weeklySchedules.userId,
      userName: users.fullName,
      userEmail: users.email,
      teamId: users.teamId,
      weekStartDate: weeklySchedules.weekStartDate,
      weekEndDate: weeklySchedules.weekEndDate,
      createdBy: weeklySchedules.createdBy,
      createdAt: weeklySchedules.createdAt,
    })
    .from(weeklySchedules)
    .innerJoin(users, eq(weeklySchedules.userId, users.id))
    .where(eq(weeklySchedules.status, "pending_approval"))
    .orderBy(asc(weeklySchedules.createdAt));
}

/**
 * Get user schedule for specific week
 */
export async function getUserScheduleForWeek(
  userId: number,
  weekStartDate: string
) {
  const [schedule] = await db
    .select()
    .from(weeklySchedules)
    .where(
      and(
        eq(weeklySchedules.userId, userId),
        eq(weeklySchedules.weekStartDate, weekStartDate)
      )
    )
    .limit(1);

  return schedule || null;
}

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update schedule
 */
export async function updateSchedule(
  id: number,
  input: UpdateScheduleInput,
  updatedBy: number
) {
  // Get current schedule
  const current = await getScheduleById(id);
  if (!current) {
    throw new Error("Schedule not found");
  }

  // Check if approved schedule is being modified (only admin can modify)
  if (current.status === "approved") {
    throw new Error("Cannot modify approved schedule");
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (input.scheduleData !== undefined) {
    updateData.scheduleData = input.scheduleData;
  }

  if (input.status !== undefined) {
    updateData.status = input.status;
  }

  const [schedule] = await db
    .update(weeklySchedules)
    .set(updateData)
    .where(eq(weeklySchedules.id, id))
    .returning();

  // Create history entry
  await createScheduleHistory({
    scheduleId: id,
    changeType: "modified",
    oldData: current.scheduleData,
    newData: input.scheduleData || current.scheduleData,
    changedBy: updatedBy,
  });

  return schedule;
}

/**
 * Approve schedule
 */
export async function approveSchedule(id: number, approvedBy: number) {
  const [schedule] = await db
    .update(weeklySchedules)
    .set({
      status: "approved",
      approvedBy,
      approvalDate: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(weeklySchedules.id, id))
    .returning();

  // Create history entry
  await createScheduleHistory({
    scheduleId: id,
    changeType: "approved",
    changedBy: approvedBy,
  });

  return schedule;
}

/**
 * Reject schedule
 */
export async function rejectSchedule(
  id: number,
  rejectedBy: number,
  reason: string
) {
  const [schedule] = await db
    .update(weeklySchedules)
    .set({
      status: "rejected",
      approvedBy: rejectedBy,
      approvalDate: new Date(),
      rejectionReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(weeklySchedules.id, id))
    .returning();

  // Create history entry
  await createScheduleHistory({
    scheduleId: id,
    changeType: "rejected",
    changedBy: rejectedBy,
    reason,
  });

  return schedule;
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete schedule
 */
export async function deleteSchedule(id: number, deletedBy: number) {
  // Get schedule before deleting
  const schedule = await getScheduleById(id);
  if (!schedule) {
    throw new Error("Schedule not found");
  }

  // Only allow deletion of pending schedules
  if (schedule.status !== "pending_approval") {
    throw new Error("Can only delete pending schedules");
  }

  // Create history entry before deletion
  await createScheduleHistory({
    scheduleId: id,
    changeType: "deleted",
    changedBy: deletedBy,
  });

  await db.delete(weeklySchedules).where(eq(weeklySchedules.id, id));
}

// ============================================================================
// HISTORY
// ============================================================================

interface CreateHistoryInput {
  scheduleId: number;
  changeType: string;
  oldData?: any;
  newData?: any;
  changedBy: number;
  reason?: string;
}

async function createScheduleHistory(input: CreateHistoryInput) {
  await db.insert(scheduleHistory).values({
    scheduleId: input.scheduleId,
    changeType: input.changeType,
    oldData: input.oldData || null,
    newData: input.newData || null,
    changedBy: input.changedBy,
    reason: input.reason || null,
  });
}

/**
 * Get schedule history
 */
export async function getScheduleHistory(scheduleId: number) {
  return await db
    .select({
      id: scheduleHistory.id,
      changeType: scheduleHistory.changeType,
      oldData: scheduleHistory.oldData,
      newData: scheduleHistory.newData,
      changedBy: scheduleHistory.changedBy,
      changedByName: users.fullName,
      reason: scheduleHistory.reason,
      changedAt: scheduleHistory.changedAt,
    })
    .from(scheduleHistory)
    .innerJoin(users, eq(scheduleHistory.changedBy, users.id))
    .where(eq(scheduleHistory.scheduleId, scheduleId))
    .orderBy(desc(scheduleHistory.changedAt));
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get schedule statistics
 */
export async function getScheduleStats() {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      pending: sql<number>`count(*) filter (where ${weeklySchedules.status} = 'pending_approval')`,
      approved: sql<number>`count(*) filter (where ${weeklySchedules.status} = 'approved')`,
      rejected: sql<number>`count(*) filter (where ${weeklySchedules.status} = 'rejected')`,
    })
    .from(weeklySchedules);

  return {
    total: Number(stats?.total || 0),
    pending: Number(stats?.pending || 0),
    approved: Number(stats?.approved || 0),
    rejected: Number(stats?.rejected || 0),
  };
}
