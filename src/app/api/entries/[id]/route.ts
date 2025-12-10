/**
 * Entry Detail API Routes
 * GET /api/entries/[id] - Get entry details
 * PATCH /api/entries/[id] - Update entry
 * DELETE /api/entries/[id] - Delete entry
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission, getUserPermissions } from "@/db/utils/permissions";
import { getEntryById, updateEntry, deleteEntry } from "@/db/utils/entries";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

interface RouteParams {
  params: { id: string };
}

// GET /api/entries/[id]
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    const context = await getRequestContext(request);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(context);
    }

    context.userId = session.user.id;
    context.userEmail = session.user.email;

    const canRead = await checkPermission(session.user.id, "entries", "read");
    if (!canRead) {
      return ApiErrors.insufficientPermissions(context, "entries:read");
    }

    const entryId = parseInt(params.id);
    if (isNaN(entryId)) {
      return ApiErrors.invalidId(context, "Entry");
    }

    const entry = await getEntryById(entryId);
    if (!entry) {
      return ApiErrors.notFound(context, "Entry");
    }

    // Check permission scope
    const userPerms = await getUserPermissions(session.user.id);
    const readPermission = userPerms?.permissions.find(
      (p) => p.resource === "entries" && p.action === "read"
    );

    if (
      readPermission?.scope === "own" &&
      entry.employeeId !== session.user.id
    ) {
      return ApiErrors.forbidden(context, "You can only view your own entries");
    }

    if (readPermission?.scope === "team" && userPerms?.teamId) {
      // Would need to check if entry.employeeId belongs to same team
      // For now, we'll allow it if user has team-level permission
    }

    return NextResponse.json(
      {
        success: true,
        data: entry,
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);

// PATCH /api/entries/[id]
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
      "entries",
      "update"
    );
    if (!canUpdate) {
      return ApiErrors.insufficientPermissions(context, "entries:update");
    }

    const entryId = parseInt(params.id);
    if (isNaN(entryId)) {
      return ApiErrors.invalidId(context, "Entry");
    }

    const entry = await getEntryById(entryId);
    if (!entry) {
      return ApiErrors.notFound(context, "Entry");
    }

    // Check permission scope
    const userPerms = await getUserPermissions(session.user.id);
    const updatePermission = userPerms?.permissions.find(
      (p) => p.resource === "entries" && p.action === "update"
    );

    if (
      updatePermission?.scope === "own" &&
      entry.employeeId !== session.user.id
    ) {
      return ApiErrors.forbidden(
        context,
        "You can only update your own entries"
      );
    }

    const body = await request.json();

    // Build update object
    const updateData: any = {};

    if (body.productName !== undefined) {
      if (
        typeof body.productName !== "string" ||
        body.productName.trim().length === 0
      ) {
        return ApiErrors.invalidInput(
          context,
          "Product name must be a non-empty string",
          "productName"
        );
      }
      updateData.productName = body.productName.trim();
    }

    if (body.productDescription !== undefined) {
      updateData.productDescription = body.productDescription;
    }

    if (body.followsNamingConvention !== undefined) {
      if (typeof body.followsNamingConvention !== "boolean") {
        return ApiErrors.invalidInput(
          context,
          "followsNamingConvention must be a boolean",
          "followsNamingConvention"
        );
      }
      updateData.followsNamingConvention = body.followsNamingConvention;
    }

    if (body.followsSpecificationOrder !== undefined) {
      if (typeof body.followsSpecificationOrder !== "boolean") {
        return ApiErrors.invalidInput(
          context,
          "followsSpecificationOrder must be a boolean",
          "followsSpecificationOrder"
        );
      }
      updateData.followsSpecificationOrder = body.followsSpecificationOrder;
    }

    if (body.containsUnwantedKeywords !== undefined) {
      if (typeof body.containsUnwantedKeywords !== "boolean") {
        return ApiErrors.invalidInput(
          context,
          "containsUnwantedKeywords must be a boolean",
          "containsUnwantedKeywords"
        );
      }
      updateData.containsUnwantedKeywords = body.containsUnwantedKeywords;
    }

    if (Object.keys(updateData).length === 0) {
      return ApiErrors.invalidInput(context, "No valid fields to update");
    }

    const updatedEntry = await updateEntry(entryId, updateData);

    return NextResponse.json(
      {
        success: true,
        data: updatedEntry,
        message: "Entry updated successfully",
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);

// DELETE /api/entries/[id]
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
      "entries",
      "delete"
    );
    if (!canDelete) {
      return ApiErrors.insufficientPermissions(context, "entries:delete");
    }

    const entryId = parseInt(params.id);
    if (isNaN(entryId)) {
      return ApiErrors.invalidId(context, "Entry");
    }

    const entry = await getEntryById(entryId);
    if (!entry) {
      return ApiErrors.notFound(context, "Entry");
    }

    // Check permission scope
    const userPerms = await getUserPermissions(session.user.id);
    const deletePermission = userPerms?.permissions.find(
      (p) => p.resource === "entries" && p.action === "delete"
    );

    if (
      deletePermission?.scope === "own" &&
      entry.employeeId !== session.user.id
    ) {
      return ApiErrors.forbidden(
        context,
        "You can only delete your own entries"
      );
    }

    await deleteEntry(entryId);

    return NextResponse.json(
      {
        success: true,
        message: "Entry deleted successfully",
        data: { id: entryId },
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);
