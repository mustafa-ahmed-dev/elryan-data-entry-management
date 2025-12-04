/**
 * Evaluations Database Utilities
 * CRUD operations for quality evaluations
 */

import { db } from "../index";
import {
  qualityEvaluations,
  entries,
  users,
  evaluationRuleSets,
  evaluationRules,
} from "../schema";
import { eq, and, gte, lte, desc, asc, sql, inArray } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

export interface Violation {
  ruleId: number;
  ruleName: string;
  deduction: number;
}

export interface CreateEvaluationInput {
  entryId: number;
  evaluatorId: number;
  ruleSetId: number;
  totalScore: number;
  violations: Violation[];
  comments?: string | null;
}

export interface UpdateEvaluationInput {
  totalScore?: number;
  violations?: Violation[];
  comments?: string | null;
}

export interface EvaluationFilters {
  entryId?: number;
  employeeId?: number;
  evaluatorId?: number;
  teamId?: number;
  ruleSetId?: number;
  minScore?: number;
  maxScore?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "evaluatedAt" | "totalScore";
  sortOrder?: "asc" | "desc";
}

// ============================================================================
// CREATE
// ============================================================================

/**
 * Create a new evaluation
 */
export async function createEvaluation(input: CreateEvaluationInput) {
  // Check if entry already has an evaluation
  const existing = await db
    .select()
    .from(qualityEvaluations)
    .where(eq(qualityEvaluations.entryId, input.entryId))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Entry already has an evaluation");
  }

  const [evaluation] = await db
    .insert(qualityEvaluations)
    .values({
      entryId: input.entryId,
      evaluatorId: input.evaluatorId,
      ruleSetId: input.ruleSetId,
      totalScore: input.totalScore,
      violations: input.violations,
      comments: input.comments || null,
    })
    .returning();

  return evaluation;
}

/**
 * Bulk create evaluations
 */
export async function bulkCreateEvaluations(inputs: CreateEvaluationInput[]) {
  // Check for existing evaluations
  const entryIds = inputs.map((i) => i.entryId);
  const existing = await db
    .select({ entryId: qualityEvaluations.entryId })
    .from(qualityEvaluations)
    .where(inArray(qualityEvaluations.entryId, entryIds));

  const existingIds = new Set(existing.map((e) => e.entryId));
  const newEvaluations = inputs.filter((i) => !existingIds.has(i.entryId));

  if (newEvaluations.length === 0) {
    throw new Error("All entries already have evaluations");
  }

  const evaluationValues = newEvaluations.map((input) => ({
    entryId: input.entryId,
    evaluatorId: input.evaluatorId,
    ruleSetId: input.ruleSetId,
    totalScore: input.totalScore,
    violations: input.violations,
    comments: input.comments || null,
  }));

  const createdEvaluations = await db
    .insert(qualityEvaluations)
    .values(evaluationValues)
    .returning();

  return {
    created: createdEvaluations,
    skipped: existingIds.size,
  };
}

// ============================================================================
// READ
// ============================================================================

/**
 * Get evaluation by ID
 */
export async function getEvaluationById(id: number) {
  const [evaluation] = await db
    .select({
      id: qualityEvaluations.id,
      entryId: qualityEvaluations.entryId,
      evaluatorId: qualityEvaluations.evaluatorId,
      evaluatorName: users.fullName,
      ruleSetId: qualityEvaluations.ruleSetId,
      ruleSetName: evaluationRuleSets.name,
      totalScore: qualityEvaluations.totalScore,
      violations: qualityEvaluations.violations,
      comments: qualityEvaluations.comments,
      evaluatedAt: qualityEvaluations.evaluatedAt,
    })
    .from(qualityEvaluations)
    .innerJoin(users, eq(qualityEvaluations.evaluatorId, users.id))
    .innerJoin(
      evaluationRuleSets,
      eq(qualityEvaluations.ruleSetId, evaluationRuleSets.id)
    )
    .where(eq(qualityEvaluations.id, id))
    .limit(1);

  return evaluation || null;
}

/**
 * Get evaluation by entry ID
 */
export async function getEvaluationByEntryId(entryId: number) {
  const [evaluation] = await db
    .select({
      id: qualityEvaluations.id,
      entryId: qualityEvaluations.entryId,
      evaluatorId: qualityEvaluations.evaluatorId,
      evaluatorName: users.fullName,
      ruleSetId: qualityEvaluations.ruleSetId,
      ruleSetName: evaluationRuleSets.name,
      totalScore: qualityEvaluations.totalScore,
      violations: qualityEvaluations.violations,
      comments: qualityEvaluations.comments,
      evaluatedAt: qualityEvaluations.evaluatedAt,
    })
    .from(qualityEvaluations)
    .innerJoin(users, eq(qualityEvaluations.evaluatorId, users.id))
    .innerJoin(
      evaluationRuleSets,
      eq(qualityEvaluations.ruleSetId, evaluationRuleSets.id)
    )
    .where(eq(qualityEvaluations.entryId, entryId))
    .limit(1);

  return evaluation || null;
}

/**
 * Get evaluations with filters and pagination
 */
export async function getEvaluations(filters: EvaluationFilters = {}) {
  const {
    entryId,
    employeeId,
    evaluatorId,
    teamId,
    ruleSetId,
    minScore,
    maxScore,
    startDate,
    endDate,
    page = 1,
    pageSize = 20,
    sortBy = "evaluatedAt",
    sortOrder = "desc",
  } = filters;

  // Build where conditions
  const conditions = [];

  if (entryId !== undefined) {
    conditions.push(eq(qualityEvaluations.entryId, entryId));
  }

  if (employeeId !== undefined) {
    conditions.push(eq(entries.employeeId, employeeId));
  }

  if (evaluatorId !== undefined) {
    conditions.push(eq(qualityEvaluations.evaluatorId, evaluatorId));
  }

  if (teamId !== undefined) {
    conditions.push(eq(users.teamId, teamId));
  }

  if (ruleSetId !== undefined) {
    conditions.push(eq(qualityEvaluations.ruleSetId, ruleSetId));
  }

  if (minScore !== undefined) {
    conditions.push(gte(qualityEvaluations.totalScore, minScore));
  }

  if (maxScore !== undefined) {
    conditions.push(lte(qualityEvaluations.totalScore, maxScore));
  }

  if (startDate) {
    conditions.push(gte(qualityEvaluations.evaluatedAt, new Date(startDate)));
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(qualityEvaluations.evaluatedAt, end));
  }

  // Build sort
  const sortColumn = {
    evaluatedAt: qualityEvaluations.evaluatedAt,
    totalScore: qualityEvaluations.totalScore,
  }[sortBy];

  const orderFn = sortOrder === "asc" ? asc : desc;

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(qualityEvaluations)
    .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
    .innerJoin(users, eq(entries.employeeId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Get paginated evaluations
  const evaluationsList = await db
    .select({
      id: qualityEvaluations.id,
      entryId: qualityEvaluations.entryId,
      employeeId: entries.employeeId,
      employeeName: users.fullName,
      teamId: users.teamId,
      evaluatorId: qualityEvaluations.evaluatorId,
      totalScore: qualityEvaluations.totalScore,
      violations: qualityEvaluations.violations,
      comments: qualityEvaluations.comments,
      evaluatedAt: qualityEvaluations.evaluatedAt,
    })
    .from(qualityEvaluations)
    .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
    .innerJoin(users, eq(entries.employeeId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderFn(sortColumn))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    data: evaluationsList,
    pagination: {
      page,
      pageSize,
      total: Number(count),
      totalPages: Math.ceil(Number(count) / pageSize),
    },
  };
}

/**
 * Get employee evaluations
 */
export async function getEmployeeEvaluations(
  employeeId: number,
  filters?: { startDate?: string; endDate?: string; limit?: number }
) {
  const conditions = [eq(entries.employeeId, employeeId)];

  if (filters?.startDate) {
    conditions.push(
      gte(qualityEvaluations.evaluatedAt, new Date(filters.startDate))
    );
  }

  if (filters?.endDate) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(qualityEvaluations.evaluatedAt, end));
  }

  const query = db
    .select({
      id: qualityEvaluations.id,
      entryId: qualityEvaluations.entryId,
      totalScore: qualityEvaluations.totalScore,
      violations: qualityEvaluations.violations,
      comments: qualityEvaluations.comments,
      evaluatedAt: qualityEvaluations.evaluatedAt,
    })
    .from(qualityEvaluations)
    .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
    .where(and(...conditions))
    .orderBy(desc(qualityEvaluations.evaluatedAt));

  if (filters?.limit) {
    return await query.limit(filters.limit);
  }

  return await query;
}

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update evaluation by ID
 */
export async function updateEvaluation(
  id: number,
  input: UpdateEvaluationInput
) {
  const updateData: any = {};

  if (input.totalScore !== undefined) {
    updateData.totalScore = input.totalScore;
  }

  if (input.violations !== undefined) {
    updateData.violations = input.violations;
  }

  if (input.comments !== undefined) {
    updateData.comments = input.comments;
  }

  const [evaluation] = await db
    .update(qualityEvaluations)
    .set(updateData)
    .where(eq(qualityEvaluations.id, id))
    .returning();

  return evaluation;
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete evaluation by ID
 */
export async function deleteEvaluation(id: number) {
  await db.delete(qualityEvaluations).where(eq(qualityEvaluations.id, id));
}

/**
 * Delete evaluations by entry IDs
 */
export async function deleteEvaluationsByEntries(entryIds: number[]) {
  await db
    .delete(qualityEvaluations)
    .where(inArray(qualityEvaluations.entryId, entryIds));
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get evaluation statistics
 */
export async function getEvaluationStats(filters?: {
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
    conditions.push(
      gte(qualityEvaluations.evaluatedAt, new Date(filters.startDate))
    );
  }

  if (filters?.endDate) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(qualityEvaluations.evaluatedAt, end));
  }

  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      avgScore: sql<number>`avg(${qualityEvaluations.totalScore})`,
      minScore: sql<number>`min(${qualityEvaluations.totalScore})`,
      maxScore: sql<number>`max(${qualityEvaluations.totalScore})`,
      perfectScores: sql<number>`count(*) filter (where ${qualityEvaluations.totalScore} = 100)`,
    })
    .from(qualityEvaluations)
    .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
    .innerJoin(users, eq(entries.employeeId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    total: Number(stats?.total || 0),
    avgScore: Math.round(Number(stats?.avgScore || 0)),
    minScore: Number(stats?.minScore || 0),
    maxScore: Number(stats?.maxScore || 0),
    perfectScores: Number(stats?.perfectScores || 0),
  };
}

/**
 * Get quality trends over time
 */
export async function getQualityTrends(
  startDate: string,
  endDate: string,
  filters?: { employeeId?: number; teamId?: number }
) {
  const conditions = [
    gte(qualityEvaluations.evaluatedAt, new Date(startDate)),
    lte(qualityEvaluations.evaluatedAt, new Date(endDate)),
  ];

  if (filters?.employeeId) {
    conditions.push(eq(entries.employeeId, filters.employeeId));
  }

  if (filters?.teamId) {
    conditions.push(eq(users.teamId, filters.teamId));
  }

  return await db
    .select({
      date: sql<string>`DATE(${qualityEvaluations.evaluatedAt})`,
      avgScore: sql<number>`avg(${qualityEvaluations.totalScore})`,
      count: sql<number>`count(*)`,
    })
    .from(qualityEvaluations)
    .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
    .innerJoin(users, eq(entries.employeeId, users.id))
    .where(and(...conditions))
    .groupBy(sql`DATE(${qualityEvaluations.evaluatedAt})`)
    .orderBy(sql`DATE(${qualityEvaluations.evaluatedAt})`);
}

/**
 * Get top performers by quality score
 */
export async function getTopPerformersByQuality(
  limit: number = 10,
  filters?: { startDate?: string; endDate?: string; teamId?: number }
) {
  const conditions = [];

  if (filters?.startDate) {
    conditions.push(
      gte(qualityEvaluations.evaluatedAt, new Date(filters.startDate))
    );
  }

  if (filters?.endDate) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(qualityEvaluations.evaluatedAt, end));
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
      avgScore: sql<number>`avg(${qualityEvaluations.totalScore})`,
      evaluationCount: sql<number>`count(*)`,
    })
    .from(qualityEvaluations)
    .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
    .innerJoin(users, eq(entries.employeeId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(entries.employeeId, users.fullName, users.email, users.teamId)
    .orderBy(desc(sql`avg(${qualityEvaluations.totalScore})`))
    .limit(limit);
}

/**
 * Get most common violations
 */
export async function getMostCommonViolations(filters?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const conditions = [];

  if (filters?.startDate) {
    conditions.push(
      gte(qualityEvaluations.evaluatedAt, new Date(filters.startDate))
    );
  }

  if (filters?.endDate) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(qualityEvaluations.evaluatedAt, end));
  }

  // This is a simplified version - you'd need to unnest JSON for real implementation
  const evaluations = await db
    .select({
      violations: qualityEvaluations.violations,
    })
    .from(qualityEvaluations)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Count violations
  const violationCounts = new Map<
    string,
    { count: number; totalDeduction: number }
  >();

  for (const evaluation of evaluations) {
    const violations = evaluation.violations as Violation[];
    for (const violation of violations) {
      const key = `${violation.ruleId}-${violation.ruleName}`;
      const current = violationCounts.get(key) || {
        count: 0,
        totalDeduction: 0,
      };
      violationCounts.set(key, {
        count: current.count + 1,
        totalDeduction: current.totalDeduction + violation.deduction,
      });
    }
  }

  // Convert to array and sort
  const result = Array.from(violationCounts.entries())
    .map(([key, data]) => {
      const [ruleId, ruleName] = key.split("-");
      return {
        ruleId: parseInt(ruleId),
        ruleName,
        count: data.count,
        totalDeduction: data.totalDeduction,
        avgDeduction: Math.round(data.totalDeduction / data.count),
      };
    })
    .sort((a, b) => b.count - a.count);

  return filters?.limit ? result.slice(0, filters.limit) : result;
}
