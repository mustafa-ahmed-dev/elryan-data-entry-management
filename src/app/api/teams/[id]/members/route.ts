/**
 * Team Members API Routes
 * GET /api/teams/[id]/members - Get team members
 * POST /api/teams/[id]/members - Assign users to team
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { getTeamMembers, assignUsersToTeam } from "@/db/utils/teams";

interface RouteParams {
  params: { id: string };
}

// GET /api/teams/[id]/members
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canRead = await checkPermission(session.user.id, "teams", "read");
    if (!canRead) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const teamId = parseInt(params.id);
    const members = await getTeamMembers(teamId);

    return NextResponse.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

// POST /api/teams/[id]/members - Assign users to team
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canUpdate = await checkPermission(
      session.user.id,
      "teams",
      "update",
      "all"
    );
    if (!canUpdate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const teamId = parseInt(params.id);
    const body = await request.json();

    if (!body.userIds || !Array.isArray(body.userIds)) {
      return NextResponse.json(
        { error: "userIds array is required" },
        { status: 400 }
      );
    }

    await assignUsersToTeam(teamId, body.userIds);

    return NextResponse.json({
      success: true,
      message: "Users assigned to team successfully",
    });
  } catch (error) {
    console.error("Error assigning users to team:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to assign users",
      },
      { status: 500 }
    );
  }
}
