/**
 * Rule Set Detail API Routes
 * GET /api/rule-sets/[id] - Get rule set details
 * PATCH /api/rule-sets/[id] - Update rule set
 * DELETE /api/rule-sets/[id] - Delete rule set
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { db } from "@/db";
import { evaluationRuleSets, evaluationRules } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/rule-sets/[id]
export const GET = withErrorHandling(
  async (request: NextRequest, routeContext: RouteParams) => {
    const reqContext = await getRequestContext(request);
    const params = await routeContext.params;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(reqContext);
    }

    reqContext.userId = session.user.id;
    reqContext.userEmail = session.user.email;

    const canRead = await checkPermission(
      session.user.id,
      "evaluations",
      "read"
    );
    if (!canRead) {
      return ApiErrors.insufficientPermissions(reqContext, "evaluations:read");
    }

    const ruleSetId = parseInt(params.id);
    if (isNaN(ruleSetId)) {
      return ApiErrors.invalidId(reqContext, "Rule set");
    }

    const [ruleSet] = await db
      .select()
      .from(evaluationRuleSets)
      .where(eq(evaluationRuleSets.id, ruleSetId))
      .limit(1);

    if (!ruleSet) {
      return ApiErrors.notFound(reqContext, "Rule set");
    }

    return NextResponse.json(
      {
        success: true,
        data: ruleSet,
      },
      {
        headers: {
          "X-Request-ID": reqContext.requestId || "",
        },
      }
    );
  }
);

// PATCH /api/rule-sets/[id]
export const PATCH = withErrorHandling(
  async (request: NextRequest, routeContext: RouteParams) => {
    const reqContext = await getRequestContext(request);
    const params = await routeContext.params;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(reqContext);
    }

    reqContext.userId = session.user.id;
    reqContext.userEmail = session.user.email;

    const canUpdate = await checkPermission(
      session.user.id,
      "evaluations",
      "update"
    );
    if (!canUpdate) {
      return ApiErrors.insufficientPermissions(
        reqContext,
        "evaluations:update"
      );
    }

    const ruleSetId = parseInt(params.id);
    if (isNaN(ruleSetId)) {
      return ApiErrors.invalidId(reqContext, "Rule set");
    }

    const body = await request.json();

    // Validate at least one field
    if (!body.name && !body.description) {
      return ApiErrors.invalidInput(
        reqContext,
        "At least one field must be provided for update"
      );
    }

    // Validate name if provided
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return ApiErrors.invalidInput(
          reqContext,
          "Name cannot be empty",
          "name"
        );
      }

      if (body.name.length > 100) {
        return ApiErrors.invalidInput(
          reqContext,
          "Name must be 100 characters or less",
          "name"
        );
      }
    }

    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.description !== undefined)
      updateData.description = body.description;

    const [updated] = await db
      .update(evaluationRuleSets)
      .set(updateData)
      .where(eq(evaluationRuleSets.id, ruleSetId))
      .returning();

    if (!updated) {
      return ApiErrors.notFound(reqContext, "Rule set");
    }

    return NextResponse.json(
      {
        success: true,
        data: updated,
        message: "Rule set updated successfully",
      },
      {
        headers: {
          "X-Request-ID": reqContext.requestId || "",
        },
      }
    );
  }
);

// DELETE /api/rule-sets/[id]
export const DELETE = withErrorHandling(
  async (request: NextRequest, routeContext: RouteParams) => {
    const reqContext = await getRequestContext(request);
    const params = await routeContext.params;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(reqContext);
    }

    reqContext.userId = session.user.id;
    reqContext.userEmail = session.user.email;

    const canDelete = await checkPermission(
      session.user.id,
      "evaluations",
      "delete"
    );
    if (!canDelete) {
      return ApiErrors.insufficientPermissions(
        reqContext,
        "evaluations:delete"
      );
    }

    const ruleSetId = parseInt(params.id);
    if (isNaN(ruleSetId)) {
      return ApiErrors.invalidId(reqContext, "Rule set");
    }

    // Check if rule set is active
    const [ruleSet] = await db
      .select()
      .from(evaluationRuleSets)
      .where(eq(evaluationRuleSets.id, ruleSetId))
      .limit(1);

    if (!ruleSet) {
      return ApiErrors.notFound(reqContext, "Rule set");
    }

    if (ruleSet.isActive) {
      return ApiErrors.invalidInput(
        reqContext,
        "Cannot delete active rule set. Deactivate it first."
      );
    }

    // Check if rule set has associated rules
    const [ruleCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(evaluationRules)
      .where(eq(evaluationRules.ruleSetId, ruleSetId));

    const count = Number(ruleCount.count);

    // Delete the rule set (cascade will handle rules if needed)
    const [deleted] = await db
      .delete(evaluationRuleSets)
      .where(eq(evaluationRuleSets.id, ruleSetId))
      .returning();

    if (!deleted) {
      return ApiErrors.notFound(reqContext, "Rule set");
    }

    return NextResponse.json(
      {
        success: true,
        message: `Rule set deleted successfully${
          count > 0 ? ` along with ${count} associated rule(s)` : ""
        }`,
        data: { id: ruleSetId, deletedRules: count },
      },
      {
        headers: {
          "X-Request-ID": reqContext.requestId || "",
        },
      }
    );
  }
);
