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
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

interface Entry {
  id: number;
  productName: string;
  productDescription: string;
  employeeName: string;
  employeeEmail: string;
  entryTypeName: string;
  entryTime: string;
  followsNamingConvention: boolean;
  followsSpecificationOrder: boolean;
  containsUnwantedKeywords: boolean;
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
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
  const [entryTypes, setEntryTypes] = useState<EntryType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  // Fetch entry types
  useEffect(() => {
    fetchEntryTypes();
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
  }, [entries, searchText, selectedType, dateRange]);

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

  const applyFilters = () => {
    let filtered = [...entries];

    // Search filter
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.id.toString().includes(search) ||
          entry.productName.toLowerCase().includes(search) ||
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
    setDateRange(null);
  };

  const getQualityIcon = (entry: Entry) => {
    const issues = [
      !entry.followsNamingConvention,
      !entry.followsSpecificationOrder,
      entry.containsUnwantedKeywords,
    ].filter(Boolean).length;

    if (issues === 0) {
      return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
    }
    return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Card
        style={{ flex: 1, display: "flex", flexDirection: "column" }}
        styles={{
          body: {
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: 0,
          },
        }}
      >
        <div style={{ padding: "16px", borderBottom: "1px solid #f0f0f0" }}>
          <Space orientation="vertical" style={{ width: "100%" }} size="middle">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Title level={5} style={{ margin: 0 }}>
                <Badge count={filteredEntries.length} showZero>
                  <span style={{ marginRight: 8 }}>Entries to Evaluate</span>
                </Badge>
              </Title>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                size="small"
                loading={loading}
              >
                Refresh
              </Button>
            </div>

            <Input
              placeholder="Search by ID, product, or employee..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />

            <Collapse
              ghost
              activeKey={filtersCollapsed ? [] : ["filters"]}
              onChange={() => setFiltersCollapsed(!filtersCollapsed)}
              items={[
                {
                  key: "filters",
                  label: (
                    <Space>
                      <FilterOutlined />
                      <Text>Filters</Text>
                      {(selectedType || dateRange) && (
                        <Tag color="blue">
                          {[selectedType, dateRange].filter(Boolean).length}{" "}
                          active
                        </Tag>
                      )}
                    </Space>
                  ),
                  children: (
                    <Space
                      orientation="vertical"
                      style={{ width: "100%" }}
                      size="middle"
                    >
                      <Select
                        placeholder="Filter by entry type"
                        style={{ width: "100%" }}
                        value={selectedType}
                        onChange={setSelectedType}
                        allowClear
                      >
                        {entryTypes.map((type) => (
                          <Select.Option key={type.id} value={type.id}>
                            {type.name}
                          </Select.Option>
                        ))}
                      </Select>

                      <RangePicker
                        style={{ width: "100%" }}
                        value={dateRange}
                        onChange={(dates) =>
                          setDateRange(dates as [Dayjs, Dayjs] | null)
                        }
                      />

                      {(selectedType || dateRange || searchText) && (
                        <Button onClick={clearFilters} size="small" block>
                          Clear All Filters
                        </Button>
                      )}
                    </Space>
                  ),
                },
              ]}
            />
          </Space>
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          {loading && filteredEntries.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <Spin />
            </div>
          ) : filteredEntries.length === 0 ? (
            <Empty
              description="No entries to evaluate"
              style={{ marginTop: "40px" }}
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
                      selectedEntryId === entry.id ? "#e6f7ff" : "transparent",
                    borderLeft:
                      selectedEntryId === entry.id
                        ? "3px solid #1890ff"
                        : "3px solid transparent",
                    transition: "all 0.3s",
                  }}
                  className="entry-list-item"
                >
                  <List.Item.Meta
                    avatar={getQualityIcon(entry)}
                    title={
                      <Space orientation="vertical" size={0}>
                        <Text strong>{entry.productName}</Text>
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

      <style>
        {`
          .entry-list-item:hover {
            background-color: #f5f5f5 !important;
          }
        `}
      </style>
    </div>
  );
};
