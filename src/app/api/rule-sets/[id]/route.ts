/**
 * Rule Set Detail API Routes - WITH ENHANCED ERROR HANDLING
 * GET /api/rule-sets/[id] - Get rule set with rules
 * PATCH /api/rule-sets/[id] - Update rule set
 * DELETE /api/rule-sets/[id] - Delete rule set
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { db } from "@/db";
import {
  evaluationRuleSets,
  evaluationRules,
  qualityEvaluations,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

interface RouteParams {
  params: { id: string };
}

// GET /api/rule-sets/[id] - Get rule set with rules
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

    const ruleSetId = parseInt(params.id);
    if (isNaN(ruleSetId)) {
      return ApiErrors.invalidId(context, "Rule set");
    }

    // Get rule set
    const [ruleSet] = await db
      .select()
      .from(evaluationRuleSets)
      .where(eq(evaluationRuleSets.id, ruleSetId))
      .limit(1);

    if (!ruleSet) {
      return ApiErrors.notFound(context, "Rule set");
    }

    // Get rules for this rule set
    const rules = await db
      .select()
      .from(evaluationRules)
      .where(eq(evaluationRules.ruleSetId, ruleSetId));

    return NextResponse.json(
      {
        success: true,
        data: {
          ...ruleSet,
          rules,
        },
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);

// PATCH /api/rule-sets/[id] - Update rule set
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

    const ruleSetId = parseInt(params.id);
    if (isNaN(ruleSetId)) {
      return ApiErrors.invalidId(context, "Rule set");
    }

    const body = await request.json();

    // Validate at least one field
    if (!body.name && !body.description && body.version === undefined) {
      return ApiErrors.invalidInput(
        context,
        "At least one field must be provided for update"
      );
    }

    // Validate name if provided
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return ApiErrors.invalidInput(context, "Name cannot be empty", "name");
      }

      if (body.name.length > 100) {
        return ApiErrors.invalidInput(
          context,
          "Name must be 100 characters or less",
          "name"
        );
      }
    }

    // Validate version if provided
    if (body.version !== undefined) {
      if (
        typeof body.version !== "string" ||
        body.version.trim().length === 0
      ) {
        return ApiErrors.invalidInput(
          context,
          "Version must be a non-empty string",
          "version"
        );
      }
    }

    // Update rule set
    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.version !== undefined) updateData.version = body.version;

    const [updated] = await db
      .update(evaluationRuleSets)
      .set(updateData)
      .where(eq(evaluationRuleSets.id, ruleSetId))
      .returning();

    if (!updated) {
      return ApiErrors.notFound(context, "Rule set");
    }

    return NextResponse.json(
      {
        success: true,
        data: updated,
        message: "Rule set updated successfully",
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);

// DELETE /api/rule-sets/[id] - Delete rule set
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

    const ruleSetId = parseInt(params.id);
    if (isNaN(ruleSetId)) {
      return ApiErrors.invalidId(context, "Rule set");
    }

    // Check if rule set exists
    const [ruleSet] = await db
      .select()
      .from(evaluationRuleSets)
      .where(eq(evaluationRuleSets.id, ruleSetId))
      .limit(1);

    if (!ruleSet) {
      return ApiErrors.notFound(context, "Rule set");
    }

    // Check if rule set is active
    if (ruleSet.isActive) {
      return ApiErrors.businessRuleViolation(
        context,
        "Cannot delete active rule set. Deactivate it first."
      );
    }

    // Check if rule set has been used in evaluations
    const [evaluationCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(qualityEvaluations)
      .where(eq(qualityEvaluations.ruleSetId, ruleSetId));

    const count = Number(evaluationCount.count);
    if (count > 0) {
      return ApiErrors.cannotDeleteInUse(context, "rule set", count);
    }

    // Delete associated rules first
    await db
      .delete(evaluationRules)
      .where(eq(evaluationRules.ruleSetId, ruleSetId));

    // Delete rule set
    await db
      .delete(evaluationRuleSets)
      .where(eq(evaluationRuleSets.id, ruleSetId));

    return NextResponse.json(
      {
        success: true,
        message: "Rule set deleted successfully",
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);
