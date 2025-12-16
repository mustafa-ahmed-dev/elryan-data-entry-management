/**
 * Daily Reports API - WITH ENHANCED ERROR HANDLING
 * GET /api/reports/daily - Get daily statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission, getUserPermissions } from "@/db/utils/permissions";
import { getEntryStats } from "@/db/utils/entries";
import { getEvaluationStats } from "@/db/utils/evaluations";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Get context FIRST
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  // Add user info to context
  context.userId = session.user.id;
  context.userEmail = session.user.email;

  // Check permission
  const canRead = await checkPermission(session.user.id, "reports", "read");
  if (!canRead) {
    return ApiErrors.insufficientPermissions(context, "reports:read");
  }

  // Get user permissions for scope
  const userPerms = await getUserPermissions(session.user.id);
  if (!userPerms) {
    return ApiErrors.forbidden(context);
  }

  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // Validate date range if both provided
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return ApiErrors.invalidDateRange(context);
  }

  // Validate date format if provided
  if (date && isNaN(Date.parse(date))) {
    return ApiErrors.invalidInput(context, "Invalid date format", "date");
  }

  if (startDate && isNaN(Date.parse(startDate))) {
    return ApiErrors.invalidInput(
      context,
      "Invalid start date format",
      "startDate"
    );
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    return ApiErrors.invalidInput(
      context,
      "Invalid end date format",
      "endDate"
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
  // let dailyTrends;
  // if (filters.startDate && filters.endDate) {
  //   dailyTrends = await getDailyEntryCounts(
  //     filters.startDate,
  //     filters.endDate,
  //     {
  //       employeeId: filters.employeeId,
  //       teamId: filters.teamId,
  //     }
  //   );
  // }

  return NextResponse.json(
    {
      success: true,
      data: {
        entries: entryStats,
        evaluations: evaluationStats,
        // dailyTrends,
        dateRange: {
          start: filters.startDate,
          end: filters.endDate,
        },
      },
    },
    {
      headers: {
        "X-Request-ID": context.requestId || "",
      },
    }
  );
});
