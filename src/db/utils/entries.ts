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
  productName: string;
  productDescription?: string | null;
  followsNamingConvention?: boolean;
  followsSpecificationOrder?: boolean;
  containsUnwantedKeywords?: boolean;
  entryTime?: Date;
}

export interface UpdateEntryInput {
  productName?: string;
  productDescription?: string | null;
  followsNamingConvention?: boolean;
  followsSpecificationOrder?: boolean;
  containsUnwantedKeywords?: boolean;
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
  sortBy?: "entryTime" | "productName";
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
  productName: string;
  productDescription: string | null;
  followsNamingConvention: boolean;
  followsSpecificationOrder: boolean;
  containsUnwantedKeywords: boolean;
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
      productName: input.productName,
      productDescription: input.productDescription || null,
      followsNamingConvention: input.followsNamingConvention ?? true,
      followsSpecificationOrder: input.followsSpecificationOrder ?? true,
      containsUnwantedKeywords: input.containsUnwantedKeywords ?? false,
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
    productName: input.productName,
    productDescription: input.productDescription || null,
    followsNamingConvention: input.followsNamingConvention ?? true,
    followsSpecificationOrder: input.followsSpecificationOrder ?? true,
    containsUnwantedKeywords: input.containsUnwantedKeywords ?? false,
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
 * Get entry by ID
 */
export async function getEntryById(id: number) {
  const [entry] = await db
    .select({
      id: entries.id,
      employeeId: entries.employeeId,
      employeeName: users.fullName,
      employeeEmail: users.email,
      teamId: users.teamId,
      entryTypeId: entries.entryTypeId,
      entryTypeName: entryTypes.name,
      entryTypeDescription: entryTypes.description,
      productName: entries.productName,
      productDescription: entries.productDescription,
      followsNamingConvention: entries.followsNamingConvention,
      followsSpecificationOrder: entries.followsSpecificationOrder,
      containsUnwantedKeywords: entries.containsUnwantedKeywords,
      entryTime: entries.entryTime,
    })
    .from(entries)
    .innerJoin(users, eq(entries.employeeId, users.id))
    .innerJoin(entryTypes, eq(entries.entryTypeId, entryTypes.id))
    .where(eq(entries.id, id))
    .limit(1);

  return entry || null;
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
    pageSize = 20,
    sortBy = "entryTime",
    sortOrder = "desc",
  } = filters;

  // Build where conditions
  const conditions = [];

  if (employeeId !== undefined) {
    conditions.push(eq(entries.employeeId, employeeId));
  }

  if (teamId !== undefined) {
    conditions.push(eq(users.teamId, teamId));
  }

  if (entryTypeId !== undefined) {
    conditions.push(eq(entries.entryTypeId, entryTypeId));
  }

  if (date) {
    // Specific date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    conditions.push(between(entries.entryTime, startOfDay, endOfDay));
  } else {
    // Date range
    if (startDate) {
      conditions.push(gte(entries.entryTime, new Date(startDate)));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(entries.entryTime, end));
    }
  }

  // Build sort
  const sortColumn = {
    entryTime: entries.entryTime,
    productName: entries.productName,
  }[sortBy];

  const orderFn = sortOrder === "asc" ? asc : desc;

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(entries)
    .innerJoin(users, eq(entries.employeeId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Get paginated entries
  const entriesList = await db
    .select({
      id: entries.id,
      employeeId: entries.employeeId,
      employeeName: users.fullName,
      employeeEmail: users.email,
      teamId: users.teamId,
      entryTypeId: entries.entryTypeId,
      entryTypeName: entryTypes.name,
      productName: entries.productName,
      productDescription: entries.productDescription,
      followsNamingConvention: entries.followsNamingConvention,
      followsSpecificationOrder: entries.followsSpecificationOrder,
      containsUnwantedKeywords: entries.containsUnwantedKeywords,
      entryTime: entries.entryTime,
      evaluationId: qualityEvaluations.id,
      evaluationScore: qualityEvaluations.totalScore,
    })
    .from(entries)
    .innerJoin(users, eq(entries.employeeId, users.id))
    .innerJoin(entryTypes, eq(entries.entryTypeId, entryTypes.id))
    .leftJoin(qualityEvaluations, eq(entries.id, qualityEvaluations.entryId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderFn(sortColumn))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  // Filter by evaluation status if needed
  let filteredList = entriesList;
  if (hasEvaluation !== undefined) {
    filteredList = entriesList.filter((entry) =>
      hasEvaluation ? entry.evaluationId !== null : entry.evaluationId === null
    );
  }

  return {
    data: filteredList.map((entry) => ({
      ...entry,
      hasEvaluation: entry.evaluationId !== null,
    })),
    pagination: {
      page,
      pageSize,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / pageSize),
    },
  };
}

/**
 * Get entries by employee for a specific date
 */
export async function getEmployeeEntriesForDate(
  employeeId: number,
  date: string
) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return await db
    .select({
      id: entries.id,
      entryTypeId: entries.entryTypeId,
      entryTypeName: entryTypes.name,
      productName: entries.productName,
      productDescription: entries.productDescription,
      entryTime: entries.entryTime,
      hasEvaluation: sql<boolean>`${qualityEvaluations.id} IS NOT NULL`,
    })
    .from(entries)
    .innerJoin(entryTypes, eq(entries.entryTypeId, entryTypes.id))
    .leftJoin(qualityEvaluations, eq(entries.id, qualityEvaluations.entryId))
    .where(
      and(
        eq(entries.employeeId, employeeId),
        between(entries.entryTime, startOfDay, endOfDay)
      )
    )
    .orderBy(desc(entries.entryTime));
}

/**
 * Get unevaluated entries
 */
export async function getUnevaluatedEntries(filters: {
  employeeId?: number;
  teamId?: number;
  limit?: number;
}) {
  const { employeeId, teamId, limit = 50 } = filters;

  const conditions = [sql`${qualityEvaluations.id} IS NULL`];

  if (employeeId) {
    conditions.push(eq(entries.employeeId, employeeId));
  }

  if (teamId) {
    conditions.push(eq(users.teamId, teamId));
  }

  return await db
    .select({
      id: entries.id,
      employeeId: entries.employeeId,
      employeeName: users.fullName,
      teamId: users.teamId,
      entryTypeId: entries.entryTypeId,
      entryTypeName: entryTypes.name,
      productName: entries.productName,
      entryTime: entries.entryTime,
    })
    .from(entries)
    .innerJoin(users, eq(entries.employeeId, users.id))
    .innerJoin(entryTypes, eq(entries.entryTypeId, entryTypes.id))
    .leftJoin(qualityEvaluations, eq(entries.id, qualityEvaluations.entryId))
    .where(and(...conditions))
    .orderBy(asc(entries.entryTime))
    .limit(limit);
}

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update entry by ID
 */
export async function updateEntry(id: number, input: UpdateEntryInput) {
  const updateData: any = {};

  if (input.productName !== undefined) {
    updateData.productName = input.productName;
  }

  if (input.productDescription !== undefined) {
    updateData.productDescription = input.productDescription;
  }

  if (input.followsNamingConvention !== undefined) {
    updateData.followsNamingConvention = input.followsNamingConvention;
  }

  if (input.followsSpecificationOrder !== undefined) {
    updateData.followsSpecificationOrder = input.followsSpecificationOrder;
  }

  if (input.containsUnwantedKeywords !== undefined) {
    updateData.containsUnwantedKeywords = input.containsUnwantedKeywords;
  }

  const [entry] = await db
    .update(entries)
    .set(updateData)
    .where(eq(entries.id, id))
    .returning();

  return entry;
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete entry by ID
 * Note: This will also delete associated evaluations (cascade)
 */
export async function deleteEntry(id: number) {
  await db.delete(entries).where(eq(entries.id, id));
}

/**
 * Bulk delete entries
 */
export async function bulkDeleteEntries(ids: number[]) {
  for (const id of ids) {
    await deleteEntry(id);
  }
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get entry statistics
 */
export async function getEntryStats(filters?: {
  employeeId?: number;
  teamId?: number;
  startDate?: string;
  endDate?: string;
}) {
  const conditions = [];

  if (filters?.employeeId) {
    conditions.push(eq(entries.employeeId, filters.employeeId));
  }

  if (filters?.teamId) {
    conditions.push(eq(users.teamId, filters.teamId));
  }

  if (filters?.startDate) {
    conditions.push(gte(entries.entryTime, new Date(filters.startDate)));
  }

  if (filters?.endDate) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(entries.entryTime, end));
  }

  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      evaluated: sql<number>`count(${qualityEvaluations.id})`,
      unevaluated: sql<number>`count(*) - count(${qualityEvaluations.id})`,
      avgNamingConvention: sql<number>`avg(case when ${entries.followsNamingConvention} then 1 else 0 end)`,
      avgSpecificationOrder: sql<number>`avg(case when ${entries.followsSpecificationOrder} then 1 else 0 end)`,
      avgUnwantedKeywords: sql<number>`avg(case when ${entries.containsUnwantedKeywords} then 1 else 0 end)`,
    })
    .from(entries)
    .innerJoin(users, eq(entries.employeeId, users.id))
    .leftJoin(qualityEvaluations, eq(entries.id, qualityEvaluations.entryId))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    total: Number(stats?.total || 0),
    evaluated: Number(stats?.evaluated || 0),
    unevaluated: Number(stats?.unevaluated || 0),
    namingConventionRate: Math.round(
      Number(stats?.avgNamingConvention || 0) * 100
    ),
    specificationOrderRate: Math.round(
      Number(stats?.avgSpecificationOrder || 0) * 100
    ),
    unwantedKeywordsRate: Math.round(
      Number(stats?.avgUnwantedKeywords || 0) * 100
    ),
  };
}

/**
 * Get daily entry count for a date range
 */
export async function getDailyEntryCounts(
  startDate: string,
  endDate: string,
  filters?: { employeeId?: number; teamId?: number }
) {
  const conditions = [
    gte(entries.entryTime, new Date(startDate)),
    lte(entries.entryTime, new Date(endDate)),
  ];

  if (filters?.employeeId) {
    conditions.push(eq(entries.employeeId, filters.employeeId));
  }

  if (filters?.teamId) {
    conditions.push(eq(users.teamId, filters.teamId));
  }

  return await db
    .select({
      date: sql<string>`DATE(${entries.entryTime})`,
      count: sql<number>`count(*)`,
    })
    .from(entries)
    .innerJoin(users, eq(entries.employeeId, users.id))
    .where(and(...conditions))
    .groupBy(sql`DATE(${entries.entryTime})`)
    .orderBy(sql`DATE(${entries.entryTime})`);
}

/**
 * Get entry count by type
 */
export async function getEntryCountByType(filters?: {
  startDate?: string;
  endDate?: string;
}) {
  const conditions = [];

  if (filters?.startDate) {
    conditions.push(gte(entries.entryTime, new Date(filters.startDate)));
  }

  if (filters?.endDate) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(entries.entryTime, end));
  }

  return await db
    .select({
      entryTypeId: entries.entryTypeId,
      entryTypeName: entryTypes.name,
      count: sql<number>`count(*)`,
    })
    .from(entries)
    .innerJoin(entryTypes, eq(entries.entryTypeId, entryTypes.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(entries.entryTypeId, entryTypes.name)
    .orderBy(desc(sql`count(*)`));
}

/**
 * Get top performers by entry count
 */
export async function getTopPerformersByEntryCount(
  limit: number = 10,
  filters?: { startDate?: string; endDate?: string; teamId?: number }
) {
  const conditions = [];

  if (filters?.startDate) {
    conditions.push(gte(entries.entryTime, new Date(filters.startDate)));
  }

  if (filters?.endDate) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(entries.entryTime, end));
  }

  if (filters?.teamId) {
    conditions.push(eq(users.teamId, filters.teamId));
  }

  return await db
    .select({
      employeeId: entries.employeeId,
      employeeName: users.fullName,
      employeeEmail: users.email,
      teamId: users.teamId,
      entryCount: sql<number>`count(*)`,
    })
    .from(entries)
    .innerJoin(users, eq(entries.employeeId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(entries.employeeId, users.fullName, users.email, users.teamId)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}
