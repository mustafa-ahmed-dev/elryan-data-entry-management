/**
 * Daily Reports API
 * GET /api/reports/daily - Get daily statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission, getUserPermissions } from "@/db/utils/permissions";
import { getEntryStats, getDailyEntryCounts } from "@/db/utils/entries";
import { getEvaluationStats } from "@/db/utils/evaluations";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const canRead = await checkPermission(session.user.id, "reports", "read");
    if (!canRead) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get user permissions for scope
    const userPerms = await getUserPermissions(session.user.id);
    if (!userPerms) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Determine filters based on scope
    const filters: any = {};

    const readPermission = userPerms.permissions.find(
      (p) => p.resource === "reports" && p.action === "read"
    );

    if (readPermission?.scope === "own") {
      filters.employeeId = session.user.id;
    } else if (readPermission?.scope === "team") {
      if (userPerms.teamId) {
        filters.teamId = userPerms.teamId;
      }
    }
    // 'all' scope has no filters

    // Set date range
    if (date) {
      filters.startDate = date;
      filters.endDate = date;
    } else {
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
    }

    // Get statistics
    const [entryStats, evaluationStats] = await Promise.all([
      getEntryStats(filters),
      getEvaluationStats(filters),
    ]);

    // Get daily trends if date range provided
    let dailyTrends;
    if (filters.startDate && filters.endDate) {
      dailyTrends = await getDailyEntryCounts(
        filters.startDate,
        filters.endDate,
        {
          employeeId: filters.employeeId,
          teamId: filters.teamId,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        entries: entryStats,
        evaluations: evaluationStats,
        dailyTrends,
        dateRange: {
          start: filters.startDate,
          end: filters.endDate,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching daily report:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily report" },
      { status: 500 }
    );
  }
}
