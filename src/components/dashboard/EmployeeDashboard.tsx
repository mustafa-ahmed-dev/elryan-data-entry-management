"use client";

import {
  Card,
  Row,
  Col,
  Statistic,
  List,
  Tag,
  Space,
  Typography,
  Badge,
  Spin,
} from "antd";
import {
  FileTextOutlined,
  StarOutlined,
  TrophyOutlined,
  CalendarOutlined,
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
  ResponsiveContainer,
} from "recharts";
import { useEmployeeDashboardStats, useAuth } from "@/lib/hooks";

const { Text } = Typography;

export function EmployeeDashboard() {
  const { user } = useAuth();
  const {
    weeklyEntries,
    monthlyEntries,
    currentQualityScore,
    latestEvaluationScore,
    recentEvaluations,
    weeklyTrends,
    upcomingSchedules,
    isLoading,
  } = useEmployeeDashboardStats(user?.id);

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
  const weeklyEntriesData = weeklyTrends.map((item: any) => ({
    day: new Date(item.date).toLocaleDateString("en-US", { weekday: "short" }),
    entries: item.count || 0,
  }));

  // Calculate quality breakdown from recent evaluations
  const qualityBreakdown = recentEvaluations.reduce(
    (acc: any, evaluation: any) => {
      const score = evaluation.totalScore || 0;
      if (score >= 90) acc.excellent++;
      else if (score >= 80) acc.good++;
      else if (score >= 70) acc.fair++;
      else acc.poor++;
      return acc;
    },
    { excellent: 0, good: 0, fair: 0, poor: 0 }
  );

  const total = recentEvaluations.length || 1;
  const qualityBreakdownData = [
    {
      name: "Excellent",
      value: (qualityBreakdown.excellent / total) * 100,
      color: "#52c41a",
    },
    {
      name: "Good",
      value: (qualityBreakdown.good / total) * 100,
      color: "#1890ff",
    },
    {
      name: "Fair",
      value: (qualityBreakdown.fair / total) * 100,
      color: "#faad14",
    },
    {
      name: "Poor",
      value: (qualityBreakdown.poor / total) * 100,
      color: "#f5222d",
    },
  ].filter((item) => item.value > 0);

  // Quality trend over time from recent evaluations
  const qualityTrendData = recentEvaluations
    .slice()
    .reverse()
    .map((evaluation: any, index: number) => ({
      date: `Eval ${index + 1}`,
      score: evaluation.totalScore || 0,
    }));

  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      {/* Personal Statistics */}
      <Row gutter={[16, 16]}>
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
              title="Entries This Month"
              value={monthlyEntries}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Current Quality Score"
              value={currentQualityScore.toFixed(1)}
              prefix={<StarOutlined />}
              suffix="/100"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Latest Evaluation"
              value={latestEvaluationScore || "-"}
              prefix={<TrophyOutlined />}
              valueStyle={{
                color: latestEvaluationScore >= 90 ? "#52c41a" : "#1890ff",
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quality Trend & Breakdown */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Your Recent Evaluation Scores">
            {qualityTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={qualityTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      border: "none",
                      borderRadius: "4px",
                      color: "#fff",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#1890ff"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "50px 0" }}>
                <Text type="secondary">No evaluation data available</Text>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Quality Breakdown">
            {qualityBreakdownData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={qualityBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {qualityBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "50px 0" }}>
                <Text type="secondary">No quality data available</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Weekly Entries */}
      <Card title="Your Weekly Activity">
        {weeklyEntriesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyEntriesData}>
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
                cursor={{ fill: "rgba(82, 196, 26, 0.1)" }}
              />
              <Bar dataKey="entries" fill="#52c41a" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <Text type="secondary">No activity data available</Text>
          </div>
        )}
      </Card>

      {/* Recent Evaluations & Upcoming Schedule */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Recent Evaluations">
            {recentEvaluations.length > 0 ? (
              <List
                dataSource={recentEvaluations}
                renderItem={(item: any) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>Score: {item.totalScore}/100</Text>
                          <Tag
                            color={
                              item.totalScore >= 90
                                ? "green"
                                : item.totalScore >= 80
                                ? "blue"
                                : "orange"
                            }
                          >
                            {item.totalScore >= 90
                              ? "Excellent"
                              : item.totalScore >= 80
                              ? "Good"
                              : "Fair"}
                          </Tag>
                        </Space>
                      }
                      description={
                        <>
                          <Text type="secondary">
                            {new Date(item.evaluatedAt).toLocaleDateString()}
                          </Text>
                          <br />
                          <Text>{item.comments || "No feedback provided"}</Text>
                        </>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <Text type="secondary">No evaluations yet</Text>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <>
                <CalendarOutlined /> Upcoming Schedule
              </>
            }
          >
            {upcomingSchedules.length > 0 ? (
              <List
                dataSource={upcomingSchedules}
                renderItem={(item: any) => (
                  <List.Item>
                    <Space
                      style={{ width: "100%", justifyContent: "space-between" }}
                    >
                      <Space>
                        <Badge status="processing" />
                        <Text strong>
                          {new Date(item.scheduleDate).toLocaleDateString()}
                        </Text>
                      </Space>
                      <Tag color="blue">{item.shiftType || "Full Day"}</Tag>
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <Text type="secondary">No upcoming schedules</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
