/**
 * Roles API Route
 * GET /api/roles - List all roles
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/db";
import { roles } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

// GET /api/roles
export const GET = withErrorHandling(async (request: NextRequest) => {
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  context.userId = session.user.id;
  context.userEmail = session.user.email;

  // Get all active roles
  const rolesList = await db
    .select()
    .from(roles)
    .where(eq(roles.isActive, true))
    .orderBy(asc(roles.hierarchy));

  return NextResponse.json(
    {
      success: true,
      data: rolesList,
    },
    {
      headers: {
        "X-Request-ID": context.requestId || "",
      },
    }
  );
});
