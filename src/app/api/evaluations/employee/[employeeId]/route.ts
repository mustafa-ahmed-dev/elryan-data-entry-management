/**
 * Employee Evaluations API
 * GET /api/evaluations/employee/[employeeId] - Get all evaluations for an employee
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { getEvaluations } from "@/db/utils/evaluations";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

interface RouteParams {
  params: { employeeId: string };
}

// GET /api/evaluations/employee/[employeeId]
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    const context = await getRequestContext(request);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized(context);
    }

    context.userId = session.user.id;
    context.userEmail = session.user.email;

    const canRead = await checkPermission(
      session.user.id,
      "evaluations",
      "read"
    );
    if (!canRead) {
      return ApiErrors.insufficientPermissions(context, "evaluations:read");
    }

    const employeeId = parseInt(params.employeeId);
    if (isNaN(employeeId)) {
      return ApiErrors.invalidId(context, "Employee");
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const minScore = searchParams.get("minScore");
    const maxScore = searchParams.get("maxScore");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    // Validate pagination
    if (page < 1) {
      return ApiErrors.invalidInput(context, "Page must be >= 1", "page");
    }
    if (pageSize < 1 || pageSize > 100) {
      return ApiErrors.invalidInput(
        context,
        "Page size must be between 1 and 100",
        "pageSize"
      );
    }

    const filters: any = {
      employeeId,
      startDate,
      endDate,
      page,
      pageSize,
      sortBy: "evaluatedAt",
      sortOrder: "desc",
    };

    if (minScore) {
      const score = parseInt(minScore);
      if (isNaN(score) || score < 0 || score > 100) {
        return ApiErrors.invalidInput(
          context,
          "Min score must be between 0 and 100",
          "minScore"
        );
      }
      filters.minScore = score;
    }

    if (maxScore) {
      const score = parseInt(maxScore);
      if (isNaN(score) || score < 0 || score > 100) {
        return ApiErrors.invalidInput(
          context,
          "Max score must be between 0 and 100",
          "maxScore"
        );
      }
      filters.maxScore = score;
    }

    // Validate date range
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return ApiErrors.invalidDateRange(context);
    }

    const result = await getEvaluations(filters);

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  }
);
