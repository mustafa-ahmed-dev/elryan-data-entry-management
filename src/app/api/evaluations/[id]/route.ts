import { NextRequest } from "next/server";
import { db } from "@/db";
import { qualityEvaluations, entries, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  requireAuth,
  canManageTeam,
  isAdmin,
  getUserId,
} from "@/lib/middleware/auth";
import { handleApiError, successResponse, parseBody } from "@/lib/api/utils";
import { updateEvaluationSchema } from "@/lib/validations/schemas";

/**
 * GET /api/evaluations/[id] - Get evaluation details
 * Requires: authenticated
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const evaluationId = parseInt(params.id);

    // Get evaluation with entry and employee info
    const [evaluation] = await db
      .select({
        id: qualityEvaluations.id,
        entryId: qualityEvaluations.entryId,
        employeeId: entries.employeeId,
        employeeName: users.fullName,
        evaluatorId: qualityEvaluations.evaluatorId,
        ruleSetId: qualityEvaluations.ruleSetId,
        totalScore: qualityEvaluations.totalScore,
        violations: qualityEvaluations.violations,
        comments: qualityEvaluations.comments,
        evaluatedAt: qualityEvaluations.evaluatedAt,
      })
      .from(qualityEvaluations)
      .innerJoin(entries, eq(qualityEvaluations.entryId, entries.id))
      .leftJoin(users, eq(entries.employeeId, users.id))
      .where(eq(qualityEvaluations.id, evaluationId))
      .limit(1);

    if (!evaluation) {
      throw new Error("Evaluation not found");
    }

    // Check permissions
    const canView =
      isAdmin(session) ||
      session.user.role === "team_leader" ||
      evaluation.employeeId.toString() === session.user.id;

    if (!canView) {
      throw new Error("Forbidden - Cannot view this evaluation");
    }

    return successResponse(evaluation);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/evaluations/[id] - Update evaluation
 * Requires: evaluator or admin
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const evaluationId = parseInt(params.id);
    const body = await parseBody(request);

    // Validate request body
    const validatedData = updateEvaluationSchema.parse(body);

    // Get existing evaluation
    const [evaluation] = await db
      .select()
      .from(qualityEvaluations)
      .where(eq(qualityEvaluations.id, evaluationId))
      .limit(1);

    if (!evaluation) {
      throw new Error("Evaluation not found");
    }

    // Check permissions (only evaluator or admin can update)
    const canUpdate =
      isAdmin(session) || evaluation.evaluatorId.toString() === session.user.id;

    if (!canUpdate) {
      throw new Error("Forbidden - Cannot update this evaluation");
    }

    // Update evaluation
    const [updatedEvaluation] = await db
      .update(qualityEvaluations)
      .set(validatedData)
      .where(eq(qualityEvaluations.id, evaluationId))
      .returning();

    return successResponse(
      updatedEvaluation,
      "Evaluation updated successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/evaluations/[id] - Delete evaluation
 * Requires: admin only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const evaluationId = parseInt(params.id);

    // Only admins can delete
    if (!isAdmin(session)) {
      throw new Error("Forbidden - Only admins can delete evaluations");
    }

    // Check if evaluation exists
    const [evaluation] = await db
      .select()
      .from(qualityEvaluations)
      .where(eq(qualityEvaluations.id, evaluationId))
      .limit(1);

    if (!evaluation) {
      throw new Error("Evaluation not found");
    }

    // Delete evaluation
    await db
      .delete(qualityEvaluations)
      .where(eq(qualityEvaluations.id, evaluationId));

    return successResponse(
      { id: evaluationId },
      "Evaluation deleted successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}
