/**
 * Deactivate Rule Set API
 * POST /api/rule-sets/[id]/deactivate - Deactivate the active rule set
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { db } from "@/db";
import { evaluationRuleSets } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/rule-sets/[id]/deactivate
export const POST = withErrorHandling(
  async (request: NextRequest, routeContext: RouteParams) => {
    const context = await getRequestContext(request);
    const params = await routeContext.params;

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

    // Check if already inactive
    if (!ruleSet.isActive) {
      return NextResponse.json(
        {
          success: true,
          data: ruleSet,
          message: `${ruleSet.name} is already inactive`,
        },
        {
          headers: {
            "X-Request-ID": context.requestId || "",
          },
        }
      );
    }

    // Deactivate the rule set
    const [deactivated] = await db
      .update(evaluationRuleSets)
      .set({ isActive: false })
      .where(eq(evaluationRuleSets.id, ruleSetId))
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: deactivated,
        message: `${deactivated.name} has been deactivated`,
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);
