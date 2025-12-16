/**
 * Dashboard Statistics Hooks
 *
 * Custom hooks for fetching dashboard data from various API endpoints
 */

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Hook to fetch admin dashboard statistics
 */
export function useAdminDashboardStats() {
  // Fetch users count
  const { data: usersData } = useSWR("/api/users?pageSize=1", fetcher);

  // Fetch teams with stats
  const { data: teamsData } = useSWR("/api/teams?stats=true", fetcher);

  // Fetch entries stats
  const { data: entriesData } = useSWR("/api/entries/stats", fetcher);

  // Fetch daily report for trends
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const { data: dailyData } = useSWR(
    `/api/reports/daily?startDate=${startDate}&endDate=${endDate}`,
    fetcher
  );

  return {
    totalUsers: usersData?.pagination?.total || 0,
    activeTeams: teamsData?.data?.length || 0,
    weeklyEntries: entriesData?.data?.weekEntries || 0,
    avgQualityScore: entriesData?.data?.avgScore || 0,
    entryTrends: dailyData?.data?.dailyTrends || [],
    teams: teamsData?.data || [],
    isLoading: !usersData || !teamsData || !entriesData || !dailyData,
  };
}

/**
 * Hook to fetch team leader dashboard statistics
 */
export function useTeamLeaderDashboardStats(teamId?: number) {
  // Fetch team stats
  const { data: teamStatsData } = useSWR(
    teamId ? `/api/teams/${teamId}/stats` : null,
    fetcher
  );

  // Fetch team members
  const { data: membersData } = useSWR(
    teamId ? `/api/teams/${teamId}/members` : null,
    fetcher
  );

  // Fetch team entries for today
  const today = new Date().toISOString().split("T")[0];
  const { data: todayEntriesData } = useSWR(
    teamId
      ? `/api/entries?teamId=${teamId}&startDate=${today}&endDate=${today}`
      : null,
    fetcher
  );

  // Fetch pending evaluations
  const { data: evaluationsData } = useSWR(
    teamId ? `/api/evaluations?teamId=${teamId}&hasEvaluation=false` : null,
    fetcher
  );

  // Fetch weekly trends
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const { data: weeklyData } = useSWR(
    teamId
      ? `/api/reports/daily?teamId=${teamId}&startDate=${startDate}&endDate=${endDate}`
      : null,
    fetcher
  );

  return {
    teamMembers: membersData?.data || [],
    totalMembers: membersData?.data?.length || 0,
    todayEntries: todayEntriesData?.pagination?.total || 0,
    avgQualityScore: teamStatsData?.data?.avgScore || 0,
    pendingEvaluations: evaluationsData?.pagination?.total || 0,
    weeklyTrends: weeklyData?.data?.dailyTrends || [],
    teamStats: teamStatsData?.data || {},
    isLoading:
      !teamStatsData ||
      !membersData ||
      !todayEntriesData ||
      !evaluationsData ||
      !weeklyData,
  };
}

/**
 * Hook to fetch employee dashboard statistics
 */
export function useEmployeeDashboardStats(employeeId?: number) {
  // Fetch employee entries stats
  const { data: entriesData } = useSWR(
    employeeId ? `/api/entries/stats?employeeId=${employeeId}` : null,
    fetcher
  );

  // Fetch recent evaluations
  const { data: evaluationsData } = useSWR(
    employeeId ? `/api/evaluations/employee/${employeeId}?pageSize=5` : null,
    fetcher
  );

  // Fetch weekly entry trends
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const { data: weeklyData } = useSWR(
    employeeId
      ? `/api/reports/daily?employeeId=${employeeId}&startDate=${startDate}&endDate=${endDate}`
      : null,
    fetcher
  );

  // Fetch employee schedules
  const { data: schedulesData } = useSWR(
    employeeId
      ? `/api/schedules?employeeId=${employeeId}&status=approved&pageSize=7`
      : null,
    fetcher
  );

  return {
    weeklyEntries: entriesData?.data?.weekEntries || 0,
    monthlyEntries: entriesData?.data?.monthEntries || 0,
    currentQualityScore: entriesData?.data?.avgScore || 0,
    latestEvaluationScore: evaluationsData?.data?.[0]?.totalScore || 0,
    recentEvaluations: evaluationsData?.data || [],
    weeklyTrends: weeklyData?.data?.dailyTrends || [],
    upcomingSchedules: schedulesData?.data || [],
    isLoading:
      !entriesData || !evaluationsData || !weeklyData || !schedulesData,
  };
}
