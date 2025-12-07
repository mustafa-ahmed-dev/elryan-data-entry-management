/**
 * Bulk Evaluation Form Component
 *
 * Create multiple evaluations at once
 */

"use client";

import { useState } from "react";
import { Modal, Table, InputNumber, Select, Space, Alert, message } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

interface Violation {
  ruleId: number;
  ruleName: string;
  deduction: number;
}

interface Entry {
  id: number;
  employeeName: string;
  productName: string;
  entryTime: Date;
}

interface EvaluationData {
  entryId: number;
  ruleSetId: number;
  totalScore: number;
  violations: Violation[];
  comments: string;
}

interface BulkEvaluationFormProps {
  open: boolean;
  entries: Entry[];
  onSubmit: (evaluations: EvaluationData[]) => void;
  onCancel: () => void;
  loading: boolean;
}

export function BulkEvaluationForm({
  open,
  entries,
  onSubmit,
  onCancel,
  loading,
}: BulkEvaluationFormProps) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [evaluations, setEvaluations] = useState<Map<number, EvaluationData>>(
    new Map()
  );

  // Initialize evaluations for selected entries
  const initializeEvaluation = (entryId: number): EvaluationData => {
    return {
      entryId,
      ruleSetId: 1,
      totalScore: 100,
      violations: [],
      comments: "",
    };
  };

  // Update evaluation data
  const updateEvaluation = (
    entryId: number,
    field: keyof EvaluationData,
    value: any
  ) => {
    setEvaluations((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(entryId) || initializeEvaluation(entryId);
      newMap.set(entryId, { ...current, [field]: value });
      return newMap;
    });
  };

  // Handle row selection
  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys as number[]);

    // Initialize evaluations for newly selected entries
    newSelectedRowKeys.forEach((key) => {
      if (!evaluations.has(key as number)) {
        setEvaluations((prev) => {
          const newMap = new Map(prev);
          newMap.set(key as number, initializeEvaluation(key as number));
          return newMap;
        });
      }
    });
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const columns: ColumnsType<Entry> = [
    {
      title: "Entry ID",
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (id) => `#${id}`,
    },
    {
      title: "Employee",
      dataIndex: "employeeName",
      key: "employeeName",
    },
    {
      title: "Product",
      dataIndex: "productName",
      key: "productName",
      ellipsis: true,
    },
    {
      title: "Rule Set",
      key: "ruleSet",
      width: 180,
      render: (_, record) => (
        <Select
          value={evaluations.get(record.id)?.ruleSetId || 1}
          onChange={(value) => updateEvaluation(record.id, "ruleSetId", value)}
          style={{ width: "100%" }}
          disabled={!selectedRowKeys.includes(record.id)}
        >
          <Select.Option value={1}>Standard Quality V1</Select.Option>
          <Select.Option value={2}>Enhanced Quality V2</Select.Option>
        </Select>
      ),
    },
    {
      title: "Score",
      key: "score",
      width: 120,
      render: (_, record) => (
        <InputNumber
          value={evaluations.get(record.id)?.totalScore || 100}
          onChange={(value) =>
            updateEvaluation(record.id, "totalScore", value || 100)
          }
          min={0}
          max={100}
          style={{ width: "100%" }}
          disabled={!selectedRowKeys.includes(record.id)}
          addonAfter="/100"
        />
      ),
    },
  ];

  const handleSubmit = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select at least one entry to evaluate");
      return;
    }

    const evaluationsToSubmit = selectedRowKeys
      .map((key) => evaluations.get(key))
      .filter((e): e is EvaluationData => e !== undefined);

    if (evaluationsToSubmit.length !== selectedRowKeys.length) {
      message.error("Some evaluations are incomplete");
      return;
    }

    onSubmit(evaluationsToSubmit);
  };

  const handleCancel = () => {
    setSelectedRowKeys([]);
    setEvaluations(new Map());
    onCancel();
  };

  return (
    <Modal
      title="Bulk Evaluation"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={900}
      okText={`Evaluate ${selectedRowKeys.length} ${
        selectedRowKeys.length === 1 ? "Entry" : "Entries"
      }`}
      okButtonProps={{ disabled: selectedRowKeys.length === 0 }}
    >
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <Alert
          message="Select entries to evaluate in bulk"
          description="Choose one or more entries, set their scores, and create all evaluations at once. This is useful for evaluating multiple entries with similar quality standards."
          type="info"
          showIcon
        />

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={entries}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} entries`,
          }}
          scroll={{ y: 400 }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={5}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: 500,
                    }}
                  >
                    <span>
                      Selected: {selectedRowKeys.length} / {entries.length}{" "}
                      entries
                    </span>
                    {selectedRowKeys.length > 0 && (
                      <span>
                        Average Score:{" "}
                        {(
                          selectedRowKeys.reduce(
                            (sum, key) =>
                              sum + (evaluations.get(key)?.totalScore || 100),
                            0
                          ) / selectedRowKeys.length
                        ).toFixed(1)}{" "}
                        / 100
                      </span>
                    )}
                  </div>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />

        {selectedRowKeys.length > 0 && (
          <Alert
            message={`Ready to create ${selectedRowKeys.length} evaluation${
              selectedRowKeys.length === 1 ? "" : "s"
            }`}
            type="success"
            showIcon
            icon={<CheckOutlined />}
          />
        )}
      </Space>
    </Modal>
  );
}
