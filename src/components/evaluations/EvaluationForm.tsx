<<<<<<< HEAD
/**
 * Evaluation Form Component
 *
 * Create or edit evaluation form in a modal
 */

"use client";

import { useEffect, useState } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Input,
  Select,
  Button,
  Space,
  Card,
  Tag,
  Alert,
  Divider,
} from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { RuleSetSelect } from "./RuleSetSelect";

interface Violation {
  ruleId: number;
  ruleName: string;
  deduction: number;
}

interface EvaluationFormProps {
  open: boolean;
  evaluation?: any;
  entryId?: number;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  loading: boolean;
}

export function EvaluationForm({
  open,
  evaluation,
  entryId,
  onSubmit,
  onCancel,
  loading,
}: EvaluationFormProps) {
  const [form] = Form.useForm();
  const isEditing = !!evaluation;
  const [calculatedScore, setCalculatedScore] = useState(100);

  // Reset form when modal opens/closes or evaluation changes
  useEffect(() => {
    if (open) {
      if (evaluation) {
        form.setFieldsValue({
          entryId: evaluation.entryId,
          ruleSetId: evaluation.ruleSetId,
          totalScore: evaluation.totalScore,
          violations: evaluation.violations,
          comments: evaluation.comments,
        });
        setCalculatedScore(evaluation.totalScore);
      } else {
        form.setFieldsValue({
          entryId: entryId,
          ruleSetId: 1, // Default rule set
          totalScore: 100,
          violations: [],
          comments: "",
        });
        setCalculatedScore(100);
      }
    }
  }, [open, evaluation, entryId, form]);

  // Calculate score based on violations
  const handleViolationsChange = () => {
    const violations = form.getFieldValue("violations") || [];
    const totalDeduction = violations.reduce(
      (sum: number, v: Violation) => sum + (v.deduction || 0),
      0
    );
    const score = Math.max(0, 100 - totalDeduction);
    setCalculatedScore(score);
    form.setFieldValue("totalScore", score);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  return (
    <Modal
      title={isEditing ? "Edit Evaluation" : "Create New Evaluation"}
      open={open}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={700}
      okText={isEditing ? "Update" : "Create"}
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        onValuesChange={handleViolationsChange}
      >
        <Form.Item name="entryId" label="Entry ID" rules={[{ required: true }]}>
          <InputNumber
            style={{ width: "100%" }}
            min={1}
            disabled={isEditing}
            placeholder="Entry ID to evaluate"
          />
        </Form.Item>

        <Form.Item
          name="ruleSetId"
          label="Rule Set"
          rules={[{ required: true, message: "Please select a rule set" }]}
        >
          <RuleSetSelect />
        </Form.Item>

        <Divider>Violations</Divider>

        <Form.List name="violations">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card
                  key={key}
                  size="small"
                  style={{ marginBottom: "8px" }}
                  extra={
                    <Button
                      type="text"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={() => {
                        remove(name);
                        handleViolationsChange();
                      }}
                    />
                  }
                >
                  <Space
                    style={{ display: "flex", marginBottom: 8 }}
                    align="baseline"
                  >
                    <Form.Item
                      {...restField}
                      name={[name, "ruleId"]}
                      rules={[{ required: true, message: "Required" }]}
                      style={{ marginBottom: 0, flex: 1 }}
                    >
                      <InputNumber
                        placeholder="Rule ID"
                        min={1}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, "ruleName"]}
                      rules={[{ required: true, message: "Required" }]}
                      style={{ marginBottom: 0, flex: 2 }}
                    >
                      <Input placeholder="Rule name" />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, "deduction"]}
                      rules={[
                        { required: true, message: "Required" },
                        { type: "number", min: 0, max: 100, message: "0-100" },
                      ]}
                      style={{ marginBottom: 0, flex: 1 }}
                    >
                      <InputNumber
                        placeholder="Points"
                        min={0}
                        max={100}
                        addonAfter="pts"
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Space>
                </Card>
              ))}

              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
              >
                Add Violation
              </Button>
            </>
          )}
        </Form.List>

        <Divider>Score</Divider>

        <Alert
          title={
            <div>
              <strong>Calculated Score:</strong>{" "}
              <Tag
                color={
                  calculatedScore >= 80
                    ? "success"
                    : calculatedScore >= 60
                    ? "warning"
                    : "error"
                }
                style={{ fontSize: "16px", padding: "4px 12px" }}
              >
                {calculatedScore} / 100
              </Tag>
            </div>
          }
          type="info"
          style={{ marginBottom: "16px" }}
        />

        <Form.Item
          name="totalScore"
          label="Total Score"
          rules={[
            { required: true, message: "Please enter total score" },
            {
              type: "number",
              min: 0,
              max: 100,
              message: "Score must be 0-100",
            },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            max={100}
            addonAfter="/ 100"
            disabled
          />
        </Form.Item>

        <Form.Item name="comments" label="Comments">
          <Input.TextArea
            placeholder="Add evaluation comments or feedback..."
            rows={4}
            showCount
            maxLength={500}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
=======
import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  message,
  Card,
} from "antd";

const { TextArea } = Input;

interface EvaluationFormProps {
  visible?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  inline?: boolean;
  entryId?: number;
  onCancel?: () => void;
}

interface EvaluationFormValues {
  entryId: number;
  evaluatorName: string;
  score: number;
  status: "approved" | "rejected" | "needs_revision";
  comments?: string;
}

export const EvaluationForm: React.FC<EvaluationFormProps> = ({
  visible = false,
  onClose,
  onSuccess,
  inline = false,
  entryId,
  onCancel,
}) => {
  const [form] = Form.useForm<EvaluationFormValues>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: EvaluationFormValues) => {
    setLoading(true);
    try {
      const response = await fetch("/api/evaluations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit evaluation");
      }

      message.success("Evaluation submitted successfully");
      form.resetFields();

      if (onSuccess) {
        onSuccess();
      }

      if (onClose && !inline) {
        onClose();
      }
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to submit evaluation"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    if (inline && onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
  };

  const formContent = (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        entryId: entryId || undefined,
        status: "approved",
      }}
    >
      <Form.Item
        name="entryId"
        label="Entry ID"
        rules={[{ required: true, message: "Please enter the entry ID" }]}
      >
        <InputNumber
          style={{ width: "100%" }}
          placeholder="Enter entry ID"
          min={1}
          disabled={!!entryId}
        />
      </Form.Item>

      <Form.Item
        name="evaluatorName"
        label="Evaluator Name"
        rules={[{ required: true, message: "Please enter your name" }]}
      >
        <Input placeholder="Enter your name" />
      </Form.Item>

      <Form.Item
        name="score"
        label="Score"
        rules={[
          { required: true, message: "Please enter a score" },
          {
            type: "number",
            min: 0,
            max: 100,
            message: "Score must be between 0 and 100",
          },
        ]}
      >
        <InputNumber
          style={{ width: "100%" }}
          placeholder="Enter score (0-100)"
          min={0}
          max={100}
        />
      </Form.Item>

      <Form.Item
        name="status"
        label="Status"
        rules={[{ required: true, message: "Please select a status" }]}
      >
        <Select placeholder="Select status">
          <Select.Option value="approved">Approved</Select.Option>
          <Select.Option value="rejected">Rejected</Select.Option>
          <Select.Option value="needs_revision">Needs Revision</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="comments" label="Comments">
        <TextArea
          rows={4}
          placeholder="Enter any additional comments or feedback"
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0 }}>
        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Submit Evaluation
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );

  // Inline mode - render form directly
  if (inline) {
    return <Card variant="outlined">{formContent}</Card>;
  }

  // Modal mode - render form in modal
  return (
    <Modal
      title="Create Evaluation"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnHidden
    >
      {formContent}
    </Modal>
  );
};
>>>>>>> local-backup
