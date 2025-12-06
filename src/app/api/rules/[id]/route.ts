/**
 * Rule Detail API Routes
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

interface RouteParams {
  params: { id: string };
}

// GET /api/rules/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const ruleId = parseInt(params.id);
    if (isNaN(ruleId)) {
      return NextResponse.json({ error: "Invalid rule ID" }, { status: 400 });
    }

    const [rule] = await db
      .select()
      .from(evaluationRules)
      .where(eq(evaluationRules.id, ruleId))
      .limit(1);

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error("Error fetching rule:", error);
    return NextResponse.json(
      { error: "Failed to fetch rule" },
      { status: 500 }
    );
  }
}

// PATCH /api/rules/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canUpdate = await checkPermission(
      session.user.id,
      "evaluations",
      "update",
      "all"
    );
    if (!canUpdate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ruleId = parseInt(params.id);
    if (isNaN(ruleId)) {
      return NextResponse.json({ error: "Invalid rule ID" }, { status: 400 });
    }

    const body = await request.json();

    // Validate deduction points if provided
    if (
      body.deductionPoints !== undefined &&
      (body.deductionPoints < 0 || body.deductionPoints > 100)
    ) {
      return NextResponse.json(
        { error: "Deduction points must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Validate rule type if provided
    if (body.ruleType) {
      const validRuleTypes = [
        "naming",
        "specification",
        "keyword",
        "completeness",
        "accuracy",
      ];
      if (!validRuleTypes.includes(body.ruleType)) {
        return NextResponse.json(
          { error: "Invalid rule type" },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: any = {};
    if (body.ruleName) updateData.ruleName = body.ruleName;
    if (body.ruleType) updateData.ruleType = body.ruleType;
    if (body.deductionPoints !== undefined)
      updateData.deductionPoints = body.deductionPoints;
    if (body.description !== undefined)
      updateData.description = body.description;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(evaluationRules)
      .set(updateData)
      .where(eq(evaluationRules.id, ruleId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating rule:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update rule",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/rules/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canDelete = await checkPermission(
      session.user.id,
      "evaluations",
      "delete",
      "all"
    );
    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ruleId = parseInt(params.id);
    if (isNaN(ruleId)) {
      return NextResponse.json({ error: "Invalid rule ID" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(evaluationRules)
      .where(eq(evaluationRules.id, ruleId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Rule deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting rule:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete rule",
      },
      { status: 500 }
    );
  }
}
