/**
 * User by ID API Routes
 * GET /api/users/[id] - Get user
 * PATCH /api/users/[id] - Update user
 * DELETE /api/users/[id] - Delete user
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkResourceAccess } from "@/db/utils/permissions";
import {
  getUserById,
  updateUser,
  deleteUser,
  deactivateUser,
} from "@/db/utils/users";

interface RouteParams {
  params: { id: string };
}

// GET /api/users/[id] - Get user by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(params.id);
    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check permission
    const canRead = await checkResourceAccess(
      session.user.id,
      "users",
      "read",
      {
        ownerId: user.id,
        teamId: user.teamId || undefined,
      }
    );

    if (!canRead) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id] - Update user
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(params.id);
    const existingUser = await getUserById(userId);

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check permission
    const canUpdate = await checkResourceAccess(
      session.user.id,
      "users",
      "update",
      {
        ownerId: existingUser.id,
        teamId: existingUser.teamId || undefined,
      }
    );

    if (!canUpdate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Update user
    const user = await updateUser(userId, {
      fullName: body.fullName,
      email: body.email,
      password: body.password,
      roleId: body.roleId,
      teamId: body.teamId,
      isActive: body.isActive,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        roleId: user.roleId,
        teamId: user.teamId,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update user",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(params.id);
    const existingUser = await getUserById(userId);

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check permission
    const canDelete = await checkResourceAccess(
      session.user.id,
      "users",
      "delete",
      {
        ownerId: existingUser.id,
        teamId: existingUser.teamId || undefined,
      }
    );

    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete by default
    await deactivateUser(userId);

    // For permanent delete, use query param ?permanent=true
    const searchParams = request.nextUrl.searchParams;
    if (searchParams.get("permanent") === "true") {
      await deleteUser(userId);
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
