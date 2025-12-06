/**
 * Entry Types API Routes
 * GET /api/entry-types - List all entry types
 * POST /api/entry-types - Create new entry type
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { db } from "@/db";
import { entryTypes } from "@/db/schema";
import { desc } from "drizzle-orm";

// GET /api/entry-types - List all entry types
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canRead = await checkPermission(session.user.id, "entries", "read");
    if (!canRead) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all entry types
    const types = await db
      .select()
      .from(entryTypes)
      .orderBy(desc(entryTypes.createdAt));

    return NextResponse.json({
      success: true,
      data: types,
    });
  } catch (error) {
    console.error("Error fetching entry types:", error);
    return NextResponse.json(
      { error: "Failed to fetch entry types" },
      { status: 500 }
    );
  }
}

// POST /api/entry-types - Create new entry type
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission (admin only)
    const canCreate = await checkPermission(
      session.user.id,
      "entries",
      "create",
      "all"
    );
    if (!canCreate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Create entry type
    const [entryType] = await db
      .insert(entryTypes)
      .values({
        name: body.name,
        description: body.description || null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: entryType,
    });
  } catch (error) {
    console.error("Error creating entry type:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create entry type",
      },
      { status: 500 }
    );
  }
}
