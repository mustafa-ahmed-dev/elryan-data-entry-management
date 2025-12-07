/**
 * Rule Set Form Component
 *
 * Create or edit evaluation rule set
 */

"use client";

import { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Alert } from "antd";

interface RuleSetFormProps {
  open: boolean;
  ruleSet?: any;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  loading: boolean;
}

export function RuleSetForm({
  open,
  ruleSet,
  onSubmit,
  onCancel,
  loading,
}: RuleSetFormProps) {
  const [form] = Form.useForm();
  const isEditing = !!ruleSet;

  // Reset form when modal opens/closes or ruleSet changes
  useEffect(() => {
    if (open) {
      if (ruleSet) {
        form.setFieldsValue({
          name: ruleSet.name,
          description: ruleSet.description,
          version: ruleSet.version,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, ruleSet, form]);

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
      title={isEditing ? "Edit Rule Set" : "Create New Rule Set"}
      open={open}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
      okText={isEditing ? "Update" : "Create"}
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Form.Item
          name="name"
          label="Rule Set Name"
          rules={[
            { required: true, message: "Please enter rule set name" },
            { min: 3, message: "Name must be at least 3 characters" },
            { max: 200, message: "Name must be less than 200 characters" },
          ]}
        >
          <Input
            placeholder="e.g., Standard Quality V1, Enhanced Quality V2"
            maxLength={200}
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
            placeholder="Describe the purpose and scope of this rule set..."
            rows={4}
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          name="version"
          label="Version"
          rules={[
            { required: true, message: "Please enter version number" },
            { type: "number", min: 1, message: "Version must be at least 1" },
          ]}
          extra="Use incremental version numbers (1, 2, 3, etc.) to track improvements"
        >
          <InputNumber
            style={{ width: "100%" }}
            min={1}
            placeholder="e.g., 1 for first version"
          />
        </Form.Item>

        {!isEditing && (
          <Alert
            message="New Rule Set"
            description="The new rule set will be created as inactive. After adding rules to it, you can activate it from the rule sets list."
            type="info"
            showIcon
            style={{ marginTop: "16px" }}
          />
        )}

        {isEditing && ruleSet?.isActive && (
          <Alert
            message="Active Rule Set"
            description="This is the currently active rule set used for new evaluations. Changes will apply to future evaluations."
            type="warning"
            showIcon
            style={{ marginTop: "16px" }}
          />
        )}
      </Form>
    </Modal>
  );
}
