/**
 * Rule Types API Routes
 * GET /api/rule-types - List all rule types
 * POST /api/rule-types - Create new rule type
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";
import { getRuleTypes, createRuleType } from "@/lib/api/ruleTypes";

// GET /api/rule-types - List all rule types
export const GET = withErrorHandling(async (request: NextRequest) => {
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  context.userId = session.user.id;
  context.userEmail = session.user.email;

  const canRead = await checkPermission(session.user.id, "evaluations", "read");
  if (!canRead) {
    return ApiErrors.insufficientPermissions(context, "evaluations:read");
  }

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive") === "true";

  const ruleTypes = await getRuleTypes(includeInactive);

  return NextResponse.json(
    {
      success: true,
      data: ruleTypes,
    },
    {
      headers: {
        "X-Request-ID": context.requestId || "",
      },
    }
  );
});

// POST /api/rule-types - Create new rule type
export const POST = withErrorHandling(async (request: NextRequest) => {
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  context.userId = session.user.id;
  context.userEmail = session.user.email;

  const canCreate = await checkPermission(
    session.user.id,
    "evaluations",
    "update"
  );
  if (!canCreate) {
    return ApiErrors.insufficientPermissions(context, "evaluations:update");
  }

  const body = await request.json();

  // Validate required fields
  if (!body.name) {
    return ApiErrors.missingField(context, "name");
  }

  if (!body.displayName) {
    return ApiErrors.missingField(context, "displayName");
  }

  // Validate name format
  if (!/^[a-z_]+$/.test(body.name)) {
    return ApiErrors.invalidInput(
      context,
      "Name must be lowercase letters and underscores only",
      "name"
    );
  }

  // Validate lengths
  if (body.name.length < 2 || body.name.length > 100) {
    return ApiErrors.invalidInput(
      context,
      "Name must be between 2 and 100 characters",
      "name"
    );
  }

  if (body.displayName.length < 2 || body.displayName.length > 100) {
    return ApiErrors.invalidInput(
      context,
      "Display name must be between 2 and 100 characters",
      "displayName"
    );
  }

  if (body.icon && body.icon.length > 10) {
    return ApiErrors.invalidInput(
      context,
      "Icon must be 10 characters or less",
      "icon"
    );
  }

  if (body.description && body.description.length > 500) {
    return ApiErrors.invalidInput(
      context,
      "Description must be 500 characters or less",
      "description"
    );
  }

  try {
    const ruleType = await createRuleType({
      name: body.name,
      displayName: body.displayName,
      icon: body.icon,
      description: body.description,
      sortOrder: body.sortOrder ?? 0,
    });

    return NextResponse.json(
      {
        success: true,
        data: ruleType,
        message: "Rule type created successfully",
      },
      {
        status: 201,
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  } catch (error: any) {
    if (error.message.includes("already exists")) {
      return ApiErrors.alreadyExists(context, "Rule type");
    }
    throw error;
  }
});
