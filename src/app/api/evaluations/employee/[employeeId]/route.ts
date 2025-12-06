/**
 * Employee Evaluations API
 * GET /api/evaluations/employee/[employeeId] - Get all evaluations for an employee
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { getEvaluations } from "@/db/utils/evaluations";

interface RouteParams {
  params: { employeeId: string };
}

// GET /api/evaluations/employee/[employeeId]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canRead = await checkPermission(
      session.user.id,
      "evaluations",
      "read"
    );
    if (!canRead) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const employeeId = parseInt(params.employeeId);
    if (isNaN(employeeId)) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const minScore = searchParams.get("minScore")
      ? parseInt(searchParams.get("minScore")!)
      : undefined;
    const maxScore = searchParams.get("maxScore")
      ? parseInt(searchParams.get("maxScore")!)
      : undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const result = await getEvaluations({
      employeeId,
      startDate,
      endDate,
      minScore,
      maxScore,
      page,
      pageSize,
      sortBy: "evaluatedAt",
      sortOrder: "desc",
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error fetching employee evaluations:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee evaluations" },
      { status: 500 }
    );
  }
}
