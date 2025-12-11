/**
 * Entry Form Component
 *
 * Simplified form for creating entries with only SKU and Entry Type
 */

"use client";

import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  message,
  Select,
  DatePicker,
  Row,
  Col,
} from "antd";
import { SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

interface EntryFormProps {
  entryTypes: Array<{ id: number; name: string }>;
  onSubmit: (values: any) => Promise<void>;
  employeeId: number;
}

export function EntryForm({
  entryTypes,
  onSubmit,
  employeeId,
}: EntryFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Set initial values
  useEffect(() => {
    form.setFieldsValue({
      entryTime: dayjs(),
    });
  }, [form]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      const payload = {
        employeeId,
        entryTypeId: values.entryTypeId,
        sku: values.sku.trim(),
        entryTime: values.entryTime ? values.entryTime.toDate() : new Date(),
      };

      await onSubmit(payload);
      message.success("Entry created successfully!");
      form.resetFields();
      form.setFieldsValue({
        entryTime: dayjs(),
      });
    } catch (error) {
      console.error("Form submission error:", error);
      message.error("Failed to create entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    form.setFieldsValue({
      entryTime: dayjs(),
    });
  };

  return (
    <Card title="Create New Entry" style={{ maxWidth: 800, margin: "0 auto" }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="SKU"
              name="sku"
              rules={[
                { required: true, message: "Please enter SKU" },
                {
                  min: 1,
                  message: "SKU must be at least 1 character",
                },
                {
                  max: 100,
                  message: "SKU must be less than 100 characters",
                },
                {
                  pattern: /^[a-zA-Z0-9-_]+$/,
                  message:
                    "SKU can only contain letters, numbers, hyphens, and underscores",
                },
              ]}
            >
              <Input
                placeholder="Enter SKU (e.g., PRD-12345)"
                size="large"
                maxLength={100}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              label="Entry Type"
              name="entryTypeId"
              rules={[
                { required: true, message: "Please select an entry type" },
              ]}
            >
              <Select
                placeholder="Select entry type"
                size="large"
                showSearch={{ optionFilterProp: "label" }}
                options={
                  entryTypes
                    ? entryTypes.map((type) => ({
                        label: type.name,
                        value: type.id,
                      }))
                    : []
                }
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Entry Time" name="entryTime">
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            size="large"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
              size="large"
            >
              Create Entry
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
              disabled={loading}
              size="large"
            >
              Reset Form
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
