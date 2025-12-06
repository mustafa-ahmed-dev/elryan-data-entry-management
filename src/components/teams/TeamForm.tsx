/**
 * Team Form Component
 *
 * Create or edit team form in a modal
 */

"use client";

import { useEffect } from "react";
import { Modal, Form, Input } from "antd";

interface TeamFormProps {
  open: boolean;
  team?: any;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  loading: boolean;
}

export function TeamForm({
  open,
  team,
  onSubmit,
  onCancel,
  loading,
}: TeamFormProps) {
  const [form] = Form.useForm();
  const isEditing = !!team;

  // Reset form when modal opens/closes or team changes
  useEffect(() => {
    if (open) {
      if (team) {
        form.setFieldsValue({
          name: team.name,
          description: team.description,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, team, form]);

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
      title={isEditing ? "Edit Team" : "Create New Team"}
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
          label="Team Name"
          rules={[
            { required: true, message: "Please enter team name" },
            { min: 2, message: "Name must be at least 2 characters" },
            { max: 100, message: "Name must be less than 100 characters" },
          ]}
        >
          <Input placeholder="e.g., Team Alpha, Sales Team, Development Team" />
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
            placeholder="Brief description of the team's purpose or focus area"
            rows={4}
            showCount
            maxLength={500}
          />
        </Form.Item>

        {isEditing && team.memberCount > 0 && (
          <div
            style={{
              padding: "12px",
              background: "#e6f7ff",
              border: "1px solid #91d5ff",
              borderRadius: "4px",
              marginTop: "16px",
            }}
          >
            <strong>Current Members:</strong> {team.memberCount}
            <br />
            <small style={{ color: "#666" }}>
              To manage team members, go to the Users page and assign/unassign
              users to this team.
            </small>
          </div>
        )}
      </Form>
    </Modal>
  );
}
