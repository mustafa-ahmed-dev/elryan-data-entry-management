import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import type { Schedule, ScheduleFilters, ScheduleStats } from "@/lib/types";

export function useSchedules(filters?: ScheduleFilters) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [stats, setStats] = useState<ScheduleStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.userId) params.append("userId", filters.userId.toString());
      if (filters?.weekStartDate)
        params.append("weekStartDate", filters.weekStartDate);
      if (filters?.weekEndDate)
        params.append("weekEndDate", filters.weekEndDate);

      const response = await fetch(`/api/schedules?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `Failed to fetch schedules (${response.status})`
        );
      }

      if (result.success) {
        setSchedules(result.data || []);
        setStats(
          result.stats || { total: 0, pending: 0, approved: 0, rejected: 0 }
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch schedules";
      setError(errorMessage);
      message.error(errorMessage);
      setSchedules([]);
      setStats({ total: 0, pending: 0, approved: 0, rejected: 0 });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const createBulkSchedules = async (schedules: any[]) => {
    try {
      console.log("Creating bulk schedules:", schedules);

      const response = await fetch("/api/schedules/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedules),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create schedules");
      }

      message.success(result.message || "Schedules created successfully");
      await fetchSchedules();
      return result.data;
    } catch (err) {
      console.error("Error creating bulk schedules:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create schedules";
      message.error(errorMessage);
      throw err;
    }
  };

  const approveSchedule = async (id: number) => {
    try {
      console.log("Approving schedule:", id);

      const response = await fetch(`/api/schedules/${id}/approve`, {
        method: "POST",
      });

      console.log("Approve response status:", response.status);
      const result = await response.json();
      console.log("Approve response data:", result);

      if (!response.ok) {
        throw new Error(result.error || "Failed to approve schedule");
      }

      message.success(result.message || "Schedule approved successfully");
      await fetchSchedules();
    } catch (err) {
      console.error("Error approving schedule:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to approve schedule";
      message.error(errorMessage);
      throw err;
    }
  };

  const rejectSchedule = async (id: number, reason?: string) => {
    try {
      const response = await fetch(`/api/schedules/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reject schedule");
      }

      message.success(result.message || "Schedule rejected");
      await fetchSchedules();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to reject schedule";
      message.error(errorMessage);
      throw err;
    }
  };

  return {
    schedules,
    stats,
    loading,
    error,
    refetch: fetchSchedules,
    createBulkSchedules,
    approveSchedule,
    rejectSchedule,
  };
}
