/**
 * useTeams Hook
 *
 * Custom hook for managing teams with CRUD operations
 */

import { useState, useCallback } from "react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UseTeamsOptions {
  search?: string;
  page?: number;
  pageSize?: number;
  includeStats?: boolean;
}

interface CreateTeamInput {
  name: string;
  description?: string;
}

interface UpdateTeamInput {
  name?: string;
  description?: string;
}

export function useTeams(options: UseTeamsOptions = {}) {
  const {
    search = "",
    page = 1,
    pageSize = 10,
    includeStats = false,
  } = options;

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Build query string
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("page", page.toString());
  params.append("pageSize", pageSize.toString());
  if (includeStats) params.append("stats", "true");

  const queryString = params.toString();
  const url = `/api/teams${queryString ? `?${queryString}` : ""}`;

  // Fetch teams
  const { data, error, isLoading } = useSWR(url, fetcher);

  const teams = includeStats ? data?.data || [] : data?.data || [];
  const pagination = data?.pagination;

  // Create team
  const createTeam = useCallback(
    async (input: CreateTeamInput) => {
      setIsCreating(true);
      try {
        const res = await fetch("/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        const result = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: result.error || "Failed to create team",
          };
        }

        // Refresh the teams list
        await mutate(url);

        return { success: true, data: result.data };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to create team",
        };
      } finally {
        setIsCreating(false);
      }
    },
    [url]
  );

  // Update team
  const updateTeam = useCallback(
    async (teamId: number, input: UpdateTeamInput) => {
      setIsUpdating(true);
      try {
        const res = await fetch(`/api/teams/${teamId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        const result = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: result.error || "Failed to update team",
          };
        }

        // Refresh the teams list
        await mutate(url);

        return { success: true, data: result.data };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to update team",
        };
      } finally {
        setIsUpdating(false);
      }
    },
    [url]
  );

  // Delete team
  const deleteTeam = useCallback(
    async (teamId: number) => {
      setIsDeleting(true);
      try {
        const res = await fetch(`/api/teams/${teamId}`, {
          method: "DELETE",
        });

        const result = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: result.error || "Failed to delete team",
          };
        }

        // Refresh the teams list
        await mutate(url);

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to delete team",
        };
      } finally {
        setIsDeleting(false);
      }
    },
    [url]
  );

  // Refresh teams
  const refresh = useCallback(() => {
    mutate(url);
  }, [url]);

  return {
    teams,
    pagination,
    isLoading,
    error,
    createTeam,
    updateTeam,
    deleteTeam,
    isCreating,
    isUpdating,
    isDeleting,
    refresh,
  };
}

/**
 * Hook for managing team members
 */
export function useTeamMembers(teamId: number) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const url = `/api/teams/${teamId}/members`;

  // Fetch team members
  const { data, error, isLoading } = useSWR(url, fetcher);

  const members = data?.data || [];

  // Assign users to team
  const assignUsers = useCallback(
    async (userIds: number[]) => {
      setIsAssigning(true);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds }),
        });

        const result = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: result.error || "Failed to assign users",
          };
        }

        // Refresh members list
        await mutate(url);

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to assign users",
        };
      } finally {
        setIsAssigning(false);
      }
    },
    [url]
  );

  // Remove user from team
  const removeUser = useCallback(
    async (userId: number) => {
      setIsRemoving(true);
      try {
        const res = await fetch(`/api/teams/${teamId}/members/${userId}`, {
          method: "DELETE",
        });

        const result = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: result.error || "Failed to remove user",
          };
        }

        // Refresh members list
        await mutate(url);

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to remove user",
        };
      } finally {
        setIsRemoving(false);
      }
    },
    [url, teamId]
  );

  // Refresh members
  const refresh = useCallback(() => {
    mutate(url);
  }, [url]);

  return {
    members,
    isLoading,
    error,
    assignUsers,
    removeUser,
    isAssigning,
    isRemoving,
    refresh,
  };
}
