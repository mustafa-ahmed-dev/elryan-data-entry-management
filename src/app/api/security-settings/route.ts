/**
 * Security Settings API Route
 * GET /api/security-settings - Get security settings
 * PATCH /api/security-settings - Update security settings
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkPermission } from "@/db/utils/permissions";
import {
  getSecuritySettings,
  updateSecuritySettings,
} from "@/db/utils/security-settings";
import {
  ApiErrors,
  withErrorHandling,
  getRequestContext,
} from "@/lib/api/errors";
import { z } from "zod";

// Validation schemas
const passwordPolicySchema = z.object({
  minLength: z.number().int().min(6).max(128).optional(),
  requireUppercase: z.boolean().optional(),
  requireLowercase: z.boolean().optional(),
  requireNumbers: z.boolean().optional(),
  requireSpecialChars: z.boolean().optional(),
  expirationDays: z.number().int().min(0).max(365).optional(),
  preventReuse: z.number().int().min(0).max(24).optional(),
});

const sessionSettingsSchema = z.object({
  timeoutMinutes: z.number().int().min(5).max(1440).optional(),
  maxConcurrentSessions: z.number().int().min(1).max(10).optional(),
  requireReauthForSensitive: z.boolean().optional(),
});

const securitySettingsSchema = z.object({
  passwordPolicy: passwordPolicySchema.optional(),
  sessionSettings: sessionSettingsSchema.optional(),
  twoFactorEnabled: z.boolean().optional(),
  maxLoginAttempts: z.number().int().min(1).max(20).optional(),
  lockoutDurationMinutes: z.number().int().min(1).max(1440).optional(),
});

// GET /api/security-settings
export const GET = withErrorHandling(async (request: NextRequest) => {
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  context.userId = session.user.id;
  context.userEmail = session.user.email;

  // Only admins can view security settings
  const canView = await checkPermission(session.user.id, "settings", "read");

  if (!canView) {
    return ApiErrors.insufficientPermissions(context, "settings:read");
  }

  try {
    const settings = await getSecuritySettings();

    return NextResponse.json(
      {
        success: true,
        data: settings,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching security settings:", error);
    return ApiErrors.internalError(
      context,
      "Failed to fetch security settings"
    );
  }
});

// PATCH /api/security-settings
export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const context = await getRequestContext(request);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return ApiErrors.unauthorized(context);
  }

  context.userId = session.user.id;
  context.userEmail = session.user.email;

  // Only admins can update security settings
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
    const validation = securitySettingsSchema.safeParse(body);
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

    // Update settings
    const updatedSettings = await updateSecuritySettings(updates);

    return NextResponse.json(
      {
        success: true,
        data: updatedSettings,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "X-Request-ID": context.requestId || "",
        },
      }
    );
  } catch (error) {
    console.error("Error updating security settings:", error);
    return ApiErrors.internalError(
      context,
      "Failed to update security settings"
    );
  }
});
