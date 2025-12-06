/**
 * Bulk Evaluations API
 * POST /api/evaluations/bulk - Create multiple evaluations at once
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { createBulkEvaluations } from "@/db/utils/evaluations";

// POST /api/evaluations/bulk - Create multiple evaluations
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

    // Validate evaluations array
    if (!body.evaluations || !Array.isArray(body.evaluations)) {
      return NextResponse.json(
        { error: "Evaluations array is required" },
        { status: 400 }
      );
    }

    if (body.evaluations.length === 0) {
      return NextResponse.json(
        { error: "At least one evaluation is required" },
        { status: 400 }
      );
    }

    if (body.evaluations.length > 100) {
      return NextResponse.json(
        { error: "Cannot create more than 100 evaluations at once" },
        { status: 400 }
      );
    }

    // Validate each evaluation
    for (let i = 0; i < body.evaluations.length; i++) {
      const evaluation = body.evaluations[i];

      if (!evaluation.entryId || !evaluation.ruleSetId) {
        return NextResponse.json(
          { error: `Evaluation ${i + 1}: Missing required fields` },
          { status: 400 }
        );
      }

      if (
        evaluation.totalScore === undefined ||
        evaluation.totalScore < 0 ||
        evaluation.totalScore > 100
      ) {
        return NextResponse.json(
          { error: `Evaluation ${i + 1}: Invalid score (must be 0-100)` },
          { status: 400 }
        );
      }

      if (!evaluation.violations || !Array.isArray(evaluation.violations)) {
        return NextResponse.json(
          { error: `Evaluation ${i + 1}: Violations must be an array` },
          { status: 400 }
        );
      }
    }

    // Add evaluator ID to all evaluations
    const evaluationsWithEvaluator = body.evaluations.map(
      (evaluation: any) => ({
        ...evaluation,
        evaluatorId: session.user.id,
        comments: evaluation.comments || null,
      })
    );

    // Create bulk evaluations
    const result = await createBulkEvaluations(evaluationsWithEvaluator);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully created ${result.length} evaluations`,
    });
  } catch (error) {
    console.error("Error creating bulk evaluations:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create bulk evaluations",
      },
      { status: 500 }
    );
  }
}
