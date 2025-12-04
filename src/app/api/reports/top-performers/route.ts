/**
 * Top Performers API
 * GET /api/reports/top-performers - Get top performing employees
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission, getUserPermissions } from "@/db/utils/permissions";
import { getTopPerformersByQuality } from "@/db/utils/evaluations";
import { getTopPerformersByEntryCount } from "@/db/utils/entries";

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

    // Get user permissions
    const userPerms = await getUserPermissions(session.user.id);
    if (!userPerms) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const metric = searchParams.get("metric") || "quality"; // 'quality' or 'quantity'

    // Determine filters based on scope
    const filters: any = {
      startDate,
      endDate,
    };

    const readPermission = userPerms.permissions.find(
      (p) => p.resource === "reports" && p.action === "read"
    );

    if (readPermission?.scope === "team") {
      if (userPerms.teamId) {
        filters.teamId = userPerms.teamId;
      }
    }
    // 'own' scope doesn't make sense for top performers
    // 'all' scope has no filters

    let performers;
    if (metric === "quantity") {
      // Top performers by entry count
      performers = await getTopPerformersByEntryCount(limit, filters);
    } else {
      // Top performers by quality score
      performers = await getTopPerformersByQuality(limit, filters);
    }

    return NextResponse.json({
      success: true,
      data: performers,
      metric,
      dateRange:
        filters.startDate && filters.endDate
          ? {
              start: filters.startDate,
              end: filters.endDate,
            }
          : undefined,
    });
  } catch (error) {
    console.error("Error fetching top performers:", error);
    return NextResponse.json(
      { error: "Failed to fetch top performers" },
      { status: 500 }
    );
  }
}
