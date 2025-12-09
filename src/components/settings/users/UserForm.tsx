/**
 * User Form Component
 *
 * Create or edit user
 */

"use client";

import { useEffect } from "react";
import { Modal, Form, Input, Select, Switch, Alert } from "antd";
import { useRuleSets } from "@/lib/hooks/useRuleSets";
import { useTeams } from "@/lib/hooks/useTeams";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UserFormProps {
  open: boolean;
  user?: any;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  loading: boolean;
}

export function UserForm({
  open,
  user,
  onSubmit,
  onCancel,
  loading,
}: UserFormProps) {
  const [form] = Form.useForm();
  const isEditing = !!user;

  // Fetch roles
  const { data: rolesData } = useSWR("/api/roles", fetcher);
  const roles = rolesData?.data || [];

  // Fetch teams
  const { teams } = useTeams({ includeStats: false });

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (open) {
      if (user) {
        form.setFieldsValue({
          fullName: user.fullName,
          email: user.email,
          roleId: user.roleId,
          teamId: user.teamId,
          isActive: user.isActive,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          isActive: true,
        });
      }
    }
  }, [open, user, form]);

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
      title={isEditing ? "Edit User" : "Create New User"}
      open={open}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
      okText={isEditing ? "Update" : "Create"}
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Form.Item
          name="fullName"
          label="Full Name"
          rules={[
            { required: true, message: "Please enter full name" },
            { min: 2, message: "Name must be at least 2 characters" },
            { max: 200, message: "Name must be less than 200 characters" },
          ]}
        >
          <Input placeholder="e.g., John Doe" maxLength={200} />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Please enter email" },
            { type: "email", message: "Please enter a valid email" },
            { max: 255, message: "Email must be less than 255 characters" },
          ]}
        >
          <Input
            type="email"
            placeholder="e.g., john.doe@example.com"
            maxLength={255}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={
            isEditing
              ? "New Password (leave blank to keep current)"
              : "Password"
          }
          rules={
            isEditing
              ? []
              : [
                  { required: true, message: "Please enter password" },
                  { min: 8, message: "Password must be at least 8 characters" },
                ]
          }
        >
          <Input.Password
            placeholder={
              isEditing
                ? "Leave blank to keep current password"
                : "Enter password"
            }
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          name="roleId"
          label="Role"
          rules={[{ required: true, message: "Please select a role" }]}
        >
          <Select placeholder="Select role">
            {roles.map((role: any) => (
              <Select.Option key={role.id} value={role.id}>
                {role.displayName}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="teamId" label="Team">
          <Select placeholder="Select team (optional)" allowClear>
            {teams.map((team: any) => (
              <Select.Option key={team.id} value={team.id}>
                {team.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="isActive"
          label="Active Status"
          valuePropName="checked"
        >
          <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
        </Form.Item>

        {!isEditing && (
          <Alert
            title="Default Password"
            description="Make sure to use a strong password. Users can change their password after logging in."
            type="info"
            showIcon
            style={{ marginTop: "16px" }}
          />
        )}
      </Form>
    </Modal>
  );
}
