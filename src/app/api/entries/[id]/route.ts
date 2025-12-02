import { NextRequest } from "next/server";
import { db } from "@/db";
import { entries, users, entryTypes, qualityEvaluations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, isAdmin, getUserId } from "@/lib/middleware/auth";
import { handleApiError, successResponse, parseBody } from "@/lib/api/utils";
import { updateEntrySchema } from "@/lib/validations/schemas";

/**
 * GET /api/entries/[id] - Get entry details
 * Requires: authenticated
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const entryId = parseInt(params.id);

    // Get entry with employee and entry type info
    const [entry] = await db
      .select({
        id: entries.id,
        employeeId: entries.employeeId,
        employeeName: users.fullName,
        employeeEmail: users.email,
        entryTypeId: entries.entryTypeId,
        entryTypeName: entryTypes.name,
        productName: entries.productName,
        productDescription: entries.productDescription,
        followsNamingConvention: entries.followsNamingConvention,
        followsSpecificationOrder: entries.followsSpecificationOrder,
        containsUnwantedKeywords: entries.containsUnwantedKeywords,
        entryTime: entries.entryTime,
      })
      .from(entries)
      .leftJoin(users, eq(entries.employeeId, users.id))
      .leftJoin(entryTypes, eq(entries.entryTypeId, entryTypes.id))
      .where(eq(entries.id, entryId))
      .limit(1);

    if (!entry) {
      throw new Error("Entry not found");
    }

    // Check permissions
    const canView =
      isAdmin(session) ||
      session.user.role === "team_leader" ||
      entry.employeeId.toString() === session.user.id;

    if (!canView) {
      throw new Error("Forbidden - Cannot view this entry");
    }

    // Get evaluations for this entry
    const evaluationsList = await db
      .select({
        id: qualityEvaluations.id,
        evaluatorId: qualityEvaluations.evaluatorId,
        evaluatorName: users.fullName,
        totalScore: qualityEvaluations.totalScore,
        violations: qualityEvaluations.violations,
        comments: qualityEvaluations.comments,
        evaluatedAt: qualityEvaluations.evaluatedAt,
      })
      .from(qualityEvaluations)
      .leftJoin(users, eq(qualityEvaluations.evaluatorId, users.id))
      .where(eq(qualityEvaluations.entryId, entryId));

    return successResponse({
      entry,
      evaluations: evaluationsList,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/entries/[id] - Update entry
 * Requires: entry owner or admin
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const entryId = parseInt(params.id);
    const body = await parseBody(request);

    // Validate request body
    const validatedData = updateEntrySchema.parse(body);

    // Get existing entry
    const [entry] = await db
      .select()
      .from(entries)
      .where(eq(entries.id, entryId))
      .limit(1);

    if (!entry) {
      throw new Error("Entry not found");
    }

    // Check permissions
    const canUpdate =
      isAdmin(session) || entry.employeeId.toString() === session.user.id;

    if (!canUpdate) {
      throw new Error("Forbidden - Cannot update this entry");
    }

    // Update entry
    const [updatedEntry] = await db
      .update(entries)
      .set(validatedData)
      .where(eq(entries.id, entryId))
      .returning();

    return successResponse(updatedEntry, "Entry updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/entries/[id] - Delete entry
 * Requires: admin only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const entryId = parseInt(params.id);

    // Only admins can delete
    if (!isAdmin(session)) {
      throw new Error("Forbidden - Only admins can delete entries");
    }

    // Check if entry exists
    const [entry] = await db
      .select()
      .from(entries)
      .where(eq(entries.id, entryId))
      .limit(1);

    if (!entry) {
      throw new Error("Entry not found");
    }

    // Delete entry
    await db.delete(entries).where(eq(entries.id, entryId));

    return successResponse({ id: entryId }, "Entry deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
