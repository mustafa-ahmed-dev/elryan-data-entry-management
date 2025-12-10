/**
 * Permissions API Route
 * GET /api/permissions
 *
 * Returns the current user's permissions from the database
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getUserPermissions } from "@/db/utils/permissions";

export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user permissions from database
    const userPermissions = await getUserPermissions(session.user.id);

    if (!userPermissions) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return permissions
    return NextResponse.json({
      success: true,
      permissions: userPermissions.permissions,
      role: {
        id: userPermissions.roleId,
        name: userPermissions.roleName,
        hierarchy: userPermissions.roleHierarchy,
      },
      teamId: userPermissions.teamId,
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);

    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}
