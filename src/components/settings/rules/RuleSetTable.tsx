/**
 * Rule Set Table Component
 *
 * Displays evaluation rule sets in a table with actions
 */

"use client";

import { Table, Space, Button, Tag, Tooltip, Popconfirm, Badge } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  StarOutlined,
  StarFilled,
  StopOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface RuleSet {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
}

interface RuleSetTableProps {
  ruleSets: RuleSet[];
  loading: boolean;
  onView: (ruleSet: RuleSet) => void;
  onEdit: (ruleSet: RuleSet) => void;
  onDelete: (ruleSetId: number) => void;
  onActivate: (ruleSetId: number) => void;
  onDeactivate?: (ruleSetId: number) => void; // NEW: Added deactivation handler
}

export function RuleSetTable({
  ruleSets,
  loading,
  onView,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
}: RuleSetTableProps) {
  const columns: ColumnsType<RuleSet> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div>
          <Space>
            <span style={{ fontWeight: 500, fontSize: "14px" }}>{text}</span>
            {record.isActive && (
              <Tag icon={<StarFilled />} color="gold">
                Active
              </Tag>
            )}
          </Space>
          {record.description && (
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
              {record.description}
            </div>
          )}
        </div>
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
          <Badge status="success" text="Active" />
        ) : (
          <Badge status="default" text="Inactive" />
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
      width: 250,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View rules">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
            />
          </Tooltip>
          <Tooltip title="Edit rule set">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>

          {/* FIXED: Show deactivate button for active rule sets */}
          {record.isActive ? (
            onDeactivate ? (
              <Popconfirm
                title="Deactivate Rule Set"
                description="Are you sure you want to deactivate this rule set? No active rule set means evaluations cannot be created."
                onConfirm={() => onDeactivate(record.id)}
                okText="Deactivate"
                okType="danger"
              >
                <Tooltip title="Deactivate this rule set">
                  <Button
                    type="text"
                    icon={<StopOutlined />}
                    style={{ color: "#ff4d4f" }}
                  />
                </Tooltip>
              </Popconfirm>
            ) : (
              <Tooltip title="This rule set is currently active">
                <Button
                  type="text"
                  icon={<StarFilled />}
                  disabled
                  style={{ color: "#52c41a" }}
                />
              </Tooltip>
            )
          ) : (
            <Tooltip title="Activate this rule set">
              <Button
                type="text"
                icon={<StarOutlined />}
                onClick={() => onActivate(record.id)}
                style={{ color: "#faad14" }}
              />
            </Tooltip>
          )}

          <Popconfirm
            title="Delete rule set"
            description={
              <>
                <p>Are you sure you want to delete this rule set?</p>
                {record.isActive && (
                  <p style={{ color: "#ff4d4f", fontWeight: 500 }}>
                    Warning: Cannot delete active rule set!
                  </p>
                )}
              </>
            }
            onConfirm={() => onDelete(record.id)}
            okText="Delete"
            okType="danger"
            disabled={record.isActive}
          >
            <Tooltip
              title={
                record.isActive
                  ? "Cannot delete active rule set"
                  : "Delete rule set"
              }
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                disabled={record.isActive}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={ruleSets}
      loading={loading}
      rowKey="id"
      pagination={false}
      rowClassName={(record) =>
        record.isActive ? "ant-table-row-selected" : ""
      }
    />
  );
}
