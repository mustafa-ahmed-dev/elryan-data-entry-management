import { NextRequest } from "next/server";
import { db } from "@/db";
import { entries, qualityEvaluations, users, teams } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth, canManageTeam, getTeamId } from "@/lib/middleware/auth";
import {
  handleApiError,
  successResponse,
  parseQueryParams,
} from "@/lib/api/utils";
import { dateRangeSchema } from "@/lib/validations/schemas";

/**
 * GET /api/reports/team/[id] - Get team performance report
 * Requires: admin or team_leader of the team
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const teamId = parseInt(params.id);
    const queryParams = parseQueryParams(request.url);

    // Validate date range
    const { startDate, endDate } = dateRangeSchema.parse(queryParams);

    // Check permissions
    if (!canManageTeam(session)) {
      throw new Error(
        "Forbidden - Only team leaders and admins can view team reports"
      );
    }

    // Team leaders can only view their own team
    if (session.user.role === "team_leader") {
      const userTeamId = getTeamId(session);
      if (!userTeamId || userTeamId !== teamId) {
        throw new Error("Forbidden - Can only view your own team report");
      }
    }

    // Get team info
    const [team] = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
      })
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team) {
      throw new Error("Team not found");
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

    const conditions = [eq(users.teamId, teamId), ...dateConditions];

    // Get team members
    const teamMembers = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.teamId, teamId));

    // Get overall team entry statistics
    const [teamStats] = await db
      .select({
        totalEntries: sql<number>`count(*)::int`,
        followsNamingConvention: sql<number>`count(*) filter (where ${entries.followsNamingConvention} = true)::int`,
        followsSpecificationOrder: sql<number>`count(*) filter (where ${entries.followsSpecificationOrder} = true)::int`,
        hasUnwantedKeywords: sql<number>`count(*) filter (where ${entries.containsUnwantedKeywords} = true)::int`,
      })
      .from(entries)
      .innerJoin(users, eq(entries.employeeId, users.id))
      .where(and(...conditions));

    // Get entries by employee
    const entriesByEmployee = await db
      .select({
        employeeId: entries.employeeId,
        employeeName: users.fullName,
        count: sql<number>`count(*)::int`,
      })
      .from(entries)
      .innerJoin(users, eq(entries.employeeId, users.id))
      .where(and(...conditions))
      .groupBy(entries.employeeId, users.fullName);

    // Get evaluation statistics by employee
    const evaluationsByEmployee = await db
      .select({
        employeeId: entries.employeeId,
        employeeName: users.fullName,
        totalEvaluations: sql<number>`count(*)::int`,
        averageScore: sql<number>`avg(${qualityEvaluations.totalScore})`,
      })
      .from(qualityEvaluations)
      .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
      .innerJoin(users, eq(entries.employeeId, users.id))
      .where(and(...conditions))
      .groupBy(entries.employeeId, users.fullName);

    // Get team-wide evaluation statistics
    const [teamEvalStats] = await db
      .select({
        totalEvaluations: sql<number>`count(*)::int`,
        averageScore: sql<number>`avg(${qualityEvaluations.totalScore})`,
        highestScore: sql<number>`max(${qualityEvaluations.totalScore})`,
        lowestScore: sql<number>`min(${qualityEvaluations.totalScore})`,
      })
      .from(qualityEvaluations)
      .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
      .innerJoin(users, eq(entries.employeeId, users.id))
      .where(and(...conditions));

    return successResponse({
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        memberCount: teamMembers.length,
      },
      members: teamMembers,
      entryMetrics: {
        total: teamStats.totalEntries,
        byEmployee: entriesByEmployee,
        qualityMetrics: {
          namingConventionCompliance:
            teamStats.totalEntries > 0
              ? (teamStats.followsNamingConvention / teamStats.totalEntries) *
                100
              : 0,
          specificationOrderCompliance:
            teamStats.totalEntries > 0
              ? (teamStats.followsSpecificationOrder / teamStats.totalEntries) *
                100
              : 0,
          unwantedKeywordsRate:
            teamStats.totalEntries > 0
              ? (teamStats.hasUnwantedKeywords / teamStats.totalEntries) * 100
              : 0,
        },
      },
      evaluationMetrics: {
        total: teamEvalStats.totalEvaluations,
        averageScore: teamEvalStats.averageScore
          ? parseFloat(teamEvalStats.averageScore.toFixed(2))
          : 0,
        highestScore: teamEvalStats.highestScore || 0,
        lowestScore: teamEvalStats.lowestScore || 0,
        byEmployee: evaluationsByEmployee.map((e) => ({
          employeeId: e.employeeId,
          employeeName: e.employeeName,
          totalEvaluations: e.totalEvaluations,
          averageScore: e.averageScore
            ? parseFloat(e.averageScore.toFixed(2))
            : 0,
        })),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
