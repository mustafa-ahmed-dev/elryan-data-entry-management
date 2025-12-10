/**
 * useReports Hook
 *
 * Manages reports data fetching
 */

"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Daily report
export function useDailyReport(filters?: {
  date?: string;
  startDate?: string;
  endDate?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.date) params.append("date", filters.date);
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);

  const queryString = params.toString();
  const url = `/api/reports/daily${queryString ? `?${queryString}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000, // 30 seconds
  });

  return {
    report: data?.data,
    isLoading,
    error,
    refresh: mutate,
  };
}

// Quality trends
export function useQualityTrends(startDate: string, endDate: string) {
  const params = new URLSearchParams();
  params.append("startDate", startDate);
  params.append("endDate", endDate);

  const url = `/api/reports/quality-trends?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR(
    startDate && endDate ? url : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    trends: data?.data || [],
    dateRange: data?.dateRange,
    isLoading,
    error,
    refresh: mutate,
  };
}

// Top performers
export function useTopPerformers(filters?: {
  limit?: number;
  startDate?: string;
  endDate?: string;
  metric?: "quality" | "quantity";
}) {
  const params = new URLSearchParams();
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  if (filters?.metric) params.append("metric", filters.metric);

  const queryString = params.toString();
  const url = `/api/reports/top-performers${
    queryString ? `?${queryString}` : ""
  }`;

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  return {
    performers: data?.data || [],
    metric: data?.metric,
    dateRange: data?.dateRange,
    isLoading,
    error,
    refresh: mutate,
  };
}
