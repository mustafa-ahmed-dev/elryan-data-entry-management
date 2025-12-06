/**
 * Rule Sets API Routes
 * GET /api/rule-sets - List all rule sets
 * POST /api/rule-sets - Create new rule set
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { db } from "@/db";
import { evaluationRuleSets } from "@/db/schema";
import { desc } from "drizzle-orm";

// GET /api/rule-sets - List all rule sets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission (admin only for settings)
    const canRead = await checkPermission(
      session.user.id,
      "evaluations",
      "read"
    );
    if (!canRead) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all rule sets
    const ruleSets = await db
      .select()
      .from(evaluationRuleSets)
      .orderBy(desc(evaluationRuleSets.createdAt));

    return NextResponse.json({
      success: true,
      data: ruleSets,
    });
  } catch (error) {
    console.error("Error fetching rule sets:", error);
    return NextResponse.json(
      { error: "Failed to fetch rule sets" },
      { status: 500 }
    );
  }
}

// POST /api/rule-sets - Create new rule set
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission (admin only)
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
    if (!body.name || !body.version) {
      return NextResponse.json(
        { error: "Name and version are required" },
        { status: 400 }
      );
    }

    // Create rule set (default to inactive)
    const [ruleSet] = await db
      .insert(evaluationRuleSets)
      .values({
        name: body.name,
        description: body.description || null,
        isActive: false, // New rule sets start as inactive
        version: body.version,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: ruleSet,
    });
  } catch (error) {
    console.error("Error creating rule set:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create rule set",
      },
      { status: 500 }
    );
  }
}
