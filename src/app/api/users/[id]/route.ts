/**
 * User Detail API Routes
 * GET /api/users/[id] - Get user details
 * PATCH /api/users/[id] - Update user
 * DELETE /api/users/[id] - Delete user
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { getUserById, updateUser, deactivateUser } from "@/db/utils/users";
import { hash } from "argon2";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

interface RouteParams {
  params: Promise<{ id: string }>; // FIXED: Changed to Promise
}

// GET /api/users/[id]
export const GET = withErrorHandling(
  async (request: NextRequest, context: RouteParams) => {
    const reqContext = await getRequestContext(request);
    const params = await context.params; // FIXED: Await params

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(reqContext);
    }

    reqContext.userId = session.user.id;
    reqContext.userEmail = session.user.email;

    const canRead = await checkPermission(session.user.id, "users", "read");
    if (!canRead) {
      return ApiErrors.insufficientPermissions(reqContext, "users:read");
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return ApiErrors.invalidId(reqContext, "User");
    }

    const user = await getUserById(userId);
    if (!user) {
      return ApiErrors.notFound(reqContext, "User");
    }

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        success: true,
        data: userWithoutPassword,
      },
      {
        headers: {
          "X-Request-ID": reqContext.requestId || "",
        },
      }
    );
  }
);

// PATCH /api/users/[id]
export const PATCH = withErrorHandling(
  async (request: NextRequest, context: RouteParams) => {
    const reqContext = await getRequestContext(request);
    const params = await context.params; // FIXED: Await params

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(reqContext);
    }

    reqContext.userId = session.user.id;
    reqContext.userEmail = session.user.email;

    const canUpdate = await checkPermission(session.user.id, "users", "update");
    if (!canUpdate) {
      return ApiErrors.insufficientPermissions(reqContext, "users:update");
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return ApiErrors.invalidId(reqContext, "User");
    }

    const body = await request.json();

    // Build update object
    const updateData: any = {};

    if (body.fullName !== undefined) {
      if (
        typeof body.fullName !== "string" ||
        body.fullName.trim().length === 0
      ) {
        return ApiErrors.invalidInput(
          reqContext,
          "Full name must be a non-empty string",
          "fullName"
        );
      }
      updateData.fullName = body.fullName;
    }

    if (body.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return ApiErrors.invalidInput(
          reqContext,
          "Invalid email format",
          "email"
        );
      }
      updateData.email = body.email;
    }

    if (body.password !== undefined) {
      if (typeof body.password !== "string" || body.password.length < 8) {
        return ApiErrors.invalidInput(
          reqContext,
          "Password must be at least 8 characters",
          "password"
        );
      }
      updateData.passwordHash = await hash(body.password);
    }

    if (body.roleId !== undefined) {
      const roleId = parseInt(body.roleId);
      if (isNaN(roleId)) {
        return ApiErrors.invalidInput(reqContext, "Invalid role ID", "roleId");
      }
      updateData.roleId = roleId;
    }

    if (body.teamId !== undefined) {
      if (body.teamId === null) {
        updateData.teamId = null;
      } else {
        const teamId = parseInt(body.teamId);
        if (isNaN(teamId)) {
          return ApiErrors.invalidInput(
            reqContext,
            "Invalid team ID",
            "teamId"
          );
        }
        updateData.teamId = teamId;
      }
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return ApiErrors.invalidInput(
          reqContext,
          "isActive must be a boolean",
          "isActive"
        );
      }
      updateData.isActive = body.isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return ApiErrors.invalidInput(reqContext, "No valid fields to update");
    }

    try {
      const updatedUser = await updateUser(userId, updateData);

      if (!updatedUser) {
        return ApiErrors.notFound(reqContext, "User");
      }

      // Remove password hash from response
      const { passwordHash: _, ...userWithoutPassword } = updatedUser;

      return NextResponse.json(
        {
          success: true,
          data: userWithoutPassword,
          message: "User updated successfully",
        },
        {
          headers: {
            "X-Request-ID": reqContext.requestId || "",
          },
        }
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("duplicate")) {
        return ApiErrors.duplicateEntry(reqContext, "email");
      }
      throw error;
    }
  }
);

// DELETE /api/users/[id]
export const DELETE = withErrorHandling(
  async (request: NextRequest, context: RouteParams) => {
    const reqContext = await getRequestContext(request);
    const params = await context.params; // FIXED: Await params

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(reqContext);
    }

    reqContext.userId = session.user.id;
    reqContext.userEmail = session.user.email;

    const canDelete = await checkPermission(
      session.user.id,
      "users",
      "delete",
      "all"
    );
    if (!canDelete) {
      return ApiErrors.insufficientPermissions(reqContext, "users:delete:all");
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return ApiErrors.invalidId(reqContext, "User");
    }

    // Prevent self-deletion
    if (userId === session.user.id) {
      return ApiErrors.invalidInput(
        reqContext,
        "Cannot delete your own account"
      );
    }

    const deletedUser = await deactivateUser(userId);

    if (!deletedUser) {
      return ApiErrors.notFound(reqContext, "User");
    }

    return NextResponse.json(
      {
        success: true,
        message: "User deactivated successfully",
        data: { id: userId },
      },
      {
        headers: {
          "X-Request-ID": reqContext.requestId || "",
        },
      }
    );
  }
);
