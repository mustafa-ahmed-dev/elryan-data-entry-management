"use client";

import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Space,
  Typography,
  Spin,
} from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  StarOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTeamLeaderDashboardStats, useAuth } from "@/lib/hooks";

const { Text } = Typography;

export function TeamLeaderDashboard() {
  const { user } = useAuth();
  const {
    teamMembers,
    totalMembers,
    todayEntries,
    avgQualityScore,
    pendingEvaluations,
    weeklyTrends,
    teamStats,
    isLoading,
  } = useTeamLeaderDashboardStats(user?.teamId);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Loading dashboard data...</Text>
        </div>
      </div>
    );
  }

  // Transform weekly trends for chart
  const weeklyActivityData = weeklyTrends.map((item: any) => ({
    day: new Date(item.date).toLocaleDateString("en-US", { weekday: "short" }),
    entries: item.count || 0,
  }));

  // Transform team members for table
  const teamMemberPerformance = teamMembers.map((member) => ({
    key: member.id,
    name: member.fullName,
    entries: member.entryCount || 0,
    quality: member.avgScore || 0,
    status:
      member.avgScore >= 90
        ? "excellent"
        : member.avgScore >= 80
        ? "good"
        : member.avgScore >= 70
        ? "fair"
        : "poor",
  }));

  // Top performers (top 3)
  const topPerformers = [...teamMemberPerformance]
    .sort((a, b) => b.quality - a.quality)
    .slice(0, 3)
    .map((member, index) => ({
      rank: index + 1,
      name: member.name,
      score: member.quality,
      entries: member.entries,
    }));

  const columns = [
    {
      title: "Team Member",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Entries",
      dataIndex: "entries",
      key: "entries",
      sorter: (a: any, b: any) => a.entries - b.entries,
    },
    {
      title: "Quality Score",
      dataIndex: "quality",
      key: "quality",
      sorter: (a: any, b: any) => a.quality - b.quality,
      render: (score: number) => (
        <span>
          <Progress
            percent={score}
            size="small"
            style={{ width: 100 }}
            strokeColor={
              score >= 90 ? "#52c41a" : score >= 80 ? "#1890ff" : "#faad14"
            }
          />
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colors: Record<string, string> = {
          excellent: "green",
          good: "blue",
          fair: "orange",
          poor: "red",
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
  ];

  // Calculate daily progress (assuming target of 60 entries per day)
  const dailyTarget = 60;
  const dailyProgress =
    dailyTarget > 0 ? Math.min((todayEntries / dailyTarget) * 100, 100) : 0;

  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      {/* Team Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Team Members"
              value={totalMembers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Today's Entries"
              value={todayEntries}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Team Quality Score"
              value={avgQualityScore.toFixed(1)}
              prefix={<StarOutlined />}
              suffix="/100"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Evaluations"
              value={pendingEvaluations}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Daily Progress */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Daily Entry Progress">
            <div style={{ marginBottom: 16 }}>
              <Text>
                Target: {dailyTarget} entries | Actual: {todayEntries} entries
              </Text>
            </div>
            <Progress
              percent={Math.round(dailyProgress)}
              status={dailyProgress >= 100 ? "success" : "active"}
              strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Completion Rate">
            <div style={{ marginBottom: 16 }}>
              <Text>
                {teamStats.totalEvaluations || 0} evaluated out of{" "}
                {teamStats.totalEntries || 0} entries
              </Text>
            </div>
            <Progress
              percent={Math.round(teamStats.completionRate || 0)}
              status="active"
              strokeColor="#52c41a"
            />
          </Card>
        </Col>
      </Row>

      {/* Weekly Activity */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Weekly Activity">
            {weeklyActivityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      border: "none",
                      borderRadius: "4px",
                      color: "#fff",
                    }}
                    cursor={{ fill: "rgba(24, 144, 255, 0.1)" }}
                  />
                  <Legend />
                  <Bar dataKey="entries" fill="#1890ff" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "50px 0" }}>
                <Text type="secondary">No activity data available</Text>
              </div>
            )}
          </Card>
        </Col>

        {/* Top Performers */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <>
                <TrophyOutlined /> Top Performers
              </>
            }
          >
            {topPerformers.length > 0 ? (
              <Space
                orientation="vertical"
                style={{ width: "100%" }}
                size="middle"
              >
                {topPerformers.map((performer) => (
                  <Card key={performer.rank} size="small">
                    <Space orientation="vertical" size={0}>
                      <Text strong>
                        #{performer.rank} {performer.name}
                      </Text>
                      <Text type="secondary">
                        Score: {performer.score.toFixed(1)} | Entries:{" "}
                        {performer.entries}
                      </Text>
                    </Space>
                  </Card>
                ))}
              </Space>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <Text type="secondary">No performance data available</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Team Member Performance Table */}
      <Card title="Team Member Performance">
        <Table
          columns={columns}
          dataSource={teamMemberPerformance}
          pagination={false}
        />
      </Card>
    </Space>
  );
}
