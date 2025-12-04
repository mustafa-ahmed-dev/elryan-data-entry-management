/**
 * Schedules API Routes
 * GET /api/schedules - List schedules
 * POST /api/schedules - Create schedule
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission, getUserPermissions } from "@/db/utils/permissions";
import {
  getSchedules,
  createSchedule,
  getPendingSchedules,
} from "@/db/utils/schedules";

// GET /api/schedules - List schedules
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const canRead = await checkPermission(session.user.id, "schedules", "read");
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
    const userId = searchParams.get("userId");
    const teamId = searchParams.get("teamId");
    const status = searchParams.get("status") as any;
    const weekStartDate = searchParams.get("weekStartDate") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const pendingOnly = searchParams.get("pending") === "true";

    // If requesting pending schedules
    if (pendingOnly) {
      const canApprove = await checkPermission(
        session.user.id,
        "schedules",
        "approve"
      );
      if (!canApprove) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const pending = await getPendingSchedules();
      return NextResponse.json({
        success: true,
        data: pending,
      });
    }

    // Build filters based on permission scope
    const filters: any = {
      page,
      pageSize,
      status,
      weekStartDate,
    };

    const readPermission = userPerms.permissions.find(
      (p) => p.resource === "schedules" && p.action === "read"
    );

    if (readPermission?.scope === "own") {
      // Employee: only their own schedules
      filters.userId = session.user.id;
    } else if (readPermission?.scope === "team") {
      // Team leader: their team's schedules
      if (userPerms.teamId) {
        filters.teamId = userPerms.teamId;
      }
      if (userId) {
        filters.userId = parseInt(userId);
      }
    } else if (readPermission?.scope === "all") {
      // Admin: all schedules
      if (userId) filters.userId = parseInt(userId);
      if (teamId) filters.teamId = parseInt(teamId);
    }

    const result = await getSchedules(filters);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

// POST /api/schedules - Create schedule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const canCreate = await checkPermission(
      session.user.id,
      "schedules",
      "create"
    );
    if (!canCreate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (
      !body.userId ||
      !body.weekStartDate ||
      !body.weekEndDate ||
      !body.scheduleData
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create schedule
    const schedule = await createSchedule({
      userId: body.userId,
      weekStartDate: body.weekStartDate,
      weekEndDate: body.weekEndDate,
      scheduleData: body.scheduleData,
      createdBy: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create schedule",
      },
      { status: 500 }
    );
  }
}
