/**
 * Evaluations API Routes
 * GET /api/evaluations - List evaluations
 * POST /api/evaluations - Create evaluation
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission, getUserPermissions } from "@/db/utils/permissions";
import {
  getEvaluations,
  createEvaluation,
  bulkCreateEvaluations,
  getEvaluationStats,
} from "@/db/utils/evaluations";

// GET /api/evaluations - List evaluations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const canRead = await checkPermission(
      session.user.id,
      "evaluations",
      "read"
    );
    if (!canRead) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get user permissions
    const userPerms = await getUserPermissions(session.user.id);
    if (!userPerms) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get("employeeId");
    const evaluatorId = searchParams.get("evaluatorId");
    const teamId = searchParams.get("teamId");
    const minScore = searchParams.get("minScore");
    const maxScore = searchParams.get("maxScore");
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const includeStats = searchParams.get("stats") === "true";

    // Build filters based on permission scope
    const filters: any = {
      page,
      pageSize,
      startDate,
      endDate,
    };

    if (minScore) filters.minScore = parseInt(minScore);
    if (maxScore) filters.maxScore = parseInt(maxScore);
    if (evaluatorId) filters.evaluatorId = parseInt(evaluatorId);

    const readPermission = userPerms.permissions.find(
      (p) => p.resource === "evaluations" && p.action === "read"
    );

    if (readPermission?.scope === "own") {
      // Employee: only their own evaluations
      filters.employeeId = session.user.id;
    } else if (readPermission?.scope === "team") {
      // Team leader: their team's evaluations
      if (userPerms.teamId) {
        filters.teamId = userPerms.teamId;
      }
      if (employeeId) {
        filters.employeeId = parseInt(employeeId);
      }
    } else if (readPermission?.scope === "all") {
      // Admin: all evaluations
      if (employeeId) filters.employeeId = parseInt(employeeId);
      if (teamId) filters.teamId = parseInt(teamId);
    }

    const result = await getEvaluations(filters);

    // Get stats if requested
    let stats;
    if (includeStats) {
      stats = await getEvaluationStats({
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
    console.error("Error fetching evaluations:", error);
    return NextResponse.json(
      { error: "Failed to fetch evaluations" },
      { status: 500 }
    );
  }
}

// POST /api/evaluations - Create evaluation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const canCreate = await checkPermission(
      session.user.id,
      "evaluations",
      "create"
    );
    if (!canCreate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Check if bulk create
    if (Array.isArray(body)) {
      // Bulk create evaluations
      const result = await bulkCreateEvaluations(
        body.map((item) => ({
          entryId: item.entryId,
          evaluatorId: session.user.id,
          ruleSetId: item.ruleSetId,
          totalScore: item.totalScore,
          violations: item.violations || [],
          comments: item.comments,
        }))
      );

      return NextResponse.json({
        success: true,
        data: result.created,
        skipped: result.skipped,
        message: `${result.created.length} evaluations created, ${result.skipped} skipped`,
      });
    }

    // Single evaluation create
    if (
      !body.entryId ||
      !body.ruleSetId ||
      body.totalScore === undefined ||
      !body.violations
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const evaluation = await createEvaluation({
      entryId: body.entryId,
      evaluatorId: session.user.id,
      ruleSetId: body.ruleSetId,
      totalScore: body.totalScore,
      violations: body.violations,
      comments: body.comments,
    });

    return NextResponse.json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    console.error("Error creating evaluation:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create evaluation",
      },
      { status: 500 }
    );
  }
}
