/**
 * useEntryTypes Hook
 *
 * Custom hook for managing entry types with CRUD operations
 */

import { useState, useCallback } from "react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CreateEntryTypeInput {
  name: string;
  description?: string;
}

interface UpdateEntryTypeInput {
  name?: string;
  description?: string;
}

export function useEntryTypes() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const url = "/api/entry-types";

  // Fetch entry types
  const { data, error, isLoading } = useSWR(url, fetcher);

  const entryTypes = data?.data || [];

  // Create entry type
  const createEntryType = useCallback(
    async (input: CreateEntryTypeInput) => {
      setIsCreating(true);
      try {
        const res = await fetch("/api/entry-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        const result = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: result.error || "Failed to create entry type",
          };
        }

        // Refresh the entry types list
        await mutate(url);

        return { success: true, data: result.data };
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error ? err.message : "Failed to create entry type",
        };
      } finally {
        setIsCreating(false);
      }
    },
    [url]
  );

  // Update entry type
  const updateEntryType = useCallback(
    async (entryTypeId: number, input: UpdateEntryTypeInput) => {
      setIsUpdating(true);
      try {
        const res = await fetch(`/api/entry-types/${entryTypeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        const result = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: result.error || "Failed to update entry type",
          };
        }

        // Refresh the entry types list
        await mutate(url);

        return { success: true, data: result.data };
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error ? err.message : "Failed to update entry type",
        };
      } finally {
        setIsUpdating(false);
      }
    },
    [url]
  );

  // Delete entry type
  const deleteEntryType = useCallback(
    async (entryTypeId: number) => {
      setIsDeleting(true);
      try {
        const res = await fetch(`/api/entry-types/${entryTypeId}`, {
          method: "DELETE",
        });

        const result = await res.json();

        if (!res.ok) {
          return {
            success: false,
            error: result.error || "Failed to delete entry type",
          };
        }

        // Refresh the entry types list
        await mutate(url);

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error ? err.message : "Failed to delete entry type",
        };
      } finally {
        setIsDeleting(false);
      }
    },
    [url]
  );

  // Refresh entry types
  const refresh = useCallback(() => {
    mutate(url);
  }, [url]);

  return {
    entryTypes,
    isLoading,
    error,
    createEntryType,
    updateEntryType,
    deleteEntryType,
    isCreating,
    isUpdating,
    isDeleting,
    refresh,
  };
}
