/**
 * Entries API Routes - WITH ENHANCED ERROR HANDLING (FIXED)
 * GET /api/entries - List entries
 * POST /api/entries - Create entry
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission, getUserPermissions } from "@/db/utils/permissions";
import {
  getEntries,
  createEntry,
  bulkCreateEntries,
  getEntryStats,
} from "@/db/utils/entries";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

// GET /api/entries - List entries
export const GET = withErrorHandling(async (request: NextRequest) => {
  // 🔥 STEP 1: Get context FIRST!
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  // Add user info to context
  context.userId = session.user.id;
  context.userEmail = session.user.email;

  const canRead = await checkPermission(session.user.id, "entries", "read");
  if (!canRead) {
    return ApiErrors.insufficientPermissions(context, "entries:read");
  }

  const userPerms = await getUserPermissions(session.user.id);
  if (!userPerms) {
    return ApiErrors.forbidden(context);
  }

  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const employeeId = searchParams.get("employeeId");
  const teamId = searchParams.get("teamId");
  const entryTypeId = searchParams.get("entryTypeId");
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const date = searchParams.get("date") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
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

  // Validate date range if both provided
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return ApiErrors.invalidDateRange(context);
  }

  // Build filters based on permission scope
  const filters: any = {
    page,
    pageSize,
    startDate,
    endDate,
    date,
  };

  if (employeeId) {
    const empId = parseInt(employeeId);
    if (isNaN(empId)) {
      return ApiErrors.invalidInput(
        context,
        "Invalid employee ID",
        "employeeId"
      );
    }
    filters.employeeId = empId;
  }

  if (teamId) {
    const tId = parseInt(teamId);
    if (isNaN(tId)) {
      return ApiErrors.invalidInput(context, "Invalid team ID", "teamId");
    }
    filters.teamId = tId;
  }

  if (entryTypeId) {
    const typeId = parseInt(entryTypeId);
    if (isNaN(typeId)) {
      return ApiErrors.invalidInput(
        context,
        "Invalid entry type ID",
        "entryTypeId"
      );
    }
    filters.entryTypeId = typeId;
  }

  // Apply permission-based filtering
  const readPermission = userPerms.permissions.find(
    (p) => p.resource === "entries" && p.action === "read"
  );

  if (readPermission?.scope === "own") {
    filters.employeeId = session.user.id;
  } else if (readPermission?.scope === "team") {
    if (userPerms.teamId) {
      filters.teamId = userPerms.teamId;
    }
  }

  const result = await getEntries(filters);

  const response: any = {
    success: true,
    data: result.data,
    pagination: {
      page: result.pagination.page,
      pageSize: result.pagination.pageSize,
      total: result.pagination.total,
      totalPages: result.pagination.totalPages,
    },
  };

  if (includeStats) {
    const stats = await getEntryStats(filters);
    response.stats = stats;
  }

  return NextResponse.json(response, {
    headers: {
      "X-Request-ID": context.requestId || "",
    },
  });
});

// POST /api/entries - Create entry
export const POST = withErrorHandling(async (request: NextRequest) => {
  // 🔥 STEP 1: Get context FIRST!
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
      if (!entry.entryName) {
        return ApiErrors.missingField(context, `entries[${i}].entryName`);
      }
      if (!entry.timestamp) {
        return ApiErrors.missingField(context, `entries[${i}].timestamp`);
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
  if (!body.productName) {
    return ApiErrors.missingField(context, "productName");
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
    productName: body.productName,
    productDescription: body.productDescription,
    followsNamingConvention: body.followsNamingConvention,
    followsSpecificationOrder: body.followsSpecificationOrder,
    containsUnwantedKeywords: body.containsUnwantedKeywords,
    entryTime: body.entryTime ? new Date(body.entryTime) : undefined,
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
