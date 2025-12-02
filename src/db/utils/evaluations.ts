import { db } from "../index";
import {
  qualityEvaluations,
  entries,
  users,
  evaluationRuleSets,
} from "../schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

// ============================================================================
// TYPE DEFINITIONS
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
  comments?: string;
  evaluatedAt?: Date;
}

export interface EvaluationWithDetails {
  id: number;
  entryId: number;
  evaluatorId: number;
  ruleSetId: number;
  totalScore: number;
  violations: Violation[];
  comments: string | null;
  evaluatedAt: Date;
  entry?: {
    id: number;
    productName: string;
    employeeId: number;
  };
  evaluator?: {
    id: number;
    fullName: string;
    email: string;
    role: string;
  };
  ruleSet?: {
    id: number;
    name: string;
    version: number;
  };
}

// ============================================================================
// CREATE
// ============================================================================

/**
 * Create a quality evaluation
 */
export async function createEvaluation(input: CreateEvaluationInput) {
  try {
    const [evaluation] = await db
      .insert(qualityEvaluations)
      .values({
        entryId: input.entryId,
        evaluatorId: input.evaluatorId,
        ruleSetId: input.ruleSetId,
        totalScore: input.totalScore,
        violations: input.violations,
        comments: input.comments || null,
        evaluatedAt: input.evaluatedAt || new Date(),
      })
      .returning();

    return evaluation;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create evaluation: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// QUERY
// ============================================================================

/**
 * Get evaluation by ID with full details
 */
export async function getEvaluationById(
  evaluationId: number
): Promise<EvaluationWithDetails | null> {
  try {
    const result = await db
      .select({
        evaluation: qualityEvaluations,
        entry: {
          id: entries.id,
          productName: entries.productName,
          employeeId: entries.employeeId,
        },
        evaluator: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          role: users.role,
        },
        ruleSet: {
          id: evaluationRuleSets.id,
          name: evaluationRuleSets.name,
          version: evaluationRuleSets.version,
        },
      })
      .from(qualityEvaluations)
      .leftJoin(entries, eq(qualityEvaluations.entryId, entries.id))
      .leftJoin(users, eq(qualityEvaluations.evaluatorId, users.id))
      .leftJoin(
        evaluationRuleSets,
        eq(qualityEvaluations.ruleSetId, evaluationRuleSets.id)
      )
      .where(eq(qualityEvaluations.id, evaluationId))
      .limit(1);

    if (result.length === 0) return null;

    const row = result[0];
    return {
      ...row.evaluation,
      entry: row.entry || undefined,
      evaluator: row.evaluator || undefined,
      ruleSet: row.ruleSet || undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get evaluation: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get evaluations by entry
 */
export async function getEvaluationsByEntry(entryId: number) {
  try {
    const result = await db
      .select({
        evaluation: qualityEvaluations,
        evaluator: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          role: users.role,
        },
      })
      .from(qualityEvaluations)
      .leftJoin(users, eq(qualityEvaluations.evaluatorId, users.id))
      .where(eq(qualityEvaluations.entryId, entryId))
      .orderBy(desc(qualityEvaluations.evaluatedAt));

    return result.map((row) => ({
      ...row.evaluation,
      evaluator: row.evaluator || undefined,
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get evaluations by entry: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get evaluations by evaluator
 */
export async function getEvaluationsByEvaluator(
  evaluatorId: number,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const conditions = [eq(qualityEvaluations.evaluatorId, evaluatorId)];

    if (startDate) {
      conditions.push(gte(qualityEvaluations.evaluatedAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(qualityEvaluations.evaluatedAt, endDate));
    }

    const result = await db
      .select({
        evaluation: qualityEvaluations,
        entry: {
          id: entries.id,
          productName: entries.productName,
          employeeId: entries.employeeId,
        },
      })
      .from(qualityEvaluations)
      .leftJoin(entries, eq(qualityEvaluations.entryId, entries.id))
      .where(and(...conditions))
      .orderBy(desc(qualityEvaluations.evaluatedAt));

    return result.map((row) => ({
      ...row.evaluation,
      entry: row.entry || undefined,
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to get evaluations by evaluator: ${error.message}`
      );
    }
    throw error;
  }
}

/**
 * Get evaluations for employee's entries
 */
export async function getEvaluationsByEmployee(
  employeeId: number,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const conditions = [eq(entries.employeeId, employeeId)];

    if (startDate) {
      conditions.push(gte(qualityEvaluations.evaluatedAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(qualityEvaluations.evaluatedAt, endDate));
    }

    const result = await db
      .select({
        evaluation: qualityEvaluations,
        entry: {
          id: entries.id,
          productName: entries.productName,
          employeeId: entries.employeeId,
        },
        evaluator: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
        },
      })
      .from(qualityEvaluations)
      .leftJoin(entries, eq(qualityEvaluations.entryId, entries.id))
      .leftJoin(users, eq(qualityEvaluations.evaluatorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(qualityEvaluations.evaluatedAt));

    return result.map((row) => ({
      ...row.evaluation,
      entry: row.entry || undefined,
      evaluator: row.evaluator || undefined,
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to get evaluations by employee: ${error.message}`
      );
    }
    throw error;
  }
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Calculate average score for an employee
 */
export async function calculateAverageScore(
  employeeId: number,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  try {
    const conditions = [eq(entries.employeeId, employeeId)];

    if (startDate) {
      conditions.push(gte(qualityEvaluations.evaluatedAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(qualityEvaluations.evaluatedAt, endDate));
    }

    const result = await db
      .select({
        avgScore: sql<number>`AVG(${qualityEvaluations.totalScore})`,
      })
      .from(qualityEvaluations)
      .leftJoin(entries, eq(qualityEvaluations.entryId, entries.id))
      .where(and(...conditions));

    return Number(result[0]?.avgScore || 0);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to calculate average score: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get violation statistics by employee
 */
export async function getViolationStatistics(
  employeeId: number,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const conditions = [eq(entries.employeeId, employeeId)];

    if (startDate) {
      conditions.push(gte(qualityEvaluations.evaluatedAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(qualityEvaluations.evaluatedAt, endDate));
    }

    const evaluations = await db
      .select({
        violations: qualityEvaluations.violations,
      })
      .from(qualityEvaluations)
      .leftJoin(entries, eq(qualityEvaluations.entryId, entries.id))
      .where(and(...conditions));

    // Aggregate violations
    const violationMap = new Map<
      string,
      { count: number; totalDeduction: number }
    >();

    for (const evaluation of evaluations) {
      const violations = evaluation.violations as Violation[];
      if (!violations || violations.length === 0) continue;

      for (const violation of violations) {
        const existing = violationMap.get(violation.ruleName) || {
          count: 0,
          totalDeduction: 0,
        };
        violationMap.set(violation.ruleName, {
          count: existing.count + 1,
          totalDeduction: existing.totalDeduction + violation.deduction,
        });
      }
    }

    return Array.from(violationMap.entries()).map(([ruleName, data]) => ({
      ruleName,
      count: data.count,
      totalDeduction: data.totalDeduction,
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get violation statistics: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get evaluation trends over time (grouped by day)
 */
export async function getEvaluationTrends(
  employeeId: number,
  startDate: Date,
  endDate: Date
) {
  try {
    const result = await db
      .select({
        date: sql<string>`DATE(${qualityEvaluations.evaluatedAt})`,
        avgScore: sql<number>`AVG(${qualityEvaluations.totalScore})`,
        count: sql<number>`cast(COUNT(*) as integer)`,
      })
      .from(qualityEvaluations)
      .leftJoin(entries, eq(qualityEvaluations.entryId, entries.id))
      .where(
        and(
          eq(entries.employeeId, employeeId),
          gte(qualityEvaluations.evaluatedAt, startDate),
          lte(qualityEvaluations.evaluatedAt, endDate)
        )
      )
      .groupBy(sql`DATE(${qualityEvaluations.evaluatedAt})`)
      .orderBy(sql`DATE(${qualityEvaluations.evaluatedAt})`);

    return result.map((row) => ({
      date: row.date,
      avgScore: Number(row.avgScore),
      count: Number(row.count),
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get evaluation trends: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get score distribution
 */
export async function getScoreDistribution(
  employeeId?: number,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const conditions = [];

    if (employeeId) {
      conditions.push(eq(entries.employeeId, employeeId));
    }

    if (startDate) {
      conditions.push(gte(qualityEvaluations.evaluatedAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(qualityEvaluations.evaluatedAt, endDate));
    }

    const result = await db
      .select({
        scoreRange: sql<string>`
          CASE 
            WHEN ${qualityEvaluations.totalScore} >= 90 THEN '90-100'
            WHEN ${qualityEvaluations.totalScore} >= 80 THEN '80-89'
            WHEN ${qualityEvaluations.totalScore} >= 70 THEN '70-79'
            WHEN ${qualityEvaluations.totalScore} >= 60 THEN '60-69'
            ELSE 'Below 60'
          END
        `,
        count: sql<number>`cast(COUNT(*) as integer)`,
      })
      .from(qualityEvaluations)
      .leftJoin(entries, eq(qualityEvaluations.entryId, entries.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(sql`
        CASE 
          WHEN ${qualityEvaluations.totalScore} >= 90 THEN '90-100'
          WHEN ${qualityEvaluations.totalScore} >= 80 THEN '80-89'
          WHEN ${qualityEvaluations.totalScore} >= 70 THEN '70-79'
          WHEN ${qualityEvaluations.totalScore} >= 60 THEN '60-69'
          ELSE 'Below 60'
        END
      `);

    return result.map((row) => ({
      scoreRange: row.scoreRange,
      count: Number(row.count),
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get score distribution: ${error.message}`);
    }
    throw error;
  }
}

// ============================================================================
// UPDATE & DELETE
// ============================================================================

/**
 * Update evaluation
 */
export async function updateEvaluation(
  evaluationId: number,
  updates: Partial<CreateEvaluationInput>
) {
  try {
    const [updated] = await db
      .update(qualityEvaluations)
      .set(updates)
      .where(eq(qualityEvaluations.id, evaluationId))
      .returning();

    return updated;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update evaluation: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Delete evaluation
 */
export async function deleteEvaluation(evaluationId: number) {
  try {
    const [deleted] = await db
      .delete(qualityEvaluations)
      .where(eq(qualityEvaluations.id, evaluationId))
      .returning();

    return deleted;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete evaluation: ${error.message}`);
    }
    throw error;
  }
}
