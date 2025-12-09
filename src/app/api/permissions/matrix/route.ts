/**
 * Permission Matrix API Route
 * GET /api/permissions/matrix - Get full permissions matrix
 * PATCH /api/permissions/matrix - Update multiple permissions
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import {
  getPermissionMatrix,
  updateRolePermissions,
} from "@/db/utils/permissions";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";
import { z } from "zod";

// Validation schema for permission updates
const permissionUpdateSchema = z.object({
  roleId: z.number().int().positive(),
  updates: z.array(
    z.object({
      resourceId: z.number().int().positive(),
      actionId: z.number().int().positive(),
      granted: z.boolean(),
      scope: z.enum(["own", "team", "all"]),
    })
  ),
});

// GET /api/permissions/matrix - Get full permission matrix
export const GET = withErrorHandling(async (request: NextRequest) => {
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  context.userId = session.user.id;
  context.userEmail = session.user.email;

  // Only admins can view the full permission matrix
  const canManagePermissions = await checkPermission(
    session.user.id,
    "settings",
    "update"
  );

  if (!canManagePermissions) {
    return ApiErrors.insufficientPermissions(context, "settings:update");
  }

  try {
    const matrix = await getPermissionMatrix();

    return NextResponse.json(
      {
        success: true,
        data: matrix,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching permission matrix:", error);
    return ApiErrors.internalError(
      context,
      "Failed to fetch permission matrix"
    );
  }
});

// PATCH /api/permissions/matrix - Update multiple permissions
export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  context.userId = session.user.id;
  context.userEmail = session.user.email;

  // Only admins can update permissions
  const canManagePermissions = await checkPermission(
    session.user.id,
    "settings",
    "update"
  );

  if (!canManagePermissions) {
    return ApiErrors.insufficientPermissions(context, "settings:update");
  }

  try {
    const body = await request.json();

    // Validate request body
    const validation = permissionUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.format((error) => error.message),
        },
        { status: 400 }
      );
    }

    const { roleId, updates } = validation.data;

    // Update permissions
    const result = await updateRolePermissions(roleId, updates);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update permissions",
          details: result.errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        updated: result.updated,
        errors: result.errors,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  } catch (error) {
    console.error("Error updating permissions:", error);
    return ApiErrors.internalError(context, "Failed to update permissions");
  }
});
