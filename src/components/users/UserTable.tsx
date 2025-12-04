/**
 * User Table Component
 *
 * Displays users in a table with actions
 */

"use client";

import { Table, Tag, Space, Button, Popconfirm, Tooltip } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { ROLE_LABELS } from "@/lib/constants/roles";

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
  canEdit: boolean;
  canDelete: boolean;
}

export function UserTable({
  users,
  loading,
  pagination,
  onEdit,
  onDelete,
  onChange,
  canEdit,
  canDelete,
}: UserTableProps) {
  const columns: ColumnsType<User> = [
    {
      title: "Name",
      dataIndex: "fullName",
      key: "fullName",
      sorter: true,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>{record.email}</div>
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "roleDisplayName",
      key: "role",
      width: 150,
      render: (text, record) => {
        const colors: Record<string, string> = {
          admin: "red",
          team_leader: "blue",
          employee: "green",
        };
        return <Tag color={colors[record.roleName] || "default"}>{text}</Tag>;
      },
    },
    {
      title: "Team",
      dataIndex: "teamName",
      key: "team",
      width: 150,
      render: (text) => text || <span style={{ color: "#999" }}>No team</span>,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "status",
      width: 100,
      render: (isActive) => (
        <Tag
          icon={isActive ? <CheckCircleOutlined /> : <StopOutlined />}
          color={isActive ? "success" : "error"}
        >
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {canEdit && (
            <Tooltip title="Edit user">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              />
            </Tooltip>
          )}
          {canDelete && (
            <Popconfirm
              title="Delete user"
              description="Are you sure you want to delete this user?"
              onConfirm={() => onDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Tooltip title="Delete user">
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={users}
      loading={loading}
      rowKey="id"
      pagination={{
        ...pagination,
        onChange: onChange,
      }}
      scroll={{ x: 800 }}
    />
  );
}
