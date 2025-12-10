/**
 * Rule Type Table Component
 *
 * Display and manage rule types
 */

"use client";

import { Table, Tag, Space, Button, Popconfirm, Tooltip } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
<<<<<<< HEAD
import type { RuleType } from "@/lib/hooks/useRuleTypes";
=======
import type { RuleType } from "@/lib/hooks";
>>>>>>> local-backup

interface RuleTypeTableProps {
  ruleTypes: RuleType[];
  loading: boolean;
  onEdit: (ruleType: RuleType) => void;
  onDelete: (id: number) => void;
}

export function RuleTypeTable({
  ruleTypes,
  loading,
  onEdit,
  onDelete,
}: RuleTypeTableProps) {
  const columns = [
    {
      title: "Sort Order",
      dataIndex: "sortOrder",
      key: "sortOrder",
      width: 100,
      sorter: (a: RuleType, b: RuleType) => a.sortOrder - b.sortOrder,
    },
    {
      title: "Icon",
      dataIndex: "icon",
      key: "icon",
      width: 80,
      render: (icon: string) => (
        <span style={{ fontSize: "24px" }}>{icon || "📋"}</span>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: RuleType) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.displayName}</div>
          <div style={{ fontSize: "12px", color: "#999" }}>{name}</div>
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (isActive: boolean) =>
        isActive ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Active
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="default">
            Inactive
          </Tag>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_: any, record: RuleType) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Deactivate Rule Type"
            description="Are you sure you want to deactivate this rule type? It will no longer be available for new rules."
            onConfirm={() => onDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Deactivate">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                disabled={!record.isActive}
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
      dataSource={ruleTypes}
      rowKey="id"
      loading={loading}
      pagination={{
        pageSize: 20,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} rule types`,
      }}
    />
  );
}
