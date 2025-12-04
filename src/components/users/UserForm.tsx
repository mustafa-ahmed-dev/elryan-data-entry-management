/**
 * User Form Component
 *
 * Create or edit user form in a modal
 */

"use client";

import { useEffect } from "react";
import { Modal, Form, Input, Select, Switch, message } from "antd";
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

  // Fetch roles and teams
  const { data: rolesData } = useSWR(open ? "/api/roles" : null, fetcher);
  const { data: teamsData } = useSWR(
    open ? "/api/teams?stats=true" : null,
    fetcher
  );

  const roles = rolesData?.data || [];
  const teams = teamsData?.data || [];

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
          ]}
        >
          <Input placeholder="John Doe" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Please enter email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input placeholder="john.doe@example.com" disabled={isEditing} />
        </Form.Item>

        {!isEditing && (
          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: "Please enter password" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>
        )}

        <Form.Item
          name="roleId"
          label="Role"
          rules={[{ required: true, message: "Please select a role" }]}
        >
          <Select
            placeholder="Select role"
            options={roles.map((role: any) => ({
              label: role.displayName,
              value: role.id,
            }))}
          />
        </Form.Item>

        <Form.Item name="teamId" label="Team">
          <Select
            placeholder="Select team (optional)"
            allowClear
            options={teams.map((team: any) => ({
              label: `${team.name} (${team.memberCount || 0} members)`,
              value: team.id,
            }))}
          />
        </Form.Item>

        <Form.Item name="isActive" label="Status" valuePropName="checked">
          <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
