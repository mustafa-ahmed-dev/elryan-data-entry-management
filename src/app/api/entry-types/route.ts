/**
 * Entry Types API Routes
 * GET /api/entry-types - List all entry types
 * POST /api/entry-types - Create new entry type
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { db } from "@/db";
import { entryTypes } from "@/db/schema";
import { desc } from "drizzle-orm";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

// GET /api/entry-types - List all entry types
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

  // Get all entry types
  const types = await db
    .select()
    .from(entryTypes)
    .orderBy(desc(entryTypes.createdAt));

  return NextResponse.json(
    {
      success: true,
      data: types,
    },
    {
      headers: {
        "X-Request-ID": context.requestId || "",
      },
    }
  );
});

// POST /api/entry-types - Create new entry type
export const POST = withErrorHandling(async (request: NextRequest) => {
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  context.userId = session.user.id;
  context.userEmail = session.user.email;

  // Check permission (admin only)
  const canCreate = await checkPermission(
    session.user.id,
    "entries",
    "create",
    "all"
  );
  if (!canCreate) {
    return ApiErrors.insufficientPermissions(context, "entries:create:all");
  }

  const body = await request.json();

  // Validate required fields
  if (!body.name) {
    return ApiErrors.missingField(context, "name");
  }

  if (typeof body.name !== "string" || body.name.trim().length === 0) {
    return ApiErrors.invalidInput(
      context,
      "Name must be a non-empty string",
      "name"
    );
  }

  try {
    // Create entry type
    const [entryType] = await db
      .insert(entryTypes)
      .values({
        name: body.name.trim(),
        description: body.description || null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: entryType,
        message: "Entry type created successfully",
      },
      {
        status: 201,
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("duplicate")) {
      return ApiErrors.duplicateEntry(context, "name");
    }
    throw error;
  }
});
