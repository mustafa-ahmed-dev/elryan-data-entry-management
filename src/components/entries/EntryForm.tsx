"use client";

import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  Switch,
  DatePicker,
  Button,
  message,
  Card,
  Space,
  Row,
  Col,
} from "antd";
import { SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { TextArea } = Input;

interface EntryType {
  id: number;
  name: string;
}

interface EntryFormProps {
  employeeId: number;
  onSuccess?: () => void;
}

export function EntryForm({ employeeId, onSuccess }: EntryFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [entryTypes, setEntryTypes] = useState<EntryType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Fetch entry types
  useEffect(() => {
    fetchEntryTypes();
  }, []);

  const fetchEntryTypes = async () => {
    try {
      setLoadingTypes(true);
      const response = await fetch("/api/entry-types");
      if (!response.ok) throw new Error("Failed to fetch entry types");
      const result = await response.json();
      // Handle both formats: { data: [...] } or [...]
      setEntryTypes(result.data || result);
    } catch (error) {
      message.error("Failed to load entry types");
      console.error(error);
    } finally {
      setLoadingTypes(false);
    }
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      const entryData = {
        employeeId,
        entryTypeId: values.entryTypeId,
        productName: values.productName,
        productDescription: values.productDescription,
        followsNamingConvention: values.followsNamingConvention ?? true,
        followsSpecificationOrder: values.followsSpecificationOrder ?? true,
        containsUnwantedKeywords: values.containsUnwantedKeywords ?? false,
        entryTime: values.entryTime
          ? values.entryTime.toISOString()
          : new Date().toISOString(),
      };

      const response = await fetch("/api/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entryData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create entry");
      }

      message.success("Entry created successfully!");
      form.resetFields();
      // Reset to default values
      form.setFieldsValue({
        followsNamingConvention: true,
        followsSpecificationOrder: true,
        containsUnwantedKeywords: false,
        entryTime: dayjs(),
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      message.error(error.message || "Failed to create entry");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    form.setFieldsValue({
      followsNamingConvention: true,
      followsSpecificationOrder: true,
      containsUnwantedKeywords: false,
      entryTime: dayjs(),
    });
  };

  return (
    <Card>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          followsNamingConvention: true,
          followsSpecificationOrder: true,
          containsUnwantedKeywords: false,
          entryTime: dayjs(),
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Product Name"
              name="productName"
              rules={[
                { required: true, message: "Please enter product name" },
                {
                  max: 200,
                  message: "Product name must be less than 200 characters",
                },
              ]}
            >
              <Input placeholder="Enter product name" size="large" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Entry Type"
              name="entryTypeId"
              rules={[{ required: true, message: "Please select entry type" }]}
            >
              <Select
                placeholder="Select entry type"
                size="large"
                loading={loadingTypes}
                options={
                  Array.isArray(entryTypes)
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

        <Form.Item
          label="Product Description"
          name="productDescription"
          rules={[
            { required: true, message: "Please enter product description" },
            {
              max: 1000,
              message: "Description must be less than 1000 characters",
            },
          ]}
        >
          <TextArea
            placeholder="Enter product description"
            rows={4}
            showCount
            maxLength={1000}
          />
        </Form.Item>

        <Form.Item label="Entry Time" name="entryTime">
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            size="large"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Card title="Quality Checks" size="small" style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <Form.Item
              label="Follows Naming Convention"
              name="followsNamingConvention"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Follows Specification Order"
              name="followsSpecificationOrder"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label="Contains Unwanted Keywords"
              name="containsUnwantedKeywords"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
              tooltip="Toggle ON if product contains unwanted keywords (this is a negative check)"
            >
              <Switch />
            </Form.Item>
          </Space>
        </Card>

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
