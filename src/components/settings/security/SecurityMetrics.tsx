/**
 * Security Metrics Component
 * Display security statistics and metrics
 */

"use client";

import { Row, Col, Card, Statistic } from "antd";
import {
  SafetyOutlined,
  UserOutlined,
  ApartmentOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { usePermissionStatistics } from "@/lib/hooks";

export function SecurityMetrics() {
  const { statistics, isLoading } = usePermissionStatistics();

  if (isLoading) {
    return <div>Loading statistics...</div>;
  }

  if (!statistics) {
    return null;
  }

  return (
    <Row gutter={16}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Total Permissions"
            value={statistics.totalPermissions}
            prefix={<SafetyOutlined />}
            styles={{ content: { color: "#3f8600" } }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Active Roles"
            value={statistics.totalRoles}
            prefix={<ApartmentOutlined />}
            styles={{ content: { color: "#1890ff" } }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Protected Resources"
            value={statistics.totalResources}
            prefix={<ThunderboltOutlined />}
            styles={{ content: { color: "#722ed1" } }}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Permission Actions"
            value={statistics.totalActions}
            prefix={<UserOutlined />}
            styles={{ content: { color: "#fa8c16" } }}
          />
        </Card>
      </Col>
    </Row>
  );
}
