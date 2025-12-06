/**
 * Roles API Route
 * GET /api/roles - List all roles
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/db";
import { roles } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

// GET /api/roles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all active roles
    const rolesList = await db
      .select()
      .from(roles)
      .where(eq(roles.isActive, true))
      .orderBy(asc(roles.hierarchy));

    return NextResponse.json({
      success: true,
      data: rolesList,
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}
