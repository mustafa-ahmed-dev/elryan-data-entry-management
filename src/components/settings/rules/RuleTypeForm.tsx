/**
 * Rule Type Form Component
 *
 * Create or edit rule type
 */

"use client";

import { useEffect } from "react";
import { Modal, Form, Input, InputNumber, Alert } from "antd";
<<<<<<< HEAD
import type { RuleType } from "@/lib/hooks/useRuleTypes";
=======
import type { RuleType } from "@/lib/hooks";
>>>>>>> local-backup

interface RuleTypeFormProps {
  open: boolean;
  ruleType?: RuleType;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  loading: boolean;
}

export function RuleTypeForm({
  open,
  ruleType,
  onSubmit,
  onCancel,
  loading,
}: RuleTypeFormProps) {
  const [form] = Form.useForm();
  const isEditing = !!ruleType;

  // Reset form when modal opens/closes or ruleType changes
  useEffect(() => {
    if (open) {
      if (ruleType) {
        form.setFieldsValue({
          name: ruleType.name,
          displayName: ruleType.displayName,
          icon: ruleType.icon,
          description: ruleType.description,
          sortOrder: ruleType.sortOrder,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, ruleType, form]);

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
      title={isEditing ? "Edit Rule Type" : "Create New Rule Type"}
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
          label="Technical Name"
          rules={[
            { required: true, message: "Please enter technical name" },
            { min: 2, message: "Name must be at least 2 characters" },
            { max: 100, message: "Name must be less than 100 characters" },
            {
              pattern: /^[a-z_]+$/,
              message: "Name must be lowercase letters and underscores only",
            },
          ]}
          extra="Lowercase identifier (e.g., naming, specification, keyword)"
        >
          <Input
            placeholder="e.g., naming"
            maxLength={100}
            disabled={isEditing}
          />
        </Form.Item>

        <Form.Item
          name="displayName"
          label="Display Name"
          rules={[
            { required: true, message: "Please enter display name" },
            { min: 2, message: "Name must be at least 2 characters" },
            { max: 100, message: "Name must be less than 100 characters" },
          ]}
        >
          <Input placeholder="e.g., Naming Conventions" maxLength={100} />
        </Form.Item>

        <Form.Item
          name="icon"
          label="Icon"
          rules={[{ max: 10, message: "Icon must be less than 10 characters" }]}
          extra="Emoji or icon character (optional)"
        >
          <Input placeholder="e.g., 🏷️" maxLength={10} />
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
            placeholder="Brief description of this rule type..."
            rows={3}
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          name="sortOrder"
          label="Sort Order"
          rules={[
            { required: true, message: "Please enter sort order" },
            { type: "number", min: 0, message: "Must be 0 or greater" },
          ]}
          extra="Lower numbers appear first in the list"
        >
          <InputNumber style={{ width: "100%" }} min={0} placeholder="0" />
        </Form.Item>

        {!isEditing && (
          <Alert
            title="New Rule Type"
            description="The new rule type will be created as active and will be immediately available for use in evaluation rules."
            type="info"
            showIcon
            style={{ marginTop: "16px" }}
          />
        )}

        {isEditing && (
          <Alert
            title="Editing Rule Type"
            description="Changes will affect all existing rules using this type. The technical name cannot be changed."
            type="warning"
            showIcon
            style={{ marginTop: "16px" }}
          />
        )}
      </Form>
    </Modal>
  );
}
