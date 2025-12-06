/**
 * Rule Set Detail API Routes
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

interface RouteParams {
  params: { id: string };
}

// GET /api/rule-sets/[id] - Get rule set with rules
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

    const ruleSetId = parseInt(params.id);
    if (isNaN(ruleSetId)) {
      return NextResponse.json(
        { error: "Invalid rule set ID" },
        { status: 400 }
      );
    }

    // Get rule set
    const [ruleSet] = await db
      .select()
      .from(evaluationRuleSets)
      .where(eq(evaluationRuleSets.id, ruleSetId))
      .limit(1);

    if (!ruleSet) {
      return NextResponse.json(
        { error: "Rule set not found" },
        { status: 404 }
      );
    }

    // Get rules for this rule set
    const rules = await db
      .select()
      .from(evaluationRules)
      .where(eq(evaluationRules.ruleSetId, ruleSetId));

    return NextResponse.json({
      success: true,
      data: {
        ...ruleSet,
        rules,
      },
    });
  } catch (error) {
    console.error("Error fetching rule set:", error);
    return NextResponse.json(
      { error: "Failed to fetch rule set" },
      { status: 500 }
    );
  }
}

// PATCH /api/rule-sets/[id] - Update rule set
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

    const ruleSetId = parseInt(params.id);
    if (isNaN(ruleSetId)) {
      return NextResponse.json(
        { error: "Invalid rule set ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate at least one field
    if (!body.name && !body.description && body.version === undefined) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Rule set not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating rule set:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update rule set",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/rule-sets/[id] - Delete rule set
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

    const ruleSetId = parseInt(params.id);
    if (isNaN(ruleSetId)) {
      return NextResponse.json(
        { error: "Invalid rule set ID" },
        { status: 400 }
      );
    }

    // Check if rule set is active
    const [ruleSet] = await db
      .select()
      .from(evaluationRuleSets)
      .where(eq(evaluationRuleSets.id, ruleSetId))
      .limit(1);

    if (!ruleSet) {
      return NextResponse.json(
        { error: "Rule set not found" },
        { status: 404 }
      );
    }

    if (ruleSet.isActive) {
      return NextResponse.json(
        { error: "Cannot delete active rule set. Deactivate it first." },
        { status: 400 }
      );
    }

    // Check if rule set has been used in evaluations
    const [evaluationCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(qualityEvaluations)
      .where(eq(qualityEvaluations.ruleSetId, ruleSetId));

    if (Number(evaluationCount.count) > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete rule set that has been used in ${evaluationCount.count} evaluation(s). This maintains data integrity.`,
        },
        { status: 400 }
      );
    }

    // Delete associated rules first
    await db
      .delete(evaluationRules)
      .where(eq(evaluationRules.ruleSetId, ruleSetId));

    // Delete rule set
    await db
      .delete(evaluationRuleSets)
      .where(eq(evaluationRuleSets.id, ruleSetId));

    return NextResponse.json({
      success: true,
      message: "Rule set deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting rule set:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete rule set",
      },
      { status: 500 }
    );
  }
}
