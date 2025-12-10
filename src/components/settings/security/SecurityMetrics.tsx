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
<<<<<<< HEAD
import { usePermissionStatistics } from "@/lib/hooks/usePermissions";
=======
import { usePermissionStatistics } from "@/lib/hooks";
>>>>>>> local-backup

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
<<<<<<< HEAD
            valueStyle={{ color: "#3f8600" }}
=======
            styles={{ content: { color: "#3f8600" } }}
>>>>>>> local-backup
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Active Roles"
            value={statistics.totalRoles}
            prefix={<ApartmentOutlined />}
<<<<<<< HEAD
            valueStyle={{ color: "#1890ff" }}
=======
            styles={{ content: { color: "#1890ff" } }}
>>>>>>> local-backup
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Protected Resources"
            value={statistics.totalResources}
            prefix={<ThunderboltOutlined />}
<<<<<<< HEAD
            valueStyle={{ color: "#722ed1" }}
=======
            styles={{ content: { color: "#722ed1" } }}
>>>>>>> local-backup
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Permission Actions"
            value={statistics.totalActions}
            prefix={<UserOutlined />}
<<<<<<< HEAD
            valueStyle={{ color: "#fa8c16" }}
=======
            styles={{ content: { color: "#fa8c16" } }}
>>>>>>> local-backup
          />
        </Card>
      </Col>
    </Row>
  );
}
