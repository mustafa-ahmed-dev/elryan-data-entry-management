/**
 * useEvaluations Hook
 *
 * Manages evaluations data fetching and mutations
 */

"use client";

import useSWR from "swr";
import { useState } from "react";

interface EvaluationFilters {
  employeeId?: number;
  teamId?: number;
  minScore?: number;
  maxScore?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  includeStats?: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useEvaluations(filters?: EvaluationFilters) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Build query string
  const params = new URLSearchParams();
  if (filters?.employeeId)
    params.append("employeeId", filters.employeeId.toString());
  if (filters?.teamId) params.append("teamId", filters.teamId.toString());
  if (filters?.minScore) params.append("minScore", filters.minScore.toString());
  if (filters?.maxScore) params.append("maxScore", filters.maxScore.toString());
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.pageSize) params.append("pageSize", filters.pageSize.toString());
  if (filters?.includeStats) params.append("stats", "true");

  const queryString = params.toString();
  const url = `/api/evaluations${queryString ? `?${queryString}` : ""}`;

  // Fetch evaluations with SWR
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  // Create evaluation
  const createEvaluation = async (evaluationData: any) => {
    try {
      setIsCreating(true);
      const response = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evaluationData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create evaluation");
      }

      await mutate();

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create evaluation",
      };
    } finally {
      setIsCreating(false);
    }
  };

  // Bulk create evaluations
  const bulkCreateEvaluations = async (evaluations: any[]) => {
    try {
      setIsCreating(true);
      const response = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evaluations),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create evaluations");
      }

      await mutate();

      return {
        success: true,
        data: result.data,
        skipped: result.skipped,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create evaluations",
      };
    } finally {
      setIsCreating(false);
    }
  };

  return {
    evaluations: data?.data || [],
    pagination: data?.pagination,
    stats: data?.stats,
    isLoading,
    error,
    createEvaluation,
    bulkCreateEvaluations,
    isCreating,
    isUpdating,
    isDeleting,
    refresh: mutate,
  };
}
