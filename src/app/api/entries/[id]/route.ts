import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { getEntryById, updateEntry, deleteEntry } from "@/db/utils/entries";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

/**
 * GET /api/entries/[id]
 * Get a single entry by ID
 */
export const GET = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const context = await getRequestContext(req);
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return ApiErrors.unauthorized(context);
    }

    const entryId = parseInt(params.id);
    if (isNaN(entryId)) {
      return ApiErrors.invalidId(context, "Entry");
    }

    // Check permission
    const canRead = await checkPermission(session.user.id, "read", "entries");
    if (!canRead) {
      return ApiErrors.insufficientPermissions(context, "read entries");
    }

    const entry = await getEntryById(entryId);

    if (!entry) {
      return ApiErrors.notFound(context, "Entry");
    }

    // Team leaders can only see their team's entries
    if (session.user.role === "team_leader") {
      if (entry.teamId !== session.user.teamId) {
        return ApiErrors.forbidden(
          context,
          "You can only view entries from your team"
        );
      }
    }

    // Employees can only see their own entries
    if (session.user.role === "employee") {
      if (entry.employeeId !== session.user.id) {
        return ApiErrors.forbidden(
          context,
          "You can only view your own entries"
        );
      }
    }

    return NextResponse.json(entry, { status: 200 });
  }
);

/**
 * PATCH /api/entries/[id]
 * Update an entry
 */
export const PATCH = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const context = await getRequestContext(req);
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return ApiErrors.unauthorized(context);
    }

    const entryId = parseInt(params.id);
    if (isNaN(entryId)) {
      return ApiErrors.invalidId(context, "Entry");
    }

    // Check permission
    const canUpdate = await checkPermission(
      session.user.id,
      "update",
      "entries"
    );
    if (!canUpdate) {
      return ApiErrors.insufficientPermissions(context, "update entries");
    }

    // Get existing entry
    const existingEntry = await getEntryById(entryId);
    if (!existingEntry) {
      return ApiErrors.notFound(context, "Entry");
    }

    // Team leaders can only update their team's entries
    if (session.user.role === "team_leader") {
      if (existingEntry.teamId !== session.user.teamId) {
        return ApiErrors.forbidden(
          context,
          "You can only update entries from your team"
        );
      }
    }

    // Employees can only update their own entries
    if (session.user.role === "employee") {
      if (existingEntry.employeeId !== session.user.id) {
        return ApiErrors.forbidden(
          context,
          "You can only update your own entries"
        );
      }
    }

    const body = await req.json();

    // Validate and build update data
    const updateData: any = {};

    if (body.sku !== undefined) {
      if (typeof body.sku !== "string" || body.sku.trim().length === 0) {
        return ApiErrors.invalidInput(
          context,
          "SKU must be a non-empty string",
          "sku"
        );
      }
      updateData.sku = body.sku.trim();
    }

    if (body.entryTypeId !== undefined) {
      if (typeof body.entryTypeId !== "number") {
        return ApiErrors.invalidInput(
          context,
          "Entry type ID must be a number",
          "entryTypeId"
        );
      }
      updateData.entryTypeId = body.entryTypeId;
    }

    if (Object.keys(updateData).length === 0) {
      return ApiErrors.invalidInput(context, "No valid fields to update");
    }

    const updatedEntry = await updateEntry(entryId, updateData);

    return NextResponse.json(
      {
        message: "Entry updated successfully",
        data: updatedEntry,
      },
      { status: 200 }
    );
  }
);

/**
 * DELETE /api/entries/[id]
 * Delete an entry
 */
export const DELETE = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const context = await getRequestContext(req);
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return ApiErrors.unauthorized(context);
    }

    const entryId = parseInt(params.id);
    if (isNaN(entryId)) {
      return ApiErrors.invalidId(context, "Entry");
    }

    // Check permission
    const canDelete = await checkPermission(
      session.user.id,
      "delete",
      "entries"
    );
    if (!canDelete) {
      return ApiErrors.insufficientPermissions(context, "delete entries");
    }

    // Get existing entry
    const existingEntry = await getEntryById(entryId);
    if (!existingEntry) {
      return ApiErrors.notFound(context, "Entry");
    }

    // Team leaders can only delete their team's entries
    if (session.user.role === "team_leader") {
      if (existingEntry.teamId !== session.user.teamId) {
        return ApiErrors.forbidden(
          context,
          "You can only delete entries from your team"
        );
      }
    }

    await deleteEntry(entryId);

    return NextResponse.json(
      { message: "Entry deleted successfully" },
      { status: 200 }
    );
  }
);
