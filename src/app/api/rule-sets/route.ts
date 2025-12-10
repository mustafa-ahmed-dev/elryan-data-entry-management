/**
 * Rule Sets API Routes - WITH ENHANCED ERROR HANDLING
 * GET /api/rule-sets - List all rule sets
 * POST /api/rule-sets - Create new rule set
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { db } from "@/db";
import { evaluationRuleSets } from "@/db/schema";
import { desc } from "drizzle-orm";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

// GET /api/rule-sets - List all rule sets
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

  // Check permission (admin only for settings)
  const canRead = await checkPermission(session.user.id, "evaluations", "read");
  if (!canRead) {
    return ApiErrors.insufficientPermissions(context, "evaluations:read");
  }

  // Get all rule sets
  const ruleSets = await db
    .select()
    .from(evaluationRuleSets)
    .orderBy(desc(evaluationRuleSets.createdAt));

  return NextResponse.json(
    {
      success: true,
      data: ruleSets,
    },
    {
      headers: {
        "X-Request-ID": context.requestId || "",
      },
    }
  );
});

// POST /api/rule-sets - Create new rule set
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

  // Check permission (admin only)
  const canCreate = await checkPermission(
    session.user.id,
    "evaluations",
    "create",
    "all"
  );
  if (!canCreate) {
    return ApiErrors.insufficientPermissions(context, "evaluations:create:all");
  }

  const body = await request.json();

  // Validate required fields
  if (!body.name) {
    return ApiErrors.missingField(context, "name");
  }

  // Validate name length
  if (body.name.trim().length === 0) {
    return ApiErrors.invalidInput(context, "Name cannot be empty", "name");
  }

  if (body.name.length > 100) {
    return ApiErrors.invalidInput(
      context,
      "Name must be 100 characters or less",
      "name"
    );
  }

  // Create rule set (default to inactive)
  const [ruleSet] = await db
    .insert(evaluationRuleSets)
    .values({
      name: body.name,
      description: body.description || null,
      isActive: false, // New rule sets start as inactive
    })
    .returning();

  return NextResponse.json(
    {
      success: true,
      data: ruleSet,
      message: "Rule set created successfully",
    },
    {
      status: 201,
      headers: {
        "X-Request-ID": context.requestId || "",
      },
    }
  );
});
