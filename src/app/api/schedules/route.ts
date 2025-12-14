import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import {
  getSchedules,
  getScheduleStats,
  createSchedule,
} from "@/db/utils/schedules";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";
import type { WeekScheduleData } from "@/db/utils/schedules";

/**
 * GET /api/schedules
 * Get schedules with optional filters
 */
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

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const userId = searchParams.get("userId") || undefined;
  const weekStartDate = searchParams.get("weekStartDate") || undefined;
  const weekEndDate = searchParams.get("weekEndDate") || undefined;

  // Build filters based on user role
  let filters: any = {};

  if (session.user.roleName === "employee") {
    // Employees can only see their own schedules
    filters.userId = session.user.id;
  } else if (session.user.roleName === "team_leader") {
    // Team leaders can see their team's schedules
    filters.teamId = session.user.teamId;
    if (userId) filters.userId = parseInt(userId);
  } else {
    // Admins can see all schedules
    if (userId) filters.userId = parseInt(userId);
  }

  if (status) filters.status = status;
  if (weekStartDate) filters.weekStartDate = weekStartDate;
  if (weekEndDate) filters.weekEndDate = weekEndDate;

  const result = await getSchedules(filters);
  const stats = await getScheduleStats();

  return NextResponse.json(
    {
      success: true,
      data: result.data,
      pagination: result.pagination,
      stats,
    },
    {
      headers: {
        "X-Request-ID": context.requestId || "",
      },
    }
  );
});

/**
 * POST /api/schedules
 * Create a new schedule
 */
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
  const { userId, weekStartDate, weekEndDate, scheduleData } = body;

  // Validate required fields
  if (!userId) {
    return ApiErrors.missingField(context, "userId");
  }
  if (!weekStartDate) {
    return ApiErrors.missingField(context, "weekStartDate");
  }
  if (!weekEndDate) {
    return ApiErrors.missingField(context, "weekEndDate");
  }
  if (!scheduleData) {
    return ApiErrors.missingField(context, "scheduleData");
  }

  // Validate userId is a number
  const targetUserId = parseInt(userId);
  if (isNaN(targetUserId)) {
    return ApiErrors.invalidInput(
      context,
      "User ID must be a number",
      "userId"
    );
  }

  try {
    const schedule = await createSchedule({
      userId: targetUserId,
      weekStartDate,
      weekEndDate,
      scheduleData: scheduleData as WeekScheduleData,
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
  } catch (error) {
    if (error instanceof Error && error.message.includes("already exists")) {
      return ApiErrors.duplicateEntry(context, "schedule");
    }
    throw error;
  }
});
