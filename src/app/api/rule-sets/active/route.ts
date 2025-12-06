/**
 * Get Active Rule Set API
 * GET /api/rule-sets/active - Get the currently active rule set
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { db } from "@/db";
import { evaluationRuleSets } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/rule-sets/active
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

    // Get active rule set
    const [activeRuleSet] = await db
      .select()
      .from(evaluationRuleSets)
      .where(eq(evaluationRuleSets.isActive, true))
      .limit(1);

    if (!activeRuleSet) {
      return NextResponse.json(
        {
          error:
            "No active rule set found. Please activate a rule set in settings.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: activeRuleSet,
    });
  } catch (error) {
    console.error("Error fetching active rule set:", error);
    return NextResponse.json(
      { error: "Failed to fetch active rule set" },
      { status: 500 }
    );
  }
}
