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
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  context.userId = session.user.id;
  context.userEmail = session.user.email;

  // Fetch user permissions from database
  const userPermissions = await getUserPermissions(session.user.id);
  if (!userPermissions) {
    return ApiErrors.userNotFound(context);
  }

  return NextResponse.json(
    {
      success: true,
      permissions: userPermissions.permissions,
      role: {
        id: userPermissions.roleId,
        name: userPermissions.roleName,
        hierarchy: userPermissions.roleHierarchy,
      },
      teamId: userPermissions.teamId,
    },
    {
      headers: {
        "X-Request-ID": context.requestId || "",
      },
    }
  );
});
