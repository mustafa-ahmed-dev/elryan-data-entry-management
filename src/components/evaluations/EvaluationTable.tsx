"use client";

import { useState } from "react";
import {
  Table,
  Space,
  Button,
  Tag,
  Tooltip,
  Popconfirm,
  Progress,
  Modal,
} from "antd";
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
  pagination?: TablePaginationConfig;
  onView?: (evaluation: Evaluation) => void;
  onEdit?: (evaluation: Evaluation) => void;
  onDelete?: (evaluationId: number) => void;
  onChange?: (page: number, pageSize: number) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function EvaluationTable({
  evaluations,
  loading,
  pagination,
  onView,
  onEdit,
  onDelete,
  onChange,
  canEdit = false,
  canDelete = false,
}: EvaluationTableProps) {
  const [selectedEvaluation, setSelectedEvaluation] =
    useState<Evaluation | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const handleView = (evaluation: Evaluation) => {
    if (onView) {
      onView(evaluation);
    } else {
      // Default behavior: show detail modal
      setSelectedEvaluation(evaluation);
      setDetailVisible(true);
    }
  };

  const columns: ColumnsType<Evaluation> = [
    {
      title: "Entry ID",
      dataIndex: "entryId",
      key: "entryId",
      width: 100,
      render: (id) => <span style={{ fontWeight: 500 }}>#{id}</span>,
    },
    {
      title: "Entry Employee",
      dataIndex: "employeeName",
      key: "employeeName",
      ellipsis: true,
      render: (name) => (
        <Tooltip title="Employee whose entry was evaluated">
          <span>{name}</span>
        </Tooltip>
      ),
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
              onClick={() => handleView(record)}
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
    <>
      <Table
        columns={columns}
        dataSource={evaluations}
        loading={loading}
        pagination={
          pagination
            ? {
                ...pagination,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} evaluations`,
                onChange: onChange,
              }
            : false
        }
        rowKey="id"
        scroll={{ x: 1000 }}
      />

      {/* Default Detail Modal */}
      <Modal
        title={`Evaluation Details - Entry #${selectedEvaluation?.entryId}`}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {selectedEvaluation && (
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <div>
              <strong>Employee:</strong> {selectedEvaluation.employeeName}
            </div>
            <div>
              <strong>Score:</strong>{" "}
              <Tag
                color={
                  selectedEvaluation.totalScore >= 80
                    ? "success"
                    : selectedEvaluation.totalScore >= 60
                    ? "warning"
                    : "error"
                }
              >
                {selectedEvaluation.totalScore} / 100
              </Tag>
            </div>
            <div>
              <strong>Violations:</strong>{" "}
              {selectedEvaluation.violations.length === 0 ? (
                <Tag color="success">No violations</Tag>
              ) : (
                <Space orientation="vertical" size="small">
                  {selectedEvaluation.violations.map((violation, index) => (
                    <Tag key={index} color="warning">
                      {violation.ruleName} (-{violation.deduction} points)
                    </Tag>
                  ))}
                </Space>
              )}
            </div>
            {selectedEvaluation.comments && (
              <div>
                <strong>Comments:</strong>
                <p
                  style={{
                    marginTop: 8,
                    padding: 12,
                    background: "#f5f5f5",
                    borderRadius: 4,
                  }}
                >
                  {selectedEvaluation.comments}
                </p>
              </div>
            )}
            <div>
              <strong>Evaluated At:</strong>{" "}
              {dayjs(selectedEvaluation.evaluatedAt).format(
                "MMMM D, YYYY h:mm A"
              )}
            </div>
          </Space>
        )}
      </Modal>
    </>
  );
}
