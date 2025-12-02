import { NextRequest } from "next/server";
import { db } from "@/db";
import { qualityEvaluations, entries, users } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import {
  requireAuth,
  canManageTeam,
  getUserId,
  getTeamId,
} from "@/lib/middleware/auth";
import {
  handleApiError,
  successResponse,
  parseQueryParams,
} from "@/lib/api/utils";
import { dateRangeSchema } from "@/lib/validations/schemas";

/**
 * GET /api/reports/quality-trends - Get quality trends over time
 * Requires: authenticated
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const params = parseQueryParams(request.url);

    // Validate date range
    const { startDate, endDate } = dateRangeSchema.parse(params);

    // Build date conditions
    const conditions = [];

    if (startDate) {
      conditions.push(gte(qualityEvaluations.evaluatedAt, new Date(startDate)));
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      conditions.push(lte(qualityEvaluations.evaluatedAt, endDateTime));
    }

    // Filter by role
    if (session.user.role === "employee") {
      conditions.push(eq(entries.employeeId, getUserId(session)));
    } else if (session.user.role === "team_leader") {
      const teamId = getTeamId(session);
      if (teamId) {
        conditions.push(eq(users.teamId, teamId));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get overall statistics
    const [overallStats] = await db
      .select({
        totalEvaluations: sql<number>`count(*)::int`,
        averageScore: sql<number>`avg(${qualityEvaluations.totalScore})`,
        highestScore: sql<number>`max(${qualityEvaluations.totalScore})`,
        lowestScore: sql<number>`min(${qualityEvaluations.totalScore})`,
        excellentCount: sql<number>`count(*) filter (where ${qualityEvaluations.totalScore} >= 90)::int`,
        goodCount: sql<number>`count(*) filter (where ${qualityEvaluations.totalScore} >= 70 and ${qualityEvaluations.totalScore} < 90)::int`,
        averageCount: sql<number>`count(*) filter (where ${qualityEvaluations.totalScore} >= 50 and ${qualityEvaluations.totalScore} < 70)::int`,
        poorCount: sql<number>`count(*) filter (where ${qualityEvaluations.totalScore} < 50)::int`,
      })
      .from(qualityEvaluations)
      .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
      .leftJoin(users, eq(entries.employeeId, users.id))
      .where(whereClause);

    // Get daily average scores for trend line
    const dailyTrends = await db
      .select({
        date: sql<string>`DATE(${qualityEvaluations.evaluatedAt})`,
        averageScore: sql<number>`avg(${qualityEvaluations.totalScore})`,
        count: sql<number>`count(*)::int`,
      })
      .from(qualityEvaluations)
      .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
      .leftJoin(users, eq(entries.employeeId, users.id))
      .where(whereClause)
      .groupBy(sql`DATE(${qualityEvaluations.evaluatedAt})`)
      .orderBy(sql`DATE(${qualityEvaluations.evaluatedAt})`);

    // Get weekly average scores
    const weeklyTrends = await db
      .select({
        week: sql<string>`DATE_TRUNC('week', ${qualityEvaluations.evaluatedAt})`,
        averageScore: sql<number>`avg(${qualityEvaluations.totalScore})`,
        count: sql<number>`count(*)::int`,
      })
      .from(qualityEvaluations)
      .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
      .leftJoin(users, eq(entries.employeeId, users.id))
      .where(whereClause)
      .groupBy(sql`DATE_TRUNC('week', ${qualityEvaluations.evaluatedAt})`)
      .orderBy(sql`DATE_TRUNC('week', ${qualityEvaluations.evaluatedAt})`);

    // Get score distribution by employee (for team leaders and admins)
    let employeeScores = [];
    if (canManageTeam(session)) {
      employeeScores = await db
        .select({
          employeeId: entries.employeeId,
          employeeName: users.fullName,
          averageScore: sql<number>`avg(${qualityEvaluations.totalScore})`,
          totalEvaluations: sql<number>`count(*)::int`,
        })
        .from(qualityEvaluations)
        .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
        .leftJoin(users, eq(entries.employeeId, users.id))
        .where(whereClause)
        .groupBy(entries.employeeId, users.fullName);
    }

    // Get most common violations
    const violationsAnalysis = await db
      .select({
        violations: qualityEvaluations.violations,
      })
      .from(qualityEvaluations)
      .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
      .leftJoin(users, eq(entries.employeeId, users.id))
      .where(whereClause);

    // Aggregate violations
    const violationCounts: Record<string, number> = {};
    violationsAnalysis.forEach((row) => {
      if (Array.isArray(row.violations)) {
        row.violations.forEach((violation: any) => {
          const key = violation.ruleName;
          violationCounts[key] = (violationCounts[key] || 0) + 1;
        });
      }
    });

    const topViolations = Object.entries(violationCounts)
      .map(([ruleName, count]) => ({ ruleName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return successResponse({
      summary: {
        totalEvaluations: overallStats.totalEvaluations,
        averageScore: overallStats.averageScore
          ? parseFloat(overallStats.averageScore.toFixed(2))
          : 0,
        highestScore: overallStats.highestScore || 0,
        lowestScore: overallStats.lowestScore || 0,
        scoreDistribution: {
          excellent: overallStats.excellentCount,
          good: overallStats.goodCount,
          average: overallStats.averageCount,
          poor: overallStats.poorCount,
        },
      },
      trends: {
        daily: dailyTrends.map((t) => ({
          date: t.date,
          averageScore: t.averageScore
            ? parseFloat(t.averageScore.toFixed(2))
            : 0,
          count: t.count,
        })),
        weekly: weeklyTrends.map((t) => ({
          week: t.week,
          averageScore: t.averageScore
            ? parseFloat(t.averageScore.toFixed(2))
            : 0,
          count: t.count,
        })),
      },
      byEmployee: employeeScores.map((e) => ({
        employeeId: e.employeeId,
        employeeName: e.employeeName,
        averageScore: e.averageScore
          ? parseFloat(e.averageScore.toFixed(2))
          : 0,
        totalEvaluations: e.totalEvaluations,
      })),
      topViolations,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
