/**
 * Evaluation Rules API Routes - WITH ENHANCED ERROR HANDLING
 * GET /api/rules - List rules (optionally filter by rule set)
 * POST /api/rules - Create new rule
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { db } from "@/db";
import { evaluationRules } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

// Valid rule types
const VALID_RULE_TYPES = [
  "naming",
  "specification",
  "keyword",
  "completeness",
  "accuracy",
] as const;

// GET /api/rules - List rules
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

  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const ruleSetId = searchParams.get("ruleSetId");

  let rules;

  if (ruleSetId) {
    // Validate ruleSetId
    const parsedRuleSetId = parseInt(ruleSetId);
    if (isNaN(parsedRuleSetId)) {
      return ApiErrors.invalidInput(
        context,
        "Rule set ID must be a number",
        "ruleSetId"
      );
    }

    // Filter by rule set
    rules = await db
      .select()
      .from(evaluationRules)
      .where(eq(evaluationRules.ruleSetId, parsedRuleSetId))
      .orderBy(desc(evaluationRules.createdAt));
  } else {
    // Get all rules
    rules = await db
      .select()
      .from(evaluationRules)
      .orderBy(desc(evaluationRules.createdAt));
  }

  return NextResponse.json(
    {
      success: true,
      data: rules,
    },
    {
      headers: {
        "X-Request-ID": context.requestId || "",
      },
    }
  );
});

// POST /api/rules - Create new rule
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
  if (!body.ruleSetId) {
    return ApiErrors.missingField(context, "ruleSetId");
  }

  if (!body.ruleName) {
    return ApiErrors.missingField(context, "ruleName");
  }

  if (!body.ruleType) {
    return ApiErrors.missingField(context, "ruleType");
  }

  if (body.deductionPoints === undefined) {
    return ApiErrors.missingField(context, "deductionPoints");
  }

  // Validate ruleSetId
  const ruleSetId = parseInt(body.ruleSetId);
  if (isNaN(ruleSetId)) {
    return ApiErrors.invalidInput(
      context,
      "Rule set ID must be a number",
      "ruleSetId"
    );
  }

  // Validate ruleName
  if (typeof body.ruleName !== "string" || body.ruleName.trim().length === 0) {
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

  // Validate deduction points
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

  // Validate rule type
  if (!VALID_RULE_TYPES.includes(body.ruleType)) {
    return ApiErrors.invalidInput(
      context,
      `Invalid rule type. Must be one of: ${VALID_RULE_TYPES.join(", ")}`,
      "ruleType"
    );
  }

  // Create rule
  const [rule] = await db
    .insert(evaluationRules)
    .values({
      ruleSetId,
      ruleName: body.ruleName,
      ruleType: body.ruleType,
      deductionPoints,
      description: body.description || null,
    })
    .returning();

  return NextResponse.json(
    {
      success: true,
      data: rule,
      message: "Rule created successfully",
    },
    {
      status: 201,
      headers: {
        "X-Request-ID": context.requestId || "",
      },
    }
  );
});
