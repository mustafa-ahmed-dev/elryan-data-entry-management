/**
 * Schedule Approval API
 * POST /api/schedules/[id]/approve - Approve schedule
 * POST /api/schedules/[id]/reject - Reject schedule
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { approveSchedule, rejectSchedule } from "@/db/utils/schedules";

interface RouteParams {
  params: { id: string };
}

// POST /api/schedules/[id]/approve
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const canApprove = await checkPermission(
      session.user.id,
      "schedules",
      "approve"
    );
    if (!canApprove) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const scheduleId = parseInt(params.id);

    // Check if this is a rejection
    const body = await request.json();
    if (body.action === "reject") {
      if (!body.reason) {
        return NextResponse.json(
          { error: "Rejection reason is required" },
          { status: 400 }
        );
      }

      const schedule = await rejectSchedule(
        scheduleId,
        session.user.id,
        body.reason
      );

      return NextResponse.json({
        success: true,
        data: schedule,
        message: "Schedule rejected",
      });
    }

    // Approve schedule
    const schedule = await approveSchedule(scheduleId, session.user.id);

    return NextResponse.json({
      success: true,
      data: schedule,
      message: "Schedule approved",
    });
  } catch (error) {
    console.error("Error approving/rejecting schedule:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process schedule",
      },
      { status: 500 }
    );
  }
}
