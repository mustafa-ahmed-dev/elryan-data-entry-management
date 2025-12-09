/**
 * Permission Audit Log Component
 * Display permission change history with filtering
 */

"use client";

import { useState } from "react";
import {
  Table,
  Space,
  Tag,
  Button,
  DatePicker,
  Input,
  Select,
  Card,
  message,
} from "antd";
import {
  DownloadOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  usePermissionAudit,
  useExportAuditLog,
} from "@/lib/hooks/usePermissionAudit";
import type { PermissionAuditLog } from "@/lib/types/auth";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

export function PermissionAuditLogComponent() {
  const [filters, setFilters] = useState<any>({
    limit: 100,
  });

  const { logs, count, isLoading, refresh, note } = usePermissionAudit(filters);
  const { exportLogs, isExporting } = useExportAuditLog();

  // Handle export
  const handleExport = async () => {
    if (logs.length === 0) {
      message.warning("No logs to export");
      return;
    }

    const result = await exportLogs(logs);
    if (result.success) {
      message.success("Audit log exported successfully");
    } else {
      message.error(result.error || "Failed to export logs");
    }
  };

  // Handle date range change
  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      setFilters({
        ...filters,
        startDate: dates[0].toDate(),
        endDate: dates[1].toDate(),
      });
    } else {
      const { startDate, endDate, ...rest } = filters;
      setFilters(rest);
    }
  };

  // Handle resource type filter
  const handleResourceTypeChange = (value: string) => {
    if (value) {
      setFilters({ ...filters, resourceType: value });
    } else {
      const { resourceType, ...rest } = filters;
      setFilters(rest);
    }
  };

  // Table columns
  const columns: ColumnsType<PermissionAuditLog> = [
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 180,
      render: (date: Date) => dayjs(date).format("YYYY-MM-DD HH:mm:ss"),
      sorter: (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: "User",
      dataIndex: "userName",
      key: "userName",
      width: 150,
      render: (name: string, record: PermissionAuditLog) => (
        <div>
          <div>{name}</div>
          <div style={{ fontSize: 12, color: "#999" }}>{record.userEmail}</div>
        </div>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: 100,
      render: (action: string) => {
        const colors: Record<string, string> = {
          granted: "green",
          revoked: "red",
          updated: "blue",
          created: "cyan",
          deleted: "volcano",
        };
        return <Tag color={colors[action] || "default"}>{action}</Tag>;
      },
      filters: [
        { text: "Granted", value: "granted" },
        { text: "Revoked", value: "revoked" },
        { text: "Updated", value: "updated" },
        { text: "Created", value: "created" },
        { text: "Deleted", value: "deleted" },
      ],
      onFilter: (value, record) => record.action === value,
    },
    {
      title: "Resource",
      dataIndex: "resourceType",
      key: "resourceType",
      width: 120,
    },
    {
      title: "Action Type",
      dataIndex: "resourceAction",
      key: "resourceAction",
      width: 120,
    },
    {
      title: "Role",
      dataIndex: "roleName",
      key: "roleName",
      width: 120,
      render: (name: string) => name || "-",
    },
    {
      title: "Target User",
      dataIndex: "targetUserName",
      key: "targetUserName",
      width: 150,
      render: (name: string) => name || "-",
    },
    {
      title: "Changes",
      key: "changes",
      width: 200,
      render: (_, record: PermissionAuditLog) => {
        if (!record.oldValue && !record.newValue) return "-";

        return (
          <div style={{ fontSize: 12 }}>
            {record.oldValue && (
              <div>
                <span style={{ color: "#999" }}>Old: </span>
                {JSON.stringify(record.oldValue)}
              </div>
            )}
            {record.newValue && (
              <div>
                <span style={{ color: "#999" }}>New: </span>
                {JSON.stringify(record.newValue)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "IP Address",
      dataIndex: "ipAddress",
      key: "ipAddress",
      width: 130,
      render: (ip: string) => ip || "-",
    },
  ];

  return (
    <Card>
      {/* Filters */}
      <Space
        style={{
          marginBottom: 16,
          width: "100%",
          justifyContent: "space-between",
        }}
        wrap
      >
        <Space wrap>
          <RangePicker
            onChange={handleDateRangeChange}
            style={{ width: 300 }}
          />

          <Select
            placeholder="Filter by resource"
            allowClear
            onChange={handleResourceTypeChange}
            style={{ width: 200 }}
            options={[
              { value: "users", label: "Users" },
              { value: "teams", label: "Teams" },
              { value: "entries", label: "Entries" },
              { value: "evaluations", label: "Evaluations" },
              { value: "schedules", label: "Schedules" },
              { value: "reports", label: "Reports" },
              { value: "settings", label: "Settings" },
            ]}
          />

          <Button icon={<SearchOutlined />} onClick={refresh}>
            Search
          </Button>
        </Space>

        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={isExporting}
            disabled={logs.length === 0}
          >
            Export CSV
          </Button>
          <Button icon={<ReloadOutlined />} onClick={refresh}>
            Refresh
          </Button>
        </Space>
      </Space>

      {/* Note about implementation */}
      {note && (
        <div style={{ marginBottom: 16 }}>
          <Tag color="warning">{note}</Tag>
        </div>
      )}

      {/* Table */}
      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={isLoading}
        pagination={{
          total: count,
          pageSize: filters.limit || 100,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} records`,
        }}
        scroll={{ x: 1400 }}
      />
    </Card>
  );
}
