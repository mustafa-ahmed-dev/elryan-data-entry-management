/**
 * Login Attempts API Route
 * GET /api/security-settings/login-attempts - Get login attempt logs
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { getLoginAttempts } from "@/db/utils/security-settings";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

// GET /api/security-settings/login-attempts
export const GET = withErrorHandling(async (request: NextRequest) => {
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  context.userId = session.user.id;
  context.userEmail = session.user.email;

  // Only admins can view login attempts
  const canView = await checkPermission(session.user.id, "settings", "read");

  if (!canView) {
    return ApiErrors.insufficientPermissions(context, "settings:read");
  }

  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse filters
    const filters: any = {};

    if (searchParams.get("userId")) {
      filters.userId = parseInt(searchParams.get("userId")!);
    }

    if (searchParams.get("email")) {
      filters.email = searchParams.get("email");
    }

    if (searchParams.get("ipAddress")) {
      filters.ipAddress = searchParams.get("ipAddress");
    }

    if (searchParams.get("success")) {
      filters.success = searchParams.get("success") === "true";
    }

    if (searchParams.get("startDate")) {
      filters.startDate = new Date(searchParams.get("startDate")!);
    }

    if (searchParams.get("endDate")) {
      filters.endDate = new Date(searchParams.get("endDate")!);
    }

    if (searchParams.get("limit")) {
      filters.limit = parseInt(searchParams.get("limit")!);
    } else {
      filters.limit = 100; // Default limit
    }

    // Fetch login attempts
    const attempts = await getLoginAttempts(filters);

    // Note: This will return empty array until login_attempts table is implemented
    return NextResponse.json(
      {
        success: true,
        data: attempts,
        count: attempts.length,
        filters,
        timestamp: new Date().toISOString(),
        note:
          attempts.length === 0
            ? "Login attempts table not yet implemented"
            : undefined,
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching login attempts:", error);
    return ApiErrors.internalError(context, "Failed to fetch login attempts");
  }
});
