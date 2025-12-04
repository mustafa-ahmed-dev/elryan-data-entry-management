/**
 * Entries API Routes
 * GET /api/entries - List entries
 * POST /api/entries - Create entry
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission, getUserPermissions } from "@/db/utils/permissions";
import {
  getEntries,
  createEntry,
  bulkCreateEntries,
  getEntryStats,
} from "@/db/utils/entries";

// GET /api/entries - List entries
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const canRead = await checkPermission(session.user.id, "entries", "read");
    if (!canRead) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get user permissions to determine scope
    const userPerms = await getUserPermissions(session.user.id);
    if (!userPerms) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get("employeeId");
    const teamId = searchParams.get("teamId");
    const entryTypeId = searchParams.get("entryTypeId");
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const date = searchParams.get("date") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const includeStats = searchParams.get("stats") === "true";

    // Build filters based on permission scope
    const filters: any = {
      page,
      pageSize,
      startDate,
      endDate,
      date,
    };

    if (entryTypeId) filters.entryTypeId = parseInt(entryTypeId);

    // Apply scope-based filtering
    const readPermission = userPerms.permissions.find(
      (p) => p.resource === "entries" && p.action === "read"
    );

    if (readPermission?.scope === "own") {
      // Employee: only their own entries
      filters.employeeId = session.user.id;
    } else if (readPermission?.scope === "team") {
      // Team leader: their team's entries
      if (userPerms.teamId) {
        filters.teamId = userPerms.teamId;
      }
      // Allow filtering by specific employee if provided
      if (employeeId) {
        filters.employeeId = parseInt(employeeId);
      }
    } else if (readPermission?.scope === "all") {
      // Admin: all entries, can filter by employee or team
      if (employeeId) filters.employeeId = parseInt(employeeId);
      if (teamId) filters.teamId = parseInt(teamId);
    }

    const result = await getEntries(filters);

    // Get stats if requested
    let stats;
    if (includeStats) {
      stats = await getEntryStats({
        employeeId: filters.employeeId,
        teamId: filters.teamId,
        startDate,
        endDate,
      });
    }

    return NextResponse.json({
      success: true,
      ...result,
      stats,
    });
  } catch (error) {
    console.error("Error fetching entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}

// POST /api/entries - Create entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const canCreate = await checkPermission(
      session.user.id,
      "entries",
      "create"
    );
    if (!canCreate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Check if bulk create
    if (Array.isArray(body)) {
      // Bulk create entries
      const entries = await bulkCreateEntries(
        body.map((item) => ({
          employeeId: session.user.id,
          entryTypeId: item.entryTypeId,
          productName: item.productName,
          productDescription: item.productDescription,
          followsNamingConvention: item.followsNamingConvention,
          followsSpecificationOrder: item.followsSpecificationOrder,
          containsUnwantedKeywords: item.containsUnwantedKeywords,
        }))
      );

      return NextResponse.json({
        success: true,
        data: entries,
        message: `${entries.length} entries created`,
      });
    }

    // Single entry create
    if (!body.entryTypeId || !body.productName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const entry = await createEntry({
      employeeId: session.user.id,
      entryTypeId: body.entryTypeId,
      productName: body.productName,
      productDescription: body.productDescription,
      followsNamingConvention: body.followsNamingConvention,
      followsSpecificationOrder: body.followsSpecificationOrder,
      containsUnwantedKeywords: body.containsUnwantedKeywords,
    });

    return NextResponse.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error("Error creating entry:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create entry",
      },
      { status: 500 }
    );
  }
}
