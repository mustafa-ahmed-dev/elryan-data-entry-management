/**
 * Team Filters Component
 *
 * Filter controls for team management
 */

"use client";

import { useState } from "react";
import { Row, Col, Input, Select, Button, Space } from "antd";
import { SearchOutlined, ClearOutlined } from "@ant-design/icons";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TeamFiltersProps {
  onFilterChange: (filters: any) => void;
}

export function TeamFilters({ onFilterChange }: TeamFiltersProps) {
  const [search, setSearch] = useState("");
  const [leaderId, setLeaderId] = useState<number | undefined>();

  // Fetch team leaders for filter
  const { data: usersData } = useSWR("/api/users?roleId=2,3", fetcher);
  const teamLeaders = usersData?.data || [];

  const handleApply = () => {
    const filters: any = {};

    if (search) filters.search = search;
    if (leaderId !== undefined) filters.leaderId = leaderId;

    onFilterChange(filters);
  };

  const handleClear = () => {
    setSearch("");
    setLeaderId(undefined);
    onFilterChange({});
  };

  return (
    <Row gutter={[16, 16]}>
      {/* Search */}
      <Col xs={24} sm={12} md={10}>
        <Input
          placeholder="Search by team name..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={handleApply}
          allowClear
        />
      </Col>

      {/* Team Leader Filter */}
      <Col xs={24} sm={12} md={8}>
        <Select
          placeholder="All Team Leaders"
          value={leaderId}
          onChange={setLeaderId}
          allowClear
          style={{ width: "100%" }}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
        >
          {teamLeaders.map((user: any) => (
            <Select.Option key={user.id} value={user.id} label={user.fullName}>
              {user.fullName}
            </Select.Option>
          ))}
        </Select>
      </Col>

      {/* Action Buttons */}
      <Col xs={24} sm={12} md={6}>
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
