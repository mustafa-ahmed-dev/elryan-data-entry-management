/**
 * User Filters Component
 *
 * Search and filter users
 */

"use client";

import { Form, Input, Select, Button, Row, Col, Space } from "antd";
import { SearchOutlined, ClearOutlined } from "@ant-design/icons";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UserFiltersProps {
  onFilterChange: (filters: any) => void;
}

export function UserFilters({ onFilterChange }: UserFiltersProps) {
  const [form] = Form.useForm();

  // Fetch roles and teams for filter options
  const { data: rolesData } = useSWR("/api/roles", fetcher);
  const { data: teamsData } = useSWR("/api/teams?stats=true", fetcher);

  const roles = rolesData?.data || [];
  const teams = teamsData?.data || [];

  const handleSearch = (values: any) => {
    // Remove empty values
    const filters = Object.entries(values).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    onFilterChange(filters);
  };

  const handleReset = () => {
    form.resetFields();
    onFilterChange({});
  };

  return (
    <Form form={form} onFinish={handleSearch} layout="vertical">
      <Row gutter={16}>
        <Col xs={24} sm={12} md={8}>
          <Form.Item name="search" label="Search">
            <Input
              placeholder="Search by name or email"
              prefix={<SearchOutlined />}
              allowClear
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Form.Item name="roleId" label="Role">
            <Select
              placeholder="All roles"
              allowClear
              options={roles.map((role: any) => ({
                label: role.displayName,
                value: role.id,
              }))}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Form.Item name="teamId" label="Team">
            <Select
              placeholder="All teams"
              allowClear
              options={teams.map((team: any) => ({
                label: team.name,
                value: team.id,
              }))}
            />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Form.Item name="isActive" label="Status">
            <Select
              placeholder="All statuses"
              allowClear
              options={[
                { label: "Active", value: true },
                { label: "Inactive", value: false },
              ]}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={16}>
          <Form.Item label=" ">
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SearchOutlined />}
              >
                Search
              </Button>
              <Button onClick={handleReset} icon={<ClearOutlined />}>
                Clear
              </Button>
            </Space>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
