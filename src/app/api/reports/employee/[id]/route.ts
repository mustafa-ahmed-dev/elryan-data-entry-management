import { NextRequest } from "next/server";
import { db } from "@/db";
import { entries, qualityEvaluations, users, entryTypes } from "@/db/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { requireAuth, isAdmin } from "@/lib/middleware/auth";
import {
  handleApiError,
  successResponse,
  parseQueryParams,
} from "@/lib/api/utils";
import { dateRangeSchema } from "@/lib/validations/schemas";

/**
 * GET /api/reports/employee/[id] - Get employee performance report
 * Requires: admin, team_leader, or self
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const employeeId = parseInt(params.id);
    const queryParams = parseQueryParams(request.url);

    // Validate date range
    const { startDate, endDate } = dateRangeSchema.parse(queryParams);

    // Check permissions
    const canView =
      isAdmin(session) ||
      session.user.role === "team_leader" ||
      employeeId.toString() === session.user.id;

    if (!canView) {
      throw new Error("Forbidden - Cannot view this report");
    }

    // Build date conditions
    const dateConditions = [];
    if (startDate) {
      dateConditions.push(gte(entries.entryTime, new Date(startDate)));
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      dateConditions.push(lte(entries.entryTime, endDateTime));
    }

    const entryConditions = [
      eq(entries.employeeId, employeeId),
      ...dateConditions,
    ];

    // Get employee info
    const [employee] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        teamId: users.teamId,
      })
      .from(users)
      .where(eq(users.id, employeeId))
      .limit(1);

    if (!employee) {
      throw new Error("Employee not found");
    }

    // Get entry statistics
    const [entryStats] = await db
      .select({
        totalEntries: sql<number>`count(*)::int`,
        followsNamingConvention: sql<number>`count(*) filter (where ${entries.followsNamingConvention} = true)::int`,
        followsSpecificationOrder: sql<number>`count(*) filter (where ${entries.followsSpecificationOrder} = true)::int`,
        hasUnwantedKeywords: sql<number>`count(*) filter (where ${entries.containsUnwantedKeywords} = true)::int`,
      })
      .from(entries)
      .where(and(...entryConditions));

    // Get entries by type
    const entriesByType = await db
      .select({
        entryTypeId: entries.entryTypeId,
        entryTypeName: entryTypes.name,
        count: sql<number>`count(*)::int`,
      })
      .from(entries)
      .leftJoin(entryTypes, eq(entries.entryTypeId, entryTypes.id))
      .where(and(...entryConditions))
      .groupBy(entries.entryTypeId, entryTypes.name);

    // Get evaluation statistics
    const evalConditions = [
      eq(entries.employeeId, employeeId),
      ...dateConditions,
    ];

    const [evalStats] = await db
      .select({
        totalEvaluations: sql<number>`count(*)::int`,
        averageScore: sql<number>`avg(${qualityEvaluations.totalScore})`,
        highestScore: sql<number>`max(${qualityEvaluations.totalScore})`,
        lowestScore: sql<number>`min(${qualityEvaluations.totalScore})`,
      })
      .from(qualityEvaluations)
      .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
      .where(and(...evalConditions));

    // Get recent evaluations
    const recentEvaluations = await db
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
      .where(and(...evalConditions))
      .orderBy(desc(qualityEvaluations.evaluatedAt))
      .limit(10);

    // Get daily entry counts for trend analysis
    const dailyEntries = await db
      .select({
        date: sql<string>`DATE(${entries.entryTime})`,
        count: sql<number>`count(*)::int`,
      })
      .from(entries)
      .where(and(...entryConditions))
      .groupBy(sql`DATE(${entries.entryTime})`)
      .orderBy(sql`DATE(${entries.entryTime})`);

    return successResponse({
      employee: {
        id: employee.id,
        fullName: employee.fullName,
        email: employee.email,
        role: employee.role,
      },
      entryMetrics: {
        total: entryStats.totalEntries,
        byType: entriesByType,
        qualityMetrics: {
          namingConventionCompliance:
            entryStats.totalEntries > 0
              ? (entryStats.followsNamingConvention / entryStats.totalEntries) *
                100
              : 0,
          specificationOrderCompliance:
            entryStats.totalEntries > 0
              ? (entryStats.followsSpecificationOrder /
                  entryStats.totalEntries) *
                100
              : 0,
          unwantedKeywordsRate:
            entryStats.totalEntries > 0
              ? (entryStats.hasUnwantedKeywords / entryStats.totalEntries) * 100
              : 0,
        },
      },
      evaluationMetrics: {
        total: evalStats.totalEvaluations,
        averageScore: evalStats.averageScore
          ? parseFloat(evalStats.averageScore.toFixed(2))
          : 0,
        highestScore: evalStats.highestScore || 0,
        lowestScore: evalStats.lowestScore || 0,
        recentEvaluations,
      },
      trends: {
        dailyEntries,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
