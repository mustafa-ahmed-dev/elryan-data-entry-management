/**
 * Quality Trends API - WITH ENHANCED ERROR HANDLING
 * GET /api/reports/quality-trends - Get quality trends over time
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission, getUserPermissions } from "@/db/utils/permissions";
import { getQualityTrends } from "@/db/utils/evaluations";
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

  // Get user permissions
  const userPerms = await getUserPermissions(session.user.id);
  if (!userPerms) {
    return ApiErrors.forbidden(context);
  }

  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // Validate required parameters
  if (!startDate) {
    return ApiErrors.missingField(context, "startDate");
  }

  if (!endDate) {
    return ApiErrors.missingField(context, "endDate");
  }

  // Validate date formats
  if (isNaN(Date.parse(startDate))) {
    return ApiErrors.invalidInput(
      context,
      "Invalid start date format",
      "startDate"
    );
  }

  if (isNaN(Date.parse(endDate))) {
    return ApiErrors.invalidInput(
      context,
      "Invalid end date format",
      "endDate"
    );
  }

  // Validate date range
  if (new Date(startDate) > new Date(endDate)) {
    return ApiErrors.invalidDateRange(context);
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

  return NextResponse.json(
    {
      success: true,
      data: trends,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    },
    {
      headers: {
        "X-Request-ID": context.requestId || "",
      },
    }
  );
});
