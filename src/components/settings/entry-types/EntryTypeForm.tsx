/**
 * Entry Type Form Component
 *
 * Create or edit entry type
 */

"use client";

import { useEffect } from "react";
import { Modal, Form, Input, Alert } from "antd";

interface EntryTypeFormProps {
  open: boolean;
  entryType?: any;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  loading: boolean;
}

export function EntryTypeForm({
  open,
  entryType,
  onSubmit,
  onCancel,
  loading,
}: EntryTypeFormProps) {
  const [form] = Form.useForm();
  const isEditing = !!entryType;

  // Reset form when modal opens/closes or entryType changes
  useEffect(() => {
    if (open) {
      if (entryType) {
        form.setFieldsValue({
          name: entryType.name,
          description: entryType.description,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, entryType, form]);

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
      title={isEditing ? "Edit Entry Type" : "Create New Entry Type"}
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
          label="Entry Type Name"
          rules={[
            { required: true, message: "Please enter entry type name" },
            { min: 2, message: "Name must be at least 2 characters" },
            { max: 100, message: "Name must be less than 100 characters" },
          ]}
        >
          <Input
            placeholder="e.g., Product Entry, Brand Entry, SKU Update"
            maxLength={100}
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
            placeholder="Describe the purpose of this entry type..."
            rows={4}
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Alert
          title="Entry Type Usage"
          description="Entry types categorize the different kinds of data entries in your system. Employees will select an entry type when creating new entries."
          type="info"
          showIcon
          style={{ marginTop: "16px" }}
        />
      </Form>
    </Modal>
  );
}
