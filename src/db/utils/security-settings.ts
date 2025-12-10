/**
 * Security Settings Database Utilities
 * Functions for managing security policies and settings
 */

import { db } from "../index";
import { sql } from "drizzle-orm";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SecuritySettings {
  passwordPolicy: PasswordPolicy;
  sessionSettings: SessionSettings;
  twoFactorEnabled: boolean;
  ipWhitelist: string[];
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expirationDays: number;
  preventReuse: number;
}

export interface SessionSettings {
  timeoutMinutes: number;
  maxConcurrentSessions: number;
  requireReauthForSensitive: boolean;
}

export interface LoginAttempt {
  id: number;
  userId?: number;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  timestamp: Date;
}

// ============================================================================
// SECURITY SETTINGS MANAGEMENT
// ============================================================================

/**
 * Get current security settings
 * Note: Settings are stored in a JSON config or database table
 * For now, we'll use default values and plan for a settings table
 */
export async function getSecuritySettings(): Promise<SecuritySettings> {
  // TODO: Implement actual database storage for settings
  // For now, return default values
  return {
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      expirationDays: 90,
      preventReuse: 5,
    },
    sessionSettings: {
      timeoutMinutes: 30,
      maxConcurrentSessions: 3,
      requireReauthForSensitive: true,
    },
    twoFactorEnabled: false,
    ipWhitelist: [],
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
  };
}

/**
 * Update security settings
 */
export async function updateSecuritySettings(
  settings: Partial<SecuritySettings>
): Promise<SecuritySettings> {
  // TODO: Implement actual database storage
  // For now, return merged settings
  const current = await getSecuritySettings();
  return {
    ...current,
    ...settings,
  };
}

/**
 * Get password policy
 */
export async function getPasswordPolicy(): Promise<PasswordPolicy> {
  const settings = await getSecuritySettings();
  return settings.passwordPolicy;
}

/**
 * Update password policy
 */
export async function updatePasswordPolicy(
  policy: Partial<PasswordPolicy>
): Promise<PasswordPolicy> {
  const settings = await getSecuritySettings();
  const updatedPolicy = {
    ...settings.passwordPolicy,
    ...policy,
  };

  await updateSecuritySettings({
    passwordPolicy: updatedPolicy,
  });

  return updatedPolicy;
}

/**
 * Get session settings
 */
export async function getSessionSettings(): Promise<SessionSettings> {
  const settings = await getSecuritySettings();
  return settings.sessionSettings;
}

/**
 * Update session settings
 */
export async function updateSessionSettings(
  sessionSettings: Partial<SessionSettings>
): Promise<SessionSettings> {
  const settings = await getSecuritySettings();
  const updatedSettings = {
    ...settings.sessionSettings,
    ...sessionSettings,
  };

  await updateSecuritySettings({
    sessionSettings: updatedSettings,
  });

  return updatedSettings;
}

// ============================================================================
// LOGIN ATTEMPTS TRACKING
// ============================================================================

/**
 * Record a login attempt
 * Note: This requires a login_attempts table
 */
export async function recordLoginAttempt(data: {
  userId?: number;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
}): Promise<void> {
  // TODO: Implement after adding login_attempts table to schema
  // For now, just log to console
  console.log("Login attempt:", data);
}

/**
 * Get login attempts for a user or email
 */
export async function getLoginAttempts(filters?: {
  userId?: number;
  email?: string;
  ipAddress?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<LoginAttempt[]> {
  // TODO: Implement after adding login_attempts table
  // For now, return empty array
  return [];
}

/**
 * Get failed login attempts count for an email/IP
 */
export async function getFailedLoginCount(
  email: string,
  ipAddress: string,
  withinMinutes: number = 15
): Promise<number> {
  // TODO: Implement after adding login_attempts table
  // For now, return 0
  return 0;
}

/**
 * Clear failed login attempts for a user
 */
export async function clearFailedLoginAttempts(
  email: string,
  ipAddress: string
): Promise<void> {
  // TODO: Implement after adding login_attempts table
  console.log("Clearing failed attempts for:", email, ipAddress);
}

/**
 * Check if an account is locked due to failed attempts
 */
export async function isAccountLocked(
  email: string,
  ipAddress: string
): Promise<boolean> {
  const settings = await getSecuritySettings();
  const failedCount = await getFailedLoginCount(
    email,
    ipAddress,
    settings.lockoutDurationMinutes
  );

  return failedCount >= settings.maxLoginAttempts;
}

// ============================================================================
// IP WHITELIST MANAGEMENT
// ============================================================================

/**
 * Check if an IP is whitelisted
 */
export async function isIpWhitelisted(ipAddress: string): Promise<boolean> {
  const settings = await getSecuritySettings();

  if (settings.ipWhitelist.length === 0) {
    return true; // No whitelist = all IPs allowed
  }

  return settings.ipWhitelist.includes(ipAddress);
}

/**
 * Add IP to whitelist
 */
export async function addIpToWhitelist(ipAddress: string): Promise<string[]> {
  const settings = await getSecuritySettings();

  if (!settings.ipWhitelist.includes(ipAddress)) {
    settings.ipWhitelist.push(ipAddress);
    await updateSecuritySettings({
      ipWhitelist: settings.ipWhitelist,
    });
  }

  return settings.ipWhitelist;
}

/**
 * Remove IP from whitelist
 */
export async function removeIpFromWhitelist(
  ipAddress: string
): Promise<string[]> {
  const settings = await getSecuritySettings();

  const updatedWhitelist = settings.ipWhitelist.filter(
    (ip) => ip !== ipAddress
  );

  await updateSecuritySettings({
    ipWhitelist: updatedWhitelist,
  });

  return updatedWhitelist;
}

// ============================================================================
// PASSWORD VALIDATION
// ============================================================================

/**
 * Validate a password against the current policy
 */
export async function validatePassword(
  password: string
): Promise<{ valid: boolean; errors: string[] }> {
  const policy = await getPasswordPolicy();
  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if password has been used recently
 */
export async function isPasswordReused(
  userId: number,
  newPasswordHash: string
): Promise<boolean> {
  // TODO: Implement password history table
  // For now, return false
  return false;
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get security statistics
 */
export async function getSecurityStatistics(filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  // TODO: Implement after adding login_attempts and audit_logs tables
  return {
    totalLoginAttempts: 0,
    successfulLogins: 0,
    failedLogins: 0,
    lockedAccounts: 0,
    activeIpWhitelist: 0,
  };
}
