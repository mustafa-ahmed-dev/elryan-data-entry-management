/**
 * Security Settings Hooks
 * Hooks for managing security policies and settings
 */

import useSWR from "swr";
import { useState } from "react";
import type {
  SecuritySettings,
  PasswordPolicy,
  SessionSettings,
} from "@/lib/types/auth";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ============================================================================
// SECURITY SETTINGS
// ============================================================================

/**
 * Get all security settings
 */
export function useSecuritySettings() {
  const { data, error, mutate } = useSWR<{
    success: boolean;
    data: SecuritySettings;
    timestamp: string;
  }>("/api/security-settings", fetcher);

  return {
    settings: data?.data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Update security settings
 */
export function useUpdateSecuritySettings() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSettings = async (updates: Partial<SecuritySettings>) => {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch("/api/security-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update security settings");
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateSettings,
    isUpdating,
    error,
  };
}

// ============================================================================
// PASSWORD POLICY
// ============================================================================

/**
 * Get password policy
 */
export function usePasswordPolicy() {
  const { data, error, mutate } = useSWR<{
    success: boolean;
    data: PasswordPolicy;
    timestamp: string;
  }>("/api/security-settings/password-policy", fetcher);

  return {
    policy: data?.data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Update password policy
 */
export function useUpdatePasswordPolicy() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePolicy = async (updates: Partial<PasswordPolicy>) => {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch("/api/security-settings/password-policy", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update password policy");
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updatePolicy,
    isUpdating,
    error,
  };
}

// ============================================================================
// SESSION SETTINGS
// ============================================================================

/**
 * Get session settings
 */
export function useSessionSettings() {
  const { settings, isLoading, isError, refresh } = useSecuritySettings();

  return {
    sessionSettings: settings?.sessionSettings,
    isLoading,
    isError,
    refresh,
  };
}

/**
 * Update session settings
 */
export function useUpdateSessionSettings() {
  const { updateSettings, isUpdating, error } = useUpdateSecuritySettings();

  const updateSessionSettings = async (updates: Partial<SessionSettings>) => {
    return await updateSettings({
      sessionSettings: updates,
    });
  };

  return {
    updateSessionSettings,
    isUpdating,
    error,
  };
}

// ============================================================================
// LOGIN ATTEMPTS
// ============================================================================

/**
 * Get login attempts
 */
export function useLoginAttempts(filters?: {
  userId?: number;
  email?: string;
  ipAddress?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  // Build query string from filters
  const queryParams = new URLSearchParams();
  if (filters?.userId) queryParams.append("userId", filters.userId.toString());
  if (filters?.email) queryParams.append("email", filters.email);
  if (filters?.ipAddress) queryParams.append("ipAddress", filters.ipAddress);
  if (filters?.success !== undefined)
    queryParams.append("success", filters.success.toString());
  if (filters?.startDate)
    queryParams.append("startDate", filters.startDate.toISOString());
  if (filters?.endDate)
    queryParams.append("endDate", filters.endDate.toISOString());
  if (filters?.limit) queryParams.append("limit", filters.limit.toString());

  const queryString = queryParams.toString();
  const url = `/api/security-settings/login-attempts${
    queryString ? `?${queryString}` : ""
  }`;

  const { data, error, mutate } = useSWR(url, fetcher);

  return {
    attempts: data?.data || [],
    count: data?.count || 0,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate,
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate password against policy
 */
export function useValidatePassword() {
  const { policy } = usePasswordPolicy();
  const [isValidating, setIsValidating] = useState(false);

  const validatePassword = async (password: string) => {
    if (!policy) {
      return {
        valid: false,
        errors: ["Password policy not loaded"],
      };
    }

    setIsValidating(true);

    try {
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

      if (
        policy.requireSpecialChars &&
        !/[!@#$%^&*(),.?":{}|<>]/.test(password)
      ) {
        errors.push("Password must contain at least one special character");
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } finally {
      setIsValidating(false);
    }
  };

  return {
    validatePassword,
    isValidating,
    policy,
  };
}
