/**
 * Quality Trends API
 * GET /api/reports/quality-trends - Get quality trends over time
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission, getUserPermissions } from "@/db/utils/permissions";
import { getQualityTrends } from "@/db/utils/evaluations";

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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }

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

    // Get quality trends
    const trends = await getQualityTrends(startDate, endDate, filters);

    return NextResponse.json({
      success: true,
      data: trends,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    });
  } catch (error) {
    console.error("Error fetching quality trends:", error);
    return NextResponse.json(
      { error: "Failed to fetch quality trends" },
      { status: 500 }
    );
  }
}
