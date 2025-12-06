/**
 * Remove Team Member API
 * DELETE /api/teams/[id]/members/[userId] - Remove user from team
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { removeUsersFromTeam } from "@/db/utils/teams";

interface RouteParams {
  params: { id: string; userId: string };
}

// DELETE /api/teams/[id]/members/[userId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const userId = parseInt(params.userId);
    await removeUsersFromTeam([userId]);

    return NextResponse.json({
      success: true,
      message: "User removed from team successfully",
    });
  } catch (error) {
    console.error("Error removing user from team:", error);
    return NextResponse.json(
      { error: "Failed to remove user from team" },
      { status: 500 }
    );
  }
}
