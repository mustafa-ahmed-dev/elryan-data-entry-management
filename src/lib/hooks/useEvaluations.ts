/**
 * useEvaluations Hook
 *
 * Custom hook for managing evaluations with CRUD operations
 */

import { useState, useCallback } from "react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Violation {
  ruleId: number;
  ruleName: string;
  deduction: number;
}

interface UseEvaluationsOptions {
  entryId?: number;
  employeeId?: number;
  evaluatorId?: number;
  teamId?: number;
  ruleSetId?: number;
  minScore?: number;
  maxScore?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "evaluatedAt" | "totalScore";
  sortOrder?: "asc" | "desc";
}

interface CreateEvaluationInput {
  entryId: number;
  ruleSetId: number;
  totalScore: number;
  violations: Violation[];
  comments?: string;
}

interface UpdateEvaluationInput {
  totalScore?: number;
  violations?: Violation[];
  comments?: string;
}

interface BulkEvaluationInput {
  entryId: number;
  ruleSetId: number;
  totalScore: number;
  violations: Violation[];
  comments?: string;
}

export function useEvaluations(options: UseEvaluationsOptions = {}) {
  const {
    entryId,
    employeeId,
    evaluatorId,
    teamId,
    ruleSetId,
    minScore,
    maxScore,
    startDate,
    endDate,
    page = 1,
    pageSize = 20,
    sortBy = "evaluatedAt",
    sortOrder = "desc",
  } = options;

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Build query string
  const params = new URLSearchParams();
  if (entryId !== undefined) params.append("entryId", entryId.toString());
  if (employeeId !== undefined)
    params.append("employeeId", employeeId.toString());
  if (evaluatorId !== undefined)
    params.append("evaluatorId", evaluatorId.toString());
  if (teamId !== undefined) params.append("teamId", teamId.toString());
  if (ruleSetId !== undefined) params.append("ruleSetId", ruleSetId.toString());
  if (minScore !== undefined) params.append("minScore", minScore.toString());
  if (maxScore !== undefined) params.append("maxScore", maxScore.toString());
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  params.append("page", page.toString());
  params.append("pageSize", pageSize.toString());
  params.append("sortBy", sortBy);
  params.append("sortOrder", sortOrder);

  const queryString = params.toString();
  const url = `/api/evaluations${queryString ? `?${queryString}` : ""}`;

  // Fetch evaluations
  const { data, error, isLoading } = useSWR(url, fetcher);

  const evaluations = data?.data || [];
  const pagination = data?.pagination;

  // Create evaluation
  const createEvaluation = useCallback(
    async (input: CreateEvaluationInput) => {
      setIsCreating(true);
      try {
        const res = await fetch("/api/evaluations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        const result = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: result.error || "Failed to create evaluation",
          };
        }

        // Refresh the evaluations list
        await mutate(url);

        return { success: true, data: result.data };
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error ? err.message : "Failed to create evaluation",
        };
      } finally {
        setIsCreating(false);
      }
    },
    [url]
  );

  // Create bulk evaluations
  const createBulkEvaluations = useCallback(
    async (evaluations: BulkEvaluationInput[]) => {
      setIsCreating(true);
      try {
        const res = await fetch("/api/evaluations/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ evaluations }),
        });

        const result = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: result.error || "Failed to create evaluations",
          };
        }

        // Refresh the evaluations list
        await mutate(url);

        return { success: true, data: result.data, message: result.message };
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error ? err.message : "Failed to create evaluations",
        };
      } finally {
        setIsCreating(false);
      }
    },
    [url]
  );

  // Update evaluation
  const updateEvaluation = useCallback(
    async (evaluationId: number, input: UpdateEvaluationInput) => {
      setIsUpdating(true);
      try {
        const res = await fetch(`/api/evaluations/${evaluationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        const result = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: result.error || "Failed to update evaluation",
          };
        }

        // Refresh the evaluations list
        await mutate(url);

        return { success: true, data: result.data };
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error ? err.message : "Failed to update evaluation",
        };
      } finally {
        setIsUpdating(false);
      }
    },
    [url]
  );

  // Delete evaluation
  const deleteEvaluation = useCallback(
    async (evaluationId: number) => {
      setIsDeleting(true);
      try {
        const res = await fetch(`/api/evaluations/${evaluationId}`, {
          method: "DELETE",
        });

        const result = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: result.error || "Failed to delete evaluation",
          };
        }

        // Refresh the evaluations list
        await mutate(url);

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error ? err.message : "Failed to delete evaluation",
        };
      } finally {
        setIsDeleting(false);
      }
    },
    [url]
  );

  // Refresh evaluations
  const refresh = useCallback(() => {
    mutate(url);
  }, [url]);

  return {
    evaluations,
    pagination,
    isLoading,
    error,
    createEvaluation,
    createBulkEvaluations,
    updateEvaluation,
    deleteEvaluation,
    isCreating,
    isUpdating,
    isDeleting,
    refresh,
  };
}

/**
 * Hook for getting employee evaluations
 */
export function useEmployeeEvaluations(
  employeeId: number,
  options: {
    startDate?: string;
    endDate?: string;
    minScore?: number;
    maxScore?: number;
    page?: number;
    pageSize?: number;
  } = {}
) {
  const {
    startDate,
    endDate,
    minScore,
    maxScore,
    page = 1,
    pageSize = 20,
  } = options;

  // Build query string
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (minScore !== undefined) params.append("minScore", minScore.toString());
  if (maxScore !== undefined) params.append("maxScore", maxScore.toString());
  params.append("page", page.toString());
  params.append("pageSize", pageSize.toString());

  const queryString = params.toString();
  const url = `/api/evaluations/employee/${employeeId}${
    queryString ? `?${queryString}` : ""
  }`;

  // Fetch evaluations
  const { data, error, isLoading } = useSWR(url, fetcher);

  const evaluations = data?.data || [];
  const pagination = data?.pagination;

  // Refresh evaluations
  const refresh = useCallback(() => {
    mutate(url);
  }, [url]);

  return {
    evaluations,
    pagination,
    isLoading,
    error,
    refresh,
  };
}
