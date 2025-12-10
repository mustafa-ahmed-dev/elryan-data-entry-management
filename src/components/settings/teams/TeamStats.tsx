/**
 * Team Stats Component
 *
 * Display team statistics and performance metrics
 */

"use client";

import { Card, Row, Col, Statistic, Spin } from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import useSWR from "swr";

interface TeamStatsProps {
  teamId: number;
}

export function TeamStats({ teamId }: TeamStatsProps) {
  // Fetch team stats
  const { data: statsData, isLoading } = useSWR(
    teamId ? `/api/teams/${teamId}/stats` : null,
    (url) => fetch(url).then((res) => res.json())
  );

  const stats = statsData?.data || {};

  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Team Members"
            value={stats.memberCount || 0}
            prefix={<UserOutlined />}
            styles={{ content: { color: "#1890ff" } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Total Entries"
            value={stats.totalEntries || 0}
            prefix={<FileTextOutlined />}
            styles={{ content: { color: "#52c41a" } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Evaluations"
            value={stats.totalEvaluations || 0}
            prefix={<CheckCircleOutlined />}
            styles={{ content: { color: "#722ed1" } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Avg Quality Score"
            value={stats.avgQualityScore || 0}
            precision={1}
            suffix="/100"
            prefix={<TrophyOutlined />}
            styles={{
              content: {
                color:
                  stats.avgQualityScore >= 80
                    ? "#52c41a"
                    : stats.avgQualityScore >= 60
                    ? "#faad14"
                    : "#ff4d4f",
              },
            }}
          />
        </Card>
      </Col>
    </Row>
  );
}
