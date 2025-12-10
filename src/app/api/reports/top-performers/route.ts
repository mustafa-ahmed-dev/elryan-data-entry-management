/**
 * Top Performers API - WITH ENHANCED ERROR HANDLING
 * GET /api/reports/top-performers - Get top performing employees
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission, getUserPermissions } from "@/db/utils/permissions";
import { getTopPerformersByQuality } from "@/db/utils/evaluations";
import { getTopPerformersByEntryCount } from "@/db/utils/entries";
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
  const limitParam = searchParams.get("limit");
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const metric = searchParams.get("metric") || "quality"; // 'quality' or 'quantity'

  // Validate limit
  const limit = limitParam ? parseInt(limitParam) : 10;
  if (isNaN(limit)) {
    return ApiErrors.invalidInput(context, "Limit must be a number", "limit");
  }

  if (limit < 1 || limit > 100) {
    return ApiErrors.invalidInput(
      context,
      "Limit must be between 1 and 100",
      "limit"
    );
  }

  // Validate metric
  if (metric !== "quality" && metric !== "quantity") {
    return ApiErrors.invalidInput(
      context,
      "Metric must be either 'quality' or 'quantity'",
      "metric"
    );
  }

  // Validate date formats if provided
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

  // Validate date range if both provided
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return ApiErrors.invalidDateRange(context);
  }

  // Determine filters based on scope
  const filters: any = {
    startDate,
    endDate,
  };

  const readPermission = userPerms.permissions.find(
    (p) => p.resource === "reports" && p.action === "read"
  );

  // Check if 'own' scope - doesn't make sense for top performers
  if (readPermission?.scope === "own") {
    return ApiErrors.businessRuleViolation(
      context,
      "Top performers report requires 'team' or 'all' scope permissions"
    );
  }

  if (readPermission?.scope === "team") {
    if (userPerms.teamId) {
      filters.teamId = userPerms.teamId;
    }
  }
  // 'all' scope has no filters

  // Get performers based on metric
  let performers;
  if (metric === "quantity") {
    performers = await getTopPerformersByEntryCount(limit, filters);
  } else {
    performers = await getTopPerformersByQuality(limit, filters);
  }

  return NextResponse.json(
    {
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
    },
    {
      headers: {
        "X-Request-ID": context.requestId || "",
      },
    }
  );
});
