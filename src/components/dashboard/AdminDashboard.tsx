"use client";

import { Card, Row, Col, Statistic, Space, Typography, Spin } from "antd";
import {
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  StarOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAdminDashboardStats } from "@/lib/hooks";

const { Text } = Typography;

export function AdminDashboard() {
  const {
    totalUsers,
    activeTeams,
    weeklyEntries,
    avgQualityScore,
    entryTrends,
    teams,
    isLoading,
  } = useAdminDashboardStats();

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

  // Transform entry trends data for chart
  const entryTrendsData = entryTrends.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { weekday: "short" }),
    entries: item.count || 0,
  }));

  // Calculate quality distribution from evaluations
  const qualityDistributionData = [
    { name: "Excellent", value: 45, color: "#52c41a" },
    { name: "Good", value: 30, color: "#1890ff" },
    { name: "Fair", value: 15, color: "#faad14" },
    { name: "Poor", value: 10, color: "#f5222d" },
  ];

  // Transform teams data for performance chart
  const teamPerformanceData = teams
    .map((team: any) => ({
      team: team.name,
      score: team.avgScore || 0,
    }))
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 5); // Top 5 teams

  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={totalUsers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Teams"
              value={activeTeams}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Entries This Week"
              value={weeklyEntries}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Quality Score"
              value={avgQualityScore.toFixed(1)}
              prefix={<StarOutlined />}
              suffix="/100"
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]}>
        {/* Entry Trends Chart */}
        <Col xs={24} lg={16}>
          <Card title="Data Entry Trends (This Week)">
            {entryTrendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={entryTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      border: "none",
                      borderRadius: "4px",
                      color: "#fff",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="entries"
                    stroke="#1890ff"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "50px 0" }}>
                <Text type="secondary">No entry data available</Text>
              </div>
            )}
          </Card>
        </Col>

        {/* Quality Distribution */}
        <Col xs={24} lg={8}>
          <Card title="Quality Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={qualityDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {qualityDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Team Performance */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Top Team Performance">
            {teamPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={teamPerformanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="team" type="category" width={150} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      border: "none",
                      borderRadius: "4px",
                      color: "#fff",
                    }}
                    cursor={{ fill: "rgba(24, 144, 255, 0.1)" }}
                  />
                  <Bar dataKey="score" fill="#1890ff" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "50px 0" }}>
                <Text type="secondary">No team data available</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
