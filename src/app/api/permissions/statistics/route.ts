/**
 * Permission Statistics API Route
 * GET /api/permissions/statistics - Get permission statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { getPermissionStatistics, getAllRoles } from "@/db/utils/permissions";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

// GET /api/permissions/statistics
export const GET = withErrorHandling(async (request: NextRequest) => {
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

  try {
    const stats = await getPermissionStatistics();
    const roles = await getAllRoles();

    return NextResponse.json(
      {
        success: true,
        data: {
          ...stats,
          roles: roles.map((r) => ({
            id: r.id,
            name: r.name,
            displayName: r.displayName,
            permissionCount: r.permissionCount,
          })),
        },
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching permission statistics:", error);
    return ApiErrors.internalError(
      context,
      "Failed to fetch permission statistics"
    );
  }
});
