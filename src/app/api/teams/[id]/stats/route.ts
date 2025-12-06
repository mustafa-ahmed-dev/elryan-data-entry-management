/**
 * Team Statistics API
 * GET /api/teams/[id]/stats - Get detailed team performance statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { db } from "@/db";
import { users, entries, evaluations, teams } from "@/db/schema";
import { eq, and, sql, count, avg } from "drizzle-orm";

interface RouteParams {
  params: { id: string };
}

// GET /api/teams/[id]/stats
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canRead = await checkPermission(session.user.id, "teams", "read");
    if (!canRead) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const teamId = parseInt(params.id);
    if (isNaN(teamId)) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    // Check if team exists
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Get team members
    const teamMembers = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.teamId, teamId), eq(users.isActive, true)));

    const memberIds = teamMembers.map((m) => m.id);

    if (memberIds.length === 0) {
      // Team has no members, return empty stats
      return NextResponse.json({
        success: true,
        data: {
          totalEntries: 0,
          totalEvaluations: 0,
          avgScore: 0,
          completionRate: 0,
          memberCount: 0,
        },
      });
    }

    // Get total entries by team members
    const [entryStats] = await db
      .select({
        totalEntries: count(entries.id),
      })
      .from(entries)
      .where(sql`${entries.userId} IN ${memberIds}`);

    // Get evaluation statistics
    const [evalStats] = await db
      .select({
        totalEvaluations: count(evaluations.id),
        avgScore: avg(evaluations.totalScore),
      })
      .from(evaluations)
      .innerJoin(entries, eq(entries.id, evaluations.entryId))
      .where(sql`${entries.userId} IN ${memberIds}`);

    // Calculate completion rate (entries with evaluations / total entries)
    const totalEntries = entryStats?.totalEntries || 0;
    const totalEvaluations = evalStats?.totalEvaluations || 0;
    const completionRate =
      totalEntries > 0 ? (totalEvaluations / totalEntries) * 100 : 0;

    const stats = {
      totalEntries: totalEntries,
      totalEvaluations: totalEvaluations,
      avgScore: evalStats?.avgScore ? Number(evalStats.avgScore) : 0,
      completionRate: completionRate,
      memberCount: memberIds.length,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching team stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch team statistics" },
      { status: 500 }
    );
  }
}
