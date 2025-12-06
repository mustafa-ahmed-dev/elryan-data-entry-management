/**
 * Team Stats Component
 *
 * Displays detailed statistics for a specific team
 */

"use client";

import { Card, Row, Col, Statistic, Progress, Empty, Spin, Alert } from "antd";
import {
  UserOutlined,
  TeamOutlined,
  TrophyOutlined,
  FileTextOutlined,
  StarOutlined,
  CheckCircleOutlined,
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

  // Fetch team performance stats (may not exist yet)
  const { data: statsData, isLoading: statsLoading } = useSWR(
    `/api/teams/${teamId}/stats`,
    fetcher,
    {
      // Don't retry if endpoint doesn't exist
      shouldRetryOnError: false,
      onError: () => {
        // Silently handle if stats endpoint doesn't exist yet
      },
    }
  );

  const isLoading = teamLoading || membersLoading;
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
  const inactiveMembers = members.length - activeMembers;

  // Calculate activity percentage
  const activityPercentage =
    members.length > 0 ? (activeMembers / members.length) * 100 : 0;

  return (
    <div>
      {showTitle && (
        <h2 style={{ marginBottom: "24px", fontSize: "20px", fontWeight: 600 }}>
          {team.name} - Statistics
        </h2>
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
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Member Activity */}
      <Card title="Team Activity" style={{ marginBottom: "24px" }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span>Active Members</span>
                <span style={{ fontWeight: 600 }}>
                  {activityPercentage.toFixed(0)}%
                </span>
              </div>
              <Progress
                percent={activityPercentage}
                strokeColor={{
                  "0%": "#108ee9",
                  "100%": "#87d068",
                }}
                status="active"
              />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <Row gutter={8}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Active"
                    value={activeMembers}
                    valueStyle={{ color: "#3f8600", fontSize: "20px" }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Inactive"
                    value={inactiveMembers}
                    valueStyle={{ color: "#cf1322", fontSize: "20px" }}
                    prefix={<StopOutlined />}
                  />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* Role Distribution */}
      <Card title="Role Distribution">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span>Team Leaders</span>
                <span style={{ fontWeight: 600 }}>
                  {members.length > 0
                    ? ((teamLeaders / members.length) * 100).toFixed(0)
                    : 0}
                  %
                </span>
              </div>
              <Progress
                percent={
                  members.length > 0 ? (teamLeaders / members.length) * 100 : 0
                }
                strokeColor="#cf1322"
              />
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span>Employees</span>
                <span style={{ fontWeight: 600 }}>
                  {members.length > 0
                    ? ((employees / members.length) * 100).toFixed(0)
                    : 0}
                  %
                </span>
              </div>
              <Progress
                percent={
                  members.length > 0 ? (employees / members.length) * 100 : 0
                }
                strokeColor="#722ed1"
              />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "48px", fontWeight: "bold" }}>
                  {teamLeaders}:{employees}
                </div>
                <div style={{ color: "#666", marginTop: "8px" }}>
                  Leader to Employee Ratio
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Performance Stats (if available) */}
      {stats && (
        <Card
          title={
            <span>
              <StarOutlined style={{ marginRight: "8px" }} />
              Performance Metrics
            </span>
          }
          style={{ marginTop: "24px" }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Statistic
                title="Total Entries"
                value={stats.totalEntries || 0}
                prefix={<FileTextOutlined />}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Average Score"
                value={stats.avgScore || 0}
                precision={1}
                suffix="/ 100"
                prefix={<StarOutlined />}
                valueStyle={{
                  color: stats.avgScore >= 80 ? "#3f8600" : "#faad14",
                }}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Completion Rate"
                value={stats.completionRate || 0}
                precision={1}
                suffix="%"
                prefix={<CheckCircleOutlined />}
                valueStyle={{
                  color: stats.completionRate >= 90 ? "#3f8600" : "#faad14",
                }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Info Message */}
      {!stats && (
        <Alert
          message="Performance Metrics Not Available"
          description="Performance statistics will be available once team members start creating entries and evaluations."
          type="info"
          showIcon
          style={{ marginTop: "24px" }}
        />
      )}
    </div>
  );
}
