/**
 * Role Permissions API Route
 * GET /api/permissions/role/[roleId] - Get all permissions for a role
 * PATCH /api/permissions/role/[roleId] - Update role permissions
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import {
  getPermissionsByRole,
  updateRolePermissions,
} from "@/db/utils/permissions";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";
import { z } from "zod";

interface RouteParams {
  params: { roleId: string };
}

// Validation schema
const updateSchema = z.object({
  updates: z.array(
    z.object({
      resourceId: z.number().int().positive(),
      actionId: z.number().int().positive(),
      granted: z.boolean(),
      scope: z.enum(["own", "team", "all"]),
    })
  ),
});

// GET /api/permissions/role/[roleId]
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    const context = await getRequestContext(request);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(context);
    }

    context.userId = session.user.id;
    context.userEmail = session.user.email;

    // Check permission
    const canView = await checkPermission(session.user.id, "settings", "read");

    if (!canView) {
      return ApiErrors.insufficientPermissions(context, "settings:read");
    }

    const roleId = parseInt(params.roleId);
    if (isNaN(roleId)) {
      return ApiErrors.invalidId(context, "Role ID");
    }

    try {
      const permissions = await getPermissionsByRole(roleId);

      return NextResponse.json(
        {
          success: true,
          data: permissions,
          roleId,
          count: permissions.length,
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            "X-Request-ID": context.requestId || "",
          },
        }
      );
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      return ApiErrors.internalError(
        context,
        "Failed to fetch role permissions"
      );
    }
  }
);

// PATCH /api/permissions/role/[roleId]
export const PATCH = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    const context = await getRequestContext(request);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(context);
    }

    context.userId = session.user.id;
    context.userEmail = session.user.email;

    // Check permission
    const canUpdate = await checkPermission(
      session.user.id,
      "settings",
      "update"
    );

    if (!canUpdate) {
      return ApiErrors.insufficientPermissions(context, "settings:update");
    }

    const roleId = parseInt(params.roleId);
    if (isNaN(roleId)) {
      return ApiErrors.invalidId(context, "Role ID");
    }

    try {
      const body = await request.json();

      // Validate
      const validation = updateSchema.safeParse(body);
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

      const { updates } = validation.data;

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
      console.error("Error updating role permissions:", error);
      return ApiErrors.internalError(
        context,
        "Failed to update role permissions"
      );
    }
  }
);
