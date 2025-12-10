/**
 * Rule Form Component
 *
 * Create or edit individual evaluation rule
 */

"use client";

import { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Select, Alert, Spin } from "antd";
import { useRuleTypes } from "@/lib/hooks/useRuleTypes";

interface RuleFormProps {
  open: boolean;
  rule?: any;
  ruleSetId: number;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  loading: boolean;
}

export function RuleForm({
  open,
  rule,
  ruleSetId,
  onSubmit,
  onCancel,
  loading,
}: RuleFormProps) {
  const [form] = Form.useForm();
  const isEditing = !!rule;
  const { ruleTypes, isLoading: ruleTypesLoading } = useRuleTypes();

  // Reset form when modal opens/closes or rule changes
  useEffect(() => {
    if (open) {
      if (rule) {
        form.setFieldsValue({
          ruleName: rule.ruleName,
          ruleTypeId: rule.ruleTypeId,
          deductionPoints: rule.deductionPoints,
          description: rule.description,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          ruleSetId: ruleSetId,
        });
      }
    }
  }, [open, rule, ruleSetId, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // Add ruleSetId if creating new rule
      if (!isEditing) {
        values.ruleSetId = ruleSetId;
      }
      onSubmit(values);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  return (
    <Modal
      title={isEditing ? "Edit Rule" : "Add New Rule"}
      open={open}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
      okText={isEditing ? "Update" : "Add"}
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Form.Item
          name="ruleName"
          label="Rule Name"
          rules={[
            { required: true, message: "Please enter rule name" },
            { min: 3, message: "Name must be at least 3 characters" },
            { max: 200, message: "Name must be less than 200 characters" },
          ]}
        >
          <Input
            placeholder="e.g., Missing Product Specification"
            maxLength={200}
          />
        </Form.Item>

        <Form.Item
          name="ruleTypeId"
          label="Rule Type"
          rules={[{ required: true, message: "Please select a rule type" }]}
          extra="Choose the category that best describes this quality check"
        >
          {ruleTypesLoading ? (
            <Spin />
          ) : (
            <Select placeholder="Select rule type">
              {ruleTypes.map((ruleType) => (
                <Select.Option key={ruleType.id} value={ruleType.id}>
                  {ruleType.icon && <span>{ruleType.icon} </span>}
                  <span>{ruleType.displayName}</span>
                  {ruleType.description && (
                    <span style={{ color: "#999", fontSize: "12px" }}>
                      {" "}
                      - {ruleType.description}
                    </span>
                  )}
                </Select.Option>
              ))}
            </Select>
          )}
        </Form.Item>

        <Form.Item
          name="deductionPoints"
          label="Deduction Points"
          rules={[
            { required: true, message: "Please enter deduction points" },
            {
              type: "number",
              min: 0,
              max: 100,
              message: "Points must be between 0 and 100",
            },
          ]}
          extra="How many points to deduct when this rule is violated (0-100)"
        >
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            max={100}
            addonAfter="points"
            placeholder="e.g., 10"
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[
            {
              max: 500,
              message: "Description must be less than 500 characters",
            },
          ]}
        >
          <Input.TextArea
            placeholder="Detailed description of what this rule checks for..."
            rows={4}
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Alert
          title="Scoring Example"
          description={
            <div>
              <p style={{ marginBottom: "8px" }}>
                If an entry has violations for multiple rules:
              </p>
              <ul style={{ marginBottom: 0, paddingLeft: "20px" }}>
                <li>Starting Score: 100 points</li>
                <li>Rule 1 Violation: -10 points</li>
                <li>Rule 2 Violation: -5 points</li>
                <li>
                  <strong>Final Score: 85 points</strong>
                </li>
              </ul>
            </div>
          }
          type="info"
          showIcon
          style={{ marginTop: "16px" }}
        />
      </Form>
    </Modal>
  );
}
