/**
 * Teams API Routes - WITH ENHANCED ERROR HANDLING
 * GET /api/teams - List teams
 * POST /api/teams - Create team
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { getTeams, getTeamsWithStats, createTeam } from "@/db/utils/teams";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

// GET /api/teams - List teams
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Get context FIRST
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  // Add user info to context
  context.userId = session.user.id;
  context.userEmail = session.user.email;

  // Check permission
  const canRead = await checkPermission(session.user.id, "teams", "read");
  if (!canRead) {
    return ApiErrors.insufficientPermissions(context, "teams:read");
  }

  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");
  const includeStats = searchParams.get("stats") === "true";

  // Validate pagination
  if (page < 1) {
    return ApiErrors.invalidInput(context, "Page must be >= 1", "page");
  }

  if (pageSize < 1 || pageSize > 100) {
    return ApiErrors.invalidInput(
      context,
      "Page size must be between 1 and 100",
      "pageSize"
    );
  }

  if (includeStats) {
    // Get teams with detailed statistics
    const teams = await getTeamsWithStats();
    return NextResponse.json(
      {
        success: true,
        data: teams,
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }

  // Get paginated teams
  const result = await getTeams({
    search,
    page,
    pageSize,
  });

  return NextResponse.json(
    {
      success: true,
      ...result,
    },
    {
      headers: {
        "X-Request-ID": context.requestId || "",
      },
    }
  );
});

// POST /api/teams - Create new team
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Get context FIRST
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  // Add user info to context
  context.userId = session.user.id;
  context.userEmail = session.user.email;

  // Check permission
  const canCreate = await checkPermission(
    session.user.id,
    "teams",
    "create",
    "all"
  );
  if (!canCreate) {
    return ApiErrors.insufficientPermissions(context, "teams:create:all");
  }

  const body = await request.json();

  // Validate required fields
  if (!body.name) {
    return ApiErrors.missingField(context, "name");
  }

  // Validate name
  if (typeof body.name !== "string" || body.name.trim().length === 0) {
    return ApiErrors.invalidInput(context, "Team name cannot be empty", "name");
  }

  if (body.name.length > 100) {
    return ApiErrors.invalidInput(
      context,
      "Team name must be 100 characters or less",
      "name"
    );
  }

  // Create team
  const team = await createTeam({
    name: body.name,
    description: body.description || null,
  });

  return NextResponse.json(
    {
      success: true,
      data: team,
      message: "Team created successfully",
    },
    {
      status: 201,
      headers: {
        "X-Request-ID": context.requestId || "",
      },
    }
  );
});
