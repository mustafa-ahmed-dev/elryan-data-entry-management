/**
 * Rule Detail API Routes - WITH ENHANCED ERROR HANDLING
 * GET /api/rules/[id] - Get rule details
 * PATCH /api/rules/[id] - Update rule
 * DELETE /api/rules/[id] - Delete rule
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { db } from "@/db";
import { evaluationRules } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

interface RouteParams {
  params: { id: string };
}

// Valid rule types
const VALID_RULE_TYPES = [
  "naming",
  "specification",
  "keyword",
  "completeness",
  "accuracy",
] as const;

// GET /api/rules/[id]
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    // Get context FIRST
    const context = await getRequestContext(request);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(context);
    }

    // Add user info to context
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

    const ruleId = parseInt(params.id);
    if (isNaN(ruleId)) {
      return ApiErrors.invalidId(context, "Rule");
    }

    const [rule] = await db
      .select()
      .from(evaluationRules)
      .where(eq(evaluationRules.id, ruleId))
      .limit(1);

    if (!rule) {
      return ApiErrors.notFound(context, "Rule");
    }

    return NextResponse.json(
      {
        success: true,
        data: rule,
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);

// PATCH /api/rules/[id]
export const PATCH = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    // Get context FIRST
    const context = await getRequestContext(request);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(context);
    }

    // Add user info to context
    context.userId = session.user.id;
    context.userEmail = session.user.email;

    const canUpdate = await checkPermission(
      session.user.id,
      "evaluations",
      "update",
      "all"
    );
    if (!canUpdate) {
      return ApiErrors.insufficientPermissions(
        context,
        "evaluations:update:all"
      );
    }

    const ruleId = parseInt(params.id);
    if (isNaN(ruleId)) {
      return ApiErrors.invalidId(context, "Rule");
    }

    const body = await request.json();

    // Validate at least one field is provided
    if (
      !body.ruleName &&
      !body.ruleType &&
      body.deductionPoints === undefined &&
      body.description === undefined
    ) {
      return ApiErrors.invalidInput(
        context,
        "At least one field must be provided for update"
      );
    }

    // Validate ruleName if provided
    if (body.ruleName !== undefined) {
      if (
        typeof body.ruleName !== "string" ||
        body.ruleName.trim().length === 0
      ) {
        return ApiErrors.invalidInput(
          context,
          "Rule name cannot be empty",
          "ruleName"
        );
      }

      if (body.ruleName.length > 100) {
        return ApiErrors.invalidInput(
          context,
          "Rule name must be 100 characters or less",
          "ruleName"
        );
      }
    }

    // Validate deduction points if provided
    if (body.deductionPoints !== undefined) {
      const deductionPoints = Number(body.deductionPoints);
      if (isNaN(deductionPoints)) {
        return ApiErrors.invalidInput(
          context,
          "Deduction points must be a number",
          "deductionPoints"
        );
      }

      if (deductionPoints < 0 || deductionPoints > 100) {
        return ApiErrors.invalidInput(
          context,
          "Deduction points must be between 0 and 100",
          "deductionPoints"
        );
      }
    }

    // Validate rule type if provided
    if (body.ruleType && !VALID_RULE_TYPES.includes(body.ruleType)) {
      return ApiErrors.invalidInput(
        context,
        `Invalid rule type. Must be one of: ${VALID_RULE_TYPES.join(", ")}`,
        "ruleType"
      );
    }

    // Build update object
    const updateData: any = {};
    if (body.ruleName) updateData.ruleName = body.ruleName;
    if (body.ruleType) updateData.ruleType = body.ruleType;
    if (body.deductionPoints !== undefined)
      updateData.deductionPoints = body.deductionPoints;
    if (body.description !== undefined)
      updateData.description = body.description;

    const [updated] = await db
      .update(evaluationRules)
      .set(updateData)
      .where(eq(evaluationRules.id, ruleId))
      .returning();

    if (!updated) {
      return ApiErrors.notFound(context, "Rule");
    }

    return NextResponse.json(
      {
        success: true,
        data: updated,
        message: "Rule updated successfully",
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);

// DELETE /api/rules/[id]
export const DELETE = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    // Get context FIRST
    const context = await getRequestContext(request);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(context);
    }

    // Add user info to context
    context.userId = session.user.id;
    context.userEmail = session.user.email;

    const canDelete = await checkPermission(
      session.user.id,
      "evaluations",
      "delete",
      "all"
    );
    if (!canDelete) {
      return ApiErrors.insufficientPermissions(
        context,
        "evaluations:delete:all"
      );
    }

    const ruleId = parseInt(params.id);
    if (isNaN(ruleId)) {
      return ApiErrors.invalidId(context, "Rule");
    }

    const [deleted] = await db
      .delete(evaluationRules)
      .where(eq(evaluationRules.id, ruleId))
      .returning();

    if (!deleted) {
      return ApiErrors.notFound(context, "Rule");
    }

    return NextResponse.json(
      {
        success: true,
        message: "Rule deleted successfully",
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);
