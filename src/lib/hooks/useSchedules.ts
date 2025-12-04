/**
 * useSchedules Hook
 *
 * Manages schedules data fetching and mutations
 */

"use client";

import useSWR from "swr";
import { useState } from "react";

interface ScheduleFilters {
  userId?: number;
  teamId?: number;
  status?: "pending_approval" | "approved" | "rejected";
  weekStartDate?: string;
  page?: number;
  pageSize?: number;
  pending?: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useSchedules(filters?: ScheduleFilters) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Build query string
  const params = new URLSearchParams();
  if (filters?.userId) params.append("userId", filters.userId.toString());
  if (filters?.teamId) params.append("teamId", filters.teamId.toString());
  if (filters?.status) params.append("status", filters.status);
  if (filters?.weekStartDate)
    params.append("weekStartDate", filters.weekStartDate);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.pageSize) params.append("pageSize", filters.pageSize.toString());
  if (filters?.pending) params.append("pending", "true");

  const queryString = params.toString();
  const url = `/api/schedules${queryString ? `?${queryString}` : ""}`;

  // Fetch schedules with SWR
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  // Create schedule
  const createSchedule = async (scheduleData: any) => {
    try {
      setIsCreating(true);
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create schedule");
      }

      await mutate();

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create schedule",
      };
    } finally {
      setIsCreating(false);
    }
  };

  // Update schedule
  const updateSchedule = async (id: number, scheduleData: any) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update schedule");
      }

      await mutate();

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update schedule",
      };
    } finally {
      setIsUpdating(false);
    }
  };

  // Approve schedule
  const approveSchedule = async (id: number) => {
    try {
      setIsApproving(true);
      const response = await fetch(`/api/schedules/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to approve schedule");
      }

      await mutate();

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to approve schedule",
      };
    } finally {
      setIsApproving(false);
    }
  };

  // Reject schedule
  const rejectSchedule = async (id: number, reason: string) => {
    try {
      setIsApproving(true);
      const response = await fetch(`/api/schedules/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reject schedule");
      }

      await mutate();

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to reject schedule",
      };
    } finally {
      setIsApproving(false);
    }
  };

  // Delete schedule
  const deleteSchedule = async (id: number) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/schedules/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete schedule");
      }

      await mutate();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete schedule",
      };
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    schedules: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error,
    createSchedule,
    updateSchedule,
    approveSchedule,
    rejectSchedule,
    deleteSchedule,
    isCreating,
    isUpdating,
    isDeleting,
    isApproving,
    refresh: mutate,
  };
}
