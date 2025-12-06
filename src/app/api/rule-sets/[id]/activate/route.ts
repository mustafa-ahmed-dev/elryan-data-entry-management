/**
 * Activate Rule Set API
 * POST /api/rule-sets/[id]/activate - Activate rule set (deactivate others)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { db } from "@/db";
import { evaluationRuleSets } from "@/db/schema";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: { id: string };
}

// POST /api/rule-sets/[id]/activate
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Check if rule set exists
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

    // Step 1: Deactivate all rule sets
    await db.update(evaluationRuleSets).set({ isActive: false });

    // Step 2: Activate the selected rule set
    const [activated] = await db
      .update(evaluationRuleSets)
      .set({ isActive: true })
      .where(eq(evaluationRuleSets.id, ruleSetId))
      .returning();

    return NextResponse.json({
      success: true,
      data: activated,
      message: `${activated.name} is now the active rule set`,
    });
  } catch (error) {
    console.error("Error activating rule set:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to activate rule set",
      },
      { status: 500 }
    );
  }
}
