/**
 * Entry Types API
 * GET /api/entry-types - List all entry types
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/db";
import { entryTypes } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all entry types
    const types = await db
      .select({
        id: entryTypes.id,
        name: entryTypes.name,
        description: entryTypes.description,
      })
      .from(entryTypes)
      .orderBy(asc(entryTypes.name));

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
