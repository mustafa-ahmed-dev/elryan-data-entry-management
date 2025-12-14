/**
 * Schedule Detail API Routes
 * GET /api/schedules/[id] - Get schedule details
 * PATCH /api/schedules/[id] - Update schedule
 * DELETE /api/schedules/[id] - Delete schedule
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission, getUserPermissions } from "@/db/utils/permissions";
import {
  getScheduleById,
  updateSchedule,
  deleteSchedule,
} from "@/db/utils/schedules";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/schedules/[id]
export const GET = withErrorHandling(
  async (request: NextRequest, props: RouteParams) => {
    const context = await getRequestContext(request);
    const params = await props.params;

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

    const scheduleId = parseInt(params.id);
    if (isNaN(scheduleId)) {
      return ApiErrors.invalidId(context, "Schedule");
    }

    const schedule = await getScheduleById(scheduleId);
    if (!schedule) {
      return ApiErrors.notFound(context, "Schedule");
    }

    // Check permission scope
    const userPerms = await getUserPermissions(session.user.id);
    const readPermission = userPerms?.permissions.find(
      (p) => p.resource === "schedules" && p.action === "read"
    );

    if (
      readPermission?.scope === "own" &&
      schedule.userId !== session.user.id
    ) {
      return ApiErrors.forbidden(
        context,
        "You can only view your own schedules"
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: schedule,
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);

// PATCH /api/schedules/[id]
export const PATCH = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    const context = await getRequestContext(request);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(context);
    }

    context.userId = session.user.id;
    context.userEmail = session.user.email;

    const canUpdate = await checkPermission(
      session.user.id,
      "schedules",
      "update"
    );
    if (!canUpdate) {
      return ApiErrors.insufficientPermissions(context, "schedules:update");
    }

    const scheduleId = parseInt(params.id);
    if (isNaN(scheduleId)) {
      return ApiErrors.invalidId(context, "Schedule");
    }

    const schedule = await getScheduleById(scheduleId);
    if (!schedule) {
      return ApiErrors.notFound(context, "Schedule");
    }

    // Only admin can modify approved schedules
    if (schedule.status === "approved") {
      const userPerms = await getUserPermissions(session.user.id);
      if (userPerms?.roleName !== "admin") {
        return ApiErrors.businessRuleViolation(
          context,
          "Only admins can modify approved schedules"
        );
      }
    }

    // Check permission scope for non-admin users
    const userPerms = await getUserPermissions(session.user.id);
    const updatePermission = userPerms?.permissions.find(
      (p) => p.resource === "schedules" && p.action === "update"
    );

    if (
      updatePermission?.scope === "own" &&
      schedule.userId !== session.user.id
    ) {
      return ApiErrors.forbidden(
        context,
        "You can only update your own schedules"
      );
    }

    const body = await request.json();

    // Build update object
    const updateData: any = {};

    if (body.scheduleData !== undefined) {
      updateData.scheduleData = body.scheduleData;
    }

    if (body.weekStartDate !== undefined) {
      updateData.weekStartDate = body.weekStartDate;
    }

    if (body.weekEndDate !== undefined) {
      updateData.weekEndDate = body.weekEndDate;
    }

    if (Object.keys(updateData).length === 0) {
      return ApiErrors.invalidInput(context, "No valid fields to update");
    }

    const updatedSchedule = await updateSchedule(
      scheduleId,
      updateData,
      session.user.id
    );

    return NextResponse.json(
      {
        success: true,
        data: updatedSchedule,
        message: "Schedule updated successfully",
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);

// DELETE /api/schedules/[id]
export const DELETE = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    const context = await getRequestContext(request);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(context);
    }

    context.userId = session.user.id;
    context.userEmail = session.user.email;

    const canDelete = await checkPermission(
      session.user.id,
      "schedules",
      "delete"
    );
    if (!canDelete) {
      return ApiErrors.insufficientPermissions(context, "schedules:delete");
    }

    const scheduleId = parseInt(params.id);
    if (isNaN(scheduleId)) {
      return ApiErrors.invalidId(context, "Schedule");
    }

    const schedule = await getScheduleById(scheduleId);
    if (!schedule) {
      return ApiErrors.notFound(context, "Schedule");
    }

    // Cannot delete approved schedules
    if (schedule.status === "approved") {
      return ApiErrors.businessRuleViolation(
        context,
        "Cannot delete approved schedules"
      );
    }

    // Check permission scope
    const userPerms = await getUserPermissions(session.user.id);
    const deletePermission = userPerms?.permissions.find(
      (p) => p.resource === "schedules" && p.action === "delete"
    );

    if (
      deletePermission?.scope === "own" &&
      schedule.userId !== session.user.id
    ) {
      return ApiErrors.forbidden(
        context,
        "You can only delete your own schedules"
      );
    }

    await deleteSchedule(scheduleId);

    return NextResponse.json(
      {
        success: true,
        message: "Schedule deleted successfully",
        data: { id: scheduleId },
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);
