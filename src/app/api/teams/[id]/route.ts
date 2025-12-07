/**
 * Team Detail API Routes - Fixed for Next.js 15+
 * GET /api/teams/[id] - Get team details
 * PATCH /api/teams/[id] - Update team
 * DELETE /api/teams/[id] - Delete team
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { getTeamById, updateTeam, deleteTeam } from "@/db/utils/teams";

interface RouteParams {
  params: Promise<{ id: string }>; // ✅ Now a Promise
}

// GET /api/teams/[id] - Get team details
export async function GET(request: NextRequest, props: RouteParams) {
  try {
    const params = await props.params; // ✅ Await params

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canRead = await checkPermission(session.user.id, "teams", "read");
    if (!canRead) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const teamId = parseInt(params.id);
    if (isNaN(teamId)) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    const team = await getTeamById(teamId);

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: team,
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}

// PATCH /api/teams/[id] - Update team
export async function PATCH(request: NextRequest, props: RouteParams) {
  try {
    const params = await props.params; // ✅ Await params

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
    if (isNaN(teamId)) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    const body = await request.json();

    // Validate at least one field is being updated
    if (
      !body.name &&
      body.description === undefined &&
      body.leaderId === undefined &&
      body.isActive === undefined
    ) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const team = await updateTeam(teamId, body);

    return NextResponse.json({
      success: true,
      data: team,
    });
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update team",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id] - Delete team
export async function DELETE(request: NextRequest, props: RouteParams) {
  try {
    const params = await props.params; // ✅ Await params

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canDelete = await checkPermission(
      session.user.id,
      "teams",
      "delete",
      "all"
    );
    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const teamId = parseInt(params.id);
    if (isNaN(teamId)) {
      return NextResponse.json({ error: "Invalid team ID" }, { status: 400 });
    }

    await deleteTeam(teamId);

    return NextResponse.json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete team",
      },
      { status: 500 }
    );
  }
}
