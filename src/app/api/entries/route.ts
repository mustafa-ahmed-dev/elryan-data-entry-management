import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission, getUserPermissions } from "@/db/utils/permissions";
import { getEntries, createEntry, bulkCreateEntries } from "@/db/utils/entries";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

/**
 * GET /api/entries
 * Get entries with optional filters
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  context.userId = session.user.id;
  context.userEmail = session.user.email;

  const canRead = await checkPermission(session.user.id, "entries", "read");
  if (!canRead) {
    return ApiErrors.insufficientPermissions(context, "entries:read");
  }

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const employeeId = searchParams.get("employeeId");
  const teamId = searchParams.get("teamId");
  const entryTypeId = searchParams.get("entryTypeId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const hasEvaluation = searchParams.get("hasEvaluation");

  // Build filters
  const filters: any = {
    page,
    pageSize: limit,
  };

  if (employeeId) filters.employeeId = parseInt(employeeId);
  if (teamId) filters.teamId = parseInt(teamId);
  if (entryTypeId) filters.entryTypeId = parseInt(entryTypeId);
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;
  if (hasEvaluation !== null) {
    filters.hasEvaluation = hasEvaluation === "true";
  }

  // Apply role-based filtering
  if (session.user.role === "employee") {
    filters.employeeId = session.user.id;
  } else if (session.user.role === "team_leader") {
    filters.teamId = session.user.teamId;
  }

  const result = await getEntries(filters);

  return NextResponse.json(
    {
      success: true,
      data: result.data,
      pagination: result.pagination,
    },
    {
      headers: {
        "X-Request-ID": context.requestId || "",
      },
    }
  );
});

/**
 * POST /api/entries
 * Create a new entry or bulk create entries
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  context.userId = session.user.id;
  context.userEmail = session.user.email;

  const canCreate = await checkPermission(session.user.id, "entries", "create");
  if (!canCreate) {
    return ApiErrors.insufficientPermissions(context, "entries:create");
  }

  const body = await request.json();

  // Check if bulk creation
  if (Array.isArray(body)) {
    // Validate all entries
    for (let i = 0; i < body.length; i++) {
      const entry = body[i];
      if (!entry.employeeId) {
        return ApiErrors.missingField(context, `entries[${i}].employeeId`);
      }
      if (!entry.entryTypeId) {
        return ApiErrors.missingField(context, `entries[${i}].entryTypeId`);
      }
      if (!entry.sku) {
        return ApiErrors.missingField(context, `entries[${i}].sku`);
      }
    }

    const entries = await bulkCreateEntries(body);

    return NextResponse.json(
      {
        success: true,
        data: entries,
        message: `${entries.length} entries created successfully`,
      },
      {
        status: 201,
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }

  // Single entry creation - validate required fields
  if (!body.employeeId) {
    return ApiErrors.missingField(context, "employeeId");
  }
  if (!body.entryTypeId) {
    return ApiErrors.missingField(context, "entryTypeId");
  }
  if (!body.sku) {
    return ApiErrors.missingField(context, "sku");
  }

  // Validate IDs
  const employeeId = parseInt(body.employeeId);
  if (isNaN(employeeId)) {
    return ApiErrors.invalidInput(
      context,
      "Employee ID must be a number",
      "employeeId"
    );
  }

  const entryTypeId = parseInt(body.entryTypeId);
  if (isNaN(entryTypeId)) {
    return ApiErrors.invalidInput(
      context,
      "Entry type ID must be a number",
      "entryTypeId"
    );
  }

  // Validate SKU
  if (typeof body.sku !== "string" || body.sku.trim().length === 0) {
    return ApiErrors.invalidInput(
      context,
      "SKU must be a non-empty string",
      "sku"
    );
  }

  // Check permission scope
  const userPerms = await getUserPermissions(session.user.id);
  const createPermission = userPerms?.permissions.find(
    (p) => p.resource === "entries" && p.action === "create"
  );

  if (createPermission?.scope === "own" && employeeId !== session.user.id) {
    return ApiErrors.businessRuleViolation(
      context,
      "You can only create entries for yourself"
    );
  }

  const entry = await createEntry({
    employeeId,
    entryTypeId,
    sku: body.sku.trim(),
    entryTime: body.entryTime ? new Date(body.entryTime) : new Date(),
  });

  return NextResponse.json(
    {
      success: true,
      data: entry,
      message: "Entry created successfully",
    },
    {
      status: 201,
      headers: {
        "X-Request-ID": context.requestId || "",
      },
    }
  );
});
