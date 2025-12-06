/**
 * Team Table Component
 *
 * Displays teams in a table with member counts and actions
 */

"use client";

import { Table, Space, Button, Popconfirm, Tooltip, Tag } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";

interface Team {
  id: number;
  name: string;
  description: string | null;
  memberCount: number;
  teamLeaderCount?: number;
  employeeCount?: number;
  createdAt: Date;
}

interface TeamTableProps {
  teams: Team[];
  loading: boolean;
  pagination: TablePaginationConfig;
  onEdit: (team: Team) => void;
  onDelete: (teamId: number) => void;
  onChange: (page: number, pageSize: number) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function TeamTable({
  teams,
  loading,
  pagination,
  onEdit,
  onDelete,
  onChange,
  canEdit,
  canDelete,
}: TeamTableProps) {
  const columns: ColumnsType<Team> = [
    {
      title: "Team Name",
      dataIndex: "name",
      key: "name",
      sorter: true,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: "14px" }}>
            <TeamOutlined style={{ marginRight: "8px", color: "#1890ff" }} />
            {text}
          </div>
          {record.description && (
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Members",
      dataIndex: "memberCount",
      key: "memberCount",
      width: 120,
      align: "center",
      render: (count, record) => (
        <div>
          <div
            style={{ fontSize: "18px", fontWeight: "bold", color: "#1890ff" }}
          >
            {count || 0}
          </div>
          {record.teamLeaderCount !== undefined &&
            record.employeeCount !== undefined && (
              <div style={{ fontSize: "11px", color: "#666" }}>
                {record.teamLeaderCount} leaders, {record.employeeCount}{" "}
                employees
              </div>
            )}
        </div>
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
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {canEdit && (
            <Tooltip title="Edit team">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              />
            </Tooltip>
          )}
          {canDelete && (
            <Popconfirm
              title="Delete team"
              description={
                <>
                  <p>Are you sure you want to delete this team?</p>
                  {record.memberCount > 0 && (
                    <p style={{ color: "#ff4d4f", fontWeight: 500 }}>
                      Warning: This team has {record.memberCount} member(s).
                      They will be unassigned.
                    </p>
                  )}
                </>
              }
              onConfirm={() => onDelete(record.id)}
              okText="Yes, delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Delete team">
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
      dataSource={teams}
      loading={loading}
      rowKey="id"
      pagination={{
        ...pagination,
        onChange: onChange,
      }}
      scroll={{ x: 600 }}
    />
  );
}
