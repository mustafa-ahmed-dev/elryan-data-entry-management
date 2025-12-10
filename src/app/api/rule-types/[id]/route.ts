/**
 * Rule Types [ID] API Routes
 * GET /api/rule-types/[id] - Get rule type by ID
 * PUT /api/rule-types/[id] - Update rule type
 * DELETE /api/rule-types/[id] - Delete rule type (soft delete)
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
import {
  getRuleTypeById,
  updateRuleType,
  deleteRuleType,
} from "@/lib/api/ruleTypes";

// FIXED: Define the proper type for route params
interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/rule-types/[id] - Get rule type by ID
export const GET = withErrorHandling(
  async (request: NextRequest, routeContext: RouteParams) => {
    const context = await getRequestContext(request);
    const params = await routeContext.params; // FIXED: Await params

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(context);
    }

    context.userId = session.user.id;
    context.userEmail = session.user.email;

    const canRead = await checkPermission(
      session.user.id,
      "evaluations",
      "read"
    );
    if (!canRead) {
      return ApiErrors.insufficientPermissions(context, "evaluations:read");
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return ApiErrors.invalidId(context, params.id);
    }

    const ruleType = await getRuleTypeById(id);

    if (!ruleType) {
      return ApiErrors.notFound(context, "Rule type");
    }

    return NextResponse.json(
      {
        success: true,
        data: ruleType,
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);

// PUT /api/rule-types/[id] - Update rule type
export const PUT = withErrorHandling(
  async (request: NextRequest, routeContext: RouteParams) => {
    const context = await getRequestContext(request);
    const params = await routeContext.params; // FIXED: Await params

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(context);
    }

    context.userId = session.user.id;
    context.userEmail = session.user.email;

    const canUpdate = await checkPermission(
      session.user.id,
      "evaluations",
      "update"
    );
    if (!canUpdate) {
      return ApiErrors.insufficientPermissions(context, "evaluations:update");
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return ApiErrors.invalidId(context, params.id);
    }

    const body = await request.json();

    // Validate if any fields are provided
    const hasValidFields =
      body.name ||
      body.displayName ||
      body.icon !== undefined ||
      body.description !== undefined ||
      body.isActive !== undefined ||
      body.sortOrder !== undefined;

    if (!hasValidFields) {
      return ApiErrors.invalidInput(
        context,
        "No valid fields provided to update"
      );
    }

    // Validate name format if provided
    if (body.name && !/^[a-z_]+$/.test(body.name)) {
      return ApiErrors.invalidInput(
        context,
        "Name must be lowercase letters and underscores only",
        "name"
      );
    }

    // Validate lengths
    if (body.name && (body.name.length < 2 || body.name.length > 100)) {
      return ApiErrors.invalidInput(
        context,
        "Name must be between 2 and 100 characters",
        "name"
      );
    }

    if (
      body.displayName &&
      (body.displayName.length < 2 || body.displayName.length > 100)
    ) {
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
      const updateData: any = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.displayName !== undefined)
        updateData.displayName = body.displayName;
      if (body.icon !== undefined) updateData.icon = body.icon;
      if (body.description !== undefined)
        updateData.description = body.description;
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
      if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;

      const ruleType = await updateRuleType(id, updateData);

      return NextResponse.json(
        {
          success: true,
          data: ruleType,
          message: "Rule type updated successfully",
        },
        {
          headers: {
            "X-Request-ID": context.requestId || "",
          },
        }
      );
    } catch (error: any) {
      if (error.message.includes("not found")) {
        return ApiErrors.notFound(context, "Rule type");
      }
      if (error.message.includes("already exists")) {
        return ApiErrors.alreadyExists(context, "Rule type");
      }
      throw error;
    }
  }
);

// DELETE /api/rule-types/[id] - Delete rule type (soft delete)
export const DELETE = withErrorHandling(
  async (request: NextRequest, routeContext: RouteParams) => {
    const context = await getRequestContext(request);
    const params = await routeContext.params; // FIXED: Await params

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(context);
    }

    context.userId = session.user.id;
    context.userEmail = session.user.email;

    const canDelete = await checkPermission(
      session.user.id,
      "evaluations",
      "update"
    );
    if (!canDelete) {
      return ApiErrors.insufficientPermissions(context, "evaluations:update");
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return ApiErrors.invalidId(context, params.id);
    }

    try {
      const ruleType = await deleteRuleType(id);

      return NextResponse.json(
        {
          success: true,
          data: ruleType,
          message: "Rule type deactivated successfully",
        },
        {
          headers: {
            "X-Request-ID": context.requestId || "",
          },
        }
      );
    } catch (error: any) {
      if (error.message.includes("not found")) {
        return ApiErrors.notFound(context, "Rule type");
      }
      throw error;
    }
  }
);
