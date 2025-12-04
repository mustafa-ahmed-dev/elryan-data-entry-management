/**
 * useUsers Hook
 *
 * Manages user data fetching and mutations
 */

"use client";

import useSWR from "swr";
import { useState } from "react";

interface UserFilters {
  search?: string;
  roleId?: number;
  teamId?: number;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUsers(filters?: UserFilters) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Build query string
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.roleId) params.append("roleId", filters.roleId.toString());
  if (filters?.teamId) params.append("teamId", filters.teamId.toString());
  if (filters?.isActive !== undefined)
    params.append("isActive", filters.isActive.toString());
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.pageSize) params.append("pageSize", filters.pageSize.toString());
  params.append("stats", "true");

  const queryString = params.toString();
  const url = `/api/users${queryString ? `?${queryString}` : ""}`;

  // Fetch users with SWR
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  // Create user
  const createUser = async (userData: any) => {
    try {
      setIsCreating(true);
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create user");
      }

      // Revalidate the list
      await mutate();

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create user",
      };
    } finally {
      setIsCreating(false);
    }
  };

  // Update user
  const updateUser = async (id: number, userData: any) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update user");
      }

      // Revalidate the list
      await mutate();

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update user",
      };
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete user
  const deleteUser = async (id: number, permanent = false) => {
    try {
      setIsDeleting(true);
      const response = await fetch(
        `/api/users/${id}${permanent ? "?permanent=true" : ""}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete user");
      }

      // Revalidate the list
      await mutate();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete user",
      };
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    users: data?.data || [],
    pagination: data?.pagination,
    stats: data?.stats,
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
    isCreating,
    isUpdating,
    isDeleting,
    refresh: mutate,
  };
}

// Hook for single user
export function useUser(id: number) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/users/${id}` : null,
    fetcher
  );

  return {
    user: data?.data,
    isLoading,
    error,
    refresh: mutate,
  };
}
