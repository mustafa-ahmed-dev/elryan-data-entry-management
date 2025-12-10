/**
 * Permission Audit Log API Route
 * GET /api/permissions/audit - Get permission change audit logs
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { getPermissionAuditLog } from "@/db/utils/permissions";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

// GET /api/permissions/audit
export const GET = withErrorHandling(async (request: NextRequest) => {
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  context.userId = session.user.id;
  context.userEmail = session.user.email;

  // Only admins can view audit logs
  const canViewAudit = await checkPermission(
    session.user.id,
    "settings",
    "read"
  );

  if (!canViewAudit) {
    return ApiErrors.insufficientPermissions(context, "settings:read");
  }

  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse filters from query params
    const filters: any = {};

    if (searchParams.get("userId")) {
      filters.userId = parseInt(searchParams.get("userId")!);
    }

    if (searchParams.get("roleId")) {
      filters.roleId = parseInt(searchParams.get("roleId")!);
    }

    if (searchParams.get("resourceType")) {
      filters.resourceType = searchParams.get("resourceType");
    }

    if (searchParams.get("startDate")) {
      filters.startDate = new Date(searchParams.get("startDate")!);
    }

    if (searchParams.get("endDate")) {
      filters.endDate = new Date(searchParams.get("endDate")!);
    }

    if (searchParams.get("limit")) {
      filters.limit = parseInt(searchParams.get("limit")!);
    }

    // Fetch audit logs
    const logs = await getPermissionAuditLog(filters);

    // Note: This will return empty array until audit_logs table is implemented
    return NextResponse.json(
      {
        success: true,
        data: logs,
        count: logs.length,
        filters,
        timestamp: new Date().toISOString(),
        note:
          logs.length === 0 ? "Audit log table not yet implemented" : undefined,
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return ApiErrors.internalError(context, "Failed to fetch audit logs");
  }
});
