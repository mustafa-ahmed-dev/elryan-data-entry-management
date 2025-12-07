/**
 * User Filters Component
 *
 * Filter controls for user management
 */

"use client";

import { useState } from "react";
import { Row, Col, Input, Select, Button, Space } from "antd";
import { SearchOutlined, ClearOutlined } from "@ant-design/icons";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UserFiltersProps {
  onFilterChange: (filters: any) => void;
}

export function UserFilters({ onFilterChange }: UserFiltersProps) {
  const [search, setSearch] = useState("");
  const [roleId, setRoleId] = useState<number | undefined>();
  const [teamId, setTeamId] = useState<number | undefined>();
  const [isActive, setIsActive] = useState<boolean | undefined>();

  // Fetch roles
  const { data: rolesData } = useSWR("/api/roles", fetcher);
  const roles = rolesData?.data || [];

  // Fetch teams
  const { data: teamsData } = useSWR("/api/teams", fetcher);
  const teams = teamsData?.data || [];

  const handleApply = () => {
    onFilterChange({
      search: search || undefined,
      roleId,
      teamId,
      isActive,
    });
  };

  const handleClear = () => {
    setSearch("");
    setRoleId(undefined);
    setTeamId(undefined);
    setIsActive(undefined);
    onFilterChange({});
  };

  return (
    <Row gutter={[16, 16]}>
      {/* Search */}
      <Col xs={24} sm={12} md={8}>
        <Input
          placeholder="Search by name or email..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={handleApply}
          allowClear
        />
      </Col>

      {/* Role Filter */}
      <Col xs={24} sm={12} md={4}>
        <Select
          placeholder="All Roles"
          value={roleId}
          onChange={setRoleId}
          allowClear
          style={{ width: "100%" }}
        >
          {roles.map((role: any) => (
            <Select.Option key={role.id} value={role.id}>
              {role.displayName}
            </Select.Option>
          ))}
        </Select>
      </Col>

      {/* Team Filter */}
      <Col xs={24} sm={12} md={4}>
        <Select
          placeholder="All Teams"
          value={teamId}
          onChange={setTeamId}
          allowClear
          style={{ width: "100%" }}
        >
          {teams.map((team: any) => (
            <Select.Option key={team.id} value={team.id}>
              {team.name}
            </Select.Option>
          ))}
        </Select>
      </Col>

      {/* Status Filter */}
      <Col xs={24} sm={12} md={4}>
        <Select
          placeholder="All Status"
          value={isActive}
          onChange={setIsActive}
          allowClear
          style={{ width: "100%" }}
        >
          <Select.Option value={true}>Active</Select.Option>
          <Select.Option value={false}>Inactive</Select.Option>
        </Select>
      </Col>

      {/* Action Buttons */}
      <Col xs={24} sm={12} md={4}>
        <Space style={{ width: "100%" }}>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleApply}
          >
            Apply
          </Button>
          <Button icon={<ClearOutlined />} onClick={handleClear}>
            Clear
          </Button>
        </Space>
      </Col>
    </Row>
  );
}
