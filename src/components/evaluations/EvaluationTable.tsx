/**
 * Evaluation Table Component
 *
 * Displays evaluations in a table with scores and actions
 */

"use client";

import { Table, Space, Button, Tag, Tooltip, Popconfirm, Progress } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";

interface Violation {
  ruleId: number;
  ruleName: string;
  deduction: number;
}

interface Evaluation {
  id: number;
  entryId: number;
  employeeId: number;
  employeeName: string;
  evaluatorId: number;
  totalScore: number;
  violations: Violation[];
  comments: string | null;
  evaluatedAt: Date;
}

interface EvaluationTableProps {
  evaluations: Evaluation[];
  loading: boolean;
  pagination: TablePaginationConfig;
  onView: (evaluation: Evaluation) => void;
  onEdit?: (evaluation: Evaluation) => void;
  onDelete?: (evaluationId: number) => void;
  onChange: (page: number, pageSize: number) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function EvaluationTable({
  evaluations,
  loading,
  pagination,
  onView,
  onEdit,
  onDelete,
  onChange,
  canEdit,
  canDelete,
}: EvaluationTableProps) {
  const columns: ColumnsType<Evaluation> = [
    {
      title: "Entry ID",
      dataIndex: "entryId",
      key: "entryId",
      width: 100,
      render: (id) => <span style={{ fontWeight: 500 }}>#{id}</span>,
    },
    {
      title: "Employee",
      dataIndex: "employeeName",
      key: "employeeName",
      ellipsis: true,
    },
    {
      title: "Score",
      dataIndex: "totalScore",
      key: "totalScore",
      width: 180,
      sorter: true,
      render: (score) => {
        let color = "#52c41a"; // Green
        let status: "success" | "normal" | "exception" = "success";

        if (score < 60) {
          color = "#ff4d4f"; // Red
          status = "exception";
        } else if (score < 80) {
          color = "#faad14"; // Yellow
          status = "normal";
        }

        return (
          <div>
            <Progress
              percent={score}
              strokeColor={color}
              status={status}
              size="small"
              format={(percent) => `${percent}/100`}
            />
          </div>
        );
      },
    },
    {
      title: "Violations",
      dataIndex: "violations",
      key: "violations",
      width: 120,
      align: "center",
      render: (violations: Violation[]) => {
        const count = violations.length;
        if (count === 0) {
          return (
            <Tag icon={<CheckCircleOutlined />} color="success">
              None
            </Tag>
          );
        }
        return (
          <Tag icon={<WarningOutlined />} color="warning">
            {count} {count === 1 ? "violation" : "violations"}
          </Tag>
        );
      },
    },
    {
      title: "Comments",
      dataIndex: "comments",
      key: "comments",
      ellipsis: true,
      render: (comments) =>
        comments ? (
          <Tooltip title={comments}>
            <span style={{ color: "#666" }}>
              {comments.substring(0, 50)}
              {comments.length > 50 ? "..." : ""}
            </span>
          </Tooltip>
        ) : (
          <span style={{ color: "#ccc" }}>No comments</span>
        ),
    },
    {
      title: "Evaluated At",
      dataIndex: "evaluatedAt",
      key: "evaluatedAt",
      width: 160,
      sorter: true,
      render: (date) => dayjs(date).format("MMM D, YYYY HH:mm"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
            />
          </Tooltip>
          {canEdit && onEdit && (
            <Tooltip title="Edit evaluation">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              />
            </Tooltip>
          )}
          {canDelete && onDelete && (
            <Popconfirm
              title="Delete evaluation"
              description="Are you sure you want to delete this evaluation?"
              onConfirm={() => onDelete(record.id)}
              okText="Delete"
              okType="danger"
            >
              <Tooltip title="Delete evaluation">
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
      dataSource={evaluations}
      loading={loading}
      pagination={{
        ...pagination,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} evaluations`,
        onChange: onChange,
      }}
      rowKey="id"
      scroll={{ x: 1000 }}
    />
  );
}
