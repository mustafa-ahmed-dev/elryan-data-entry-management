/**
 * Rules List Component
 *
 * Displays rules within a rule set
 */

"use client";

import { Table, Space, Button, Tag, Tooltip, Popconfirm, Empty } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

interface Rule {
  id: number;
  ruleSetId: number;
  ruleName: string;
  ruleType: string;
  deductionPoints: number;
  description: string | null;
  createdAt: Date;
}

interface RulesListProps {
  rules: Rule[];
  loading: boolean;
  onEdit: (rule: Rule) => void;
  onDelete: (ruleId: number) => void;
}

const RULE_TYPE_COLORS: Record<string, string> = {
  naming: "blue",
  specification: "green",
  keyword: "red",
  completeness: "orange",
  accuracy: "purple",
};

const RULE_TYPE_LABELS: Record<string, string> = {
  naming: "Naming",
  specification: "Specification",
  keyword: "Keyword",
  completeness: "Completeness",
  accuracy: "Accuracy",
};

export function RulesList({
  rules,
  loading,
  onEdit,
  onDelete,
}: RulesListProps) {
  const columns: ColumnsType<Rule> = [
    {
      title: "Rule Name",
      dataIndex: "ruleName",
      key: "ruleName",
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: "14px" }}>{text}</div>
          {record.description && (
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "ruleType",
      key: "ruleType",
      width: 150,
      render: (type) => (
        <Tag color={RULE_TYPE_COLORS[type] || "default"}>
          {RULE_TYPE_LABELS[type] || type}
        </Tag>
      ),
    },
    {
      title: "Deduction",
      dataIndex: "deductionPoints",
      key: "deductionPoints",
      width: 120,
      align: "center",
      render: (points) => {
        let color = "#52c41a"; // Green for low
        if (points >= 20) color = "#ff4d4f"; // Red for high
        else if (points >= 10) color = "#faad14"; // Yellow for medium

        return (
          <div>
            <WarningOutlined style={{ color, marginRight: "4px" }} />
            <span style={{ fontWeight: 600, color }}>-{points}</span>
            <span
              style={{ fontSize: "12px", color: "#999", marginLeft: "4px" }}
            >
              pts
            </span>
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit rule">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete rule"
            description="Are you sure you want to delete this rule?"
            onConfirm={() => onDelete(record.id)}
            okText="Delete"
            okType="danger"
          >
            <Tooltip title="Delete rule">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (rules.length === 0 && !loading) {
    return (
      <Empty
        description="No rules yet. Click 'Add Rule' to create your first rule."
        style={{ padding: "40px 0" }}
      />
    );
  }

  return (
    <Table
      columns={columns}
      dataSource={rules}
      loading={loading}
      rowKey="id"
      pagination={false}
      size="middle"
    />
  );
}
