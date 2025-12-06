/**
 * Evaluation Rules API Routes
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

// GET /api/rules - List rules
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canRead = await checkPermission(
      session.user.id,
      "evaluations",
      "read"
    );
    if (!canRead) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const ruleSetId = searchParams.get("ruleSetId");

    let rules;

    if (ruleSetId) {
      // Filter by rule set
      rules = await db
        .select()
        .from(evaluationRules)
        .where(eq(evaluationRules.ruleSetId, parseInt(ruleSetId)))
        .orderBy(desc(evaluationRules.createdAt));
    } else {
      // Get all rules
      rules = await db
        .select()
        .from(evaluationRules)
        .orderBy(desc(evaluationRules.createdAt));
    }

    return NextResponse.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    console.error("Error fetching rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch rules" },
      { status: 500 }
    );
  }
}

// POST /api/rules - Create new rule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canCreate = await checkPermission(
      session.user.id,
      "evaluations",
      "create",
      "all"
    );
    if (!canCreate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (
      !body.ruleSetId ||
      !body.ruleName ||
      !body.ruleType ||
      body.deductionPoints === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate deduction points
    if (body.deductionPoints < 0 || body.deductionPoints > 100) {
      return NextResponse.json(
        { error: "Deduction points must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Validate rule type
    const validRuleTypes = [
      "naming",
      "specification",
      "keyword",
      "completeness",
      "accuracy",
    ];
    if (!validRuleTypes.includes(body.ruleType)) {
      return NextResponse.json({ error: "Invalid rule type" }, { status: 400 });
    }

    // Create rule
    const [rule] = await db
      .insert(evaluationRules)
      .values({
        ruleSetId: body.ruleSetId,
        ruleName: body.ruleName,
        ruleType: body.ruleType,
        deductionPoints: body.deductionPoints,
        description: body.description || null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error("Error creating rule:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create rule",
      },
      { status: 500 }
    );
  }
}
