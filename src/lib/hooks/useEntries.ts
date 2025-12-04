/**
 * useEntries Hook
 *
 * Manages entries data fetching and mutations
 */

"use client";

import useSWR from "swr";
import { useState } from "react";

interface EntryFilters {
  employeeId?: number;
  teamId?: number;
  entryTypeId?: number;
  startDate?: string;
  endDate?: string;
  date?: string;
  page?: number;
  pageSize?: number;
  includeStats?: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useEntries(filters?: EntryFilters) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Build query string
  const params = new URLSearchParams();
  if (filters?.employeeId)
    params.append("employeeId", filters.employeeId.toString());
  if (filters?.teamId) params.append("teamId", filters.teamId.toString());
  if (filters?.entryTypeId)
    params.append("entryTypeId", filters.entryTypeId.toString());
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  if (filters?.date) params.append("date", filters.date);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.pageSize) params.append("pageSize", filters.pageSize.toString());
  if (filters?.includeStats) params.append("stats", "true");

  const queryString = params.toString();
  const url = `/api/entries${queryString ? `?${queryString}` : ""}`;

  // Fetch entries with SWR
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  // Create entry
  const createEntry = async (entryData: any) => {
    try {
      setIsCreating(true);
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create entry");
      }

      await mutate();

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create entry",
      };
    } finally {
      setIsCreating(false);
    }
  };

  // Bulk create entries
  const bulkCreateEntries = async (entries: any[]) => {
    try {
      setIsCreating(true);
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entries),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create entries");
      }

      await mutate();

      return { success: true, data: result.data, message: result.message };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create entries",
      };
    } finally {
      setIsCreating(false);
    }
  };

  // Update entry
  const updateEntry = async (id: number, entryData: any) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update entry");
      }

      await mutate();

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update entry",
      };
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete entry
  const deleteEntry = async (id: number) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/entries/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete entry");
      }

      await mutate();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete entry",
      };
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    entries: data?.data || [],
    pagination: data?.pagination,
    stats: data?.stats,
    isLoading,
    error,
    createEntry,
    bulkCreateEntries,
    updateEntry,
    deleteEntry,
    isCreating,
    isUpdating,
    isDeleting,
    refresh: mutate,
  };
}
