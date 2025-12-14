import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { rejectSchedule } from "@/db/utils/schedules";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const POST = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    const context = await getRequestContext(request);
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(context);
    }

    context.userId = session.user.id;
    context.userEmail = session.user.email;

    const canReject = await checkPermission(
      session.user.id,
      "schedules",
      "reject"
    );
    if (!canReject) {
      return ApiErrors.insufficientPermissions(context, "schedules:reject");
    }

    const scheduleId = parseInt(id);
    if (isNaN(scheduleId)) {
      return ApiErrors.invalidId(context, "Schedule");
    }

    const body = await request.json();
    const { reason } = body;

    try {
      const schedule = await rejectSchedule(
        scheduleId,
        session.user.id,
        reason
      );

      return NextResponse.json(
        {
          success: true,
          data: schedule,
          message: "Schedule rejected",
        },
        {
          headers: {
            "X-Request-ID": context.requestId || "",
          },
        }
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return ApiErrors.notFound(context, "Schedule");
      }
      throw error;
    }
  }
);
