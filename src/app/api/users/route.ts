/**
 * Users API Routes
 * GET /api/users - List users with pagination
 * POST /api/users - Create new user
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission, getUserPermissions } from "@/db/utils/permissions";
import { getUsers, createUser } from "@/db/utils/users";
import { hash } from "argon2";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

// GET /api/users - List users
export const GET = withErrorHandling(async (request: NextRequest) => {
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  context.userId = session.user.id;
  context.userEmail = session.user.email;

  const canRead = await checkPermission(session.user.id, "users", "read");
  if (!canRead) {
    return ApiErrors.insufficientPermissions(context, "users:read");
  }

  // Get user permissions to determine scope
  const userPerms = await getUserPermissions(session.user.id);
  if (!userPerms) {
    return ApiErrors.forbidden(context);
  }

  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const search = searchParams.get("search") || undefined;
  const roleId = searchParams.get("roleId");
  const teamId = searchParams.get("teamId");
  const isActive = searchParams.get("isActive");

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

  // Build filters based on permission scope
  const filters: any = {
    page,
    pageSize,
    search,
  };

  if (roleId) {
    const rid = parseInt(roleId);
    if (isNaN(rid)) {
      return ApiErrors.invalidInput(context, "Invalid role ID", "roleId");
    }
    filters.roleId = rid;
  }

  if (teamId) {
    const tid = parseInt(teamId);
    if (isNaN(tid)) {
      return ApiErrors.invalidInput(context, "Invalid team ID", "teamId");
    }
    filters.teamId = tid;
  }

  if (isActive !== null && isActive !== undefined) {
    filters.isActive = isActive === "true";
  }

  // Apply permission-based filtering
  const readPermission = userPerms.permissions.find(
    (p) => p.resource === "users" && p.action === "read"
  );

  if (readPermission?.scope === "team") {
    if (userPerms.teamId) {
      filters.teamId = userPerms.teamId;
    }
  } else if (readPermission?.scope === "own") {
    filters.userId = session.user.id;
  }

  const result = await getUsers(filters);

  return NextResponse.json(
    {
      success: true,
      data: result.users,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        totalItems: result.total,
      },
    },
    {
      headers: {
        "X-Request-ID": context.requestId || "",
      },
    }
  );
});

// POST /api/users - Create new user
export const POST = withErrorHandling(async (request: NextRequest) => {
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  context.userId = session.user.id;
  context.userEmail = session.user.email;

  const canCreate = await checkPermission(session.user.id, "users", "create");
  if (!canCreate) {
    return ApiErrors.insufficientPermissions(context, "users:create");
  }

  const body = await request.json();

  // Validate required fields
  if (!body.fullName) {
    return ApiErrors.missingField(context, "fullName");
  }
  if (!body.email) {
    return ApiErrors.missingField(context, "email");
  }
  if (!body.password) {
    return ApiErrors.missingField(context, "password");
  }
  if (!body.roleId) {
    return ApiErrors.missingField(context, "roleId");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return ApiErrors.invalidInput(context, "Invalid email format", "email");
  }

  // Hash password
  const passwordHash = await hash(body.password);

  try {
    const user = await createUser({
      fullName: body.fullName,
      email: body.email,
      passwordHash,
      roleId: body.roleId,
      teamId: body.teamId || null,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    // Don't return password hash
    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        success: true,
        data: userWithoutPassword,
        message: "User created successfully",
      },
      {
        status: 201,
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("duplicate") ||
        error.message.includes("unique")
      ) {
        return ApiErrors.duplicateEntry(context, "email");
      }
    }
    throw error;
  }
});
