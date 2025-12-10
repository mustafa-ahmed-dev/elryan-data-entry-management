/**
 * User Profile Component
 *
 * Displays detailed user information
 */

"use client";

import { Card, Descriptions, Tag, Avatar, Space, Button } from "antd";
import {
  UserOutlined,
  MailOutlined,
  TeamOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  StopOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { format } from "date-fns";

interface UserProfileProps {
  user: any;
  onEdit?: (user: any) => void;
  canEdit?: boolean;
}

export function UserProfile({
  user,
  onEdit,
  canEdit = false,
}: UserProfileProps) {
  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case "admin":
        return "red";
      case "team_leader":
        return "blue";
      case "employee":
        return "green";
      default:
        return "default";
    }
  };

  return (
    <Card
      title={
        <Space>
          <Avatar
            size={48}
            icon={<UserOutlined />}
            style={{ backgroundColor: "#1890ff" }}
          >
            {user.fullName?.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 600 }}>
              {user.fullName}
            </div>
            <div style={{ fontSize: "14px", color: "#666", fontWeight: 400 }}>
              {user.email}
            </div>
          </div>
        </Space>
      }
      extra={
        canEdit &&
        onEdit && (
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => onEdit(user)}
          >
            Edit
          </Button>
        )
      }
    >
      <Descriptions column={2} bordered>
        <Descriptions.Item label="Role" span={1}>
          <Tag color={getRoleColor(user.roleName)}>
            {user.roleName?.replace("_", " ").toUpperCase()}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Status" span={1}>
          {user.isActive ? (
            <Tag icon={<CheckCircleOutlined />} color="success">
              Active
            </Tag>
          ) : (
            <Tag icon={<StopOutlined />} color="default">
              Inactive
            </Tag>
          )}
        </Descriptions.Item>

        <Descriptions.Item
          label={
            <Space>
              <TeamOutlined /> Team
            </Space>
          }
          span={2}
        >
          {user.teamName || (
            <span style={{ color: "#999" }}>No team assigned</span>
          )}
        </Descriptions.Item>

        <Descriptions.Item
          label={
            <Space>
              <MailOutlined /> Email
            </Space>
          }
          span={2}
        >
          <a href={`mailto:${user.email}`}>{user.email}</a>
        </Descriptions.Item>

        <Descriptions.Item
          label={
            <Space>
              <CalendarOutlined /> Created
            </Space>
          }
          span={1}
        >
          {user.createdAt ? format(new Date(user.createdAt), "PPP") : "-"}
        </Descriptions.Item>

        <Descriptions.Item
          label={
            <Space>
              <CalendarOutlined /> Last Updated
            </Space>
          }
          span={1}
        >
          {user.updatedAt ? format(new Date(user.updatedAt), "PPP") : "-"}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
