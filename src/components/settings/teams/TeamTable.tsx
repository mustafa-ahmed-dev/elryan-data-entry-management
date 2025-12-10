/**
 * Team Table Component
 *
 * Displays teams in a table with actions
 */

"use client";

import { Table, Tag, Space, Button, Popconfirm, Avatar, Tooltip } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  UserOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { format } from "date-fns";

interface TeamTableProps {
  teams: any[];
  loading: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger?: boolean;
    showTotal?: (total: number) => string;
  };
  onEdit?: (team: any) => void;
  onDelete?: (teamId: number) => void;
  onViewMembers?: (team: any) => void;
  onChange?: (page: number, pageSize: number) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function TeamTable({
  teams,
  loading,
  pagination,
  onEdit,
  onDelete,
  onViewMembers,
  onChange,
  canEdit = false,
  canDelete = false,
}: TeamTableProps) {
  const columns: ColumnsType<any> = [
    {
      title: "Team",
      key: "team",
      width: 250,
      fixed: "left",
      render: (_, record) => (
        <Space>
          <Avatar
            icon={<TeamOutlined />}
            style={{ backgroundColor: "#1890ff" }}
          >
            {record.name?.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            {record.description && (
              <div style={{ fontSize: "12px", color: "#999" }}>
                {record.description}
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "Team Leader",
      key: "leader",
      width: 200,
      render: (_, record) =>
        record.leaderName ? (
          <Space>
            <CrownOutlined style={{ color: "#faad14" }} />
            <span>{record.leaderName}</span>
          </Space>
        ) : (
          <span style={{ color: "#999" }}>No leader assigned</span>
        ),
    },
    {
      title: "Members",
      dataIndex: "memberCount",
      key: "memberCount",
      width: 120,
      align: "center",
      render: (count: number, record) => (
        <Button
          type="link"
          icon={<UserOutlined />}
          onClick={() => onViewMembers?.(record)}
        >
          {count || 0}
        </Button>
      ),
      sorter: (a, b) => (a.memberCount || 0) - (b.memberCount || 0),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (isActive: boolean) =>
        isActive ? (
          <Tag color="success">Active</Tag>
        ) : (
          <Tag color="default">Inactive</Tag>
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
      title: "Actions",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          {canEdit && (
            <Tooltip title="Edit team">
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
              title="Delete Team"
              description={`Are you sure you want to delete ${record.name}?`}
              onConfirm={() => onDelete?.(record.id)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Delete team">
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
      dataSource={teams}
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
      scroll={{ x: 1000 }}
      size="middle"
    />
  );
}
