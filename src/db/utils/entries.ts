/**
 * Entries Database Utilities
 * CRUD operations for data entries
 */

import { db } from "../index";
import { entries, users, entryTypes, qualityEvaluations } from "../schema";
import { eq, and, gte, lte, desc, asc, sql, between } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

export interface CreateEntryInput {
  employeeId: number;
  entryTypeId: number;
  sku: string;
  entryTime?: Date;
}

export interface UpdateEntryInput {
  sku?: string;
  entryTypeId?: number;
}

export interface EntryFilters {
  employeeId?: number;
  teamId?: number;
  entryTypeId?: number;
  startDate?: string;
  endDate?: string;
  date?: string; // Specific date
  hasEvaluation?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: "entryTime" | "sku";
  sortOrder?: "asc" | "desc";
}

export interface EntryWithDetails {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeEmail: string;
  teamId: number | null;
  entryTypeId: number;
  entryTypeName: string;
  sku: string;
  entryTime: Date;
  hasEvaluation: boolean;
  evaluationScore: number | null;
}

// ============================================================================
// CREATE
// ============================================================================

/**
 * Create a new entry
 */
export async function createEntry(input: CreateEntryInput) {
  const [entry] = await db
    .insert(entries)
    .values({
      employeeId: input.employeeId,
      entryTypeId: input.entryTypeId,
      sku: input.sku,
      entryTime: input.entryTime || new Date(),
    })
    .returning();

  return entry;
}

/**
 * Bulk create entries
 */
export async function bulkCreateEntries(inputs: CreateEntryInput[]) {
  const entryValues = inputs.map((input) => ({
    employeeId: input.employeeId,
    entryTypeId: input.entryTypeId,
    sku: input.sku,
    entryTime: input.entryTime || new Date(),
  }));

  const createdEntries = await db
    .insert(entries)
    .values(entryValues)
    .returning();

  return createdEntries;
}

// ============================================================================
// READ
// ============================================================================

/**
 * Get entry by ID with full details
 */
export async function getEntryById(
  entryId: number
): Promise<EntryWithDetails | null> {
  const result = await db
    .select({
      id: entries.id,
      employeeId: entries.employeeId,
      employeeName: users.fullName,
      employeeEmail: users.email,
      teamId: users.teamId,
      entryTypeId: entries.entryTypeId,
      entryTypeName: entryTypes.name,
      sku: entries.sku,
      entryTime: entries.entryTime,
      hasEvaluation: sql<boolean>`EXISTS (
        SELECT 1 FROM ${qualityEvaluations}
        WHERE ${qualityEvaluations.entryId} = ${entries.id}
      )`,
      evaluationScore: sql<number | null>`(
        SELECT ${qualityEvaluations.totalScore}
        FROM ${qualityEvaluations}
        WHERE ${qualityEvaluations.entryId} = ${entries.id}
        LIMIT 1
      )`,
    })
    .from(entries)
    .innerJoin(users, eq(entries.employeeId, users.id))
    .innerJoin(entryTypes, eq(entries.entryTypeId, entryTypes.id))
    .where(eq(entries.id, entryId))
    .limit(1);

  return result[0] || null;
}

/**
 * Get entries with filters and pagination
 */
export async function getEntries(filters: EntryFilters = {}) {
  const {
    employeeId,
    teamId,
    entryTypeId,
    startDate,
    endDate,
    date,
    hasEvaluation,
    page = 1,
    pageSize = 50,
    sortBy = "entryTime",
    sortOrder = "desc",
  } = filters;

  // Build WHERE conditions
  const conditions = [];

  if (employeeId) {
    conditions.push(eq(entries.employeeId, employeeId));
  }

  if (teamId) {
    conditions.push(eq(users.teamId, teamId));
  }

  if (entryTypeId) {
    conditions.push(eq(entries.entryTypeId, entryTypeId));
  }

  // Date filtering
  if (date) {
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);
    conditions.push(between(entries.entryTime, dateStart, dateEnd));
  } else {
    if (startDate) {
      conditions.push(gte(entries.entryTime, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(entries.entryTime, new Date(endDate)));
    }
  }

  // Evaluation filter
  if (hasEvaluation !== undefined) {
    if (hasEvaluation) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${qualityEvaluations}
          WHERE ${qualityEvaluations.entryId} = ${entries.id}
        )`
      );
    } else {
      conditions.push(
        sql`NOT EXISTS (
          SELECT 1 FROM ${qualityEvaluations}
          WHERE ${qualityEvaluations.entryId} = ${entries.id}
        )`
      );
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(entries)
    .innerJoin(users, eq(entries.employeeId, users.id))
    .where(whereClause);

  // Get paginated data
  const offset = (page - 1) * pageSize;
  const orderColumn = sortBy === "sku" ? entries.sku : entries.entryTime;
  const orderDirection = sortOrder === "asc" ? asc : desc;

  const results = await db
    .select({
      id: entries.id,
      employeeId: entries.employeeId,
      employeeName: users.fullName,
      employeeEmail: users.email,
      teamId: users.teamId,
      entryTypeId: entries.entryTypeId,
      entryTypeName: entryTypes.name,
      sku: entries.sku,
      entryTime: entries.entryTime,
      hasEvaluation: sql<boolean>`EXISTS (
        SELECT 1 FROM ${qualityEvaluations}
        WHERE ${qualityEvaluations.entryId} = ${entries.id}
      )`,
      evaluationScore: sql<number | null>`(
        SELECT ${qualityEvaluations.totalScore}
        FROM ${qualityEvaluations}
        WHERE ${qualityEvaluations.entryId} = ${entries.id}
        LIMIT 1
      )`,
    })
    .from(entries)
    .innerJoin(users, eq(entries.employeeId, users.id))
    .innerJoin(entryTypes, eq(entries.entryTypeId, entryTypes.id))
    .where(whereClause)
    .orderBy(orderDirection(orderColumn))
    .limit(pageSize)
    .offset(offset);

  return {
    data: results,
    pagination: {
      page,
      pageSize,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / pageSize),
    },
  };
}

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update an entry
 */
export async function updateEntry(entryId: number, input: UpdateEntryInput) {
  const [updated] = await db
    .update(entries)
    .set(input)
    .where(eq(entries.id, entryId))
    .returning();

  return updated;
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete an entry
 */
export async function deleteEntry(entryId: number) {
  const [deleted] = await db
    .delete(entries)
    .where(eq(entries.id, entryId))
    .returning();

  return deleted;
}

/**
 * Bulk delete entries
 */
export async function bulkDeleteEntries(entryIds: number[]) {
  const deleted = await db
    .delete(entries)
    .where(sql`${entries.id} = ANY(${entryIds})`)
    .returning();

  return deleted;
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get entry statistics for a given period
 */
export async function getEntryStats(filters: {
  employeeId?: number;
  teamId?: number;
  startDate?: string;
  endDate?: string;
}) {
  const { employeeId, teamId, startDate, endDate } = filters;

  // Build WHERE conditions
  const conditions = [];

  if (employeeId) {
    conditions.push(eq(entries.employeeId, employeeId));
  }

  if (teamId) {
    conditions.push(eq(users.teamId, teamId));
  }

  if (startDate) {
    conditions.push(gte(entries.entryTime, new Date(startDate)));
  }

  if (endDate) {
    conditions.push(lte(entries.entryTime, new Date(endDate)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total entries count
  const [{ totalEntries }] = await db
    .select({ totalEntries: sql<number>`count(*)` })
    .from(entries)
    .innerJoin(users, eq(entries.employeeId, users.id))
    .where(whereClause);

  // Get entries by type
  const entriesByType = await db
    .select({
      entryTypeId: entries.entryTypeId,
      entryTypeName: entryTypes.name,
      count: sql<number>`count(*)`,
    })
    .from(entries)
    .innerJoin(users, eq(entries.employeeId, users.id))
    .innerJoin(entryTypes, eq(entries.entryTypeId, entryTypes.id))
    .where(whereClause)
    .groupBy(entries.entryTypeId, entryTypes.name);

  // Get entries with evaluations
  const [{ evaluatedEntries }] = await db
    .select({ evaluatedEntries: sql<number>`count(*)` })
    .from(entries)
    .innerJoin(users, eq(entries.employeeId, users.id))
    .where(
      whereClause
        ? and(
            whereClause,
            sql`EXISTS (
              SELECT 1 FROM ${qualityEvaluations}
              WHERE ${qualityEvaluations.entryId} = ${entries.id}
            )`
          )
        : sql`EXISTS (
            SELECT 1 FROM ${qualityEvaluations}
            WHERE ${qualityEvaluations.entryId} = ${entries.id}
          )`
    );

  // Get average evaluation score
  const [{ avgScore }] = await db
    .select({
      avgScore: sql<number>`COALESCE(AVG(${qualityEvaluations.totalScore}), 0)`,
    })
    .from(qualityEvaluations)
    .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
    .innerJoin(users, eq(entries.employeeId, users.id))
    .where(whereClause);

  return {
    totalEntries: Number(totalEntries),
    evaluatedEntries: Number(evaluatedEntries),
    unevaluatedEntries: Number(totalEntries) - Number(evaluatedEntries),
    averageScore: Number(avgScore) || 0,
    entriesByType: entriesByType.map((item) => ({
      entryTypeId: item.entryTypeId,
      entryTypeName: item.entryTypeName,
      count: Number(item.count),
    })),
  };
}
