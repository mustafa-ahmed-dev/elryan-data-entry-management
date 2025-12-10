/**
 * Remove Team Member API - WITH ENHANCED ERROR HANDLING
 * DELETE /api/teams/[id]/members/[userId] - Remove user from team
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { removeUsersFromTeam } from "@/db/utils/teams";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

interface RouteParams {
  params: { id: string; userId: string };
}

// DELETE /api/teams/[id]/members/[userId]
export const DELETE = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    // Get context FIRST
    const context = await getRequestContext(request);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(context);
    }

    // Add user info to context
    context.userId = session.user.id;
    context.userEmail = session.user.email;

    const canUpdate = await checkPermission(
      session.user.id,
      "teams",
      "update",
      "all"
    );
    if (!canUpdate) {
      return ApiErrors.insufficientPermissions(context, "teams:update:all");
    }

    // Validate team ID
    const teamId = parseInt(params.id);
    if (isNaN(teamId)) {
      return ApiErrors.invalidId(context, "Team");
    }

    // Validate user ID
    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return ApiErrors.invalidId(context, "User");
    }

    await removeUsersFromTeam([userId]);

    return NextResponse.json(
      {
        success: true,
        message: "User removed from team successfully",
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);
