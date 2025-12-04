/**
 * useTeams Hook
 *
 * Manages teams data fetching and mutations
 */

"use client";

import useSWR from "swr";
import { useState } from "react";

interface TeamFilters {
  search?: string;
  page?: number;
  pageSize?: number;
  includeStats?: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useTeams(filters?: TeamFilters) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Build query string
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.pageSize) params.append("pageSize", filters.pageSize.toString());
  if (filters?.includeStats) params.append("stats", "true");

  const queryString = params.toString();
  const url = `/api/teams${queryString ? `?${queryString}` : ""}`;

  // Fetch teams with SWR
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  // Create team
  const createTeam = async (teamData: {
    name: string;
    description?: string;
  }) => {
    try {
      setIsCreating(true);
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create team");
      }

      // Revalidate the list
      await mutate();

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create team",
      };
    } finally {
      setIsCreating(false);
    }
  };

  // Update team
  const updateTeam = async (id: number, teamData: any) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/teams/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update team");
      }

      await mutate();

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update team",
      };
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete team
  const deleteTeam = async (id: number) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/teams/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete team");
      }

      await mutate();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete team",
      };
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    teams: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error,
    createTeam,
    updateTeam,
    deleteTeam,
    isCreating,
    isUpdating,
    isDeleting,
    refresh: mutate,
  };
}
