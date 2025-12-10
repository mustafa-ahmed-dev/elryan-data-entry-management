/**
 * Production-Ready API Error System
 *
 * Includes:
 * - Standardized error responses
 * - Structured logging with context
 * - Request tracking with unique IDs
 * - Error monitoring integration (Sentry-ready)
 * - Security best practices (PII masking, stack trace hiding)
 * - Performance tracking
 */

import { NextRequest, NextResponse } from "next/server";

// ============================================================================
// ERROR CODES & SEVERITY
// ============================================================================

export enum ErrorCode {
  // Authentication Errors (401)
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  ACCOUNT_DISABLED = "ACCOUNT_DISABLED",

  // Authorization Errors (403)
  FORBIDDEN = "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",

  // Validation Errors (400)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_ID = "INVALID_ID",
  INVALID_DATE_RANGE = "INVALID_DATE_RANGE",

  // Resource Errors (404)
  NOT_FOUND = "NOT_FOUND",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",

  // Conflict Errors (409)
  ALREADY_EXISTS = "ALREADY_EXISTS",
  DUPLICATE_ENTRY = "DUPLICATE_ENTRY",
  CONFLICT = "CONFLICT",

  // Business Logic Errors (422)
  CANNOT_DELETE_IN_USE = "CANNOT_DELETE_IN_USE",
  INVALID_STATUS_TRANSITION = "INVALID_STATUS_TRANSITION",
  BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION",

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // Server Errors (500)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
}

export enum ErrorSeverity {
  LOW = "low", // Minor issues, non-blocking
  MEDIUM = "medium", // Important but not critical
  HIGH = "high", // Serious issues requiring attention
  CRITICAL = "critical", // System-breaking issues
}

// ============================================================================
// TYPES
// ============================================================================

export interface ApiError {
  error: string;
  code: ErrorCode;
  requestId?: string;
  timestamp: string;
  path?: string;
  details?: any;
  // In development only:
  stack?: string;
}

export interface ErrorContext {
  requestId: string;
  userId?: number;
  userEmail?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  duration?: number;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
}

// ============================================================================
// ERROR LOGGING & MONITORING
// ============================================================================

class ErrorLogger {
  private static instance: ErrorLogger;

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Log error with context and severity
   */
  log(
    error: Error | string,
    severity: ErrorSeverity,
    context: Partial<ErrorContext>,
    metadata?: Record<string, any>
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      severity,
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      context: this.sanitizeContext(context),
      metadata,
      environment: process.env.NODE_ENV,
    };

    // Console logging with proper formatting
    const logMethod = this.getLogMethod(severity);
    console[logMethod](JSON.stringify(logEntry, null, 2));

    // Send to external monitoring service (Sentry, DataDog, etc.)
    this.sendToMonitoring(logEntry, severity);
  }

  /**
   * Remove PII and sensitive data from context
   */
  private sanitizeContext(
    context: Partial<ErrorContext>
  ): Partial<ErrorContext> {
    const sanitized = { ...context };

    // Mask email
    if (sanitized.userEmail) {
      const [user, domain] = sanitized.userEmail.split("@");
      sanitized.userEmail = `${user.substring(0, 2)}***@${domain}`;
    }

    // Mask IP (last octet)
    if (sanitized.ip) {
      const parts = sanitized.ip.split(".");
      if (parts.length === 4) {
        sanitized.ip = `${parts[0]}.${parts[1]}.${parts[2]}.***`;
      }
    }

    return sanitized;
  }

  /**
   * Get appropriate console method based on severity
   */
  private getLogMethod(severity: ErrorSeverity): "log" | "warn" | "error" {
    switch (severity) {
      case ErrorSeverity.LOW:
        return "log";
      case ErrorSeverity.MEDIUM:
        return "warn";
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return "error";
    }
  }

  /**
   * Send to external monitoring service
   * Integrate with Sentry, DataDog, New Relic, etc.
   */
  private sendToMonitoring(logEntry: any, severity: ErrorSeverity): void {
    // TODO: Integrate with your monitoring service
    // Example for Sentry:
    /*
    if (typeof Sentry !== 'undefined' && severity >= ErrorSeverity.HIGH) {
      Sentry.captureException(new Error(logEntry.message), {
        level: severity,
        extra: logEntry,
      });
    }
    */
  }
}

// ============================================================================
// REQUEST CONTEXT UTILITIES
// ============================================================================

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Extract request context from NextRequest
 */
export async function getRequestContext(
  request: NextRequest
): Promise<ErrorContext> {
  const url = new URL(request.url);

  return {
    requestId: request.headers.get("x-request-id") || generateRequestId(),
    ip:
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      request.ip ||
      undefined,
    userAgent: request.headers.get("user-agent") || undefined,
    method: request.method,
    path: url.pathname,
  };
}

// ============================================================================
// ERROR RESPONSE BUILDER
// ============================================================================

/**
 * Create standardized error response with logging
 */
export function createErrorResponse(
  message: string,
  code: ErrorCode,
  status: number,
  context: Partial<ErrorContext>,
  details?: any,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM
): NextResponse<ApiError> {
  const isDevelopment = process.env.NODE_ENV === "development";

  const errorResponse: ApiError = {
    error: message,
    code,
    requestId: context.requestId,
    timestamp: new Date().toISOString(),
    path: context.path,
  };

  if (details) {
    errorResponse.details = details;
  }

  // Only include stack trace in development
  if (isDevelopment && details?.stack) {
    errorResponse.stack = details.stack;
  }

  // Log error with context
  ErrorLogger.getInstance().log(message, severity, context, {
    code,
    status,
    details,
  });

  return NextResponse.json(errorResponse, {
    status,
    headers: {
      "X-Request-ID": context.requestId || "",
    },
  });
}

// ============================================================================
// ENHANCED API ERRORS CLASS
// ============================================================================

export class ApiErrors {
  // 401 - Unauthorized
  static unauthorized(
    context: Partial<ErrorContext>,
    message = "Authentication required"
  ): NextResponse {
    return createErrorResponse(
      message,
      ErrorCode.UNAUTHORIZED,
      401,
      context,
      undefined,
      ErrorSeverity.MEDIUM
    );
  }

  static invalidDateRange(context: Partial<ErrorContext>): NextResponse {
    return createErrorResponse(
      "Invalid date range. End date must be after start date.",
      ErrorCode.INVALID_DATE_RANGE,
      400,
      context,
      undefined,
      ErrorSeverity.LOW
    );
  }

  static invalidCredentials(context: Partial<ErrorContext>): NextResponse {
    return createErrorResponse(
      "Invalid email or password",
      ErrorCode.INVALID_CREDENTIALS,
      401,
      context,
      undefined,
      ErrorSeverity.MEDIUM
    );
  }

  static sessionExpired(context: Partial<ErrorContext>): NextResponse {
    return createErrorResponse(
      "Your session has expired. Please login again.",
      ErrorCode.SESSION_EXPIRED,
      401,
      context,
      undefined,
      ErrorSeverity.LOW
    );
  }

  static accountDisabled(context: Partial<ErrorContext>): NextResponse {
    return createErrorResponse(
      "Account is disabled. Please contact administrator.",
      ErrorCode.ACCOUNT_DISABLED,
      401,
      context,
      undefined,
      ErrorSeverity.HIGH
    );
  }

  // 403 - Forbidden
  static forbidden(
    context: Partial<ErrorContext>,
    message = "You don't have permission to access this resource"
  ): NextResponse {
    return createErrorResponse(
      message,
      ErrorCode.FORBIDDEN,
      403,
      context,
      undefined,
      ErrorSeverity.MEDIUM
    );
  }

  static insufficientPermissions(
    context: Partial<ErrorContext>,
    requiredPermission?: string
  ): NextResponse {
    const message = requiredPermission
      ? `Insufficient permissions. Required: ${requiredPermission}`
      : "You don't have sufficient permissions for this action";

    return createErrorResponse(
      message,
      ErrorCode.INSUFFICIENT_PERMISSIONS,
      403,
      context,
      { requiredPermission },
      ErrorSeverity.MEDIUM
    );
  }

  // 400 - Bad Request
  static validationError(
    context: Partial<ErrorContext>,
    errors: ValidationErrorDetail[]
  ): NextResponse {
    return createErrorResponse(
      "Validation failed",
      ErrorCode.VALIDATION_ERROR,
      400,
      context,
      { errors },
      ErrorSeverity.LOW
    );
  }

  static invalidInput(
    context: Partial<ErrorContext>,
    message: string,
    field?: string
  ): NextResponse {
    return createErrorResponse(
      message,
      ErrorCode.INVALID_INPUT,
      400,
      context,
      field ? { field } : undefined,
      ErrorSeverity.LOW
    );
  }

  static missingField(
    context: Partial<ErrorContext>,
    field: string
  ): NextResponse {
    return createErrorResponse(
      `Missing required field: ${field}`,
      ErrorCode.MISSING_REQUIRED_FIELD,
      400,
      context,
      { field },
      ErrorSeverity.LOW
    );
  }

  static invalidId(
    context: Partial<ErrorContext>,
    resourceType = "Resource"
  ): NextResponse {
    return createErrorResponse(
      `Invalid ${resourceType} ID`,
      ErrorCode.INVALID_ID,
      400,
      context,
      undefined,
      ErrorSeverity.LOW
    );
  }

  // 404 - Not Found
  static notFound(
    context: Partial<ErrorContext>,
    resource = "Resource"
  ): NextResponse {
    return createErrorResponse(
      `${resource} not found`,
      ErrorCode.NOT_FOUND,
      404,
      context,
      undefined,
      ErrorSeverity.LOW
    );
  }

  static userNotFound(context: Partial<ErrorContext>): NextResponse {
    return createErrorResponse(
      "User not found",
      ErrorCode.USER_NOT_FOUND,
      404,
      context,
      undefined,
      ErrorSeverity.MEDIUM
    );
  }

  // 409 - Conflict
  static alreadyExists(
    context: Partial<ErrorContext>,
    resource = "Resource"
  ): NextResponse {
    return createErrorResponse(
      `${resource} already exists`,
      ErrorCode.ALREADY_EXISTS,
      409,
      context,
      undefined,
      ErrorSeverity.LOW
    );
  }

  static duplicateEntry(
    context: Partial<ErrorContext>,
    field?: string
  ): NextResponse {
    const message = field ? `Duplicate entry for ${field}` : "Duplicate entry";

    return createErrorResponse(
      message,
      ErrorCode.DUPLICATE_ENTRY,
      409,
      context,
      field ? { field } : undefined,
      ErrorSeverity.LOW
    );
  }

  // 422 - Unprocessable Entity
  static cannotDeleteInUse(
    context: Partial<ErrorContext>,
    resource: string,
    count: number
  ): NextResponse {
    return createErrorResponse(
      `Cannot delete ${resource} that is currently in use by ${count} record(s)`,
      ErrorCode.CANNOT_DELETE_IN_USE,
      422,
      context,
      { resource, usageCount: count },
      ErrorSeverity.MEDIUM
    );
  }

  static businessRuleViolation(
    context: Partial<ErrorContext>,
    rule: string
  ): NextResponse {
    return createErrorResponse(
      `Business rule violation: ${rule}`,
      ErrorCode.BUSINESS_RULE_VIOLATION,
      422,
      context,
      { rule },
      ErrorSeverity.MEDIUM
    );
  }

  // 429 - Rate Limit
  static rateLimitExceeded(
    context: Partial<ErrorContext>,
    retryAfter?: number
  ): NextResponse {
    const response = createErrorResponse(
      "Rate limit exceeded. Please try again later.",
      ErrorCode.RATE_LIMIT_EXCEEDED,
      429,
      context,
      retryAfter ? { retryAfter } : undefined,
      ErrorSeverity.LOW
    );

    if (retryAfter) {
      response.headers.set("Retry-After", retryAfter.toString());
    }

    return response;
  }

  // 500 - Internal Server Error
  static internalError(
    context: Partial<ErrorContext>,
    error?: Error | string
  ): NextResponse {
    const message =
      error instanceof Error
        ? error.message
        : error || "An unexpected error occurred";

    return createErrorResponse(
      message,
      ErrorCode.INTERNAL_ERROR,
      500,
      context,
      error instanceof Error ? { stack: error.stack } : undefined,
      ErrorSeverity.CRITICAL
    );
  }

  static databaseError(
    context: Partial<ErrorContext>,
    operation?: string
  ): NextResponse {
    const message = operation
      ? `Database error during ${operation}`
      : "Database error occurred";

    return createErrorResponse(
      message,
      ErrorCode.DATABASE_ERROR,
      500,
      context,
      { operation },
      ErrorSeverity.CRITICAL
    );
  }
}

// ============================================================================
// ENHANCED ERROR HANDLER WRAPPER
// ============================================================================

/**
 * Enhanced error handling wrapper with context tracking and performance monitoring
 */
export function withErrorHandling(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    routeContext?: any
  ): Promise<NextResponse> => {
    const startTime = Date.now();
    let errorContext: Partial<ErrorContext> = {};

    try {
      // Extract request context
      errorContext = await getRequestContext(request);

      // Execute handler
      const response = await handler(request, routeContext);

      // Log successful request (optional, for analytics)
      const duration = Date.now() - startTime;
      if (process.env.LOG_ALL_REQUESTS === "true") {
        console.log(
          JSON.stringify({
            type: "request",
            ...errorContext,
            status: response.status,
            duration,
          })
        );
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      errorContext.duration = duration;

      console.error("API Error:", error);

      // Handle known error types
      if (error instanceof Error) {
        // Check for specific error types
        if (error.message.includes("not found")) {
          return ApiErrors.notFound(errorContext);
        }

        if (
          error.message.includes("permission") ||
          error.message.includes("forbidden")
        ) {
          return ApiErrors.forbidden(errorContext, error.message);
        }

        if (error.message.includes("validation")) {
          return ApiErrors.invalidInput(errorContext, error.message);
        }

        // Database errors
        if (
          error.message.includes("database") ||
          error.message.includes("query")
        ) {
          return ApiErrors.databaseError(errorContext);
        }

        // Generic error with message
        return ApiErrors.internalError(errorContext, error);
      }

      // Unknown error
      return ApiErrors.internalError(errorContext);
    }
  };
}

// ============================================================================
// VALIDATION HELPER
// ============================================================================

/**
 * Create validation error from Zod errors
 */
export function createValidationError(
  context: Partial<ErrorContext>,
  zodError: any
): NextResponse {
  const errors: ValidationErrorDetail[] = zodError.errors.map((err: any) => ({
    field: err.path.join("."),
    message: err.message,
    value: err.received,
  }));

  return ApiErrors.validationError(context, errors);
}
