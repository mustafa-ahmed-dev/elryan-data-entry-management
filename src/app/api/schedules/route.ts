// src/app/api/schedules/route.ts
/**
 * Schedules API Routes
 * GET /api/schedules - List schedules
 * POST /api/schedules - Create schedule
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission, getUserPermissions } from "@/db/utils/permissions";
import { getSchedules, createSchedule } from "@/db/utils/schedules";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

// GET /api/schedules - List schedules
export const GET = withErrorHandling(async (request: NextRequest) => {
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  context.userId = session.user.id;
  context.userEmail = session.user.email;

  const canRead = await checkPermission(session.user.id, "schedules", "read");
  if (!canRead) {
    return ApiErrors.insufficientPermissions(context, "schedules:read");
  }

  const userPerms = await getUserPermissions(session.user.id);
  if (!userPerms) {
    return ApiErrors.forbidden(context);
  }

  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const teamId = searchParams.get("teamId");
  const status = searchParams.get("status") as any;
  const weekStartDate = searchParams.get("weekStartDate") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  // Validate pagination
  if (page < 1) {
    return ApiErrors.invalidInput(context, "Page must be >= 1", "page");
  }
  if (pageSize < 1 || pageSize > 100) {
    return ApiErrors.invalidInput(
      context,
      "Page size must be between 1 and 100",
      "pageSize"
    );
  }

  // Build filters
  const filters: any = {
    page,
    pageSize,
    weekStartDate,
    status,
  };

  if (userId) {
    const uid = parseInt(userId);
    if (isNaN(uid)) {
      return ApiErrors.invalidInput(context, "Invalid user ID", "userId");
    }
    filters.userId = uid;
  }

  if (teamId) {
    const tid = parseInt(teamId);
    if (isNaN(tid)) {
      return ApiErrors.invalidInput(context, "Invalid team ID", "teamId");
    }
    filters.teamId = tid;
  }

  // Apply permission-based filtering
  const readPermission = userPerms.permissions.find(
    (p) => p.resource === "schedules" && p.action === "read"
  );

  if (readPermission?.scope === "own") {
    filters.userId = session.user.id;
  } else if (readPermission?.scope === "team") {
    if (userPerms.teamId) {
      filters.teamId = userPerms.teamId;
    }
  }

  const result = await getSchedules(filters);

  return NextResponse.json(
    {
      success: true,
      data: result.schedules,
      pagination: {
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
      },
    },
    {
      headers: {
        "X-Request-ID": context.requestId || "",
      },
    }
  );
});

// POST /api/schedules - Create schedule
export const POST = withErrorHandling(async (request: NextRequest) => {
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  context.userId = session.user.id;
  context.userEmail = session.user.email;

  const canCreate = await checkPermission(
    session.user.id,
    "schedules",
    "create"
  );
  if (!canCreate) {
    return ApiErrors.insufficientPermissions(context, "schedules:create");
  }

  const body = await request.json();

  // Validate required fields
  if (!body.userId) {
    return ApiErrors.missingField(context, "userId");
  }
  if (!body.weekStartDate) {
    return ApiErrors.missingField(context, "weekStartDate");
  }
  if (!body.weekEndDate) {
    return ApiErrors.missingField(context, "weekEndDate");
  }
  if (!body.scheduleData) {
    return ApiErrors.missingField(context, "scheduleData");
  }

  // Validate user ID
  const userId = parseInt(body.userId);
  if (isNaN(userId)) {
    return ApiErrors.invalidInput(
      context,
      "User ID must be a number",
      "userId"
    );
  }

  // Validate date range
  const startDate = new Date(body.weekStartDate);
  const endDate = new Date(body.weekEndDate);
  if (startDate > endDate) {
    return ApiErrors.invalidDateRange(context);
  }

  // Check permission scope
  const userPerms = await getUserPermissions(session.user.id);
  const createPermission = userPerms?.permissions.find(
    (p) => p.resource === "schedules" && p.action === "create"
  );

  if (createPermission?.scope === "own" && userId !== session.user.id) {
    return ApiErrors.businessRuleViolation(
      context,
      "You can only create schedules for yourself"
    );
  }

  const schedule = await createSchedule({
    userId,
    weekStartDate: body.weekStartDate,
    weekEndDate: body.weekEndDate,
    scheduleData: body.scheduleData,
    createdBy: session.user.id,
  });

  return NextResponse.json(
    {
      success: true,
      data: schedule,
      message: "Schedule created successfully",
    },
    {
      status: 201,
      headers: {
        "X-Request-ID": context.requestId || "",
      },
    }
  );
});
