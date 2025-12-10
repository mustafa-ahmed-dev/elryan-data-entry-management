/**
 * Role Permission Card Component
 * Summary card showing role permissions
 */

"use client";

import { Card, Statistic, Row, Col, Tag, Space, Button } from "antd";
import { SafetyOutlined, UserOutlined, EditOutlined } from "@ant-design/icons";
import type { RoleInfo } from "@/lib/types/auth";

interface RolePermissionCardProps {
  role: RoleInfo;
  onEdit?: (roleId: number) => void;
}

export function RolePermissionCard({ role, onEdit }: RolePermissionCardProps) {
  const getHierarchyColor = (hierarchy: number) => {
    if (hierarchy >= 90) return "#f5222d"; // Admin - Red
    if (hierarchy >= 50) return "#faad14"; // Team Leader - Orange
    return "#1890ff"; // Employee - Blue
  };

  const getHierarchyLabel = (hierarchy: number) => {
    if (hierarchy >= 90) return "Admin Level";
    if (hierarchy >= 50) return "Manager Level";
    return "Employee Level";
  };

  return (
    <Card
      hoverable
      style={{ height: "100%" }}
      actions={
        onEdit
          ? [
              <Button
                key="edit"
                type="link"
                icon={<EditOutlined />}
                onClick={() => onEdit(role.id)}
              >
                Manage Permissions
              </Button>,
            ]
          : undefined
      }
    >
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        {/* Role Header */}
        <div>
          <Space>
            <SafetyOutlined style={{ fontSize: 24, color: "#1890ff" }} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {role.displayName}
              </div>
              <Tag color={getHierarchyColor(role.hierarchy)}>
                {getHierarchyLabel(role.hierarchy)}
              </Tag>
            </div>
          </Space>
        </div>

        {/* Statistics */}
        <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title="Permissions"
              value={role.permissionCount || 0}
              prefix={<SafetyOutlined />}
              styles={{ content: { color: "#3f8600" } }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Users"
              value={role.userCount || 0}
              prefix={<UserOutlined />}
              styles={{ content: { color: "#1890ff" } }}
            />
          </Col>
        </Row>

        {/* Hierarchy Level */}
        <div>
          <div style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>
            Hierarchy Level
          </div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{role.hierarchy}</div>
        </div>
      </Space>
    </Card>
  );
}
