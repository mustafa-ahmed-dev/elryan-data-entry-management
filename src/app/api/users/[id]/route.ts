// src/app/api/users/[id]/route.ts
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
import { getUserById, updateUser, deleteUser } from "@/db/utils/users";
import { hash } from "argon2";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

interface RouteParams {
  params: { id: string };
}

// GET /api/users/[id]
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    const context = await getRequestContext(request);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(context);
    }

    // Add user context for logging
    context.userId = session.user.id;
    context.userEmail = session.user.email;

    const canRead = await checkPermission(session.user.id, "users", "read");
    if (!canRead) {
      return ApiErrors.insufficientPermissions(context, "users:read");
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return ApiErrors.invalidId(context, "User");
    }

    const user = await getUserById(userId);
    if (!user) {
      return ApiErrors.userNotFound(context);
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
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);

// PATCH /api/users/[id]
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
      "users",
      "update",
      "all"
    );
    if (!canUpdate) {
      return ApiErrors.insufficientPermissions(context, "users:update:all");
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return ApiErrors.invalidId(context, "User");
    }

    const body = await request.json();

    // Build update object with validation
    const updateData: any = {};

    if (body.fullName !== undefined) {
      if (
        typeof body.fullName !== "string" ||
        body.fullName.trim().length === 0
      ) {
        return ApiErrors.invalidInput(
          context,
          "Full name must be a non-empty string",
          "fullName"
        );
      }
      updateData.fullName = body.fullName.trim();
    }

    if (body.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return ApiErrors.invalidInput(context, "Invalid email format", "email");
      }
      updateData.email = body.email.toLowerCase();
    }

    if (body.password !== undefined) {
      if (typeof body.password !== "string" || body.password.length < 8) {
        return ApiErrors.invalidInput(
          context,
          "Password must be at least 8 characters",
          "password"
        );
      }
      updateData.passwordHash = await hash(body.password);
    }

    if (body.roleId !== undefined) {
      const roleId = parseInt(body.roleId);
      if (isNaN(roleId)) {
        return ApiErrors.invalidInput(
          context,
          "Role ID must be a number",
          "roleId"
        );
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
            context,
            "Team ID must be a number",
            "teamId"
          );
        }
        updateData.teamId = teamId;
      }
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return ApiErrors.invalidInput(
          context,
          "isActive must be a boolean",
          "isActive"
        );
      }
      updateData.isActive = body.isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return ApiErrors.invalidInput(context, "No valid fields to update");
    }

    try {
      const updatedUser = await updateUser(userId, updateData);

      if (!updatedUser) {
        return ApiErrors.userNotFound(context);
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
            "X-Request-ID": context.requestId || "",
          },
        }
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("duplicate")) {
        return ApiErrors.duplicateEntry(context, "email");
      }
      throw error; // Let withErrorHandling catch it
    }
  }
);

// DELETE /api/users/[id]
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
      "users",
      "delete",
      "all"
    );
    if (!canDelete) {
      return ApiErrors.insufficientPermissions(context, "users:delete:all");
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return ApiErrors.invalidId(context, "User");
    }

    // Prevent self-deletion
    if (userId === session.user.id) {
      return ApiErrors.businessRuleViolation(
        context,
        "Cannot delete your own account"
      );
    }

    const deletedUser = await deleteUser(userId);

    if (!deletedUser) {
      return ApiErrors.userNotFound(context);
    }

    return NextResponse.json(
      {
        success: true,
        message: "User deleted successfully",
        data: { id: userId },
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);
