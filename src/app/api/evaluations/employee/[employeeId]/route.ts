import { NextRequest } from "next/server";
import { db } from "@/db";
import { qualityEvaluations, entries, users } from "@/db/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { requireAuth, isAdmin, getUserId } from "@/lib/middleware/auth";
import {
  handleApiError,
  successResponse,
  parseQueryParams,
} from "@/lib/api/utils";
import { dateRangeSchema } from "@/lib/validations/schemas";

/**
 * GET /api/evaluations/employee/[employeeId] - Get employee's evaluations
 * Requires: authenticated (own evaluations or admin/team_leader)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const session = await requireAuth();
    const employeeId = parseInt(params.employeeId);
    const queryParams = parseQueryParams(request.url);

    // Validate date range
    const { startDate, endDate } = dateRangeSchema.parse(queryParams);

    // Check permissions
    const canView =
      isAdmin(session) ||
      session.user.role === "team_leader" ||
      employeeId.toString() === session.user.id;

    if (!canView) {
      throw new Error("Forbidden - Cannot view these evaluations");
    }

    // Build conditions
    const conditions = [eq(entries.employeeId, employeeId)];

    if (startDate) {
      conditions.push(gte(qualityEvaluations.evaluatedAt, new Date(startDate)));
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      conditions.push(sql`${qualityEvaluations.evaluatedAt} <= ${endDateTime}`);
    }

    // Get evaluations
    const evaluationsList = await db
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

    // Get statistics
    const [stats] = await db
      .select({
        totalEvaluations: sql<number>`count(*)::int`,
        averageScore: sql<number>`avg(${qualityEvaluations.totalScore})`,
        highestScore: sql<number>`max(${qualityEvaluations.totalScore})`,
        lowestScore: sql<number>`min(${qualityEvaluations.totalScore})`,
      })
      .from(qualityEvaluations)
      .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
      .where(and(...conditions));

    return successResponse({
      evaluations: evaluationsList,
      statistics: {
        total: stats.totalEvaluations,
        average: stats.averageScore
          ? parseFloat(stats.averageScore.toFixed(2))
          : 0,
        highest: stats.highestScore || 0,
        lowest: stats.lowestScore || 0,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
