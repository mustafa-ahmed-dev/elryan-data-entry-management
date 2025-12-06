/**
 * Team Stats Component
 *
 * Displays detailed statistics for a specific team
 */

"use client";

import { Card, Row, Col, Statistic, Progress, Empty, Spin } from "antd";
import {
  UserOutlined,
  TeamOutlined,
  TrophyOutlined,
  FileTextOutlined,
  StarOutlined,
} from "@ant-design/icons";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TeamStatsProps {
  teamId: number;
  showTitle?: boolean;
}

export function TeamStats({ teamId, showTitle = true }: TeamStatsProps) {
  // Fetch team details
  const { data: teamData, isLoading: teamLoading } = useSWR(
    `/api/teams/${teamId}`,
    fetcher
  );

  // Fetch team members
  const { data: membersData, isLoading: membersLoading } = useSWR(
    `/api/teams/${teamId}/members`,
    fetcher
  );

  // Fetch team performance stats (if we have the API)
  const { data: statsData, isLoading: statsLoading } = useSWR(
    `/api/teams/${teamId}/stats`,
    fetcher
  );

  const isLoading = teamLoading || membersLoading || statsLoading;
  const team = teamData?.data;
  const members = membersData?.data || [];
  const stats = statsData?.data;

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!team) {
    return <Empty description="Team not found" />;
  }

  // Calculate member distribution
  const teamLeaders = members.filter(
    (m: any) => m.roleName === "team_leader"
  ).length;
  const employees = members.filter(
    (m: any) => m.roleName === "employee"
  ).length;
  const activeMembers = members.filter((m: any) => m.isActive).length;

  return (
    <div>
      {showTitle && (
        <h2 style={{ marginBottom: "24px" }}>{team.name} - Statistics</h2>
      )}

      {/* Member Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Members"
              value={members.length}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Members"
              value={activeMembers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Team Leaders"
              value={teamLeaders}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Employees"
              value={employees}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Team Composition */}
      <Card title="Team Composition" style={{ marginBottom: "24px" }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ marginBottom: "8px" }}>
                <span>Team Leaders</span>
                <span style={{ float: "right" }}>
                  {teamLeaders} (
                  {members.length > 0
                    ? Math.round((teamLeaders / members.length) * 100)
                    : 0}
                  %)
                </span>
              </div>
              <Progress
                percent={
                  members.length > 0
                    ? Math.round((teamLeaders / members.length) * 100)
                    : 0
                }
                strokeColor="#ff4d4f"
              />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ marginBottom: "8px" }}>
                <span>Employees</span>
                <span style={{ float: "right" }}>
                  {employees} (
                  {members.length > 0
                    ? Math.round((employees / members.length) * 100)
                    : 0}
                  %)
                </span>
              </div>
              <Progress
                percent={
                  members.length > 0
                    ? Math.round((employees / members.length) * 100)
                    : 0
                }
                strokeColor="#52c41a"
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* Performance Stats (if available) */}
      {stats && (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Entries"
                value={stats.totalEntries || 0}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Avg Quality Score"
                value={stats.avgQualityScore || 0}
                suffix="/ 100"
                prefix={<StarOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="This Week"
                value={stats.entriesThisWeek || 0}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="This Month"
                value={stats.entriesThisMonth || 0}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
