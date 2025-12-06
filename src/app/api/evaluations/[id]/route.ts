/**
 * Evaluation Detail API Routes
 * GET /api/evaluations/[id] - Get evaluation details
 * PATCH /api/evaluations/[id] - Update evaluation
 * DELETE /api/evaluations/[id] - Delete evaluation (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import {
  getEvaluationById,
  updateEvaluation,
  deleteEvaluation,
} from "@/db/utils/evaluations";

interface RouteParams {
  params: { id: string };
}

// GET /api/evaluations/[id] - Get evaluation details
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

    const evaluationId = parseInt(params.id);
    if (isNaN(evaluationId)) {
      return NextResponse.json(
        { error: "Invalid evaluation ID" },
        { status: 400 }
      );
    }

    const evaluation = await getEvaluationById(evaluationId);

    if (!evaluation) {
      return NextResponse.json(
        { error: "Evaluation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    console.error("Error fetching evaluation:", error);
    return NextResponse.json(
      { error: "Failed to fetch evaluation" },
      { status: 500 }
    );
  }
}

// PATCH /api/evaluations/[id] - Update evaluation
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canUpdate = await checkPermission(
      session.user.id,
      "evaluations",
      "update"
    );
    if (!canUpdate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const evaluationId = parseInt(params.id);
    if (isNaN(evaluationId)) {
      return NextResponse.json(
        { error: "Invalid evaluation ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate at least one field is being updated
    if (!body.totalScore && !body.violations && !body.comments) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Validate score range if provided
    if (body.totalScore !== undefined) {
      if (body.totalScore < 0 || body.totalScore > 100) {
        return NextResponse.json(
          { error: "Score must be between 0 and 100" },
          { status: 400 }
        );
      }
    }

    // Validate violations if provided
    if (body.violations !== undefined && !Array.isArray(body.violations)) {
      return NextResponse.json(
        { error: "Violations must be an array" },
        { status: 400 }
      );
    }

    const evaluation = await updateEvaluation(evaluationId, body);

    return NextResponse.json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    console.error("Error updating evaluation:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update evaluation",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/evaluations/[id] - Delete evaluation
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

    const evaluationId = parseInt(params.id);
    if (isNaN(evaluationId)) {
      return NextResponse.json(
        { error: "Invalid evaluation ID" },
        { status: 400 }
      );
    }

    await deleteEvaluation(evaluationId);

    return NextResponse.json({
      success: true,
      message: "Evaluation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting evaluation:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete evaluation",
      },
      { status: 500 }
    );
  }
}
