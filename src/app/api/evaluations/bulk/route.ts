/**
 * Bulk Evaluations API
 * POST /api/evaluations/bulk - Create multiple evaluations at once
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { createBulkEvaluations } from "@/db/utils/evaluations";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

// POST /api/evaluations/bulk - Create multiple evaluations
export const POST = withErrorHandling(async (request: NextRequest) => {
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  context.userId = session.user.id;
  context.userEmail = session.user.email;

  const canCreate = await checkPermission(
    session.user.id,
    "evaluations",
    "create"
  );
  if (!canCreate) {
    return ApiErrors.insufficientPermissions(context, "evaluations:create");
  }

  const body = await request.json();

  // Validate evaluations array
  if (!body.evaluations) {
    return ApiErrors.missingField(context, "evaluations");
  }

  if (!Array.isArray(body.evaluations)) {
    return ApiErrors.invalidInput(
      context,
      "Evaluations must be an array",
      "evaluations"
    );
  }

  if (body.evaluations.length === 0) {
    return ApiErrors.invalidInput(
      context,
      "At least one evaluation is required",
      "evaluations"
    );
  }

  if (body.evaluations.length > 100) {
    return ApiErrors.invalidInput(
      context,
      "Cannot create more than 100 evaluations at once",
      "evaluations"
    );
  }

  // Validate each evaluation
  for (let i = 0; i < body.evaluations.length; i++) {
    const evaluation = body.evaluations[i];

    if (!evaluation.entryId) {
      return ApiErrors.missingField(context, `evaluations[${i}].entryId`);
    }
    if (!evaluation.ruleSetId) {
      return ApiErrors.missingField(context, `evaluations[${i}].ruleSetId`);
    }

    // Validate types
    const entryId = parseInt(evaluation.entryId);
    if (isNaN(entryId)) {
      return ApiErrors.invalidInput(
        context,
        `Evaluation ${i + 1}: Entry ID must be a number`,
        `evaluations[${i}].entryId`
      );
    }

    const ruleSetId = parseInt(evaluation.ruleSetId);
    if (isNaN(ruleSetId)) {
      return ApiErrors.invalidInput(
        context,
        `Evaluation ${i + 1}: Rule set ID must be a number`,
        `evaluations[${i}].ruleSetId`
      );
    }

    // Validate score
    if (evaluation.totalScore === undefined) {
      return ApiErrors.missingField(context, `evaluations[${i}].totalScore`);
    }

    const score = parseFloat(evaluation.totalScore);
    if (isNaN(score) || score < 0 || score > 100) {
      return ApiErrors.invalidInput(
        context,
        `Evaluation ${i + 1}: Score must be between 0 and 100`,
        `evaluations[${i}].totalScore`
      );
    }

    // Validate violations
    if (!evaluation.violations) {
      return ApiErrors.missingField(context, `evaluations[${i}].violations`);
    }

    if (!Array.isArray(evaluation.violations)) {
      return ApiErrors.invalidInput(
        context,
        `Evaluation ${i + 1}: Violations must be an array`,
        `evaluations[${i}].violations`
      );
    }
  }

  // Add evaluator ID to all evaluations
  const evaluationsWithEvaluator = body.evaluations.map((evaluation: any) => ({
    ...evaluation,
    entryId: parseInt(evaluation.entryId),
    ruleSetId: parseInt(evaluation.ruleSetId),
    totalScore: parseFloat(evaluation.totalScore),
    evaluatorId: session.user.id,
    comments: evaluation.comments || null,
  }));

  const result = await createBulkEvaluations(evaluationsWithEvaluator);

  return NextResponse.json(
    {
      success: true,
      data: result,
      message: `Successfully created ${result.length} evaluations`,
    },
    {
      status: 201,
      headers: {
        "X-Request-ID": context.requestId || "",
      },
    }
  );
});
