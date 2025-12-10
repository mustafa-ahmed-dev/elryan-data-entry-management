/**
 * Entry Type Detail API Routes
 * GET /api/entry-types/[id] - Get entry type details
 * PATCH /api/entry-types/[id] - Update entry type
 * DELETE /api/entry-types/[id] - Delete entry type
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { db } from "@/db";
import { entryTypes, entries } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

interface RouteParams {
  params: Promise<{ id: string }>; // FIXED: Changed to Promise
}

// GET /api/entry-types/[id]
export const GET = withErrorHandling(
  async (request: NextRequest, context: RouteParams) => {
    const reqContext = await getRequestContext(request);
    const params = await context.params; // FIXED: Await params

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(reqContext);
    }

    reqContext.userId = session.user.id;
    reqContext.userEmail = session.user.email;

    const canRead = await checkPermission(session.user.id, "entries", "read");
    if (!canRead) {
      return ApiErrors.insufficientPermissions(reqContext, "entries:read");
    }

    const entryTypeId = parseInt(params.id);
    if (isNaN(entryTypeId)) {
      return ApiErrors.invalidId(reqContext, "Entry type");
    }

    const [entryType] = await db
      .select()
      .from(entryTypes)
      .where(eq(entryTypes.id, entryTypeId))
      .limit(1);

    if (!entryType) {
      return ApiErrors.notFound(reqContext, "Entry type");
    }

    return NextResponse.json(
      {
        success: true,
        data: entryType,
      },
      {
        headers: {
          "X-Request-ID": reqContext.requestId || "",
        },
      }
    );
  }
);

// PATCH /api/entry-types/[id]
export const PATCH = withErrorHandling(
  async (request: NextRequest, context: RouteParams) => {
    const reqContext = await getRequestContext(request);
    const params = await context.params; // FIXED: Await params

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(reqContext);
    }

    reqContext.userId = session.user.id;
    reqContext.userEmail = session.user.email;

    const canUpdate = await checkPermission(
      session.user.id,
      "entries",
      "update",
      "all"
    );
    if (!canUpdate) {
      return ApiErrors.insufficientPermissions(
        reqContext,
        "entries:update:all"
      );
    }

    const entryTypeId = parseInt(params.id);
    if (isNaN(entryTypeId)) {
      return ApiErrors.invalidId(reqContext, "Entry type");
    }

    const body = await request.json();

    // Build update object
    const updateData: any = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return ApiErrors.invalidInput(
          reqContext,
          "Name must be a non-empty string",
          "name"
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description;
    }

    if (Object.keys(updateData).length === 0) {
      return ApiErrors.invalidInput(reqContext, "No valid fields to update");
    }

    try {
      const [updated] = await db
        .update(entryTypes)
        .set(updateData)
        .where(eq(entryTypes.id, entryTypeId))
        .returning();

      if (!updated) {
        return ApiErrors.notFound(reqContext, "Entry type");
      }

      return NextResponse.json(
        {
          success: true,
          data: updated,
          message: "Entry type updated successfully",
        },
        {
          headers: {
            "X-Request-ID": reqContext.requestId || "",
          },
        }
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("duplicate")) {
        return ApiErrors.duplicateEntry(reqContext, "name");
      }
      throw error;
    }
  }
);

// DELETE /api/entry-types/[id]
export const DELETE = withErrorHandling(
  async (request: NextRequest, context: RouteParams) => {
    const reqContext = await getRequestContext(request);
    const params = await context.params; // FIXED: Await params

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(reqContext);
    }

    reqContext.userId = session.user.id;
    reqContext.userEmail = session.user.email;

    const canDelete = await checkPermission(
      session.user.id,
      "entries",
      "delete",
      "all"
    );
    if (!canDelete) {
      return ApiErrors.insufficientPermissions(
        reqContext,
        "entries:delete:all"
      );
    }

    const entryTypeId = parseInt(params.id);
    if (isNaN(entryTypeId)) {
      return ApiErrors.invalidId(reqContext, "Entry type");
    }

    // Check if entry type has been used in entries
    const [entryCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(entries)
      .where(eq(entries.entryTypeId, entryTypeId));

    const count = Number(entryCount.count);
    if (count > 0) {
      return ApiErrors.cannotDeleteInUse(reqContext, "Entry type", count);
    }

    const [deleted] = await db
      .delete(entryTypes)
      .where(eq(entryTypes.id, entryTypeId))
      .returning();

    if (!deleted) {
      return ApiErrors.notFound(reqContext, "Entry type");
    }

    return NextResponse.json(
      {
        success: true,
        message: "Entry type deleted successfully",
        data: { id: entryTypeId },
      },
      {
        headers: {
          "X-Request-ID": reqContext.requestId || "",
        },
      }
    );
  }
);
