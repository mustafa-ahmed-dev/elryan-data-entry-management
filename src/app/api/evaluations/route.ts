/**
 * Evaluations API Routes
 * GET /api/evaluations - List evaluations with filters
 * POST /api/evaluations - Create evaluation
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { getEvaluations, createEvaluation } from "@/db/utils/evaluations";

// GET /api/evaluations - List evaluations with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
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
    const filters = {
      entryId: searchParams.get("entryId")
        ? parseInt(searchParams.get("entryId")!)
        : undefined,
      employeeId: searchParams.get("employeeId")
        ? parseInt(searchParams.get("employeeId")!)
        : undefined,
      evaluatorId: searchParams.get("evaluatorId")
        ? parseInt(searchParams.get("evaluatorId")!)
        : undefined,
      teamId: searchParams.get("teamId")
        ? parseInt(searchParams.get("teamId")!)
        : undefined,
      ruleSetId: searchParams.get("ruleSetId")
        ? parseInt(searchParams.get("ruleSetId")!)
        : undefined,
      minScore: searchParams.get("minScore")
        ? parseInt(searchParams.get("minScore")!)
        : undefined,
      maxScore: searchParams.get("maxScore")
        ? parseInt(searchParams.get("maxScore")!)
        : undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      sortBy:
        (searchParams.get("sortBy") as "evaluatedAt" | "totalScore") ||
        "evaluatedAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    const result = await getEvaluations(filters);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    return NextResponse.json(
      { error: "Failed to fetch evaluations" },
      { status: 500 }
    );
  }
}

// POST /api/evaluations - Create evaluation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const canCreate = await checkPermission(
      session.user.id,
      "evaluations",
      "create"
    );
    if (!canCreate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (
      !body.entryId ||
      !body.ruleSetId ||
      body.totalScore === undefined ||
      !body.violations
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate score range
    if (body.totalScore < 0 || body.totalScore > 100) {
      return NextResponse.json(
        { error: "Score must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Validate violations array
    if (!Array.isArray(body.violations)) {
      return NextResponse.json(
        { error: "Violations must be an array" },
        { status: 400 }
      );
    }

    // Create evaluation
    const evaluation = await createEvaluation({
      entryId: body.entryId,
      evaluatorId: session.user.id,
      ruleSetId: body.ruleSetId,
      totalScore: body.totalScore,
      violations: body.violations,
      comments: body.comments || null,
    });

    return NextResponse.json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    console.error("Error creating evaluation:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create evaluation",
      },
      { status: 500 }
    );
  }
}
