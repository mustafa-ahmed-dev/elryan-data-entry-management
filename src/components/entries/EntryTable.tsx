"use client";

import { useState } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Popconfirm,
  message,
  Skeleton,
  Empty,
  Badge,
} from "antd";
import {
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import dayjs from "dayjs";
import { EntryDetail } from "./EntryDetail";

interface Entry {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeEmail: string;
  entryTypeId: number;
  entryTypeName: string;
  productName: string;
  productDescription: string;
  followsNamingConvention: boolean;
  followsSpecificationOrder: boolean;
  containsUnwantedKeywords: boolean;
  entryTime: string;
  hasEvaluation: boolean;
}

interface EntryTableProps {
  entries: Entry[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  onPageChange: (page: number, pageSize: number) => void;
  onDelete?: (id: number) => Promise<void>;
  userRole?: string;
}

export function EntryTable({
  entries,
  loading,
  pagination,
  onPageChange,
  onDelete,
  userRole,
}: EntryTableProps) {
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const isAdmin = userRole === "admin";

  // Calculate quality status
  const getQualityStatus = (entry: Entry) => {
    const issues = [
      !entry.followsNamingConvention,
      !entry.followsSpecificationOrder,
      entry.containsUnwantedKeywords,
    ].filter(Boolean).length;

    if (issues === 0) {
      return { color: "success", text: "All Pass", count: 0 };
    } else if (issues <= 2) {
      return {
        color: "warning",
        text: `${issues} Issue${issues > 1 ? "s" : ""}`,
        count: issues,
      };
    } else {
      return { color: "error", text: "3 Issues", count: 3 };
    }
  };

  const handleDelete = async (id: number) => {
    if (!onDelete) return;

    try {
      setDeleting(id);
      await onDelete(id);
      message.success("Entry deleted successfully");
    } catch (error: any) {
      message.error(error.message || "Failed to delete entry");
    } finally {
      setDeleting(null);
    }
  };

  const handleRowClick = (entry: Entry) => {
    setSelectedEntry(entry);
    setDetailVisible(true);
  };

  const columns: ColumnsType<Entry> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "Product Name",
      dataIndex: "productName",
      key: "productName",
      ellipsis: true,
      sorter: (a, b) => a.productName.localeCompare(b.productName),
    },
    {
      title: "Employee",
      dataIndex: "employeeName",
      key: "employeeName",
      ellipsis: true,
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div style={{ fontSize: "12px", color: "#999" }}>
            {record.employeeEmail}
          </div>
        </div>
      ),
    },
    {
      title: "Entry Type",
      dataIndex: "entryTypeName",
      key: "entryTypeName",
      ellipsis: true,
    },
    {
      title: "Entry Time",
      dataIndex: "entryTime",
      key: "entryTime",
      width: 180,
      sorter: (a, b) => dayjs(a.entryTime).unix() - dayjs(b.entryTime).unix(),
      render: (text) => dayjs(text).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Quality Status",
      key: "qualityStatus",
      width: 130,
      render: (_, record) => {
        const status = getQualityStatus(record);
        return <Badge status={status.color as any} text={status.text} />;
      },
      filters: [
        { text: "All Pass", value: "pass" },
        { text: "Has Issues", value: "issues" },
        { text: "All Fail", value: "fail" },
      ],
      onFilter: (value, record) => {
        const status = getQualityStatus(record);
        if (value === "pass") return status.count === 0;
        if (value === "issues") return status.count > 0 && status.count < 3;
        if (value === "fail") return status.count === 3;
        return true;
      },
    },
    {
      title: "Evaluated",
      dataIndex: "hasEvaluation",
      key: "hasEvaluation",
      width: 110,
      render: (hasEvaluation) =>
        hasEvaluation ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Yes
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="default">
            No
          </Tag>
        ),
      filters: [
        { text: "Evaluated", value: true },
        { text: "Not Evaluated", value: false },
      ],
      onFilter: (value, record) => record.hasEvaluation === value,
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(record);
            }}
          >
            View
          </Button>
          {isAdmin && onDelete && (
            <Popconfirm
              title="Delete Entry"
              description="Are you sure you want to delete this entry?"
              onConfirm={(e) => {
                e?.stopPropagation();
                handleDelete(record.id);
              }}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                loading={deleting === record.id}
                onClick={(e) => e.stopPropagation()}
              >
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (loading && entries.length === 0) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  return (
    <>
      <Table
        columns={columns}
        dataSource={entries}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} entries`,
          pageSizeOptions: ["10", "20", "50", "100"],
        }}
        onChange={(paginationConfig: TablePaginationConfig) => {
          onPageChange(
            paginationConfig.current || 1,
            paginationConfig.pageSize || 10
          );
        }}
        locale={{
          emptyText: (
            <Empty
              description="No entries found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
        scroll={{ x: 1200 }}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          style: { cursor: "pointer" },
        })}
      />

      {selectedEntry && (
        <EntryDetail
          entry={selectedEntry}
          visible={detailVisible}
          onClose={() => {
            setDetailVisible(false);
            setSelectedEntry(null);
          }}
        />
      )}
    </>
  );
}
