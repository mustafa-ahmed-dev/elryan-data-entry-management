/**
 * Get Active Rule Set API - WITH ENHANCED ERROR HANDLING
 * GET /api/rule-sets/active - Get the currently active rule set
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

// GET /api/rule-sets/active
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

  const canRead = await checkPermission(session.user.id, "evaluations", "read");
  if (!canRead) {
    return ApiErrors.insufficientPermissions(context, "evaluations:read");
  }

  // Get active rule set
  const [activeRuleSet] = await db
    .select()
    .from(evaluationRuleSets)
    .where(eq(evaluationRuleSets.isActive, true))
    .limit(1);

  if (!activeRuleSet) {
    return ApiErrors.notFound(
      context,
      "No active rule set found. Please activate a rule set in settings."
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: activeRuleSet,
    },
    {
      headers: {
        "X-Request-ID": context.requestId || "",
      },
    }
  );
});
