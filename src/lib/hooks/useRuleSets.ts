/**
 * useRuleSets Hook
 *
 * Custom hook for managing evaluation rule sets with CRUD operations
 */

import { useState, useCallback } from "react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CreateRuleSetInput {
  name: string;
  description?: string;
  version: number;
}

interface UpdateRuleSetInput {
  name?: string;
  description?: string;
  version?: number;
}

export function useRuleSets() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const url = "/api/rule-sets";

  // Fetch rule sets
  const { data, error, isLoading } = useSWR(url, fetcher);

  const ruleSets = data?.data || [];

  // Create rule set
  const createRuleSet = useCallback(
    async (input: CreateRuleSetInput) => {
      setIsCreating(true);
      try {
        const res = await fetch("/api/rule-sets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        const result = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: result.error || "Failed to create rule set",
          };
        }

        // Refresh the rule sets list
        await mutate(url);

        return { success: true, data: result.data };
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error ? err.message : "Failed to create rule set",
        };
      } finally {
        setIsCreating(false);
      }
    },
    [url]
  );

  // Update rule set
  const updateRuleSet = useCallback(
    async (ruleSetId: number, input: UpdateRuleSetInput) => {
      setIsUpdating(true);
      try {
        const res = await fetch(`/api/rule-sets/${ruleSetId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        const result = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: result.error || "Failed to update rule set",
          };
        }

        // Refresh the rule sets list
        await mutate(url);

        return { success: true, data: result.data };
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error ? err.message : "Failed to update rule set",
        };
      } finally {
        setIsUpdating(false);
      }
    },
    [url]
  );

  // Delete rule set
  const deleteRuleSet = useCallback(
    async (ruleSetId: number) => {
      setIsDeleting(true);
      try {
        const res = await fetch(`/api/rule-sets/${ruleSetId}`, {
          method: "DELETE",
        });

        const result = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: result.error || "Failed to delete rule set",
          };
        }

        // Refresh the rule sets list
        await mutate(url);

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error ? err.message : "Failed to delete rule set",
        };
      } finally {
        setIsDeleting(false);
      }
    },
    [url]
  );

  // Activate rule set
  const activateRuleSet = useCallback(
    async (ruleSetId: number) => {
      setIsActivating(true);
      try {
        const res = await fetch(`/api/rule-sets/${ruleSetId}/activate`, {
          method: "POST",
        });

        const result = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: result.error || "Failed to activate rule set",
          };
        }

        // Refresh the rule sets list
        await mutate(url);

        return { success: true, message: result.message };
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error ? err.message : "Failed to activate rule set",
        };
      } finally {
        setIsActivating(false);
      }
    },
    [url]
  );

  // Refresh rule sets
  const refresh = useCallback(() => {
    mutate(url);
  }, [url]);

  return {
    ruleSets,
    isLoading,
    error,
    createRuleSet,
    updateRuleSet,
    deleteRuleSet,
    activateRuleSet,
    isCreating,
    isUpdating,
    isDeleting,
    isActivating,
    refresh,
  };
}

/**
 * Hook for getting a single rule set with its rules
 */
export function useRuleSet(ruleSetId: number | null) {
  const url = ruleSetId ? `/api/rule-sets/${ruleSetId}` : null;

  const { data, error, isLoading } = useSWR(url, fetcher);

  const ruleSet = data?.data;

  const refresh = useCallback(() => {
    if (url) mutate(url);
  }, [url]);

  return {
    ruleSet,
    isLoading,
    error,
    refresh,
  };
}

/**
 * Hook for getting the active rule set
 */
export function useActiveRuleSet() {
  const url = "/api/rule-sets/active";

  const { data, error, isLoading } = useSWR(url, fetcher);

  const activeRuleSet = data?.data;

  const refresh = useCallback(() => {
    mutate(url);
  }, [url]);

  return {
    activeRuleSet,
    isLoading,
    error,
    refresh,
  };
}
