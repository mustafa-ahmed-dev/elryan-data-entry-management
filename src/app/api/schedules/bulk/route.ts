import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { createSchedule } from "@/db/utils/schedules";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";
import type { WeekScheduleData } from "@/db/utils/schedules";

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

  if (!Array.isArray(body)) {
    return ApiErrors.invalidInput(
      context,
      "Request body must be an array",
      "schedules"
    );
  }

  if (body.length === 0) {
    return ApiErrors.invalidInput(
      context,
      "Array cannot be empty",
      "schedules"
    );
  }

  const createdSchedules = [];
  const errors = [];

  for (let i = 0; i < body.length; i++) {
    const scheduleInput = body[i];

    try {
      // Validate required fields
      if (!scheduleInput.userId) {
        throw new Error(`schedules[${i}]: userId is required`);
      }
      if (!scheduleInput.weekStartDate) {
        throw new Error(`schedules[${i}]: weekStartDate is required`);
      }
      if (!scheduleInput.weekEndDate) {
        throw new Error(`schedules[${i}]: weekEndDate is required`);
      }
      if (!scheduleInput.scheduleData) {
        throw new Error(`schedules[${i}]: scheduleData is required`);
      }

      const schedule = await createSchedule({
        userId: parseInt(scheduleInput.userId),
        weekStartDate: scheduleInput.weekStartDate,
        weekEndDate: scheduleInput.weekEndDate,
        scheduleData: scheduleInput.scheduleData as WeekScheduleData,
        createdBy: session.user.id,
      });

      createdSchedules.push(schedule);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to create schedule at index ${i}`;
      errors.push({
        index: i,
        userId: scheduleInput.userId,
        error: errorMessage,
      });
    }
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        created: createdSchedules,
        errors,
      },
      message: `${createdSchedules.length} schedule(s) created successfully${
        errors.length > 0 ? `, ${errors.length} failed` : ""
      }`,
    },
    {
      status: 201,
      headers: {
        "X-Request-ID": context.requestId || "",
      },
    }
  );
});
