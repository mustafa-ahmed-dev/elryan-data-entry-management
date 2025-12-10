/**
 * Team Detail API Routes - WITH ENHANCED ERROR HANDLING
 * GET /api/teams/[id] - Get team details
 * PATCH /api/teams/[id] - Update team
 * DELETE /api/teams/[id] - Delete team
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { getTeamById, updateTeam, deleteTeam } from "@/db/utils/teams";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

interface RouteParams {
  params: Promise<{ id: string }>; // Next.js 15+ - params is a Promise
}

// GET /api/teams/[id] - Get team details
export const GET = withErrorHandling(
  async (request: NextRequest, props: RouteParams) => {
    // Get context FIRST
    const context = await getRequestContext(request);

    const params = await props.params; // Await params

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

    const team = await getTeamById(teamId);

    if (!team) {
      return ApiErrors.notFound(context, "Team");
    }

    return NextResponse.json(
      {
        success: true,
        data: team,
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);

// PATCH /api/teams/[id] - Update team
export const PATCH = withErrorHandling(
  async (request: NextRequest, props: RouteParams) => {
    // Get context FIRST
    const context = await getRequestContext(request);

    const params = await props.params; // Await params

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

    // Validate at least one field is being updated
    if (
      !body.name &&
      body.description === undefined &&
      body.leaderId === undefined &&
      body.isActive === undefined
    ) {
      return ApiErrors.invalidInput(
        context,
        "At least one field must be provided for update"
      );
    }

    // Validate name if provided
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return ApiErrors.invalidInput(
          context,
          "Team name cannot be empty",
          "name"
        );
      }

      if (body.name.length > 100) {
        return ApiErrors.invalidInput(
          context,
          "Team name must be 100 characters or less",
          "name"
        );
      }
    }

    // Validate leaderId if provided
    if (body.leaderId !== undefined && body.leaderId !== null) {
      const leaderId = parseInt(body.leaderId);
      if (isNaN(leaderId)) {
        return ApiErrors.invalidInput(
          context,
          "Leader ID must be a number",
          "leaderId"
        );
      }
    }

    const team = await updateTeam(teamId, body);

    return NextResponse.json(
      {
        success: true,
        data: team,
        message: "Team updated successfully",
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);

// DELETE /api/teams/[id] - Delete team
export const DELETE = withErrorHandling(
  async (request: NextRequest, props: RouteParams) => {
    // Get context FIRST
    const context = await getRequestContext(request);

    const params = await props.params; // Await params

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(context);
    }

    // Add user info to context
    context.userId = session.user.id;
    context.userEmail = session.user.email;

    const canDelete = await checkPermission(
      session.user.id,
      "teams",
      "delete",
      "all"
    );
    if (!canDelete) {
      return ApiErrors.insufficientPermissions(context, "teams:delete:all");
    }

    const teamId = parseInt(params.id);
    if (isNaN(teamId)) {
      return ApiErrors.invalidId(context, "Team");
    }

    await deleteTeam(teamId);

    return NextResponse.json(
      {
        success: true,
        message: "Team deleted successfully",
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);
