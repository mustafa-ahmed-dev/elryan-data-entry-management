import { NextRequest } from "next/server";
import { db } from "@/db";
import {
  qualityEvaluations,
  entries,
  users,
  evaluationRuleSets,
} from "@/db/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import {
  requireAuth,
  canManageTeam,
  getUserId,
  getTeamId,
} from "@/lib/middleware/auth";
import {
  handleApiError,
  paginatedResponse,
  createdResponse,
  parseBody,
  getOffset,
  parseQueryParams,
} from "@/lib/api/utils";
import {
  createEvaluationSchema,
  evaluationFilterSchema,
} from "@/lib/validations/schemas";

/**
 * GET /api/evaluations - List evaluations with filters
 * Requires: authenticated
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const params = parseQueryParams(request.url);

    // Validate and parse query parameters
    const filters = evaluationFilterSchema.parse(params);
    const {
      page,
      limit,
      employeeId,
      evaluatorId,
      minScore,
      maxScore,
      startDate,
      endDate,
    } = filters;

    // Build query conditions
    const conditions = [];

    if (employeeId) {
      conditions.push(eq(entries.employeeId, employeeId));
    }

    if (evaluatorId) {
      conditions.push(eq(qualityEvaluations.evaluatorId, evaluatorId));
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
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      conditions.push(lte(qualityEvaluations.evaluatedAt, endDateTime));
    }

    // Employees can only see their own evaluations
    if (session.user.role === "employee") {
      conditions.push(eq(entries.employeeId, getUserId(session)));
    }
    // Team leaders can only see their team's evaluations
    else if (session.user.role === "team_leader") {
      const teamId = getTeamId(session);
      if (teamId) {
        conditions.push(eq(users.teamId, teamId));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(qualityEvaluations)
      .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
      .leftJoin(users, eq(entries.employeeId, users.id))
      .where(whereClause);

    // Get paginated evaluations
    const evaluationsList = await db
      .select({
        id: qualityEvaluations.id,
        entryId: qualityEvaluations.entryId,
        employeeId: entries.employeeId,
        employeeName: users.fullName,
        evaluatorId: qualityEvaluations.evaluatorId,
        totalScore: qualityEvaluations.totalScore,
        violations: qualityEvaluations.violations,
        comments: qualityEvaluations.comments,
        evaluatedAt: qualityEvaluations.evaluatedAt,
      })
      .from(qualityEvaluations)
      .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
      .leftJoin(users, eq(entries.employeeId, users.id))
      .where(whereClause)
      .orderBy(desc(qualityEvaluations.evaluatedAt))
      .limit(limit)
      .offset(getOffset(page, limit));

    return paginatedResponse(evaluationsList, page, limit, count);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/evaluations - Create new evaluation
 * Requires: team_leader or admin
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Check if user can create evaluations
    if (!canManageTeam(session)) {
      throw new Error(
        "Forbidden - Only team leaders and admins can create evaluations"
      );
    }

    const body = await parseBody(request);

    // Validate request body
    const validatedData = createEvaluationSchema.parse(body);

    // Check if entry exists
    const [entry] = await db
      .select({
        id: entries.id,
        employeeId: entries.employeeId,
        teamId: users.teamId,
      })
      .from(entries)
      .leftJoin(users, eq(entries.employeeId, users.id))
      .where(eq(entries.id, validatedData.entryId))
      .limit(1);

    if (!entry) {
      throw new Error("Entry not found");
    }

    // Team leaders can only evaluate their team members
    if (session.user.role === "team_leader") {
      const teamId = getTeamId(session);
      if (!teamId || entry.teamId !== teamId) {
        throw new Error("Forbidden - Can only evaluate your team members");
      }
    }

    // Check if rule set exists and is active
    const [ruleSet] = await db
      .select()
      .from(evaluationRuleSets)
      .where(eq(evaluationRuleSets.id, validatedData.ruleSetId))
      .limit(1);

    if (!ruleSet) {
      throw new Error("Evaluation rule set not found");
    }

    if (!ruleSet.isActive) {
      throw new Error("Evaluation rule set is not active");
    }

    // Create evaluation
    const [newEvaluation] = await db
      .insert(qualityEvaluations)
      .values({
        entryId: validatedData.entryId,
        evaluatorId: getUserId(session),
        ruleSetId: validatedData.ruleSetId,
        totalScore: validatedData.totalScore,
        violations: validatedData.violations,
        comments: validatedData.comments,
      })
      .returning();

    return createdResponse(newEvaluation, "Evaluation created successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
