/**
 * Team Form Component
 *
 * Form for creating and editing teams
 */

"use client";

import { useEffect } from "react";
import { Modal, Form, Input, Select, Space, Alert } from "antd";
import { TeamOutlined, CrownOutlined } from "@ant-design/icons";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TeamFormProps {
  open: boolean;
  team?: any;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function TeamForm({
  open,
  team,
  onSubmit,
  onCancel,
  loading = false,
}: TeamFormProps) {
  const [form] = Form.useForm();

  // Fetch users for team leader selection (only team leaders and admins)
  const { data: usersData } = useSWR(
    "/api/users?roleId=2,3", // Team leaders and admins
    fetcher
  );
  const teamLeaders = usersData?.data || [];

  // Set form values when editing
  useEffect(() => {
    if (team) {
      form.setFieldsValue({
        name: team.name,
        description: team.description,
        leaderId: team.leaderId,
      });
    } else {
      form.resetFields();
    }
  }, [team, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={team ? "Edit Team" : "Create New Team"}
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={600}
      okText={team ? "Update" : "Create"}
    >
      <Form form={form} layout="vertical">
        {/* Team Name */}
        <Form.Item
          name="name"
          label="Team Name"
          rules={[
            { required: true, message: "Please enter team name" },
            { min: 3, message: "Name must be at least 3 characters" },
          ]}
        >
          <Input
            prefix={<TeamOutlined />}
            placeholder="Enter team name"
            size="large"
          />
        </Form.Item>

        {/* Description */}
        <Form.Item
          name="description"
          label="Description (Optional)"
          rules={[{ max: 500, message: "Description too long" }]}
        >
          <Input.TextArea
            placeholder="Enter team description"
            rows={3}
            showCount
            maxLength={500}
          />
        </Form.Item>

        {/* Team Leader */}
        <Form.Item name="leaderId" label="Team Leader (Optional)">
          <Select
            placeholder="Select team leader"
            size="large"
            allowClear
            loading={!teamLeaders.length}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          >
            {teamLeaders.map((user: any) => (
              <Select.Option
                key={user.id}
                value={user.id}
                label={user.fullName}
              >
                <Space>
                  <CrownOutlined style={{ color: "#faad14" }} />
                  <span>{user.fullName}</span>
                  <span style={{ color: "#999", fontSize: "12px" }}>
                    ({user.roleName?.replace("_", " ")})
                  </span>
                </Space>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {team && (
          <Alert
            title="Team Leader Change"
            description="Changing the team leader will update all associated schedules and permissions."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
      </Form>
    </Modal>
  );
}
