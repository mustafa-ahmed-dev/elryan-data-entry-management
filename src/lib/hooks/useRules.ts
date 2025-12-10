/**
 * useRules Hook
 *
 * Custom hook for managing evaluation rules with CRUD operations
 */

import { useState, useCallback } from "react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CreateRuleInput {
  ruleSetId: number;
  ruleName: string;
  ruleType:
    | "naming"
    | "specification"
    | "keyword"
    | "completeness"
    | "accuracy";
  deductionPoints: number;
  description?: string;
}

interface UpdateRuleInput {
  ruleName?: string;
  ruleType?:
    | "naming"
    | "specification"
    | "keyword"
    | "completeness"
    | "accuracy";
  deductionPoints?: number;
  description?: string;
}

export function useRules(ruleSetId?: number) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Build URL with optional filter
  const url = ruleSetId ? `/api/rules?ruleSetId=${ruleSetId}` : "/api/rules";

  // Fetch rules
  const { data, error, isLoading } = useSWR(url, fetcher);

  const rules = data?.data || [];

  // Create rule
  const createRule = useCallback(
    async (input: CreateRuleInput) => {
      setIsCreating(true);
      try {
        const res = await fetch("/api/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        const result = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: result.error || "Failed to create rule",
          };
        }

        // Refresh the rules list
        await mutate(url);
        // Also refresh the specific rule set if we have an ID
        if (ruleSetId) {
          await mutate(`/api/rule-sets/${ruleSetId}`);
        }

        return { success: true, data: result.data };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to create rule",
        };
      } finally {
        setIsCreating(false);
      }
    },
    [url, ruleSetId]
  );

  // Update rule
  const updateRule = useCallback(
    async (ruleId: number, input: UpdateRuleInput) => {
      setIsUpdating(true);
      try {
        const res = await fetch(`/api/rules/${ruleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        const result = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: result.error || "Failed to update rule",
          };
        }

        // Refresh the rules list
        await mutate(url);
        // Also refresh the specific rule set if we have an ID
        if (ruleSetId) {
          await mutate(`/api/rule-sets/${ruleSetId}`);
        }

        return { success: true, data: result.data };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to update rule",
        };
      } finally {
        setIsUpdating(false);
      }
    },
    [url, ruleSetId]
  );

  // Delete rule
  const deleteRule = useCallback(
    async (ruleId: number) => {
      setIsDeleting(true);
      try {
        const res = await fetch(`/api/rules/${ruleId}`, {
          method: "DELETE",
        });

        const result = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: result.error || "Failed to delete rule",
          };
        }

        // Refresh the rules list
        await mutate(url);
        // Also refresh the specific rule set if we have an ID
        if (ruleSetId) {
          await mutate(`/api/rule-sets/${ruleSetId}`);
        }

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to delete rule",
        };
      } finally {
        setIsDeleting(false);
      }
    },
    [url, ruleSetId]
  );

  // Refresh rules
  const refresh = useCallback(() => {
    mutate(url);
  }, [url]);

  return {
    rules,
    isLoading,
    error,
    createRule,
    updateRule,
    deleteRule,
    isCreating,
    isUpdating,
    isDeleting,
    refresh,
  };
}
