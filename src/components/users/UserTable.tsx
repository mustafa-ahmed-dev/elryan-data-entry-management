/**
 * User Table Component
 *
 * Displays users in a table with actions
 */

"use client";

import { Table, Space, Button, Tag, Tooltip, Popconfirm, Badge } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";

interface User {
  id: number;
  fullName: string;
  email: string;
  roleId: number;
  roleName: string;
  roleDisplayName: string;
  teamId: number | null;
  teamName: string | null;
  isActive: boolean;
  createdAt: Date;
}

interface UserTableProps {
  users: User[];
  loading: boolean;
  pagination: TablePaginationConfig;
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
  onChange: (page: number, pageSize: number) => void;
}

export function UserTable({
  users,
  loading,
  pagination,
  onEdit,
  onDelete,
  onChange,
}: UserTableProps) {
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

  const columns: ColumnsType<User> = [
    {
      title: "Name",
      dataIndex: "fullName",
      key: "fullName",
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: "14px" }}>
            <UserOutlined style={{ marginRight: "8px", color: "#1890ff" }} />
            {text}
          </div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
            {record.email}
          </div>
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "roleDisplayName",
      key: "role",
      width: 150,
      render: (text, record) => (
        <Tag color={getRoleColor(record.roleName)}>{text}</Tag>
      ),
    },
    {
      title: "Team",
      dataIndex: "teamName",
      key: "team",
      width: 150,
      render: (teamName) =>
        teamName ? (
          <Tag color="purple">{teamName}</Tag>
        ) : (
          <span style={{ color: "#999" }}>No Team</span>
        ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      align: "center",
      render: (isActive) =>
        isActive ? (
          <Badge
            status="success"
            text="Active"
            icon={<CheckCircleOutlined />}
          />
        ) : (
          <Badge status="default" text="Inactive" icon={<StopOutlined />} />
        ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date) => dayjs(date).format("MMM D, YYYY"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit user">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete user"
            description={
              <>
                <p>Are you sure you want to deactivate this user?</p>
                <p style={{ color: "#999", fontSize: "12px" }}>
                  The user will be set to inactive and unable to login.
                </p>
              </>
            }
            onConfirm={() => onDelete(record.id)}
            okText="Deactivate"
            okType="danger"
          >
            <Tooltip title="Deactivate user">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={users}
      loading={loading}
      pagination={{
        ...pagination,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} users`,
        onChange: onChange,
      }}
      rowKey="id"
      scroll={{ x: 1000 }}
    />
  );
}
