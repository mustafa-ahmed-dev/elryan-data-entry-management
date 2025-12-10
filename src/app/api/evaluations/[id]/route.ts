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
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

interface RouteParams {
  params: { id: string };
}

// GET /api/evaluations/[id]
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    const context = await getRequestContext(request);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(context);
    }

    context.userId = session.user.id;
    context.userEmail = session.user.email;

    const canRead = await checkPermission(
      session.user.id,
      "evaluations",
      "read"
    );
    if (!canRead) {
      return ApiErrors.insufficientPermissions(context, "evaluations:read");
    }

    const evaluationId = parseInt(params.id);
    if (isNaN(evaluationId)) {
      return ApiErrors.invalidId(context, "Evaluation");
    }

    const evaluation = await getEvaluationById(evaluationId);
    if (!evaluation) {
      return ApiErrors.notFound(context, "Evaluation");
    }

    return NextResponse.json(
      {
        success: true,
        data: evaluation,
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);

// PATCH /api/evaluations/[id]
export const PATCH = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    const context = await getRequestContext(request);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(context);
    }

    context.userId = session.user.id;
    context.userEmail = session.user.email;

    const canUpdate = await checkPermission(
      session.user.id,
      "evaluations",
      "update"
    );
    if (!canUpdate) {
      return ApiErrors.insufficientPermissions(context, "evaluations:update");
    }

    const evaluationId = parseInt(params.id);
    if (isNaN(evaluationId)) {
      return ApiErrors.invalidId(context, "Evaluation");
    }

    const body = await request.json();

    // Build update object
    const updateData: any = {};

    if (body.totalScore !== undefined) {
      const score = parseFloat(body.totalScore);
      if (isNaN(score) || score < 0 || score > 100) {
        return ApiErrors.invalidInput(
          context,
          "Score must be between 0 and 100",
          "totalScore"
        );
      }
      updateData.totalScore = score;
    }

    if (body.violations !== undefined) {
      if (!Array.isArray(body.violations)) {
        return ApiErrors.invalidInput(
          context,
          "Violations must be an array",
          "violations"
        );
      }
      updateData.violations = body.violations;
    }

    if (body.comments !== undefined) {
      updateData.comments = body.comments;
    }

    if (Object.keys(updateData).length === 0) {
      return ApiErrors.invalidInput(context, "No valid fields to update");
    }

    const evaluation = await updateEvaluation(evaluationId, updateData);

    return NextResponse.json(
      {
        success: true,
        data: evaluation,
        message: "Evaluation updated successfully",
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);

// DELETE /api/evaluations/[id]
export const DELETE = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    const context = await getRequestContext(request);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(context);
    }

    context.userId = session.user.id;
    context.userEmail = session.user.email;

    const canDelete = await checkPermission(
      session.user.id,
      "evaluations",
      "delete",
      "all"
    );
    if (!canDelete) {
      return ApiErrors.insufficientPermissions(
        context,
        "evaluations:delete:all"
      );
    }

    const evaluationId = parseInt(params.id);
    if (isNaN(evaluationId)) {
      return ApiErrors.invalidId(context, "Evaluation");
    }

    await deleteEvaluation(evaluationId);

    return NextResponse.json(
      {
        success: true,
        message: "Evaluation deleted successfully",
        data: { id: evaluationId },
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);
