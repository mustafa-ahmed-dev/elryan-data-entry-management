import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standard API error response
 */
export interface ApiError {
  error: string;
  details?: any;
}

/**
 * Standard API success response
 */
export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(error: unknown): NextResponse {
  console.error("API Error:", error);

  // Validation errors (Zod)
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }

  // Custom errors with status codes
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Unauthorized
    if (
      message.includes("unauthorized") ||
      message.includes("not authenticated")
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Forbidden
    if (message.includes("forbidden") || message.includes("permission")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    // Not found
    if (message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Conflict
    if (message.includes("already exists") || message.includes("duplicate")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    // Bad request
    if (message.includes("invalid") || message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Generic error
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Unknown error
  return NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  );
}

/**
 * Success response helper
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * Paginated response helper
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * Created response helper
 */
export function createdResponse<T>(data: T, message?: string): NextResponse {
  return successResponse(data, message, 201);
}

/**
 * No content response helper
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Parse query parameters from URL
 */
export function parseQueryParams(url: string): Record<string, string> {
  const { searchParams } = new URL(url);
  const params: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

/**
 * Parse and validate request body
 */
export async function parseBody<T>(request: Request): Promise<T> {
  try {
    return await request.json();
  } catch (error) {
    throw new Error("Invalid JSON body");
  }
}

/**
 * Get offset for pagination
 */
export function getOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Log API request
 */
export function logRequest(method: string, path: string, userId?: string) {
  console.log(
    `[${new Date().toISOString()}] ${method} ${path} - User: ${
      userId || "Anonymous"
    }`
  );
}
