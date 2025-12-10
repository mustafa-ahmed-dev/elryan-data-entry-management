/**
 * User Table Component
 *
 * Displays users in a table with actions
 */

"use client";

import { Table, Tag, Space, Button, Popconfirm, Avatar, Tooltip } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { format } from "date-fns";

interface UserTableProps {
  users: any[];
  loading: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger?: boolean;
    showTotal?: (total: number) => string;
  };
  onEdit?: (user: any) => void;
  onDelete?: (userId: number) => void;
  onChange?: (page: number, pageSize: number) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function UserTable({
  users,
  loading,
  pagination,
  onEdit,
  onDelete,
  onChange,
  canEdit = false,
  canDelete = false,
}: UserTableProps) {
  const columns: ColumnsType<any> = [
    {
      title: "User",
      key: "user",
      width: 250,
      fixed: "left",
      render: (_, record) => (
        <Space>
          <Avatar
            icon={<UserOutlined />}
            style={{
              backgroundColor: record.isActive ? "#1890ff" : "#999",
            }}
          >
            {record.fullName?.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{record.fullName}</div>
            <div style={{ fontSize: "12px", color: "#999" }}>
              {record.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Role",
      dataIndex: "roleName",
      key: "roleName",
      width: 150,
      render: (roleName: string) => {
        let color = "default";
        if (roleName === "admin") color = "red";
        else if (roleName === "team_leader") color = "blue";
        else if (roleName === "employee") color = "green";

        return (
          <Tag color={color}>{roleName.replace("_", " ").toUpperCase()}</Tag>
        );
      },
      filters: [
        { text: "Admin", value: "admin" },
        { text: "Team Leader", value: "team_leader" },
        { text: "Employee", value: "employee" },
      ],
      onFilter: (value, record) => record.roleName === value,
    },
    {
      title: "Team",
      dataIndex: "teamName",
      key: "teamName",
      width: 150,
      render: (teamName: string | null) => teamName || "-",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (isActive: boolean) =>
        isActive ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Active
          </Tag>
        ) : (
          <Tag icon={<StopOutlined />} color="default">
            Inactive
          </Tag>
        ),
      filters: [
        { text: "Active", value: true },
        { text: "Inactive", value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date: string) =>
        date ? format(new Date(date), "MMM dd, yyyy") : "-",
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Last Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 150,
      render: (date: string) =>
        date ? format(new Date(date), "MMM dd, yyyy") : "-",
      sorter: (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          {canEdit && (
            <Tooltip title="Edit user">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEdit?.(record)}
                size="small"
              />
            </Tooltip>
          )}
          {canDelete && (
            <Popconfirm
              title="Deactivate User"
              description={`Are you sure you want to deactivate ${record.fullName}?`}
              onConfirm={() => onDelete?.(record.id)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Deactivate user">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                />
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
      pagination={
        pagination
          ? {
              ...pagination,
              onChange: onChange,
            }
          : false
      }
      scroll={{ x: 1200 }}
      size="middle"
    />
  );
}
