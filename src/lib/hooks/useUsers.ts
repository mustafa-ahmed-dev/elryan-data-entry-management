/**
 * useUsers Hook
 *
 * Custom hook for managing users with CRUD operations
 */

import { useState, useCallback } from "react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UseUsersOptions {
  search?: string;
  roleId?: number;
  teamId?: number;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

interface CreateUserInput {
  fullName: string;
  email: string;
  password: string;
  roleId: number;
  teamId?: number;
  isActive?: boolean;
}

interface UpdateUserInput {
  fullName?: string;
  email?: string;
  password?: string;
  roleId?: number;
  teamId?: number;
  isActive?: boolean;
}

export function useUsers(options: UseUsersOptions = {}) {
  const {
    search = "",
    roleId,
    teamId,
    isActive,
    page = 1,
    pageSize = 20,
  } = options;

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Build query string
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (roleId !== undefined) params.append("roleId", roleId.toString());
  if (teamId !== undefined) params.append("teamId", teamId.toString());
  if (isActive !== undefined) params.append("isActive", isActive.toString());
  params.append("page", page.toString());
  params.append("pageSize", pageSize.toString());

  const queryString = params.toString();
  const url = `/api/users${queryString ? `?${queryString}` : ""}`;

  // Fetch users
  const { data, error, isLoading } = useSWR(url, fetcher);

  const users = data?.data || [];
  const pagination = data?.pagination;

  // Create user
  const createUser = useCallback(
    async (input: CreateUserInput) => {
      setIsCreating(true);
      try {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        const result = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: result.error || "Failed to create user",
          };
        }

        // Refresh the users list
        await mutate(url);

        return { success: true, data: result.data };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to create user",
        };
      } finally {
        setIsCreating(false);
      }
    },
    [url]
  );

  // Update user
  const updateUser = useCallback(
    async (userId: number, input: UpdateUserInput) => {
      setIsUpdating(true);
      try {
        const res = await fetch(`/api/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        const result = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: result.error || "Failed to update user",
          };
        }

        // Refresh the users list
        await mutate(url);

        return { success: true, data: result.data };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to update user",
        };
      } finally {
        setIsUpdating(false);
      }
    },
    [url]
  );

  // Delete user
  const deleteUser = useCallback(
    async (userId: number) => {
      setIsDeleting(true);
      try {
        const res = await fetch(`/api/users/${userId}`, {
          method: "DELETE",
        });

        const result = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: result.error || "Failed to delete user",
          };
        }

        // Refresh the users list
        await mutate(url);

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to delete user",
        };
      } finally {
        setIsDeleting(false);
      }
    },
    [url]
  );

  // Refresh users
  const refresh = useCallback(() => {
    mutate(url);
  }, [url]);

  return {
    users,
    pagination,
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
    isCreating,
    isUpdating,
    isDeleting,
    refresh,
  };
}
