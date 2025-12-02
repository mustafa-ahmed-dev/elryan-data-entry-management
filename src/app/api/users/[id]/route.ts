import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, teams } from "@/db/schema";
import { eq } from "drizzle-orm";
import argon2 from "argon2";
import { requireAuth, requireRole, isAdmin } from "@/lib/middleware/auth";
import {
  handleApiError,
  successResponse,
  noContentResponse,
  parseBody,
} from "@/lib/api/utils";
import { updateUserSchema } from "@/lib/validations/schemas";

/**
 * GET /api/users/[id] - Get user details
 * Requires: authenticated (can view own profile or admin/team_leader)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const userId = parseInt(params.id);

    // Users can view their own profile, or admin/team_leader can view anyone
    const canView =
      session.user.id === params.id ||
      session.user.role === "admin" ||
      session.user.role === "team_leader";

    if (!canView) {
      throw new Error("Forbidden - Cannot view this user");
    }

    // Get user with team info
    const [user] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        teamId: users.teamId,
        teamName: teams.name,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .leftJoin(teams, eq(users.teamId, teams.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error("User not found");
    }

    return successResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/users/[id] - Update user
 * Requires: admin (or users can update their own limited fields)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const userId = parseInt(params.id);
    const body = await parseBody(request);

    // Check if user is updating their own profile
    const isSelf = session.user.id === params.id;
    const isAdminUser = isAdmin(session);

    // Non-admin users can only update their own profile and limited fields
    if (!isSelf && !isAdminUser) {
      throw new Error("Forbidden - Cannot update this user");
    }

    // Validate request body
    const validatedData = updateUserSchema.parse(body);

    // If not admin, restrict what can be updated
    if (!isAdminUser) {
      const allowedFields = ["fullName", "password"];
      const hasRestrictedFields = Object.keys(validatedData).some(
        (key) => !allowedFields.includes(key)
      );

      if (hasRestrictedFields) {
        throw new Error("Forbidden - Cannot update these fields");
      }
    }

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser) {
      throw new Error("User not found");
    }

    // If email is being changed, check for duplicates
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const [duplicate] = await db
        .select()
        .from(users)
        .where(eq(users.email, validatedData.email))
        .limit(1);

      if (duplicate) {
        throw new Error("Email already in use");
      }
    }

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    };

    // Hash password if provided
    if (validatedData.password) {
      updateData.passwordHash = await argon2.hash(validatedData.password);
      delete updateData.password;
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        teamId: users.teamId,
        isActive: users.isActive,
        updatedAt: users.updatedAt,
      });

    return successResponse(updatedUser, "User updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/users/[id] - Deactivate user (soft delete)
 * Requires: admin
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole("admin");
    const userId = parseInt(params.id);

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error("User not found");
    }

    // Soft delete - set isActive to false
    await db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return successResponse(
      { id: userId, isActive: false },
      "User deactivated successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}
