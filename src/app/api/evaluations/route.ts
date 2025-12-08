/**
 * Evaluations API Routes
 * GET /api/evaluations - List evaluations with filters
 * POST /api/evaluations - Create evaluation
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import { getEvaluations, createEvaluation } from "@/db/utils/evaluations";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";

// GET /api/evaluations - List evaluations with filters
export const GET = withErrorHandling(async (request: NextRequest) => {
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  context.userId = session.user.id;
  context.userEmail = session.user.email;

  const canRead = await checkPermission(session.user.id, "evaluations", "read");
  if (!canRead) {
    return ApiErrors.insufficientPermissions(context, "evaluations:read");
  }

  // Get query parameters
  const searchParams = request.nextUrl.searchParams;

  const entryId = searchParams.get("entryId");
  const employeeId = searchParams.get("employeeId");
  const evaluatorId = searchParams.get("evaluatorId");
  const teamId = searchParams.get("teamId");
  const ruleSetId = searchParams.get("ruleSetId");
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

  // Validate numeric parameters
  const filters: any = {
    page,
    pageSize,
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    sortBy:
      (searchParams.get("sortBy") as "evaluatedAt" | "totalScore") ||
      "evaluatedAt",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
  };

  if (entryId) {
    const id = parseInt(entryId);
    if (isNaN(id)) {
      return ApiErrors.invalidInput(context, "Invalid entry ID", "entryId");
    }
    filters.entryId = id;
  }

  if (employeeId) {
    const id = parseInt(employeeId);
    if (isNaN(id)) {
      return ApiErrors.invalidInput(
        context,
        "Invalid employee ID",
        "employeeId"
      );
    }
    filters.employeeId = id;
  }

  if (evaluatorId) {
    const id = parseInt(evaluatorId);
    if (isNaN(id)) {
      return ApiErrors.invalidInput(
        context,
        "Invalid evaluator ID",
        "evaluatorId"
      );
    }
    filters.evaluatorId = id;
  }

  if (teamId) {
    const id = parseInt(teamId);
    if (isNaN(id)) {
      return ApiErrors.invalidInput(context, "Invalid team ID", "teamId");
    }
    filters.teamId = id;
  }

  if (ruleSetId) {
    const id = parseInt(ruleSetId);
    if (isNaN(id)) {
      return ApiErrors.invalidInput(
        context,
        "Invalid rule set ID",
        "ruleSetId"
      );
    }
    filters.ruleSetId = id;
  }

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
  if (
    filters.startDate &&
    filters.endDate &&
    new Date(filters.startDate) > new Date(filters.endDate)
  ) {
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
});

// POST /api/evaluations - Create evaluation
export const POST = withErrorHandling(async (request: NextRequest) => {
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  context.userId = session.user.id;
  context.userEmail = session.user.email;

  const canCreate = await checkPermission(
    session.user.id,
    "evaluations",
    "create"
  );
  if (!canCreate) {
    return ApiErrors.insufficientPermissions(context, "evaluations:create");
  }

  const body = await request.json();

  // Validate required fields
  if (!body.entryId) {
    return ApiErrors.missingField(context, "entryId");
  }
  if (!body.ruleSetId) {
    return ApiErrors.missingField(context, "ruleSetId");
  }
  if (body.totalScore === undefined) {
    return ApiErrors.missingField(context, "totalScore");
  }
  if (!body.violations) {
    return ApiErrors.missingField(context, "violations");
  }

  // Validate types
  const entryId = parseInt(body.entryId);
  if (isNaN(entryId)) {
    return ApiErrors.invalidInput(
      context,
      "Entry ID must be a number",
      "entryId"
    );
  }

  const ruleSetId = parseInt(body.ruleSetId);
  if (isNaN(ruleSetId)) {
    return ApiErrors.invalidInput(
      context,
      "Rule set ID must be a number",
      "ruleSetId"
    );
  }

  const totalScore = parseFloat(body.totalScore);
  if (isNaN(totalScore) || totalScore < 0 || totalScore > 100) {
    return ApiErrors.invalidInput(
      context,
      "Score must be between 0 and 100",
      "totalScore"
    );
  }

  if (!Array.isArray(body.violations)) {
    return ApiErrors.invalidInput(
      context,
      "Violations must be an array",
      "violations"
    );
  }

  const evaluation = await createEvaluation({
    entryId,
    evaluatorId: session.user.id,
    ruleSetId,
    totalScore,
    violations: body.violations,
    comments: body.comments || null,
  });

  return NextResponse.json(
    {
      success: true,
      data: evaluation,
      message: "Evaluation created successfully",
    },
    {
      status: 201,
      headers: {
        "X-Request-ID": context.requestId || "",
      },
    }
  );
});
