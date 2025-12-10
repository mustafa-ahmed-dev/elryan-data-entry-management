/**
 * Team Members API Routes - WITH ENHANCED ERROR HANDLING
 * GET /api/teams/[id]/members - Get team members
 * POST /api/teams/[id]/members - Assign users to team
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { getTeamMembers, assignUsersToTeam } from "@/db/utils/teams";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

interface RouteParams {
  params: { id: string };
}

// GET /api/teams/[id]/members
export const GET = withErrorHandling(
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

    const canRead = await checkPermission(session.user.id, "teams", "read");
    if (!canRead) {
      return ApiErrors.insufficientPermissions(context, "teams:read");
    }

    const teamId = parseInt(params.id);
    if (isNaN(teamId)) {
      return ApiErrors.invalidId(context, "Team");
    }

    const members = await getTeamMembers(teamId);

    return NextResponse.json(
      {
        success: true,
        data: members,
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);

// POST /api/teams/[id]/members - Assign users to team
export const POST = withErrorHandling(
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

    const teamId = parseInt(params.id);
    if (isNaN(teamId)) {
      return ApiErrors.invalidId(context, "Team");
    }

    const body = await request.json();

    // Validate required fields
    if (!body.userIds) {
      return ApiErrors.missingField(context, "userIds");
    }

    if (!Array.isArray(body.userIds)) {
      return ApiErrors.invalidInput(
        context,
        "userIds must be an array",
        "userIds"
      );
    }

    if (body.userIds.length === 0) {
      return ApiErrors.invalidInput(
        context,
        "userIds array cannot be empty",
        "userIds"
      );
    }

    // Validate all user IDs are numbers
    for (let i = 0; i < body.userIds.length; i++) {
      const userId = parseInt(body.userIds[i]);
      if (isNaN(userId)) {
        return ApiErrors.invalidInput(
          context,
          `Invalid user ID at index ${i}`,
          `userIds[${i}]`
        );
      }
    }

    await assignUsersToTeam(teamId, body.userIds);

    return NextResponse.json(
      {
        success: true,
        message: `${body.userIds.length} user(s) assigned to team successfully`,
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);
