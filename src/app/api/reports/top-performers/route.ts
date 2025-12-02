import { NextRequest } from "next/server";
import { db } from "@/db";
import { qualityEvaluations, entries, users } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth, canManageTeam, getTeamId } from "@/lib/middleware/auth";
import {
  handleApiError,
  successResponse,
  parseQueryParams,
} from "@/lib/api/utils";
import { dateRangeSchema } from "@/lib/validations/schemas";

/**
 * GET /api/reports/top-performers - Get leaderboard of top performers
 * Requires: team_leader or admin
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Only team leaders and admins can view leaderboard
    if (!canManageTeam(session)) {
      throw new Error(
        "Forbidden - Only team leaders and admins can view leaderboard"
      );
    }

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

    // Team leaders can only see their team
    if (session.user.role === "team_leader") {
      const teamId = getTeamId(session);
      if (teamId) {
        conditions.push(eq(users.teamId, teamId));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get top performers by average quality score
    const topByQuality = await db
      .select({
        employeeId: entries.employeeId,
        employeeName: users.fullName,
        employeeEmail: users.email,
        teamId: users.teamId,
        totalEvaluations: sql<number>`count(*)::int`,
        averageScore: sql<number>`avg(${qualityEvaluations.totalScore})`,
        highestScore: sql<number>`max(${qualityEvaluations.totalScore})`,
        excellentCount: sql<number>`count(*) filter (where ${qualityEvaluations.totalScore} >= 90)::int`,
      })
      .from(qualityEvaluations)
      .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
      .leftJoin(users, eq(entries.employeeId, users.id))
      .where(whereClause)
      .groupBy(entries.employeeId, users.fullName, users.email, users.teamId)
      .having(sql`count(*) >= 5`) // Minimum 5 evaluations to qualify
      .orderBy(sql`avg(${qualityEvaluations.totalScore}) DESC`)
      .limit(20);

    // Get top performers by productivity (entry count)
    const productivityConditions = [...conditions];
    if (startDate) {
      productivityConditions.push(gte(entries.entryTime, new Date(startDate)));
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      productivityConditions.push(lte(entries.entryTime, endDateTime));
    }

    const productivityWhereClause =
      productivityConditions.length > 0
        ? and(...productivityConditions)
        : undefined;

    const topByProductivity = await db
      .select({
        employeeId: entries.employeeId,
        employeeName: users.fullName,
        employeeEmail: users.email,
        teamId: users.teamId,
        totalEntries: sql<number>`count(*)::int`,
        qualityRate: sql<number>`
          (count(*) filter (where ${entries.followsNamingConvention} = true 
           and ${entries.followsSpecificationOrder} = true 
           and ${entries.containsUnwantedKeywords} = false)::float / 
           count(*)::float * 100)
        `,
      })
      .from(entries)
      .leftJoin(users, eq(entries.employeeId, users.id))
      .where(productivityWhereClause)
      .groupBy(entries.employeeId, users.fullName, users.email, users.teamId)
      .orderBy(sql`count(*) DESC`)
      .limit(20);

    // Get most improved employees (comparing first half vs second half of period)
    let mostImproved = [];
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const midpoint = new Date((start.getTime() + end.getTime()) / 2);

      const firstHalfScores = await db
        .select({
          employeeId: entries.employeeId,
          employeeName: users.fullName,
          averageScore: sql<number>`avg(${qualityEvaluations.totalScore})`,
        })
        .from(qualityEvaluations)
        .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
        .leftJoin(users, eq(entries.employeeId, users.id))
        .where(
          and(
            gte(qualityEvaluations.evaluatedAt, start),
            lte(qualityEvaluations.evaluatedAt, midpoint),
            ...(session.user.role === "team_leader" && getTeamId(session)
              ? [eq(users.teamId, getTeamId(session)!)]
              : [])
          )
        )
        .groupBy(entries.employeeId, users.fullName)
        .having(sql`count(*) >= 3`);

      const secondHalfScores = await db
        .select({
          employeeId: entries.employeeId,
          employeeName: users.fullName,
          averageScore: sql<number>`avg(${qualityEvaluations.totalScore})`,
        })
        .from(qualityEvaluations)
        .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
        .leftJoin(users, eq(entries.employeeId, users.id))
        .where(
          and(
            gte(qualityEvaluations.evaluatedAt, midpoint),
            lte(qualityEvaluations.evaluatedAt, end),
            ...(session.user.role === "team_leader" && getTeamId(session)
              ? [eq(users.teamId, getTeamId(session)!)]
              : [])
          )
        )
        .groupBy(entries.employeeId, users.fullName)
        .having(sql`count(*) >= 3`);

      // Calculate improvement
      const improvementMap = new Map();
      firstHalfScores.forEach((first) => {
        const second = secondHalfScores.find(
          (s) => s.employeeId === first.employeeId
        );
        if (second) {
          const improvement =
            parseFloat(second.averageScore.toFixed(2)) -
            parseFloat(first.averageScore.toFixed(2));
          if (improvement > 0) {
            improvementMap.set(first.employeeId, {
              employeeId: first.employeeId,
              employeeName: first.employeeName,
              firstHalfScore: parseFloat(first.averageScore.toFixed(2)),
              secondHalfScore: parseFloat(second.averageScore.toFixed(2)),
              improvement,
            });
          }
        }
      });

      mostImproved = Array.from(improvementMap.values())
        .sort((a, b) => b.improvement - a.improvement)
        .slice(0, 10);
    }

    return successResponse({
      topByQuality: topByQuality.map((p) => ({
        employeeId: p.employeeId,
        employeeName: p.employeeName,
        employeeEmail: p.employeeEmail,
        teamId: p.teamId,
        totalEvaluations: p.totalEvaluations,
        averageScore: p.averageScore
          ? parseFloat(p.averageScore.toFixed(2))
          : 0,
        highestScore: p.highestScore || 0,
        excellentCount: p.excellentCount,
      })),
      topByProductivity: topByProductivity.map((p) => ({
        employeeId: p.employeeId,
        employeeName: p.employeeName,
        employeeEmail: p.employeeEmail,
        teamId: p.teamId,
        totalEntries: p.totalEntries,
        qualityRate: p.qualityRate ? parseFloat(p.qualityRate.toFixed(2)) : 0,
      })),
      mostImproved,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
