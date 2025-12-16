"use client";

import { useState, useEffect } from "react";
import {
  Input,
  Select,
  DatePicker,
  List,
  Badge,
  Space,
  Typography,
  Card,
  Button,
  Collapse,
  Empty,
  Spin,
  Tag,
  message,
  theme,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BarcodeOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;
const { useToken } = theme;

interface Entry {
  id: number;
  sku: string;
  employeeName: string;
  employeeEmail: string;
  entryTypeName: string;
  entryTime: string;
  hasEvaluation: boolean;
}

interface EntryType {
  id: number;
  name: string;
}

interface EntriesBrowserProps {
  selectedEntryId: number | null;
  onSelectEntry: (entry: Entry) => void;
}

export const EntriesBrowser: React.FC<EntriesBrowserProps> = ({
  selectedEntryId,
  onSelectEntry,
}) => {
  const { token } = useToken();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
  const [entryTypes, setEntryTypes] = useState<EntryType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [employees, setEmployees] = useState<
    Array<{ id: number; name: string; email: string }>
  >([]);

  // Fetch entry types
  useEffect(() => {
    fetchEntryTypes();
    fetchEmployees();
  }, []);

  // Fetch entries on mount and every 30 seconds
  useEffect(() => {
    fetchEntries();
    const interval = setInterval(fetchEntries, 30000);
    return () => clearInterval(interval);
  }, []);

  // Apply filters whenever entries or filter criteria change
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, searchText, selectedType, selectedEmployee, dateRange]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/entries?hasEvaluation=false");
      if (!response.ok) throw new Error("Failed to fetch entries");
      const data = await response.json();

      // Handle different API response formats
      if (Array.isArray(data)) {
        setEntries(data);
      } else if (data && Array.isArray(data.data)) {
        setEntries(data.data);
      } else if (data && Array.isArray(data.entries)) {
        setEntries(data.entries);
      } else {
        console.warn("Unexpected entries response format:", data);
        setEntries([]);
      }
    } catch (error) {
      message.error("Failed to load entries");
      console.error(error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntryTypes = async () => {
    try {
      const response = await fetch("/api/entry-types");
      if (!response.ok) throw new Error("Failed to fetch entry types");
      const data = await response.json();

      // Handle different API response formats
      if (Array.isArray(data)) {
        setEntryTypes(data);
      } else if (data && Array.isArray(data.data)) {
        setEntryTypes(data.data);
      } else if (data && Array.isArray(data.entryTypes)) {
        setEntryTypes(data.entryTypes);
      } else {
        console.warn("Unexpected entry types response format:", data);
        setEntryTypes([]);
      }
    } catch (error) {
      console.error("Failed to load entry types:", error);
      setEntryTypes([]);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();

      // Handle different API response formats
      let usersList = [];
      if (Array.isArray(data)) {
        usersList = data;
      } else if (data && Array.isArray(data.data)) {
        usersList = data.data;
      } else if (data && Array.isArray(data.users)) {
        usersList = data.users;
      }

      setEmployees(
        usersList.map((u: any) => ({
          id: u.id,
          name: u.name || u.fullName,
          email: u.email,
        }))
      );
    } catch (error) {
      console.error("Failed to load employees:", error);
      setEmployees([]);
    }
  };

  const applyFilters = () => {
    if (!Array.isArray(entries)) {
      setFilteredEntries([]);
      return;
    }

    let filtered = [...entries];

    // Search filter (ID, SKU, employee)
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.id.toString().includes(search) ||
          entry.sku.toLowerCase().includes(search) ||
          entry.employeeName.toLowerCase().includes(search) ||
          entry.employeeEmail.toLowerCase().includes(search)
      );
    }

    // Entry type filter
    if (selectedType) {
      filtered = filtered.filter(
        (entry) =>
          entry.entryTypeName ===
          entryTypes.find((t) => t.id === selectedType)?.name
      );
    }

    // Employee filter
    if (selectedEmployee) {
      filtered = filtered.filter(
        (entry) => entry.employeeName === selectedEmployee
      );
    }

    // Date range filter
    if (dateRange) {
      filtered = filtered.filter((entry) => {
        const entryDate = dayjs(entry.entryTime);
        return (
          entryDate.isAfter(dateRange[0]) && entryDate.isBefore(dateRange[1])
        );
      });
    }

    setFilteredEntries(filtered);
  };

  const handleRefresh = () => {
    fetchEntries();
    message.success("Entries refreshed");
  };

  const clearFilters = () => {
    setSearchText("");
    setSelectedType(null);
    setSelectedEmployee(null);
    setDateRange(null);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Card
        title={
          <Space>
            <Title level={5} style={{ margin: 0 }}>
              Unevaluated Entries
            </Title>
            <Badge count={filteredEntries.length} showZero color="blue" />
          </Space>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>
        }
        style={{ height: "100%", display: "flex", flexDirection: "column" }}
        styles={{
          body: {
            padding: 0,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        }}
      >
        {/* Filters */}
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid #f0f0f0",
            flexShrink: 0,
          }}
        >
          <Collapse
            ghost
            activeKey={filtersCollapsed ? [] : ["1"]}
            onChange={(keys) => setFiltersCollapsed(keys.length === 0)}
            items={[
              {
                key: "1",
                label: (
                  <Space>
                    <FilterOutlined />
                    <Text strong>Filters</Text>
                  </Space>
                ),
                children: (
                  <Space
                    orientation="vertical"
                    style={{ width: "100%" }}
                    size="middle"
                  >
                    <Input
                      placeholder="Search by ID, SKU, or employee..."
                      prefix={<SearchOutlined />}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      allowClear
                    />
                    <Select
                      placeholder="Filter by entry type"
                      value={selectedType}
                      onChange={setSelectedType}
                      style={{ width: "100%" }}
                      allowClear
                      options={entryTypes.map((type) => ({
                        label: type.name,
                        value: type.id,
                      }))}
                    />
                    <Select
                      placeholder="Filter by employee"
                      value={selectedEmployee}
                      onChange={setSelectedEmployee}
                      style={{ width: "100%" }}
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      options={employees.map((emp) => ({
                        label: `${emp.name} (${emp.email})`,
                        value: emp.name,
                      }))}
                    />
                    <RangePicker
                      value={dateRange}
                      onChange={(dates) => setDateRange(dates as any)}
                      style={{ width: "100%" }}
                      format="YYYY-MM-DD"
                    />
                    <Button block onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        </div>

        {/* Entries List */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {loading && entries.length === 0 ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "200px",
              }}
            >
              <Spin tip="Loading entries..." />
            </div>
          ) : filteredEntries.length === 0 ? (
            <Empty
              description="No unevaluated entries found"
              style={{ marginTop: "50px" }}
            />
          ) : (
            <List
              dataSource={filteredEntries}
              renderItem={(entry) => (
                <List.Item
                  onClick={() => onSelectEntry(entry)}
                  style={{
                    cursor: "pointer",
                    padding: "12px 16px",
                    backgroundColor:
                      selectedEntryId === entry.id
                        ? token.colorPrimaryBg
                        : "transparent",
                    borderLeft:
                      selectedEntryId === entry.id
                        ? `3px solid ${token.colorPrimary}`
                        : "3px solid transparent",
                    transition: "all 0.3s",
                  }}
                  className="entry-list-item"
                >
                  <List.Item.Meta
                    avatar={
                      entry.hasEvaluation ? (
                        <CheckCircleOutlined
                          style={{ color: "#52c41a", fontSize: 20 }}
                        />
                      ) : (
                        <CloseCircleOutlined
                          style={{ color: "#d9d9d9", fontSize: 20 }}
                        />
                      )
                    }
                    title={
                      <Space orientation="vertical" size={0}>
                        <Space>
                          <BarcodeOutlined />
                          <Text strong>{entry.sku}</Text>
                        </Space>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          ID: {entry.id}
                        </Text>
                      </Space>
                    }
                    description={
                      <Space
                        orientation="vertical"
                        size={2}
                        style={{ width: "100%" }}
                      >
                        <Text style={{ fontSize: "12px" }}>
                          {entry.employeeName}
                        </Text>
                        <Space size={4}>
                          <Tag style={{ fontSize: "11px", margin: 0 }}>
                            {entry.entryTypeName}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: "11px" }}>
                            {dayjs(entry.entryTime).format("MMM D, YYYY")}
                          </Text>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      </Card>

      <style jsx>{`
        .entry-list-item:hover {
          background-color: ${token.colorBgTextHover} !important;
        }
      `}</style>
    </div>
  );
};
