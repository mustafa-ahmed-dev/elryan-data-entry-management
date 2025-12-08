/**
 * Team Statistics API - WITH ENHANCED ERROR HANDLING
 * GET /api/teams/[id]/stats - Get detailed team performance statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { db } from "@/db";
import { users, entries, qualityEvaluations, teams } from "@/db/schema";
import { eq, and, s count, avg, inArray } from "drizzle-orm";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

interface RouteParams {
  params: { id: string };
}

// GET /api/teams/[id]/stats
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    // Get context FIRST
    const context = await getRequestContext(request);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(context);
    }

    // Add user info to context
    context.userId = session.user.id;
    context.userEmail = session.user.email;

    const canRead = await checkPermission(session.user.id, "teams", "read");
    if (!canRead) {
      return ApiErrors.insufficientPermissions(context, "teams:read");
    }

    const teamId = parseInt(params.id);
    if (isNaN(teamId)) {
      return ApiErrors.invalidId(context, "Team");
    }

    // Check if team exists
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team) {
      return ApiErrors.notFound(context, "Team");
    }

    // Get team members
    const teamMembers = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.teamId, teamId), eq(users.isActive, true)));

    const memberIds = teamMembers.map((m) => m.id);

    if (memberIds.length === 0) {
      // Team has no members, return empty stats
      return NextResponse.json(
        {
          success: true,
          data: {
            totalEntries: 0,
            totalEvaluations: 0,
            avgScore: 0,
            completionRate: 0,
            memberCount: 0,
          },
        },
        {
          headers: {
            "X-Request-ID": context.requestId || "",
          },
        }
      );
    }

    // Get total entries by team members
    const [entryStats] = await db
      .select({
        totalEntries: count(entries.id),
      })
      .from(entries)
      .where(inArray(entries.employeeId, memberIds));

    // Get evaluation statistics
    const [evalStats] = await db
      .select({
        totalEvaluations: count(qualityEvaluations.id),
        avgScore: avg(qualityEvaluations.totalScore),
      })
      .from(qualityEvaluations)
      .innerJoin(entries, eq(entries.id, qualityEvaluations.entryId))
      .where(inArray(entries.employeeId, memberIds));

    // Calculate completion rate (entries with evaluations / total entries)
    const totalEntries = Number(entryStats?.totalEntries || 0);
    const totalEvaluations = Number(evalStats?.totalEvaluations || 0);
    const completionRate =
      totalEntries > 0 ? (totalEvaluations / totalEntries) * 100 : 0;

    const stats = {
      totalEntries,
      totalEvaluations,
      avgScore: evalStats?.avgScore ? Number(evalStats.avgScore) : 0,
      completionRate: Math.round(completionRate * 100) / 100, // Round to 2 decimals
      memberCount: memberIds.length,
    };

    return NextResponse.json(
      {
        success: true,
        data: stats,
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);
