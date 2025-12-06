/**
 * Entry Type Detail API Routes
 * GET /api/entry-types/[id] - Get entry type details
 * PATCH /api/entry-types/[id] - Update entry type
 * DELETE /api/entry-types/[id] - Delete entry type
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { db } from "@/db";
import { entryTypes, entries } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

interface RouteParams {
  params: { id: string };
}

// GET /api/entry-types/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canRead = await checkPermission(session.user.id, "entries", "read");
    if (!canRead) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const entryTypeId = parseInt(params.id);
    if (isNaN(entryTypeId)) {
      return NextResponse.json(
        { error: "Invalid entry type ID" },
        { status: 400 }
      );
    }

    const [entryType] = await db
      .select()
      .from(entryTypes)
      .where(eq(entryTypes.id, entryTypeId))
      .limit(1);

    if (!entryType) {
      return NextResponse.json(
        { error: "Entry type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: entryType,
    });
  } catch (error) {
    console.error("Error fetching entry type:", error);
    return NextResponse.json(
      { error: "Failed to fetch entry type" },
      { status: 500 }
    );
  }
}

// PATCH /api/entry-types/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canUpdate = await checkPermission(
      session.user.id,
      "entries",
      "update",
      "all"
    );
    if (!canUpdate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const entryTypeId = parseInt(params.id);
    if (isNaN(entryTypeId)) {
      return NextResponse.json(
        { error: "Invalid entry type ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Build update object
    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.description !== undefined)
      updateData.description = body.description;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(entryTypes)
      .set(updateData)
      .where(eq(entryTypes.id, entryTypeId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Entry type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating entry type:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update entry type",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/entry-types/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canDelete = await checkPermission(
      session.user.id,
      "entries",
      "delete",
      "all"
    );
    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const entryTypeId = parseInt(params.id);
    if (isNaN(entryTypeId)) {
      return NextResponse.json(
        { error: "Invalid entry type ID" },
        { status: 400 }
      );
    }

    // Check if entry type has been used in entries
    const [entryCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(entries)
      .where(eq(entries.entryTypeId, entryTypeId));

    if (Number(entryCount.count) > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete entry type that has been used in ${entryCount.count} entry(ies). This maintains data integrity.`,
        },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(entryTypes)
      .where(eq(entryTypes.id, entryTypeId))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Entry type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Entry type deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting entry type:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete entry type",
      },
      { status: 500 }
    );
  }
}
