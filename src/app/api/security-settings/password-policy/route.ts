/**
 * Password Policy API Route
 * GET /api/security-settings/password-policy - Get password policy
 * PATCH /api/security-settings/password-policy - Update password policy
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import {
  getPasswordPolicy,
  updatePasswordPolicy,
} from "@/db/utils/security-settings";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";
import { z } from "zod";

const passwordPolicySchema = z.object({
  minLength: z.number().int().min(6).max(128).optional(),
  requireUppercase: z.boolean().optional(),
  requireLowercase: z.boolean().optional(),
  requireNumbers: z.boolean().optional(),
  requireSpecialChars: z.boolean().optional(),
  expirationDays: z.number().int().min(0).max(365).optional(),
  preventReuse: z.number().int().min(0).max(24).optional(),
});

// GET /api/security-settings/password-policy
export const GET = withErrorHandling(async (request: NextRequest) => {
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  context.userId = session.user.id;
  context.userEmail = session.user.email;

  // Anyone can view password policy (for registration/password change)
  try {
    const policy = await getPasswordPolicy();

    return NextResponse.json(
      {
        success: true,
        data: policy,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  } catch (error) {
    return ApiErrors.internalError(context, "Failed to fetch password policy");
  }
});

// PATCH /api/security-settings/password-policy
export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  context.userId = session.user.id;
  context.userEmail = session.user.email;

  // Only admins can update password policy
  const canUpdate = await checkPermission(
    session.user.id,
    "settings",
    "update"
  );

  if (!canUpdate) {
    return ApiErrors.insufficientPermissions(context, "settings:update");
  }

  try {
    const body = await request.json();

    // Validate
    const validation = passwordPolicySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.format((error) => error.message),
        },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // Update policy
    const updatedPolicy = await updatePasswordPolicy(updates);

    return NextResponse.json(
      {
        success: true,
        data: updatedPolicy,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  } catch (error) {
    return ApiErrors.internalError(context, "Failed to update password policy");
  }
});
