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
} from "../schema";
import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";

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
 * Create multiple evaluations at once (bulk)
 */
export async function createBulkEvaluations(inputs: CreateEvaluationInput[]) {
  const evaluations = await db
    .insert(qualityEvaluations)
    .values(
      inputs.map((input) => ({
        entryId: input.entryId,
        evaluatorId: input.evaluatorId,
        ruleSetId: input.ruleSetId,
        totalScore: input.totalScore,
        violations: input.violations,
        comments: input.comments || null,
      }))
    )
    .returning();

  return evaluations;
}

// ============================================================================
// READ
// ============================================================================

/**
 * Get evaluation by ID with related data
 */
export async function getEvaluationById(id: number) {
  const [evaluation] = await db
    .select({
      id: qualityEvaluations.id,
      entryId: qualityEvaluations.entryId,
      employeeId: entries.employeeId,
      employeeName: users.fullName,
      evaluatorId: qualityEvaluations.evaluatorId,
      ruleSetId: qualityEvaluations.ruleSetId,
      ruleSetName: evaluationRuleSets.name,
      totalScore: qualityEvaluations.totalScore,
      violations: qualityEvaluations.violations,
      comments: qualityEvaluations.comments,
      evaluatedAt: qualityEvaluations.evaluatedAt,
    })
    .from(qualityEvaluations)
    .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
    .innerJoin(users, eq(entries.employeeId, users.id))
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
      employeeId: entries.employeeId,
      employeeName: users.fullName,
      evaluatorId: qualityEvaluations.evaluatorId,
      ruleSetId: qualityEvaluations.ruleSetId,
      ruleSetName: evaluationRuleSets.name,
      totalScore: qualityEvaluations.totalScore,
      violations: qualityEvaluations.violations,
      comments: qualityEvaluations.comments,
      evaluatedAt: qualityEvaluations.evaluatedAt,
    })
    .from(qualityEvaluations)
    .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
    .innerJoin(users, eq(entries.employeeId, users.id))
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

  const [updated] = await db
    .update(qualityEvaluations)
    .set(updateData)
    .where(eq(qualityEvaluations.id, id))
    .returning();

  if (!updated) {
    throw new Error("Evaluation not found");
  }

  return updated;
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete evaluation by ID
 */
export async function deleteEvaluation(id: number) {
  const [deleted] = await db
    .delete(qualityEvaluations)
    .where(eq(qualityEvaluations.id, id))
    .returning();

  if (!deleted) {
    throw new Error("Evaluation not found");
  }

  return deleted;
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get evaluation statistics for an employee
 */
export async function getEmployeeEvaluationStats(employeeId: number) {
  const [stats] = await db
    .select({
      totalEvaluations: sql<number>`count(${qualityEvaluations.id})`,
      averageScore: sql<number>`avg(${qualityEvaluations.totalScore})`,
      highestScore: sql<number>`max(${qualityEvaluations.totalScore})`,
      lowestScore: sql<number>`min(${qualityEvaluations.totalScore})`,
    })
    .from(qualityEvaluations)
    .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
    .where(eq(entries.employeeId, employeeId));

  return {
    totalEvaluations: Number(stats?.totalEvaluations || 0),
    averageScore: Number(stats?.averageScore || 0),
    highestScore: Number(stats?.highestScore || 0),
    lowestScore: Number(stats?.lowestScore || 0),
  };
}

/**
 * Get evaluation statistics for a team
 */
export async function getTeamEvaluationStats(teamId: number) {
  const [stats] = await db
    .select({
      totalEvaluations: sql<number>`count(${qualityEvaluations.id})`,
      averageScore: sql<number>`avg(${qualityEvaluations.totalScore})`,
      highestScore: sql<number>`max(${qualityEvaluations.totalScore})`,
      lowestScore: sql<number>`min(${qualityEvaluations.totalScore})`,
    })
    .from(qualityEvaluations)
    .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
    .innerJoin(users, eq(entries.employeeId, users.id))
    .where(eq(users.teamId, teamId));

  return {
    totalEvaluations: Number(stats?.totalEvaluations || 0),
    averageScore: Number(stats?.averageScore || 0),
    highestScore: Number(stats?.highestScore || 0),
    lowestScore: Number(stats?.lowestScore || 0),
  };
}

// ============================================================================
// REPORTS & ANALYTICS
// ============================================================================

/**
 * Get general evaluation statistics with filters
 */
export async function getEvaluationStats(filters: {
  employeeId?: number;
  teamId?: number;
  startDate?: string;
  endDate?: string;
}) {
  const { employeeId, teamId, startDate, endDate } = filters;

  // Build where conditions
  const conditions = [];

  if (employeeId !== undefined) {
    conditions.push(eq(entries.employeeId, employeeId));
  }

  if (teamId !== undefined) {
    conditions.push(eq(users.teamId, teamId));
  }

  if (startDate) {
    conditions.push(gte(qualityEvaluations.evaluatedAt, new Date(startDate)));
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(qualityEvaluations.evaluatedAt, end));
  }

  const [stats] = await db
    .select({
      totalEvaluations: sql<number>`count(${qualityEvaluations.id})`,
      averageScore: sql<number>`avg(${qualityEvaluations.totalScore})`,
      highestScore: sql<number>`max(${qualityEvaluations.totalScore})`,
      lowestScore: sql<number>`min(${qualityEvaluations.totalScore})`,
    })
    .from(qualityEvaluations)
    .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
    .innerJoin(users, eq(entries.employeeId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    totalEvaluations: Number(stats?.totalEvaluations || 0),
    averageScore: Number(stats?.averageScore || 0),
    highestScore: Number(stats?.highestScore || 0),
    lowestScore: Number(stats?.lowestScore || 0),
  };
}

/**
 * Get quality trends over time (daily averages)
 */
export async function getQualityTrends(
  startDate: string,
  endDate: string,
  filters: {
    employeeId?: number;
    teamId?: number;
  } = {}
) {
  const { employeeId, teamId } = filters;

  // Build where conditions
  const conditions = [gte(qualityEvaluations.evaluatedAt, new Date(startDate))];

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  conditions.push(lte(qualityEvaluations.evaluatedAt, end));

  if (employeeId !== undefined) {
    conditions.push(eq(entries.employeeId, employeeId));
  }

  if (teamId !== undefined) {
    conditions.push(eq(users.teamId, teamId));
  }

  const trends = await db
    .select({
      date: sql<string>`DATE(${qualityEvaluations.evaluatedAt})`,
      averageScore: sql<number>`avg(${qualityEvaluations.totalScore})`,
      totalEvaluations: sql<number>`count(${qualityEvaluations.id})`,
      highestScore: sql<number>`max(${qualityEvaluations.totalScore})`,
      lowestScore: sql<number>`min(${qualityEvaluations.totalScore})`,
    })
    .from(qualityEvaluations)
    .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
    .innerJoin(users, eq(entries.employeeId, users.id))
    .where(and(...conditions))
    .groupBy(sql`DATE(${qualityEvaluations.evaluatedAt})`)
    .orderBy(sql`DATE(${qualityEvaluations.evaluatedAt})`);

  return trends.map((trend) => ({
    date: trend.date,
    averageScore: Number(trend.averageScore || 0),
    totalEvaluations: Number(trend.totalEvaluations || 0),
    highestScore: Number(trend.highestScore || 0),
    lowestScore: Number(trend.lowestScore || 0),
  }));
}

/**
 * Get top performers by quality score
 */
export async function getTopPerformersByQuality(
  limit: number,
  filters: {
    teamId?: number;
    startDate?: string;
    endDate?: string;
  } = {}
) {
  const { teamId, startDate, endDate } = filters;

  // Build where conditions
  const conditions = [];

  if (teamId !== undefined) {
    conditions.push(eq(users.teamId, teamId));
  }

  if (startDate) {
    conditions.push(gte(qualityEvaluations.evaluatedAt, new Date(startDate)));
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(qualityEvaluations.evaluatedAt, end));
  }

  const performers = await db
    .select({
      employeeId: entries.employeeId,
      employeeName: users.fullName,
      employeeEmail: users.email,
      teamId: users.teamId,
      averageScore: sql<number>`avg(${qualityEvaluations.totalScore})`,
      totalEvaluations: sql<number>`count(${qualityEvaluations.id})`,
      highestScore: sql<number>`max(${qualityEvaluations.totalScore})`,
      lowestScore: sql<number>`min(${qualityEvaluations.totalScore})`,
    })
    .from(qualityEvaluations)
    .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
    .innerJoin(users, eq(entries.employeeId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(entries.employeeId, users.fullName, users.email, users.teamId)
    .orderBy(desc(sql`avg(${qualityEvaluations.totalScore})`))
    .limit(limit);

  return performers.map((performer) => ({
    employeeId: performer.employeeId,
    employeeName: performer.employeeName,
    employeeEmail: performer.employeeEmail,
    teamId: performer.teamId,
    averageScore: Number(performer.averageScore || 0),
    totalEvaluations: Number(performer.totalEvaluations || 0),
    highestScore: Number(performer.highestScore || 0),
    lowestScore: Number(performer.lowestScore || 0),
  }));
}
